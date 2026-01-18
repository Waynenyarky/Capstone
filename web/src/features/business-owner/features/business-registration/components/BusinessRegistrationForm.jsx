import React, { useEffect } from 'react'
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, Checkbox } from 'antd'
import dayjs from 'dayjs'

const { Option } = Select

const BusinessRegistrationForm = ({ form, initialValues }) => {
  const normalizeDate = (value) => {
    if (!value) return null
    if (dayjs.isDayjs(value)) return value
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed : null
  }

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      const values = { ...initialValues }
      if (values.businessRegistrationDate) {
        values.businessRegistrationDate = normalizeDate(values.businessRegistrationDate)
      }
      if (values.declarationDate) {
        values.declarationDate = normalizeDate(values.declarationDate)
      }
      form.setFieldsValue(values)
    }
  }, [initialValues, form])

  return (
    <>
      <Card title="Business Information" style={{ marginBottom: 24 }}>
        <Form.Item
          name="registeredBusinessName"
          label="Registered Business Name (as per DTI / SEC / CDA)"
          rules={[{ required: true, message: 'Registered business name is required' }]}
        >
          <Input placeholder="Enter registered business name" />
        </Form.Item>
        <Form.Item
          name="businessTradeName"
          label="Business Trade Name (if applicable)"
          rules={[{ required: true, message: 'Business trade name is required' }]}
        >
          <Input placeholder="Enter trade name" />
        </Form.Item>
        <Form.Item
          name="businessRegistrationType"
          label="Business Registration Type"
          rules={[{ required: true, message: 'Business registration type is required' }]}
        >
          <Select placeholder="Select registration type">
            <Option value="sole_proprietorship">Sole Proprietorship</Option>
            <Option value="partnership">Partnership</Option>
            <Option value="corporation">Corporation</Option>
            <Option value="cooperative">Cooperative</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="businessRegistrationNumber"
          label="DTI / SEC / CDA Registration Number"
          rules={[{ required: true, message: 'Registration number is required' }]}
        >
          <Input placeholder="Enter registration number" />
        </Form.Item>
        <Form.Item
          name="businessRegistrationDate"
          label="Date of Business Registration"
          rules={[{ required: true, message: 'Business registration date is required' }]}
          getValueProps={(value) => ({ value: normalizeDate(value) })}
          getValueFromEvent={(date) => date}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
      </Card>

      <Card title="Business Address" style={{ marginBottom: 24 }}>
        <Form.Item
          name="businessAddress"
          label="Complete Business Address"
          rules={[{ required: true, message: 'Complete business address is required' }]}
        >
          <Input placeholder="Enter complete address" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="unitBuildingName"
              label="Unit / Building Name"
              rules={[{ required: true, message: 'Unit / Building name is required' }]}
            >
              <Input placeholder="Unit / Building name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="street"
              label="Street"
              rules={[{ required: true, message: 'Street is required' }]}
            >
              <Input placeholder="Street" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="barangay"
              label="Barangay"
              rules={[{ required: true, message: 'Barangay is required' }]}
            >
              <Input placeholder="Barangay" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="cityMunicipality"
              label="City / Municipality"
              rules={[{ required: true, message: 'City / Municipality is required' }]}
            >
              <Input placeholder="City / Municipality" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="businessLocationType"
          label="Business Location Type"
          rules={[{ required: true, message: 'Business location type is required' }]}
        >
          <Select placeholder="Select location type">
            <Option value="owned">Owned</Option>
            <Option value="leased">Leased</Option>
          </Select>
        </Form.Item>
      </Card>

      <Card title="Nature of Business" style={{ marginBottom: 24 }}>
        <Form.Item
          name="primaryLineOfBusiness"
          label="Primary Line of Business"
          rules={[{ required: true, message: 'Primary line of business is required' }]}
        >
          <Input placeholder="Enter primary line of business" />
        </Form.Item>
        <Form.Item
          name="businessClassification"
          label="Business Classification"
          rules={[{ required: true, message: 'Business classification is required' }]}
        >
          <Select placeholder="Select classification">
            <Option value="manufacturing">Manufacturing</Option>
            <Option value="trading_wholesale">Trading / Wholesale</Option>
            <Option value="retail">Retail</Option>
            <Option value="service">Service</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="industryCategory"
          label="Industry Category (e.g., Food, Medical, IT, Construction)"
          rules={[{ required: true, message: 'Industry category is required' }]}
        >
          <Input placeholder="Enter industry category" />
        </Form.Item>
      </Card>

      <Card title="Capitalization" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="declaredCapitalInvestment"
              label="Declared Capital Investment"
              rules={[{ required: true, message: 'Declared capital investment is required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="numberOfBusinessUnits"
              label="Number of Business Units / Branches"
              rules={[{ required: true, message: 'Number of business units is required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Owner / Proprietor Information" style={{ marginBottom: 24 }}>
        <Form.Item
          name="ownerFullName"
          label="Full Name of Owner / Authorized Representative"
          rules={[{ required: true, message: 'Owner name is required' }]}
        >
          <Input placeholder="Full name" />
        </Form.Item>
        <Form.Item
          name="ownerPosition"
          label="Position / Capacity (Owner / Managing Partner / President)"
          rules={[{ required: true, message: 'Position / capacity is required' }]}
        >
          <Input placeholder="Position / Capacity" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ownerNationality"
              label="Nationality"
              rules={[{ required: true, message: 'Nationality is required' }]}
            >
              <Input placeholder="Nationality" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ownerTin"
              label="Taxpayer Identification Number (TIN)"
              rules={[{ required: true, message: 'TIN is required' }]}
            >
              <Input placeholder="TIN" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="ownerResidentialAddress"
          label="Residential Address"
          rules={[{ required: true, message: 'Residential address is required' }]}
        >
          <Input placeholder="Residential address" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="governmentIdType"
              label="Government-Issued ID Type"
              rules={[{ required: true, message: 'ID type is required' }]}
            >
              <Input placeholder="ID type" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="governmentIdNumber"
              label="Government-Issued ID Number"
              rules={[{ required: true, message: 'ID number is required' }]}
            >
              <Input placeholder="ID number" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Contact Details" style={{ marginBottom: 24 }}>
        <Form.Item
          name="emailAddress"
          label="Email Address"
          rules={[
            { required: true, message: 'Email address is required' },
            { type: 'email', message: 'Enter a valid email address' }
          ]}
        >
          <Input placeholder="Email address" />
        </Form.Item>
        <Form.Item
          name="mobileNumber"
          label="Mobile Number"
          rules={[{ required: true, message: 'Mobile number is required' }]}
        >
          <Input placeholder="Mobile number" />
        </Form.Item>
      </Card>

      <Card title="Employment Information" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="numberOfEmployees"
              label="Number of Employees"
              rules={[{ required: true, message: 'Number of employees is required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="withFoodHandlers"
              label="With Food Handlers"
              rules={[{ required: true, message: 'Please select an option' }]}
            >
              <Select placeholder="Select">
                <Option value="yes">Yes</Option>
                <Option value="no">No</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Declaration and Certification" style={{ marginBottom: 24 }}>
        <Form.Item
          name="certificationAccepted"
          valuePropName="checked"
          rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Certification is required')) }]}
        >
          <Checkbox>
            I certify that the information provided is true and correct.
          </Checkbox>
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="declarantName"
              label="Name of Declarant"
              rules={[{ required: true, message: 'Name of declarant is required' }]}
            >
              <Input placeholder="Declarant name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="declarationDate"
              label="Date of Submission"
              rules={[{ required: true, message: 'Date of submission is required' }]}
          getValueProps={(value) => ({ value: normalizeDate(value) })}
          getValueFromEvent={(date) => date}
            >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  )
}

export default BusinessRegistrationForm
