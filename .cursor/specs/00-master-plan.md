# BizClear Full Feature Implementation Plan — Master Index

> **This is the single source of truth for the implementation plan.**
> All 19 spec documents in this directory contain the detailed instructions for each phase.
> The older plan at `temp/bplo_capstone_overhaul.plan.md` is superseded by this — its Phase 2+ items are fully covered (and expanded) by the specs here.

---

## Project Context

**BizClear** is a Business Permit and Licensing Office (BPLO) system for Alaminos City, Pangasinan. It includes:
- **Web app** (React 19 + Vite 7 + Ant Design 5) — dashboards for admin, LGU manager, LGU officer, inspector, CSO, and business owner
- **Backend** (4 Node.js/Express microservices) — auth-service, business-service, admin-service, audit-service
- **Mobile app** (Flutter 3.10+) — inspector field app
- **Blockchain** (Truffle + Ganache) — audit log anchoring
- **AI** (Python + Flask + scikit-learn) — line-of-business recommendation

## What This Plan Accomplishes

Starting from the current state (many features partially built, mock data throughout, broken routes, missing backends, security bugs), this plan takes the app to a fully functional state:

1. Clean up dead code and fix broken imports (Phase 0)
2. Wire all routes so every sidebar link works for every role (Phase 1)
3. Build out the business owner detail panel with real actions — retire, appeal, edit, renew, pay (Phase 2)
4. Make all staff/inspector/CSO dashboards functional with real data (Phase 3)
5. Complete admin features — dashboard KPIs, finance, announcements, fees (Phase 4)
6. Replace ALL mock/static data with real API calls across every page (Phase 4B)
7. Fix infrastructure bugs — violation query, cron jobs, post-requirements, blockchain audit (Phase 4C)
8. Harden audit logging — close 30+ coverage gaps, fix blockchain connectivity, add containment enforcement, forensic recovery (Phase 4C-A)
9. Build the complete notification system for all roles with real-time SSE (Phase 4D)
10. Fix all security issues — dev backdoors, missing CAPTCHA, CSP headers (Phase 4E)
11. Unify the fee taxonomy so AI recommendations map to actual fee configs (Phase 4F)
12. Create the entire LGU Manager backend (7 missing endpoints) with tiered metrics (Phase 4G)
13. Refactor god-object services into focused modules following SOLID principles (Phase 5)
14. Improve AI model accuracy and integrate with fee system (Phase 5B)
15. Add comprehensive tests — unit, integration, cron, and security (Phase 6)
16. Remove all mock data from the mobile app and add proper empty/error states (Phase 7)
17. Polish all forms, loading states, error handling, and responsive design (Phase 8)
18. Measure blockchain gas costs per transaction, project real-world costs, and recommend optimizations (Phase 9)

---

## Execution Order

Each phase must pass the **Validation Gate** (see `spec-validation-gate.md`) before proceeding to the next.

