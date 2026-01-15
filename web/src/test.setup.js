import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// Configure React 18/19 act() support for non-Jest environments (Vitest + jsdom)
// This silences the warning: "The current testing environment is not configured to support act(...)"
// See: https://react.dev/reference/react-dom/test-utils/act
// and https://github.com/facebook/react/issues/27106
globalThis.IS_REACT_ACT_ENVIRONMENT = true

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
 */
let server
// eslint-disable-next-line no-undef
const isNodeRuntime = typeof process !== 'undefined' && !!process.versions?.node
if (isNodeRuntime) {
  const { setupServer } = await import('msw/node')
  const { handlers } = await import('./test/msw/handlers.js')
  server = setupServer(...handlers)

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}