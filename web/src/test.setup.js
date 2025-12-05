// Configure React 18/19 act() support for non-Jest environments (Vitest + jsdom)
// This silences the warning: "The current testing environment is not configured to support act(...)"
// See: https://react.dev/reference/react-dom/test-utils/act
// and https://github.com/facebook/react/issues/27106
globalThis.IS_REACT_ACT_ENVIRONMENT = true