import React, { useEffect, useMemo, useCallback } from 'react'
import {
  Form, Input, Select, DatePicker, InputNumber, Row, Col, Card,
  Checkbox, Radio, Table, Button, Space, Typography, Divider
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  LINE_OF_BUSINESS,
  LINE_OF_BUSINESS_BY_TAX_CODE,
  TAX_CODE_OPTIONS,
  APPLICATION_TYPES,
  ORGANIZATION_TYPES,
} from '@/constants/lineOfBusiness'

const { Option } = Select
const { Title, Text } = Typography

const normalizeDate = (value) => {
  if (!value) return null
  if (dayjs.isDayjs(value)) return value
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

/**
 * Step 1: Application Type + Organization Type
 */
export function Step1ApplicationType({ form }) {
  return (
    <Card title="Application Type & Organization">
      <Form.Item
        name="applicationType"
        label="Application Type"
        rules={[{ required: true, message: 'Select an application type' }]}
      >
        <Radio.Group>
          {APPLICATION_TYPES.map((t) => (
            <Radio.Button key={t.value} value={t.value}>{t.label}</Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>
      <Form.Item
        name="organizationType"
        label="Organization Type"
        rules={[{ required: true, message: 'Select an organization type' }]}
      >
        <Select placeholder="Select organization type" options={ORGANIZATION_TYPES} />
      </Form.Item>
    </Card>
  )
}

/**
 * Step 2: Taxpayer & Business Info
 */
export function Step2TaxpayerInfo({ form }) {
  const orgType = Form.useWatch('organizationType', form)
  const appType = Form.useWatch('applicationType', form)
  const isRenewalOrAmendment = appType === 'renewal' || appType === 'amendment'

  return (
    <>
      <Card title="Business Identification" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="businessPlateNo"
              label="Business Plate No."
              rules={isRenewalOrAmendment ? [{ required: true, message: 'Business Plate No. is required for renewal/amendment' }] : []}
            >
              <Input placeholder="e.g. BP-2024-00001" disabled={false} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="yearEstablished" label="Year Established">
              <InputNumber style={{ width: '100%' }} min={1900} max={new Date().getFullYear()} placeholder="e.g. 2020" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Taxpayer Information" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="registeredBusinessName"
              label="Registered Business Name (DTI / SEC / CDA)"
              rules={[{ required: true, message: 'Business name is required' }]}
            >
              <Input placeholder="Enter registered business name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="businessTradeName" label="Business Trade Name / Franchise">
              <Input placeholder="Enter trade name (if applicable)" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="ownerFullName"
              label="Taxpayer / Owner Name"
              rules={[{ required: true, message: 'Owner name is required' }]}
            >
              <Input placeholder="Full name of owner / authorized representative" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="ownerPosition" label="Position / Capacity">
              <Input placeholder="Owner / Managing Partner / President" />
            </Form.Item>
          </Col>
        </Row>
        {(orgType === 'corporation' || orgType === 'cooperative') && (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="presidentName" label="President">
                <Input placeholder="Name of President" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="treasurerName" label="Treasurer">
                <Input placeholder="Name of Treasurer" />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="ownerNationality" label="Nationality">
              <Input placeholder="Filipino" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="ownerTin" label="TIN">
              <Input placeholder="000-000-000-000" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="taxIdentificationNumber" label="Business TIN (if different)">
              <Input placeholder="Business TIN" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Contact Details" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="emailAddress"
              label="Email Address"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' }
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="mobileNumber"
              label="Mobile Number"
              rules={[{ required: true, message: 'Mobile number is required' }]}
            >
              <Input placeholder="09xxxxxxxxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="contactNumber" label="Landline / Other Contact">
              <Input placeholder="(02) xxxx-xxxx" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  )
}

/**
 * Step 3: Addresses (Business, Owner, Lessor, Emergency Contact)
 */
export function Step3Addresses({ form }) {
  const locationType = Form.useWatch('businessLocationType', form)

  return (
    <>
      <Card title="Business Address" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="houseBldgNo" label="House / Bldg No.">
              <Input placeholder="House / Bldg No." />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="buildingName" label="Building Name">
              <Input placeholder="Building name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="street" label="Street" rules={[{ required: true, message: 'Street is required' }]}>
              <Input placeholder="Street" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="barangay" label="Barangay" rules={[{ required: true, message: 'Barangay is required' }]}>
              <Input placeholder="Barangay" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="subdivision" label="Subdivision">
              <Input placeholder="Subdivision" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="cityMunicipality" label="City / Municipality" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="City / Municipality" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Form.Item name="blockCode" label="Block Code">
              <Input placeholder="Block code" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="pin" label="PIN">
              <Input placeholder="PIN" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="buildingRegistryNo" label="Building Registry No.">
              <Input placeholder="Registry No." />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="businessAreaSqm" label="Business Area (sq.m.)">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="totalEmployees" label="Total Employees">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="employeesResidingInLgu" label="Employees Residing in LGU">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="businessLocationType" label="Location Type" rules={[{ required: true, message: 'Required' }]}>
              <Select placeholder="Select">
                <Option value="owned">Owned</Option>
                <Option value="leased">Leased</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Owner's Address" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name={['ownerAddress', 'street']} label="Street">
              <Input placeholder="Street" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={['ownerAddress', 'barangay']} label="Barangay">
              <Input placeholder="Barangay" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={['ownerAddress', 'city']} label="City">
              <Input placeholder="City" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name={['ownerAddress', 'province']} label="Province">
              <Input placeholder="Province" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name={['ownerAddress', 'zipCode']} label="Zip Code">
              <Input placeholder="e.g. 2500" maxLength={4} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {locationType === 'leased' && (
        <Card title="Lessor Information" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name={['lessorInfo', 'name']} label="Lessor Name">
                <Input placeholder="Name of lessor" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['lessorInfo', 'businessAddress']} label="Lessor Business Address">
                <Input placeholder="Address of lessor" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )}

      <Card title="Emergency Contact" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name={['emergencyContact', 'name']} label="Contact Person">
              <Input placeholder="Full name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={['emergencyContact', 'phone']} label="Phone Number">
              <Input placeholder="09xxxxxxxxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={['emergencyContact', 'relationship']} label="Relationship">
              <Input placeholder="e.g. Spouse, Sibling" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  )
}

/**
 * Step 4: Business Activities (table with cascading dropdowns)
 */
export function Step4BusinessActivities({ form }) {
  const activities = Form.useWatch('businessActivities', form) || []

  const addActivity = useCallback(() => {
    const current = form.getFieldValue('businessActivities') || []
    form.setFieldsValue({
      businessActivities: [...current, { taxCode: '', lineOfBusiness: '', detailedLine: '', psicCode: '', grossSales: 0 }]
    })
  }, [form])

  const removeActivity = useCallback((index) => {
    const current = form.getFieldValue('businessActivities') || []
    form.setFieldsValue({
      businessActivities: current.filter((_, i) => i !== index)
    })
  }, [form])

  const handleTaxCodeChange = useCallback((index, taxCode) => {
    const current = form.getFieldValue('businessActivities') || []
    const updated = [...current]
    updated[index] = { ...updated[index], taxCode, lineOfBusiness: '', detailedLine: '', psicCode: '' }
    form.setFieldsValue({ businessActivities: updated })
  }, [form])

  const handleDetailedLineChange = useCallback((index, detailedLine) => {
    const current = form.getFieldValue('businessActivities') || []
    const updated = [...current]
    const entry = LINE_OF_BUSINESS_BY_TAX_CODE[updated[index]?.taxCode]
    if (entry) {
      const detailedIdx = entry.detailedLines.indexOf(detailedLine)
      const psicCode = detailedIdx >= 0 && entry.psicCodes[detailedIdx] ? entry.psicCodes[detailedIdx] : ''
      updated[index] = { ...updated[index], detailedLine, psicCode, lineOfBusiness: entry.lineOfBusiness }
    } else {
      updated[index] = { ...updated[index], detailedLine }
    }
    form.setFieldsValue({ businessActivities: updated })
  }, [form])

  const columns = [
    {
      title: '#',
      width: 50,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: 'Tax Code',
      dataIndex: 'taxCode',
      width: 180,
      render: (val, _, idx) => (
        <Select
          value={val || undefined}
          placeholder="Select"
          options={TAX_CODE_OPTIONS}
          onChange={(v) => handleTaxCodeChange(idx, v)}
          style={{ width: '100%' }}
          size="small"
        />
      ),
    },
    {
      title: 'Line of Business',
      dataIndex: 'lineOfBusiness',
      width: 150,
      render: (val, record) => {
        const entry = LINE_OF_BUSINESS_BY_TAX_CODE[record.taxCode]
        return entry ? <Text>{entry.label}</Text> : <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Detailed Line',
      dataIndex: 'detailedLine',
      width: 250,
      render: (val, record, idx) => {
        const entry = LINE_OF_BUSINESS_BY_TAX_CODE[record.taxCode]
        return (
          <Select
            value={val || undefined}
            placeholder="Select detailed line"
            disabled={!entry}
            onChange={(v) => handleDetailedLineChange(idx, v)}
            style={{ width: '100%' }}
            size="small"
          >
            {(entry?.detailedLines || []).map((dl) => (
              <Option key={dl} value={dl}>{dl}</Option>
            ))}
          </Select>
        )
      },
    },
    {
      title: 'PSIC Code',
      dataIndex: 'psicCode',
      width: 120,
      render: (val, record, idx) => (
        <Input
          value={val}
          placeholder="Auto / manual"
          size="small"
          onChange={(e) => {
            const current = form.getFieldValue('businessActivities') || []
            const updated = [...current]
            updated[idx] = { ...updated[idx], psicCode: e.target.value }
            form.setFieldsValue({ businessActivities: updated })
          }}
        />
      ),
    },
    {
      title: 'Gross Sales (₱)',
      dataIndex: 'grossSales',
      width: 150,
      render: (val, _, idx) => (
        <InputNumber
          value={val}
          min={0}
          style={{ width: '100%' }}
          size="small"
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => v.replace(/,/g, '')}
          onChange={(v) => {
            const current = form.getFieldValue('businessActivities') || []
            const updated = [...current]
            updated[idx] = { ...updated[idx], grossSales: v || 0 }
            form.setFieldsValue({ businessActivities: updated })
          }}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, __, idx) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => removeActivity(idx)}
        />
      ),
    },
  ]

  return (
    <Card title="Business Activities">
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Add each business activity. Select a tax code first — the line of business and PSIC code will auto-populate based on your selection.
      </Text>
      <Table
        dataSource={activities.map((a, i) => ({ ...a, key: i }))}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No business activities added yet. Click "Add Activity" below.' }}
      />
      <Button
        type="dashed"
        onClick={addActivity}
        icon={<PlusOutlined />}
        style={{ width: '100%', marginTop: 16 }}
      >
        Add Activity
      </Button>
    </Card>
  )
}

/**
 * Step 5: Capital & Financial
 */
export function Step5Capital({ form }) {
  const mev = Form.useWatch(['capital', 'mev'], form) || []

  const addMev = useCallback(() => {
    const current = form.getFieldValue(['capital', 'mev']) || []
    form.setFieldsValue({ capital: { ...form.getFieldValue('capital'), mev: [...current, { description: '', amount: 0 }] } })
  }, [form])

  const removeMev = useCallback((index) => {
    const current = form.getFieldValue(['capital', 'mev']) || []
    form.setFieldsValue({ capital: { ...form.getFieldValue('capital'), mev: current.filter((_, i) => i !== index) } })
  }, [form])

  return (
    <>
      <Card title="Initial Capital" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name={['capital', 'initialBuilding']} label="Building">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/[₱,\s]/g, '')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="declaredCapitalInvestment" label="Declared Capital Investment">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/[₱,\s]/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Machineries, Equipment & Vehicles (MEV)" style={{ marginBottom: 24 }}>
        <Table
          dataSource={mev.map((m, i) => ({ ...m, key: i }))}
          columns={[
            {
              title: 'Description',
              dataIndex: 'description',
              render: (val, _, idx) => (
                <Input
                  value={val}
                  placeholder="e.g. Delivery truck"
                  size="small"
                  onChange={(e) => {
                    const current = form.getFieldValue(['capital', 'mev']) || []
                    const updated = [...current]
                    updated[idx] = { ...updated[idx], description: e.target.value }
                    form.setFieldsValue({ capital: { ...form.getFieldValue('capital'), mev: updated } })
                  }}
                />
              ),
            },
            {
              title: 'Amount (₱)',
              dataIndex: 'amount',
              width: 200,
              render: (val, _, idx) => (
                <InputNumber
                  value={val}
                  min={0}
                  style={{ width: '100%' }}
                  size="small"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v.replace(/,/g, '')}
                  onChange={(v) => {
                    const current = form.getFieldValue(['capital', 'mev']) || []
                    const updated = [...current]
                    updated[idx] = { ...updated[idx], amount: v || 0 }
                    form.setFieldsValue({ capital: { ...form.getFieldValue('capital'), mev: updated } })
                  }}
                />
              ),
            },
            {
              title: '',
              width: 50,
              render: (_, __, idx) => (
                <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeMev(idx)} />
              ),
            },
          ]}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No MEV entries.' }}
          scroll={{ x: 'max-content' }}
        />
        <Button type="dashed" onClick={addMev} icon={<PlusOutlined />} style={{ width: '100%', marginTop: 12 }}>
          Add MEV Entry
        </Button>
      </Card>

      <Card title="Operating Capital" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name={['capital', 'equity']} label="Equity">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/[₱,\s]/g, '')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name={['capital', 'payable']} label="Payable">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                formatter={(v) => `₱ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/[₱,\s]/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  )
}

/**
 * Step 6: Accreditations / Licenses
 */
export function Step6Accreditations({ form }) {
  const orgType = Form.useWatch('organizationType', form)

  // Determine primary accreditation label based on org type
  const primaryAccreditationLabel = useMemo(() => {
    switch (orgType) {
      case 'cooperative': return 'CDA Registration No.'
      case 'corporation': case 'partnership': return 'SEC Registration No.'
      default: return 'DTI Registration No.'
    }
  }, [orgType])

  return (
    <Card title="Accreditations / Licenses">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name={['accreditations', 'dtiSecCda']} label={primaryAccreditationLabel}>
            <Input placeholder="Registration number" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={['accreditations', 'bir']} label="BIR Registration No.">
            <Input placeholder="BIR registration number" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name={['accreditations', 'tin']} label="TIN">
            <Input placeholder="TIN" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name={['accreditations', 'nfa']} label="NFA License No. (if applicable)">
            <Input placeholder="NFA license" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name={['accreditations', 'bfad']} label="BFAD / FDA Permit (if applicable)">
            <Input placeholder="BFAD / FDA permit" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name={['accreditations', 'other']} label="Other Accreditations / Licenses">
        <Input.TextArea rows={2} placeholder="List any other accreditations or licenses" />
      </Form.Item>
    </Card>
  )
}

/**
 * Step 7: Oath + Review + Submit
 */
export function Step7ReviewSubmit({ form, formData, onSubmit, loading }) {
  return (
    <>
      <Card title="Oath of Undertaking" style={{ marginBottom: 24 }}>
        <Form.Item
          name="oathOfUndertaking"
          valuePropName="checked"
          rules={[{
            validator: (_, value) =>
              value ? Promise.resolve() : Promise.reject(new Error('You must accept the Oath of Undertaking'))
          }]}
        >
          <Checkbox>
            I hereby declare under oath that the information provided in this application is true, correct, and complete
            to the best of my knowledge and belief. I understand that any false statement or misrepresentation may result
            in the denial or revocation of my business permit and may subject me to criminal prosecution under applicable laws.
          </Checkbox>
        </Form.Item>
      </Card>

      <Card title="Declaration and Certification" style={{ marginBottom: 24 }}>
        <Form.Item
          name="certificationAccepted"
          valuePropName="checked"
          rules={[{
            validator: (_, value) =>
              value ? Promise.resolve() : Promise.reject(new Error('Certification is required'))
          }]}
        >
          <Checkbox>
            I certify that the information provided is true and correct.
          </Checkbox>
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="declarantName"
              label="Name of Declarant"
              rules={[{ required: true, message: 'Declarant name is required' }]}
            >
              <Input placeholder="Declarant name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="declarationDate"
              label="Date of Submission"
              rules={[{ required: true, message: 'Date is required' }]}
              getValueProps={(value) => ({ value: normalizeDate(value) })}
              getValueFromEvent={(date) => date}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button type="primary" size="large" onClick={onSubmit} loading={loading}>
          Submit Application
        </Button>
      </div>
    </>
  )
}

/**
 * Legacy default export — renders all steps in a single scrollable form.
 * Used when the wizard renders the form as a standalone component.
 */
const BusinessRegistrationForm = ({ form, initialValues }) => {
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
      <Step1ApplicationType form={form} />
      <div style={{ marginTop: 24 }} />
      <Step2TaxpayerInfo form={form} />
      <div style={{ marginTop: 24 }} />
      <Step3Addresses form={form} />
      <div style={{ marginTop: 24 }} />
      <Step4BusinessActivities form={form} />
      <div style={{ marginTop: 24 }} />
      <Step5Capital form={form} />
      <div style={{ marginTop: 24 }} />
      <Step6Accreditations form={form} />
    </>
  )
}

export default BusinessRegistrationForm
