# V2 Feature 3 — Vibe Passport

Goal: give someone a reason to take all five quizzes and come back
later. No accounts, no email, no backend. localStorage only.

---

## 1. The framing

Five unrelated results are forgettable. Five *dimensions of one
identity* are not. The passport reframes the quizzes as facets of a
single profile.

| Quiz | Dimension |
|---|---|
| aesthetic-quiz | ATMOSPHERE |
| aesthetic-quiz-clothing | EXPRESSION |
| what-food-am-i | COMFORT |
| what-bird-am-i | ENERGY |
| what-dessert-am-i | INDULGENCE |

Displayed as:

```
01  ATMOSPHERE    Dark Academia
02  EXPRESSION    Indie Sleaze
03  COMFORT       Ramen
04  ENERGY        Crow
05  INDULGENCE    ———
```

Completing all five unlocks an archetype (section 4).

---

## 2. Storage schema

One key, one JSON object. Keep it small and versioned so future
changes do not break old data.

```js
// localStorage key: "vq_passport"
{
  "v": 1,
  "results": {
    "aesthetic-quiz":           { "id": "dark_academia", "at": 1755500000000 },
    "aesthetic-quiz-clothing":  { "id": "indie_sleaze",  "at": 1755500400000 },
    "what-food-am-i":           { "id": "ramen",         "at": 1755500900000 },
    "what-bird-am-i":           { "id": "crow",          "at": 1755501200000 }
  }
}
```

Write on every completed quiz. Overwrite the entry for that quiz if
it already exists — a retake replaces the old result, it does not
append.

Read/write helpers must be defensive. localStorage throws in Safari
private mode and when the quota is full:

```js
function readPassport() {
  try {
    const raw = localStorage.getItem('vq_passport');
    if (!raw) return { v: 1, results: {} };
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || typeof data.results !== 'object') {
      return { v: 1, results: {} };
    }
    return data;
  } catch (e) {
    return { v: 1, results: {} };
  }
}

function writePassport(data) {
  try {
    localStorage.setItem('vq_passport', JSON.stringify(data));
  } catch (e) {
    /* private mode or quota — fail silently, feature just degrades */
  }
}
```

If storage is unavailable the passport simply never appears. Nothing
else breaks.

Do not write to the passport on a shared-link (`?r=`) view. The
visitor did not earn that result.

---

## 3. Where it appears

### 3a. On the result screen

Below the action row, above the "YOU PROBABLY…" fragments. Compact:

```
YOUR VIBE PASSPORT              3 / 5

●  ATMOSPHERE   Dark Academia
●  EXPRESSION   Indie Sleaze
●  COMFORT      Ramen
○  ENERGY       not yet
○  INDULGENCE   not yet

              2 more unlocks your archetype

        [ WHAT BIRD ARE YOU? → ]
```

The button links to the next uncompleted quiz. This is the single
most important element in the whole feature — it is the thing that
turns a one-quiz visit into a three-quiz session. Style it as a
secondary action, not competing with SHARE.

Completed rows show the result name in `var(--ink)` with a filled
dot in that result's primary palette colour. Incomplete rows are
`var(--muted)` with a hollow dot.

### 3b. On the homepage

If the passport has at least one entry, insert a strip directly below
the flagship card:

```
YOUR VIBE PASSPORT          3 / 5   ████████░░
```

Tapping it scrolls to or expands the full passport. If the passport
is empty, render nothing — a new visitor should not see an empty
progress widget.

This block is injected by JavaScript, which is fine: it is personal
state, not SEO content.

### 3c. Card completion state

On homepage quiz cards for quizzes already completed, add a small
marker in the corner — the result name in 10px uppercase, in that
result's colour. It turns the grid into a record of what the visitor
has done.

---

## 4. The archetype payoff

51,200 result combinations exist (10 × 10 × 8 × 8 × 8). Naming each
one is impossible. Derive the archetype from traits instead.

### 4a. Add traits to config

Every result in `quizzes-config.json` gets a `traits` array of two
or three values drawn from a fixed vocabulary:

```
Fixed trait vocabulary (do not add to this without updating the matrix):
intellectual, nocturnal, romantic, chaotic, warm, precise,
restrained, loud, curious, loyal, adaptable, intense
```

Examples:

```json
"dark_academia":  { "traits": ["intellectual", "nocturnal", "romantic"] }
"y2k":            { "traits": ["loud", "chaotic", "warm"] }
"clean_girl":     { "traits": ["precise", "restrained"] }
"cottagecore":    { "traits": ["warm", "romantic", "restrained"] }
"grunge":         { "traits": ["intense", "restrained", "loyal"] }
"crow":           { "traits": ["curious", "intellectual", "adaptable"] }
"ramen":          { "traits": ["warm", "loyal", "intense"] }
"tiramisu":       { "traits": ["romantic", "intense", "precise"] }
```

Fill in all 44 results (10 + 10 + 8 + 8 + 8) using the same
vocabulary. Two or three traits each.

### 4b. Compute the archetype

```js
function computeArchetype(passport, allResultsByQuiz) {
  const counts = {};
  for (const [slug, entry] of Object.entries(passport.results)) {
    const traits = allResultsByQuiz[slug]?.[entry.id]?.traits || [];
    traits.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  }
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(x => x[0])
    .sort();                       // sort so pairs are order-independent
  return ARCHETYPES[top.join('+')] || ARCHETYPES._default;
}
```

