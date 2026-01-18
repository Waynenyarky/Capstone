import React, { useState, useEffect } from 'react'
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, Checkbox, Space, Alert } from 'antd'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const BusinessRegistrationForm = ({ form, initialValues, onValuesChange }) => {
  const mailingAddressDifferent = Form.useWatch('mailingAddressDifferent', form)
  const registrationAgency = Form.useWatch('registrationAgency', form)

  // Get registration number format info based on agency
  const getRegistrationNumberInfo = (agency) => {
    if (!agency) return { placeholder: 'Enter registration number', format: null, pattern: null }
    
    const agencyUpper = String(agency).toUpperCase()
    switch (agencyUpper) {
      case 'DTI':
        return {
          placeholder: 'DTI-12345-67890',
          format: 'DTI-XXXXX-XXXXX',
          pattern: /^DTI-\d{5}-\d{5}$/,
          help: 'Example: DTI-12345-67890'
        }
      case 'SEC':
        return {
          placeholder: 'CS-123456',
          format: 'CS-XXXXXX',
          pattern: /^CS-\d{6}$/,
          help: 'Example: CS-123456'
        }
      case 'BIR':
        return {
          placeholder: '123456789',
          format: '9 digits',
          pattern: /^\d{9}$/,
          help: 'Example: 123456789'
        }
      case 'LGU':
      case 'BARANGAY_OFFICE':
        return {
          placeholder: 'LGU-2024-001',
          format: 'Alphanumeric with dashes',
          pattern: /^[A-Z0-9\-\/]+$/i,
          help: 'Example: LGU-2024-001'
        }
      case 'CDA':
        return {
          placeholder: 'CDA-12345',
          format: 'CDA-XXXXX',
          pattern: /^CDA-[A-Z0-9-]+$/i,
          help: 'Example: CDA-12345'
        }
      case 'FDA':
      case 'BFAD':
        return {
          placeholder: 'FDA-12345',
          format: 'FDA-XXXXX or BFAD-XXXXX',
          pattern: /^(FDA|BFAD)-[A-Z0-9-]+$/i,
          help: 'Example: FDA-12345 or BFAD-12345'
        }
      case 'DA':
      case 'DENR':
      case 'PRC':
      case 'MARITIME_INDUSTRY_AUTHORITY':
        return {
          placeholder: 'Enter number',
          format: 'Alphanumeric with dashes',
          pattern: /^[A-Z0-9\-\/]+$/i,
          help: 'Example: ABC-12345'
        }
      default:
        return {
          placeholder: 'Enter number',
          format: null,
          pattern: null,
          help: 'Enter registration number'
        }
    }
  }

  const regNumberInfo = getRegistrationNumberInfo(registrationAgency)
  const [regNumberValidationStatus, setRegNumberValidationStatus] = useState('')

  // Auto-format registration number based on agency
  const formatRegistrationNumber = (value, agency) => {
    if (!value || !agency) return value
    
    const agencyUpper = String(agency).toUpperCase()
    // Remove special characters except dashes and slashes, then uppercase
    let cleanValue = value.replace(/[^A-Z0-9\-\/]/gi, '').toUpperCase()
    
    // If empty, return as is
    if (!cleanValue) return ''
    
    switch (agencyUpper) {
      case 'DTI':
        // Auto-add DTI- prefix if user types numbers
        if (/^\d/.test(cleanValue) && !cleanValue.startsWith('DTI-')) {
          // Format as DTI-XXXXX-XXXXX
          const digits = cleanValue.replace(/[^0-9]/g, '')
          if (digits.length <= 5) {
            return `DTI-${digits}`
          } else {
            const first = digits.slice(0, 5)
            const second = digits.slice(5, 10)
            return `DTI-${first}${second ? '-' + second : ''}`
          }
        }
        return cleanValue.startsWith('DTI-') ? cleanValue : (cleanValue ? `DTI-${cleanValue.replace(/^DTI-?/, '')}` : cleanValue)
      
      case 'SEC':
        // Auto-add CS- prefix if user types numbers
        if (/^\d/.test(cleanValue) && !cleanValue.startsWith('CS-')) {
          const digits = cleanValue.replace(/[^0-9]/g, '').slice(0, 6)
          return `CS-${digits}`
        }
        return cleanValue.startsWith('CS-') ? cleanValue : (cleanValue ? `CS-${cleanValue.replace(/^CS-?/, '')}` : cleanValue)
      
      case 'CDA':
        // Auto-add CDA- prefix
        if (!cleanValue.startsWith('CDA-')) {
          const rest = cleanValue.replace(/^CDA-?/, '')
          return rest ? `CDA-${rest}` : cleanValue
        }
        return cleanValue
      
      case 'FDA':
        // Auto-add FDA- prefix
        if (!cleanValue.startsWith('FDA-') && !cleanValue.startsWith('BFAD-')) {
          const rest = cleanValue.replace(/^(FDA|BFAD)-?/, '')
          return rest ? `FDA-${rest}` : cleanValue
        }
        return cleanValue
      
      case 'BFAD':
        // Auto-add BFAD- prefix
        if (!cleanValue.startsWith('FDA-') && !cleanValue.startsWith('BFAD-')) {
          const rest = cleanValue.replace(/^(FDA|BFAD)-?/, '')
          return rest ? `BFAD-${rest}` : cleanValue
        }
        return cleanValue
      
      case 'BIR':
        // Only allow digits, format as XXX-XXX-XXX
        const digits = cleanValue.replace(/[^0-9]/g, '').slice(0, 9)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
      
      case 'LGU':
      case 'BARANGAY_OFFICE':
      case 'DA':
      case 'DENR':
      case 'PRC':
      case 'MARITIME_INDUSTRY_AUTHORITY':
        // Allow flexible format for these agencies
        return cleanValue
      
      default:
        return cleanValue
    }
  }

  // Auto-format registration number based on agency
  const handleRegistrationNumberChange = (e) => {
    const value = e.target?.value || e
    const formattedValue = formatRegistrationNumber(value, registrationAgency)
    
    // Only update if value actually changed to avoid circular references
    const currentValue = form.getFieldValue('businessRegistrationNumber')
    if (formattedValue !== currentValue) {
      // Use requestAnimationFrame to avoid circular reference warnings
      requestAnimationFrame(() => {
        form.setFieldValue('businessRegistrationNumber', formattedValue)
      })
    }
    
    // Real-time validation
    if (formattedValue && registrationAgency) {
      const info = getRegistrationNumberInfo(registrationAgency)
      if (info.pattern && info.pattern.test(formattedValue)) {
        setRegNumberValidationStatus('success')
      } else {
        setRegNumberValidationStatus('error')
      }
    } else {
      setRegNumberValidationStatus('')
    }
  }

  // Set form values from initialValues when they change (e.g., on page refresh)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Convert date strings to dayjs objects if needed
      const values = { ...initialValues }
      if (values.businessStartDate) {
        if (typeof values.businessStartDate === 'string') {
          values.businessStartDate = dayjs(values.businessStartDate)
        } else if (values.businessStartDate instanceof Date) {
          values.businessStartDate = dayjs(values.businessStartDate)
        }
      }
      if (values.incorporationDate) {
        if (typeof values.incorporationDate === 'string') {
          values.incorporationDate = dayjs(values.incorporationDate)
        } else if (values.incorporationDate instanceof Date) {
          values.incorporationDate = dayjs(values.incorporationDate)
        }
      }
      
      // Get current form values to avoid overwriting user input
      const currentValues = form.getFieldsValue()
      // Merge: initialValues (from storage/backend) as base, but keep current user input if form is active
      const mergedValues = { ...values, ...currentValues }
      
      // Only set if values actually changed to avoid unnecessary updates
      const hasChanged = Object.keys(values).some(key => {
        const currentVal = currentValues[key]
        const newVal = values[key]
        return JSON.stringify(currentVal) !== JSON.stringify(newVal)
      })
      
      if (hasChanged) {
        form.setFieldsValue(values)
      }
    }
  }, [initialValues, form])

  // Reset validation status when agency changes
  useEffect(() => {
    setRegNumberValidationStatus('')
    const currentValue = form.getFieldValue('businessRegistrationNumber')
    if (currentValue && registrationAgency) {
      const formattedValue = formatRegistrationNumber(currentValue, registrationAgency)
      if (formattedValue !== currentValue) {
        form.setFieldValue('businessRegistrationNumber', formattedValue)
      }
    }
  }, [registrationAgency]) // eslint-disable-line react-hooks/exhaustive-deps

  // Form is already provided by parent, just render form items
  return (
    <>
      <Card title="Business Information" style={{ marginBottom: 24 }}>
        <Form.Item
          name="businessName"
          label="Business Name"
          rules={[{ required: true, message: 'Business name is required' }]}
        >
          <Input placeholder="Enter business name" />
        </Form.Item>

        <Form.Item
          name="registrationStatus"
          label="Registration Status"
          rules={[{ required: true, message: 'Registration status is required' }]}
        >
          <Select placeholder="Select status">
            <Option value="not_yet_registered">Not yet registered</Option>
            <Option value="proposed">Pending approval</Option>
          </Select>
        </Form.Item>
      </Card>

      <Card title="Business Address" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['location', 'street']}
              label="Street"
              rules={[{ required: true, message: 'Street is required' }]}
            >
              <Input placeholder="Street address" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['location', 'barangay']}
              label="Barangay"
              rules={[{ required: true, message: 'Barangay is required' }]}
            >
              <Input placeholder="Barangay" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['location', 'city']}
              label="City"
              rules={[{ required: true, message: 'City is required' }]}
            >
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['location', 'municipality']}
              label="Municipality"
              rules={[{ required: true, message: 'Municipality is required' }]}
            >
              <Input placeholder="Municipality" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['location', 'province']}
              label="Province"
              rules={[{ required: true, message: 'Province is required' }]}
            >
              <Input placeholder="Province" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['location', 'zipCode']}
              label="ZIP Code"
              rules={[{ required: true, message: 'ZIP code is required' }]}
            >
              <Input placeholder="ZIP code" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['location', 'geolocation', 'lat']}
              label="Latitude"
              rules={[
                { required: true, message: 'Latitude is required' },
                { type: 'number', min: 4.2, max: 21.1, message: 'Latitude must be within Philippines bounds (4.2°N to 21.1°N)' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="e.g., 14.5995"
                step={0.0001}
                precision={6}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['location', 'geolocation', 'lng']}
              label="Longitude"
              rules={[
                { required: true, message: 'Longitude is required' },
                { type: 'number', min: 116.9, max: 126.6, message: 'Longitude must be within Philippines bounds (116.9°E to 126.6°E)' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="e.g., 120.9842"
                step={0.0001}
                precision={6}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="mailingAddressDifferent" valuePropName="checked">
          <Checkbox>Mailing address is different from business location</Checkbox>
        </Form.Item>

        {mailingAddressDifferent && (
          <Form.Item
            name={['location', 'mailingAddress']}
            label="Mailing / Billing Address"
          >
            <TextArea rows={3} placeholder="Enter mailing address if different from business location" />
          </Form.Item>
        )}
      </Card>

      <Card title="Registration Details" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="businessType"
              label="Business Type"
              rules={[{ required: true, message: 'Business type is required' }]}
            >
              <Select placeholder="Select business type">
                <Option value="retail_trade">Retail/Trade</Option>
                <Option value="food_beverages">Food & Beverages</Option>
                <Option value="services">Services</Option>
                <Option value="manufacturing_industrial">Manufacturing/Industrial</Option>
                <Option value="agriculture_fishery_forestry">Agriculture / Fishery / Forestry</Option>
                <Option value="construction_real_estate_housing">Construction / Real Estate / Housing</Option>
                <Option value="transportation_automotive_logistics">Transportation / Automotive / Logistics</Option>
                <Option value="financial_insurance_banking">Financial / Insurance / Banking</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="registrationAgency"
              label="Registration Agency"
              rules={[{ required: true, message: 'Registration agency is required' }]}
            >
              <Select placeholder="Select agency">
                <Option value="DTI">DTI</Option>
                <Option value="SEC">SEC</Option>
                <Option value="LGU">LGU</Option>
                <Option value="CDA">CDA</Option>
                <Option value="BIR">BIR</Option>
                <Option value="Barangay_Office">Barangay Office</Option>
                <Option value="FDA">FDA</Option>
                <Option value="BFAD">BFAD</Option>
                <Option value="DA">DA</Option>
                <Option value="DENR">DENR</Option>
                <Option value="PRC">PRC</Option>
                <Option value="MARITIME_INDUSTRY_AUTHORITY">Maritime Industry Authority</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="businessRegistrationNumber"
          label="Registration Number"
          validateStatus={regNumberValidationStatus}
          hasFeedback={!!regNumberValidationStatus}
          rules={[
            { required: true, message: 'Registration number is required' },
            {
              validator: (_, value) => {
                if (!value || !registrationAgency) return Promise.resolve()
                const info = getRegistrationNumberInfo(registrationAgency)
                const cleanValue = value.toUpperCase().trim()
                
                if (info.pattern) {
                  if (!info.pattern.test(cleanValue)) {
                    // Agency-specific government-focused error messages
                    const agencyUpper = String(registrationAgency).toUpperCase()
                    let errorMsg = ''
                    
                    switch (agencyUpper) {
                      case 'DTI':
                        errorMsg = 'Format: DTI-XXXXX-XXXXX (e.g., DTI-12345-67890)'
                        break
                      case 'SEC':
                        errorMsg = 'Format: CS-XXXXXX (e.g., CS-123456)'
                        break
                      case 'BIR':
                        errorMsg = 'Format: 9 digits (e.g., 123456789)'
                        break
                      case 'CDA':
                        errorMsg = 'Format: CDA-XXXXX'
                        break
                      case 'FDA':
                      case 'BFAD':
                        errorMsg = `Format: ${agencyUpper}-XXXXX`
                        break
                      case 'LGU':
                      case 'BARANGAY_OFFICE':
                        errorMsg = 'Format: Alphanumeric with dashes (minimum 3 characters)'
                        break
                      default:
                        errorMsg = `Invalid format for ${registrationAgency}`
                    }
                    
                    return Promise.reject(new Error(errorMsg))
                  }
                }
                return Promise.resolve()
              }
            }
          ]}
          help={
            regNumberValidationStatus === 'success' 
              ? `✓ Valid format`
              : regNumberValidationStatus === 'error'
              ? `Invalid format for ${registrationAgency || 'selected agency'}`
              : regNumberInfo.help
          }
        >
          <Input 
            placeholder={regNumberInfo.placeholder}
            onChange={handleRegistrationNumberChange}
            style={{ textTransform: 'uppercase' }}
            allowClear
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="businessStartDate"
              label="Business Start Date"
              rules={[{ required: true, message: 'Business start date is required' }]}
              getValueFromEvent={(date) => date}
              getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="numberOfBranches"
              label="Number of Branches"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="industryClassification"
              label="PSIC Code"
              help="Philippine Standard Industrial Classification"
            >
              <Input placeholder="Enter PSIC code" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="taxIdentificationNumber"
              label="TIN"
              help="9-digit Tax Identification Number"
            >
              <Input placeholder="123456789" maxLength={9} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="contactNumber"
          label="Business Contact Number"
          rules={[
            { required: true, message: 'Contact number is required' },
            { 
              pattern: /^[9]\d{9}$/, 
              message: 'Please enter a valid mobile number starting with 9 (e.g., 9123456789)',
              transform: (value) => value?.replace(/^\+63\s*/, '') // Remove +63 prefix for validation
            }
          ]}
          getValueFromEvent={(e) => {
            const value = e.target.value
            // Remove +63 prefix if user types it
            return value?.replace(/^\+63\s*/, '')
          }}
        >
          <Input 
            addonBefore="+63" 
            placeholder="9123456789"
            maxLength={10}
          />
        </Form.Item>
      </Card>
    </>
  )
}

export default BusinessRegistrationForm
