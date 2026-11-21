# Phase 6 — Internal Linking and Logo

Two unrelated changes bundled into one pre-launch phase because both
touch `template.html`/`template_index.html` and `build.py`, and
doing them separately would mean two rounds of touching the same
files.

Run as two sub-steps, each with its own gate and commit.

```
6a  Internal linking      build.py, quizzes-config.json, both templates
6b  Logo                  style.css, both templates
```

---

## 6a — Internal linking

### Why this exists

Footer-only links are the weakest link type Google recognises —
they read as boilerplate, similar to a privacy policy link, and pass
little authority. Header nav links are stronger but still read as
site-wide chrome rather than an editorial endorsement of relevance.
The strongest link type is a **contextual in-content link** — one
that appears inside the article or FAQ text, pointing at something
genuinely relevant to what the sentence is already saying. That is
what is currently missing entirely.

Right now every quiz page is an island. There is no path from one
quiz to another except scrolling to the footer, and the flagship
quiz — the one most likely to rank first and accumulate authority —
has no way to pass any of that authority to the other four.

### 6a-1 — Header navigation

Add a lightweight nav strip next to the logo, present on every page.
This exists for baseline crawlability and for users who arrive
partway down a page — it is not expected to carry much SEO weight on
its own.

```html
<nav class="site-nav" aria-label="All quizzes">
  <a href="/aesthetic-quiz/index.html">Aesthetic</a>
  <a href="/aesthetic-quiz-clothing/index.html">Clothing</a>
  <a href="/what-food-am-i/index.html">Food</a>
  <a href="/what-bird-am-i/index.html">Bird</a>
  <a href="/what-dessert-am-i/index.html">Dessert</a>
</nav>
```

Style: Space Grotesk, 12px, 500 weight, `var(--muted)` resting,
`var(--ink)` on hover, separated by a thin `var(--border)` vertical
rule or a middot. On the page the visitor is currently on, that
link's text colour becomes `var(--ink)` permanently and it loses the
hover underline — a simple "current page" state, computed in
`build.py` from the slug already available in the tokens dict.

At 380px this nav must not push the logo to a second line or cause
horizontal scroll. If five items do not fit comfortably, let it
scroll horizontally on mobile only:

```css
@media (max-width: 480px) {
  .site-nav {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}
```

### 6a-2 — Contextual links inside article and FAQ content

This is the part that actually matters for ranking. Every quiz gets
1–2 genuine mentions of another quiz, written into existing article
or FAQ copy, as a real anchor-text link — not a bolted-on "see also"
list.

The two aesthetic quizzes should link to each other, since they
share all ten results and are the most topically related pair on
the site. The other three should each link to at least one aesthetic
quiz, since that is the flagship and the page most likely to carry
authority worth distributing.

Add these as edits to existing article/FAQ body text in
`quizzes-config.json` — reword the sentence to carry the link
naturally, do not append a disconnected sentence:

**aesthetic-quiz** — in the FAQ or the "Can Your Aesthetic Change"
section, add a link to `aesthetic-quiz-clothing`. Existing FAQ text
already sets this up:
> "dark academia for the study setup, clean girl for the actual
> getting-dressed-and-leaving-the-house routine" — this sentence is
> already about clothing choices; the phrase "getting dressed" is a
> natural anchor for a link to the clothing quiz.

**aesthetic-quiz-clothing** — its FAQ already has the sentence
"How is this different from the general aesthetic quiz?" — the
answer text should link the words "general aesthetic quiz" back to
`aesthetic-quiz`. This is close to a direct link already, just
missing the `<a>` tag.

**what-food-am-i** — in "Why Food Says More About You Than You
Think", the existing line about patterns "stacked up across ten
questions" or similar can carry a link on a phrase like "the
aesthetics quiz maps a similar kind of pattern" — write one new
clause if no existing sentence fits naturally, but keep it under 20
words and keep the tone consistent with the rest of the article.

**what-bird-am-i** — same treatment, link to `aesthetic-quiz`.

**what-dessert-am-i** — same treatment, link to
`aesthetic-quiz-clothing` instead of the flagship, so link equity
does not pool entirely on one page.

Link styling: same colour as body text but with an underline, so it
reads as a link without visually breaking the editorial typography
Phase 5 just built. Do not use the accent colour for in-body links —
that violates the 5c rule that accent never appears on body-copy-
weight text.

