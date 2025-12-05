export const ProviderStatus = Object.freeze({
  pending: 'pending',
  rejected: 'rejected',
  inactive: 'inactive',
  active: 'active',
})

export const OnboardingStatus = Object.freeze({
  in_progress: 'in_progress',
  skipped: 'skipped',
  completed: 'completed',
})

// Weekday constants for availability and scheduling
export const WEEK_DAYS = Object.freeze(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

/**
 * @typedef {'pending'|'rejected'|'inactive'|'active'} ProviderStatusValue
 * @typedef {'in_progress'|'skipped'|'completed'} OnboardingStatusValue
 */