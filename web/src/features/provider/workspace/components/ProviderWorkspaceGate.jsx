import React from 'react'
import { useProviderProfileStatus, useProviderWelcomeAck } from "@/features/provider/hooks"
import { useAuthSession } from "@/features/authentication"
import { useResubmitProviderApplication } from "@/features/provider/hooks"

// Workspace views barrel
import { ProviderDeletionScheduledView, ProviderLoadingView, ProviderNotFoundView, ProviderPendingView, ProviderRejectedView, ProviderInactiveView } from "@/features/provider/workspace/views"
import { ProviderOnboardingView, ProviderWelcomeModal, ProviderActiveWorkspace } from "@/features/provider"
import { ProviderStatus, OnboardingStatus } from "@/features/provider/constants.js"

export default function ProviderWorkspaceGate() {
  const { currentUser } = useAuthSession()
  const { provider, status, isLoading, reload } = useProviderProfileStatus()
  const { welcomeOpen, startOnboarding, skipOnboarding, acknowledgeWelcome } = useProviderWelcomeAck({ status, provider, reload })
  const { isSubmitting, resubmit } = useResubmitProviderApplication()

  if (currentUser?.deletionPending) {
    return <ProviderDeletionScheduledView />
  }

  if (isLoading) {
    return <ProviderLoadingView />
  }

  if (!provider) {
    return <ProviderNotFoundView />
  }

  if (status === ProviderStatus.pending) {
    return <ProviderPendingView />
  }

  if (status === ProviderStatus.rejected) {
    return (
      <ProviderRejectedView
        provider={provider}
        isSubmitting={isSubmitting}
        resubmit={resubmit}
        reload={reload}
      />
    )
  }

  if (status === ProviderStatus.inactive) {
    return (
      <ProviderInactiveView
        provider={provider}
        currentUser={currentUser}
        reload={reload}
      />
    )
  }

  if (status === ProviderStatus.active && provider?.onboardingStatus === OnboardingStatus.in_progress) {
    return <ProviderOnboardingView reload={reload} />
  }

  return (
    <>
      <ProviderWelcomeModal
        open={welcomeOpen}
        onCancel={acknowledgeWelcome}
        onSkip={skipOnboarding}
        onStart={startOnboarding}
      />
      <ProviderActiveWorkspace />
    </>
  )
}