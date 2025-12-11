// Configure React 18/19 act() support for non-Jest environments (Vitest + jsdom)
// This silences the warning: "The current testing environment is not configured to support act(...)"
// See: https://react.dev/reference/react-dom/test-utils/act
// and https://github.com/facebook/react/issues/27106
globalThis.IS_REACT_ACT_ENVIRONMENT = true

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