import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/http.js', () => {
  return {
    fetchJsonWithFallback: vi.fn(async (path, options = {}) => ({ ok: true, path, options, data: { mocked: true } })),
  }
})

import { fetchJsonWithFallback } from '@/lib/http.js'
import {
  getCategories,
  getProviderProfile,
  updateProviderProfile,
  resubmitProviderApplication,
  acknowledgeWelcome,
  setOnboardingStatus,
  submitProviderAppeal,
} from '@/features/provider/services'

describe('providerService endpoints', () => {
  it('getCategories calls /api/categories', async () => {
    await getCategories()
    const [path] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/categories')
  })

  it('getProviderProfile calls /api/providers/profile with headers', async () => {
    const headers = { Authorization: 'Bearer x' }
    await getProviderProfile(headers)
    const [path, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/providers/profile')
    expect(options.headers).toBe(headers)
  })

  it('updateProviderProfile calls PATCH /api/providers/profile with JSON body', async () => {
    const payload = { businessName: 'Acme' }
    const headers = { 'Content-Type': 'application/json' }
    await updateProviderProfile(payload, headers)
    const [path, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/providers/profile')
    expect(options.method).toBe('PATCH')
    expect(options.headers).toBe(headers)
    expect(options.body).toBe(JSON.stringify(payload))
  })

  it('resubmitProviderApplication calls POST /api/providers/resubmit-application', async () => {
    const headers = { 'Content-Type': 'application/json' }
    await resubmitProviderApplication(headers)
    const [path, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/providers/resubmit-application')
    expect(options.method).toBe('POST')
    expect(options.headers).toBe(headers)
  })

  it('acknowledgeWelcome calls PATCH /api/providers/welcome-ack with ack:true', async () => {
    const headers = { 'Content-Type': 'application/json' }
    await acknowledgeWelcome(headers)
    const [path, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/providers/welcome-ack')
    expect(options.method).toBe('PATCH')
    expect(options.headers).toBe(headers)
    expect(options.body).toBe(JSON.stringify({ ack: true }))
  })

  it('setOnboardingStatus calls PATCH /api/provider-offerings/onboarding-status with status', async () => {
    const headers = { 'Content-Type': 'application/json' }
    await setOnboardingStatus('in_progress', headers)
    const [path, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/provider-offerings/onboarding-status')
    expect(options.method).toBe('PATCH')
    expect(options.headers).toBe(headers)
    expect(options.body).toBe(JSON.stringify({ status: 'in_progress' }))
  })

  it('submitProviderAppeal calls POST /api/providers/appeals with JSON body and user headers', async () => {
    const payload = { appealReason: 'Please reactivate my account' }
    const headers = { 'x-user-id': '123', 'x-user-email': 'user@example.com' }
    await submitProviderAppeal(payload, headers)
    const [path, options] = fetchJsonWithFallback.mock.calls.at(-1)
    expect(path).toBe('/api/providers/appeals')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.headers['x-user-id']).toBe('123')
    expect(options.headers['x-user-email']).toBe('user@example.com')
    expect(options.body).toBe(JSON.stringify(payload))
  })
})