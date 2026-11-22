# Window Card: Christmas 2026, build brief for Claude Code

> Chris: put this file and `reference-demo.html` in `C:\Projects\vibequiz.online\xmas\`, open Claude Code in `C:\Projects\vibequiz.online`, and paste the kickoff prompt at the bottom of this file.

---

## 1. What we are building

A viral, interactive Christmas card that someone sends to one friend on WhatsApp, iMessage or Instagram.

- The **sender** makes it in under 40 seconds: the friend's name, a window, the occasion, a message, an optional Bible verse, then Share.
- The **recipient** gets a sealed envelope addressed to them by name. It opens into a magical window they light up themselves; most windows play a carol as they go. That opens into a vintage Christmas card with a KJV verse, the sender's message and a handwritten-style signature.
- The recipient leaves with a personal **phone wallpaper / status image**, and can **"light one back"** to the sender or send a card to someone else. That is the viral loop.

The style is **Western Christmas** (US, UK, Canada, Australia; also the Philippines and English-speaking Africa). The audience is worldwide and the copy is in English. It should look premium, vintage and hand-made, never glittery or stock-looking.

`reference-demo.html` is a working single-file prototype of the recipient flow for all 7 windows. Treat it as the **behaviour spec**: it shows the flow, interactions, timings, verses and copy. It is **not** the code architecture. Rebuild it properly and make it look and sound far more realistic.

---

## 2. Hard constraints

1. **Do not break vibequiz.online.** Do not modify existing quiz pages, `build.py`, `quizzes-config.json`, `template*.html`, `quiz-engine.js`, `style.css` or the GitHub Actions workflow. Everything lives under `xmas/`. If `build.py` copies or ignores folders, check how, and make sure `xmas/` is left out of the quiz build. If a `vibequiz-v2-builder` skill or SEO guardrail file exists in the repo, read it first and follow it.
2. **Chris's internet is a phone hotspot with a 1.5–3 GB daily limit.** Avoid heavy installs.
   - No React, no Next.js, no big toolchains.
   - Plain HTML, CSS and ES modules, with small libraries vendored into `xmas/public/vendor/`.
   - Ask before any `npm install` over about 20 MB.
   - Prefer Cloudflare's GitHub integration (Cloudflare builds in the cloud) over installing `wrangler` locally.
3. **Free tiers only** for launch: Cloudflare Pages, Pages Functions, D1 and R2; Groq for text.
4. **Bible text: KJV or WEB only** (public domain). Never NIV, ESV or NLT.
5. **Music:**
   - The carols are public-domain *compositions*, but most *recordings* are copyrighted.
   - Use only our own synthesized playback, or samples and recordings that are explicitly CC0 or Pixabay-licence.
   - Keep a `xmas/ASSETS-LICENSES.md` listing every asset, where it came from and its licence.
6. **No trademarks:** no Grinch, Elf, Hallmark, Coca-Cola Santa, Disney or real movie titles.
7. **Weather API:** Open-Meteo's free tier is non-commercial, and this site shows ads.
   - Use **MET Norway** (api.met.no: free, commercial use allowed with attribution, and it needs a User-Agent header).
   - Or check Open-Meteo's terms and confirm with Chris.
8. **Privacy:**
   - No accounts, no photo uploads, no recipient tracking beyond anonymous counters.
   - Card data auto-deletes after 31 Jan 2027.
   - The recipient's approximate location comes only from Cloudflare's `request.cf` and is used only for weather. Never store it.
9. **Performance budget:**
   - First screen: under 400 KB of transfer.
   - Each window's assets load lazily, under about 1.2 MB per window including audio.
   - Images as WebP or AVIF.
   - It must feel smooth on a mid-range Android phone.
10. **Always ask Chris before:** deploying, creating Cloudflare resources, adding secrets, or deleting anything.

---

## 3. Hosting and architecture (confirm with Chris in Phase 0)

- The code lives in `vibequiz.online/xmas/` (Chris's request).
- It deploys as a **separate Cloudflare Pages project** with root directory `xmas`, on the custom domain **`xmas.vibequiz.online`**. The quiz site stays on GitHub Pages, untouched.
- **Why Cloudflare and not GitHub Pages:** each card link needs its own link preview (the friend's name on the envelope image). That needs a small server function, which GitHub Pages cannot run.

```
xmas/
  public/
    index.html            landing + sender flow
    card.html             recipient app shell
    css/  js/  vendor/    (gsap, howler, gifenc …)
    windows/<id>/         per-window assets: layers.webp, audio, module.js
  functions/
    api/card.js           POST create card → D1, returns id
    api/share-image.js    receives the envelope PNG/GIF → R2
    api/message.js        Groq: message suggestions per occasion (+ template fallback)
    api/weather.js        recipient weather from request.cf lat/lon → MET Norway (cached)
    c/[id].js             serves card.html with per-card OG meta tags
  schema.sql              D1 tables
  ASSETS-LICENSES.md
