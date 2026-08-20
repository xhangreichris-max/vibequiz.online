(function () {
  "use strict";

  var dataEl = document.getElementById("quiz-data");

  function escapeHtmlShared(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --------------------------------------------------------------------
  // Vibe Passport — shared between quiz pages (write) and the homepage
  // (read). localStorage key: "vq_passport". Every read/write is wrapped
  // in try/catch: Safari private mode throws on setItem, and a full quota
  // can throw too. On any failure the passport just silently doesn't
  // appear — nothing else about the quiz breaks.
  // --------------------------------------------------------------------

  var PASSPORT_KEY = "vq_passport";

  // Fixed dimension order. Also the archetype-screen row order and the
  // ?dna= URL segment order — must never change without breaking existing
  // shared ?dna= links.
  var DIMENSIONS = [
    { slug: "aesthetic-quiz", label: "ATMOSPHERE" },
    { slug: "aesthetic-quiz-clothing", label: "EXPRESSION" },
    { slug: "what-food-am-i", label: "COMFORT" },
    { slug: "what-bird-am-i", label: "ENERGY" },
    { slug: "what-dessert-am-i", label: "INDULGENCE" },
  ];

  // Short question-style CTA copy for "take the next quiz" buttons. This is
  // UI copy, not quiz content, so it's fine to hardcode here — a given page
  // only ever has its own quiz's data loaded (#quiz-data is deliberately
  // slim/per-page), so a button pointing at a *different* quiz has no other
  // source for that quiz's name.
  var QUIZ_QUESTION_LABEL = {
    "aesthetic-quiz": "WHAT'S YOUR AESTHETIC?",
    "aesthetic-quiz-clothing": "WHAT'S YOUR STYLE?",
    "what-food-am-i": "WHAT FOOD ARE YOU?",
    "what-bird-am-i": "WHAT BIRD ARE YOU?",
    "what-dessert-am-i": "WHAT DESSERT ARE YOU?",
  };

  // Static name/traits/color table for every one of the 44 results, used
  // only by the ?dna= share path. A ?dna= link can be opened on a browser
  // that has never loaded any quiz page (no #quiz-data anywhere), so the
  // bare result IDs in the URL aren't enough on their own — this table is
  // also what "validate every segment against known result IDs" checks
  // against. Sourced from quizzes-config.json (read, not modified).
  var RESULT_LOOKUP = {
    "aesthetic-quiz": {
      "cottagecore": { name: "Cottagecore", traits: ["warm", "romantic", "restrained"], bg: "#8FAF7E", text: "#F5F0E8" },
      "dark_academia": { name: "Dark Academia", traits: ["intellectual", "nocturnal", "romantic"], bg: "#2D2449", text: "#e8e0f8" },
      "y2k": { name: "Y2K", traits: ["loud", "chaotic", "warm"], bg: "#FF2D78", text: "#FFFFFF" },
      "soft_girl": { name: "Soft Girl", traits: ["warm", "adaptable", "romantic"], bg: "#F2C4CE", text: "#5C3D5C" },
      "grunge": { name: "Grunge", traits: ["intense", "restrained", "loyal"], bg: "#1A1A1A", text: "#E8E0D8" },
      "coquette": { name: "Coquette", traits: ["romantic", "precise", "intense"], bg: "#E8C4CC", text: "#4A2030" },
      "old_money": { name: "Old Money", traits: ["restrained", "precise", "intellectual"], bg: "#2C3E2D", text: "#F0ECD8" },
      "indie_sleaze": { name: "Indie Sleaze", traits: ["chaotic", "curious", "adaptable"], bg: "#1A1A2E", text: "#E8E0F8" },
      "clean_girl": { name: "Clean Girl", traits: ["precise", "restrained", "adaptable"], bg: "#F5F0E8", text: "#1C1A17" },
      "cyber_futurism": { name: "Cyber Futurism", traits: ["intellectual", "precise", "nocturnal"], bg: "#0A0A1A", text: "#00F5FF" },
    },
    "aesthetic-quiz-clothing": {
      "cottagecore": { name: "Cottagecore", traits: ["warm", "romantic", "restrained"], bg: "#8FAF7E", text: "#F5F0E8" },
      "dark_academia": { name: "Dark Academia", traits: ["intellectual", "nocturnal", "romantic"], bg: "#2D2449", text: "#e8e0f8" },
      "y2k": { name: "Y2K", traits: ["loud", "chaotic", "warm"], bg: "#FF2D78", text: "#FFFFFF" },
      "soft_girl": { name: "Soft Girl", traits: ["warm", "adaptable", "romantic"], bg: "#F2C4CE", text: "#5C3D5C" },
      "grunge": { name: "Grunge", traits: ["intense", "restrained", "loyal"], bg: "#1A1A1A", text: "#E8E0D8" },
      "coquette": { name: "Coquette", traits: ["romantic", "precise", "intense"], bg: "#E8C4CC", text: "#4A2030" },
      "old_money": { name: "Old Money", traits: ["restrained", "precise", "intellectual"], bg: "#2C3E2D", text: "#F0ECD8" },
      "indie_sleaze": { name: "Indie Sleaze", traits: ["chaotic", "curious", "adaptable"], bg: "#1A1A2E", text: "#E8E0F8" },
      "clean_girl": { name: "Clean Girl", traits: ["precise", "restrained", "adaptable"], bg: "#F5F0E8", text: "#1C1A17" },
      "cyber_futurism": { name: "Cyber Futurism", traits: ["intellectual", "precise", "nocturnal"], bg: "#0A0A1A", text: "#00F5FF" },
    },
    "what-food-am-i": {
      "pizza": { name: "Pizza", traits: ["warm", "loud", "adaptable"], bg: "#C44D2A", text: "#F5F0E8" },
      "sushi": { name: "Sushi", traits: ["precise", "intellectual", "restrained"], bg: "#1C3A4A", text: "#F5F0E8" },
      "ramen": { name: "Ramen", traits: ["warm", "loyal", "intense"], bg: "#6B2D1E", text: "#F5F0E8" },
      "tacos": { name: "Tacos", traits: ["chaotic", "adaptable"], bg: "#D4893A", text: "#1A1A1A" },
      "pasta": { name: "Pasta", traits: ["romantic", "loyal", "precise"], bg: "#4A2040", text: "#F5F0E8" },
      "salad": { name: "Salad", traits: ["precise", "intense", "restrained"], bg: "#1E3D28", text: "#F5F0E8" },
      "burger": { name: "Burger", traits: ["restrained", "loyal"], bg: "#3A2518", text: "#F5F0E8" },
      "dumplings": { name: "Dumplings", traits: ["warm", "loyal", "restrained"], bg: "#6B3028", text: "#F5F0E8" },
    },
    "what-bird-am-i": {
      "owl": { name: "Owl", traits: ["intellectual", "nocturnal", "restrained"], bg: "#1E1833", text: "#F5F0E8" },
      "crow": { name: "Crow", traits: ["curious", "intellectual", "adaptable"], bg: "#0D0D14", text: "#F5F0E8" },
      "hummingbird": { name: "Hummingbird", traits: ["chaotic", "intense", "loud"], bg: "#5A1548", text: "#F5F0E8" },
      "flamingo": { name: "Flamingo", traits: ["precise", "adaptable", "loud"], bg: "#F0B8C8", text: "#1A1A1A" },
      "penguin": { name: "Penguin", traits: ["loyal", "warm"], bg: "#0D2035", text: "#F5F0E8" },
      "hawk": { name: "Hawk", traits: ["precise", "intellectual", "loyal"], bg: "#4A2810", text: "#F5F0E8" },
      "sparrow": { name: "Sparrow", traits: ["adaptable", "loyal"], bg: "#3A2D1E", text: "#F5F0E8" },
      "peacock": { name: "Peacock", traits: ["precise", "intellectual", "intense"], bg: "#083D30", text: "#F5F0E8" },
    },
    "what-dessert-am-i": {
      "tiramisu": { name: "Tiramisu", traits: ["romantic", "intense", "precise"], bg: "#2E1E0E", text: "#F5F0E8" },
      "brownie": { name: "Brownie", traits: ["restrained", "loyal", "warm"], bg: "#241408", text: "#F5F0E8" },
      "macaron": { name: "Macaron", traits: ["precise", "intellectual"], bg: "#F0D0DC", text: "#1A1A1A" },
      "cheesecake": { name: "Cheesecake", traits: ["warm", "loyal", "intense"], bg: "#F0E0C0", text: "#1A1A1A" },
      "soft_serve": { name: "Soft Serve", traits: ["adaptable", "warm", "intellectual"], bg: "#D0E8F8", text: "#1A1A1A" },
      "creme_brulee": { name: "Crème Brûlée", traits: ["precise", "restrained", "intense"], bg: "#F0D890", text: "#1A1A1A" },
      "cinnamon_roll": { name: "Cinnamon Roll", traits: ["warm", "loyal"], bg: "#F0C898", text: "#1A1A1A" },
      "dark_chocolate_truffle": { name: "Dark Chocolate Truffle", traits: ["intense", "restrained", "precise"], bg: "#180C0C", text: "#F5F0E8" },
    },
  };

  // Trait pairs cover the combinations most likely to actually occur given
  // the real trait spread from Phase 3, plus the reference's own set.
  var ARCHETYPES = {
    "intellectual+nocturnal": { name: "THE MIDNIGHT CURATOR", line: "You romanticise ordinary moments and make poor sleep look intentional." },
    "chaotic+warm": { name: "THE HUMAN BONFIRE", line: "People gather around you and nobody is entirely sure how it started." },
    "precise+restrained": { name: "THE QUIET ARCHITECT", line: "Everything you touch ends up slightly better organised than you found it." },
    "intense+loyal": { name: "THE DEEP END", line: "You do not do casual, and the people who know that are the people who matter." },
    "adaptable+curious": { name: "THE SIDE QUEST", line: "You went out for one thing and came back with a story." },
    "loud+romantic": { name: "THE GRAND GESTURE", line: "Subtlety was an option and you considered it briefly." },
    "romantic+warm": { name: "THE SLOW SUNDAY", line: "You take the long route because the long route is the point." },
    "intellectual+precise": { name: "THE FOOTNOTE", line: "You have been right about something obscure for years and rarely mention it." },
    "intense+nocturnal": { name: "THE LATE SIGNAL", line: "Your best thinking happens after everyone else has logged off." },
    "adaptable+warm": { name: "THE SOFT LANDING", line: "Rooms get easier when you walk into them and nobody can explain why." },
    "chaotic+curious": { name: "THE OPEN TAB", line: "You started three things this week and two of them are going somewhere." },
    "loyal+restrained": { name: "THE STANDING OFFER", line: "You show up without announcing it and keep doing it long after anyone thanked you." },
    "loyal+warm": { name: "THE STEADY GLOW", line: "You're the reason people say they always know where they stand with you." },
    "intense+precise": { name: "THE SHARP FOCUS", line: "You don't do things halfway, and you've stopped explaining why." },
    "intellectual+loyal": { name: "THE TRUSTED WITNESS", line: "You remember the details other people forgot they told you." },
    "restrained+warm": { name: "THE QUIET COMFORT", line: "You never make it a whole thing, and that is exactly why it works." },
    _default: { name: "THE UNCATEGORISED", line: "Your combination is rare enough that we are still deciding what to call it." },
  };

  function readPassport() {
    try {
      var raw = localStorage.getItem(PASSPORT_KEY);
      if (!raw) return { v: 1, results: {} };
      var data = JSON.parse(raw);
      if (!data || data.v !== 1 || typeof data.results !== "object" || !data.results) {
        return { v: 1, results: {} };
      }
      return data;
    } catch (e) {
      return { v: 1, results: {} };
    }
  }

  function writePassport(data) {
    try {
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(data));
    } catch (e) {
      /* private mode or quota — fail silently, feature just degrades */
    }
  }

  function passportCompletedCount(passport) {
    var n = 0;
    DIMENSIONS.forEach(function (d) { if (passport.results[d.slug]) n++; });
    return n;
  }

  function nextUncompletedDimension(passport) {
    for (var i = 0; i < DIMENSIONS.length; i++) {
      if (!passport.results[DIMENSIONS[i].slug]) return DIMENSIONS[i];
    }
    return null;
  }

  function computeArchetype(passport) {
    var counts = {};
    DIMENSIONS.forEach(function (d) {
      var entry = passport.results[d.slug];
      if (!entry || !entry.traits) return;
      entry.traits.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    });
    var top = Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); })
      .slice(0, 2)
      .sort();
    return ARCHETYPES[top.join("+")] || ARCHETYPES._default;
  }

  // Any invalid/unknown segment means the whole ?dna= parameter is ignored
  // and the caller falls back to the normal homepage. Never throws.
  function parseDnaParam(raw) {
    if (!raw) return null;
    var parts = raw.split(".");
    if (parts.length !== DIMENSIONS.length) return null;
    var results = {};
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var slug = DIMENSIONS[i].slug;
      var id = parts[i];
      var known = RESULT_LOOKUP[slug] && RESULT_LOOKUP[slug][id];
      if (!known) return null;
      results[slug] = { id: id, name: known.name, traits: known.traits, bg: known.bg, text: known.text };
    }
    return { v: 1, results: results };
  }

  function buildPassportRowsHtml(passport) {
    return DIMENSIONS.map(function (d) {
      var entry = passport.results[d.slug];
      if (entry) {
        return '<div class="passport-row is-filled"><span class="passport-dot" style="background:' + entry.bg + '"></span>' +
          '<span class="passport-dim">' + d.label + "</span>" +
          '<span class="passport-name">' + escapeHtmlShared(entry.name) + "</span></div>";
      }
      return '<div class="passport-row"><span class="passport-dot"></span>' +
        '<span class="passport-dim">' + d.label + "</span>" +
        '<span class="passport-name">not yet</span></div>';
    }).join("");
  }

  function nextQuizButtonHtml(passport) {
    var next = nextUncompletedDimension(passport);
    if (!next) return "";
    var remaining = DIMENSIONS.length - passportCompletedCount(passport);
    var nudge = remaining === 1 ? "1 more unlocks your archetype" : remaining + " more unlock your archetype";
    var label = QUIZ_QUESTION_LABEL[next.slug] || "TAKE THIS QUIZ";
    return '<div class="passport-nudge">' + nudge + "</div>" +
      '<a href="/' + next.slug + '/index.html" class="passport-next-btn">' + label + " →</a>";
  }

  function buildArchetypeScreenHtml(passport, actionsHtml) {
    var archetype = computeArchetype(passport);
    var atmosphere = passport.results["aesthetic-quiz"];
    var bg = (atmosphere && atmosphere.bg) || "#FAF6F0";
    var text = (atmosphere && atmosphere.text) || "#1C1A17";

    var rowsHtml = DIMENSIONS.map(function (d, i) {
      var entry = passport.results[d.slug];
      var num = String(i + 1).padStart(2, "0");
      var name = entry ? escapeHtmlShared(entry.name) : "———";
      return '<div class="unlock-row"><span class="unlock-num">' + num + "</span>" +
        '<span class="unlock-dim">' + d.label + "</span>" +
        '<span class="unlock-name">' + name + "</span></div>";
    }).join("");

    return '<div class="archetype-screen" style="background:' + bg + ";color:" + text + '">' +
      '<div class="archetype-kicker">YOU FOUND YOUR<br>VIBE COMBINATION</div>' +
      '<div class="unlock-rows">' + rowsHtml + "</div>" +
      '<div class="archetype-divider"></div>' +
      '<div class="archetype-name">' + escapeHtmlShared(archetype.name) + "</div>" +
      '<p class="archetype-line">' + escapeHtmlShared(archetype.line) + "</p>" +
      '<div class="archetype-actions">' + actionsHtml + "</div>" +
      "</div>";
  }

  function initQuizPage() {
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

    // Suppressed on the shared-link (?r=) view — that visitor hasn't taken
    // any quiz yet, so "your progress" would be confusing next to a
    // "take the quiz yourself" prompt for a result that isn't theirs.
    var passportHtml = "";
    if (!showTakeQuizButton) {
      var passport = readPassport();
      passportHtml =
        '<div class="vibe-passport">' +
        '<div class="vibe-passport-heading">YOUR VIBE PASSPORT<span class="vibe-passport-count">' +
        passportCompletedCount(passport) + " / " + DIMENSIONS.length + "</span></div>" +
        '<div class="passport-rows">' + buildPassportRowsHtml(passport) + "</div>" +
        nextQuizButtonHtml(passport) +
        "</div>";
    }

    var footerHtml = '<div class="result-footer">analyzed at ' + formatTime(new Date()) + "</div>";

    resultsApp.innerHTML =
      '<div class="result-screen active" id="result-' + winnerId + '">' +
      takeQuizHtml + moodboardHtml + verdictHtml + tagsHtml + rarityHtml + actionRowHtml + passportHtml + fragmentsHtml + breakdownHtml + descriptionHtml + footerHtml +
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

    // Passport write — real completions only, never on a ?r= view (handled
    // above via the forcedWinnerId early return). A retake overwrites this
    // quiz's entry in place, so the completed count never double-counts it.
    var passport = readPassport();
    var wasComplete = passportCompletedCount(passport) === DIMENSIONS.length;
    // #quiz-data is a deliberately slim payload (name/emoji/palette/signals/
    // fragments/verdict only — see build.py's build_quiz_data) and does not
    // carry `traits`, so traits come from the same static RESULT_LOOKUP
    // table used by the ?dna= path rather than from `winner` directly.
    var lookedUp = RESULT_LOOKUP[quizData.slug] && RESULT_LOOKUP[quizData.slug][winnerId];
    passport.results[quizData.slug] = {
      id: winnerId,
      at: Date.now(),
      name: winner.name,
      traits: (lookedUp && lookedUp.traits) || [],
      bg: (winner.palette && winner.palette.bg && winner.palette.bg[0]) || "#1C1A17",
      text: (winner.palette && winner.palette.text) || "#FAF6F0",
    };
    var nowComplete = passportCompletedCount(passport) === DIMENSIONS.length;
    var shouldShowUnlock = nowComplete && !wasComplete && !passport.archetype_seen;
    if (shouldShowUnlock) passport.archetype_seen = true;
    writePassport(passport);

    function proceedToResult() {
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

    if (shouldShowUnlock) {
      renderArchetypeUnlock(passport, proceedToResult);
    } else {
      proceedToResult();
    }
  }

  // Shown once, immediately after the fifth quiz completes, before the
  // normal result screen for the quiz that was just finished. Stored
  // archetype_seen (already set to true by the caller) means it never
  // auto-replays on a later retake, even though the passport stays 5/5.
  function renderArchetypeUnlock(passport, onContinue) {
    var actionsHtml =
      '<button type="button" class="archetype-share-btn">SHARE MY VIBE DNA →</button>' +
      '<button type="button" class="archetype-continue-btn">SEE MY RESULT →</button>';

    resultsApp.innerHTML = '<div class="archetype-overlay-inline">' + buildArchetypeScreenHtml(passport, actionsHtml) + "</div>";

    quizApp.setAttribute("hidden", "");
    resultsApp.removeAttribute("hidden");
    window.scrollTo(0, 0);

    resultsApp.querySelector(".archetype-share-btn").addEventListener("click", function (e) {
      var btn = e.currentTarget;
      var dna = DIMENSIONS.map(function (d) {
        var entry = passport.results[d.slug];
        return entry ? entry.id : "";
      }).join(".");
      var archetype = computeArchetype(passport);
      var shareUrl = location.origin + "/?dna=" + dna;
      var shareData = { title: "My Vibe DNA", text: "I'm " + archetype.name + ". What's yours?", url: shareUrl };
      var original = btn.textContent;
      function showCopiedFeedback() {
        btn.textContent = "COPIED TO YOUR WORLD ✓";
        setTimeout(function () { btn.textContent = original; }, 2000);
      }
      if (navigator.share) {
        navigator.share(shareData).then(showCopiedFeedback).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareData.url).then(showCopiedFeedback).catch(function () {});
      }
    });

    resultsApp.querySelector(".archetype-continue-btn").addEventListener("click", function () {
      onContinue();
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
  } // end initQuizPage

  function initHomepage() {
    var dnaRaw = null;
    try {
      dnaRaw = new URLSearchParams(window.location.search).get("dna");
    } catch (e) {
      dnaRaw = null;
    }

    if (dnaRaw) {
      var dnaPassport = parseDnaParam(dnaRaw);
      if (dnaPassport) {
        renderSharedArchetypeOverlay(dnaPassport);
        return; // A shared-link visitor sees only the shared archetype —
                // never their own passport strip alongside it, even if
                // they have their own progress saved in this browser.
      }
      // Malformed/unknown segment — fall through to the normal homepage.
      // Never throw, never leave the page half-rendered.
    }

    var passport = readPassport();
    renderPassportStrip(passport);
    markCompletedCards(passport);
  }

  function renderPassportStrip(passport) {
    var mount = document.getElementById("passport-strip");
    if (!mount) return;

    var count = passportCompletedCount(passport);
    if (count === 0) {
      mount.innerHTML = "";
      return;
    }

    var newest = 0;
    DIMENSIONS.forEach(function (d) {
      var e = passport.results[d.slug];
      if (e && e.at > newest) newest = e.at;
    });
    var stale = count < DIMENSIONS.length && newest > 0 && (Date.now() - newest) > 7 * 24 * 60 * 60 * 1000;

    var countLabel = count + " / " + DIMENSIONS.length;
    var statusHtml;
    if (stale) {
      statusHtml =
        '<span class="passport-strip-status">' + countLabel + "</span>" +
        '<span class="passport-strip-pickup">pick up where you left off →</span>';
    } else {
      var filled = Math.round((count / DIMENSIONS.length) * 10);
      var bar = "";
      for (var i = 0; i < 10; i++) bar += i < filled ? "█" : "░";
      statusHtml =
        '<span class="passport-strip-status">' + countLabel + "</span>" +
        '<span class="passport-strip-bar">' + bar + "</span>";
    }

    mount.innerHTML =
      '<a href="#" class="passport-strip">' +
      '<span class="passport-strip-title">YOUR VIBE PASSPORT</span>' +
      statusHtml +
      "</a>";

    mount.querySelector(".passport-strip").addEventListener("click", function (e) {
      e.preventDefault();
      var existing = document.getElementById("passport-expanded");
      if (existing) {
        existing.remove();
        return;
      }
      var panel = document.createElement("div");
      panel.id = "passport-expanded";
      panel.className = "passport-expanded";
      panel.innerHTML = buildPassportRowsHtml(passport) + nextQuizButtonHtml(passport);
      mount.appendChild(panel);
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function markCompletedCards(passport) {
    var cards = document.querySelectorAll(".flagship-card, .secondary-card");
    cards.forEach(function (card) {
      var href = card.getAttribute("href") || "";
      var m = href.match(/^\/([^/]+)\/index\.html$/);
      if (!m) return;
      var entry = passport.results[m[1]];
      if (!entry) return;
      var marker = document.createElement("span");
      marker.className = "card-completed-marker";
      marker.style.color = entry.bg;
      marker.textContent = entry.name;
      card.appendChild(marker);
    });
  }

  // Addition 2 — this must never remove or replace the homepage's SEO
  // content (the 400-word article block, results, etc. all live under
  // <main>). It is purely additive: a new fixed overlay appended to
  // <body>, so every existing node stays in the DOM, just visually
  // covered. Never innerHTML-replace anything under <main>.
  function renderSharedArchetypeOverlay(passport) {
    var actionsHtml = '<a href="/aesthetic-quiz/index.html" class="archetype-continue-btn">BUILD YOUR OWN →</a>';

    var overlay = document.createElement("div");
    overlay.className = "archetype-overlay";
    overlay.innerHTML = buildArchetypeScreenHtml(passport, actionsHtml);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
  }

  if (dataEl) {
    initQuizPage();
  } else {
    initHomepage();
  }
})();
