import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/http.js', () => {
  return {
    fetchJsonWithFallback: vi.fn(async (path, options) => ({ ok: true, path, options, data: { mocked: true } })),
    fetchWithFallback: vi.fn(async (path, options) => ({ ok: true, path, options, status: 200 })),
  }
})

import { fetchJsonWithFallback, fetchWithFallback } from '@/lib/http.js'
import {
  signupStart,
  signup,
  verifySignupCode,
  loginStart,
  loginPost,
  verifyLoginCode,
  sendForgotPassword,
  verifyResetCode,
  changePassword,
  changeEmail,
} from '@/features/authentication/services'

describe('authService endpoints', () => {
  it('signupStart calls /api/auth/signup/start with JSON body', async () => {
    const payload = { email: 'a@b.com' }
    const res = await signupStart(payload)
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup/start', expect.objectContaining({ method: 'POST' }))
    const [, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.body).toBe(JSON.stringify(payload))
    expect(res.ok).toBe(true)
  })

  it('signup calls /api/auth/signup', async () => {
    await signup({ email: 'a@b.com', password: 'x' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup', expect.any(Object))
  })

  it('verifySignupCode calls /api/auth/signup/verify', async () => {
    await verifySignupCode({ email: 'a@b.com', code: '123456' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/signup/verify', expect.any(Object))
  })

  it('loginStart calls /api/auth/login/start', async () => {
    await loginStart({ email: 'a@b.com' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login/start', expect.any(Object))
  })

  it('loginPost calls /api/auth/login', async () => {
    await loginPost({ email: 'a@b.com', password: 'x' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login', expect.any(Object))
  })

  it('verifyLoginCode calls /api/auth/login/verify', async () => {
    await verifyLoginCode({ email: 'a@b.com', code: '123456' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/login/verify', expect.any(Object))
  })

  it('sendForgotPassword calls /api/auth/forgot-password', async () => {
    await sendForgotPassword({ email: 'a@b.com' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/forgot-password', expect.any(Object))
  })

  it('verifyResetCode calls /api/auth/verify-code and returns Response-like', async () => {
    const res = await verifyResetCode({ email: 'a@b.com', code: '123456' })
    expect(fetchWithFallback).toHaveBeenCalledWith('/api/auth/verify-code', expect.any(Object))
    expect(res && typeof res.status).toBe('number')
  })

  it('changePassword calls /api/auth/change-password', async () => {
    await changePassword({ email: 'a@b.com', resetToken: 'rt', password: 'new' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-password', expect.any(Object))
  })

  it('changeEmail calls /api/auth/change-email', async () => {
    await changeEmail({ email: 'a@b.com', resetToken: 'rt', newEmail: 'c@d.com' })
    expect(fetchJsonWithFallback).toHaveBeenCalledWith('/api/auth/change-email', expect.any(Object))
  })
})