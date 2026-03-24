# OWASP ZAP Security Report Guide

This guide walks you through generating a security report with **OWASP ZAP (Zed Attack Proxy)** for your Capstone project, for submission to your professor.

---

## Prerequisites

1. **ZAP installed** — You already have it. If you use the desktop app, open **ZAP Desktop**.
2. **Your app running** — Start your stack so ZAP can scan it:
   ```bash
   ./start.sh --dev
   ```
   Or for a production-style build (good for a "deployment-like" report):
   ```bash
   ./start.sh --demo
   ```
3. **URLs to scan** (adjust if you use different ports):
   - **Web app (main target):** `http://localhost:5173` (dev) or `http://localhost:4173` (demo)
   - **Auth API:** `http://localhost:3001`
   - **Business API:** `http://localhost:3002`
   - **Admin API:** `http://localhost:3003`
   - **Audit API:** `http://localhost:3004`

---

## Option A: Quick Scan (Automated — good for a first report)

1. Open **ZAP Desktop**.
2. **Automated Scan:**
   - On the start screen, choose **Automated Scan**.
   - **URL to attack:** `http://localhost:5173` (or `http://localhost:4173` if using `--demo`).
   - Click **Attack**.
3. Wait for the scan to finish (progress in the bottom status bar).
4. **Export the report:**
   - **Report** → **Generate HTML Report…**
   - Pick a filename (e.g. `zap-security-report-YYYY-MM-DD.html`) and save.
   - You can also use **Report** → **Export Report** for XML/JSON if your professor requires it.

Use this HTML report as your main deliverable unless they ask for another format.

---

## Option B: Full scan (Spider + Active Scan — more thorough)

1. Open **ZAP Desktop**.
2. **Manual Explore / New Session:**
   - **File** → **New Session** (or choose "Manual Explore").
   - In the **URL** bar at the top, enter: `http://localhost:5173` (or `http://localhost:4173`) and press Enter.
3. **Spider the site:**
   - Go to **Automation** (or **Attack** tab) → **Spider** (or "Run spider").
   - Start the spider on your app URL so ZAP discovers links and pages.
   - Optional: In **Sites** (left), right‑click your host → **Include in Context** so only your app is in scope.
4. **Use the app while ZAP is proxying (optional but recommended):**
   - ZAP acts as a proxy. If you started with "Manual Explore", use the built-in browser and click through: login, dashboard, a few key pages. That feeds more URLs into the session.
5. **Active Scan:**
   - In **Attack** (or **Automation**) → **Active Scan**.
   - Select your base URL (e.g. `http://localhost:5173`) and run the scan.
   - Wait until it completes.
6. **Generate report:**
   - **Report** → **Generate HTML Report…** (or **Export Report** for XML/JSON).
   - Save as e.g. `zap-full-scan-report-YYYY-MM-DD.html`.

---

## Option C: Include backend APIs in the report

If your professor wants APIs included:

1. After starting a session (Option B), add the API base URLs to the **Sites** tree:
   - In the URL bar, visit (or add):  
     `http://localhost:3001`, `http://localhost:3002`, `http://localhost:3003`, `http://localhost:3004`
2. Run **Spider** (and optionally **Active Scan**) on each, or add them to the same context and run one Active Scan on the context.
3. Generate the report as above; it will include findings for both the web app and the API endpoints ZAP discovered or scanned.

---

## What to submit

- **Primary:** An **HTML report** from **Report** → **Generate HTML Report…** (after at least one Automated Scan or one Spider + Active Scan).
- **If requested:** XML/JSON via **Report** → **Export Report**.
- **Optional:** A short written summary (1–2 pages) that:
  - States that the report was generated with OWASP ZAP.
  - Lists the URLs/scopes scanned (e.g. `http://localhost:5173` and optionally the API bases).
  - Summarizes the most important findings (High/Medium/Low) and how you plan to or have addressed them (you can tie this to your `docs/security/manual-risk-testing-guide.md`).

---

## Tips

- **False positives:** ZAP often reports "X-Content-Type-Options" or "Cookie" issues on localhost. You can note in your summary that these were reviewed and considered false positives or low risk for a dev environment.
- **Authentication:** For a deeper scan of protected areas, you can configure ZAP's authentication (e.g. login request and session handling). For a first report, scanning the public/login and any unauthenticated pages is usually enough.
- **One report per run:** Run one full scan (or automated scan), then generate one report from that session so the report matches what was actually tested.

---

## Quick reference

| Step              | Action in ZAP                                      |
|-------------------|----------------------------------------------------|
| Start app         | `./start.sh --dev` or `./start.sh --demo`          |
| Main URL          | `http://localhost:5173` or `http://localhost:4173` |
| Run automated scan| Automated Scan → URL → Attack                      |
| Run full scan     | Spider → then Active Scan on base URL              |
| Generate report   | Report → Generate HTML Report…                     |

If your professor specifies a format (e.g. "OWASP ZAP HTML" or "XML"), use that. Otherwise, the HTML report is the standard deliverable.
