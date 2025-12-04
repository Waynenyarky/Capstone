/* @vitest-environment jsdom */
import React, { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import ReactDOM from 'react-dom/client'

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

const svc = {
  allowed: [{ id: 'svc1', name: 'Service 1' }],
  offerings: [],
  completeShouldFail: false,
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
    return { id, ...payload }
  },
  completeProviderOnboarding: async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    if (svc.completeShouldFail) throw new Error('complete failed')
    return { completed: true }
  },
  indexById: (list) => Object.fromEntries((Array.isArray(list) ? list : []).map(it => [String(it.id), it])),
}))

import { useProviderOnboardingForm } from '@/features/provider/onboarding/hooks/useProviderOnBoardingForm.js'

function HookHarness({ onReady, onCompleted }) {
  const hook = useProviderOnboardingForm({ onCompleted })
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

describe('useProviderOnboardingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    svc.completeShouldFail = false
  })

  it('selection initialization sets step and loads offerings', async () => {
    // Prepare offerings after initialization
    svc.offerings = [{ id: 'off1', serviceId: 'svc1', serviceName: 'Service 1', pricingMode: 'fixed', fixedPrice: 10 }]
    notifier.success.mockClear()
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} />)
    
    // Wait for hook to be ready
    await act(async () => { await waitFor(() => hookRef !== undefined) })

    // First update the selection and wait for re-render to reflect it
    await act(async () => { hookRef.setSelectedServiceIds(['svc1']) })
    await act(async () => { await waitFor(() => Array.isArray(hookRef.selectedServiceIds) && hookRef.selectedServiceIds.length === 1) })

    // Then run initialization which depends on selectedServiceIds
    await act(async () => { await hookRef.initializeSelections() })

    // Wait for success notification and state updates
    await act(async () => { await waitFor(() => notifier.success.mock.calls.length > 0) })
    await act(async () => { await waitFor(() => hookRef.currentStep === 1 && hookRef.offerings.length === 1) })
    expect(hookRef.currentStep).toBe(1)
    expect(hookRef.offerings.length).toBe(1)
    
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('completion callback fires when onboarding completes', async () => {
    const onCompleted = vi.fn()
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} onCompleted={onCompleted} />)
    
    // Wait for hook to be ready
    await act(async () => { await waitFor(() => hookRef !== undefined) })
    
    await act(async () => { await hookRef.completeOnboarding() })
    
    await act(async () => { await waitFor(() => onCompleted.mock.calls.length > 0) })
    expect(notifier.error).not.toHaveBeenCalled()
    
    await act(async () => { root.unmount() })
    container.remove()
  })

  it('error notifications when completion fails', async () => {
    svc.completeShouldFail = true
    notifier.error.mockClear()
    let hookRef
    const { root, container } = mount(<HookHarness onReady={(h) => { hookRef = h }} />)
    
    // Wait for hook to be ready
    await act(async () => { await waitFor(() => hookRef !== undefined) })
    
    await act(async () => { await hookRef.completeOnboarding() })
    
    await act(async () => { await waitFor(() => notifier.error.mock.calls.length > 0) })
    
    await act(async () => { root.unmount() })
    container.remove()
  })
})