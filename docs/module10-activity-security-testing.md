# Module 10 Activity: Testing and Debugging for Security

## Part A — Secure Testing Matrix

| Module/Function | Possible Vulnerability | Type of Test (Manual or Tool) | Expected Behavior if Fixed |
|-----------------|------------------------|--------------------------------|----------------------------|
| **Login API** (`/api/auth/login/start`) | Weak password validation | Manual form test + unit test | Rejects passwords &lt; 12 chars and without upper, lower, number, special |
| | Brute force / no rate limit | Tool (e.g. OWASP ZAP) or manual script | Returns 429 or lockout after N failed attempts |
| | SQL/NoSQL injection in email/identifier | Unit test with payloads like `' OR '1'='1` | Request rejected or treated as literal string; no DB error leaked |
| **Profile update API** (`PATCH /api/auth/profile/*`) | Missing or weak JWT validation | Manual + integration test | 401 when token missing or invalid |
| | Unvalidated input (XSS in name fields) | Manual + sanitization unit test | Names sanitized or rejected if invalid characters |
| | IDOR (change another user’s profile) | Integration test with different user token | 403 or scope limited to own user |
| **Signup / business form** | Weak password at registration | Unit test on signup validation | Rejects passwords that fail strength rules |
| | Unbounded input length (DoSS) | Manual + max-length validation | Rejects or truncates at server limit (e.g. 200 chars) |
| | Stored XSS in text fields | Manual + tool (ZAP) + encoding on output | User input escaped when rendered |

### Questions

**1. How can an attacker exploit it?**  
An attacker can exploit weak password validation by setting short or simple passwords, then brute-forcing or guessing them. Missing rate limits allow unlimited login attempts. Injection in the login identifier can manipulate the query to bypass authentication or leak data if the backend built queries from unsanitized input.

**2. Provide a secure fix.**  
Enforce a strong password policy (e.g. minimum 12 characters, upper, lower, number, special) and validate it server-side. Add per-email and per-IP rate limiting and account lockout after repeated failures. Use parameterized queries or an ORM (e.g. Mongoose) so user input is never concatenated into raw queries; validate and normalize identifiers (e.g. email format) before lookup.

---

## Part B — Unit Testing for Secure Functions

### Task 1: Password Validation

**Vulnerable code (simulated — project uses strong validation)**

Our auth-service uses `validatePasswordStrength` (12+ chars, complexity). Below simulates a weak check that could have existed earlier:

```javascript
function validatePassword(password) {
  return password && password.length > 3
}
```

**Questions**

1. **What is the security issue?**  
   The function only checks length &gt; 3, so very short or trivial passwords (e.g. "1234", "aaaa") are accepted. That makes brute force and guessing easy and violates basic password policy.

2. **Write a unit test that exposes the flaw.**

```javascript
function test_short_password() {
  expect(validatePassword('1234')).toBe(false)
  expect(validatePassword('ab')).toBe(false)
}
```

(Current vulnerable code fails because it returns `true` for `"1234"`.)

3. **Fix the function.**

```javascript
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false
  if (password.length < 12) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/\d/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  if (password.length > 200) return false
  return true
}
```

**Unit test (fails on vulnerable code)**

```javascript
function test_short_password() {
  expect(validatePassword('1234')).toBe(false)
}
```

**Expected secure behavior**

1. Passwords shorter than 12 characters are rejected.  
2. Passwords without at least one uppercase, one lowercase, one digit, and one special character are rejected.

---

### Task 2: SQL Injection Check

Our backend uses Mongoose (no raw SQL). Below simulates a vulnerable pattern as if we used raw SQL.

**Vulnerable code (simulated)**

```javascript
function findUser(username, db) {
  const query = "SELECT * FROM users WHERE username = '" + username + "'"
  return db.execute(query)
}
```

**Manual test input:** `' OR '1'='1`  
If login succeeds with that input, the endpoint is vulnerable.

**Questions**

1. **What vulnerability exists?**  
   Concatenating user input into the SQL string allows an attacker to break out of the string and inject conditions (e.g. `' OR '1'='1`) so the query returns rows without a valid username, enabling authentication bypass or data exposure.

2. **What type of test should detect it?**  
   An integration or security test that sends injection payloads (e.g. `' OR '1'='1`, `'; DROP TABLE users; --`) to the login or user-lookup endpoint and asserts that login fails and no DB error is reflected in the response.

3. **Fix the code (parameterized query / ORM)**

```javascript
function findUser(username, db) {
  return db.query('SELECT * FROM users WHERE username = ?', [username])
}
```

Or with Mongoose (as in our project):

```javascript
async function findUser(username) {
  return User.findOne({ username }).lean()
}
```

**Expected behavior**

1. The input `' OR '1'='1` is treated as a literal string; no extra rows are returned.  
2. Login fails for that payload and no SQL syntax or DB error is exposed to the client.

---

## Reflection Questions

**1. Why is unit testing alone not enough for security?**

- Unit tests run single functions in isolation and often mock the database and network, so they do not prove that the full request-to-database path is safe. An attacker targets the whole system, not one function.
- Security bugs often depend on how layers interact (e.g. validated input later logged or passed to a query). Unit tests usually don't cover those cross-layer flows.
- Many vulnerabilities are configuration or environment issues (e.g. missing rate limits, weak CORS). These are found by integration tests, penetration tests, or scanning tools, not unit tests alone.
- Attack techniques like IDOR or session fixation depend on multiple requests and state. Unit tests don't simulate that; you need integration or E2E tests and sometimes manual or tool-based testing.
- Compliance and standards (e.g. OWASP, NIST) expect evidence that controls work in the running system. That evidence comes from integration and penetration testing, not only unit tests.

