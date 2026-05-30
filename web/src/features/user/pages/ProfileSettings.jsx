import { useProfileSettings } from '@/features/user/hooks/useProfileSettings'
import { UserSettingsView } from '@/features/user/pages/profileSettings/index.js'

export default function ProfileSettings() {
  const {
    user,
    contextHolder,
    selectedTab,
    setSelectedTab,
    passkeyEnabled,
    passkeyLoading,
    officeLabel,
    isStaffRole,
    isAdmin,
    isBusinessOwner,
    settingsLastUpdated,
    setSettingsLastUpdated,
    settingsInfoOpen,
    setSettingsInfoOpen,
    themeSettings,
  } = useProfileSettings()

  if (isAdmin) {
    return (
      <UserSettingsView
        contextHolder={contextHolder}
        user={user}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        passkeyEnabled={passkeyEnabled}
        passkeyLoading={passkeyLoading}
        officeLabel={officeLabel}
        isStaffRole={false}
        isBusinessOwner={false}
        isAdmin={true}
        themeSettings={themeSettings}
        showBackButton={false}
      />
    )
  }

  return (
    <UserSettingsView
      contextHolder={contextHolder}
      user={user}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      passkeyEnabled={passkeyEnabled}
      passkeyLoading={passkeyLoading}
      officeLabel={officeLabel}
      isStaffRole={isStaffRole}
      isBusinessOwner={isBusinessOwner}
      themeSettings={themeSettings}
      showBackButton={false}
    />
  )
}
