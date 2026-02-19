import React from 'react'
import { useProfileSettings } from '@/features/user/hooks/useProfileSettings'
import { AdminSettingsView, UserSettingsView } from '@/features/user/pages/profileSettings'

export default function ProfileSettings() {
  const {
    user,
    contextHolder,
    selectedTab,
    setSelectedTab,
    uploading,
    passkeyEnabled,
    passkeyLoading,
    officeLabel,
    isStaffRole,
    isAdmin,
    settingsLastUpdated,
    setSettingsLastUpdated,
    settingsInfoOpen,
    setSettingsInfoOpen,
    initials,
    brandColor,
    handleAvatarUpload,
    themeSettings,
  } = useProfileSettings()

  if (isAdmin) {
    return (
      <AdminSettingsView
        contextHolder={contextHolder}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        settingsLastUpdated={settingsLastUpdated}
        setSettingsLastUpdated={setSettingsLastUpdated}
        settingsInfoOpen={settingsInfoOpen}
        setSettingsInfoOpen={setSettingsInfoOpen}
        themeSettings={themeSettings}
      />
    )
  }

  return (
    <UserSettingsView
      contextHolder={contextHolder}
      user={user}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      brandColor={brandColor}
      initials={initials}
      uploading={uploading}
      handleAvatarUpload={handleAvatarUpload}
      passkeyEnabled={passkeyEnabled}
      passkeyLoading={passkeyLoading}
      officeLabel={officeLabel}
      isStaffRole={isStaffRole}
      themeSettings={themeSettings}
    />
  )
}
