import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, Select, Table, Button, Modal, Form, Input, Upload, Space, Tag,
  Typography, Spin, Empty, Alert, Tabs, Checkbox, message, Grid
} from 'antd'
import { FileProtectOutlined, FileTextOutlined, PlusOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons'
import BusinessOwnerLayout from '../../../components/BusinessOwnerLayout.jsx'
import { get, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

const PERMIT_CATEGORIES = [
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

export default function GeneralPermitPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [loading, setLoading] = useState(true)
  const [permits, setPermits] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [adminRequirements, setAdminRequirements] = useState({})
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchPermits = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/business/general-permits')
      setPermits(res?.data || [])
    } catch (err) {
      notifyError(err, 'Failed to load permits')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => { fetchPermits() }, [fetchPermits])

  useEffect(() => {
    const fetchReqs = async () => {
      try {
        const res = await get('/api/admin/general-permit-config')
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setAdminRequirements(data)
        }
      } catch (err) {
        console.warn('Could not fetch permit requirements:', err?.message)
      }
    }
    fetchReqs()
  }, [])

  const selectedPermitCategory = Form.useWatch('permitCategory', form)

  const handleSubmit = useCallback(async (values) => {
    try {
      setSubmitting(true)
      await post('/api/business/general-permits', {
        permitCategory: values.permitCategory,
        requirements: values.requirements ? values.requirements.split('\n').filter(Boolean) : [],
        businessPlateNo: values.businessPlateNo || '',
      })
      success('General permit application submitted')
      setModalOpen(false)
      form.resetFields()
      fetchPermits()
    } catch (err) {
      notifyError(err, 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }, [form, success, notifyError, fetchPermits])

  const getStatusTag = (status) => {
    const map = {
      submitted: { color: 'processing', text: 'Submitted' },
      under_review: { color: 'warning', text: 'Under Review' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'error', text: 'Rejected' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    {
      title: 'Category',
      dataIndex: 'permitCategory',
      key: 'permitCategory',
      render: (v) => {
        const cat = PERMIT_CATEGORIES.find((c) => c.value === v)
        return cat?.label || v
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Issued',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
  ]

  return (
    <BusinessOwnerLayout pageTitle="General Permits" pageIcon={<FileProtectOutlined />}>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Apply for general permits (cooperative, peddler, bazaar vendor, etc.)
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchPermits} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true) }}>
              New Application
            </Button>
          </Space>
        </div>

        {isMobile ? (
          <>
            <Select
              value={activeTab}
              onChange={setActiveTab}
              style={{ width: '100%', marginBottom: 16 }}
              options={[
                { value: 'all', label: `All Applications (${permits.length})` },
                ...PERMIT_CATEGORIES.map((cat) => ({
                  value: cat.value,
                  label: `${cat.label} (${permits.filter((p) => p.permitCategory === cat.value).length})`,
                })),
              ]}
            />
            <Table
              dataSource={activeTab === 'all' ? permits : permits.filter((p) => p.permitCategory === activeTab)}
              columns={columns}
              rowKey={(r) => r._id || r.id}
              loading={loading}
              locale={{
                emptyText: (
                  <Empty
                    description={
                      activeTab === 'all'
                        ? 'No general permit applications yet'
                        : `No ${PERMIT_CATEGORIES.find((c) => c.value === activeTab)?.label || activeTab} applications`
                    }
                  />
                ),
              }}
              scroll={{ x: 'max-content' }}
            />
          </>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'all',
                label: `All Applications (${permits.length})`,
                children: (
                  <Table
                    dataSource={permits}
                    columns={columns}
                    rowKey={(r) => r._id || r.id}
                    loading={loading}
                    locale={{ emptyText: <Empty description="No general permit applications yet" /> }}
                    scroll={{ x: 'max-content' }}
                  />
                ),
              },
              ...PERMIT_CATEGORIES.map((cat) => {
                const filtered = permits.filter((p) => p.permitCategory === cat.value)
                return {
                  key: cat.value,
                  label: `${cat.label} (${filtered.length})`,
                  children: (
                    <Table
                      dataSource={filtered}
                      columns={columns}
                      rowKey={(r) => r._id || r.id}
                      loading={loading}
                      locale={{ emptyText: <Empty description={`No ${cat.label} applications`} /> }}
                      scroll={{ x: 'max-content' }}
                    />
                  ),
                }
              }),
            ]}
          />
        )}

        <Modal
          title="Apply for General Permit"
          open={modalOpen}
          onCancel={() => { setModalOpen(false); form.resetFields() }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="permitCategory" label="Permit Category" rules={[{ required: true, message: 'Select a category' }]}>
              <Select placeholder="Select permit type" options={PERMIT_CATEGORIES} />
            </Form.Item>
            <Form.Item name="businessPlateNo" label="Business Plate No. (if applicable)">
              <Input placeholder="e.g. BP-2024-00001" />
            </Form.Item>
            {selectedPermitCategory && adminRequirements[selectedPermitCategory]?.length > 0 && (
              <Form.Item label="Required Documents">
                <Alert
                  message="Please ensure you have the following documents ready"
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                />
                <Checkbox.Group
                  options={adminRequirements[selectedPermitCategory].map((req) => ({ label: req, value: req }))}
                  onChange={() => {}}
                />
              </Form.Item>
            )}
            <Form.Item name="requirements" label="Additional Notes">
              <TextArea rows={4} placeholder="Any additional notes or comments" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Submit Application
            </Button>
          </Form>
        </Modal>
      </div>
    </BusinessOwnerLayout>
  )
}