| Order | Phase | Spec File | Summary |
|---|---|---|---|
| 1 | **Phase 0** | `spec-phase0-cleanup.md` | Delete 43 unused files, fix barrel exports, fix broken requires, investigate dead `lgu-officer/` directory |
| 1.5 | **Phase 0B** | `spec-phase0b-comprehensive-seeder.md` | Comprehensive dev seeder — 700+ records making the app look like a live system |
| 2 | **Phase 1** | `spec-phase1-routing.md` | Wire 6 missing staff routes, walk-in integration, sidebar fixes, user search endpoint |
| 3 | **Phase 2** | `spec-phase2-business-owner.md` | ApprovedBusinessView 4-tab redesign, action modals, 8 new endpoints |
| 4 | **Phase 3** | `spec-phase3-staff.md` | Staff page verification, StaffReportsPage, LGU Officer dashboard enhancement, onboarding flow |
| 5 | **Phase 4** | `spec-phase4-admin.md` | Admin dashboard KPIs, finance tabs, announcements, fee config verification |
| 6 | **Phase 4C** | `spec-phase4c-infrastructure.md` | Violation bug fix, install node-cron, wire cron jobs, Inspection model enhancements, PostRequirement, audit client |
| 6.5 | **Phase 4C-A** | `spec-phase4c-audit-hardening.md` | Close 30+ audit gaps, fix blockchain anchoring in admin-service, blockchainStatus tracking, containment enforcement, forensic recovery |
| 7 | **Phase 4D** | `spec-phase4d-notifications.md` | 20+ notification triggers, cross-service SSE push, cron reminders |
| 8 | **Phase 4E** | `spec-phase4e-security.md` | Signup bugs, dev backdoor gating, CAPTCHA, CSP headers, step-up auth |
| 9 | **Phase 4F** | `spec-phase4f-fees.md` | Taxonomy mapping, taxCode field, feeCalculator update, fee preview |
| 10 | **Phase 4G** | `spec-phase4g-lgu-manager-backend.md` | All 7 missing LGU Manager endpoints, tiered metrics, mock data removal |
| 11 | **Phase 4B** | `spec-phase4b-static-data.md` | Replace remaining mock/hardcoded data with real API calls (runs AFTER 4G which creates the endpoints 4B depends on) |
| 12 | **Phase 5** | `spec-phase5-refactoring.md` | Split god-object services, standardize errors, decouple cross-service imports |
| 13 | **Phase 5B** | `spec-phase5b-ai.md` | Dataset dedup, augmentation, retrain, fee integration |
| 14 | **Phase 6** | `spec-phase6-testing.md` | New tests for all phases, integration tests, cron tests, coverage targets |
| 15 | **Phase 7** | `spec-phase7-mobile.md` | Delete mock data, fix 7 inspector screens, ThemeSettingsScreen |
| 16 | **Phase 8** | `spec-phase8-ux.md` | Full form audit, loading states, error handling, responsive, accessibility |
| 17 | **Phase 9** | `spec-phase9-blockchain-cost-analysis.md` | Measure gas cost of every blockchain tx, volume projections, 5 optimization recommendations with before/after savings |
| — | **Gate** | `spec-validation-gate.md` | Mandatory validation after EVERY phase (build, tests, startup, logs) |

---

## Dependency Graph

```
Phase 0 (cleanup)
  └─ Phase 0B (comprehensive seeder) ← run once here, then RE-RUN after all phases complete (final validation)
  └─ Phase 1 (routing)
       └─ Phase 2 (business owner)
       └─ Phase 3 (staff + LGU Officer dashboard)
            └─ Phase 4 (admin)
                 ├─ Phase 4C (infrastructure + cron wiring)
                 │    ├─ Phase 4C-A (audit hardening) ← depends on 4C (audit client must exist)
                 │    ├─ Phase 4D (notifications) ← depends on 4C
                 │    └─ Phase 4G (LGU Manager backend) ← depends on 4C
                 │         └─ Phase 4B (static data) ← depends on 4G (endpoints must exist first)
                 ├─ Phase 4E (security)
                 └─ Phase 4F (fees)
                      └─ Phase 5 (refactoring) ← after all 4x phases
                           └─ Phase 5B (AI) ← after 4F
                                └─ Phase 6 (testing) ← after all features
                                     ├─ Phase 7 (mobile)
                                     ├─ Phase 8 (UX polish)
                                     └─ Phase 9 (blockchain cost analysis) ← after ALL features finalized
```

**Phases that can run in parallel** (after their shared dependency):
- 4C, 4E, 4F can all start once Phase 4 is done
- 4C-A, 4D, and 4G can start once 4C is done (4C-A can run in parallel with 4D and 4G)
- 4B runs after 4G (it needs the LGU Manager endpoints that 4G creates)
- Phase 7, 8, and 9 can run in parallel after Phase 6 (Phase 9 benefits from having all features finalized but only reads blockchain data — no code changes)

---

## Validation Protocol

After completing each phase, run the gates marked in the Phase-to-Gate Matrix in `spec-validation-gate.md`. The minimum for every phase:

1. `cd web && npm run build` (if web files changed)
2. `cd web && npm test -- --run` (if web files changed)
3. `cd backend && npm test` (if backend files changed)
4. Start affected microservices and verify zero error logs
5. `cd mobile/app && flutter analyze` (if mobile files changed)

**No phase is complete until all its gates pass.**

### Final Full-Stack Validation (after ALL phases are done)

After completing the very last phase, run this comprehensive check to confirm the entire system works:

