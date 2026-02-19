# Temporary Emails for Testing

When you need to create many accounts or test signup/OTP/password-reset flows and actually **receive** emails, use one of these approaches.

---

## Option 1: Disposable inbox (recommended for manual/E2E)

Use a **disposable email** domain where any address is valid and you can read messages in one place.

### Mailinator (no signup)

- **Domain:** `@mailinator.com`
- **How:** Use any address, e.g. `mytest1@mailinator.com`, `signup-feb19@mailinator.com`.
- **Read mail:** Open [https://www.mailinator.com](https://www.mailinator.com), enter the **local part** (e.g. `mytest1`) and click Go. All mail to that address appears there.
- **Create many:** Use unique local parts: `test001`, `test002`, `e2e-signup-1`, etc.

### Other options

- **Guerrilla Mail** – [https://guerrillamail.com](https://guerrillamail.com) – gives you a random address; you can refresh for a new one.
- **Temp-mail.org** – [https://temp-mail.org](https://temp-mail.org) – similar; copy the address and use it in your app.

---

## Option 2: Generate test addresses (script)

From the repo root:

```bash
node backend/scripts/generate-test-email.js
# or with a prefix:
node backend/scripts/generate-test-email.js signup
```

This prints a Mailinator address (e.g. `signup-1739876543210@mailinator.com`) and a link to open that inbox. Run it whenever you need a new temporary email.

---

## Option 3: Mock emails (no real inbox)

For **automated tests** or when you don’t need to open the email:

- **Backend:** Leave `EMAIL_API_KEY` unset (or use your test env). The mailer uses a **mock sender**: it doesn’t send real email and **logs the OTP** to the backend console (look for `📧 [MOCK EMAIL] OTP Code: 123456`).
- **Tests:** Fixtures use `generateUniqueEmail()` → `something@example.com`. Those addresses never receive mail; tests that need the OTP either mock the mailer or (in integration) read the code from the in-memory/store or from console/logs if you capture them.

So for **creating a lot** of test accounts:

- **Manual/E2E:** Use Option 1 or 2 (Mailinator + script).
- **Automated:** Keep using `@example.com` and mock/no API key; no temporary email service needed.

---

## Five role emails (LGU Officer, Manager, Admin, Admin 2, Admin 3)

Use these **fixed Mailinator addresses** so the same 5 accounts always receive OTPs in a known place.

| Role        | Email                          | Inbox at mailinator.com |
|------------|----------------------------------|--------------------------|
| LGU Officer | `bizclear-officer@mailinator.com` | `bizclear-officer`       |
| Manager     | `bizclear-manager@mailinator.com` | `bizclear-manager`       |
| Admin       | `bizclear-admin@mailinator.com`   | `bizclear-admin`         |
| Admin 2     | `bizclear-admin2@mailinator.com`  | `bizclear-admin2`        |
| Admin 3     | `bizclear-admin3@mailinator.com`  | `bizclear-admin3`        |

**Hook them up:**

1. In your `.env` (backend or root), add:
   ```bash
   DEV_EMAIL_OFFICER=bizclear-officer@mailinator.com
   DEV_EMAIL_MANAGER=bizclear-manager@mailinator.com
   DEV_EMAIL_ADMIN=bizclear-admin@mailinator.com
   DEV_EMAIL_ADMIN2=bizclear-admin2@mailinator.com
   DEV_EMAIL_ADMIN3=bizclear-admin3@mailinator.com
   ```
2. Ensure `SEED_DEV=true`, then start the auth service (or run your dev stack) so the seed runs.
3. Log in with each email and your `SEED_TEMP_PASSWORD` (default `TempPass123!`). When the app sends an OTP, open [mailinator.com](https://www.mailinator.com), enter the inbox name (e.g. `bizclear-admin`), and use the code.

To print these five emails and the .env snippet anytime:

```bash
node backend/scripts/generate-test-email.js roles
```
