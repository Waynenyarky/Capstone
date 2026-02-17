import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Spin, Alert, Empty, Space, Popconfirm, message, Typography } from 'antd'
import { DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout.jsx'
import { get, post, put, del } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness.js'

const { Text } = Typography

export default function AdminFeeConfiguration() {
  const [loading, setLoading] = useState(true)
  const [configs, setConfigs] = useState([])
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const { success, error: notifyError } = useNotifier()

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await get('/api/business/admin/fee-configuration')
      setConfigs(res?.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load fee configurations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  const handleSave = useCallback(async (values) => {
    try {
      setSaving(true)
      const payload = {
        lineOfBusiness: values.lineOfBusiness,
        mayorsPermitFee: values.mayorsPermitFee,
        businessTaxCategory: values.businessTaxCategory || '',
        brackets: values.brackets || [],
      }
      if (editingId) {
        await put(`/api/business/admin/fee-configuration/${editingId}`, payload)
      } else {
        await post('/api/business/admin/fee-configuration', payload)
      }
      success('Fee configuration saved')
      setModalOpen(false)
      form.resetFields()
      setEditingId(null)
      fetchConfigs()
    } catch (err) {
      notifyError(err, 'Failed to save fee configuration')
    } finally {
      setSaving(false)
    }
  }, [editingId, form, success, notifyError, fetchConfigs])

  const handleEdit = useCallback((record) => {
    setEditingId(record._id)
    form.setFieldsValue({
      lineOfBusiness: record.lineOfBusiness,
      mayorsPermitFee: record.mayorsPermitFee,
      businessTaxCategory: record.businessTaxCategory,
      brackets: record.brackets || [],
    })
    setModalOpen(true)
  }, [form])

  const handleDelete = useCallback(async (id) => {
    try {
      await del(`/api/business/admin/fee-configuration/${id}`)
      success('Fee configuration deleted')
      fetchConfigs()
    } catch (err) {
      notifyError(err, 'Failed to delete')
    }
  }, [success, notifyError, fetchConfigs])

  const columns = [
    { title: 'Line of Business', dataIndex: 'lineOfBusiness', key: 'lineOfBusiness' },
    {
      title: "Mayor's Permit Fee",
      dataIndex: 'mayorsPermitFee',
      key: 'mayorsPermitFee',
      render: (v) => v != null ? `₱${Number(v).toLocaleString()}` : '-',
    },
    {
      title: 'Tax Brackets',
      dataIndex: 'brackets',
      key: 'brackets',
      render: (brackets) => brackets?.length ? `${brackets.length} bracket(s)` : 'None',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this configuration?" onConfirm={() => handleDelete(record._id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const headerActions = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true) }}>
      Add Line of Business
    </Button>
  )

  if (loading) {
    return (
      <AdminLayout pageTitle="Fee Configuration" pageIcon={<DollarOutlined />}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin tip="Loading fee configurations..." />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="Fee Configuration" pageIcon={<DollarOutlined />} headerActions={headerActions}>
      <div style={{ padding: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Configure the mayor's permit fee and business tax brackets per line of business.
        </Text>

        {error ? (
          <Alert type="error" message={error} action={<Button onClick={fetchConfigs}>Retry</Button>} />
        ) : (
          <Table
            aria-label="Fee configurations"
            dataSource={configs}
            columns={columns}
            rowKey={(r) => r._id || r.id}
            locale={{ emptyText: <Empty description="No fee configuration. Add your first line of business." /> }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>

      <Modal
        title={editingId ? 'Edit Fee Configuration' : 'Add Fee Configuration'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingId(null) }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="lineOfBusiness" label="Line of Business" rules={[{ required: true, message: 'Required' }]}>
            <Select
              showSearch
              allowClear
              placeholder="Select line of business"
              optionFilterProp="label"
              options={[
                ...LINE_OF_BUSINESS.map((lob) => ({
                  value: lob.lineOfBusiness,
                  label: `${lob.taxCode} — ${lob.label}`,
                })),
                { value: '__custom__', label: 'Custom' },
              ]}
            />
          </Form.Item>
          <Form.Item name="mayorsPermitFee" label="Mayor's Permit Fee (₱)" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 500" />
          </Form.Item>
          <Form.Item name="businessTaxCategory" label="Business Tax Category">
            <Input placeholder="e.g. Section 143(a)" />
          </Form.Item>

          <Text strong style={{ display: 'block', marginBottom: 8 }}>Tax Brackets</Text>
          <Form.List name="brackets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'min']} rules={[{ required: true, message: 'Min' }]}>
                      <InputNumber placeholder="Min" min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'max']} rules={[{ required: true, message: 'Max' }]}>
                      <InputNumber placeholder="Max" min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'rate']} rules={[{ required: true, message: 'Rate' }]}>
                      <InputNumber placeholder="Rate %" min={0} max={100} step={0.001} style={{ width: 120 }} />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>Remove</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Bracket
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={saving} block>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  )
}
