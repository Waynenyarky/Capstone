import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Upload,
  List,
  Empty,
  Modal,
  Form,
  Input,
  App,
  Popconfirm,
  Tag,
} from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { uploadFormTemplate, removeFormDownload } from '../../services/formDefinitionService'
import dayjs from 'dayjs'

const { Text, Link } = Typography

const FILE_ICONS = {
  pdf: <FilePdfOutlined />,
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
}

export default function DownloadsManager({
  formDefinitionId,
  downloads = [],
  onChange,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false)
  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [labelForm] = Form.useForm()
  const { message } = App.useApp()

  const handleUpload = async (file, label) => {
    try {
      setUploading(true)
      const res = await uploadFormTemplate(formDefinitionId, file, label)
      message.success('File uploaded successfully')
      // The backend returns the updated definition, including downloads
      if (res.definition?.downloads) {
        onChange(res.definition.downloads)
      } else if (res.download) {
        onChange([...downloads, res.download])
      }
    } catch (err) {
      console.error('Failed to upload file:', err)
      message.error(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      setLabelModalOpen(false)
      setPendingFile(null)
    }
  }

  const handleBeforeUpload = (file) => {
    setPendingFile(file)
    labelForm.setFieldsValue({ label: file.name.replace(/\.[^/.]+$/, '') })
    setLabelModalOpen(true)
    return false // Prevent auto upload
  }

  const handleConfirmUpload = async () => {
    try {
      const values = await labelForm.validateFields()
      if (pendingFile) {
        await handleUpload(pendingFile, values.label)
      }
    } catch (err) {
      // Validation error
    }
  }

  const handleRemove = async (index) => {
    try {
      await removeFormDownload(formDefinitionId, index)
      message.success('File removed')
      const newDownloads = downloads.filter((_, i) => i !== index)
      onChange(newDownloads)
    } catch (err) {
      console.error('Failed to remove file:', err)
      message.error(err.message || 'Failed to remove file')
    }
  }

  const getFileIcon = (fileType) => {
    return FILE_ICONS[fileType?.toLowerCase()] || <FileOutlined />
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (downloads.length === 0 && disabled) {
    return <Empty description="No downloadable files" />
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!disabled && (
        <Upload
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.xls,.xlsx"
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            Upload Template File
          </Button>
        </Upload>
      )}

      {downloads.length === 0 ? (
        <Empty description="No downloadable files yet" />
      ) : (
        <List
          bordered
          dataSource={downloads}
          renderItem={(download, index) => (
            <List.Item
              actions={[
                <Link
                  key="download"
                  href={download.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="small" icon={<DownloadOutlined />}>
                    Download
                  </Button>
                </Link>,
                !disabled && (
                  <Popconfirm
                    key="delete"
                    title="Remove file"
                    description="This will remove the file from this form definition."
                    onConfirm={() => handleRemove(index)}
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <span style={{ fontSize: 24, color: '#1890ff' }}>
                    {getFileIcon(download.fileType)}
                  </span>
                }
                title={download.label}
                description={
                  <Space size={8}>
                    <Tag>{download.fileType?.toUpperCase() || 'FILE'}</Tag>
                    {download.fileSize > 0 && (
                      <Text type="secondary">{formatFileSize(download.fileSize)}</Text>
                    )}
                    {download.uploadedAt && (
                      <Text type="secondary">
                        Uploaded {dayjs(download.uploadedAt).format('MMM D, YYYY')}
                      </Text>
                    )}
                    {download.ipfsCid && (
                      <Tag color="purple">IPFS</Tag>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* Label Modal */}
      <Modal
        title="Upload File"
        open={labelModalOpen}
        onCancel={() => {
          setLabelModalOpen(false)
          setPendingFile(null)
        }}
        onOk={handleConfirmUpload}
        okText="Upload"
        confirmLoading={uploading}
      >
        <Form form={labelForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="label"
            label="Display Label"
            rules={[{ required: true, message: 'Label is required' }]}
            extra="This will be shown to users when downloading the file"
          >
            <Input placeholder="e.g., Application Form" />
          </Form.Item>
          {pendingFile && (
            <div style={{ color: '#666', fontSize: 12 }}>
              File: {pendingFile.name} ({formatFileSize(pendingFile.size)})
            </div>
          )}
        </Form>
      </Modal>
    </Space>
  )
}
