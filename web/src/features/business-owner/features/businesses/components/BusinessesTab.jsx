import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Empty, App, theme, Checkbox, Row } from 'antd'
import { PlusOutlined, FormOutlined, SyncOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  getBusinesses,
  addBusiness,
  updateBusinessStatus
} from '@/features/business-owner/services/businessProfileService'
import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes'
import PhilippineAddressFields from '@/shared/components/PhilippineAddressFields'

function getPermitStatusLabel(business) {
  const status = business.applicationStatus || 'draft'
  const regNum = business.businessRegistrationNumber || ''
  const isMinimal = regNum.startsWith('PENDING-')
  if (isMinimal && status === 'draft') return 'No permit'
  const map = {
    draft: 'Draft',
    requirements_viewed: 'In progress',
    form_completed: 'In progress',
    documents_uploaded: 'In progress',
    bir_registered: 'In progress',
    agencies_registered: 'In progress',
    submitted: 'Submitted',
    resubmit: 'Resubmit',
    under_review: 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
    needs_revision: 'Needs revision'
  }
  return map[status] || status
}

function getBusinessStatusLabel(business) {
  const s = business.businessStatus || 'active'
  const map = { active: 'Active', inactive: 'Inactive', closed: 'Closed' }
  return map[s] || s
}

export default function BusinessesTab({ onSwitchTab }) {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [addStep, setAddStep] = useState('form')
  const [addedBusinessId, setAddedBusinessId] = useState(null)
  const [addHadExistingPermit, setAddHadExistingPermit] = useState(false)
  const [form] = Form.useForm()

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBusinesses()
      setBusinesses(res?.businesses || [])
    } catch (err) {
      message.error(err?.message || 'Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  const buildLocation = (values) => {
    const street = values.streetAddress?.trim()
    const province = values.provinceName || values.province
    const city = values.cityName || values.city
    const barangay = values.barangayName || values.barangay
    const zipCode = values.postalCode?.trim()
    if (!street && !province && !city && !barangay && !zipCode) return undefined
    return {
      street: street || '',
      province: province || '',
      city: city || '',
      municipality: city || '',
      barangay: barangay || '',
      zipCode: zipCode || ''
    }
  }

  const handleAddBusiness = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const payload = {
        businessName: values.businessName?.trim() || undefined
      }
      if (values.businessType && String(values.businessType).trim()) {
        payload.businessType = values.businessType.trim()
      }
      const location = buildLocation(values)
      if (location) payload.location = location
      if (values.contactNumber != null && String(values.contactNumber).trim()) {
        payload.contactNumber = values.contactNumber.trim()
      }
      payload.businessStatus = values.businessStatus === 'inactive' || values.businessStatus === 'closed' ? values.businessStatus : 'active'
      const hasExistingPermit = !!values.hasExistingPermit
      if (hasExistingPermit) {
        payload.hasExistingPermit = true
        if (values.applicationReferenceNumber && String(values.applicationReferenceNumber).trim()) {
          payload.applicationReferenceNumber = values.applicationReferenceNumber.trim()
        }
      }
      const result = await addBusiness(payload)
      const businessId = result?.businessId ?? (result?.businesses && result.businesses.length
        ? result.businesses[result.businesses.length - 1]?.businessId
        : null)
      setAddedBusinessId(businessId)
      setAddHadExistingPermit(hasExistingPermit)
      setAddStep('success')
      await fetchBusinesses()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.message || 'Failed to add business')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplyForPermit = (businessId) => {
    navigate(`/owner/business-registration?businessId=${businessId}`)
  }

  const handleRenew = (businessId) => {
    navigate(`/owner/business-renewal?businessId=${businessId}`)
  }

  const handleStatusChange = async (businessId, businessStatus) => {
    try {
      await updateBusinessStatus(businessId, { businessStatus })
      message.success('Business status updated')
      await fetchBusinesses()
    } catch (err) {
      message.error(err?.message || 'Failed to update status')
    }
  }

  const columns = [
    {
      title: 'Business name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (name) => name || '—'
    },
    {
      title: 'Type',
      dataIndex: 'businessType',
      key: 'businessType',
      render: (v) => (v ? BUSINESS_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v : '—')
    },
    {
      title: 'Permit status',
      key: 'permitStatus',
      render: (_, record) => getPermitStatusLabel(record)
    },
    {
      title: 'Business status',
      key: 'businessStatus',
      render: (_, record) => getBusinessStatusLabel(record)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const permitStatus = record.applicationStatus || 'draft'
        const regNum = record.businessRegistrationNumber || ''
        const isNoPermitOrDraft = regNum.startsWith('PENDING-') && permitStatus === 'draft' || ['draft', 'requirements_viewed', 'form_completed', 'documents_uploaded', 'bir_registered', 'agencies_registered'].includes(permitStatus)
        const canRenew = ['approved'].includes(permitStatus)
        const status = record.businessStatus || 'active'

        return (
          <Space wrap>
            {isNoPermitOrDraft && (
              <Button type="link" size="small" icon={<FormOutlined />} onClick={() => handleApplyForPermit(record.businessId)}>
                Apply for permit
              </Button>
            )}
            {canRenew && (
              <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => handleRenew(record.businessId)}>
                Renew
              </Button>
            )}
            {status === 'active' && (
              <>
                <Button type="link" size="small" onClick={() => handleStatusChange(record.businessId, 'inactive')}>
                  Mark inactive
                </Button>
                <Button type="link" size="small" danger onClick={() => handleStatusChange(record.businessId, 'closed')}>
                  Mark closed
                </Button>
              </>
            )}
            {(status === 'inactive' || status === 'closed') && (
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange(record.businessId, 'active')}>
                Mark active
              </Button>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setAddStep('form')
            setAddedBusinessId(null)
            setAddHadExistingPermit(false)
            setAddModalOpen(true)
          }}
        >
          Add business
        </Button>
      </div>

      {businesses.length === 0 && !loading ? (
        <Empty
          description="Add your first business"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setAddStep('form')
              setAddedBusinessId(null)
              setAddHadExistingPermit(false)
              setAddModalOpen(true)
            }}
          >
            Add business
          </Button>
        </Empty>
      ) : (
        <Table
          rowKey="businessId"
          columns={columns}
          dataSource={businesses}
          loading={loading}
          pagination={false}
        />
      )}

      <Modal
        title={addStep === 'success' ? 'Business added' : 'Add business'}
        open={addModalOpen}
        onCancel={() => {
          setAddStep('form')
          setAddedBusinessId(null)
          setAddHadExistingPermit(false)
          form.resetFields()
          setAddModalOpen(false)
        }}
        onOk={addStep === 'form' ? handleAddBusiness : undefined}
        okButtonProps={addStep === 'form' ? { loading: submitting } : undefined}
        footer={addStep === 'success' ? null : undefined}
        destroyOnClose
      >
        {addStep === 'success' ? (
          <>
            <p>Business added.</p>
            {addHadExistingPermit && (
              <p style={{ marginTop: 8 }}>
                Your existing permit claim has been submitted for LGU verification. You will be notified once approved.
              </p>
            )}
            <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button
                onClick={async () => {
                  setAddStep('form')
                  setAddedBusinessId(null)
                  setAddHadExistingPermit(false)
                  form.resetFields()
                  setAddModalOpen(false)
                  await fetchBusinesses()
                }}
              >
                Done
              </Button>
              {!addHadExistingPermit && addedBusinessId && (
                <Button
                  type="primary"
                  onClick={async () => {
                    setAddStep('form')
                    setAddedBusinessId(null)
                    setAddHadExistingPermit(false)
                    form.resetFields()
                    setAddModalOpen(false)
                    await fetchBusinesses()
                    navigate(`/owner/business-registration?businessId=${addedBusinessId}`)
                  }}
                >
                  Continue to apply for permit
                </Button>
              )}
            </div>
          </>
        ) : (
          <Form form={form} layout="vertical" initialValues={{ hasExistingPermit: false, businessStatus: 'active' }}>
            <Form.Item
              name="businessName"
              label="Business name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Enter business name" />
            </Form.Item>
            <Form.Item name="businessType" label="Business type">
              <Select
                placeholder="Select type (optional)"
                allowClear
                options={BUSINESS_TYPE_OPTIONS}
              />
            </Form.Item>
            <Row gutter={16}>
              <PhilippineAddressFields form={form} required={false} />
            </Row>
            <Form.Item name="contactNumber" label="Business contact number">
              <Input placeholder="e.g. 09XX XXX XXXX" />
            </Form.Item>
            <Form.Item name="businessStatus" label="Status" initialValue="active">
              <Select
                placeholder="Is this business currently operating?"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </Form.Item>
            <Form.Item name="hasExistingPermit" valuePropName="checked">
              <Checkbox>This business already has an active LGU permit</Checkbox>
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.hasExistingPermit !== curr.hasExistingPermit}
            >
              {({ getFieldValue }) =>
                getFieldValue('hasExistingPermit') ? (
                  <Form.Item
                    name="applicationReferenceNumber"
                    label="Permit / Reference number"
                    help="Optional. Enter the reference number from your existing permit if you have it."
                  >
                    <Input placeholder="e.g. BPLO-2024-001234" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}
