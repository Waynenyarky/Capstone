/**
 * Dev-only attack definitions for Simulate Attack panel.
 * Each attack has: key, label, description, sampleCode, execute(context).
 * context may include: { form, email } depending on the page.
 */

import { fetchWithFallback } from '@/lib/http.js'

function authPost(path, body) {
  return fetchWithFallback(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
}

// ----- Login page attacks -----
export function getLoginAttackDefinitions(getForm) {
  return [
    {
      key: 'brute-force',
      label: 'Brute force (wrong password x6)',
      description: 'Sends 6 failed login attempts with the same email. After 5 wrong passwords the account is locked for 15 minutes (even the correct password will be rejected until lockout expires).',
      sampleCode: `for (let i = 0; i < 6; i++) {
  await fetch('/api/auth/login/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'business@example.com',
      password: 'wrong' + i
    }),
    credentials: 'include'
  });
}`,
      execute: async () => {
        const form = typeof getForm === 'function' ? getForm() : null
        const email = form?.getFieldValue?.('email') || 'test@example.com'
        for (let i = 0; i < 6; i++) {
          const res = await authPost('/api/auth/login/start', { email, password: `WrongPass${i}!` })
          if (res?.status === 429) throw new Error('rate_limit_exceeded')
        }
      },
    },
    {
      key: 'rate-limit-flood',
      label: 'Rate limit flood (login start)',
      description: 'Sends many login/start requests in a short time to trigger rate limiting (429).',
      sampleCode: `const promises = [];
for (let i = 0; i < 25; i++) {
  promises.push(fetch('/api/auth/login/start', {
    method: 'POST',
    body: JSON.stringify({ email: 'flood@test.com' }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }));
}
await Promise.all(promises);`,
      execute: async () => {
        const form = typeof getForm === 'function' ? getForm() : null
        const email = form?.getFieldValue?.('email') || 'flood@test.com'
        const promises = []
        for (let i = 0; i < 25; i++) {
          promises.push(authPost('/api/auth/login/start', { email }))
        }
        const results = await Promise.all(promises)
        const rateLimited = results.find((r) => r?.status === 429)
        if (rateLimited) throw Object.assign(new Error('Too many requests'), { code: 'rate_limit_exceeded' })
      },
    },
    {
      key: 'sql-injection',
      label: 'SQL injection in email',
      description: 'Fills the email field with a classic SQL injection payload. Backend security monitor logs it.',
      sampleCode: `form.setFieldsValue({
  email: "' OR 1=1; DROP TABLE users; --",
  password: 'any'
});`,
      execute: ({ form }) => {
        if (!form) return
        form.setFieldsValue({
          email: "' OR 1=1; DROP TABLE users; --",
          password: 'any',
        })
      },
    },
    {
      key: 'xss-email',
      label: 'XSS in email field',
      description: 'Fills the email field with a script tag. Backend security monitor flags XSS attempt.',
      sampleCode: `form.setFieldsValue({
  email: '<script>alert("xss")</script>',
  password: 'test'
});`,
      execute: ({ form }) => {
        if (!form) return
        form.setFieldsValue({
          email: '<script>alert("xss")</script>',
          password: 'test',
        })
      },
    },
  ]
}

// ----- Login verification (OTP) attacks -----
export function getLoginVerifyAttackDefinitions(getEmail) {
  return [
    {
      key: 'otp-brute',
      label: 'OTP brute force (wrong codes x6)',
      description: 'Submits 6 wrong verification codes to trigger verification rate limit / lockout.',
      sampleCode: `for (let i = 0; i < 6; i++) {
  await fetch('/api/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code: '000000' }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
}`,
      execute: async () => {
        const email = typeof getEmail === 'function' ? getEmail() : ''
        if (!email) throw new Error('No email in context (complete login step first)')
        for (let i = 0; i < 6; i++) {
          const res = await authPost('/api/auth/login/verify', { email, code: '000000' })
          if (res?.status === 429) throw new Error('rate_limit_exceeded')
        }
      },
    },
    {
      key: 'verify-rate-flood',
      label: 'Verification request flood',
      description: 'Sends many verify requests in parallel to hit rate limit (5 per 15 min).',
      sampleCode: `await Promise.all(
  Array(10).fill(0).map(() =>
    fetch('/api/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code: '123456' }),
      credentials: 'include'
    })
  )
);`,
      execute: async () => {
        const email = typeof getEmail === 'function' ? getEmail() : ''
        if (!email) throw new Error('No email in context')
        const promises = Array(10)
          .fill(0)
          .map(() => authPost('/api/auth/login/verify', { email, code: '123456' }))
        const results = await Promise.all(promises)
        if (results.some((r) => r?.status === 429)) throw new Error('rate_limit_exceeded')
      },
    },
  ]
}

// ----- Signup verification (OTP) attacks -----
export function getSignUpVerifyAttackDefinitions(getEmail) {
  return [
    {
      key: 'signup-otp-brute',
      label: 'Signup OTP brute force (wrong codes x6)',
      description: 'Submits 6 wrong signup verification codes to trigger rate limit.',
      sampleCode: `for (let i = 0; i < 6; i++) {
  await fetch('/api/auth/signup/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code: '999999' }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
}`,
      execute: async () => {
        const email = typeof getEmail === 'function' ? getEmail() : ''
        if (!email) throw new Error('No email in context (complete signup step first)')
        for (let i = 0; i < 6; i++) {
          const res = await authPost('/api/auth/signup/verify', { email, code: '999999' })
          if (res?.status === 429) throw new Error('rate_limit_exceeded')
        }
      },
    },
    {
      key: 'signup-resend-flood',
      label: 'Resend code flood',
      description: 'Calls resend many times to trigger resend cooldown / rate limit.',
      sampleCode: `for (let i = 0; i < 15; i++) {
  await fetch('/api/auth/signup/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
    credentials: 'include'
  });
}`,
      execute: async () => {
        const email = typeof getEmail === 'function' ? getEmail() : ''
        if (!email) throw new Error('No email in context')
        for (let i = 0; i < 15; i++) {
          const res = await authPost('/api/auth/signup/resend', { email })
          if (res?.status === 429) throw new Error('rate_limit_exceeded')
        }
      },
    },
  ]
}

// ----- Registration (signup) page attacks -----
export function getSignUpAttackDefinitions() {
  return [
    {
      key: 'xss-name',
      label: 'XSS in name field',
      description: 'Fills first name with a script tag. Security monitor logs XSS attempt.',
      sampleCode: `form.setFieldsValue({
  firstName: '<img src=x onerror=alert(1)>',
  lastName: 'Test'
});`,
      execute: ({ form }) => {
        if (!form) return
        form.setFieldsValue({
          firstName: '<img src=x onerror=alert(1)>',
          lastName: 'Test',
        })
      },
    },
    {
      key: 'sql-signup-email',
      label: 'SQL injection in signup email',
      description: 'Fills email with SQL payload. Backend detects and logs suspicious activity.',
      sampleCode: `form.setFieldsValue({
  email: "admin'--",
  firstName: 'Attacker'
});`,
      execute: ({ form }) => {
        if (!form) return
        form.setFieldsValue({
          email: "admin'--",
          firstName: 'Attacker',
        })
      },
    },
    {
      key: 'mass-signup-start',
      label: 'Mass signup start (rate limit)',
      description: 'Sends many signup/start requests to trigger signup rate limiting.',
      sampleCode: `for (let i = 0; i < 20; i++) {
  await fetch('/api/auth/signup/start', {
    method: 'POST',
    body: JSON.stringify({
      email: 'bulk' + i + '@test.com',
      firstName: 'Bulk',
      lastName: 'User'
    }),
    credentials: 'include'
  });
}`,
      execute: async () => {
        const promises = []
        for (let i = 0; i < 20; i++) {
          promises.push(
            authPost('/api/auth/signup/start', {
              email: `bulk${i}@test.com`,
              firstName: 'Bulk',
              lastName: 'User',
            })
          )
        }
        const results = await Promise.all(promises)
        if (results.some((r) => r?.status === 429)) throw new Error('rate_limit_exceeded')
      },
    },
  ]
}

// ----- Risk 9: Hash Enumeration (manual-risk-testing-guide.md) -----
export function getRisk9AttackDefinitions() {
  return [
    {
      key: 'risk9-hash-enumeration-rate-limit',
      label: 'Risk 9: Hash enumeration rate limit (burst 35)',
      description: 'Sends 35 verify-data requests. Expected: first 30 = 200, requests 31–35 = 429.',
      sampleCode: `for i in 1..35: POST /api/audit/verify-data { "data": "enum-test-<i>" }
→ First 30: 200. 31–35: 429`,
      execute: async () => {
        const statuses = []
        for (let i = 1; i <= 35; i++) {
          const res = await fetchWithFallback('/api/audit/verify-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: `enum-test-${i}` }),
            credentials: 'include',
          })
          statuses.push(res.status)
        }
        const lastFive = statuses.slice(30)
        const rateLimited = lastFive.filter((s) => s === 429).length
        if (rateLimited > 0) {
          throw Object.assign(
            new Error(`Rate limit hit as expected: ${rateLimited} of last 5 returned 429`),
            { code: 'audit_verify_rate_limited' }
          )
        }
        throw new Error('Rate limit was not triggered after 35 requests (expected 429 on 31–35)')
      },
    },
  ]
}

