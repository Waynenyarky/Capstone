import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { useAuthSession } from '@/features/authentication'
import { 
  getBusinesses,
  getBusiness,
  addBusiness as addBusinessAPI,
  updateBusiness as updateBusinessAPI,
  updateBusinessRiskProfile as updateRiskProfileAPI,
  deleteBusiness as deleteBusinessAPI
} from '../../../services/businessProfileService'

export function useBusinessRegistrationDrawer(externalOpen = false, externalOnClose = null) {
  const { currentUser } = useAuthSession()
  const [open, setOpen] = useState(externalOpen)
  const [businesses, setBusinesses] = useState([])
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(null)

  // Sync with external open state
  useEffect(() => {
    setOpen(externalOpen)
  }, [externalOpen])

  // Fetch businesses when drawer opens and user is authenticated
  useEffect(() => {
    // Only fetch if drawer is open
    if (!open) return
    
    // Helper to check if token is truly available (both in memory and storage)
    const checkTokenAvailable = () => {
      // Check in-memory first (from useAuthSession)
      if (currentUser?.token) {
        return true
      }
      
      // Check storage as fallback
      try {
        const LOCAL_KEY = 'auth__currentUser'
        const SESSION_KEY = 'auth__sessionUser'
        const stored = localStorage.getItem(LOCAL_KEY) || sessionStorage.getItem(SESSION_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            const user = parsed?.user || parsed
            if (user?.token) {
              return true
            }
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      } catch (e) {
        // Storage error, ignore
      }
      
      return false
    }
    
    // Retry mechanism with exponential backoff
    let retryCount = 0
    const maxRetries = 5
    const baseDelay = 100
    
    const attemptFetch = () => {
      if (checkTokenAvailable()) {
        // Token is available, proceed with fetch
        fetchBusinesses()
      } else if (retryCount < maxRetries) {
        // Token not available yet, retry after delay
        retryCount++
        const delay = baseDelay * Math.pow(2, retryCount - 1) // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
        setTimeout(attemptFetch, delay)
      } else {
        // Max retries reached, give up silently (user will be redirected by ProtectedRoute)
        console.warn('Token not available after multiple retries, skipping fetch')
      }
    }
    
    // Start attempt after initial delay
    const timer = setTimeout(attemptFetch, baseDelay)
    return () => clearTimeout(timer)
  }, [open, currentUser?.token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load form data when business is selected
  useEffect(() => {
    if (selectedBusinessId && selectedBusinessId !== 'new') {
      loadBusinessData(selectedBusinessId)
    } else if (selectedBusinessId === 'new') {
      setFormData(null)
    }
  }, [selectedBusinessId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBusinesses = async () => {
    // Verify token is available before making request
    let token = currentUser?.token
    
    // If not in memory, check storage (for HTTP client fallback)
    if (!token) {
      try {
        const LOCAL_KEY = 'auth__currentUser'
        const SESSION_KEY = 'auth__sessionUser'
        const stored = localStorage.getItem(LOCAL_KEY) || sessionStorage.getItem(SESSION_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const user = parsed?.user || parsed
          token = user?.token
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    // If still no token, don't fetch
    if (!token) {
      console.warn('Cannot fetch businesses: token not available')
      return
    }
    
    try {
      const response = await getBusinesses()
      setBusinesses(response.businesses || [])
    } catch (err) {
      // Only log and show error if it's not a 401 (unauthorized) - 401 means user needs to login
      if (err.status === 401 || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        console.warn('Authentication required to fetch businesses')
        // Don't show error message for 401 - user will be redirected to login by ProtectedRoute
        return
      }
      console.error('Failed to fetch businesses:', err)
      message.error('Failed to load businesses')
    }
  }

  const loadBusinessData = async (businessId) => {
    try {
      setLoading(true)
      const business = await getBusiness(businessId)
      if (business) {
        setFormData(business)
      }
    } catch (err) {
      console.error('Failed to load business data:', err)
      message.error('Failed to load business data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (businessId = null) => {
    setOpen(true)
    if (businessId) {
      setSelectedBusinessId(businessId)
    } else {
      setSelectedBusinessId('new')
    }
    setCurrentStep(0)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedBusinessId(null)
    setCurrentStep(0)
    setFormData(null)
    if (externalOnClose) {
      externalOnClose()
    }
  }

  const handleBusinessSelect = (businessId) => {
    setSelectedBusinessId(businessId)
    setCurrentStep(0)
    setFormData(null)
  }

  const handleNext = () => {
    if (currentStep < 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveBusinessRegistration = async (data) => {
    try {
      setLoading(true)
      if (selectedBusinessId === 'new') {
        // Add new business
        const profile = await addBusinessAPI(data)
        message.success('Business registered successfully')
        
        // Find the newly created business and set it as selected
        const newBusinesses = profile.businesses || []
        const newBusiness = newBusinesses.find(b => 
          b.businessName === data.businessName &&
          b.businessRegistrationNumber === data.businessRegistrationNumber
        )
        if (newBusiness) {
          setSelectedBusinessId(newBusiness.businessId)
          // Load the new business data for step 4
          await loadBusinessData(newBusiness.businessId)
        }
      } else {
        // Update existing business
        await updateBusinessAPI(selectedBusinessId, data)
        message.success('Business updated successfully')
        // Reload business data to get updated risk level
        await loadBusinessData(selectedBusinessId)
      }
      await fetchBusinesses()
      return true
    } catch (err) {
      console.error('Failed to save business:', err)
      message.error(err.message || 'Failed to save business')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRiskProfile = async (data) => {
    try {
      setLoading(true)
      if (selectedBusinessId === 'new') {
        throw new Error('Please complete business registration first')
      }
      await updateRiskProfileAPI(selectedBusinessId, data)
      message.success('Risk profile updated successfully')
      await fetchBusinesses()
      return true
    } catch (err) {
      console.error('Failed to save risk profile:', err)
      message.error(err.message || 'Failed to save risk profile')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (selectedBusinessId === 'new') {
      return
    }
    try {
      setLoading(true)
      await deleteBusinessAPI(selectedBusinessId)
      message.success('Business deleted successfully')
      await fetchBusinesses()
      handleClose()
    } catch (err) {
      console.error('Failed to delete business:', err)
      message.error(err.message || 'Failed to delete business')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const isNewBusiness = selectedBusinessId === 'new'
  const selectedBusiness = businesses.find(b => b.businessId === selectedBusinessId)

  return {
    open,
    businesses,
    selectedBusinessId,
    selectedBusiness,
    isNewBusiness,
    currentStep,
    loading,
    formData,
    primaryBusiness: businesses.find(b => b.isPrimary),
    handleOpen,
    handleClose,
    handleBusinessSelect,
    handleNext,
    handlePrev,
    handleSaveBusinessRegistration,
    handleSaveRiskProfile,
    handleDelete,
    refreshBusinesses: fetchBusinesses
  }
}
