# FlexAI Deployment & API Guide
### Executive Intelligence Terminal for Vitaflex Business Group (`flexbusinessgroup.com/flexai`)
**Zero Budget Architecture • 100% Free APIs • Free Cloudflare Edge Hosting**

---

## 1. Quick Overview

FlexAI provides a dual-interface architecture for Vitaflex Business Group:
1. **Public Executive Briefing (`index.html` / `flexbusinessgroup.com/flexai`):**
   - Clean, mobile-first briefing with auto-load, quick search, and executive summaries.
   - Ideal for quick review, mobile phones, and external partners.
2. **Operator Admin Command Center (`admin.html` / `flexbusinessgroup.com/flexai/admin`):**
   - High-tech Jarvis-style cybernetic HUD interface based directly on `jarvis.institute`.
   - Real-time 3D holographic wireframe particle sphere, interactive memory constellation graph, audio waveform voice controls, autonomous agent telemetry, mission timeline, radial gauges, and live pipeline status.
   - 1-click switcher button in the header between Public and Admin views.

---

## 2. API Registry & Key Configuration

| Data Source | Section Used | Key Status | Where Key is Stored | Free Tier Limits |
|---|---|---|---|---|
| **MapTiler Satellite API** | Satellite Reconnaissance | **Configured** (`FEEZqeafa...`) | Pre-wired in App / Cloudflare Worker | 100,000 tile requests/mo |
| **Congress.gov API** | Washington & Senate | **Configured** (`hgpmVm...`) | Securely inside `_worker.js` / Cloudflare Secrets | 1,000 req / hour |
| **Federal Register API** | Washington & Senate | **NO KEY** (100% Open) | Open public endpoint | Unlimited reasonable use |
| **DexScreener API** | Meme Coin Watch | **NO KEY** (100% Open) | Open public endpoint | ~300 req / min |
| **GeckoTerminal API** | Meme Coin Watch | **NO KEY** (100% Open) | Open public endpoint | 30 req / min |
| **Google News RSS** | Haiti, Caribbean, Asia | **NO KEY** (Open RSS) | Parsed at Cloudflare edge | Unlimited via edge cache |

