// Trae integration shim for provider functionality.
// Replace these stubs with real Trae API calls when integration is ready.
export async function getCategories() {
  // Return empty list as default placeholder
  return []
}

export async function getProviderProfile(/* headers */) {
  return {}
}

export async function updateProviderProfile(/* payload, headers */) {
  return {}
}

export async function resubmitProviderApplication(/* headers */) {
  return { resubmitted: false }
}

export async function acknowledgeWelcome(/* headers */) {
  return { acknowledged: false }
}

export async function setOnboardingStatus(/* status, headers */) {
  return { updated: false }
}

export async function submitProviderAppeal(/* payload, headers */) {
  return { submitted: false }
}

export async function getProviderOfferings(/* headers */) {
  return []
}

export async function getProviderAllowedServices(/* headers */) {
  return []
}

export async function initializeProviderOfferings(/* serviceIds, headers */) {
  return { initialized: [] }
}

export async function updateProviderOffering(/* id, payload, headers */) {
  return {}
}

export async function completeProviderOnboarding(/* headers */) {
  return { completed: true }
}

// Export a default object for convenience
export default {
  getCategories,
  getProviderProfile,
  updateProviderProfile,
  resubmitProviderApplication,
  acknowledgeWelcome,
  setOnboardingStatus,
  submitProviderAppeal,
  getProviderOfferings,
  getProviderAllowedServices,
  initializeProviderOfferings,
  updateProviderOffering,
  completeProviderOnboarding,
}
