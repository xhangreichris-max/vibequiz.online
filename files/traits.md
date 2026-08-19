# Phase 3 — Trait Data

Pure data entry into `quizzes-config.json`. No code changes.
This must be completed and verified before Phase 4, because the
Vibe Passport's archetype system reads these values.

---

## 1. Why traits exist

The five quizzes produce 10 × 10 × 8 × 8 × 8 = 51,200 possible
result combinations. Naming each combination is impossible.

Traits solve this. Each result carries two or three traits. When
someone completes quizzes, the traits are summed, the top two win,
and that pair maps to one of about a dozen named archetypes.

Deterministic, offline, no backend.

---

## 2. The fixed vocabulary

Every trait value must come from this list. Do not invent new ones —
the archetype matrix in `passport.md` is keyed to these exact words,
and an unrecognised trait silently breaks the mapping.

```
intellectual
nocturnal
romantic
chaotic
warm
precise
restrained
loud
curious
loyal
adaptable
intense
```

Twelve words. That is the whole vocabulary.

---

## 3. Schema

Add a `traits` array to every result object in every quiz:

```json
"dark_academia": {
  "name": "Dark Academia",
  "traits": ["intellectual", "nocturnal", "romantic"],
  "palette": { "...": "unchanged" },
  "signals": ["...unchanged"],
  "fragments": ["...unchanged"],
  "emoji": "...unchanged",
  "verdict": "...unchanged",
  "description": "...unchanged",
  "bio_line": "...unchanged"
}
```

Nothing else changes. Every existing field stays byte-identical.

---

## 4. Assignment rules

1. **Read the result's full description before assigning.** The
   traits must reflect what the description actually says, not what
   the result name suggests. The descriptions are the source of
   truth — they were written carefully and they contain the answer.

2. **Two or three traits per result.** Never one, never four.

3. **Spread them.** If eight of ten results carry `warm`, the
   archetype system returns the same answer for almost everyone and
   the feature is pointless. Aim for each trait appearing in roughly
   two to four results within a given quiz. Some traits will not
   appear in every quiz, which is fine.

4. **The two aesthetic quizzes share result IDs.** Use identical
   traits for the same ID in both `aesthetic-quiz` and
   `aesthetic-quiz-clothing`. If they differ, the two quizzes fight
   each other in the archetype calculation and the result feels
   random.

---

## 5. Locked assignments — the ten aesthetic results

Use these exactly, in both aesthetic quizzes. These are already
balanced against the archetype matrix; changing them will produce
lopsided archetype distribution.

```
cottagecore        warm         romantic     restrained
dark_academia      intellectual nocturnal    romantic
y2k                loud         chaotic      warm
soft_girl          warm         adaptable    romantic
grunge             intense      restrained   loyal
coquette           romantic     precise      intense
old_money          restrained   precise      intellectual
indie_sleaze       chaotic      curious      adaptable
clean_girl         precise      restrained   adaptable
cyber_futurism     intellectual precise      nocturnal
```

Trait counts across the aesthetic set: romantic 4, restrained 4,
precise 4, intellectual 3, warm 3, adaptable 3, chaotic 2,
intense 2, nocturnal 2, loud 1, curious 1, loyal 1. That spread is
deliberate.

---

## 6. Remaining assignments

Assign traits yourself for the twenty-four results in the other
three quizzes, following the rules in section 4. Read each
description first.

**what-food-am-i** — pizza, sushi, ramen, tacos, pasta, salad,
burger, dumplings

**what-bird-am-i** — owl, crow, hummingbird, flamingo, penguin,
hawk, sparrow, peacock

**what-dessert-am-i** — tiramisu, brownie, macaron, cheesecake,
soft_serve, creme_brulee, cinnamon_roll, dark_chocolate_truffle

A few worked examples to calibrate the reading, drawn from what the
descriptions actually say rather than the surface noun:

```
ramen        warm loyal intense
             (the description is about being the person people come
              to after hard weeks, and about feelings running deep)

crow         curious intellectual adaptable
             (collects interesting things, clever and sincere at
              once, engages with conflict by trying to understand it)

burger       restrained loyal
             (no pretense, reliable, low tolerance for things being
              made more complicated than they need to be — only two
              traits, which is allowed)

tiramisu     romantic intense precise
             (layered, improved by waiting, composed exterior with a
              considerable interior)
```

Note that `burger` gets two traits and that is correct. Do not pad
to three when the description does not support a third.

---

## 7. Verification

1. `python build.py` completes with no errors
2. Every result in every quiz has a `traits` array
3. No trait value falls outside the twelve-word vocabulary — grep
   for it rather than eyeballing
4. Output a table per quiz showing how many results carry each
   trait, so the spread can be checked
5. The ten aesthetic result IDs have identical traits in both
   aesthetic quizzes
6. Every other field in `quizzes-config.json` is unchanged —
   verify by hash comparison, not by spot-check

Report the four spread tables and confirmation of the six checks.

---

## 8. Do not change

Question text, weights, descriptions, verdicts, bio lines, palettes,
signals, fragments, emoji, article content, FAQ content, titles,
meta descriptions, H1s, intros, slugs, card titles, results labels,
theme colours, or the homepage content block.

Any code file.