```

**Card storage:** D1 (KV's free write limit of about 1,000 a day is too low if the card goes viral).

- Table `cards(id, to_name, from_name, window, occasion, verse_ref, verse_on, message, objects_json, open_after, created_at, opens, replies)`.
- The id is 7 random base62 characters.
- Card links look like `xmas.vibequiz.online/c/aB3k9Qz`. Never use URL shorteners.

**Link preview (OG):** `c/[id].js` returns HTML with these tags:

- `og:title` = "For Jake ✉️"
- `og:description` = "Emma sent you something. Open it when you have a quiet minute."
- `og:image` = the envelope image stored in R2 for that card.

The image is 1200×630 JPG, kept small (aim under about 250 KB, so WhatsApp shows the large preview; test this).

---

## 4. Libraries (vendored, small)

| Library | Use | Note |
|---|---|---|
| GSAP (core; plus SplitText and MorphSVG if needed) | All timelines and motion | Became free for commercial use in 2025; verify the licence page |
| Howler.js | Audio sprites, fades, unlocking audio on iOS | ~10 KB gz |
| Web Audio (own code) | Bell and choir synthesis for interactive notes | Already in the demo; upgrade the tone with CC0 bell samples |
| gifenc (or similar tiny encoder) | 2–3 s looping envelope GIF for sharing | Test the WhatsApp behaviour |
| Canvas 2D | Frost, snow, sparkles, fireworks, wallpaper export | Keep the demo approach, add textures |

Optional, only if it clearly improves realism and stays within budget: Lottie for small flourishes, or a WebGL shader for frost and glass light. Ask first.

---

## 5. Realistic visuals: pre-generated AI paintings

Each window gets **one set of high-quality painted layers, generated once** and stored as assets. No per-user image generation.

- **Layers per window:** `bg` (sky/far), `mid` (scene), `fg` (frame/sill/foreground), and a separate `lit` overlay (the warm-light version) for crossfading.
- **Size:** 1080×1350 master, exported to WebP at about 900 px wide for mobile.
- **Parallax:** shift the layers by 4–14 px with device tilt (iOS needs a permission tap, so add a "✨ Tilt" button) or by finger or mouse position.
- **Dynamic overlays drawn in code on top of the painting:**
  - the name in the frost
  - live weather (snow or rain particles, day or night tint)
  - the sender's chosen objects (dog, mug, guitar…) as small painted PNG stickers placed at fixed anchor points per window
  - hidden names (on the stocking, carved in the beam, an initial in a glass panel, the star pattern)

**Before generating:** Chris will make the paintings with his own AI image tool. Check that tool's licence allows commercial use, and record it in `ASSETS-LICENSES.md`.

Shared style for every prompt: *"vintage hand-painted Christmas card illustration, gouache and watercolor, warm candlelight, muted jewel tones, fine paper texture, 1950s storybook style, no text, no people's faces in detail"*.

| Window | Layer prompt idea |
|---|---|
| Stable | Night Bethlehem stable seen through a rustic wooden window, silhouettes of Mary, Joseph and a manger, a donkey, a huge Star of Bethlehem casting a soft beam |
| Stained glass | Gothic arched church window with a rose window, Star of Bethlehem and manger motif in jewel-tone glass, in an unlit version and a sunlit version |
| Starry night | Desert night sky over distant Bethlehem rooftops, three wise men on camels in silhouette on the dunes |
| Candle | Snowy cottage window at night from inside, brass candlestick on the sill, a snowy lane outside with lanterns |
| Shepherds | Hillside at night with shepherds and sheep, a cloud-covered sky; a separate layer with three angels in golden light |
| Cottage | Cozy cottage interior seen through a frosted window: fireplace, decorated tree, wrapped gifts |
| City | Snowy city street at night, brownstone apartments with many windows, string lights; dark and lit versions |

The frost texture, glass grain and paper grain are separate tileable textures.

---

## 6. Audio

- **Ambient bed per window** (loop, about 20–40 s, CC0): fire crackle, winter wind, church reverb ambience, a desert night breeze, city snow hush.
- **Interaction SFX** (CC0): wax seal crack, paper rustle, match strike, frost squeak, glass chime, a soft "whoosh" of light, church bells.
- **Carols:** keep the demo idea. The recipient's taps play the melody note by note, and the rest plays on reveal.
  - Use a real-sounding bell or celesta (sampled, CC0) plus a soft choir pad.
  - Melodies are in the demo: Silent Night, We Three Kings, O Come All Ye Faithful, The First Noel, Deck the Halls, Jingle Bells.
- **Handling:**
  - A global mute button.
  - Respect the silent switch on iOS (audio starts only after the first tap).
  - Captions and visuals must make sense with the sound off.

---

## 7. The recipient experience (spec = reference demo + upgrades)

| Step | What happens |
|---|---|
| 0. In the chat | A full-width envelope **image or GIF** (not just a link) with "For Jake" in copperplate script, a wax seal with the sender's initial, and a blurred frosted-window peek of the chosen window. The caption is written by the sender, e.g. "Jake, I made you something. Open it when you have a quiet minute. Sound on 🔊". |
| 1. Lobby (optional) | If the sender set "Do not open until Christmas Eve", show the blurred card, a countdown and an "Add to calendar" (.ics) button. |
| 2. Envelope | Address in script, a "Bethlehem Lane" postmark with the date, and a stamp. Tap the seal: it cracks, the flap opens, the card slides out. |
| 3. Window | The chosen window with its interaction (see table). Personal touches: the name in the frost, live weather, the sender's objects, hidden names. |
| 4. Reveal | Warm light crossfade, the melody completes, a light sweep, sparkles. |
| 5. Vintage card | The window scene sits on the cover in an oval vignette. Tap to open: the verse writes itself in gold (KJV, reference in small caps), then "Dear Jake," and the message, then the sender's name signs itself in copperplate with a flourish and a wax stamp. Church bells. |
| 6. Keep and share | Primary button: **"Save as wallpaper / Post to status"** (a 1080×1920 image with their lit window, their name, the verse and a tiny site URL). Secondary: "Light one back to Emma" (a short frost-written reply or a candle), "Send a window card to someone". An Adsterra native banner goes **below** these buttons, only on this screen. |
| 7. Christmas morning (optional) | A sealed part of the card unlocks on 25 Dec (a bonus line or coupon). |

| Window | Interaction | Tune | Default verse (KJV) |
|---|---|---|---|
| Stable | Blow (mic) or wipe the frost | choir | Luke 2:11 |
| Stained glass | Tap panes to light them; each pane plays a note | Silent Night | John 1:5 |
| Starry night | Connect 8 stars into the Star of Bethlehem, then the wise men move | We Three Kings | Matthew 2:10 |
| Candle | Press and hold the wick; the flame grows; the lanterns and travellers appear | O Come All Ye Faithful | John 8:12 |
| Shepherds | Tap the clouds apart; angels appear | The First Noel | Luke 2:14 |
| Cottage | Blow or wipe the frost; the fire and tree lights come on | Deck the Halls | Luke 2:10 |
| City | Swipe across the buildings to light the windows | Jingle Bells | 2 Corinthians 9:15 |

**Every interaction has a fallback** ("or tap here…") after about 6 s, so nobody gets stuck.

**Variety: each person should get a slightly different experience:**

- Live weather and time of day.
- Occasion-driven verse, message and scene tweaks: new baby (a cradle), first Christmas together (two candles), missing someone (one extra candle, one bright star), far from home, a hard year, new home.
- The sender's objects in the scene.
- A small **rare variant** chance, about 1 in 15: northern lights, a shooting star or a golden frame. The card says "✨ You got a rare window". This will be expanded in a later brainstorm step; build the hook for it now.

---

## 8. The sender flow (about 40 seconds, mobile-first)

1. "Who is this for?": their name, plus optional city (only if they want weather for a different place).
2. "Pick their window": a swipeable carousel of the 7 animated previews.
3. "What's the occasion?": Just Christmas, New baby, First Christmas together, Missing someone, Far from home, Hard year, New home.
4. "Add a Bible verse?": on by default, with 2–3 suggested verses (KJV) for that window and occasion, or "Classic, no verse".
5. "Your message": 3 AI-suggested messages (Groq, from the occasion plus 1–3 optional facts) that the sender can edit, or write their own. Fall back to a curated template set if Groq fails or rate-limits.
6. "Add something of theirs" (optional): pick up to 3 objects.
7. "When can they open it?": Now, or Christmas Eve / Christmas morning.
8. Preview, then **Share**:
   - Use the Web Share API with **files** (the envelope GIF or PNG) plus text (caption + link).
   - Fallbacks: a WhatsApp deep link with text only, or Copy link.
9. Sender success screen: "Sent! We'll tell you when Jake opens it" (opens and replies come from the counters; there are no accounts, so show them on a private manage link stored in localStorage).

---

## 9. Monetization (launch)

- Adsterra **native banner** only on the final keep-and-share screen, and on the sender's success screen. No popunders, no Social Bar, nothing on the reveal screens.
- Keep a placeholder `<div id="ad-slot">` and load the Adsterra code only in production, after the card has been opened.
- Premium (later, behind a feature flag): the sender's voice note, HD print PDF, extra windows, no watermark.

---

## 10. Build phases and acceptance checks

**Phase 0: setup (ask Chris for every dashboard step)**
- Create `xmas/` with the structure above, and confirm the quiz build ignores it.
- Write down the Cloudflare steps for Chris: a Pages project from the repo with root `xmas`, a D1 database, an R2 bucket, the `GROQ_API_KEY` secret, and the `xmas.vibequiz.online` CNAME.
- Deploy a hello page. ✅ when `xmas.vibequiz.online` loads.

**Phase 1: port the demo**
- Split `reference-demo.html` into modules: `core/flow.js`, `core/audio.js`, `core/frost.js`, `core/sparkles.js`, `card/vintage.js`, `windows/<id>/module.js` (each exports `{scene, interact, reveal, verse, tune}`).
- GSAP timelines replace the setTimeout chains.
- ✅ All 7 windows work end-to-end with the demo art, on Android Chrome and iOS Safari.

**Phase 2: realism**
- Painted layers, parallax, lit crossfades, textures, Howler audio, CC0 samples, rare-variant hook.
- ✅ Each window under its performance budget, 60 fps on a mid-range phone, works muted.

**Phase 3: sender flow and backend**
- D1 schema, the create API, the envelope image and GIF rendering on the client, upload to R2, `c/[id]` with OG tags, Web Share.
- ✅ A real card sent on WhatsApp shows the big envelope preview with the name; tapping it opens the card.

**Phase 4: personalization**
- Occasions, verse suggestions, Groq messages with template fallback, weather via `request.cf` and MET Norway (cached 30 min), objects, hidden names, the open-after lobby with .ics.
- ✅ Two cards with different inputs look clearly different.

**Phase 5: keep, share, loop**
- 1080×1920 wallpaper export, "light one back" reply, "send your own", open and reply counters, the sender's manage link.
- ✅ The full loop works between two phones.

**Phase 6: launch hardening**
- Adsterra slot, rate limiting on the create API, profanity filter on names and messages, a 404 page for bad or expired ids, the auto-delete job.
- `ASSETS-LICENSES.md` complete, and a privacy note page.
- ✅ Lighthouse mobile performance at 85 or above. Chris has tested on his own phone and on a friend's iPhone.

**Timeline:** live by **1 Dec 2026**. The peak sending window is 20–25 Dec; on 26–31 Dec switch the copy to New Year.

---

## 11. KJV verse pool (window and occasion suggestions)

Use exact KJV text, checked against a public-domain source. Keep the refs below; add the text in `js/verses.js`.

- **Christmas story:** Luke 2:10, 2:11, 2:14; Isaiah 9:6; Matthew 1:23, 2:10; John 1:5, 1:14, 3:16; 2 Corinthians 9:15.
- **New baby:** Isaiah 9:6; Psalm 127:3.
- **First Christmas together:** Ecclesiastes 4:9; 1 Corinthians 13:13.
- **Missing someone:** Matthew 5:4; Revelation 21:4; Psalm 34:18.
- **Far from home:** Psalm 121:8; Joshua 1:9.
- **Hard year:** John 1:5; Isaiah 40:31; Lamentations 3:22–23.
- **New home:** Psalm 127:1; Numbers 6:24–26.

---

## 12. Kickoff prompt for Claude Code (Chris: paste this)

```
Read xmas/BUILD-BRIEF.md fully, then open xmas/reference-demo.html and study the recipient flow for all 7 windows.
Do not touch anything outside the xmas/ folder.
Start with Phase 0: check how build.py and the GitHub Actions workflow treat folders, make sure xmas/ is excluded from the quiz build, create the folder structure, and write me the exact Cloudflare dashboard steps I need to do (Pages project with root "xmas", D1, R2, secret, CNAME for xmas.vibequiz.online).
My internet is a phone hotspot with a small daily data limit, so no heavy installs; ask me before any npm install, deploy, or creating anything on Cloudflare.
When Phase 0 is done, show me a short summary and wait for my OK before Phase 1.
```