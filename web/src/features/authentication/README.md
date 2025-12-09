# Authentication (Frontend) — Notes & Server Expectations

This file documents the frontend authentication behavior (including the admin login flow) and the server response shapes that the UI expects for best UX.

Purpose
- Describe admin login UX and two-step verification expectations.
- Document structured error/lock payloads the frontend reads to display lockout state.
- Explain how the frontend stores tokens and attaches them to API calls.

Admin login flow (frontend)
- Path: `/admin/login` (component: `web/src/pages/AdminLogin.jsx`).
- Two-step flow:
  1. Credentials step: POST `/api/auth/admin/login/start` with `{ email, password }`.
  2. Verify step: POST `/api/auth/admin/login/verify` with `{ email, code }`.
- UX behaviors implemented:
  - Generic client-side error messages (e.g. "Authentication failed") to avoid account enumeration.
  - Dev code display: if the backend returns `devCode` (only in non-production), it will be shown in an info alert to aid local testing.
  - Resend cooldown: the client disables resending for 60s after a send and shows a countdown.
  - Server-side lockout reflection: if the server returns lock metadata the UI shows a lock banner and disables relevant actions.

Frontend handling of success responses
- Preferred success response shapes (either is acceptable):
  - `{ user: { id, email, role, ... }, token: "<jwt>" }` — frontend will call `login(user)` and persist the object.
  - `{ token: "<jwt>", user: { ... } }` — frontend will decode `token` if `user` isn't present and derive claims.
- After successful verify the UI calls `login()` from `useAuthSession()` so `RequireAdmin` and other UI can read `currentUser` / `role`.

Expected error and lock shapes (for best UX)
- When the server returns a non-ok response (4xx/5xx), the frontend's admin service functions now reject with `{ status, body }`.
- For lockout display, the frontend looks for one of the following fields in the error `body` (in order of preference):
  - `adminLockedUntil` (ms since epoch OR ISO string)
  - `lockedUntil` / `locked_until` (ISO string or numeric)
  - `lockedUntilMs` / `locked_until_ms` (numeric ms)
  - `lockExpires` (ISO string)
- Example lock error bodies the frontend can handle:
  - `{ error: 'account_locked', adminLockedUntil: 1700000000000 }`
  - `{ error: 'account_locked', lockedUntil: '2025-12-10T12:34:56Z' }`

Common status codes the frontend expects:
- `401` — invalid credentials / generic authentication failure (frontend shows generic message).
- `429` — too many attempts (rate limit). Backend may include lock info in body.
- `423` — locked (explicit account lock). Backend SHOULD include `lockedUntil`/`adminLockedUntil` with a timestamp.

Networking & token handling
- `web/src/lib/http.js` now reads `getCurrentUser()` from the auth event store and, when `currentUser.token` is present and no explicit `Authorization` header is provided, automatically adds `Authorization: Bearer <token>` to outgoing requests.
- Service functions (`authService.js`) for admin endpoints return structured rejects (`{ status, body }`) when responses are non-ok so callers can inspect lock metadata.

Guarding admin routes
- `RequireAdmin` (exported from `web/src/features/authentication`) checks `useAuthSession()` and redirects non-admins to `/admin/login`.
- Important: frontend guards are UX protections only. The backend MUST enforce role checks and lockout policies; frontend-only controls are not a security boundary.

Testing
- There are unit tests using Vitest under `web/src/__tests__`. To run tests from the `web` folder:
  ```bash
  npm install
  npm test
  ```
- Added tests include `adminLoginLock.test.js` which mocks `fetchWithFallback` to ensure admin services propagate structured lock objects.

Recommendations for server implementers
- Return structured JSON errors for locked accounts, include an ISO timestamp or epoch ms in `lockedUntil` (or `adminLockedUntil`).
- Do not include verbose messages indicating whether an account exists. Use a generic error like `{ error: 'invalid_credentials' }` for failed verification and a separate `{ error: 'account_locked', lockedUntil: <timestamp> }` when locked.
- Return `token` and/or `user` on successful admin verify so the frontend can persist session state.

Limitations
- The frontend's cooldown is client-side; server-side rate-limiting and persistent lockout are required for real security.
- JWT decoding in the browser is only for convenience UX; do not rely on it for authorization decisions — always validate server-side.

Contact / maintenance
- If the backend changes error shapes, update the frontend `authService.js` and `AdminLogin.jsx` to parse the new fields.
# Authentication Feature (Consolidated)

Preferred import paths and usage:

- Components and flows: import from `@/features/authentication`.
  - Example: `import { LoginForm, PasswordResetFlow, LoggedInEmailChangeFlow, LoggedInPasswordChangeFlow } from '@/features/authentication'`
  - Entry flows and logged-in account flows are re-exported here for a single API surface.

 - Hooks: import from `@/features/authentication/hooks`.
   - Example: `import { useAuthSession, useLogin, useChangeEmailForm, useLoggedInEmailChangeFlow } from '@/features/authentication/hooks'`

- Validations: import from `@/features/authentication/validations`.
  - Example: `import { loginEmailRules } from '@/features/authentication/validations'`

- Services: internal to the feature. Use `@/features/authentication/services` only within authentication hooks/components to avoid circular dependencies.
  - Example (internal): `import { loginPost } from '@/features/authentication/services'`

Notes:
- Logged-in account settings (flows, components, hooks) are consolidated under `@/features/authentication`. Prefer importing from the authentication barrels.
- Hooks and validations have their own barrels to keep imports stable and avoid deep paths.