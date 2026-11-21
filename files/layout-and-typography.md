# Phase 5 — Layout and Typography

The site currently works but looks like a mobile page centred on a
desktop screen. On a wide viewport roughly 70% of the canvas is
empty cream and the article reads as an unbroken wall of body copy.

This phase fixes structure and type. It does not add features.

Run the four sub-steps in order. Each has its own gate and its own
commit. Do not run them as one change — this phase touches nearly
every file and a single failed commit would be hard to unpick.

```
5a  Typography swap              style.css, template.html, template_index.html
5b  Desktop article layout       style.css, build.py
5c  Per-quiz art direction       style.css, build.py
5d  Question layout templates    style.css, quiz-engine.js
```

---

## What must not break

Everything in this list is already built and verified. Phase 5 is
presentation only.

- **Result screen section order** below the moodboard header stays
  exactly as it is
- **The reveal card** is 220×220px with a 60px top margin and uses
  the existing moodboard type sizes. If the type scale changes,
  the card must still fit and still centre at 380px
- **Moodboard header** is 220px tall on mobile. It may grow on
  desktop but must not shrink
- **The four non-negotiables** in SKILL.md, especially: all article
  and FAQ text stays in the raw HTML at build time
- **`quiz-engine.js` is 23.7KB minified against a 25KB budget.**
  Only 5d touches it. Keep that addition under 1KB, and report the
  new size

---

## 5a — Typography

### The fonts

Replace Fraunces and Inter with:

**Bodoni Moda** — display only. Variable 400–700, with an optical
size axis. High contrast thick-to-thin strokes that read as
dramatic at large sizes and stay legible at small ones because of
the optical sizing.

**Space Grotesk** — everything else. Variable 400–700. Slightly
quirky rather than neutral, which gives the interface tension
against the serif.

Two families total, under the three-family limit.

### Why not the alternatives

Instrument Serif and DM Serif Display were both considered and
rejected: each ships a single weight of 400 with no bold, and bold
display type is a requirement. Playfair Display is bold-capable but
appears on a very large number of template sites. Bodoni Moda is
less common and more distinctive.

### Loading

In both `template.html` and `template_index.html`, replace the
existing font links with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Space+Grotesk:wght@400..700&display=swap">
```

`display=swap` prevents invisible text during load. Accept the
brief fallback flash — it is better than blank text on a slow
Android connection.

Reduce layout shift with a metric-similar fallback stack:

```css
:root {
  --font-display: 'Bodoni Moda', 'Didot', Georgia, serif;
  --font-body: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
}
```

### The rule that matters most

**Bodoni Moda is never used below 20px.** Its thin strokes
disappear at small sizes and it becomes hard to read on a phone.
Everything under 20px is Space Grotesk. No exceptions.

### Type scale

```
QUESTION TEXT               display
  desktop   34px / 1.15 / 500
  mobile    26px / 1.20 / 500

ANSWER TILE                 body
  desktop   15px / 1.45 / 500
  mobile    15px / 1.45 / 500

RESULT NAME (moodboard)     display
  desktop   42px / 1.00 / 600
  mobile    32px / 1.05 / 600
  max 2 lines, wrap allowed

REVEAL CARD LABEL           body
  11px / 1 / 700 / 0.12em tracking

ARTICLE SECTION NUMBER      display
  desktop   64px / 0.85 / 700
  mobile    40px / 0.85 / 700

ARTICLE H2                  display
  desktop   26px / 1.20 / 600
  mobile    22px / 1.25 / 600

ARTICLE BODY                body
  desktop   17px / 1.70 / 400
  mobile    16px / 1.70 / 400

FAQ QUESTION                body
  desktop   17px / 1.40 / 600
  mobile    16px / 1.40 / 600

FAQ ANSWER                  body
  16px / 1.70 / 400

SMALL LABEL                 body
  11px / 1 / 700 / 0.10em tracking / uppercase

HOMEPAGE LOGO               display
  28px / 1 / 600

CARD TITLE (homepage)       display
  flagship   24px / 1.15 / 600
  secondary  17px / 1.25 / 600
```

Note the result name is 42px, not the 88px an art director would
reach for. That constraint comes from the reveal card and the
220px moodboard header, both of which are already verified.
"Dark Chocolate Truffle" at 32px on a 380px screen wraps to two
lines and fits. At 88px it would not.

### 5a gate

1. `python build.py` clean
2. Both fonts load — check the Network tab, no 404s
3. Nothing anywhere on the site renders Bodoni Moda below 20px
4. Result name fits without overflow at 380px on the longest
   result name in the config (`dark_chocolate_truffle`)
5. Reveal card still 220×220 and still centres
6. Moodboard header still at least 220px tall
7. Take one quiz end to end on each of the five pages
8. 380px, no horizontal scroll
9. Zero console errors
10. Commit: `v2 phase 5a: typography`

---

## 5b — Desktop article layout

The quiz interaction stays centred and compact. The physical answer
tiles were designed for a controlled width and splitting them
across a wide screen adds eye travel for no gain.

The article is where the desktop problem actually is.

### Two containers, two behaviours

```css
.quiz-container {
  max-width: 620px;
  margin: 0 auto;
  padding: 0 20px;
}

