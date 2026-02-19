# Plan review: IAS checklist vs Production mode security demo

Comparison of the two plans to surface discrepancies before building both.

---

## 1. Overlap (no conflict)

| Area | IAS plan | Production plan | Verdict |
|------|----------|-----------------|--------|
| **login.js** | Referenced for traceability (bcrypt, generic errors, rate limit); no implementation change. | **Implementation:** Gate business-owner skip-OTP on `NODE_ENV !== 'production'`. | **OK** — IAS only adds links/comments; production adds one conditional. Do production change first, then add any IAS traceability comment so line numbers stay stable. |
| **auth-service** | CSRF middleware (new or in index.js); validation/sanitizer already there. | No change to auth index or middleware. | **OK** — Different files or different parts of the same file. |
| **start.sh** | Not touched. | Add `--demo` (or repurpose `--production`), prod compose, build+preview, WEB_APP_PORT. | **OK** — Only production plan touches it. |
| **Docs** | STRIDE, OWASP, traceability, optional DFD, DB security note. | Optional DEMO.md / “Security demo checklist” in README. | **OK** — Complementary; no overlap. |
| **Demo vs evidence** | IAS = how to *prove* each requirement (code link, test, manual). | Production = *run* app in demo mode (no FAB/prefill). | **OK** — Use production mode for the demo, then use IAS evidence matrix to prove requirements. |

---

## 2. Discrepancy inside Production plan (flag name)

- **§2, §6, and the flow diagram** say “`./start.sh --production`” for the security-demo flow.
- **Gaps §1 and Summary table** recommend using **`--demo`** so it doesn’t clash with the existing `--production` (full reset).

**Reconciliation:** When implementing the production plan, use **`--demo`** as the security-demo flag. Optionally update the production plan so §2, §6, and the diagram consistently say “`./start.sh --demo`” instead of “`--production`” for the demo flow.

---

## 3. Seeded emails (Mailinator vs example.com)

- **Production plan** uses “admin@example.com” (and similar) in the demo flow text.
- **Actual behavior:** If `.env` has `DEV_EMAIL_ADMIN=bizclear-admin@mailinator.com` (etc.), the seed creates Mailinator addresses, not @example.com.

**Reconciliation:** No change required. For the doc/demo, treat “admin@example.com” as “the seeded admin email (from DEV_EMAIL_ADMIN or default admin@example.com)”. If you want the production plan to be explicit, add one line: “If .env sets DEV_EMAIL_* (e.g. Mailinator), use those emails to log in; otherwise use admin@example.com, etc.”

---

## 4. CSRF and demo mode

- **IAS plan** will add CSRF (tokens or double-submit) for state-changing endpoints.
- **Production plan** doesn’t mention CSRF.

**Reconciliation:** When you implement CSRF (IAS), make sure the SPA obtains and sends the token on mutating requests. The production *build* (Vite preview) is the same app, so it will use the same CSRF flow. No change to the production plan; just ensure the CSRF implementation is SPA-friendly (e.g. cookie + header).

---

## 5. Suggested build order

1. **Production mode plan first**  
   - Add `docker-compose.prod.yml`, `--demo` in start.sh, open-services.sh, login.js business-owner gate.  
   - Gives you a clean demo mode to run the security demo.

2. **IAS plan second**  
   - Implement CSRF; add STRIDE, OWASP, traceability, optional DFD/DB note.  
   - Add traceability links (and optional `// REQUIREMENT IAS-x.x` comments).  
   - After login.js is stable (production change done), add any IAS comment in login.js so the traceability link points to the right line.

3. **Optional**  
   - In the production plan, replace “--production” with “--demo” in §2, §6, and the diagram for consistency.  
   - Add one line in production plan §6: “If you use Mailinator (DEV_EMAIL_* in .env), log in with those addresses instead of @example.com.”

---

## 6. Summary

| Issue | Severity | Action |
|-------|----------|--------|
| Flag name (--production vs --demo) inside production plan | Low | Use `--demo` when implementing; optionally update plan text/diagram to say `--demo`. |
| login.js touched by both | None | Production adds a gate; IAS adds traceability only. Do production first, then IAS. |
| Mailinator vs example.com in demo text | None | Clarify in doc or plan that DEV_EMAIL_* override defaults. |
| CSRF + demo build | None | Implement CSRF so SPA works with it; production build unchanged. |

No blocking conflicts. Build order: production plan → IAS plan; align production plan wording on `--demo` and seeded emails if you want the two plans to stay in sync.
