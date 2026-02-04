import { useState, useEffect, useCallback, useRef } from 'react'
import { App } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'
import { useBusinessRegistrationDrawer } from './useBusinessRegistrationDrawer'

const AUTH_STORAGE_KEYS = {
  local: 'auth__currentUser',
  session: 'auth__sessionUser'
}

function getStoredToken() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.local) || sessionStorage.getItem(AUTH_STORAGE_KEYS.session)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    const user = parsed?.user ?? parsed
    return user?.token ?? null
  } catch {
    return null
  }
}

export function useBusinessRegistrationPage() {
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentUser } = useAuthSession()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const initialBusinessId = searchParams.get('businessId') || null
  const requestedListViewRef = useRef(false)

  useEffect(() => {
    if (currentUser?.token) {
      setIsAuthenticated(true)
      return
    }
    const token = getStoredToken()
    setIsAuthenticated(!!token)
    const timer = setTimeout(() => setIsAuthenticated(!!getStoredToken()), 100)
    return () => clearTimeout(timer)
  }, [currentUser?.token])

  const {
    businesses,
    selectedBusinessId,
    selectedBusiness,
    isNewBusiness,
    loading,
    formData,
    primaryBusiness,
    handleOpen,
    handleBusinessSelect,
    handleSaveRiskProfile,
    handleDelete,
    refreshBusinesses
  } = useBusinessRegistrationDrawer(isAuthenticated, () => {})

  useEffect(() => {
    if (initialBusinessId === 'primary') {
      const primary = businesses.find((b) => b.isPrimary)
      handleOpen(primary?.businessId ?? null)
      requestedListViewRef.current = false
    } else if (initialBusinessId) {
      handleOpen(initialBusinessId)
      requestedListViewRef.current = false
    } else if (businesses.length === 0 && !requestedListViewRef.current) {
      handleOpen(null)
    } else if (businesses.length > 0) {
      requestedListViewRef.current = false
    }
    // When businesses.length > 0 and no initialBusinessId, do nothing so list view shows first
  }, [initialBusinessId, businesses]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = 'Business Registration'
    return () => {
      document.title = import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'
    }
  }, [])

  const updateBusinessIdParam = useCallback(
    (businessId) => {
      const params = new URLSearchParams(searchParams)
      if (businessId) params.set('businessId', businessId)
      else params.delete('businessId')
      setSearchParams(params)
    },
    [searchParams, setSearchParams]
  )

  const handleBusinessSave = useCallback(
    async (newBusinessId) => {
      if (isNewBusiness && newBusinessId && newBusinessId !== selectedBusinessId) {
        updateBusinessIdParam(newBusinessId)
        setTimeout(() => refreshBusinesses(), 3000)
      } else {
        await refreshBusinesses()
      }
      window.dispatchEvent(new CustomEvent('refreshBusinessList'))
    },
    [isNewBusiness, selectedBusinessId, updateBusinessIdParam, refreshBusinesses]
  )

  const handleBusinessChange = useCallback(
    (businessId) => {
      if (businessId === 'new') {
        const keys = [
          'business_registration_wizard_step_new',
          'business_registration_data_new',
          'business_registration_lgu_documents_new',
          'business_registration_bir_new',
          'business_registration_agencies_new'
        ]
        keys.forEach((k) => sessionStorage.removeItem(k))
      }
      handleBusinessSelect(businessId)
      updateBusinessIdParam(businessId)
    },
    [handleBusinessSelect, updateBusinessIdParam]
  )

  const handleWizardComplete = useCallback(() => {
    refreshBusinesses()
    window.dispatchEvent(new CustomEvent('refreshBusinessList'))
  }, [refreshBusinesses])

  const handleBackToList = useCallback(() => {
    requestedListViewRef.current = true
    handleBusinessSelect(null)
    updateBusinessIdParam(null)
  }, [handleBusinessSelect, updateBusinessIdParam])

  const handleSaveDraft = useCallback(async () => {
    requestedListViewRef.current = true
    await refreshBusinesses()
    message.success('Draft saved. Your progress is saved as you complete each step.')
    handleBackToList()
  }, [refreshBusinesses, handleBackToList])

  const canSaveDraft = selectedBusinessId != null
  const canGoToDraftList = businesses.length > 0

  return {
    isAuthenticated,
    businesses,
    selectedBusinessId,
    selectedBusiness,
    isNewBusiness,
    formData,
    primaryBusiness,
    canSaveDraft,
    canGoToDraftList,
    handleBusinessChange,
    handleBusinessSave,
    handleWizardComplete,
    handleSaveDraft,
    handleBackToList,
    handleDelete
  }
}
