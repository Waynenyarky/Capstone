import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Button,
  Space,
  Typography,
  Tabs,
  Form,
  Input,
  Select,
  Tag,
  App,
  Spin,
  Divider,
  Alert,
  DatePicker,
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import {
  getFormDefinition,
  updateFormDefinition,
  submitForApproval,
  cancelApproval,
} from '../../services'
import { getActiveLGUs } from '../../services/lguService'
import { BUSINESS_TYPE_OPTIONS } from '@/constants/businessTypes'
import SectionEditor from '../components/SectionEditor'
import DownloadsManager from '../components/DownloadsManager'
import FormDefinitionPreview from '../components/FormDefinitionPreview'
import dayjs from 'dayjs'

import { FORM_TYPES } from './formDefinitions/constants'

const { Title, Text } = Typography

const STATUS_COLORS = {
  draft: 'default',
  pending_approval: 'processing',
  published: 'success',
  archived: 'warning',
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  published: 'Published',
  archived: 'Archived',
}

export default function AdminFormDefinitionEditor() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [definition, setDefinition] = useState(null)
  const [form] = Form.useForm()
  const [lgus, setLgus] = useState([])
  const [activeTab, setActiveTab] = useState('sections')

  const viewOnly = searchParams.get('view') === 'true' || definition?.status !== 'draft'

  const loadDefinition = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFormDefinition(id)
      setDefinition(res.definition)
      form.setFieldsValue({
        formType: res.definition.formType,
        version: res.definition.version,
        name: res.definition.name,
        description: res.definition.description,
        businessTypes: res.definition.businessTypes || [],
        lguCodes: res.definition.lguCodes || [],
        effectiveFrom: res.definition.effectiveFrom ? dayjs(res.definition.effectiveFrom) : null,
        effectiveTo: res.definition.effectiveTo ? dayjs(res.definition.effectiveTo) : null,
      })
    } catch (err) {
      console.error('Failed to load form definition:', err)
      message.error('Failed to load form definition')
      navigate('/admin/form-definitions')
    } finally {
      setLoading(false)
    }
  }, [id, form, message, navigate])

  const loadLGUs = useCallback(async () => {
    try {
      const res = await getActiveLGUs()
      setLgus(res.lgus || [])
    } catch (err) {
      console.error('Failed to load LGUs:', err)
    }
  }, [])

  useEffect(() => {
    loadDefinition()
    loadLGUs()
  }, [loadDefinition, loadLGUs])

  const handleSave = async () => {
    if (viewOnly) return

    try {
      setSaving(true)
      const values = await form.validateFields()
      
      const updateData = {
        version: values.version,
        description: values.description,
        businessTypes: values.businessTypes || [],
        lguCodes: values.lguCodes || [],
        sections: definition.sections,
        downloads: definition.downloads,
        effectiveFrom: values.effectiveFrom?.toISOString() || null,
        effectiveTo: values.effectiveTo?.toISOString() || null,
      }
      if (!definition.formGroupId) {
        updateData.name = values.name
      }

      const res = await updateFormDefinition(id, updateData)
      setDefinition(res.definition)
      message.success('Form definition saved')
    } catch (err) {
      if (err.errorFields) return
      console.error('Failed to save form definition:', err)
      message.error(err.message || 'Failed to save form definition')
    } finally {
      setSaving(false)
    }
  }

  const handleSectionsChange = (newSections) => {
    setDefinition((prev) => ({ ...prev, sections: newSections }))
  }

  const handleDownloadsChange = (newDownloads) => {
    setDefinition((prev) => ({ ...prev, downloads: newDownloads }))
  }

  const handleSubmitForApproval = async () => {
    try {
      // Save first
      await handleSave()
      await submitForApproval(id)
      message.success('Form definition submitted for approval')
      loadDefinition()
    } catch (err) {
      console.error('Failed to submit for approval:', err)
      message.error(err.message || 'Failed to submit for approval')
    }
  }

  const handleCancelApproval = async () => {
    try {
      await cancelApproval(id)
      message.success('Approval cancelled, returned to draft')
      loadDefinition()
    } catch (err) {
      console.error('Failed to cancel approval:', err)
      message.error(err.message || 'Failed to cancel approval')
    }
  }

  if (loading) {
    return (
      <AdminLayout showPageHeader={false}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <Spin size="large" />
        </div>
      </AdminLayout>
    )
  }

  if (!definition) {
    return null
  }

  const tabItems = [
    {
      key: 'sections',
      label: `Sections (${definition.sections?.length || 0})`,
      children: (
        <SectionEditor
          sections={definition.sections || []}
          onChange={handleSectionsChange}
          disabled={viewOnly}
        />
      ),
    },
    {
      key: 'downloads',
      label: `Downloads (${definition.downloads?.length || 0})`,
      children: (
        <DownloadsManager
          formDefinitionId={id}
          downloads={definition.downloads || []}
          onChange={handleDownloadsChange}
          disabled={viewOnly}
        />
      ),
    },
    {
      key: 'targeting',
      label: 'Targeting',
      children: (
        <Card>
            <Form form={form} layout="vertical">
            <Form.Item
              name="businessTypes"
              label="Business Types"
              extra={definition.formGroupId ? 'Derived from form group industry scope' : 'Leave empty to apply to all business types'}
            >
              <Select
                mode="multiple"
                placeholder="Select business types (or leave empty for all)"
                options={BUSINESS_TYPE_OPTIONS}
                disabled={viewOnly || !!definition.formGroupId}
              />
            </Form.Item>

            <Form.Item
              name="lguCodes"
              label="LGUs"
              extra="Leave empty to apply globally (all LGUs)"
            >
              <Select
                mode="multiple"
                placeholder="Select LGUs (or leave empty for all)"
                options={lgus.map((lgu) => ({ value: lgu.code, label: `${lgu.name} (${lgu.code})` }))}
                disabled={viewOnly}
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Divider />

            <Form.Item
              name="effectiveFrom"
              label="Effective From"
              extra="When this definition becomes active"
            >
              <DatePicker showTime style={{ width: '100%' }} disabled={viewOnly} />
            </Form.Item>

            <Form.Item
              name="effectiveTo"
              label="Effective To (optional)"
              extra="When this definition expires (leave empty for no expiration)"
            >
              <DatePicker showTime style={{ width: '100%' }} disabled={viewOnly} />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'preview',
      label: 'Preview',
      children: <FormDefinitionPreview definition={definition} />,
    },
  ]

  return (
    <AdminLayout showPageHeader={false}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Space direction="vertical" size={4}>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() =>
                    navigate(
                      definition.formGroupId
                        ? `/admin/form-definitions/group/${definition.formGroupId}`
                        : '/admin/form-definitions'
                    )
                  }
                >
                  Back
                </Button>
                <Title level={3} style={{ margin: 0 }}>
                  {definition.name || 'Form Definition'}
                </Title>
                <Tag color={STATUS_COLORS[definition.status]}>
                  {STATUS_LABELS[definition.status]}
                </Tag>
              </Space>
              <Text type="secondary">
                {FORM_TYPES.find((t) => t.value === definition.formType)?.label} - v{definition.version}
              </Text>
            </Space>

            <Space>
              {definition.status === 'draft' && (
                <>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    Save Draft
                  </Button>
                  {definition.sections?.length > 0 && (
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSubmitForApproval}
                    >
                      Submit for Approval
                    </Button>
                  )}
                </>
              )}
              {definition.status === 'pending_approval' && (
                <Button
                  icon={<StopOutlined />}
                  onClick={handleCancelApproval}
                  danger
                >
                  Cancel Approval
                </Button>
              )}
            </Space>
          </div>

          {/* Status alerts */}
          {definition.status === 'pending_approval' && (
            <Alert
              message="Pending Approval"
              description="This form definition is waiting for 2-admin approval before it can be published."
              type="info"
              showIcon
            />
          )}
          {definition.status === 'published' && (
            <Alert
              message="Published"
              description="This form definition is currently active and being used. Create a duplicate to make changes."
              type="success"
              showIcon
            />
          )}
          {definition.status === 'archived' && (
            <Alert
              message="Archived"
              description="This form definition is archived and no longer active."
              type="warning"
              showIcon
            />
          )}

          {/* Basic info form */}
          <Card title="Basic Information">
            <Form form={form} layout="vertical">
              <Space size="large" wrap style={{ width: '100%' }}>
                <Form.Item
                  name="formType"
                  label="Form Type"
                  style={{ minWidth: 200 }}
                >
                  <Select options={FORM_TYPES} disabled />
                </Form.Item>

                <Form.Item
                  name="version"
                  label="Version"
                  rules={[{ required: true, message: 'Version is required' }]}
                  style={{ minWidth: 120 }}
                >
                  <Input disabled />
                </Form.Item>

                {!definition.formGroupId && (
                  <Form.Item name="name" label="Name" style={{ minWidth: 300 }}>
                    <Input placeholder="e.g., Business Registration Requirements" disabled={viewOnly} />
                  </Form.Item>
                )}
              </Space>

              <Form.Item name="description" label="Description">
                <Input.TextArea
                  placeholder="Internal notes about this definition"
                  rows={2}
                  disabled={viewOnly}
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Content tabs */}
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
      </Space>
    </AdminLayout>
  )
}