.article-grid {
  display: grid;
  grid-template-columns: 96px minmax(0, 640px);
  column-gap: 40px;
  max-width: 776px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 800px) {
  .article-grid {
    grid-template-columns: 1fr;
    row-gap: 0;
  }
}
```

The section number lives in column one and hangs in the margin.
Content lives in column two. On mobile the grid collapses and the
number sits above its heading.

Wireframe at 1280px:

```
┌──────────────────────────────────────────────────────────┐
│  vibequiz                                    01 / 12     │
│                                                          │
│                  WHAT'S YOUR AESTHETIC?                  │
│                                                          │
│              It's 11pm and you can't sleep.              │
│              You're probably...                          │
│                                                          │
│              ┌────────────────────────────┐              │
│              │ Reading something with...  │              │
│              └────────────────────────────┘              │
│              ┌────────────────────────────┐              │
│              │ Rewatching a show...       │              │
│              └────────────────────────────┘              │
│                                                          │
│              ● ● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│      01    WHAT IS AN AESTHETIC                          │
│            ──────────────────────────────────────        │
│                                                          │
│            I f you've ever typed what is my              │
│            aesthetic into a search bar at                │
│            midnight, you already understand              │
│            the concept better than any                   │
│            definition will explain it.                   │
│                                                          │
│      02    HOW THIS AESTHETIC QUIZ WORKS                 │
│            ──────────────────────────────────────        │
│                                                          │
│            This aesthetic quiz asks you twelve           │
│            questions about real situations...            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Editorial devices

**Numbered sections.** `build.py` already renders article sections
from config in order. Add a zero-padded index automatically — no
config change needed.

```html
<section class="article-section">
  <span class="section-number">01</span>
  <div class="section-body">
    <h2>What Is an Aesthetic</h2>
    <p>…</p>
  </div>
</section>
```

**Rule under each heading.** A 1px line in the quiz's accent colour,
full width of the content column, 16px below the H2.

**Drop cap on the first paragraph of each section.** Use
`::first-letter`, never `float: left` — float causes wrapping bugs
on narrow screens and confuses some screen readers.

```css
.section-body > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 3.4em;
  font-weight: 600;
  line-height: 0.82;
  float: left;
  padding: 0.06em 0.08em 0 0;
}
@media (max-width: 800px) {
  .section-body > p:first-of-type::first-letter {
    font-size: 2.8em;
  }
}
```

**Pull quote.** Optional, one per quiz. Add a `pull_quote` string
field to each quiz entry in `quizzes-config.json` — that is the one
config change this phase makes. If the field is absent, render
nothing.

Render it after the second article section:

```html
<blockquote class="pull-quote" aria-hidden="true">
  An aesthetic is a shorthand for a whole way of seeing things.
</blockquote>
```

`aria-hidden="true"` matters: the sentence already exists in the
article body, and without it a screen reader announces it twice.

Style it at 24px display, 1.35 line height, accent-coloured
opening mark, generous vertical margin.

**FAQ hierarchy.** Number the questions the same way as sections,
so the FAQ reads as designed information rather than an SEO
appendix.

```
FAQ
────

01   Is this aesthetic quiz actually accurate?
     It's accurate in the sense that…

02   Can I be two aesthetics at once?
     Completely. Most people are…
```

### 5b gate

1. `python build.py` clean
2. **JavaScript disabled** — article text, all result descriptions,
   and FAQ all still visible. This is the gate that protects the
   business
3. Section numbers hang in the left margin at 1280px
4. Grid collapses to one column below 800px with the number above
   its heading
5. Drop cap renders and does not break paragraph wrapping at 380px
6. Pull quote renders where a `pull_quote` field exists and is
   skipped cleanly where it does not
7. Body line length between 60 and 75 characters at 1280px
8. FAQ numbering renders on all five quizzes
9. 380px, no horizontal scroll
10. Commit: `v2 phase 5b: desktop article layout`

---

## 5c — Per-quiz art direction

Five quizzes should feel like five issues of the same magazine, not
five unrelated sites.

### What stays constant

Logo, footer, background colour, body font, answer tile physics,
progress behaviour, reveal mechanism, article architecture, spacing
scale.

### What changes per quiz

Accent colour, border radius, rule weight, label vocabulary.

### Background stays `#FAF6F0` on every quiz

This is deliberate and it overrides the instinct to tint each quiz.
Two reasons: the reveal floods the result palette over the
background, and a different base per quiz means different contrast
behaviour on every one of the 44 results. Second, body copy on a
tinted identity surface risks the 4.5:1 contrast floor.

Identity comes from accent, geometry, and type rhythm. Not
background.

### Tokens

`build.py` adds a class to `<body>` derived from the slug:
`theme-aesthetic`, `theme-clothing`, `theme-food`, `theme-bird`,
`theme-dessert`. No config change needed — derive it from the slug
that already exists.

