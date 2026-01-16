import React, { useState, useEffect } from 'react'
import { Tabs, Button, Form, Space, Tag, message, Popconfirm, Alert, Card, Modal, Progress, notification, Steps, Spin } from 'antd'
import { ShopOutlined, DeleteOutlined, CheckCircleOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuthSession } from '@/features/authentication'
import BusinessOwnerLayout from '../../../views/components/BusinessOwnerLayout'
import { useBusinessRegistrationDrawer } from '../hooks/useBusinessRegistrationDrawer'
import BusinessRegistrationForm from '../components/BusinessRegistrationForm'
import RiskProfileForm from '../components/RiskProfileForm'
import BusinessSelector from '../components/BusinessSelector'

// Simple client-side risk calculation (matches backend logic)
const calculateRiskLevelClient = (businessData) => {
  let riskScore = 0
  const businessSize = businessData.businessSize || businessData.riskProfile?.businessSize || 0
  const annualRevenue = businessData.annualRevenue || businessData.riskProfile?.annualRevenue || 0
  const businessType = businessData.businessType || ''
  const registrationStatus = businessData.registrationStatus || 'not_yet_registered'
  const numberOfBranches = businessData.numberOfBranches || 0

  if (businessSize < 10) riskScore += 1
  else if (businessSize >= 10 && businessSize <= 50) riskScore += 2
  else riskScore += 3

  if (annualRevenue < 1000000) riskScore += 1
  else if (annualRevenue >= 1000000 && annualRevenue <= 10000000) riskScore += 2
  else riskScore += 3

  const highRiskTypes = ['manufacturing_industrial', 'construction_real_estate_housing', 'transportation_automotive_logistics']
  const mediumRiskTypes = ['services', 'agriculture_fishery_forestry']
  if (highRiskTypes.includes(businessType)) riskScore += 3
  else if (mediumRiskTypes.includes(businessType)) riskScore += 2
  else riskScore += 1

  if (registrationStatus === 'proposed') riskScore += 2
  else riskScore += 1

  if (numberOfBranches > 5) riskScore += 2
  else if (numberOfBranches > 0) riskScore += 1

  if (riskScore <= 7) return 'low'
  else if (riskScore <= 11) return 'medium'
  else return 'high'
}

const BusinessRegistrationPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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

  const [form] = Form.useForm()
  const [riskLevel, setRiskLevel] = useState('low')
  const [activeTab, setActiveTab] = useState('business-details')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)

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

  useEffect(() => {
    if (!isAuthenticated) return // Don't set form values if not authenticated
    
    if (formData && !isNewBusiness) {
      form.setFieldsValue({
        ...formData,
        businessStartDate: formData.businessStartDate ? dayjs(formData.businessStartDate) : null,
        mailingAddressDifferent: !!formData.location?.mailingAddress,
        location: {
          ...formData.location,
          geolocation: formData.location?.geolocation || { lat: 0, lng: 0 }
        }
      })
      setRiskLevel(formData.riskProfile?.riskLevel || 'low')
    } else if (isNewBusiness) {
      form.resetFields()
      setRiskLevel('low')
    }
  }, [formData, isNewBusiness, form, isAuthenticated])

  const handleFormValuesChange = (changedValues, allValues) => {
    const combinedData = {
      ...allValues,
      businessSize: allValues.riskProfile?.businessSize || allValues.businessSize,
      annualRevenue: allValues.riskProfile?.annualRevenue || allValues.annualRevenue,
      businessType: allValues.businessType,
      registrationStatus: allValues.registrationStatus,
      numberOfBranches: allValues.numberOfBranches
    }
    const calculatedRisk = calculateRiskLevelClient(combinedData)
    setRiskLevel(calculatedRisk)
  }

  const handleStep3Submit = async () => {
    try {
      // Only validate Business Details fields
      const values = await form.validateFields([
        'businessName',
        'registrationStatus',
        'location',
        'businessType',
        'registrationAgency',
        'businessRegistrationNumber',
        'businessStartDate',
        'contactNumber'
      ])
      
      const businessData = {
        businessName: values.businessName,
        registrationStatus: values.registrationStatus,
        location: {
          street: values.location?.street || '',
          barangay: values.location?.barangay || '',
          city: values.location?.city || '',
          municipality: values.location?.municipality || '',
          province: values.location?.province || '',
          zipCode: values.location?.zipCode || '',
          geolocation: {
            lat: Number(values.location?.geolocation?.lat) || 0,
            lng: Number(values.location?.geolocation?.lng) || 0
          },
          mailingAddress: values.mailingAddressDifferent ? (values.location?.mailingAddress || '') : ''
        },
        businessType: values.businessType,
        registrationAgency: values.registrationAgency,
        businessRegistrationNumber: values.businessRegistrationNumber,
        businessStartDate: values.businessStartDate ? values.businessStartDate.format('YYYY-MM-DD') : null,
        numberOfBranches: values.numberOfBranches || 0,
        industryClassification: values.industryClassification || '',
        taxIdentificationNumber: values.taxIdentificationNumber || '',
        contactNumber: values.contactNumber || ''
      }

      await handleSaveBusinessRegistration(businessData)
      refreshBusinesses()
      window.dispatchEvent(new CustomEvent('refreshBusinessList'))
      
      // Helper function to proceed to risk assessment
      const proceedToRiskAssessment = () => {
        // Show progress notification
        const key = `open${Date.now()}`
        notification.info({
          key,
          message: 'Moving to Risk Assessment...',
          duration: 2,
          placement: 'top',
        })
        
        // Start transition with progress indicator
        setIsTransitioning(true)
        setTransitionProgress(0)
        
        // Animate progress bar
        const interval = setInterval(() => {
          setTransitionProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsTransitioning(false)
              setActiveTab('risk-assessment')
              handleNext()
              notification.success({
                message: 'Ready',
                description: 'Complete the risk profile details.',
                duration: 3,
                placement: 'top',
              })
              return 100
            }
            return prev + 10
          })
        }, 100)
      }
      
      // Show prominent confirmation message with auto-progression
      const modal = Modal.success({
        title: 'Saved Successfully',
        content: 'Business details saved. Proceeding to Risk Assessment...',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        okText: 'Continue',
        width: 450,
        onOk: () => {
          modal.destroy()
          if (modal.autoCloseTimer) clearTimeout(modal.autoCloseTimer)
          proceedToRiskAssessment()
        },
      })
      
      // Auto-close modal and proceed after 2 seconds if user doesn't click
      const autoCloseTimer = setTimeout(() => {
        modal.destroy()
        proceedToRiskAssessment()
      }, 2000)
      
      // Store timer in modal instance for cleanup if user clicks OK
      modal.autoCloseTimer = autoCloseTimer
    } catch (err) {
      if (!err.errorFields) {
        message.error(err.message || 'Please fill in all required fields')
      }
    }
  }

  const handleStep4Submit = async () => {
    try {
      const values = await form.validateFields()
      await handleSaveRiskProfile(values.riskProfile || {})
      message.success('Registration completed!')
      refreshBusinesses()
      window.dispatchEvent(new CustomEvent('refreshBusinessList'))
      navigate('/owner')
    } catch (err) {
      if (!err.errorFields) {
        message.error('Failed to save risk profile')
      }
    }
  }

  // Sync activeTab with currentStep
  useEffect(() => {
    if (currentStep === 0) {
      setActiveTab('business-details')
    } else if (currentStep === 1) {
      setActiveTab('risk-assessment')
    }
  }, [currentStep])

  const handleTabChange = (key) => {
    // Only allow switching to Risk Assessment if Business Details is completed (for new businesses)
    if (key === 'risk-assessment' && isNewBusiness && !selectedBusinessId) {
      message.warning('Please complete Business Details first')
      return
    }
    setActiveTab(key)
    if (key === 'business-details') {
      // Switch to business details tab
      if (currentStep === 1) {
        handlePrev()
      }
    } else if (key === 'risk-assessment') {
      // Switch to risk assessment tab
      if (currentStep === 0) {
        handleNext()
      }
    }
  }

  // Step indicators showing what comes after Business Details
  const registrationSteps = [
    {
      title: 'Business Details',
      description: 'Enter business information',
      icon: <FileTextOutlined />,
      status: selectedBusinessId && currentStep >= 0 ? 'finish' : activeTab === 'business-details' ? 'process' : 'wait'
    },
    {
      title: 'Risk Assessment',
      description: 'Complete risk profile',
      icon: <SafetyCertificateOutlined />,
      status: currentStep >= 1 ? 'process' : activeTab === 'risk-assessment' ? 'process' : 'wait'
    },
    {
      title: 'Complete',
      description: 'Finish registration',
      icon: <CheckCircleOutlined />,
      status: 'wait'
    }
  ]

  const tabItems = [
    {
      key: 'business-details',
      label: 'Business Details',
      children: (
        <Form 
          form={form} 
          layout="vertical"
          initialValues={formData}
          onValuesChange={handleFormValuesChange}
        >
          {/* Step indicators showing what comes next */}
          <Alert
            message="What's Next?"
            description={
              <div style={{ marginTop: 12 }}>
                <Steps
                  current={selectedBusinessId && currentStep >= 0 ? 1 : 0}
                  items={registrationSteps}
                  style={{ marginBottom: 12 }}
                />
              </div>
            }
            type="info"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
          
          <BusinessRegistrationForm
            form={form}
            initialValues={formData}
            onValuesChange={handleFormValuesChange}
          />
          <div 
            style={{ 
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16
            }}
          >
            <Button 
              onClick={() => navigate('/owner')} 
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleStep3Submit}
              loading={loading}
              size="large"
              style={{ minWidth: 160 }}
            >
              Save & Continue
            </Button>
          </div>
        </Form>
      )
    },
    {
      key: 'risk-assessment',
      label: 'Risk Assessment',
      children: (
        <Form 
          form={form} 
          layout="vertical"
          initialValues={formData}
          onValuesChange={handleFormValuesChange}
        >
          <RiskProfileForm
            form={form}
            initialValues={formData}
            onValuesChange={handleFormValuesChange}
            riskLevel={riskLevel}
          />
          <div 
            style={{ 
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16
            }}
          >
            <Button 
              onClick={() => {
                setActiveTab('business-details')
                handlePrev()
              }} 
              disabled={loading}
              size="large"
            >
              Back to Business Details
            </Button>
            <Button
              type="primary"
              onClick={handleStep4Submit}
              loading={loading}
              size="large"
              style={{ minWidth: 160 }}
            >
              Save & Finish
            </Button>
          </div>
        </Form>
      )
    }
  ]

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
              onSelect={handleBusinessSelect}
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

        {isTransitioning && (
          <Alert
            message="Moving to Risk Assessment..."
            description={
              <Progress 
                percent={transitionProgress} 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ marginTop: 8 }}
              />
            }
            type="info"
            showIcon
            closable={false}
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          items={tabItems.map((item, index) => ({
            ...item,
            label: (
              <Space>
                {activeTab === item.key && index === 0 && selectedBusinessId && (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                )}
                <span 
                  style={{
                    fontWeight: activeTab === item.key ? 600 : 400,
                    transition: 'all 0.3s ease',
                    color: activeTab === item.key ? '#1890ff' : undefined
                  }}
                >
                  {item.label}
                </span>
              </Space>
            ),
          }))}
          style={{ 
            marginBottom: 32,
            transition: 'all 0.3s ease'
          }}
        />
      </Card>
    </BusinessOwnerLayout>
  )
}

export default BusinessRegistrationPage
