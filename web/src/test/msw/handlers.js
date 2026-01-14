import { http, HttpResponse, delay } from 'msw'

/**
 * Shared mock handlers used by Vitest (node) and Playwright (browser) for
 * deterministic network responses.
 */
export const handlers = [
  // Maintenance status
  http.get('/api/maintenance/status', async () => {
    await delay(20)
    return HttpResponse.json({ active: false })
  }),

  // Auth: login start (returns verification required by default)
  http.post('/api/auth/login/start', async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    if (body?.email?.includes('locked')) {
      return HttpResponse.json({ sent: false, locked: true }, { status: 423 })
    }
    return HttpResponse.json({ sent: true })
  }),

  // Auth: login finalize (single-step)
  http.post('/api/auth/login', async ({ request }) => {
    const { email } = await request.json().catch(() => ({}))
    if (email === 'admin@example.com') {
      return HttpResponse.json({ role: 'admin', token: 'admintoken' })
    }
    return HttpResponse.json({ role: 'user', token: 'user-token', name: 'Test User' })
  }),

  // Auth: get current user
  http.get('/api/auth/me', () => {
    return HttpResponse.json({ role: 'user', token: 'user-token', name: 'Test User' })
  }),
]
