import React, { useState, useEffect } from 'react'
import { Drawer, Steps, Button, Form, Space, Tag, message, Popconfirm, Alert } from 'antd'
import { ShopOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useBusinessRegistrationDrawer } from '../hooks/useBusinessRegistrationDrawer'
import BusinessRegistrationForm from './BusinessRegistrationForm'
import RiskProfileForm from './RiskProfileForm'
import BusinessSelector from './BusinessSelector'

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

const BusinessRegistrationDrawer = ({ open, onClose, initialBusinessId = null }) => {
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
    handleClose: closeDrawer,
    handleBusinessSelect,
    handleNext,
    handlePrev,
    handleSaveBusinessRegistration,
    handleSaveRiskProfile,
    handleDelete,
    refreshBusinesses
  } = useBusinessRegistrationDrawer(open, onClose)

  const [form] = Form.useForm()
  const [riskLevel, setRiskLevel] = useState('low')

  useEffect(() => {
    if (open) {
      if (initialBusinessId === 'primary') {
        // Find primary business ID
        const primary = businesses.find(b => b.isPrimary)
        handleOpen(primary?.businessId || null)
      } else if (initialBusinessId) {
        handleOpen(initialBusinessId)
      } else {
        handleOpen(null)
      }
    }
  }, [open, initialBusinessId, businesses]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      if (formData && !isNewBusiness) {
        // Load existing business data
        form.setFieldsValue({
          ...formData,
          businessStartDate: formData.businessStartDate ? dayjs(formData.businessStartDate) : null,
          mailingAddressDifferent: !!formData.location?.mailingAddress,
          // Ensure nested location structure is properly set
          location: {
            ...formData.location,
            geolocation: formData.location?.geolocation || { lat: 0, lng: 0 }
          }
        })
        setRiskLevel(formData.riskProfile?.riskLevel || 'low')
      } else if (isNewBusiness) {
        // Reset form for new business
        form.resetFields()
        setRiskLevel('low')
      }
    }
  }, [formData, isNewBusiness, open, form])

  const handleFormValuesChange = (changedValues, allValues) => {
    // Calculate risk level when relevant fields change (for both steps)
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
      const values = await form.validateFields()
      
      // Prepare business data
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
      // Trigger refresh event for BusinessListWidget
      window.dispatchEvent(new CustomEvent('refreshBusinessList'))
      handleNext()
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
      message.success('Business registration completed successfully!')
      refreshBusinesses()
      // Trigger refresh event for BusinessListWidget
      window.dispatchEvent(new CustomEvent('refreshBusinessList'))
      closeDrawer()
    } catch (err) {
      if (!err.errorFields) {
        message.error('Failed to save risk profile')
      }
    }
  }

  const steps = [
    {
      title: 'Business Registration',
      description: 'Step 3'
    },
    {
      title: 'Risk Profile',
      description: 'Step 4'
    }
  ]

  return (
      <Drawer
      title={
        <Space>
          <ShopOutlined />
          <span>Business Registration</span>
          {selectedBusiness?.isPrimary && (
            <Tag color="blue">Primary</Tag>
          )}
        </Space>
      }
      width={900}
      open={open}
      onClose={closeDrawer}
      extra={
        <Space>
          {!isNewBusiness && (
            <Popconfirm
              title="Delete Business"
              description="Are you sure you want to delete this business? This action cannot be undone."
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
        </Space>
      }
    >
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626' }}>
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
            message="Primary Business Registration"
            description="During registration, you are required to register one primary business. Additional businesses may be registered after successful account creation via the user dashboard."
            type="info"
            showIcon
            style={{ marginTop: 12 }}
            closable
          />
        )}
      </div>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

      <Form 
        form={form} 
        layout="vertical"
        initialValues={formData}
        onValuesChange={handleFormValuesChange}
      >
        {currentStep === 0 && (
          <BusinessRegistrationForm
            form={form}
            initialValues={formData}
            onValuesChange={handleFormValuesChange}
          />
        )}

        {currentStep === 1 && (
          <RiskProfileForm
            form={form}
            initialValues={formData}
            onValuesChange={handleFormValuesChange}
            riskLevel={riskLevel}
          />
        )}

        {/* Professional Footer with Action Buttons */}
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
            onClick={currentStep === 0 ? closeDrawer : handlePrev} 
            disabled={loading}
            size="large"
          >
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <Button
            type="primary"
            onClick={currentStep === 0 ? handleStep3Submit : handleStep4Submit}
            loading={loading}
            size="large"
            style={{ minWidth: 160 }}
          >
            {currentStep === 0 ? 'Next: Risk Profile' : 'Save & Complete'}
          </Button>
        </div>
      </Form>
    </Drawer>
  )
}

export default BusinessRegistrationDrawer
