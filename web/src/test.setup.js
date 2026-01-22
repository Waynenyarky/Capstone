import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Configure React 18/19 act() support for non-Jest environments (Vitest + jsdom)
// This silences the warning: "The current testing environment is not configured to support act(...)"
// See: https://react.dev/reference/react-dom/test-utils/act
// and https://github.com/facebook/react/issues/27106
globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
})

vi.mock('@/features/authentication/views/components/PasskeySignInOptions.jsx', () => ({
  default: () => null,
}))

// Mock scrollTo to avoid errors in JSDOM (used by some AntD components)
if (typeof window !== 'undefined' && typeof window.scrollTo !== 'function') {
  window.scrollTo = vi.fn()
}

// Polyfill window.matchMedia used by Ant Design's responsive observers
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Provide a simple clipboard mock for copy tests
if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  navigator.clipboard = {
    writeText: async (text) => {
      // store last copied text for tests to inspect if needed
      navigator.__lastCopied = String(text)
      return Promise.resolve()
    }
  }
}

/**
 * Shared MSW server for deterministic API mocks in node/Vitest environments.
 * Skip when running browser-based Storybook/Vitest projects to avoid bundling
 * msw/node in the browser.
 * Note: MSW setup is optional - tests will run without it if MSW is not installed.
 */
// eslint-disable-next-line no-undef
const isNodeRuntime = typeof process !== 'undefined' && !!process.versions?.node
if (isNodeRuntime) {
  // Use dynamic import with a string variable to prevent Vite from statically analyzing it
  const mswPath = 'msw/node'
  const setupMSW = async () => {
    try {
      // Dynamic import that Vite won't try to resolve at build time
      const mswModule = await import(/* @vite-ignore */ mswPath)
      const { setupServer } = mswModule
      const { handlers } = await import('./test/msw/handlers.js')
      return setupServer(...handlers)
    } catch {
      // MSW not available, return null
      // Silently skip - tests that don't require MSW will still run
      return null
    }
  }
  
  setupMSW().then((srv) => {
    if (srv) {
      beforeAll(() => srv.listen({ onUnhandledRequest: 'error' }))
      afterEach(() => srv.resetHandlers())
      afterAll(() => srv.close())
    }
  }).catch(() => {
    // Ignore setup errors
  })
}