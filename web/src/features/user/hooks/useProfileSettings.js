import { useState, useEffect } from 'react'
import { message, theme } from 'antd'
import useProfile from '@/features/authentication/hooks/useProfile'
import { useAuthSession } from '@/features/authentication'
import { THEMES } from '@/shared/theme/ThemeProvider'
import { getOffices, resolveOfficeLabel } from '@/features/shared/services/officeService.js'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { usePasskeyStatus } from '@/features/user/hooks/usePasskeyStatus'

export function useProfileSettings() {
  const { user } = useProfile()
  const { currentUser, role } = useAuthSession()
  const { token } = theme.useToken()
  const [messageApi, contextHolder] = message.useMessage()
  const [selectedTab, setSelectedTab] = useState('general')
  const [offices, setOffices] = useState([])
  const [settingsLastUpdated, setSettingsLastUpdated] = useState(null)
  const [settingsInfoOpen, setSettingsInfoOpen] = useState(false)

  const roleSlug = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleSlug)
  const isAdmin = roleSlug === 'admin'
  const isBusinessOwner = roleSlug === 'business_owner'

  const { passkeyEnabled, passkeyLoading } = usePasskeyStatus(currentUser)
  const themeSettings = useThemeSettings(messageApi)

  useEffect(() => {
    if (isAdmin) setSettingsLastUpdated(new Date())
  }, [isAdmin])

  useEffect(() => {
    let mounted = true
    if (isStaffRole) {
      getOffices()
        .then((list) => {
          if (mounted) setOffices(Array.isArray(list) ? list : [])
        })
        .catch(() => {
          if (mounted) setOffices([])
        })
    }
    return () => { mounted = false }
  }, [isStaffRole])

  const officeLabel = resolveOfficeLabel(currentUser?.office, offices)

  return {
    user,
    currentUser,
    role,
    token,
    messageApi,
    contextHolder,
    selectedTab,
    setSelectedTab,
    passkeyEnabled,
    passkeyLoading,
    offices,
    officeLabel,
    isStaffRole,
    isAdmin,
    isBusinessOwner,
    settingsLastUpdated,
    setSettingsLastUpdated,
    settingsInfoOpen,
    setSettingsInfoOpen,
    brandColor: themeSettings.pendingTheme === THEMES.DEFAULT ? '#003a70' : token?.colorPrimary,
    themeSettings,
  }
}