```bash
# 1. Re-run the comprehensive seeder (picks up any new models/fields from later phases)
cd backend && npm run seed:demo:reset && npm run seed:demo

# 2. Web build + all web tests
cd web && npm run build && npm test -- --run

# 3. All backend tests
cd backend && npm test

# 4. Start ALL 4 microservices and verify zero error logs
./verify-service.sh backend/services/auth-service 3001
./verify-service.sh backend/services/business-service 3002
./verify-service.sh backend/services/admin-service 3003
./verify-service.sh backend/services/audit-service 3004

# 5. Cross-service health checks
curl http://localhost:3001/api/auth/health
curl http://localhost:3002/api/business/health
curl http://localhost:3003/api/admin/health
curl http://localhost:3004/api/audit/health

# 6. Blockchain anchoring verification
curl http://localhost:3004/api/audit/queue-status -H "X-API-Key: $AUDIT_SERVICE_API_KEY"
# Expect: blockchainAvailable: true, unanchored.failed: 0

# 7. Mobile build
cd mobile/app && flutter analyze && flutter build apk --debug

# 8. Docker Compose full stack
docker-compose -f docker-compose.dev.yml up --build
# Verify all containers start and report healthy

# 9. Dev server smoke test
cd web && npm run dev
# Login as each role (admin, manager, officer, inspector, business_owner)
# Verify dashboards show seeded data, no console errors, no white screens

# 10. Blockchain gas cost script (Phase 9 output)
cd blockchain && node scripts/measure-gas-costs.js
# Verify blockchain/reports/gas-cost-analysis.json is generated
```

**The system is ready when ALL 10 steps pass.** This is the definition of done.

---

## How to Use These Specs

When starting a phase:
1. Read the spec file for that phase top to bottom
2. Each spec contains: overview, prerequisites, exact file paths, code changes, new endpoints, edge cases, acceptance criteria, and rollback plan
3. Follow the changes in order within the spec
4. After completing all changes, run the validation gate
5. Fix any failures before moving to the next phase

Each spec is self-contained — you should not need to reference other specs while implementing one (unless the spec explicitly says "see spec-phaseX for...").

---

## Key Architecture Decisions

| Decision | Rationale |
|---|---|
| LGU Manager endpoints live on business-service | Business-service owns all the models being aggregated (BusinessProfile, Inspection, Violation, Appeal, Payment) |
| Dashboard metrics are tiered (Tier 1 / Tier 2) | Tier 1 = simple counts we can compute now. Tier 2 = SLA, trends, workload that need new infrastructure. Frontend hides Tier 2 when null. |
| Cross-service notification push via HTTP | Admin-service and business-service POST to auth-service's `/api/notifications/internal-push` endpoint to trigger SSE. Simple, no Redis needed for single-instance deployment. |
| Service refactoring uses facade pattern | Split files re-export through the original module name, so all existing `require()` calls keep working without changes. |
| Test data buttons gated behind `import.meta.env.DEV` | "Fill with Test Data" buttons on forms only appear in dev builds, never in production. |
| Dev backdoors gated behind `NODE_ENV=development` | Email "1" login, hardcoded OTPs, MFA bypass — all require explicit dev environment. |
| Audit-service is the sole blockchain gateway | Auth, business, and admin services forward audit logs via HTTP POST to audit-service. No service except audit-service talks to the blockchain directly. Stubs in other services are no-ops. |
| Containment is middleware-enforced | When `containmentActive: true` on a TamperIncident, affected users receive HTTP 423 on state-changing routes via shared middleware. |

---

## Known Gaps / Future Work

These items surfaced during planning but are out of scope for this iteration:

- **LGU Manager Tier 2 metrics**: SLA compliance, performance trends, department workload, anomaly detection — require SLA config model, historical snapshots, and cross-service queries. Stubbed in Phase 4G.
- **i18n (Filipino/English)**: Not addressed in these specs. Tracked in `temp/bplo_capstone_overhaul.plan.md`.
- **Offline sync (mobile)**: Not addressed. Tracked in the overhaul plan.
- **Map integration (mobile)**: Not addressed. Tracked in the overhaul plan.
- **Print/PDF templates**: Permit PDFs and receipts with Filipino formatting. Not spec'd.
- **API documentation (OpenAPI/Swagger)**: Not addressed.
- **CSO Customer Support feature**: CSO dashboard is a placeholder. Full support ticket system is not spec'd.

---

## Superseded Documents

| Old Document | Status |
|---|---|
| `temp/bplo_capstone_overhaul.plan.md` | Phase 1 completed (notebooks). Phases 2-9 are superseded by specs in this directory. |