// ----- Risk 10: Replay / Verification Spoofing (manual-risk-testing-guide.md) -----
export function getRisk10AttackDefinitions() {
  return [
    {
      key: 'risk10-client-hash-ignored',
      label: 'Risk 10: Client-supplied hash ignored',
      description:
        'Sends verify-data with fake hash. Expected: server ignores it and returns SHA-256 of "real data".',
      sampleCode: `POST /api/audit/verify-data
{ "data": "real data", "hash": "aaa...64 chars" }
→ Response hash must be SHA-256("real data"), NOT aaa...`,
      execute: async () => {
        const res = await fetchWithFallback('/api/audit/verify-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: 'real data',
            hash: 'a'.repeat(64),
          }),
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json?.error?.message || json?.message || `HTTP ${res.status}`)
        }
        if (json.hash === 'a'.repeat(64)) {
          throw new Error('Security failure: server accepted client-supplied hash')
        }
        if (json.hash && typeof json.hash === 'string' && json.hash.length === 64) {
          return { verified: json.verified, hash: json.hash, message: 'Server ignored client hash; returned computed hash.' }
        }
        return json
      },
    },
    {
      key: 'risk10-empty-data-rejected',
      label: 'Risk 10: Empty data rejected',
      description: 'Sends verify-data with empty string. Expected: 400 with code "missing_data".',
      sampleCode: `POST /api/audit/verify-data
{ "data": "" }
→ 400, code: "missing_data"`,
      execute: async () => {
        const res = await fetchWithFallback('/api/audit/verify-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: '' }),
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.status === 400 && (json?.code === 'missing_data' || json?.error?.code === 'missing_data')) {
          throw Object.assign(new Error('Empty data rejected as expected'), { code: 'missing_data' })
        }
        if (res.ok) {
          throw new Error('Security failure: server accepted empty data')
        }
        throw new Error(json?.error?.message || json?.message || `HTTP ${res.status}`)
      },
    },
  ]
}