```css
body.theme-aesthetic {
  --accent: #8E79C9;
  --radius: 10px;
  --rule: 1px;
}
body.theme-clothing {
  --accent: #B53A62;
  --radius: 2px;
  --rule: 1px;
}
body.theme-food {
  --accent: #E56B3F;
  --radius: 16px;
  --rule: 2px;
}
body.theme-bird {
  --accent: #72845C;
  --radius: 4px;
  --rule: 1px;
}
body.theme-dessert {
  --accent: #C45A83;
  --radius: 20px;
  --rule: 2px;
}
```

The radius difference alone does a lot of work: clothing reads
sharp and fashion-system, food and dessert read soft and warm, bird
reads like a field notebook.

### Accent usage rule — mandatory

Accents at these values sit between 3:1 and 4.8:1 against
`#FAF6F0`. That is enough for rules, marks, and large bold text.
It is not enough for body copy.

Accents may be used for: horizontal rules, section numbers, the
selected answer tile border, small bold labels at 14px or above,
the pull quote mark, progress dots, and link underlines.

Accents may never be used for: body paragraphs, FAQ answers, result
descriptions, or any run of text below 14px.

Verify each accent against `#FAF6F0` with a contrast checker before
committing, and record the ratios in the report.

### Label vocabulary

A small per-quiz label above each question, in the accent colour:

```
aesthetic   VIBE 04
clothing    LOOK 04
food        COURSE 04
bird        FIELD NOTE 04
dessert     COURSE 04
```

Hardcode the prefix against the theme class in `build.py` or in
`quiz-engine.js`, whichever is cleaner given where the question
markup is assembled.

### 5c gate

1. `python build.py` clean
2. Each of the five pages carries the correct `theme-*` body class
3. Border radius visibly differs between clothing (sharp) and
   dessert (soft)
4. Accent colour differs on all five
5. Contrast ratios recorded in the report for all five accents
6. No body copy anywhere uses an accent colour
7. Per-quiz question label renders with the correct prefix
8. Reveal still works on all five — palette flood still reads
   correctly against the unchanged background
9. 380px, no horizontal scroll
10. Commit: `v2 phase 5c: per-quiz art direction`

---

## 5d — Question layout templates

Twelve questions in an identical frame feels like a form. Rotating
between a few compositions makes it feel authored.

### The constraint that shapes this

Do not change colour between questions. Every result already owns a
palette, and the reveal card teases that palette before flipping.
If the user has cycled through twelve colour schemes during the
questions, the reveal has nothing left to surprise them with.

Change composition, type scale, and alignment. Keep the interaction
palette neutral and constant:

```css
--quiz-bg: #FAF6F0;
--quiz-ink: #1C1A17;
--quiz-muted: #8B857D;
--quiz-line: #DDD6CD;
```

Plus the quiz's single accent from 5c.

### Four templates, cycled by index

`quiz-engine.js` adds a class to the question card based on
`index % 4`.

**Template A — `q-layout-a`** (indices 0, 4, 8)
Label above, question left-aligned at the standard size.

```
VIBE 01

It's 11pm and you can't sleep.
You're probably...

[ answer ]
[ answer ]
```

**Template B — `q-layout-b`** (indices 1, 5, 9)
No label. Question larger, centred, more space above and below.

```

    Someone hands you a
    disposable camera.
    Your first shot is...

[ answer ]
[ answer ]
```

**Template C — `q-layout-c`** (indices 2, 6, 10)
Small label, question left, accent rule underneath the question.

```
VIBE 03
Your notes app is full of...
────────────────────────────

[ answer ]
[ answer ]
```

**Template D — `q-layout-d`** (indices 3, 7, 11)
Oversized question number hanging left, question beside it.

```
04    You're decorating your
      room from scratch. The
      first thing you buy is...

      [ answer ]
      [ answer ]
```

Template D collapses to Template A's arrangement below 800px — the
hanging number does not fit on a phone.

### Size discipline

`quiz-engine.js` is at 23.7KB of a 25KB budget. This change should
be a single class assignment on render:

```js
card.className = 'question-card q-layout-' + 'abcd'[index % 4];
```

Everything else is CSS. If the addition exceeds 1KB minified,
something has been implemented in JS that belongs in CSS.

### 5d gate

1. `python build.py` clean
2. Take a 12-question quiz and confirm all four templates appear
   and cycle in order
3. Take a 10-question quiz and confirm the cycle still works
   without gaps
4. Template D collapses correctly below 800px
5. No colour changes between questions — only composition
6. `prefers-reduced-motion` still works; template changes are
   layout, not animation, so they remain active
7. Keyboard navigation works in all four templates
8. `quiz-engine.js` minified size reported and still under 25KB
9. 380px, no horizontal scroll in any template
10. Zero console errors
11. Commit: `v2 phase 5d: question layout templates`

---

## After 5d

Run the universal gate from SKILL.md one final time, then take all
five quizzes end to end on a real phone before pushing.

The single check that matters most: disable JavaScript, load each
quiz page, confirm the article, all result descriptions, and the
FAQ are still there. Phase 5 touched `build.py` and both templates,
which is exactly where that could silently break.
