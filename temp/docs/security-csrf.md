# CSRF Protection (IAS-2.7)

The application uses **double-submit cookie** CSRF protection for state-changing requests (POST, PUT, PATCH, DELETE).

## Implementation

- **Shared middleware:** [backend/shared/csrf.js](../backend/shared/csrf.js)
- **Auth-service:** Token endpoint `GET /api/auth/csrf-token`; middleware applied to all `/api/auth` mutating requests.
- **Admin-service:** Token endpoint `GET /api/admin/csrf-token`; middleware applied to `/api/admin`.
- **Business-service:** Token endpoints `GET /api/business/csrf-token`, `GET /api/inspector/csrf-token`, `GET /api/lgu-officer/csrf-token`; middleware applied to `/api/business`, `/api/inspector`, `/api/lgu-officer`.

## Behavior

1. **Get token:** Before sending a mutating request, the SPA calls the appropriate `GET .../csrf-token` endpoint. The server sets a cookie (`csrf-token`) and returns `{ csrfToken: "..." }`.
2. **Send token:** On every POST/PUT/PATCH/DELETE request, the client sends the same value in the **`X-CSRF-Token`** header (or read the cookie and send it; cookie name is `csrf-token`).
3. **Verification:** The server compares the header value to the cookie; if they match, the request proceeds; otherwise it returns `403` with `csrf_invalid`.

## Configuration

- **Disable CSRF:** Set `DISABLE_CSRF=true` (e.g. for tests or legacy clients). CSRF is also disabled when `NODE_ENV=test`.
- **Cookie:** `csrf-token`, sameSite `lax`, path `/`, 24h maxAge; `secure` in production.

## SPA integration

- On app load (or before first mutating request), fetch `GET /api/auth/csrf-token` (and optionally admin/business tokens if the app calls those backends).
- Store the returned `csrfToken` (or read from the `csrf-token` cookie) and set the header `X-CSRF-Token` on every POST/PUT/PATCH/DELETE to the same origin.
- Ensure `credentials: 'include'` (or equivalent) so the cookie is sent with requests.
