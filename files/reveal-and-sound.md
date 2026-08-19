# V2 Feature 2 — Card Flip Reveal + Sound System

Goal: the result should feel earned, not displayed. Right now it
just appears. In games, the reveal is the payoff.

---

## 1. Why card flip and not the orbit collapse

The "answers collapse into the result" concept is more spectacular
but it is high complexity, depends on tracking every answer's screen
position, and breaks badly if any part fails. The card flip achieves
most of the emotional payoff at a fraction of the risk, and it has a
property the collapse does not: the card can show the result's
colour palette *before* revealing the name, so the user
subconsciously senses what is coming.

---

## 2. The reveal sequence

Total duration: about 1.9 seconds. Long enough to build anticipation,
short enough that it never feels like loading.

```
   0ms   last answer selected, question card exits
 200ms   screen clears to background colour
 300ms   card appears face-down, centred
         card back shows the winning result's three palette colours
         as soft diagonal bands, plus the text "YOUR VIBE"
 300ms   card does a small idle wobble: rotate(-1deg) → rotate(1deg)
   ↓     three cycles, 220ms each
 960ms   flip begins
 960ms   rotateY(0) scale(1)
1180ms   rotateY(75deg) scale(1.05)   ← midpoint: haptic + sound + flash
1400ms   rotateY(180deg) scale(1)
1400ms   card face now shows result name in Fraunces
1500ms   palette floods outward from the card into the moodboard header
1900ms   full result screen settled, share button in position
```

### Card back markup

```html
<div class="reveal-card" aria-hidden="true">
  <div class="reveal-card-back">
    <span class="reveal-label">YOUR VIBE</span>
  </div>
  <div class="reveal-card-face">
    <span class="reveal-eyebrow">APPARENTLY, YOU'RE</span>
    <span class="reveal-name">Dark Academia</span>
  </div>
</div>
```

### Card back styling

Build the diagonal bands from the winning result's `palette.bg`
array, which already exists in config:

```css
.reveal-card-back {
  background: linear-gradient(
    135deg,
    var(--p1) 0%,   var(--p1) 38%,
    var(--p2) 38%,  var(--p2) 68%,
    var(--p3) 68%,  var(--p3) 100%
  );
}
```

Set `--p1`, `--p2`, `--p3` inline on the card element from the
result's palette before the reveal starts.

### Flip mechanics

```css
.reveal-card {
  transform-style: preserve-3d;
  perspective: 1200px;
  transition: transform 440ms cubic-bezier(.4, .1, .3, 1);
}
.reveal-card.is-flipping { transform: rotateY(180deg) scale(1); }
.reveal-card-back,
.reveal-card-face { backface-visibility: hidden; }
.reveal-card-face { transform: rotateY(180deg); }
```

Use `scale(1.05)` at the midpoint via a Web Animations keyframe
rather than a plain transition, so the card lifts as it turns.

### Midpoint moment

At 1180ms, three things fire together:

- `navigator.vibrate?.(18)`
- The result sound (see section 4)
- A one-frame white flash overlay at 12% opacity, fading out over
  180ms

That simultaneity is what makes the flip land.

---

## 3. The shared-link edge case — critical

The site already supports `?r=result_id` URLs. A visitor arriving on
one of those links has not answered anything. Playing a 1.9-second
reveal for a result they did not earn is confusing and slow.

**Rule: shared links skip the reveal entirely.**

```js
const isSharedResult = new URLSearchParams(location.search).has('r');

if (isSharedResult) {
  renderResult(resultId, { animate: false });   // instant
} else {
  playReveal(resultId).then(() => renderResult(resultId, { animate: true }));
}
```

On the shared-link path, the existing "TAKE THE QUIZ YOURSELF →"
button stays exactly where it is, above the moodboard. Do not change
that behaviour.

Same rule applies to the "RETAKE" flow: a retake *does* replay the
reveal, because the user answered again.

