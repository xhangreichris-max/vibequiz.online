# V2 Feature 1 — Physical Answers + Juice Layer

Goal: the answer stops being a button and becomes an object.
Everything in this file is presentation layer. No content moves
into JavaScript.

---

## 1. The interaction, described

Each question shows five answer tiles. At rest they are not
perfectly still — each drifts very slightly on its own rhythm, so
the screen feels alive before the user touches anything.

On press, the tile compresses. On release it overshoots slightly,
the other four tiles fall back and fade, the selected tile grows
toward the centre of the screen, and the next question rises from
below.

The whole sequence takes about 500ms. That pause is deliberate. If
the next question appears instantly, the user never registers that
they did something.

---

## 2. Idle float — CSS only, never requestAnimationFrame

This is the single most important performance decision in the spec.

Running `requestAnimationFrame` with `Math.sin()` on five elements
continuously will heat a mid-range Android and drain battery. The
idle float must be pure CSS animation so the browser can offload it
to the compositor.

Give each of the five tiles a different animation-delay and duration
so they drift out of phase with each other.

```css
@keyframes tile-drift-a {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-0.3deg); }
  50%      { transform: translate3d(0, -3px, 0) rotate(0.3deg); }
}
@keyframes tile-drift-b {
  0%, 100% { transform: translate3d(0, -2px, 0) rotate(0.4deg); }
  50%      { transform: translate3d(0, 1px, 0) rotate(-0.2deg); }
}
@keyframes tile-drift-c {
  0%, 100% { transform: translate3d(0, 1px, 0) rotate(0.2deg); }
  50%      { transform: translate3d(0, -2px, 0) rotate(-0.4deg); }
}

.answer-tile:nth-child(1) { animation: tile-drift-a 5.2s ease-in-out infinite; }
.answer-tile:nth-child(2) { animation: tile-drift-b 6.1s ease-in-out infinite; animation-delay: -1.4s; }
.answer-tile:nth-child(3) { animation: tile-drift-c 5.7s ease-in-out infinite; animation-delay: -2.8s; }
.answer-tile:nth-child(4) { animation: tile-drift-a 6.4s ease-in-out infinite; animation-delay: -0.9s; }
.answer-tile:nth-child(5) { animation: tile-drift-b 5.5s ease-in-out infinite; animation-delay: -3.3s; }
```

Amplitude is intentionally tiny — 3px and under half a degree. Any
more and it reads as broken rather than alive.

`requestAnimationFrame` is permitted only during an active pointer
interaction, and must be cancelled on pointerup.

---

## 3. Press and release timing

```
  0ms   pointerdown        add .is-pressing
 70ms   compression peak   scale(0.96)
        pointerup          add .is-selected, remove .is-pressing
        overshoot          scale(1.04) then settle to scale(1)
250ms   siblings fade      other four tiles: opacity 0, translateY(6px)
350ms   selected expands   scale(1.08), moves toward centre
        question fades     opacity 0, translateY(-8px)
500ms   next question in   from translateY(12px) opacity 0
760ms   settled
```

CSS:

```css
.answer-tile {
  transition: transform 180ms cubic-bezier(.2, 1.4, .3, 1),
              opacity 180ms ease-out,
              border-color 120ms ease-out;
}

.answer-tile.is-pressing {
  transform: scale(0.96);
  transition-duration: 70ms;
  transition-timing-function: ease-out;
  animation-play-state: paused;   /* freeze the idle drift on touch */
}

.answer-tile.is-selected {
  transform: scale(1.04);
  border-color: var(--accent);
  background: #F0EBF8;
  animation-play-state: paused;
}

.answer-tile.is-dismissed {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
  transition-duration: 200ms;
}
```

`cubic-bezier(.2, 1.4, .3, 1)` is the key value. The overshoot past
1.0 is what makes the release feel physical rather than mechanical.

Question card transitions:

```css
.question-card {
  transition: transform 200ms ease-in, opacity 200ms ease-in;
}
.question-card.is-leaving {
  opacity: 0;
  transform: translateY(-8px) scale(0.985);
}
.question-card.is-entering {
  opacity: 0;
  transform: translateY(12px);
}
.question-card.is-entered {
  opacity: 1;
  transform: translateY(0);
  transition: transform 300ms cubic-bezier(.2, .9, .3, 1),
              opacity 300ms ease-out;
}
```

---

## 4. Odometer question counter