Deterministic tiebreak by alphabetical trait name, so the same
passport always yields the same archetype.

### 4c. The archetype matrix

Twelve to sixteen entries covering the likely trait pairs, plus a
fallback. Each has a name and a one-line description.

```js
const ARCHETYPES = {
  'intellectual+nocturnal': {
    name: 'THE MIDNIGHT CURATOR',
    line: 'You romanticise ordinary moments and make poor sleep look intentional.'
  },
  'chaotic+warm': {
    name: 'THE HUMAN BONFIRE',
    line: 'People gather around you and nobody is entirely sure how it started.'
  },
  'precise+restrained': {
    name: 'THE QUIET ARCHITECT',
    line: 'Everything you touch ends up slightly better organised than you found it.'
  },
  'intense+loyal': {
    name: 'THE DEEP END',
    line: 'You do not do casual, and the people who know that are the people who matter.'
  },
  'curious+adaptable': {
    name: 'THE SIDE QUEST',
    line: 'You went out for one thing and came back with a story.'
  },
  'loud+romantic': {
    name: 'THE GRAND GESTURE',
    line: 'Subtlety was an option and you considered it briefly.'
  },
  'romantic+warm': {
    name: 'THE SLOW SUNDAY',
    line: 'You take the long route because the long route is the point.'
  },
  'intellectual+precise': {
    name: 'THE FOOTNOTE',
    line: 'You have been right about something obscure for years and rarely mention it.'
  },
  'nocturnal+intense': {
    name: 'THE LATE SIGNAL',
    line: 'Your best thinking happens after everyone else has logged off.'
  },
  'adaptable+warm': {
    name: 'THE SOFT LANDING',
    line: 'Rooms get easier when you walk into them and nobody can explain why.'
  },
  'chaotic+curious': {
    name: 'THE OPEN TAB',
    line: 'You started three things this week and two of them are going somewhere.'
  },
  'loyal+restrained': {
    name: 'THE STANDING OFFER',
    line: 'You show up without announcing it and keep doing it long after anyone thanked you.'
  },
  _default: {
    name: 'THE UNCATEGORISED',
    line: 'Your combination is rare enough that we are still deciding what to call it.'
  }
};
```

Write the remaining pairs in the same voice — specific, observational,
slightly teasing. No horoscope language.

### 4d. The unlock screen

Shown once, immediately after the fifth quiz completes, before the
normal result screen:

```
        YOU FOUND YOUR
        VIBE COMBINATION

  01  ATMOSPHERE    Dark Academia
  02  EXPRESSION    Indie Sleaze
  03  COMFORT       Ramen
  04  ENERGY        Crow
  05  INDULGENCE    Tiramisu

        ──────────────

        THE MIDNIGHT CURATOR

  You romanticise ordinary moments and
  make poor sleep look intentional.

        [ SHARE MY VIBE DNA → ]
        [ SEE MY DESSERT RESULT ]
```

Fits in one 390×844 viewport without scrolling. That is the
screenshot.

Background uses the ATMOSPHERE result's palette, so the whole screen
is tinted by the person's aesthetic.

Store `"archetype_seen": true` in the passport so it never
auto-replays. It remains reachable from the homepage passport strip.

### 4e. Sharing the archetype

Encode the full passport in the URL:

```
vibequiz.online/?dna=dark_academia.indie_sleaze.ramen.crow.tiramisu
```

On load, if `?dna=` is present, render the archetype screen directly
from the URL without touching localStorage, plus a
"BUILD YOUR OWN →" button linking to the flagship quiz.

Validate every segment against known result IDs. Any invalid segment
means the whole parameter is ignored and the normal homepage loads.
Never crash on a malformed parameter.

---

## 5. Return visitor behaviour

Keep this minimal for V2. One thing only:

If the passport has entries but is incomplete, and the last entry is
more than seven days old, the homepage passport strip reads:

```
YOUR VIBE PASSPORT     3 / 5     pick up where you left off →
```

No streaks, no XP, no daily rewards, no notifications. Those systems
add complexity without adding desire on a site this size.

---

## 6. Verification checklist

1. Complete one quiz — passport appears on the result screen showing
   1/5 and a button to the next quiz
2. That button goes to an uncompleted quiz, never a completed one
3. Complete a second quiz — passport shows 2/5, both rows filled
4. Retake the first quiz with different answers — the entry is
   replaced, count stays at 2/5, not 3/5
5. Reload the browser — passport persists
6. Homepage shows the passport strip and completed-card markers
7. Complete all five — archetype unlock screen appears once, fits in
   one 390×844 viewport with no scrolling
8. Reload — the unlock screen does not replay
9. The archetype is stable: same five results always give the same
   archetype name
10. Share the `?dna=` URL in a new browser profile — archetype
    renders, "BUILD YOUR OWN →" present, nothing written to that
    browser's localStorage
11. Malformed `?dna=garbage.values` — normal homepage loads, no
    console error
12. Safari private browsing — quiz works normally, passport silently
    absent, no console error
13. Arriving via `?r=` shared result does not write to the passport
14. Disable JS — article, result descriptions, FAQ still present;
    passport simply absent
