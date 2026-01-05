import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/http.js', () => {
  return {
    fetchWithFallback: vi.fn(),
  }
})

import { fetchWithFallback } from '@/lib/http.js'
import { adminLoginStart, adminVerifyLoginCode } from '@/features/authentication/services'

describe('admin login lock handling', () => {
  it('adminLoginStart rejects with structured lock info when server returns non-ok', async () => {
    const fakeRes = {
      ok: false,
      status: 423,
      json: async () => ({ error: 'account_locked', lockedUntil: '2030-01-01T00:00:00Z' }),
    }
    fetchWithFallback.mockResolvedValueOnce(fakeRes)

    await expect(adminLoginStart({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({ status: 423, body: { error: 'account_locked' } })
  })

  it('adminVerifyLoginCode rejects with structured lock info when server returns non-ok', async () => {
    const fakeRes = {
      ok: false,
      status: 429,
      json: async () => ({ error: 'too_many_attempts', adminLockedUntil: 1893456000000 }),
    }
    fetchWithFallback.mockResolvedValueOnce(fakeRes)

    await expect(adminVerifyLoginCode({ email: 'a@b.com', code: '000000' })).rejects.toMatchObject({ status: 429, body: { error: 'too_many_attempts' } })
  })
})
