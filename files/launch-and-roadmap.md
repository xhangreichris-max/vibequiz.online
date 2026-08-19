# Launch, Roadmap, and Strategy

Not a build phase. Read this when the question is about what to do
next rather than how to build something.

---

## 1. Launch sequence (V1, before any V2 work)

V1 ships first. V2 is built on a live, indexed site.

**Create the repo.** On github.com: New repository → name
`vibequiz.online` → Public → do not add README, .gitignore, or
licence.

**Push.**

```bash
cd c:\Users\chris\OneDrive\Desktop\vibequiz.online
git init
git add .
git commit -m "initial commit: vibequiz.online v1"
git branch -M main
git remote add origin https://github.com/USERNAME/vibequiz.online.git
git push -u origin main
```

**Confirm Actions.** Repo → Actions tab → the deploy workflow should
run green and create a `gh-pages` branch.

**DNS at Namecheap.**

```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  USERNAME.github.io
```

**GitHub Pages settings.** Repo → Settings → Pages → Source:
`gh-pages` branch → Custom domain: `vibequiz.online` → Save. Wait for
DNS to resolve, which can take up to 48 hours, then tick "Enforce
HTTPS".

**Swap the GA4 ID.** Find `G-XXXXXXXXXX` in `template.html` and
`template_index.html`, replace with the real measurement ID, rebuild,
push.

**Google Search Console, the same day.**

- Add property `vibequiz.online`, verify via DNS TXT record
- Submit sitemap: `https://vibequiz.online/sitemap.xml`
- URL Inspection → Request Indexing on all six URLs

Do not defer the last step. RuneForge sat in "crawled, not indexed"
limbo because indexing was requested late.

---

## 2. Post-launch timeline

```
Week 0        Launch. GSC set up. Indexing requested.
Week 1–2      Nothing. Let it settle. Build V2 meanwhile.
Week 3–4      First GSC impressions. Note which page moves first.
Week 4–6      Ship V2. No re-indexing needed, content is unchanged.
Week 6–8      Semrush session for the next 2–3 quizzes, chosen
              based on which existing quiz is actually gaining.
Month 3+      Add 2–3 new quizzes per month. Never in bulk.
```

Bulk-publishing ten or more new pages on a young domain reads as a
content farm. Steady drip is safer.

---

## 3. Next-quiz research list

Run through Keyword Magic, US database, KD ≤ 20, volume ≥ 300. Then
a live SERP check on anything that passes, before building.

```
what season am i quiz          2,900 vol, KD 20 — split intent, verify carefully
room aesthetic quiz            170 vol, KD 16
bedroom aesthetic quiz         110 vol, KD 13
wedding aesthetic quiz         140 vol, KD 10, $1.76 CPC — affiliate angle
what cat am i                  880 vol, KD 24
crush quiz                     1,300 vol, KD 25
what color am i                2,400 vol, KD 32 — later, needs authority
friendship quiz                5,400 vol, KD 32 — later
what dog breed am i            4,400 vol, KD 36 — later
what element am i quiz         unvalidated
what villain am i quiz         unvalidated
what kind of friend am i quiz  unvalidated
am i introvert or extrovert    unvalidated
what decade am i quiz          unvalidated
```

**Avoid entirely.** Anything tied to a franchise or named character
— Harry Potter house, anime character, Marvel — carries copyright
risk. Mental-health-adjacent quizzes are YMYL territory where
idrlabs is entrenched and Google suppresses non-expert sites.

**Note on "what season am i".** The SERP is split between
personality quizzes and seasonal colour analysis, which is a large
TikTok trend. Roughly half the 2,900 volume belongs to the colour
analysis intent, which is a different product. Verify before
committing.

**Quality bar for any new quiz, non-negotiable.** 800+ words of
pre-rendered article, result descriptions written to the same
standard as the existing five, internal links to two or three
related quizzes, FAQ with schema.

Fifteen deep quizzes beat thirty thin ones. Quizexpo died of thin
content — its US organic traffic fell from roughly 94,000 to 4,300
while keeping 29,600 indexed keywords, almost all of them stuck
below position 20.

---

## 4. Revenue expectations

Entertainment and quiz is a low-RPM vertical. AdSense pays roughly
$3–10 RPM on Tier-1 traffic, and non-US traffic earns 50–80% less.

```
5,000 visits/mo   × 3 pages   × $2 RPM  ≈  $30/mo
25,000 visits/mo  × 3 pages   × $3 RPM  ≈  $225/mo
80,000 visits/mo  × 3.5 pages × $4 RPM  ≈  $1,120/mo
```

The step-change is the ad network, not the traffic:

| Network | RPM | Requirement |
|---|---|---|
| AdSense | $3–10 | none |
| Ezoic | $10–25 | none |
| Mediavine | $15–40 | 50,000 sessions / 30 days |
| Raptive | $18–50 | ~100,000 pageviews |

At 50,000 sessions the same traffic earns roughly $200 on AdSense
versus $750–2,000 on Mediavine. Crossing that threshold is the goal
the whole build serves.

Start on AdSense or Ezoic at launch. Move to Mediavine the moment
the threshold is met.

This does not become a $50/month asset. It either becomes a
$1,000+/month asset or it does not work. Quiz sites are
winner-take-most.

---

## 5. Deferred to V3 — do not build now

| Idea | Why deferred |
|---|---|
| Drag-to-slot answer interaction | Mobile drag is fragile; a failed drag traps the user with no way to answer |
| Rotating "vibe wheel" selector | Five labels on a 380px wheel are unreadable |
| Vibe Collapse orbit reveal | Depends on tracking every answer's screen position; high breakage risk for marginal gain over the card flip |
| Generative Vibe DNA poster with answer seed | Weeks of work, speculative payoff |
| Cross-quiz friend compatibility | Needs the passport shipped and real traffic first |
| Story Card image export, 1080×1920 canvas | Web Share file support is inconsistent across devices; download fallback adds friction |
| Result rarity percentages | Needs offline simulation of the full weight distribution to be honest; nice-to-have |
| Seasonal quiz rotation | Content overhead with no traffic to justify it |
| Result reaction buttons (accurate / kinda / no) | Adds a decision point at the exact moment share momentum peaks |

---

## 6. Judgement calls already made, with reasoning

Recording these so they are not relitigated.

**Sound defaults to off.** Conventional game-feel advice says
default on. The audience is 16–26 and frequently browsing on a phone
in public. Unexpected audio causes an immediate close. The upside
does not outweigh that.

**Card flip over orbit collapse for the reveal.** The collapse is
more spectacular but high complexity and fragile. The flip has one
property the collapse lacks: the card back can show the result's
palette before revealing the name, so the user senses what is coming.

**Vibe Grab over drag-to-slot.** Tap-based selection where the tile
reacts and expands captures most of the physicality without the
failure mode where a drag misses its target on a small screen.

**Individual aesthetic names are result types, not pages.**
Cottagecore quiz, dark academia quiz, y2k quiz each have 40–80 total
monthly volume with unreliable KD data. The generic "aesthetic quiz"
cluster has roughly 20,000 across 1,100 keywords at KD 13–20. One
deep page with ten results beats ten thin pages.

**The homepage is not a vibe-check gate.** An interactive entry
screen instead of quiz cards was considered and rejected: Google
needs clear crawlable links from the homepage, and a gate adds
friction before the visitor has any reason to trust the site.
