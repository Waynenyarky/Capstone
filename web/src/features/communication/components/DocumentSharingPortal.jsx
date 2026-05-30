import { useState, useEffect } from 'react'
import { 
  Card, Table, Button, Upload, Modal, Form, Select, Input, 
  Space, Typography, Tag, Progress, Tooltip, 
  message, Popconfirm, Drawer, Descriptions, Badge
} from 'antd'
import { 
  UploadOutlined, DownloadOutlined, EyeOutlined, 
  DeleteOutlined, ShareAltOutlined, LockOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input

function DocumentSharingPortal() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadModal, setUploadModal] = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form] = Form.useForm()
  const [shareForm] = Form.useForm()
  const [detailDrawer, setDetailDrawer] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockDocuments = [
        {
          id: '1',
          name: 'Business Permit Application.pdf',
          type: 'application/pdf',
          size: 2048576,
          uploadedBy: 'Juan Dela Cruz',
          uploadedAt: '2024-01-15 09:30:00',
          category: 'Business Permit',
          status: 'active',
          permissions: {
            view: ['lgu_officers', 'business_owner'],
            download: ['lgu_officers'],
            share: ['lgu_officers']
          },
          expiresAt: '2024-06-15 23:59:59',
          downloadCount: 15,
          sharedWith: ['Maria Santos', 'Roberto Tan'],
          version: '1.2',
          tags: ['permit', 'application', '2024']
        },
        {
          id: '2',
          name: 'Financial Statements 2023.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 3145728,
          uploadedBy: 'Maria Santos',
          uploadedAt: '2024-01-14 14:20:00',
          category: 'Financial',
          status: 'active',
          permissions: {
            view: ['accounting_department', 'management'],
            download: ['accounting_department'],
            share: ['management']
          },
          expiresAt: '2024-12-31 23:59:59',
          downloadCount: 8,
          sharedWith: ['Accounting Team'],
          version: '1.0',
          tags: ['financial', '2023', 'statements']
        },
        {
          id: '3',
          name: 'Inspection Report.jpg',
          type: 'image/jpeg',
          size: 1048576,
          uploadedBy: 'Carlos Reyes',
          uploadedAt: '2024-01-13 11:45:00',
          category: 'Inspection',
          status: 'expired',
          permissions: {
            view: ['lgu_officers', 'business_owner'],
            download: ['lgu_officers'],
            share: ['lgu_officers']
          },
          expiresAt: '2024-01-20 23:59:59',
          downloadCount: 3,
          sharedWith: ['Juan Dela Cruz'],
          version: '1.0',
          tags: ['inspection', 'report', '2024']
        }
      ]
      
      setDocuments(mockDocuments)
    } catch (error) {
      message.error('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (values) => {
    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const newDocument = {
        id: Date.now().toString(),
        name: values.file.file.name,
        type: values.file.file.type,
        size: values.file.file.size,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
        category: values.category,
        status: 'active',
        permissions: {
          view: values.permissions?.view || [],
          download: values.permissions?.download || [],
          share: values.permissions?.share || []
        },
        expiresAt: values.expiresAt,
        downloadCount: 0,
        sharedWith: [],
        version: '1.0',
        tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || []
      }
      
      setDocuments(prev => [newDocument, ...prev])
      setUploadModal(false)
      form.resetFields()
      message.success('Document uploaded successfully')
    } catch (error) {
      message.error('Failed to upload document')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleShare = async (values) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const updatedDocuments = documents.map(doc => 
        doc.id === selectedDocument.id
          ? {
              ...doc,
              sharedWith: [...doc.sharedWith, ...values.recipients],
              permissions: {
                ...doc.permissions,
                view: [...new Set([...doc.permissions.view, ...values.recipients])],
                download: values.allowDownload ? [...new Set([...doc.permissions.download, ...values.recipients])] : doc.permissions.download,
                share: values.allowShare ? [...new Set([...doc.permissions.share, ...values.recipients])] : doc.permissions.share
              }
            }
          : doc
      )
      
      setDocuments(updatedDocuments)
      setShareModal(false)
      shareForm.resetFields()
      message.success('Document shared successfully')
    } catch (error) {
      message.error('Failed to share document')
    }
  }

  const handleDelete = async (documentId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      message.success('Document deleted successfully')
    } catch (error) {
      message.error('Failed to delete document')
    }
  }

  const handleDownload = async (document) => {
    try {
      // Simulate download
      message.success(`Downloading ${document.name}...`)
      
      const updatedDocuments = documents.map(doc => 
        doc.id === document.id
          ? { ...doc, downloadCount: doc.downloadCount + 1 }
          : doc
      )
      setDocuments(updatedDocuments)
    } catch (error) {
      message.error('Failed to download document')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge status="success" text="Active" />
      case 'expired':
        return <Badge status="error" text="Expired" />
      case 'archived':
        return <Badge status="default" text="Archived" />
      default:
        return <Badge status="default" text={status} />
    }
  }

  const isExpired = (expiresAt) => {
    return dayjs(expiresAt).isBefore(dayjs())
  }

  const columns = [
    {
      title: 'Document',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <FileTextOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatFileSize(record.size)} • v{record.version}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          {getStatusBadge(status)}
          {record.expiresAt && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Expires: {dayjs(record.expiresAt).format('MMM D, YYYY')}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Shared With',
      dataIndex: 'sharedWith',
      key: 'sharedWith',
      render: (sharedWith) => (
        <div>
          {sharedWith.length > 0 ? (
            <Tooltip title={sharedWith.join(', ')}>
              <Tag color="green">{sharedWith.length} users</Tag>
            </Tooltip>
          ) : (
            <Tag color="default">Not shared</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Downloads',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedDocument(record)
                setDetailDrawer(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button 
              type="text" 
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={isExpired(record.expiresAt)}
            />
          </Tooltip>
          <Tooltip title="Share">
            <Button 
              type="text" 
              icon={<ShareAltOutlined />}
              onClick={() => {
                setSelectedDocument(record)
                setShareModal(true)
              }}
              disabled={isExpired(record.expiresAt)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this document?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Document Sharing Portal</Title>
          <Text type="secondary">Secure document exchange with access control</Text>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => setUploadModal(true)}
          >
            Upload Document
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} documents`
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Document"
        open={uploadModal}
        onCancel={() => setUploadModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="file"
            label="Document"
            rules={[{ required: true, message: 'Please select a file to upload' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              <Option value="Business Permit">Business Permit</Option>
              <Option value="Financial">Financial</Option>
              <Option value="Inspection">Inspection</Option>
              <Option value="Legal">Legal</Option>
              <Option value="Administrative">Administrative</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label="Expiration Date"
            rules={[{ required: true, message: 'Please set an expiration date' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
            help="Separate multiple tags with commas"
          >
            <Input placeholder="e.g., permit, 2024, important" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Default Permissions"
          >
            <Select mode="multiple" placeholder="Select permissions">
              <Option value="lgu_officers">LGU Officers</Option>
              <Option value="business_owner">Business Owners</Option>
              <Option value="accounting_department">Accounting Department</Option>
              <Option value="management">Management</Option>
            </Select>
          </Form.Item>

          {uploading && (
            <div style={{ marginBottom: 16 }}>
              <Text>Uploading document...</Text>
              <Progress percent={uploadProgress} size="small" />
            </div>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Upload
              </Button>
              <Button onClick={() => setUploadModal(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Share Modal */}
      <Modal
        title="Share Document"
        open={shareModal}
        onCancel={() => setShareModal(false)}
        onOk={() => shareForm.submit()}
        okText="Share"
      >
        <Form form={shareForm} onFinish={handleShare} layout="vertical">
          <Form.Item
            name="recipients"
            label="Recipients"
            rules={[{ required: true, message: 'Please select recipients' }]}
          >
            <Select mode="multiple" placeholder="Select users to share with">
              <Option value="Juan Dela Cruz">Juan Dela Cruz</Option>
              <Option value="Maria Santos">Maria Santos</Option>
              <Option value="Carlos Reyes">Carlos Reyes</Option>
              <Option value="Roberto Tan">Roberto Tan</Option>
              <Option value="Accounting Team">Accounting Team</Option>
            </Select>
          </Form.Item>

          <Form.Item name="allowDownload" valuePropName="checked">
            <input type="checkbox" /> Allow recipients to download
          </Form.Item>

          <Form.Item name="allowShare" valuePropName="checked">
            <input type="checkbox" /> Allow recipients to share further
          </Form.Item>

          <Form.Item name="message" label="Message (optional)">
            <TextArea rows={3} placeholder="Add a message for the recipients..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Details Drawer */}
      <Drawer
        title="Document Details"
        placement="right"
        size="large"
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {selectedDocument && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Document Name">
                {selectedDocument.name}
              </Descriptions.Item>
              <Descriptions.Item label="File Size">
                {formatFileSize(selectedDocument.size)}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color="blue">{selectedDocument.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Version">
                {selectedDocument.version}
              </Descriptions.Item>
              <Descriptions.Item label="Uploaded By">
                {selectedDocument.uploadedBy}
              </Descriptions.Item>
              <Descriptions.Item label="Uploaded At">
                {dayjs(selectedDocument.uploadedAt).format('MMMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Expires At">
                {dayjs(selectedDocument.expiresAt).format('MMMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusBadge(selectedDocument.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Download Count">
                {selectedDocument.downloadCount}
              </Descriptions.Item>
              <Descriptions.Item label="Tags">
                <Space wrap>
                  {selectedDocument.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={5}>Permissions</Title>
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div><LockOutlined /> View: {selectedDocument.permissions.view.join(', ') || 'None'}</div>
                  <div><LockOutlined /> Download: {selectedDocument.permissions.download.join(', ') || 'None'}</div>
                  <div><LockOutlined /> Share: {selectedDocument.permissions.share.join(', ') || 'None'}</div>
                </Space>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <Title level={5}>Shared With</Title>
              <div>
                {selectedDocument.sharedWith.length > 0 ? (
                  <Space wrap>
                    {selectedDocument.sharedWith.map((user, index) => (
                      <Tag key={index} color="green">{user}</Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">Not shared with anyone</Text>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default DocumentSharingPortal