---

## 4. Sound system

### 4a. Default is OFF

This is a deliberate disagreement with conventional game-feel advice.
The audience is 16–26 and frequently browsing on a phone in public.
Unexpected audio causes an immediate close. The upside of
sound-on-by-default does not outweigh that.

Instead: on the first question of any quiz, show a small, tasteful
control in the top-right corner reading `SOUND OFF`. Tapping it
enables sound and it becomes `SOUND ON`. Persist the choice:

```js
localStorage.setItem('vq_sound', 'on');   // or 'off'
```

Read it on load. Never prompt again once the user has chosen.

### 4b. No audio files — procedural only

Web Audio API oscillators. Zero network requests, zero assets, a few
hundred bytes of code.

```js
let ctx = null;

function ensureAudio() {
  // MUST be called from inside a user gesture handler,
  // otherwise the context stays suspended and everything is silent
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, durationMs, type = 'sine', gainPeak = 0.06) {
  const c = ensureAudio();
  if (!c || localStorage.getItem('vq_sound') !== 'on') return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);

  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationMs / 1000);

  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + durationMs / 1000);
}
```

### 4c. The sound palette

| Event | Sound |
|---|---|
| Answer selected | `tone(520 + index * 40, 55, 'sine', 0.05)` — pitch rises with the answer's position, so the quiz has a subtle melodic quality |
| Every 4th question | `tone(660, 70, 'triangle', 0.04)` — a quiet checkpoint tick |
| Reveal midpoint | Three-stage: `tone(220, 120, 'sine')`, then `tone(440, 160, 'sine')` at +100ms, then `tone(880, 220, 'triangle', 0.05)` at +240ms |
| Sound toggled on | `tone(660, 90, 'sine', 0.05)` so the user hears confirmation immediately |

Keep peak gain at or below 0.06. It should feel like a UI, not a
game console.

### 4d. Autoplay policy

`AudioContext` created outside a user gesture is born suspended and
stays silent. `ensureAudio()` must only ever be called from inside a
click, pointerdown, or keydown handler. The sound toggle tap is the
natural first gesture — creating the context there is correct.

---

## 5. Reduced motion

When `prefers-reduced-motion: reduce` is set:

- Skip the flip entirely, render the result instantly
- Still fire the haptic and the sound if sound is enabled
- Do not skip the sound; motion sensitivity and audio preference are
  unrelated

---

## 6. What must not change

The result screen layout below the moodboard header is already
correct and verified. The reveal is a layer that plays *before* it.
Do not reorder or restyle:

```
moodboard header
verdict line
signal tags
rarity line
action row (share / retake / all vibes)
─── fold ───
"YOU PROBABLY…" fragments
score breakdown
full description
timestamp footer
```

The full description and the pre-rendered "All Results" section stay
in the HTML. The reveal never removes them from the DOM — it only
sits on top until it finishes.

---

## 7. Verification checklist

1. Complete a quiz normally — card appears face-down showing the
   winning palette, wobbles, flips, name revealed
2. Haptic and flash fire at the flip midpoint
3. Palette floods into the moodboard after the flip
4. Total reveal duration is roughly 1.9s, never feels like loading
5. Open a `?r=cottagecore` link — result appears instantly, no
   reveal, "TAKE THE QUIZ YOURSELF →" button present
6. Press RETAKE, complete again — reveal plays
7. Sound toggle: default reads `SOUND OFF`, tapping it plays a
   confirmation tone and switches to `SOUND ON`
8. Reload the page — the sound preference persisted
9. With sound on, answers produce rising pitches; reveal produces
   the three-stage sound
10. With sound off, the entire experience is silent including the
    reveal
11. Enable OS reduce-motion — result renders instantly, no flip,
    sound still works if enabled
12. Disable JS — article, all result descriptions, FAQ still present
13. Zero console errors, including on browsers without
    `webkitAudioContext`
