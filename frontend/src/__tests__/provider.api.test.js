import { describe, it, expect } from 'vitest'

import {
  ProviderWorkspaceGate,
  ProviderActiveWorkspace,
  ProviderOnboardingView,
  ProviderWelcomeModal,
  ProviderOnboardingForm,
  OfferingFormCard,
  ProviderAddServiceForm,
  ProviderEditServiceForm,
  ProviderServicesTable,
  EditProviderProfileForm,
} from '@/features/provider'

import {
  useEditProviderProfileForm,
  useSupportedAreasSelectProps,
  useProviderProfileStatus,
  useProviderOfferings,
  useProviderOnboardingForm,
  useProviderWelcomeAck,
  useResubmitProviderApplication,
} from '@/features/provider/hooks'

describe('provider public API (components)', () => {
  it('exports expected components from root barrel', () => {
    expect(ProviderWorkspaceGate).toBeDefined()
    expect(ProviderActiveWorkspace).toBeDefined()
    expect(ProviderOnboardingView).toBeDefined()
    expect(ProviderWelcomeModal).toBeDefined()
    expect(ProviderOnboardingForm).toBeDefined()
    expect(OfferingFormCard).toBeDefined()
    expect(ProviderAddServiceForm).toBeDefined()
    expect(ProviderEditServiceForm).toBeDefined()
    expect(ProviderServicesTable).toBeDefined()
    expect(EditProviderProfileForm).toBeDefined()
  })

  it('component exports are functions (React components)', () => {
    for (const c of [
      ProviderWorkspaceGate,
      ProviderActiveWorkspace,
      ProviderOnboardingView,
      ProviderWelcomeModal,
      ProviderOnboardingForm,
      OfferingFormCard,
      ProviderAddServiceForm,
      ProviderEditServiceForm,
      ProviderServicesTable,
      EditProviderProfileForm,
    ]) {
      expect(typeof c).toBe('function')
    }
  })
})

describe('provider public API (hooks)', () => {
  it('exports expected hooks from hooks barrel', () => {
    expect(useEditProviderProfileForm).toBeDefined()
    expect(useSupportedAreasSelectProps).toBeDefined()
    expect(useProviderProfileStatus).toBeDefined()
    expect(useProviderOfferings).toBeDefined()
    expect(useProviderOnboardingForm).toBeDefined()
    expect(useProviderWelcomeAck).toBeDefined()
    expect(useResubmitProviderApplication).toBeDefined()
  })

  it('hook exports are functions', () => {
    for (const h of [
      useEditProviderProfileForm,
      useSupportedAreasSelectProps,
      useProviderProfileStatus,
      useProviderOfferings,
      useProviderOnboardingForm,
      useProviderWelcomeAck,
      useResubmitProviderApplication,
    ]) {
      expect(typeof h).toBe('function')
    }
  })
})