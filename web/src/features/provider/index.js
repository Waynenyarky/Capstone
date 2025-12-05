// Components and views
export { ProviderWorkspaceGate, ProviderActiveWorkspace } from './workspace/components/index.js'

export { default as ProviderOnboardingView } from './onboarding/components/ProviderOnboardingView.jsx'
export { default as ProviderWelcomeModal } from './onboarding/components/ProviderWelcomeModal.jsx'
export { default as ProviderOnboardingForm } from './onboarding/components/ProviderOnBoardingForm.jsx'

export { default as OfferingFormCard } from './offerings/components/OfferingFormCard.jsx'
export { default as ProviderAddServiceForm } from './offerings/components/ProviderAddServiceForm.jsx'
export { default as ProviderEditServiceForm } from './offerings/components/ProviderEditServiceForm.jsx'
export { default as ProviderServicesTable } from './offerings/components/ProviderServicesTable.jsx'

export { EditProviderProfileForm } from './account/components/index.js'

// Hooks
export * from './hooks/index.js'

// Views (optional re-exports for convenience)
export * from './workspace/views/index.js'