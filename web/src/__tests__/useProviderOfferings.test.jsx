/* @vitest-environment jsdom */
import React, { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import ReactDOM from 'react-dom/client'

// Shared notifier spies we can assert against
const notifier = {
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/shared/notifications.js', () => ({
  useNotifier: () => notifier,
}))

vi.mock('@/features/authentication', () => ({
  useAuthSession: () => ({ currentUser: { id: 'u1', email: 'u1@example.com' }, role: 'provider' }),
}))

vi.mock('@/lib/authHeaders.js', () => ({
  authHeaders: () => ({ Authorization: 'Bearer test' }),
}))

// Service mocks with mutable behavior per test
const svc = {
  allowed: [{ id: 'svc1', name: 'Service 1' }],
  offerings: [{ id: 'off1', serviceId: 'svc1', serviceName: 'Service 1', pricingMode: 'fixed', fixedPrice: 10 }],
  updateShouldFail: false,
}

vi.mock('@/features/provider/services', () => ({
  getProviderAllowedServices: async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    return svc.allowed
  },
  getProviderOfferings: async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    return svc.offerings
  },
  initializeProviderOfferings: async (ids) => {
    await new Promise(resolve => setTimeout(resolve, 10))
    return { initialized: Array.isArray(ids) ? ids : [] }
  },
  updateProviderOffering: async (id, payload) => {
    await new Promise(resolve => setTimeout(resolve, 10))
    if (svc.updateShouldFail) {
      throw new Error('update failed')
    }
    const found = svc.offerings.find(o => o.id === id)
    const updated = { ...found, ...payload }
    svc.offerings = svc.offerings.map(o => (o.id === id ? updated : o))
    return updated
  },
  indexById: (list) => Object.fromEntries((Array.isArray(list) ? list : []).map(it => [String(it.id), it])),
}))

import { useProviderOfferings } from '@/features/provider/offerings/hooks/useProviderOfferings.js'

function HookHarness({ onReady }) {
  const hook = useProviderOfferings()
  // Provide the latest hook object on each render so callers see updated state
  useEffect(() => { onReady(hook) }, [hook, onReady])
  return null
}

function mount(harness) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => { root.render(harness) })
  return { root, container }
}

async function waitFor(condition, timeout = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (condition()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error('Timeout waiting for condition')
}

describe('useProviderOfferings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.updateShouldFail = false
    // Reset offerings to initial state
    svc.offerings = [{ id: 'off1', serviceId: 'svc1', serviceName: 'Service 1', pricingMode: 'fixed', fixedPrice: 10 }]
  })

  it('loads allowed services and offerings on mount', async () => {
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} />)
    
    // Wait for hook to be ready and data to load
    await waitFor(() => hookRef !== undefined)
    await waitFor(() => hookRef.allowedServices.length > 0)
    await waitFor(() => hookRef.offerings.length > 0)
    
    expect(hookRef.allowedServices.length).toBe(1)
    expect(hookRef.offerings.length).toBe(1)
    expect(hookRef.serviceMap['svc1']).toBeDefined()
    
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('initialization guard warns when no services selected', async () => {
    notifier.warning.mockClear()
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} />)
    
    // Wait for hook to be ready
    await waitFor(() => hookRef !== undefined)
    
    let res
    await act(async () => { 
      res = await hookRef.initializeOfferings([]) 
    })
    
    await waitFor(() => notifier.warning.mock.calls.length > 0)
    expect(res).toEqual({ initialized: [] })
    
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('update flow toggles isSubmitting and updates offering', async () => {
    notifier.error.mockClear()
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} />)
    
    // Wait for hook to be ready and data to load
    await waitFor(() => hookRef !== undefined)
    await waitFor(() => hookRef.offerings.length > 0)
    
    let result
    await act(async () => { 
      result = await hookRef.updateOffering('off1', { fixedPrice: 20 }) 
    })
    
    expect(result).toBe(true)
    await waitFor(() => hookRef.offerings[0].fixedPrice === 20)
    expect(notifier.error).not.toHaveBeenCalled()
    
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('error notification path on update failure', async () => {
    svc.updateShouldFail = true
    notifier.error.mockClear()
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} />)
    
    // Wait for hook to be ready
    await waitFor(() => hookRef !== undefined)
    
    let ok
    await act(async () => { 
      ok = await hookRef.updateOffering('off1', { fixedPrice: 30 }) 
    })
    
    expect(ok).toBe(false)
    await waitFor(() => notifier.error.mock.calls.length > 0)
    
    await act(async () => { root.unmount() })
    container.remove()
  })
})