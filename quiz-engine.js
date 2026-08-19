(function () {
  "use strict";

  var dataEl = document.getElementById("quiz-data");
  if (!dataEl) return;
  var quizData = JSON.parse(dataEl.textContent);
  var questions = quizData.questions;
  var results = quizData.results;
  var totalQuestions = questions.length;

  var quizApp = document.getElementById("quiz-app");
  var resultsApp = document.getElementById("results-app");
  var allResultsSection = document.getElementById("all-results");

  quizApp.setAttribute("aria-live", "polite");

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    reducedMotion = false;
  }

  var state = {
    index: 0,
    answers: new Array(totalQuestions).fill(null),
    locked: false,
    lastBarPercent: 0,
    justAnsweredIndex: null,
  };

  function resultIds() {
    return Object.keys(results);
  }

  function buzz(ms) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) { /* ignore */ }
    }
  }

  // --------------------------------------------------------------------
  // Sound — procedural oscillators, default OFF, never prompts twice.
  // `ctx` is only ever constructed inside ensureAudio(), and ensureAudio()
  // is only ever called from the sound-toggle's own click handler (a real
  // user gesture). tone() deliberately does NOT call ensureAudio() itself:
  // an AudioContext created outside a gesture (e.g. from a setTimeout in
  // the reveal sequence) is born suspended and stays silent, so tone()
  // just no-ops via the `!ctx` check when sound was never enabled.
  // --------------------------------------------------------------------

  var ctx = null;

  function getSoundPref() {
    try { return localStorage.getItem("vq_sound"); } catch (e) { return null; }
  }

  function setSoundPref(v) {
    try { localStorage.setItem("vq_sound", v); } catch (e) { /* ignore */ }
  }

  function isSoundOn() {
    return getSoundPref() === "on";
  }

  function ensureAudio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") {
      try { ctx.resume(); } catch (e) { /* ignore */ }
    }
    return ctx;
  }

  function tone(freq, durationMs, type, gainPeak) {
    if (!ctx || !isSoundOn()) return;
    type = type || "sine";
    gainPeak = gainPeak === undefined ? 0.06 : gainPeak;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  function playRevealSound() {
    tone(220, 120, "sine");
    setTimeout(function () { tone(440, 160, "sine"); }, 100);
    setTimeout(function () { tone(880, 220, "triangle", 0.05); }, 240);
  }

  // --------------------------------------------------------------------
  // Question rendering
  // --------------------------------------------------------------------

  function renderQuestion(idx) {
    var q = questions[idx];
    var progressLabel = String(idx + 1).padStart(2, "0");
    var totalLabel = String(totalQuestions).padStart(2, "0");
    var dotCount = Math.min(totalQuestions, 12);
    var barPercent = (idx / totalQuestions) * 100;

    var dotsHtml = "";
    for (var d = 0; d < dotCount; d++) {
      var filled = state.answers[d] !== null || d < idx;
      var justFilled = filled && d === state.justAnsweredIndex;
      var cls = (filled ? "filled" : "") + (justFilled ? " just-filled" : "");
      dotsHtml += '<span class="' + cls + '"></span>';
    }
    state.justAnsweredIndex = null;

    var optionsHtml = "";
    q.options.forEach(function (opt, i) {
      var isSelected = state.answers[idx] && state.answers[idx].optionIndex === i;
      optionsHtml +=
        '<button type="button" class="answer-tile' + (isSelected ? " is-selected" : "") + '" data-option-index="' + i + '">' +
        escapeHtml(opt.text) +
        "</button>";
    });

    // Sound control shows once, on the first question only, and only while
    // the user has not yet decided (localStorage key absent). Once a choice
    // exists — including across a retake's renderQuestion(0) — it never
    // reappears, matching "never prompt twice."
    var soundToggleHtml = "";
    if (idx === 0 && getSoundPref() === null) {
      soundToggleHtml = '<button type="button" class="sound-toggle" aria-pressed="false">SOUND OFF</button>';
    }

    quizApp.innerHTML =
      '<div class="quiz-topbar">' +
      '<div class="q-counter">' +
      '<span class="q-counter-track"><span class="q-counter-digit">' + progressLabel + "</span></span>" +
      '<span class="q-counter-total">/ ' + totalLabel + "</span>" +
      "</div>" +
      '<div class="quiz-topbar-right">' +
      '<button type="button" class="quiz-back"' + (idx === 0 ? " hidden" : "") + '>← back</button>' +
      soundToggleHtml +
      "</div>" +
      "</div>" +
      '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + barPercent + '%"></div></div>' +
      '<div class="dot-trail">' + dotsHtml + "</div>" +
      '<div class="question-card is-entered">' +
      '<div class="question-text">' + escapeHtml(q.text) + "</div>" +
      '<div class="options">' + optionsHtml + "</div>" +
      "</div>";

    state.lastBarPercent = barPercent;

    quizApp.querySelector(".quiz-back").addEventListener("click", function () {
      if (state.locked || idx === 0) return;
      renderQuestion(idx - 1);
    });

    var soundBtn = quizApp.querySelector(".sound-toggle");
    if (soundBtn) {
      soundBtn.addEventListener("click", function () {
        ensureAudio(); // gesture-created here — never from a timer or on load
        setSoundPref("on");
        soundBtn.textContent = "SOUND ON";
        soundBtn.setAttribute("aria-pressed", "true");
        tone(660, 90, "sine", 0.05);
      });
    }

    var optionEls = quizApp.querySelectorAll(".answer-tile");
    optionEls.forEach(function (el) {
      el.addEventListener("pointerdown", function () {
        if (state.locked || reducedMotion) return;
        el.classList.add("is-pressing");
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
        el.addEventListener(evt, function () {
          el.classList.remove("is-pressing");
        });
      });
      el.addEventListener("click", function () {
        if (state.locked) return;
        handleAnswer(idx, parseInt(el.getAttribute("data-option-index"), 10), el, optionEls);
      });
    });
  }

  function rollCounter(nextIdx) {
    var track = quizApp.querySelector(".q-counter-track");
    if (!track) return;
    var nextLabel = String(nextIdx + 1).padStart(2, "0");
    var nextDigit = document.createElement("span");
    nextDigit.className = "q-counter-digit q-counter-next";
    nextDigit.textContent = nextLabel;
    track.appendChild(nextDigit);
    // Force reflow so the roll transition actually plays.
    void track.offsetWidth;
    track.classList.add("is-rolling");
  }

  function animateProgressBar(previousPercent, targetPercent) {
    var fill = quizApp.querySelector(".progress-bar-fill");
    if (!fill) return;
    if (reducedMotion || typeof fill.animate !== "function") {
      fill.style.width = targetPercent + "%";
      return;
    }
    fill.animate(
      [
        { width: previousPercent + "%" },
        { width: Math.min(100, targetPercent + 2) + "%", offset: 0.7 },
        { width: targetPercent + "%" },
      ],
      { duration: 250, easing: "ease-out", fill: "forwards" }
    );
  }

  function handleAnswer(idx, optionIndex, el, optionEls) {
    state.locked = true;
    state.answers[idx] = { optionIndex: optionIndex, weights: questions[idx].options[optionIndex].weights };
    state.justAnsweredIndex = idx;

    buzz(8);
    tone(520 + optionIndex * 40, 55, "sine", 0.05);
    if ((idx + 1) % 4 === 0) tone(660, 70, "triangle", 0.04);

    var isLastQuestion = idx + 1 >= totalQuestions;
    var nextTargetPercent = ((idx + 1) / totalQuestions) * 100;

    if (reducedMotion) {
      // No drift, no overshoot — commit the answer and advance immediately.
      el.classList.add("is-selected");
      if (isLastQuestion) {
        showResult(null, { showTakeQuizButton: false, animate: true });
      } else {
        renderQuestion(idx + 1);
        state.locked = false;
      }
      return;
    }

    // 0ms — select the tile (its own transition supplies the overshoot),
    // dismiss the roll/bar feedback for "you did something" right away.
    el.classList.remove("is-pressing");
    el.classList.add("is-selected");
    if (!isLastQuestion) rollCounter(idx + 1);
    animateProgressBar(state.lastBarPercent, nextTargetPercent);

    // 250ms — siblings fade
    setTimeout(function () {
      optionEls.forEach(function (o) {
        if (o !== el) o.classList.add("is-dismissed");
      });
    }, 250);

    // 350ms — selected tile expands toward centre, question card leaves
    setTimeout(function () {
      el.classList.add("is-expanding");
      var card = quizApp.querySelector(".question-card");
      if (card) {
        card.classList.remove("is-entered");
        card.classList.add("is-leaving");
      }
    }, 350);

    // 500ms — next question card enters, or (last question) pause once
    // more before the result screen.
    setTimeout(function () {
      if (!isLastQuestion) {
        renderQuestion(idx + 1);
        var nextCard = quizApp.querySelector(".question-card");
        if (nextCard) {
          nextCard.classList.remove("is-entered");
          nextCard.classList.add("is-entering");
          void nextCard.offsetWidth;
          requestAnimationFrame(function () {
            nextCard.classList.remove("is-entering");
            nextCard.classList.add("is-entered");
          });
        }
        state.locked = false;
      } else {
        setTimeout(function () {
          showResult(null, { showTakeQuizButton: false, animate: true });
        }, 200);
      }
    }, 500);
  }

  // --------------------------------------------------------------------
  // Scoring
  // --------------------------------------------------------------------

  function computeScores() {
    var scores = {};
    var earliestQuestion = {};
    var maxSingleWeight = {};

    resultIds().forEach(function (rid) { scores[rid] = 0; });

    state.answers.forEach(function (ans, qi) {
      if (!ans) return;
      var weights = ans.weights;
      Object.keys(weights).forEach(function (rid) {
        var w = weights[rid];
        scores[rid] = (scores[rid] || 0) + w;
        if (!(rid in earliestQuestion)) earliestQuestion[rid] = qi;
        if (!(rid in maxSingleWeight) || w > maxSingleWeight[rid]) maxSingleWeight[rid] = w;
      });
    });

    return { scores: scores, earliestQuestion: earliestQuestion, maxSingleWeight: maxSingleWeight };
  }

  function pickWinner(scores, earliestQuestion, maxSingleWeight) {
    var ids = resultIds();
    var maxScore = Math.max.apply(null, ids.map(function (rid) { return scores[rid]; }));
    var candidates = ids.filter(function (rid) { return scores[rid] === maxScore; });
    if (candidates.length === 1) return candidates[0];

    var minEarliest = Math.min.apply(null, candidates.map(function (rid) {
      return rid in earliestQuestion ? earliestQuestion[rid] : Infinity;
    }));
    var c2 = candidates.filter(function (rid) {
      return (rid in earliestQuestion ? earliestQuestion[rid] : Infinity) === minEarliest;
    });
    if (c2.length === 1) return c2[0];

    var maxW = Math.max.apply(null, c2.map(function (rid) {
      return rid in maxSingleWeight ? maxSingleWeight[rid] : 0;
    }));
    var c3 = c2.filter(function (rid) {
      return (rid in maxSingleWeight ? maxSingleWeight[rid] : 0) === maxW;
    });
    if (c3.length === 1) return c3[0];

    // Final fallback: alphabetical by result id (never config array order).
    c3.sort();
    return c3[0];
  }

  // --------------------------------------------------------------------
  // Result rendering
  // --------------------------------------------------------------------

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    var minStr = minutes < 10 ? "0" + minutes : String(minutes);
    return hours + ":" + minStr + " " + ampm;
  }

  function fullDescriptionFor(rid) {
    var el = document.getElementById("ar-desc-" + rid);
    return el ? el.textContent : "";
  }

  function getResultParam() {
    try {
      return new URLSearchParams(window.location.search).get("r");
    } catch (e) {
      return null;
    }
  }

  function updateUrlWithResult(winnerId) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("r", winnerId);
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      // Unsupported environment — sharing still works via the URL already
      // in the address bar, just without the ?r= param appended.
    }
  }

  function urlWithoutResultParam() {
    return window.location.pathname;
  }

  function boldFirstSentence(text) {
    var match = text.match(/^([\s\S]*?[.!?])(\s*)([\s\S]*)$/);
    if (!match) return escapeHtml(text);
    var first = match[1];
    var rest = match[3];
    return "<strong>" + escapeHtml(first) + "</strong>" + (rest ? " " + escapeHtml(rest) : "");
  }

  function playReveal(winnerId, winner) {
    var palette = winner.palette;
    return new Promise(function (resolve) {
      resultsApp.innerHTML =
        '<div class="reveal-card" style="--p1:' + palette.bg[0] + ";--p2:" + palette.bg[1] + ";--p3:" + palette.bg[2] + '">' +
        '<div class="reveal-card-back"><span class="reveal-label">YOUR VIBE</span></div>' +
        '<div class="reveal-card-face"><span class="reveal-eyebrow">APPARENTLY, YOU\'RE</span><span class="reveal-name">' + escapeHtml(winner.name) + "</span></div>" +
        "</div>" +
        '<div class="reveal-flash"></div>';
      quizApp.setAttribute("hidden", "");
      resultsApp.removeAttribute("hidden");
      window.scrollTo(0, 0);

      var card = resultsApp.querySelector(".reveal-card");
      var flash = resultsApp.querySelector(".reveal-flash");

      // 300ms — card fades in and starts its idle wobble (3 cycles x 220ms = 660ms, ending at 960ms)
      setTimeout(function () {
        card.classList.add("is-visible");
      }, 300);

      // 960ms — flip begins; the lift (scale 1 -> 1.05 -> 1) rides alongside
      // the rotateY transition via a separate WAAPI keyframe, per spec.
      setTimeout(function () {
        card.classList.add("is-flipping");
        if (typeof card.animate === "function") {
          card.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.05)", offset: 0.5 }, { transform: "scale(1)" }],
            { duration: 440, easing: "cubic-bezier(.4,.1,.3,1)" }
          );
        }
      }, 960);

      // 1180ms — midpoint: haptic + sound + flash fire together
      setTimeout(function () {
        buzz(18);
        playRevealSound();
        flash.classList.add("is-flashing");
      }, 1180);

      // ~1500ms — hand back to showResult() to swap in the final result markup
      setTimeout(resolve, 1500);
    });
  }

  function renderResultMarkup(winnerId, computed, opts) {
    opts = opts || {};
    var showTakeQuizButton = !!opts.showTakeQuizButton;

    var winnerScore = computed.scores[winnerId] || 1;

    var top4 = resultIds()
      .slice()
      .sort(function (a, b) { return computed.scores[b] - computed.scores[a]; })
      .slice(0, 4);

    var winner = results[winnerId];
    var palette = winner.palette;

    var takeQuizHtml = "";
    if (showTakeQuizButton) {
      takeQuizHtml =
        '<button type="button" class="take-quiz-yourself-btn" style="' +
        "display:block;width:100%;background:var(--ink);color:var(--bg);" +
        "font-family:'Inter',sans-serif;font-size:12px;letter-spacing:0.08em;" +
        "text-transform:uppercase;padding:12px 20px;border:none;cursor:pointer;" +
        '">TAKE THE QUIZ YOURSELF →</button>';
    }

    var moodboardHtml =
      '<div class="moodboard texture-' + palette.texture + '">' +
      '<div class="moodboard-color" style="left:0;width:45%;background:' + palette.bg[0] + '"></div>' +
      '<div class="moodboard-color" style="left:35%;width:30%;background:' + palette.bg[1] + '"></div>' +
      '<div class="moodboard-color" style="left:60%;width:25%;background:' + palette.bg[2] + '"></div>' +
      '<div class="moodboard-dots">' +
      '<span style="background:' + palette.bg[0] + '"></span>' +
      '<span style="background:' + palette.bg[1] + '"></span>' +
      '<span style="background:' + palette.bg[2] + '"></span>' +
      "</div>" +
      '<div class="moodboard-text">' +
      '<div class="moodboard-label" style="color:' + palette.tag + '">APPARENTLY, YOU\'RE</div>' +
      '<div class="moodboard-name" style="color:' + palette.text + '">' + escapeHtml(winner.name) + "</div>" +
      "</div>" +
      "</div>";

    var fragmentsHtml =
      '<div class="vibe-fragments">' +
      '<div class="vibe-fragments-heading">YOU PROBABLY...</div>' +
      winner.fragments.map(function (f) { return '<div class="fragment-line">' + escapeHtml(f) + "</div>"; }).join("") +
      "</div>";

    var verdictHtml = '<p class="result-verdict">' + boldFirstSentence(winner.verdict) + "</p>";

    var tagsHtml =
      '<div class="signal-tags">' +
      winner.signals.map(function (s) {
        return '<span class="signal-tag">' + winner.emoji + " " + escapeHtml(s) + "</span>";
      }).join("") +
      "</div>";

    // Hardcoded placeholder — replace with real per-result percentages later.
    var rarityHtml = '<p class="result-rarity">Top result for 1 in 10 people</p>';

    var breakdownHtml =
      '<div class="score-breakdown">' +
      '<div class="score-breakdown-heading">YOUR VIBE BREAKDOWN</div>' +
      top4.map(function (rid) {
        var pct = Math.round((computed.scores[rid] / winnerScore) * 100);
        var isWinner = rid === winnerId;
        return (
          '<div class="score-row' + (isWinner ? " winner" : "") + '">' +
          '<div class="score-row-top">' +
          '<span class="score-row-name">' + escapeHtml(results[rid].name) + "</span>" +
          '<span class="score-row-pct">' + pct + "%</span>" +
          "</div>" +
          '<div class="score-bar-track"><div class="score-bar-fill" style="width:' + pct + '%"></div></div>' +
          "</div>"
        );
      }).join("") +
      "</div>";

    var descriptionHtml = '<div class="result-description"><p>' + escapeHtml(fullDescriptionFor(winnerId)) + "</p></div>";

    var actionRowHtml =
      '<div class="action-row">' +
      '<button type="button" class="btn-share">SHOW THEM WHO I AM →</button>' +
      '<button type="button" class="btn-retake">RETAKE</button>' +
      '<button type="button" class="btn-all-results">ALL VIBES</button>' +
      "</div>";

    var footerHtml = '<div class="result-footer">analyzed at ' + formatTime(new Date()) + "</div>";

    resultsApp.innerHTML =
      '<div class="result-screen active" id="result-' + winnerId + '">' +
      takeQuizHtml + moodboardHtml + verdictHtml + tagsHtml + rarityHtml + actionRowHtml + fragmentsHtml + breakdownHtml + descriptionHtml + footerHtml +
      "</div>";

    quizApp.setAttribute("hidden", "");
    resultsApp.removeAttribute("hidden");

    wireResultActions(winnerId, winner.name);

    window.scrollTo(0, 0);
  }

  function showResult(forcedWinnerId, opts) {
    opts = opts || {};

    var computed = computeScores();
    var winnerId;
    if (forcedWinnerId && forcedWinnerId in results) {
      winnerId = forcedWinnerId;
      // Direct-link view has no real answers behind it, so there's nothing
      // to compute a breakdown from — give the requested result full marks
      // so it renders as the clear winner instead of a meaningless all-zero tie.
      if (!computed.scores[winnerId]) computed.scores[winnerId] = 1;
    } else {
      winnerId = pickWinner(computed.scores, computed.earliestQuestion, computed.maxSingleWeight);
    }

    var winner = results[winnerId];

    // Shared links (?r=) skip the reveal entirely — the visitor didn't
    // answer anything, so a 1.9s payoff animation for a result they didn't
    // earn would just be confusing and slow. Instant render, no haptic,
    // no sound, no URL rewrite (the URL already has ?r= in it).
    if (forcedWinnerId) {
      renderResultMarkup(winnerId, computed, opts);
      return;
    }

    updateUrlWithResult(winnerId);

    // Real completion (first run or a retake) without the visual flip:
    // reduced-motion skips the animation but still fires haptic + sound —
    // motion sensitivity and audio preference are unrelated settings.
    if (!opts.animate || reducedMotion) {
      buzz(18);
      playRevealSound();
      renderResultMarkup(winnerId, computed, opts);
      return;
    }

    playReveal(winnerId, winner).then(function () {
      renderResultMarkup(winnerId, computed, opts);
    });
  }

  function wireResultActions(winnerId, winnerName) {
    var shareBtn = resultsApp.querySelector(".btn-share");
    var retakeBtn = resultsApp.querySelector(".btn-retake");
    var allResultsBtn = resultsApp.querySelector(".btn-all-results");
    var takeQuizBtn = resultsApp.querySelector(".take-quiz-yourself-btn");

    shareBtn.addEventListener("click", function () {
      var shareUrl = location.origin + location.pathname + "?r=" + encodeURIComponent(winnerId);
      var shareData = {
        title: "My Vibe",
        text: "Apparently I'm " + winnerName + ". What are you? vibequiz.online/" + quizData.slug + "/index.html?r=" + winnerId,
        url: shareUrl,
      };
      var original = shareBtn.textContent;

      function showCopiedFeedback() {
        shareBtn.textContent = "COPIED TO YOUR WORLD ✓";
        setTimeout(function () { shareBtn.textContent = original; }, 2000);
      }

      if (navigator.share) {
        navigator.share(shareData).then(showCopiedFeedback).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareData.url).then(showCopiedFeedback).catch(function () {});
      }
    });

    retakeBtn.addEventListener("click", function () {
      state.index = 0;
      state.answers = new Array(totalQuestions).fill(null);
      state.locked = false;
      state.lastBarPercent = 0;
      state.justAnsweredIndex = null;
      resultsApp.setAttribute("hidden", "");
      resultsApp.innerHTML = "";
      quizApp.removeAttribute("hidden");
      renderQuestion(0);
      window.scrollTo(0, 0);
    });

    allResultsBtn.addEventListener("click", function () {
      if (allResultsSection) {
        allResultsSection.classList.toggle("revealed");
        allResultsSection.scrollIntoView({ behavior: "smooth" });
      }
    });

    if (takeQuizBtn) {
      takeQuizBtn.addEventListener("click", function () {
        window.location.href = urlWithoutResultParam();
      });
    }
  }

  // --------------------------------------------------------------------
  // Init
  // --------------------------------------------------------------------

  var initialResultId = getResultParam();
  if (initialResultId && initialResultId in results) {
    showResult(initialResultId, { showTakeQuizButton: true });
  } else {
    renderQuestion(0);
  }
})();
