# Understanding Your ZAP Report — Scope and “Quick Scan”

This doc helps you interpret your ZAP report and answer: **Was the scan too quick? Did we miss anything?**

---

## 1. Why was the scan quick?

Your report says:

- **Sites included:** only `http://localhost:5173` and `https://localhost:5173` (the Vite dev server).
- **Insights → Count of total endpoints:** **6** for `http://localhost:5173` and **1** for `https://localhost:5173`.

So ZAP only saw **a handful of requests**. In your report, the URLs that actually appear are:

- `http://localhost:5173/` (root)
- `http://localhost:5173/sitemap.xml`
- `http://localhost:5173/building.svg`
- `https://localhost:5173/` (one request)

That’s it. So:

- **Yes, it’s normal for this scan to be quick** when you run an **Automated Scan** on a single base URL.
- ZAP ran a short spider + active scan on that URL; for a **single-page app (SPA)** like yours, the spider often only gets the initial HTML and a few static assets (favicon, sitemap, etc.). It does **not** automatically “walk” your client-side routes (`/login`, `/owner`, `/admin`, etc.) unless something (e.g. a browser) requests them.
- **Backend APIs were not in scope:** ports 3001, 3002, 3003, 3004 are not listed in “Sites included,” so ZAP did not scan your auth, business, admin, or audit APIs at all.

**Summary:** The scan was quick because **very little was in scope** (one origin, a few URLs). You didn’t do anything wrong; that’s the expected result for a single Automated Scan on the front-end URL.

---

## 2. What your current report does and doesn’t cover

| Covered by this report | Not covered by this report |
|------------------------|-----------------------------|
| Front-end dev server at `localhost:5173` (a few URLs) | Backend APIs (3001–3004) |
| Passive checks on responses (headers, SRI, etc.) | Authenticated routes (e.g. after login) |
| A small number of requests (6–7 endpoints) | Most of your app’s “pages” (SPA routes) |
| Active scan only on those few URLs | Injection/auth tests on API endpoints |

So:

- **We didn’t miss any findings that are in the report** — all 6 alert types (CSP, HTTP Only Site, Anti-clickjacking, SRI, X-Content-Type-Options, Modern Web Application) were accounted for in the earlier summary.
- **What’s “missing” is scope:** the report doesn’t claim to have tested your APIs or your full app surface; it only tested what ZAP discovered (a few URLs on 5173).

---

## 3. All findings in this report (checklist)

For your 2026-02-27 report, every **alert type** is one of these:

| # | Alert type | Risk | Source | Notes |
|---|------------|------|--------|--------|
| 1 | Content Security Policy (CSP) Header Not Set | Medium | Passive | Add CSP in production (e.g. reverse proxy). |
| 2 | HTTP Only Site | Medium | Active | Expected on localhost; use HTTPS in production. |
| 3 | Missing Anti-clickjacking Header | Medium | Passive | Set X-Frame-Options or CSP frame-ancestors. |
| 4 | Sub Resource Integrity Attribute Missing | Medium | Passive | External scripts/links without `integrity` (e.g. Google Fonts). |
| 5 | X-Content-Type-Options Header Missing | Low | Passive | Set `X-Content-Type-Options: nosniff`. |
| 6 | Modern Web Application | Informational | Passive | FYI only; not a vulnerability. |

So: **nothing was missed in the sense of “forgotten alert types.”** The earlier conclusion was correct; the only caveat is the **limited scope** (see above).

---

## 4. If you want a more thorough report (optional)

If your professor expects “more” coverage or you want a second, deeper report:

1. **Include backend APIs**
   - In ZAP, open **Manual Explore** or a new session.
   - Visit (or add to the Sites tree):  
     `http://localhost:3001`, `http://localhost:3002`, `http://localhost:3003`, `http://localhost:3004`.
   - Run **Spider** and **Active Scan** on these hosts (or on a context that includes them).
   - Generate a new report; it will include API endpoints and may find more issues (e.g. missing headers on API responses, or more attack surface).

2. **Increase front-end coverage**
   - Use ZAP’s **built-in browser** (or set your browser to use ZAP as proxy).
   - Manually go to `http://localhost:5173`, then click through: Login, Dashboard, Owner/Admin areas, etc. That will add many more URLs (HTML, JS, API calls) to the session.
   - Then run **Spider** (to pick up any links) and **Active Scan** on the base URL or the whole site.
   - Generate the report again; you’ll see more endpoints and possibly more instances of the same header/SRI findings on different URLs.

3. **Authenticated scan (advanced)**
   - Configure ZAP **Authentication** (e.g. form-based login with your app’s login URL and credentials).
   - So ZAP can request protected pages and run active scans against them. This is optional and more involved; only needed if you want findings “behind login.”

---

## 5. What to tell your professor

You can say:

- **“The scan was quick because…”**  
  Only the front-end dev server (`localhost:5173`) was in scope, and ZAP discovered only a few URLs (root, sitemap, a static asset). So the scan naturally finished quickly. No High/Critical issues were found on that scope.

- **“We didn’t miss any findings in the report…”**  
  All six alert types (CSP, HTTP Only Site, Anti-clickjacking, SRI, X-Content-Type-Options, Modern Web Application) were summarized; they are all configuration/header-related, and we’ve documented how we’ll address them in production (see zap-security-report-guide and manual-risk-testing-guide).

- **“What the report does not cover…”**  
  Backend APIs (ports 3001–3004) and most SPA routes were not in scope. For a fuller assessment we can run a second scan with APIs and manual browsing included (as in section 4 above).

That way you’re accurate about both the report’s conclusions and its scope.