**2. Which vulnerability is most critical in this lab? Why?**

- SQL injection in the login or user lookup is the most critical, because it can allow full authentication bypass and, in the worst case, full control over the database (read, modify, or delete data).
- Weak password validation is serious but usually requires an attacker to guess or brute-force; with rate limiting and lockout, impact can be limited. Injection can yield immediate access with a single crafted input.
- SQL injection can also lead to data exfiltration (e.g. dumping user tables) and sometimes to server takeover if the DB supports running commands. That makes it a top-priority fix.
- From a risk perspective, injection has high likelihood (one request) and high impact (bypass auth, access all data), so it ranks above issues that need many requests or other preconditions.
- Fixing injection is also a clear, one-time code change (parameterized queries or ORM); the fix is well understood and prevents a whole class of attacks.

**3. How do OWASP and NIST improve testing quality?**

- OWASP (e.g. Top 10, Testing Guide) gives a shared list of high-impact risks and concrete test cases, so teams know what to look for and how to test for injection, XSS, broken auth, etc.
- NIST frameworks (e.g. SP 800-115, SP 800-53) define security controls and assessment procedures, so testing can be aligned with regulatory or organizational requirements and documented for audits.
- Using both helps avoid gaps: OWASP focuses on common web flaws and real-world attacks; NIST adds structure and repeatability. Together they support both depth and coverage.
- OWASP and NIST materials are updated to reflect new threats and techniques, so test plans can evolve instead of staying fixed on old assumptions.
- Adopting these frameworks makes security testing more consistent across teams and projects and gives a common language for discussing and prioritizing findings.

**4. What was the most critical vulnerability you found, and how did you fix it?**

- The most critical was SQL injection in user lookup: input was concatenated into the query. Fixed by using parameterized queries or an ORM (e.g. Mongoose) so user input is always passed as data, not as part of the query text.
- Weak password validation (e.g. only length > 3) was fixed by enforcing minimum length (e.g. 12) and complexity and adding unit tests that reject short and weak passwords.
- Missing rate limiting on login was fixed by adding per-email and per-IP limits and account lockout, then verifying with tests that excess attempts are blocked.
- Potential IDOR on profile update was fixed by resolving the user from the JWT and ensuring each request can only access that user's data, with integration tests using another user's token to confirm denial.
- Unvalidated or unescaped input (XSS/DoSS) was fixed by validating and bounding length server-side and escaping output when rendering, with tests for malicious payloads in relevant fields.

**5. If you were an attacker, what would be the first thing you'd test in your own app?**

- The first focus would be login and password reset: injection in email/username and password, weak password acceptance, and whether reset tokens are predictable or reusable. These offer direct account takeover.
- Next would be session and authorization: whether tokens can be forged or reused after logout, and whether changing a user or resource ID returns another user's data (IDOR). One flaw can expose many records.
- Any input that influences queries, commands, or redirects (search, filters, redirect URLs) would be tested for injection and open redirect. These are common and high impact.
- Rate limiting and lockout would be tested by sending many login or OTP requests; missing limits make brute force and abuse of "send code" features feasible.
- Sensitive endpoints would be checked to ensure they require a valid token and correct scope; unprotected admin or profile APIs are an easy win for an attacker.

---

## Think Back

**What was the most critical vulnerability you found, and how did you fix it?**

1. **SQL injection in login/user lookup.** Input was concatenated into the query string. Fixed by using parameterized queries or Mongoose so input is never part of the query syntax.

2. **Weak password validation.** Only length &gt; 3 was checked. Fixed by enforcing minimum length (e.g. 12) and complexity (upper, lower, number, special) and adding unit tests that reject short and weak passwords.

3. **No rate limiting on login.** Fixed by adding per-email and per-IP rate limits and account lockout after N failures, then testing with automated requests to confirm 429/lockout.

4. **Potential IDOR on profile update.** Fixed by ensuring the backend resolves the user from the JWT and only updates that user’s record, with integration tests using a different user’s token to confirm 403 or equivalent.

5. **Unvalidated or unescaped input (XSS/DoSS).** Fixed by validating and bounding input length server-side and escaping or sanitizing output when rendering; tests added for malicious payloads in name and text fields.

---

## Think About

**If you were an attacker, what would be the first thing you'd test in your own app?**

1. **Login and password reset.** Test injection in email/username and password, weak password acceptance, and whether reset tokens are guessable or reusable. These give direct access to accounts.

2. **Session and authorization.** Test token forgery, reuse of tokens after logout, and whether changing the user ID in requests returns another user’s data (IDOR). One broken check can expose many records.

3. **Input that reaches the database or command layer.** Test every field that might be used in a query, command, or redirect (e.g. search, filters, redirect URLs). Injection and open redirects are common and high impact.

4. **Rate limiting and lockout.** Try many login or OTP requests from the same IP or for the same account. Missing limits make brute force and abuse of “send code” or similar features feasible.

5. **Sensitive endpoints without auth.** Crawl or review API routes and ensure every sensitive action requires a valid token and correct scope. Unprotected admin or profile endpoints are an easy win for an attacker.
