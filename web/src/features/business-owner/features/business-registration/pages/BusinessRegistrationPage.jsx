import React, { useState, useEffect } from 'react'
import { Button, Space, Tag, message, Popconfirm, Card, Spin, Alert } from 'antd'
import { ShopOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'
import BusinessOwnerLayout from '../../../views/components/BusinessOwnerLayout'
import { useBusinessRegistrationDrawer } from '../hooks/useBusinessRegistrationDrawer'
import BusinessRegistrationWizard from '../components/BusinessRegistrationWizard'
import BusinessSelector from '../components/BusinessSelector'


const BusinessRegistrationPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialBusinessId = searchParams.get('businessId') || null
  const { currentUser } = useAuthSession()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Wait for authentication before initializing the hook
  useEffect(() => {
    // Check if token is available (in memory or storage)
    const checkAuth = () => {
      // First check in-memory
      if (currentUser?.token) {
        setIsAuthenticated(true)
        return
      }
      
      // Then check storage
      try {
        const LOCAL_KEY = 'auth__currentUser'
        const SESSION_KEY = 'auth__sessionUser'
        const stored = localStorage.getItem(LOCAL_KEY) || sessionStorage.getItem(SESSION_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const user = parsed?.user || parsed
          if (user?.token) {
            setIsAuthenticated(true)
            return
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
      
      setIsAuthenticated(false)
    }
    
    // Check immediately
    checkAuth()
    
    // Also check after a small delay to catch async updates
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [currentUser?.token])

  // Always call hooks (React rules) - but only use when authenticated
  const {
    businesses,
    selectedBusinessId,
    selectedBusiness,
    isNewBusiness,
    currentStep,
    loading,
    formData,
    primaryBusiness,
    handleOpen,
    handleBusinessSelect,
    handleNext,
    handlePrev,
    handleSaveBusinessRegistration,
    handleSaveRiskProfile,
    handleDelete,
    refreshBusinesses
  } = useBusinessRegistrationDrawer(isAuthenticated, () => {})


  useEffect(() => {
    if (initialBusinessId === 'primary') {
      const primary = businesses.find(b => b.isPrimary)
      handleOpen(primary?.businessId || null)
    } else if (initialBusinessId) {
      handleOpen(initialBusinessId)
    } else {
      handleOpen(null)
    }
  }, [initialBusinessId, businesses]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set browser tab title
  useEffect(() => {
    document.title = 'Business Registration'
    return () => {
      // Reset to default title when component unmounts
      document.title = import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'
    }
  }, [])

  const updateBusinessIdParam = (businessId) => {
    const params = new URLSearchParams(searchParams)
    if (businessId) {
      params.set('businessId', businessId)
    } else {
      params.delete('businessId')
    }
    setSearchParams(params)
  }

  const handleBusinessSave = async (newBusinessId) => {
    // Update selected business ID if it's a new business
    // BUT don't call handleBusinessSelect as it resets step to 0
    // Instead, delay refreshBusinesses to avoid interfering with step progression
    if (isNewBusiness && newBusinessId && newBusinessId !== selectedBusinessId) {
      updateBusinessIdParam(newBusinessId)
      // Note: The wizard handles step progression internally
      // We delay the refresh to not interfere with step navigation
      // The business ID is already updated in the wizard via setActualBusinessId
      setTimeout(async () => {
        await refreshBusinesses()
        // The useEffect in useBusinessRegistrationDrawer will load the business data
      }, 3000) // Increased delay to allow step progression to complete
    } else {
      // Refresh businesses after save
      await refreshBusinesses()
    }
    window.dispatchEvent(new CustomEvent('refreshBusinessList'))
  }

  const handleBusinessChange = (businessId) => {
    if (businessId === 'new') {
      try {
        sessionStorage.removeItem('business_registration_wizard_step_new')
        sessionStorage.removeItem('business_registration_data_new')
        sessionStorage.removeItem('business_registration_lgu_documents_new')
        sessionStorage.removeItem('business_registration_bir_new')
        sessionStorage.removeItem('business_registration_agencies_new')
      } catch (e) {
        // Ignore storage errors
      }
    }
    handleBusinessSelect(businessId)
    updateBusinessIdParam(businessId)
  }

  const handleWizardComplete = () => {
    // Refresh businesses after submission
    refreshBusinesses()
    window.dispatchEvent(new CustomEvent('refreshBusinessList'))
  }

  // Show loading spinner while waiting for authentication
  if (!isAuthenticated) {
    return (
      <BusinessOwnerLayout pageTitle="Business Registration">
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>Loading...</div>
          </div>
        </Card>
      </BusinessOwnerLayout>
    )
  }

  return (
    <BusinessOwnerLayout pageTitle="Business Registration">
      <Card>
        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626', fontSize: 14 }}>
              Select Business
            </label>
            <BusinessSelector
              businesses={businesses}
              selectedBusinessId={selectedBusinessId}
              onSelect={handleBusinessChange}
              primaryBusiness={primaryBusiness}
            />
          </div>
          {isNewBusiness && businesses.length === 0 && (
            <Alert
              message="Registration Required"
              description="You need to register at least one primary business to continue."
              type="info"
              showIcon
              style={{ marginTop: 12 }}
              closable
            />
          )}
        </div>

        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ShopOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {isNewBusiness ? 'Register Business' : 'Update Business'}
            </span>
            {selectedBusiness?.isPrimary && (
              <Tag color="blue">Primary</Tag>
            )}
          </Space>
          {!isNewBusiness && (
            <Popconfirm
              title="Delete Business"
              description="Are you sure? This cannot be undone."
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} size="middle">
                Delete Business
              </Button>
            </Popconfirm>
          )}
        </div>

        <BusinessRegistrationWizard
          businessId={selectedBusinessId}
          isNewBusiness={isNewBusiness}
          formData={formData}
          onComplete={handleWizardComplete}
          onSaveBusiness={handleBusinessSave}
        />
      </Card>
    </BusinessOwnerLayout>
  )
}

export default BusinessRegistrationPage