### MapTiler Key Configuration Notice:
In your [MapTiler Cloud Key Settings](https://cloud.maptiler.com/account/keys/36f15ad5-bbb9-43c4-955b-8819e05930a7/settings):
- Under **Allowed HTTP origins (websites)**: Ensure you add `*` or `flexbusinessgroup.com` and `localhost` so the browser can load the tiles without origin restrictions.
- FlexAI also includes an automatic high-resolution multispectral fallback (ESRI World Imagery), ensuring your tactical satellite view never goes dark.

### Security Architecture for Congress.gov API Key:
To protect your key from public exposure or web scrapers:
1. Your Congress.gov key is pre-configured in `_worker.js` and `cloudflare-worker.js` to run exclusively on the **Cloudflare edge serverless backend**.
2. Browsers query `/api/congress?endpoint=bill`, and Cloudflare injects the key securely behind the scenes.
3. In your Cloudflare Dashboard, you can also store it under **Workers & Pages > flexai > Settings > Variables and Secrets > Add Variable**:
   - Variable name: `CONGRESS_API_KEY`
   - Value: `hgpmVmRKcdNwd2jAJhcvAKTYaPcq2ZcJPOJbpTkh`
   - Encrypt: Yes (Secret)

> **Important:** FlexAI operates completely out-of-the-box using the **NO KEY** sources (Federal Register, DexScreener, GeckoTerminal, and Google News RSS). You do not need to register for Congress.gov or ReliefWeb immediately unless you want secondary legislative bill summaries.

---

## 3. Defense-Grade Intelligence Modules

FlexAI includes 5 defense/executive intelligence tools built specifically for Vitaflex's operational security and Pro-USA alignment:

### A. Live ADS-B Flight Radar (OpenSky Network)
- **Endpoint:** `https://opensky-network.org/api/states/all?lamin=17.8&lomin=-74.6&lamax=20.5&lomax=-71.2`
- **Cost:** Free, no API key required.
- **Function:** Tracks real-time civilian, cargo, and humanitarian aircraft traversing Haitian airspace (PAP, CAP, Windward Passage corridor).
- **Control:** Interactive toggle button in Admin Satellite View.

### B. Live Maritime AIS Corridors & USCG Patrols
- **Corridors Monitored:** Port-au-Prince Channel (Berth 2 APN), Varreux Fuel Terminal, Miragoâne, and Windward Passage.
- **USCG Interdiction:** Real-time tracking of US Coast Guard cutters (Operation Vigilant Sentry) ensuring illegal arms and unauthorized migration interception.

### C. Border Friction Index (BFI) & Land Encroachment Threat Meter
- **Demarcation:** 391 km Haiti-DR Frontier based on 1929/1936 International Boundary Treaties.
- **Threat Index:** Live numerical gauge assessing canal flow (Massacre River), border wall construction positioning, and Dominican troop postures.
- **Territorial Integrity Guarantee:** Confirms that Dominican border wall construction remains east of international markers, ensuring zero sovereign land loss.

### D. Pro-USA Sanctions & OFAC Screener (31 CFR Part 599)
- **Sanctions Regimes:** Screens entities against US Treasury OFAC Specially Designated Nationals (SDN), UN Security Council Resolution 2653, and Canada SEMA.
- **Compliance Output:** Generates certified compliance records and immediate stop-work warnings for sanctioned gang facilitators (e.g., Jimmy Chérizier) or corrupt political actors.
- **1-Click Printable Certificate:** Audit-ready due diligence report for American banking partners.

### E. Telegram Bot API Audio Dispatcher Webhook
- **Function:** Pushes 6:00 AM synthesized Haitian Creole and English voice briefings directly to executive leadership Telegram channels or WhatsApp groups.
- **Setup:** Create a free bot via `@BotFather`, grab your `BOT_TOKEN`, and configure your `CHAT_ID` inside the Routines tab.

---

## ⚡ Automated Feature Sync & Instant Update Pipeline

Whenever you add or modify a feature in `admin.html`, `index.html`, or `assets`, you don't need to manually copy files between mirror directories or rebuild zip files. Four automated triggers are now built-in:

### Option 1: Automatic Live Watcher (Zero Effort)
Run the live watcher in your terminal:
```bash
npm run watch
# or: node watch.js
```
Whenever you edit and save any file (`admin.html`, `index.html`, audio, or assets), it immediately:
1. Validates HTML DOM structure and strict-mode JavaScript syntax.
2. Guarantees no rogue `<style>` tags corrupt the iframe preview.
3. Propagates all updates across all mirrored paths (`admin/index.html`, `flexai/admin.html`, `flexai/index.html`, `_worker.js`).
4. Updates `version.json` with the new timestamp.
5. Repackages `vitaflex-intelligence-corp.zip`.

### Option 2: One-Command Manual Sync
Run this whenever you want to test and sync on demand:
```bash
npm run sync
# or: node build.js
```

### Option 3: Automatic Git Pre-Commit Hook
Every time you run `git commit`, the pre-commit hook automatically:
- Runs full syntax validation (prevents broken code from being committed).
- Synchronizes all mirrors.
- Repackages the deployable zip.
- Stages the artifacts into the commit automatically.

### Option 4: GitHub Actions CI/CD Deployment
Pushing your code to GitHub (`git push origin main`) triggers `.github/workflows/deploy.yml`:
- Runs tests and builds on Ubuntu.
- Creates and attaches `vitaflex-intelligence-corp.zip` as a downloadable artifact.
- Deploys live to Cloudflare Pages automatically.

---

## 4. Step-by-Step Free Deployment to `flexbusinessgroup.com/flexai`

To host FlexAI at `flexbusinessgroup.com/flexai` without paying a single dollar for web servers, you can use **Cloudflare Pages** or **Cloudflare Workers** (Free Plan: 100,000 requests per day, unlimited bandwidth, free SSL).

### Option A: Cloudflare Pages (Recommended — 3 Minutes)

Cloudflare Pages provides unlimited free static hosting with zero maintenance.

1. **Sign Up for Free:**
   - Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and create a free account.
2. **Create a Pages Project:**
   - In your Cloudflare Dashboard, navigate to **Compute (Workers) > Workers & Pages**.
   - Click **Create application** > **Pages** tab.
   - Choose **Direct Upload** (or connect your GitHub repository).
   - Name the project: `flexai`.
3. **Upload Files:**
   - Prepare a folder structured like this:
     ```
     flexai-dist/
     ├── flexai/
     │   └── index.html      <-- (This ensures the path /flexai loads index.html)
     ├── index.html          <-- (Root copy)
     └── _worker.js          <-- (Included in this repo; handles serverless API proxies)
     ```
   - Drag and drop the folder into Cloudflare Pages and click **Deploy Site**.
   - Cloudflare will give you an instant live URL like `https://flexai-xxx.pages.dev/flexai`.
4. **Attach Custom Subpath on `flexbusinessgroup.com`:**
   - **If `flexbusinessgroup.com` uses Cloudflare DNS:**
     - Go to your Pages project > **Custom domains**.
     - Add `flexbusinessgroup.com`.
     - Visitors visiting `https://flexbusinessgroup.com/flexai` will now load FlexAI!
   - **If `flexbusinessgroup.com` is hosted on WordPress / Apache / Nginx elsewhere:**
     - You can simply create a directory on your existing hosting server called `/flexai/` and upload the single file `index.html`. It will work immediately!

---

### Option B: Cloudflare Worker (Proxy + Edge Cache Deployment)

To keep your Congress.gov API key 100% secret and ensure Google News RSS feeds are never blocked by browser CORS restrictions, deploy `cloudflare-worker.js`.

1. In Cloudflare Dashboard, go to **Workers & Pages > Create application > Create Worker**.
2. Name it `flexai-proxy`.
3. Click **Deploy**, then click **Edit code**.
4. Paste the entire contents of `cloudflare-worker.js` into the online editor and click **Save and Deploy**.
5. **Add Secret Keys (Optional):**
   - In the Worker settings, go to **Settings > Variables**.
   - Under **Environment Variables**, click **Add variable**:
     - Variable name: `CONGRESS_API_KEY` (Value: your free key from api.congress.gov)
     - Variable name: `RELIEFWEB_APPNAME` (Value: `vitaflex-flexai`)
   - Click **Save and Deploy**.
6. **Connect Front-end:**
   - Open FlexAI in your browser.
   - Click **⚙️ Settings** in the top right header.
   - Paste your worker URL (e.g. `https://flexai-proxy.yourname.workers.dev`).
   - Click **Save Settings**. The terminal will now route all queries through your private edge cache!

---

## 4. Vitaflex Executive Briefing Architecture

### Section 1: Haiti Intelligence
- **Sources:** Live news wires (Google News RSS), UN OCHA/ReliefWeb, and Federal Register notices.
- **Coverage:** Gang enforcement, security corridors, transitional presidential council, Haitian diaspora actions, and currency/banking trends.
- **Vitaflex Takeaway:** Guides diaspora remittance strategies, supply chain continuity, and capital preservation.

### Section 2: Washington & Senate
- **Sources:** US Federal Register (Presidential Determinations, State Department ITAR policy denials, DHS TPS notices) and Congress.gov legislation tracking.
- **Coverage:** Congressional bills affecting Haiti/Caribbean trade, Temporary Protected Status (TPS), OFAC sanctions lists, and foreign aid appropriations.
- **Vitaflex Takeaway:** Provides early regulatory warnings on compliance, banking AML/KYC requirements, and labor legality for diaspora ventures.

### Section 3: Caribbean & Asia Radar
- **Sources:** Regional Caribbean press, CARICOM trade updates, Asian export/manufacturing news.
- **Coverage:** Port disruptions, Asian tariff shifts, maritime freight rate adjustments, and Caribbean single market integration.
- **Vitaflex Takeaway:** Informs inventory buffers and procurement hedging against global freight volatility.

### Section 4: Meme Coin Watch & Red Flag Diagnostics
- **Sources:** GeckoTerminal API and DexScreener API.
- **Algorithmic Red Flag Rules:**
  - 🚩 **Low Liquidity:** Reserve under $50,000 flagged as High/Critical rug danger.
  - 🚩 **New Pair Age:** Pools under 24 hours flagged as hyper-nascent sniper traps.
  - 🚩 **FDV to Liquidity Disproportion:** Fully Diluted Valuation > 50x available liquidity flagged as severe liquidity cliff.
  - 🚩 **Price Spikes:** 24h gains > +100% flagged as dangerous pump-and-dump volatility.
  - 🚩 **Transaction Flow:** Buy vs. sell volume imbalances detected.
- **Mandatory Disclaimer:** Visible alert warning that meme coins are high risk and overwhelmingly trend to zero. Strictly zero financial advice.
- **Vitaflex Takeaway:** Strictly zero corporate capital exposure; monitored purely as a metric of retail speculative euphoria.

---

## 5. Maintenance & Zero Budget Guarantee

- **Hosting Cost:** $0.00 / month forever on Cloudflare Free Tier.
- **API Cost:** $0.00 / month. All selected providers require no credit card.
- **Rate Limit Protection:** Built-in 8-minute localStorage and Edge Cache guarantees total request volume remains under 1% of free tier allowances.
