import { useEffect, useState, useCallback } from 'react'
import {
  Layout,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  App,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import { getLGUs, createLGU, updateLGU, deleteLGU } from '../../services'

const { Title, Text } = Typography

// Philippine regions for dropdown
const REGIONS = [
  'NCR',
  'CAR',
  'Region I',
  'Region II',
  'Region III',
  'Region IV-A',
  'Region IV-B',
  'Region V',
  'Region VI',
  'Region VII',
  'Region VIII',
  'Region IX',
  'Region X',
  'Region XI',
  'Region XII',
  'Region XIII',
  'BARMM',
]

export default function AdminLGUs() {
  const [lgus, setLgus] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [filters, setFilters] = useState({ search: '', region: '', type: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLgu, setEditingLgu] = useState(null)
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()

  const loadLGUs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getLGUs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      })
      setLgus(res.lgus || [])
      if (res.pagination) {
        setPagination((prev) => ({ ...prev, total: res.pagination.total }))
      }
    } catch (err) {
      console.error('Failed to load LGUs:', err)
      message.error('Failed to load LGUs')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit, message])

  useEffect(() => {
    loadLGUs()
  }, [loadLGUs])

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleTableChange = (paginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    }))
  }

  const openCreateModal = () => {
    setEditingLgu(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (lgu) => {
    setEditingLgu(lgu)
    form.setFieldsValue({
      code: lgu.code,
      name: lgu.name,
      region: lgu.region,
      province: lgu.province || '',
      type: lgu.type,
      isActive: lgu.isActive,
    })
    setModalOpen(true)
  }

  const handleDelete = async (code) => {
    try {
      await deleteLGU(code)
      message.success('LGU deleted successfully')
      loadLGUs()
    } catch (err) {
      console.error('Failed to delete LGU:', err)
      message.error(err.message || 'Failed to delete LGU')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingLgu) {
        // Update existing
        const { code, ...updateData } = values
        await updateLGU(editingLgu.code, updateData)
        message.success('LGU updated successfully')
      } else {
        // Create new
        await createLGU(values)
        message.success('LGU created successfully')
      }
      setModalOpen(false)
      loadLGUs()
    } catch (err) {
      if (err.errorFields) return // validation error
      console.error('Failed to save LGU:', err)
      message.error(err.message || 'Failed to save LGU')
    }
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code) => <Text code>{code}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
      width: 120,
    },
    {
      title: 'Province',
      dataIndex: 'province',
      key: 'province',
      width: 150,
      render: (province) => province || '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'city' ? 'blue' : 'green'}>
          {type === 'city' ? 'City' : 'Municipality'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Delete LGU"
            description="Are you sure you want to delete this LGU?"
            onConfirm={() => handleDelete(record.code)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout.Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              LGU Configuration
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Add LGU
            </Button>
          </div>

          <Card>
            <Space style={{ marginBottom: 16 }} wrap>
              <Input.Search
                placeholder="Search by code or name"
                allowClear
                onSearch={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="Filter by region"
                allowClear
                style={{ width: 150 }}
                value={filters.region || undefined}
                onChange={(v) => handleFilterChange('region', v || '')}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
              <Select
                placeholder="Filter by type"
                allowClear
                style={{ width: 150 }}
                value={filters.type || undefined}
                onChange={(v) => handleFilterChange('type', v || '')}
                options={[
                  { value: 'city', label: 'City' },
                  { value: 'municipality', label: 'Municipality' },
                ]}
              />
              <Button icon={<ReloadOutlined />} onClick={loadLGUs}>
                Refresh
              </Button>
            </Space>

            <Table
              rowKey="code"
              dataSource={lgus}
              columns={columns}
              loading={loading}
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} LGUs`,
              }}
              onChange={handleTableChange}
            />
          </Card>
        </Space>

        <Modal
          title={editingLgu ? 'Edit LGU' : 'Add LGU'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmit}
          okText={editingLgu ? 'Update' : 'Create'}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="code"
              label="Code"
              rules={[
                { required: true, message: 'Code is required' },
                { pattern: /^[A-Za-z0-9-]+$/, message: 'Code must be alphanumeric with hyphens only' },
              ]}
              extra="Unique identifier (e.g., CEBU-CITY, MAKATI)"
            >
              <Input
                placeholder="e.g., CEBU-CITY"
                disabled={!!editingLgu}
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input placeholder="e.g., Cebu City" />
            </Form.Item>

            <Form.Item
              name="region"
              label="Region"
              rules={[{ required: true, message: 'Region is required' }]}
            >
              <Select
                placeholder="Select region"
                showSearch
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
            </Form.Item>

            <Form.Item name="province" label="Province (optional)">
              <Input placeholder="e.g., Cebu" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Type is required' }]}
            >
              <Select
                placeholder="Select type"
                options={[
                  { value: 'city', label: 'City' },
                  { value: 'municipality', label: 'Municipality' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Status"
              initialValue={true}
            >
              <Select
                options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Content>
    </Layout>
  )
}
