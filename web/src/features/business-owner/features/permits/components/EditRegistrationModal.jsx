import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Card, Tabs, Button, Space, Alert, Upload, Divider, Checkbox, Spin } from 'antd'
import { UserOutlined, ShopOutlined, EnvironmentOutlined, UploadOutlined, BankOutlined, SafetyOutlined, PlusOutlined } from '@ant-design/icons'
import { getRegistrationStatusTagDisplay } from '../constants/statusConfig.jsx'
import { LGU_DOCUMENT_FIELDS, BIR_DOCUMENT_FIELDS } from '../constants/documentFields'
import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes'
import { getActiveFormDefinition } from '@/features/admin/services/formDefinitionService'
import { deriveDocumentFieldsFromDefinition } from '@/features/business-owner/utils/formDefinitionUtils'

const { Option } = Select

export default function EditRegistrationModal({
  open,
  onCancel,
  modalData,
  selectedRecord,
  loading,
  form,
  lguDocumentFields: lguDocumentFieldsProp = LGU_DOCUMENT_FIELDS,
  birDocumentFields = BIR_DOCUMENT_FIELDS,
  normFile,
  customUploadRequest,
  hasEmployeesValue,
  onResubmit,
  onSave
}) {
  const [definitionDocumentFields, setDefinitionDocumentFields] = useState(null)

  const businessType = selectedRecord?.businessType ?? modalData?.businessDetails?.businessType

  useEffect(() => {
    if (!open || !businessType) {
      setDefinitionDocumentFields(null)
      return
    }
    let cancelled = false
    async function fetchDefinition() {
      try {
        const res = await getActiveFormDefinition('registration', businessType, undefined)
        if (cancelled) return
        if (res?.definition && !res.deactivated) {
          setDefinitionDocumentFields(deriveDocumentFieldsFromDefinition(res.definition))
        } else {
          setDefinitionDocumentFields(null)
        }
      } catch {
        if (!cancelled) setDefinitionDocumentFields(null)
      }
    }
    fetchDefinition()
    return () => { cancelled = true }
  }, [open, businessType])

  const lguDocumentFields = (definitionDocumentFields?.length > 0)
    ? definitionDocumentFields.map((f) => ({ key: f.key, label: f.label, listType: 'picture-card' }))
    : lguDocumentFieldsProp

  return (
    <Modal
      title="Edit & Resubmit Business Registration"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', padding: '8px 0' }}>
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                key: 'owner',
                label: <span><UserOutlined />Owner Identity</span>,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Form.Item label="Owner Full Name" name="ownerFullName">
                      <Input placeholder="Enter owner full name" />
                    </Form.Item>
                    <Form.Item label="Owner TIN" name="ownerTin">
                      <Input placeholder="Enter TIN" />
                    </Form.Item>
                    <Form.Item label="Government ID Type" name="governmentIdType">
                      <Select placeholder="Select ID type">
                        <Option value="Driver's License">Driver's License</Option>
                        <Option value="Passport">Passport</Option>
                        <Option value="National ID">National ID</Option>
                        <Option value="SSS ID">SSS ID</Option>
                        <Option value="PhilHealth ID">PhilHealth ID</Option>
                        <Option value="Voter's ID">Voter's ID</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Government ID Number" name="governmentIdNumber">
                      <Input placeholder="Enter ID number" />
                    </Form.Item>
                  </Card>
                )
              },
              {
                key: 'business',
                label: <span><ShopOutlined />Business Details</span>,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Form.Item label="Registered Business Name" name="registeredBusinessName" rules={[{ required: true, message: 'Business name is required' }]}>
                      <Input placeholder="Enter registered business name" />
                    </Form.Item>
                    <Form.Item label="Business Trade Name" name="businessTradeName">
                      <Input placeholder="Enter trade name" />
                    </Form.Item>
                    <Form.Item label="Business Registration Type" name="businessRegistrationType">
                      <Select placeholder="Select registration type">
                        <Option value="sole_proprietorship">Sole Proprietorship</Option>
                        <Option value="partnership">Partnership</Option>
                        <Option value="corporation">Corporation</Option>
                        <Option value="cooperative">Cooperative</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Business Registration Number (DTI/SEC/CDA)" name="businessRegistrationNumber">
                      <Input placeholder="Enter DTI/SEC/CDA registration number" />
                    </Form.Item>
                    <Form.Item label="Primary Line of Business" name="primaryLineOfBusiness">
                      <Input placeholder="Enter primary line of business" />
                    </Form.Item>
                    <Form.Item label="Business Type" name="businessType">
                      <Select placeholder="Select business type" options={BUSINESS_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item label="Business Classification" name="businessClassification">
                      <Input placeholder="Enter business classification" />
                    </Form.Item>
                    <Form.Item label="Business ID">
                      <Input value={modalData?.businessId} disabled />
                    </Form.Item>
                    <Form.Item label="Reference Number">
                      <Input value={modalData?.referenceNumber || 'N/A'} disabled />
                    </Form.Item>
                    <Form.Item label="Status">
                      {getRegistrationStatusTagDisplay(modalData?.status)}
                    </Form.Item>
                    <Form.Item label="Primary Business" name="isPrimary" valuePropName="checked">
                      <Checkbox>Mark as Primary Business</Checkbox>
                    </Form.Item>
                  </Card>
                )
              },
              {
                key: 'location',
                label: <span><EnvironmentOutlined />Location</span>,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Form.Item label="Street Address" name="street">
                      <Input placeholder="Enter street address" />
                    </Form.Item>
                    <Form.Item label="Barangay" name="barangay">
                      <Input placeholder="Enter barangay" />
                    </Form.Item>
                    <Form.Item label="City" name="city">
                      <Input placeholder="Enter city" />
                    </Form.Item>
                    <Form.Item label="Province" name="province">
                      <Input placeholder="Enter province" />
                    </Form.Item>
                    <Form.Item label="Postal Code" name="postalCode">
                      <Input placeholder="Enter postal code" />
                    </Form.Item>
                  </Card>
                )
              },
              {
                key: 'lguDocuments',
                label: <span><UploadOutlined />LGU Documents</span>,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    {lguDocumentFields.map((field) => (
                      <Form.Item key={field.key} label={field.label} name={field.key} valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload listType={field.listType || 'picture'} accept="image/*,.pdf" maxCount={1} customRequest={(opts) => customUploadRequest(opts, field.key)}>
                          {field.listType === 'picture-card' ? (<div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>) : (<Button icon={<UploadOutlined />}>Upload</Button>)}
                        </Upload>
                      </Form.Item>
                    ))}
                  </Card>
                )
              },
              {
                key: 'bir',
                label: <span><BankOutlined />BIR Registration</span>,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Form.Item label="BIR Registration Number" name="birRegistrationNumber">
                      <Input placeholder="Enter BIR registration number" />
                    </Form.Item>
                    {birDocumentFields.map((field) => (
                      <Form.Item key={field.key} label={field.label} name={field.key} valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload listType="picture" accept="image/*,.pdf" maxCount={1} customRequest={(opts) => customUploadRequest(opts, field.key)}>
                          <Button icon={<UploadOutlined />}>Upload</Button>
                        </Upload>
                      </Form.Item>
                    ))}
                    <Alert message="BIR Documents" description="Upload updated BIR documents here before saving or resubmitting." type="info" showIcon style={{ marginTop: 16 }} />
                  </Card>
                )
              },
              {
                key: 'agencies',
                label: <span><SafetyOutlined />Other Agencies</span>,
                children: (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Form.Item label="Has Employees" name="hasEmployees" valuePropName="checked">
                      <Checkbox>This business has employees</Checkbox>
                    </Form.Item>
                    {hasEmployeesValue && (
                      <>
                        <Form.Item label="SSS Registered" name="sssRegistered" valuePropName="checked">
                          <Checkbox>SSS Registration completed</Checkbox>
                        </Form.Item>
                        <Form.Item label="SSS Proof" name="sssProofUrl" valuePropName="fileList" getValueFromEvent={normFile}>
                          <Upload listType="picture" accept="image/*,.pdf" maxCount={1} customRequest={(opts) => customUploadRequest(opts, 'sssProofUrl')}><Button icon={<UploadOutlined />}>Upload</Button></Upload>
                        </Form.Item>
                        <Form.Item label="PhilHealth Registered" name="philhealthRegistered" valuePropName="checked">
                          <Checkbox>PhilHealth Registration completed</Checkbox>
                        </Form.Item>
                        <Form.Item label="PhilHealth Proof" name="philhealthProofUrl" valuePropName="fileList" getValueFromEvent={normFile}>
                          <Upload listType="picture" accept="image/*,.pdf" maxCount={1} customRequest={(opts) => customUploadRequest(opts, 'philhealthProofUrl')}><Button icon={<UploadOutlined />}>Upload</Button></Upload>
                        </Form.Item>
                        <Form.Item label="Pag-IBIG Registered" name="pagibigRegistered" valuePropName="checked">
                          <Checkbox>Pag-IBIG Registration completed</Checkbox>
                        </Form.Item>
                        <Form.Item label="Pag-IBIG Proof" name="pagibigProofUrl" valuePropName="fileList" getValueFromEvent={normFile}>
                          <Upload listType="picture" accept="image/*,.pdf" maxCount={1} customRequest={(opts) => customUploadRequest(opts, 'pagibigProofUrl')}><Button icon={<UploadOutlined />}>Upload</Button></Upload>
                        </Form.Item>
                      </>
                    )}
                  </Card>
                )
              }
            ]}
          />
          <Divider />
          {(selectedRecord?.status === 'rejected' || selectedRecord?.status === 'needs_revision') && (
            <Alert message="Resubmission Notice" description="Clicking 'Resubmit' will update your application status to Resubmit and clear review comments." type="info" showIcon style={{ marginBottom: 16 }} />
          )}
          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={onCancel}>Cancel</Button>
            {(selectedRecord?.status === 'rejected' || selectedRecord?.status === 'needs_revision') && (
              <Button type="primary" onClick={onResubmit} loading={loading}>Resubmit</Button>
            )}
            {selectedRecord?.status === 'draft' && (
              <Button type="primary" onClick={onSave} loading={loading}>Save Changes</Button>
            )}
          </Space>
        </Form>
      </div>
    </Modal>
  )
}
