---
name: vibequiz-v2-builder
description: Build the V2 game-feel layer for vibequiz.online — physical answer tiles, card-flip result reveal, procedural sound, and the Vibe Passport progression system. Use this skill whenever work touches the vibequiz.online repo, whenever Chris mentions vibequiz, quiz UI, quiz interaction, the passport, the archetype system, result reveal, or v2, and whenever any change is proposed to quiz-engine.js, style.css, quizzes-config.json, build.py, template.html, or template_index.html in that project. Also use it before any commit to that repo, because it contains the SEO guardrails that protect the site's rankings.
---

# vibequiz.online V2 Builder

A four-phase build that turns a working but plain quiz site into
something that feels like a small game, without touching a single
thing Google depends on.

Read this whole file before starting. Read reference files only when
the phase you are on tells you to.

---

## The four non-negotiables

These are business-critical. The site's entire revenue model is
organic search. Violating any of these destroys it. Check them
before every commit.

**NN-1 — URLs never change.**
These six URLs are fixed forever:

```
/
/aesthetic-quiz/index.html
/aesthetic-quiz-clothing/index.html
/what-food-am-i/index.html
/what-bird-am-i/index.html
/what-dessert-am-i/index.html
```

If a URL ever must change, a 301 redirect goes live before the old
one stops resolving.

**NN-2 — Content stays in raw HTML.**
All article text, result descriptions, the "All Results" section,
and FAQ content are written into the HTML by `build.py` at build
time. Googlebot must see them with JavaScript disabled.

The site is two layers:

```
SEO CONTENT LAYER  →  in HTML at build time  →  never moves to JS
GAME LAYER         →  JS and CSS enhancement →  can be as rich as you like
```

**NN-3 — Content never shrinks.**
Do not delete article sections, FAQ entries, or result text to make
a design cleaner. Hide visually if needed; keep it in the DOM.

**NN-4 — The quiz works without the game layer.**
If JavaScript partially fails, the browser is old, or the user has
`prefers-reduced-motion` enabled, the quiz must still be completable
with plain tappable buttons. The game layer is progressive
enhancement, never a dependency.

---

## Project shape

```
vibequiz.online/
├── build.py                 Python stdlib only, no dependencies
├── quizzes-config.json      all content, palettes, weights
├── template.html            quiz page shell
├── template_index.html      homepage shell
├── style.css
├── quiz-engine.js
└── dist/                    generated output, deployed to gh-pages
```

Five quizzes, all content complete and verified:
`aesthetic-quiz` (12 questions, 10 results), `aesthetic-quiz-clothing`
(12 questions, same 10 results), `what-food-am-i`, `what-bird-am-i`,
`what-dessert-am-i` (10 questions, 8 results each).

Already built and working — do not rebuild or regress these:

- Weighted scoring, tiebreak by earliest contributing question
- Poster-first result screen layout
- Shareable result URLs via the `?r=result_id` parameter
- Colour DNA on homepage cards
- Homepage SEO content block
- Favicon, OG image, manifest, 404, CNAME, GA4 placeholder

---

## Build order

Run the phases in order. Each phase ends with a verification gate.
Do not begin a phase until the previous one has passed its gate and
been committed.

```
Phase 1  Physical answers and juice layer      references/interaction.md
Phase 2  Card flip reveal and sound            references/reveal-and-sound.md
Phase 3  Trait data entry                      references/traits.md
Phase 4  Vibe Passport                         references/passport.md
Phase 5  Layout and typography                 references/layout-and-typography.md
```

Phase 3 must come before Phase 4 — the passport's archetype system
reads the trait data.

Phase 5 must come last. It touches nearly every file and would
create merge conflicts with any of the earlier phases. It is split
into four sub-steps (5a–5d), each with its own gate and commit.

---

## How to run a phase

**Step 1 — Orient.** Before writing any code, read the files the
phase touches and write a short summary of how the relevant existing
code works. Output that summary. This catches wrong assumptions
before they become wrong code.

**Step 2 — Read the reference.** Open the reference file for that
phase. It is authoritative. If anything in this SKILL.md conflicts
with a reference file, follow the reference file and note the
deviation in the final report.

**Step 3 — Build.** Stay inside the file scope listed for that
phase. Do not touch files outside it.

**Step 4 — Verify.** Run the phase's verification checklist in full.
Do not skip steps. Report pass or fail per item, not a summary.

**Step 5 — Commit.** One commit per verified phase, so a single
feature can be reverted cleanly:

```bash
git add .
git commit -m "v2 phase N: <short description>"
```

---

## Phase file scope

| Phase | May edit | Must not edit |
|---|---|---|
| 1 Interaction | `quiz-engine.js`, `style.css` | config, build.py, both templates |
| 2 Reveal + sound | `quiz-engine.js`, `style.css` | config, build.py, both templates |
| 3 Traits | `quizzes-config.json` | all code files |
| 4 Passport | `quiz-engine.js`, `style.css`, `template_index.html` | config, build.py, template.html |
| 5a Typography | `style.css`, both templates | config, build.py, quiz-engine.js |
| 5b Article layout | `style.css`, `build.py`, `quizzes-config.json` (adds `pull_quote` only) | quiz-engine.js |
| 5c Art direction | `style.css`, `build.py` | config, quiz-engine.js |
| 5d Question templates | `style.css`, `quiz-engine.js` | config, build.py, both templates |

---

## The universal gate

Run this before every commit, in every phase, no exceptions:

1. `python build.py` completes with no errors
2. Disable JavaScript in DevTools, load `/aesthetic-quiz/index.html`,
   confirm the article, all ten result descriptions, and the FAQ are
   all still visible in the rendered page
3. Enable JavaScript, complete one full quiz, confirm the correct
   result appears
4. Open a `?r=cottagecore` link, confirm the shared-result path still
   works and the "TAKE THE QUIZ YOURSELF →" button is present
5. 380px viewport, no horizontal scroll anywhere
6. Zero console errors
7. All six URLs still resolve

Step 2 is the one that protects the business. If it fails, stop and
fix before doing anything else.

---

## Cross-cutting rules

**Performance.** Animate only `transform` and `opacity`. Never
`width`, `height`, `top`, or `left`. Idle animation is CSS only —
`requestAnimationFrame` is permitted only during an active pointer
interaction and must be cancelled on pointerup. Running rAF
continuously on five elements drains battery on mid-range Android,
which is most of the audience.

**Accessibility.** Answer tiles are real `<button>` elements, never
divs. Minimum 52px tile height. `prefers-reduced-motion` disables
all drift, overshoot, and the reveal, while leaving the quiz fully
completable.

**Storage.** Every `localStorage` read and write is wrapped in
try/catch. Safari private mode throws. If storage is unavailable the
feature silently does not appear and nothing else breaks.

**No dependencies.** No React, no framework, no animation library,
no audio files, no external image assets. Vanilla JS, CSS, Web
Animations API, Web Audio API, Canvas. Nothing over 30KB.
`quiz-engine.js` stays under 25KB minified.

**Shared links are different.** A visitor arriving via `?r=` did not
answer anything. They skip the reveal animation and nothing is
written to their passport. This edge case is easy to forget and
breaks in a way that is hard to notice.

---

## Reference files

Read these when the phase calls for them, not before.

- `references/interaction.md` — Phase 1. Idle drift keyframes, press
  and release timings, odometer counter, progress overshoot,
  haptics, accessibility, performance budget.
- `references/reveal-and-sound.md` — Phase 2. Card flip sequence,
  palette-tease card back, the shared-link skip rule, procedural
  Web Audio system, autoplay policy.
- `references/traits.md` — Phase 3. The fixed twelve-word trait
  vocabulary, assignment rules, and the locked assignments for the
  ten aesthetic results.
- `references/passport.md` — Phase 4. Storage schema, placement,
  archetype computation, the archetype matrix, `?dna=` sharing.
- `references/layout-and-typography.md` — Phase 5, split into four
  sub-steps. Font choice and type scale, desktop editorial grid,
  per-quiz art direction tokens, rotating question layouts.
- `references/launch-and-roadmap.md` — Not a build phase. Launch
  sequence, post-launch timeline, next-quiz research list, revenue
  expectations, deferred V3 ideas. Read when the question is about
  strategy rather than code.

---

## After all four phases

1. Run the universal gate one final time
2. Take all five quizzes end to end
3. Test on a real phone, not just DevTools
4. Push:

```bash
git push origin main
```

5. Confirm the GitHub Actions workflow runs green
6. No need to re-request indexing — URLs and crawlable content are
   unchanged by V2

---

## If something breaks

Each phase touches a predictable file set, so `git revert` on the
specific phase commit is cleaner than unpicking changes by hand.
This is why one commit per verified phase matters.

If rankings drop after a V2 deploy, the first thing to check is
NN-2: disable JavaScript and confirm the content is still there.
That is the failure mode that matters.
