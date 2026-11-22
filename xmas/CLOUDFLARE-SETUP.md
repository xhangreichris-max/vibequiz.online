# Cloudflare setup for Window Card

Your DNS is at **Namecheap**. The quiz site stays on GitHub Pages and is not touched by any of these steps.

| Step | When |
|---|---|
| 1. Create the Pages project | **Do now** (after the `xmas-card` branch is pushed to GitHub) |
| 2. Add the domain xmas.vibequiz.online | **Do now** (right after step 1) |
| 3. D1 database and R2 bucket | Later, Phase 3 |
| 4. GROQ_API_KEY secret | Later, Phase 3 |

---

## 1. Create the Cloudflare Pages project (DO NOW)

**Before you start:** the `xmas-card` branch must be on GitHub. Claude Code will commit it, and you push only when you're ready. Until then, Cloudflare can't see the branch.

1. Go to **dash.cloudflare.com** and log in. If you don't have an account, sign up. The free plan is fine.
2. In the left menu, click **Compute (Workers)** → **Workers & Pages**.
3. Click the blue **Create** button.
4. Click the **Pages** tab, *not* Workers.
5. Click **Import an existing Git repository** (it may be labelled **Connect to Git**).
6. Click **Connect GitHub**. A GitHub window opens:
   - Choose your account **xhangreichris-max**.
   - Choose **Only select repositories**, and pick **vibequiz.online**.
   - Click **Install & Authorize**.
7. Back in Cloudflare, click **vibequiz.online** in the list, then **Begin setup**.
8. Fill in the form exactly like this:

   | Field | Value |
   |---|---|
   | Project name | `xmas-window-card` (must match `wrangler.toml`) |
   | Production branch | `xmas-card` |
   | Framework preset | `None` |
   | Build command | *(leave empty)* |
   | Build output directory | `public` |
   | Root directory (open **Root directory (advanced)**) | `xmas` |

   Leave environment variables empty for now.
9. Click **Save and Deploy**. Wait about 1 minute.
10. When it says **Success**, click the `xmas-window-card.pages.dev` link. You should see the dark blue page with gold text: **"Window Card — coming this Christmas"**.

**Important, so main pushes don't trigger useless builds:**

11. Open the project → **Settings** → **Build** → **Branch control** → **Edit**.
12. Keep the production branch as `xmas-card`.
13. Set **Preview branch** to **None**, then click **Save**.

   *Why:* every push to `main` (the quiz site) would otherwise start a Cloudflare preview build. Those builds fail because `xmas/` isn't on main. They're harmless, but they clutter the project.

---

## 2. Add the custom domain xmas.vibequiz.online (DO NOW)

Do this in Cloudflare first, then at Namecheap.

### 2a. In Cloudflare

1. Open the **xmas-window-card** project → **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Type `xmas.vibequiz.online` and click **Continue**.
4. Cloudflare will say your DNS is managed elsewhere and show you a **CNAME** record to add. It should be:
   - Name: `xmas`
   - Target: `xmas-window-card.pages.dev`
5. Click **Begin CNAME setup** (or **Activate domain**). Leave this tab open.

### 2b. At Namecheap

1. Go to **namecheap.com** and log in.
2. Click **Domain List** in the left menu.
3. Next to **vibequiz.online**, click **Manage**.
4. Click the **Advanced DNS** tab.
5. Under **Host Records**, click **Add New Record**, then choose **CNAME Record**.
6. Fill in:

   | Field | Value |
   |---|---|
   | Host | `xmas` |
   | Value / Target | `xmas-window-card.pages.dev` |
   | TTL | `Automatic` |

7. Click the green **✓** to save.

**Do not change or delete any other records.** The existing `@`, `www` and GitHub Pages records keep the quiz site running.

### 2c. Wait and check

- Back in Cloudflare → **Custom domains**, the status goes from **Initializing / Pending** to **Active**. This usually takes 5–30 minutes, and occasionally up to 24 hours.
- Then open **https://xmas.vibequiz.online**. You should see the "coming this Christmas" page.

✅ **Phase 0 is done when that page loads.**

---

## 3. Create the D1 database and R2 bucket (LATER, PHASE 3)

Don't do this yet. Claude Code will tell you when.

### 3a. D1 database (stores the cards)

1. In the left menu, click **Storage & Databases** → **D1 SQL Database**.
2. Click **Create** (it may say **Create database**).
3. Name: `xmas-cards`. Location: **Automatic**. Click **Create**.
4. On the database page, copy the **Database ID** (a long code like `a1b2c3d4-...`).
5. **Give that ID to Claude Code.** It will paste it into `xmas/wrangler.toml` and turn on the `DB` binding.

### 3b. R2 bucket (stores the envelope images)

1. In the left menu, click **Storage & Databases** → **R2 Object Storage**.
2. The first time, Cloudflare asks you to **enable R2** and **add a payment card**. That's required even on the free tier. The free allowance is 10 GB of storage and millions of reads; this project won't come close. If you're not comfortable adding a card, tell Claude Code first.
3. Click **Create bucket**.
4. Name: `xmas-cards`. Location: **Automatic**. Click **Create bucket**.
5. Tell Claude Code it's done. It will turn on the `CARDS_BUCKET` binding in `wrangler.toml`.

### 3c. Binding them to the project

Because the project has a `wrangler.toml` file, **the bindings are set in that file, not in the dashboard.** The binding settings in the dashboard may show as read-only. That's normal.

Claude Code makes the change. You review it, then push, and Cloudflare redeploys automatically.

To check afterwards: open the project → **Settings** → **Bindings**. You should see `DB` (D1) and `CARDS_BUCKET` (R2).

---

## 4. Add GROQ_API_KEY as an encrypted secret (LATER, PHASE 3)

1. Get your key from **console.groq.com** → **API Keys** → **Create API Key**. Copy it.
   - **Never paste the real key into chat, a file, or GitHub.**
2. In Cloudflare, open the **xmas-window-card** project → **Settings** → **Variables and Secrets**.
3. Click **Add**.
4. Fill in:
   - Type: **Secret** (encrypted), not Text
   - Variable name: `GROQ_API_KEY`
   - Value: paste your key
5. Click **Save**.
6. Secrets only take effect on the next deploy. Either push any change, or go to **Deployments** → the latest one → **⋯** → **Retry deployment**.

For local testing (optional, later): copy `xmas/.dev.vars.example` to `xmas/.dev.vars` and put the key there. `.dev.vars` is git-ignored, so it never gets committed.