The counter should roll rather than swap. Cheap to build, high
perceived polish.

Structure the number as two stacked spans inside a clipped container:

```html
<div class="q-counter">
  <span class="q-counter-track">
    <span class="q-counter-digit">04</span>
    <span class="q-counter-digit q-counter-next">05</span>
  </span>
  <span class="q-counter-total">/ 12</span>
</div>
```

```css
.q-counter { display: inline-flex; align-items: baseline; gap: 4px; }
.q-counter-track {
  display: block;
  height: 1.1em;
  overflow: hidden;
  position: relative;
}
.q-counter-digit { display: block; height: 1.1em; line-height: 1.1em; }
.q-counter-track.is-rolling {
  transform: translateY(-1.1em);
  transition: transform 220ms cubic-bezier(.3, .8, .3, 1);
}
```

On advance: write the new number into `.q-counter-next`, add
`.is-rolling`, then after 220ms swap the values and remove the class
without transition.

---

## 5. Progress indicator with weight

Two parts: a thin bar and a dot trail. The bar should overshoot
slightly so it reads as having momentum.

```
target 42%  →  animate to 44%  →  settle back to 42%
total duration 250ms
```

Implement with the Web Animations API so the overshoot is one call:

```js
bar.animate(
  [
    { width: previousPercent + '%' },
    { width: (targetPercent + 2) + '%', offset: 0.7 },
    { width: targetPercent + '%' }
  ],
  { duration: 250, easing: 'ease-out', fill: 'forwards' }
);
```

Dot trail: one 6px dot per question, 4px gap. Answered dots use
`var(--accent)`, unanswered use `var(--border)`. When a dot fills, it
scales 1 → 1.4 → 1 over 200ms.

---

## 6. Haptics

Free polish on Android. Silently absent on iOS Safari, which is fine.

```js
function buzz(ms) {
  if (navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) { /* ignore */ }
  }
}
```

- Answer selected: `buzz(8)`
- Result revealed: `buzz(18)`
- Nothing else. Never vibrate continuously or on scroll.

---

## 7. Accessibility and fallback — mandatory

This section is not optional polish. Without it the quiz can become
unusable for a subset of visitors.

### 7a. Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .answer-tile,
  .question-card,
  .q-counter-track {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

Also gate the JS: read
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` once
on load and skip the drift/overshoot logic entirely when true. The
quiz still functions — it just advances instantly.

### 7b. Real buttons underneath

Answer tiles must be actual `<button>` elements, not divs. This gives
keyboard focus, Enter/Space activation, and screen reader support for
free. Style the button, do not replace it.

```html
<button class="answer-tile" type="button" data-index="2">
  Something linen or cotton, a little wrinkled, very much on purpose
</button>
```

Add `aria-live="polite"` to the question card container so screen
readers announce the new question after each advance.

### 7c. No-JS path

The pre-rendered HTML already contains the full article and all
result descriptions. That is the no-JS experience and it is
sufficient — the visitor can read every result even if the
interactive quiz never initialises. Do not add a `<noscript>` block
that hides content.

### 7d. Tap target size

Minimum 52px height per tile, minimum 44px between tap targets.
Do not shrink tiles to fit five on screen without scrolling; let the
list scroll if it must.

---

## 8. Performance budget

- Idle CPU while a question is displayed: near zero. If DevTools
  Performance shows sustained scripting during idle, the drift has
  been implemented in JS by mistake — move it to CSS.
- `quiz-engine.js` after minification: stay under 25KB.
- No layout thrash: animate only `transform` and `opacity`. Never
  animate `width`, `height`, `top`, or `left` on the tiles.
- Test on a throttled 4× CPU slowdown in DevTools before shipping.

---

## 9. Verification checklist

1. Disable JavaScript, load a quiz page — article, all result
   descriptions, and FAQ still visible in the rendered page
2. Enable JS, take a quiz — tiles drift subtly at rest
3. Press a tile — visible compression, then overshoot on release
4. Siblings fade out, selected tile expands, next question rises
5. Counter rolls from 04 to 05 rather than swapping
6. Progress bar overshoots and settles
7. Keyboard only: Tab to a tile, press Enter — advances correctly
8. Enable "Reduce motion" in OS settings — quiz still completable,
   no drift, instant advances
9. Throttle CPU 4× — interaction still responsive
10. Idle CPU near zero between questions
11. 380px viewport — no horizontal scroll, all tiles tappable
12. Zero console errors across all five quizzes
