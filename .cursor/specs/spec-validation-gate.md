# Validation Gate: Mandatory After Every Phase

## Overview
This document defines the mandatory validation steps that MUST pass after completing each phase (0 through 9). No phase is considered complete until all applicable gates pass. This prevents regressions from accumulating across phases.

---

## Gate 1: Web Build (every phase that touches web/)

```bash
cd web && npm run build
```

**Pass criteria:** Exit code 0, no TypeScript/JSX compilation errors, no missing imports.

**When to run:** After every phase that modifies any file under `web/`.

---

## Gate 2: Web Tests (every phase that touches web/)

```bash
cd web && npm test -- --run
```

**Pass criteria:** All tests pass. Zero failures.

**When to run:** After every phase that modifies any file under `web/`.

**If tests fail:** Fix them BEFORE moving to the next phase. Do not defer to Phase 6.

---

## Gate 3: Backend Tests (every phase that touches backend/)

```bash
cd backend && npm test
```

**Pass criteria:** All tests pass. Zero failures.

**When to run:** After every phase that modifies any file under `backend/`.

**If tests fail:** Fix them BEFORE moving to the next phase. Do not defer to Phase 6.

---

## Gate 4: Microservice Startup (every phase that touches backend/)

Start each microservice individually and verify it initializes without errors.

```bash
# Terminal 1: Auth service
cd backend/services/auth-service && node src/index.js

# Terminal 2: Business service
cd backend/services/business-service && node src/index.js

# Terminal 3: Admin service
cd backend/services/admin-service && node src/index.js

# Terminal 4: Audit service
cd backend/services/audit-service && node src/index.js
```

