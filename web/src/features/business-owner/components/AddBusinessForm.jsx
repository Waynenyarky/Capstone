import React, { useState, useEffect } from 'react'
import { Typography, Button, Card, Space, Form, Spin, Alert, Result, Grid, theme, message, } from 'antd'
import { ArrowLeftOutlined, ShopOutlined, FileProtectOutlined,BugOutlined, } from '@ant-design/icons'
import { getActiveFormDefinition } from '@/features/admin/services/formDefinitionService'
import { addBusiness, updateBusiness } from '../services/businessProfileService'
import DynamicFormRenderer from './DynamicFormRenderer'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

function createMockFile(fieldName) {
  const fileName = `${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}_sample.pdf`
  const mockContent = new Blob(['Mock PDF content for testing'], { type: 'application/pdf' })
  const file = new File([mockContent], fileName, { type: 'application/pdf' })
  
  return {
    uid: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: fileName,
    status: 'done',
    originFileObj: file,
    type: 'application/pdf',
    size: mockContent.size,
  }
}

function generateTestDataForField(field) {
  const fieldName = field.key || field.label
  
  switch (field.type) {
    case 'text':
      if (fieldName.toLowerCase().includes('name')) return 'Juan Dela Cruz'
      if (fieldName.toLowerCase().includes('email')) return 'juan.delacruz@example.com'
      if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('contact')) return '09171234567'
      if (fieldName.toLowerCase().includes('tin')) return '123-456-789-000'
      if (fieldName.toLowerCase().includes('business') && fieldName.toLowerCase().includes('name')) return 'ABC Trading Corp.'
      return `Test ${field.label || 'Value'}`
      
    case 'textarea':
      return `This is sample text for ${field.label || 'this field'}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
      
    case 'number':
      if (fieldName.toLowerCase().includes('capital')) return 500000
      if (fieldName.toLowerCase().includes('employee')) return 10
      if (fieldName.toLowerCase().includes('gross')) return 1200000
      if (fieldName.toLowerCase().includes('area') || fieldName.toLowerCase().includes('sqm')) return 150
      return 100
      
    case 'date':
      return null
      
    case 'select':
      if (field.dropdownOptions?.length > 0) {
        return field.dropdownOptions[0]
      }
      return null
      
    case 'multiselect':
      if (field.dropdownOptions?.length > 0) {
        return field.dropdownOptions.slice(0, Math.min(2, field.dropdownOptions.length))
      }
      return []
      
    case 'checkbox':
      return true
      
    case 'file':
      return [createMockFile(fieldName)]
      
    case 'download':
      return undefined
      
    case 'address':
      return undefined
      
    case 'repeatable_group':
      const groupFields = field.groupFields || []
      if (groupFields.length === 0) return [{}]
      const row = {}
      groupFields.forEach(gf => {
        const gfName = gf.key || gf.label
        if (gf.type === 'select' && gf.dropdownOptions?.length > 0) {
          row[gfName] = gf.dropdownOptions[0]
        } else if (gf.type === 'number') {
          row[gfName] = 100
        } else {
          row[gfName] = `Test ${gf.label || 'Value'}`
        }
      })
      return [row]
      
    default:
      return `Test ${field.label || 'Value'}`
  }
}

function generateTestDataForDefinition(definition, category = null) {
  const testData = {}
  
  if (category) {
    testData.category = category
  }
  
  const sections = definition?.sections || []
  
  sections.forEach(section => {
    const items = section.items || []
    items.forEach(field => {
      const fieldName = field.key || field.label
      const value = generateTestDataForField(field)
      if (value !== undefined) {
        testData[fieldName] = value
      }
    })
  })
  
  return testData
}

const GENERAL_PERMIT_CATEGORIES = [
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'association_foundation', label: 'Association / Foundation' },
  { value: 'chainsaw', label: 'Chainsaw Permit' },
  { value: 'firecrackers_stallholders', label: 'Firecrackers Stallholders' },
  { value: 'bazaar_festival_vendors', label: 'Bazaar / Festival Vendors' },
  { value: 'peddlers', label: 'Peddlers' },
  { value: 'promotions_exhibitors', label: 'Promotions / Exhibitors' },
  { value: 'cemetery_stallholders', label: 'Cemetery Stallholders' },
  { value: 'fish_trap_fish_pen', label: 'Fish Trap / Fish Pen' },
  { value: 'fish_pond', label: 'Fish Pond' },
]

function RegistrationTypeSelector({ onSelect, token }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  
  const options = [
    {
      key: 'permit',
      icon: <ShopOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
      title: 'New Business Application',
      description: 'Apply for a new Unified Business Permit for your business.',
    },
    {
      key: 'general_permit',
      icon: <FileProtectOutlined style={{ fontSize: 32, color: token.colorSuccess }} />,
      title: 'General Permit',
      description: 'Apply for special permits such as Cooperative, Peddlers, Fish Pond, etc.',
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>What would you like to do?</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Select the type of application you want to submit.
      </Paragraph>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
        gap: 16 
      }}>
        {options.map((option) => (
          <Card
            key={option.key}
            hoverable
            onClick={() => onSelect(option.key)}
            style={{ 
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
              transition: 'all 0.2s',
            }}
            styles={{
              body: { padding: 24 }
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: token.borderRadiusLG,
                background: token.colorBgLayout,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {option.icon}
              </div>
              <Title level={5} style={{ margin: 0 }}>{option.title}</Title>
              <Text type="secondary">{option.description}</Text>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GeneralPermitCategorySelector({ onSelect, onBack, token }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  
  return (
    <div>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={onBack}
        style={{ marginBottom: 16, padding: 0 }}
      >
        Back to selection
      </Button>
      
      <Title level={4} style={{ marginBottom: 8 }}>Select Permit Category</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Choose the type of general permit you want to apply for.
      </Paragraph>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
        gap: 12 
      }}>
        {GENERAL_PERMIT_CATEGORIES.map((category) => (
          <Card
            key={category.value}
            hoverable
            size="small"
            onClick={() => onSelect(category.value)}
            style={{ 
              cursor: 'pointer',
              border: `1px solid ${token.colorBorder}`,
            }}
            styles={{
              body: { padding: '12px 16px' }
            }}
          >
            <Text strong>{category.label}</Text>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AddBusinessForm({ onBack, editingBusiness }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [form] = Form.useForm()
  
  const isEditing = !!editingBusiness
  const [step, setStep] = useState(isEditing ? 'form' : 'type_selection')
  const [registrationType, setRegistrationType] = useState(editingBusiness?.formType || null)
  const [generalPermitCategory, setGeneralPermitCategory] = useState(editingBusiness?.category || null)
  const [formDefinition, setFormDefinition] = useState(null)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formValues, setFormValues] = useState(editingBusiness?.formData || {})

  // Load form definition when editing
  useEffect(() => {
    if (isEditing && editingBusiness?.formType) {
      fetchFormDefinition(editingBusiness.formType, editingBusiness.category)
    }
  }, [isEditing, editingBusiness?.formType, editingBusiness?.category])

  // Set form values when editing and form definition is loaded
  useEffect(() => {
    if (isEditing && formDefinition && editingBusiness?.formData) {
      form.setFieldsValue(editingBusiness.formData)
      setFormValues(editingBusiness.formData)
    }
  }, [isEditing, formDefinition, editingBusiness?.formData, form])

  const fetchFormDefinition = async (type, category = null) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await getActiveFormDefinition(type)
      
      if (response.success && response.definition) {
        setFormDefinition(response.definition)
        
        if (category) {
          setFormValues({ category })
          form.setFieldValue('category', category)
        }
        
        setStep('form')
      } else {
        setError(response.error || 'No active form definition found for this type.')
      }
    } catch (err) {
      console.error('Failed to fetch form definition:', err)
      setError(err.message || 'Failed to load form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (type) => {
    setRegistrationType(type)
    
    if (type === 'general_permit') {
      setStep('category_selection')
    } else {
      fetchFormDefinition(type)
    }
  }

  const handleCategorySelect = (category) => {
    setGeneralPermitCategory(category)
    fetchFormDefinition('general_permit', category)
  }

  const handleBackToTypeSelection = () => {
    setStep('type_selection')
    setRegistrationType(null)
    setGeneralPermitCategory(null)
    setFormDefinition(null)
    setError(null)
    form.resetFields()
    setFormValues({})
  }

  const handleBackToCategorySelection = () => {
    setStep('category_selection')
    setFormDefinition(null)
    setError(null)
    form.resetFields()
    setFormValues({ category: generalPermitCategory })
  }

  const handleFormValuesChange = (changedValues, allValues) => {
    setFormValues(allValues)
  }

  const handleSubmit = async (values, shouldSubmit = true) => {
    setSubmitting(true)
    
    try {
      const processedValues = { ...values }
      Object.keys(processedValues).forEach(key => {
        const val = processedValues[key]
        if (Array.isArray(val) && val.length > 0 && val[0]?.originFileObj) {
          processedValues[key] = val.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            status: 'pending_upload',
          }))
        }
      })
      
      const extractedBusinessType = processedValues['Industry'] || 
        processedValues['industry'] || 
        processedValues['Industry Classification'] || 
        processedValues['industryClassification'] ||
        processedValues['PSIC Section'] ||
        null
      
      const payload = {
        formType: registrationType,
        formDefinitionId: formDefinition?._id,
        applicationStatus: shouldSubmit ? 'submitted' : 'draft',
        ...(shouldSubmit && { submittedAt: new Date().toISOString() }),
        ...(generalPermitCategory && { category: generalPermitCategory }),
        formData: processedValues,
        businessName: processedValues['Business Name'] || processedValues['businessName'] || processedValues['Trade Name'] || processedValues['tradeName'] || 'New Business Application',
        ...(extractedBusinessType && { businessType: extractedBusinessType }),
        primaryLineOfBusiness: processedValues['Business Type'] || processedValues['businessType'] || processedValues['Line of Business'] || processedValues['lineOfBusiness'] || null,
        tinNumber: processedValues['TIN'] || processedValues['tin'] || processedValues['TIN Number'] || null,
        contactNumber: processedValues['Contact Number'] || processedValues['contactNumber'] || processedValues['Phone'] || processedValues['phone'] || null,
        email: processedValues['Email'] || processedValues['email'] || processedValues['Business Email'] || null,
        capitalInvestment: processedValues['Capital Investment'] || processedValues['capitalInvestment'] || null,
        numberOfEmployees: processedValues['Number of Employees'] || processedValues['numberOfEmployees'] || processedValues['Employee Count'] || null,
      }
      
      let response
      if (isEditing) {
        const businessId = editingBusiness.businessId || editingBusiness._id
        console.log('Updating application:', businessId, payload)
        response = await updateBusiness(businessId, payload)
        message.success(shouldSubmit ? 'Application updated and submitted!' : 'Application saved as draft!')
        setSubmitted(true)
      } else {
        console.log('Creating application:', payload)
        response = await addBusiness(payload)
        if (response.businessId) {
          message.success(shouldSubmit ? 'Application submitted successfully!' : 'Application saved as draft!')
          setSubmitted(true)
        } else {
          throw new Error('Failed to create business application')
        }
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
      message.error(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartNew = () => {
    setStep('type_selection')
    setRegistrationType(null)
    setGeneralPermitCategory(null)
    setFormDefinition(null)
    setError(null)
    setSubmitted(false)
    form.resetFields()
    setFormValues({})
  }

  if (submitted) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="success"
          title="Application Submitted!"
          subTitle="Your application has been submitted successfully. You will be notified once it has been reviewed."
          extra={[
            <Button key="dashboard" type="primary" onClick={onBack}>
              Back to Dashboard
            </Button>,
            <Button key="new" onClick={handleStartNew}>
              Submit Another Application
            </Button>,
          ]}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
        
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Loading form...</Text>
              </div>
            </div>
          ) : error ? (
            <Alert
              type="error"
              message="Unable to Load Form"
              description={error}
              showIcon
              action={
                <Button size="small" onClick={handleBackToTypeSelection}>
                  Go Back
                </Button>
              }
            />
          ) : step === 'type_selection' ? (
            <RegistrationTypeSelector onSelect={handleTypeSelect} token={token} />
          ) : step === 'category_selection' ? (
            <GeneralPermitCategorySelector 
              onSelect={handleCategorySelect} 
              onBack={handleBackToTypeSelection}
              token={token}
            />
          ) : step === 'form' && formDefinition ? (
            <div>
              {!isEditing && (
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={registrationType === 'general_permit' ? handleBackToCategorySelection : handleBackToTypeSelection}
                  style={{ marginBottom: 16, padding: 0 }}
                >
                  {registrationType === 'general_permit' ? 'Back to category selection' : 'Back to selection'}
                </Button>
              )}
              
              <Title level={4} style={{ marginBottom: 4 }}>
                {isEditing 
                  ? `Edit Application - ${editingBusiness?.businessName || 'Business'}`
                  : registrationType === 'permit' 
                    ? 'New Business Application' 
                    : `General Permit - ${GENERAL_PERMIT_CATEGORIES.find(c => c.value === generalPermitCategory)?.label || 'Application'}`
                }
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Please fill out all required fields below.
                </Paragraph>
                <Button 
                  type="dashed" 
                  size="small"
                  icon={<BugOutlined />}
                  onClick={() => {
                    const testData = generateTestDataForDefinition(formDefinition, generalPermitCategory)
                    form.setFieldsValue(testData)
                    setFormValues(prev => ({ ...prev, ...testData }))
                    message.success('Form filled with test data')
                  }}
                >
                  Fill with Test Data
                </Button>
              </div>
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handleFormValuesChange}
                initialValues={formValues}
              >
                <DynamicFormRenderer
                  definition={formDefinition}
                  form={form}
                  formValues={formValues}
                  isMobile={isMobile}
                />
                
                <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <Button onClick={isEditing ? onBack : (registrationType === 'general_permit' ? handleBackToCategorySelection : handleBackToTypeSelection)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      try {
                        const values = await form.validateFields()
                        handleSubmit(values, false)
                      } catch {
                        message.warning('Please fill in required fields before saving')
                      }
                    }}
                    loading={submitting}
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={submitting}
                  >
                    {isEditing ? 'Update & Submit' : 'Submit Application'}
                  </Button>
                </div>
              </Form>
            </div>
          ) : null}
        </Card>
      </Space>
    </div>
  )
}
