import React, { useState, useEffect, useCallback } from 'react'
import { Table, Card, Button, Modal, Form, Input, Switch, DatePicker, Select, Space, Typography, Tag, Popconfirm, message, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, NotificationOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { get, post, put, del } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/admin/announcements')
      setAnnouncements(res?.data || [])
    } catch {
      message.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const handleSubmit = async (values) => {
    try {
      setSaving(true)
      const payload = {
        title: values.title,
        body: values.body,
        priority: values.priority || 'normal',
        isActive: values.isActive !== false,
        expiresAt: values.expiresAt?.toISOString() || null,
      }
      if (editing) {
        await put(`/api/admin/announcements/${editing._id}`, payload)
        message.success('Announcement updated')
      } else {
        await post('/api/admin/announcements', payload)
        message.success('Announcement created')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      fetchAnnouncements()
    } catch (err) {
      message.error(err?.message || 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await del(`/api/admin/announcements/${id}`)
      message.success('Announcement deleted')
      fetchAnnouncements()
    } catch {
      message.error('Failed to delete announcement')
    }
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, priority: 'normal' })
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      title: record.title,
      body: record.body,
      priority: record.priority || 'normal',
      isActive: record.isActive !== false,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
    })
    setModalOpen(true)
  }

  const priorityColors = { high: 'red', normal: 'blue', low: 'default' }

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (v) => <Tag color={priorityColors[v] || 'default'}>{(v || 'normal').toUpperCase()}</Tag>,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v) => <Tag color={v !== false ? 'green' : 'default'}>{v !== false ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 140,
      render: (v) => v ? dayjs(v).format('MMM D, YYYY') : 'Never',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v) => v ? dayjs(v).format('MMM D, YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this announcement?"
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AdminLayout pageTitle="Announcements">
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Card
          title={
            <Space>
              <NotificationOutlined />
              <Title level={4} style={{ margin: 0 }}>Announcements</Title>
            </Space>
          }
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Create Announcement
            </Button>
          }
        >
          <Table
            rowKey="_id"
            dataSource={announcements}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No announcements yet" /> }}
          />
        </Card>

        <Modal
          title={editing ? 'Edit Announcement' : 'Create Announcement'}
          open={modalOpen}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
              <Input placeholder="Announcement title" />
            </Form.Item>
            <Form.Item name="body" label="Content" rules={[{ required: true, message: 'Content is required' }]}>
              <TextArea rows={4} placeholder="Announcement content" />
            </Form.Item>
            <Space style={{ width: '100%' }} size="middle">
              <Form.Item name="priority" label="Priority">
                <Select style={{ width: 140 }} options={[
                  { value: 'high', label: 'High' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                ]} />
              </Form.Item>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="expiresAt" label="Expires At">
                <DatePicker />
              </Form.Item>
            </Space>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => { setModalOpen(false); setEditing(null) }}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  )
}