**Pass criteria for each service:**
1. Prints its "listening on port XXXX" message
2. No `Error`, `TypeError`, `ReferenceError`, `SyntaxError`, or `UnhandledPromiseRejection` in the first 10 seconds of output
3. No `Cannot find module` errors
4. No `MongooseError` or connection failures (assumes MongoDB is running)
5. Service stays running (doesn't crash immediately)

**When to run:** After every phase that modifies backend service files, models, routes, or middleware.

**Shortcut:** If only one service was modified, only that service needs startup verification. If shared code (`backend/shared/`) was modified, verify ALL services.

---

## Gate 5: Cross-Service Communication (after Phases 4D, 5)

After phases that change inter-service communication:

```bash
# Start all services, then test:

# 1. Auth service health
curl http://localhost:3001/api/auth/health

# 2. Business service health
curl http://localhost:3002/api/business/health

# 3. Admin service health
curl http://localhost:3003/api/admin/health

# 4. Audit service health
curl http://localhost:3004/api/audit/health

# 5. Cross-service: notification push (Phase 4D+)
curl -X POST http://localhost:3001/api/notifications/internal-push \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_SERVICE_KEY" \
  -d '{"userId":"test","notification":{"title":"test","message":"test"}}'
```

**Pass criteria:** All health endpoints return 200. Internal push returns 200.

**When to run:** After Phase 4C-A (audit hardening), Phase 4D (notifications), Phase 5 (refactoring with internal endpoints).

### Gate 5B: Audit Blockchain Anchoring (after Phase 4C-A)

After audit hardening, verify that audit logs from all services reach the blockchain:

```bash
# 1. Trigger an audit log in auth-service (login)
curl -X POST http://localhost:3001/api/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"TempPass123!"}'

# 2. Wait 5 seconds for blockchain queue to process
sleep 5

# 3. Check audit-service queue status
curl http://localhost:3004/api/audit/queue-status \
  -H "X-API-Key: $AUDIT_SERVICE_API_KEY"

# 4. Verify the most recent audit log has a txHash
# (query MongoDB directly or via audit-service API)

# 5. Check for failed/skipped anchors
curl "http://localhost:3004/api/audit/queue-status" \
  -H "X-API-Key: $AUDIT_SERVICE_API_KEY"
# Expect: unanchored.failed = 0, unanchored.skipped = 0 (with blockchain running)
```

**Pass criteria:**
- Queue status endpoint returns 200 with `blockchainAvailable: true`
- After triggering audit events in each service, `txHash` is populated within 10 seconds
- No `blockchainStatus: 'failed'` records when Ganache is running
- `GET /api/audit/forensic/:id` returns correct hash comparison for any audit log

---

## Gate 6: Mobile Build (every phase that touches mobile/)

```bash
cd mobile/app && flutter analyze && flutter build apk --debug
```

**Pass criteria:**
- `flutter analyze`: No errors (warnings are acceptable)
- `flutter build apk --debug`: Exit code 0

**When to run:** After every phase that modifies any file under `mobile/`.

---

## Gate 7: Lint Check (every phase)

```bash
# Web linting
cd web && npx eslint src/ --quiet

# Backend linting (if eslint is configured)
cd backend && npx eslint . --quiet 2>/dev/null || true
```

**Pass criteria:** No new errors introduced. Pre-existing warnings are acceptable.

**When to run:** After every phase.

---

## Gate 8: Dev Server Smoke Test (after major phases)

After Phases 0, 1, 2, 4, 5, 8:

```bash
cd web && npm run dev
```

Then manually verify:
1. Dev server starts on the expected port (usually 5173)
2. Home page loads at `http://localhost:5173/`
3. Login page loads at `http://localhost:5173/login`
4. No console errors in browser DevTools
5. No white screen of death

**When to run:** After phases that change routing, layouts, or significant UI components.

---

## Gate 9: Docker Compose (after Phase 5B, final)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Pass criteria:** All containers start, all services report healthy, AI service responds to `/health`.

**When to run:** After Phase 5B (AI), and as the final validation after all phases are complete.

---

## Phase-to-Gate Matrix

| Phase | G1 Build | G2 Web Test | G3 Backend Test | G4 Startup | G5 Cross-Svc | G6 Mobile | G7 Lint | G8 Dev Smoke | G9 Docker |
|---|---|---|---|---|---|---|---|---|---|
| **0** | YES | YES | YES | ALL 4 | — | YES | YES | YES | — |
| **0B** | — | — | YES | ALL 4 | — | — | — | YES | — |
| **1** | YES | YES | YES | auth, business | — | — | YES | YES | — |
| **2** | YES | YES | YES | business, admin | — | — | YES | YES | — |
| **3** | YES | YES | YES | admin, business | — | — | YES | — | — |
| **4** | YES | YES | YES | admin, business | — | — | YES | YES | — |
| **4C** | YES | — | YES | business | — | — | YES | — | — |
| **4C-A** | — | — | YES | ALL 4 | YES | — | YES | — | — |
| **4D** | YES | YES | YES | ALL 4 | YES | — | YES | — | — |
| **4E** | YES | YES | YES | ALL 4 | — | YES | YES | — | — |
| **4F** | — | — | YES | business | — | — | YES | — | — |
| **4G** | YES | YES | YES | business | — | — | YES | YES | — |
| **4B** | YES | YES | YES | business | — | — | YES | — | — |
| **5** | — | — | YES | ALL 4 | YES | — | YES | YES | — |
| **5B** | — | — | — | — | — | — | — | — | YES |
| **6** | YES | YES | YES | ALL 4 | YES | YES | YES | YES | — |
| **7** | — | — | — | — | — | YES | — | — | — |
| **8** | YES | YES | — | — | — | — | YES | YES | — |
| **9** | — | — | — | audit | — | — | — | — | — |
| **FINAL** | YES | YES | YES | ALL 4 | YES | YES | YES | YES | YES |

---

## Error Log Verification Script

For automated microservice log checking, use this pattern:

```bash
#!/bin/bash
# verify-service.sh <service-dir> <port>
SERVICE_DIR=$1
PORT=$2

cd "$SERVICE_DIR" && timeout 15 node src/index.js 2>&1 | tee /tmp/service-log.txt &
PID=$!
sleep 10

# Check for errors in log output
if grep -iE "(Error|TypeError|ReferenceError|SyntaxError|Cannot find module|UnhandledPromiseRejection|EADDRINUSE)" /tmp/service-log.txt; then
  echo "FAIL: Errors found in $SERVICE_DIR logs"
  kill $PID 2>/dev/null
  exit 1
fi

# Check if process is still running
if ! kill -0 $PID 2>/dev/null; then
  echo "FAIL: $SERVICE_DIR crashed during startup"
  exit 1
fi

# Check if port is listening
if ! curl -sf "http://localhost:$PORT" > /dev/null 2>&1; then
  echo "WARN: Port $PORT not responding (may be normal if no root route)"
fi

echo "PASS: $SERVICE_DIR started cleanly"
kill $PID 2>/dev/null
```

Usage:
```bash
./verify-service.sh backend/services/auth-service 3001
./verify-service.sh backend/services/business-service 3002
./verify-service.sh backend/services/admin-service 3003
./verify-service.sh backend/services/audit-service 3004
```

---

## Gate 10: Final Full-Stack Validation (after ALL phases)

This gate runs only once — after every phase (including 7, 8, 9) is done. It confirms the entire system is production-ready.

### 10A. Re-seed with comprehensive data

```bash
cd backend && npm run seed:demo:reset && npm run seed:demo
```

**Pass criteria:** Script completes in under 30 seconds, prints 700+ records, no validation errors.

**Why:** Later phases may have added new model fields (e.g., `blockchainStatus` on AuditLog, new Inspection fields from 4C). The seeder must work with the final schema.

### 10B. All tests pass (backend + web + mobile)

```bash
cd backend && npm test
cd web && npm test -- --run
cd mobile/app && flutter test
```

**Pass criteria:** Zero failures across all three. This is the single most important check.

### 10C. All 4 microservices start with zero error logs

```bash
# Run the verify script for ALL services:
./verify-service.sh backend/services/auth-service 3001
./verify-service.sh backend/services/business-service 3002
./verify-service.sh backend/services/admin-service 3003
./verify-service.sh backend/services/audit-service 3004
```

**Pass criteria:** Every service prints its "listening on port" message, stays alive for 10+ seconds, and produces zero lines matching `Error|TypeError|ReferenceError|SyntaxError|Cannot find module|UnhandledPromiseRejection`.

### 10D. Cross-service communication works

```bash
# Health checks
curl -sf http://localhost:3001/api/auth/health && echo "auth OK"
curl -sf http://localhost:3002/api/business/health && echo "business OK"
curl -sf http://localhost:3003/api/admin/health && echo "admin OK"
curl -sf http://localhost:3004/api/audit/health && echo "audit OK"

# Notification push
curl -sf -X POST http://localhost:3001/api/notifications/internal-push \
  -H "Content-Type: application/json" \
  -H "x-internal-key: $INTERNAL_SERVICE_KEY" \
  -d '{"userId":"test","notification":{"title":"test","message":"test"}}' && echo "push OK"

# Audit queue
curl -sf http://localhost:3004/api/audit/queue-status \
  -H "X-API-Key: $AUDIT_SERVICE_API_KEY" && echo "audit queue OK"
```

**Pass criteria:** All return HTTP 200. Audit queue shows `blockchainAvailable: true` and `unanchored.failed: 0`.

### 10E. Every role sees populated dashboards (manual smoke test)

Login to the web app as each seeded user and verify:

| Role | Login | Verify |
|---|---|---|
| Business Owner | `maria.santos@example.com` | 2-3 businesses listed, approved business shows payments/inspections, notification badge has count |
| LGU Officer | `officer@example.com` | 15 pending applications in PermitReviewPage, clicking one shows full detail panel |
| LGU Manager | `manager@example.com` | All KPI cards show real numbers (not 0, not mock), overdue inspection alert visible |
| Inspector | `inspector@example.com` | 10 pending + 25 completed inspections, violation list populated |
| Admin | `admin@example.com` | Dashboard KPIs populated, 55 payment records in finance, 44 users in user management |

**Pass criteria:** No dashboard shows "0" or mock data. No white screens. No console errors in DevTools.

### 10F. Docker Compose full stack

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Pass criteria:** All containers start. Web app accessible. API responds. AI service `/health` returns 200. Blockchain contract deployed.

### 10G. Blockchain gas cost report generated

```bash
cd blockchain && node scripts/measure-gas-costs.js
```

**Pass criteria:** `blockchain/reports/gas-cost-analysis.json` is created with measured `gasUsed` values for all 14 transaction types. `blockchain/reports/blockchain-cost-analysis.md` is generated.

---

## Key Principle

**Never defer broken tests or startup errors to a later phase.** Every phase must leave the project in a working state. Phase 6 adds NEW tests — it should not be the first time we discover that existing tests are broken.

**The system is not done until Gate 10 passes in its entirety.**
