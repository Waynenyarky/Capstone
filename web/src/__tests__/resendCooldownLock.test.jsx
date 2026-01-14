import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

// Mock notifier to silence messages
vi.mock('@/shared/notifications', () => ({ useNotifier: () => ({ success: () => {}, info: () => {}, error: () => {} }) }))

// We'll mock the auth service loginResend and the cooldown hook so we can
// observe when `start` is called with server-provided values.
const startSpy = vi.fn()
vi.mock('@/features/authentication/hooks/useCooldown.js', () => ({
  __esModule: true,
  default: () => ({ remaining: 0, isCooling: false, start: startSpy }),
}))

vi.mock('@/features/authentication/services/authService', () => ({
  loginResend: vi.fn(),
}))

import { loginResend } from '@/features/authentication/services/authService'
import { useResendLoginCode } from '@/features/authentication/hooks'
import LockoutBanner from '@/features/authentication/components/LockoutBanner.jsx'

function renderIntoContainer(element) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root
  act(() => {
    root = createRoot(container)
    root.render(element)
  })
  return { container, root }
}

describe('Resend cooldown & lock handling', () => {
  beforeEach(() => {
    startSpy.mockClear()
    loginResend.mockReset()
  })

  it('starts cooldown using retryAfter from successful loginResend', async () => {
    loginResend.mockResolvedValueOnce({ devCode: '123456', retryAfter: 90 })

    // simple component that uses the hook and exposes a button to trigger resend
    function TestComp() {
      const { handleResend } = useResendLoginCode({ email: 'a@b.com', cooldownSec: 60 })
      return React.createElement('button', { 'data-testid': 'resend', onClick: handleResend }, 'resend')
    }

    const { container, root } = renderIntoContainer(React.createElement(TestComp))
    const btn = container.querySelector('[data-testid="resend"]')

    await act(async () => {
      btn.click()
      // wait a tick for async handler
      await Promise.resolve()
    })

    expect(startSpy).toHaveBeenCalled()
    // expects to be called with 90 seconds
    expect(startSpy.mock.calls[0][0]).toBe(90)

    if (root) {
      act(() => root.unmount())
    }
    container.remove()
  })

  it('starts cooldown using lockedUntil from loginStart error body', async () => {
    // lockedUntil as ISO in future
    const future = new Date(Date.now() + 120 * 1000).toISOString()
    loginResend.mockRejectedValueOnce({ body: { lockedUntil: future } })

    function TestComp() {
      const { handleResend } = useResendLoginCode({ email: 'a@b.com', cooldownSec: 60 })
      return React.createElement('button', { 'data-testid': 'resend', onClick: handleResend }, 'resend')
    }

    const { container, root } = renderIntoContainer(React.createElement(TestComp))
    const btn = container.querySelector('[data-testid="resend"]')

    await act(async () => {
      btn.click()
      await Promise.resolve()
    })

    expect(startSpy).toHaveBeenCalled()
    const secs = startSpy.mock.calls[0][0]
    // should be approximately 120 (allow small delta)
    expect(secs).toBeGreaterThanOrEqual(118)
    expect(secs).toBeLessThanOrEqual(122)

    if (root) {
      act(() => root.unmount())
    }
    container.remove()
  })

  it('LockoutBanner renders lock message when lockedUntil provided', () => {
    const futureMs = Date.now() + 75 * 1000
    const { container, root } = renderIntoContainer(React.createElement(LockoutBanner, { lockedUntil: futureMs }))
    const html = container.innerHTML
    expect(html).toContain('Account locked')

    if (root) {
      act(() => root.unmount())
    }
    container.remove()
  })
})
