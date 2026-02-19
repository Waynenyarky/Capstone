import { useState, useEffect, useMemo } from 'react'
import { message, theme } from 'antd'
import useProfile from '@/features/authentication/hooks/useProfile'
import { useAuthSession } from '@/features/authentication'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'
import { getOffices, resolveOfficeLabel } from '@/features/shared/services/officeService.js'
import { uploadUserAvatar } from '@/features/user/services/userService.js'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { usePasskeyStatus } from '@/features/user/hooks/usePasskeyStatus'

export function useProfileSettings() {
  const { user } = useProfile()
  const { currentUser, login, role } = useAuthSession()
  const { token } = theme.useToken()
  const [messageApi, contextHolder] = message.useMessage()
  const [selectedTab, setSelectedTab] = useState('general')
  const [uploading, setUploading] = useState(false)
  const [offices, setOffices] = useState([])
  const [settingsLastUpdated, setSettingsLastUpdated] = useState(null)
  const [settingsInfoOpen, setSettingsInfoOpen] = useState(false)

  const roleSlug = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleSlug)
  const isAdmin = roleSlug === 'admin'

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

  const initials = useMemo(() => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    }
    if (currentUser?.name) {
      return currentUser.name.substring(0, 2).toUpperCase()
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U'
  }, [currentUser])

  const handleAvatarUpload = async ({ file }) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
    if (!isJpgOrPng) {
      messageApi.error('You can only upload JPG/PNG/WEBP file!')
      return
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      messageApi.error('Image must be smaller than 2MB!')
      return
    }
    try {
      setUploading(true)
      const res = await uploadUserAvatar(file, currentUser, role)
      if (res?.success) {
        messageApi.success('Profile photo updated successfully')
        const nextUser = { ...currentUser, avatar: res.avatarUrl }
        const isRemembered = !!localStorage.getItem('auth__currentUser')
        login(nextUser, { remember: isRemembered })
      }
    } catch {
      messageApi.error('Failed to upload profile photo')
    } finally {
      setUploading(false)
    }
  }

  return {
    user,
    currentUser,
    role,
    token,
    messageApi,
    contextHolder,
    selectedTab,
    setSelectedTab,
    uploading,
    passkeyEnabled,
    passkeyLoading,
    offices,
    officeLabel,
    isStaffRole,
    isAdmin,
    settingsLastUpdated,
    setSettingsLastUpdated,
    settingsInfoOpen,
    setSettingsInfoOpen,
    initials,
    brandColor: themeSettings.pendingTheme === THEMES.DEFAULT ? '#003a70' : token?.colorPrimary,
    handleAvatarUpload,
    themeSettings,
  }
}