```css
.section-body a,
.faq-item a {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--border);
  text-underline-offset: 2px;
}
.section-body a:hover,
.faq-item a:hover {
  text-decoration-color: currentColor;
}
```

### 6a-3 — Result screen cross-promotion

The Vibe Passport's "next uncompleted quiz" button already exists
from Phase 4, but it currently sits below the fold, after the vibe
fragments section. Move its visual prominence, not its DOM position
— the passport block's location in the render order must not change
relative to the fold rule Phase 4 already verified 5 does not apply
here since this is presentation only, not a section reorder.

Concretely: increase the button's visual weight (border becomes
`var(--accent)` instead of `var(--border)`, add a small arrow) so
that on the rare case a user does scroll to it, it reads as a strong
call to action rather than a passive progress widget. Do not attempt
to duplicate it above the fold — that would compete with the SHARE
button for primary attention, and share is the higher-value action
on a first-time visit.

### 6a gate

1. `python build.py` clean
2. JS disabled — confirm the new nav links and the new in-content
   links are present as real `<a href>` tags in the raw HTML on all
   five quiz pages and the homepage
3. Every one of the five quiz pages links to at least one other quiz
   from within article or FAQ body text — list which pages link to
   which in the report
4. No link uses the accent colour
5. Current-page nav item is visually distinct and does not link to
   itself in a way that creates a self-referencing `<a>` (either
   omit the href on the current item or point it at `#` — decide and
   report which)
6. 380px — nav does not break layout, scrolls horizontally if needed
7. Zero console errors
8. Universal gate from SKILL.md
9. Commit: `v2 phase 6a: internal linking`

---

## 6b — Logo

### Brief

The wordmark "vibequiz" currently renders as plain Fraunces at 28px,
lowercase, in the body font family question that Phase 5a already
resolved by moving all display type to Bodoni Moda. It needs to feel
designed, not typed.

### Direction

Keep it as text, not an image or SVG illustration — image assets are
against the site's constraints, and a text logo remains selectable,
accessible, and infinitely crisp at any size without an asset to
load.

Set "vibequiz" in Bodoni Moda at weight 700 (the top of the variable
range), lowercase throughout, with a tightened letter-spacing
(around -0.02em) so the bold weight does not feel loose at display
size. Bodoni Moda's high stroke contrast at a bold weight and large
size is the source of the personality here — this is exactly the use
case bold Bodoni exists for.

Add one small distinguishing mark: a single accent-coloured dot or
short mark after the wordmark, using the *current page's* per-quiz
accent from Phase 5c on quiz pages, and the aesthetic quiz's violet
`#8E79C9` on the homepage and any page with no quiz context. This
gives the logo a tiny bit of the site's per-quiz personality without
turning it into a different logo on every page.

```html
<a href="/" class="logo">vibequiz<span class="logo-mark">.</span></a>
```

```css
.logo {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
}
.logo-mark {
  color: var(--accent);
}
```

Because `--accent` is already scoped per quiz via the `:root:has()`
mechanism 5c built, this mark automatically picks up the right
colour with no extra logic — confirm this is actually true given the
final 5c implementation before assuming it, since 5c used
`:root:has()` rather than the originally planned body class.

On the homepage, where no `data-slug` exists, `--accent` should fall
back to the violet used by `aesthetic-quiz`. Confirm this fallback
already exists from 5c's token setup; if `--accent` is undefined on
the homepage today, define it at `:root` as that same violet so the
mark is never colourless there.

Header logo stays at 28px on all pages. Do not shrink it in the new
nav strip from 6a — the nav sits beside it, not competing with it
for size.

### 6b gate

1. `python build.py` clean
2. Logo renders in Bodoni Moda 700, lowercase, tight tracking, on
   homepage and all five quiz pages
3. The accent mark colour matches each page's own per-quiz accent
   from 5c, and matches the aesthetic violet on the homepage
4. Logo remains a real link to `/` with visible focus state for
   keyboard users
5. 380px — logo and new nav strip from 6a do not overlap or wrap
   awkwardly
6. No layout shift introduced on any page
7. Zero console errors
8. Commit: `v2 phase 6b: logo`

---

## After 6a and 6b

Run the universal gate one final time, then proceed to the launch
sequence in `references/launch-and-roadmap.md` section 1.
