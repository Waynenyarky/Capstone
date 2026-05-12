import React, { useState } from 'react'
import { Button, Upload, Modal, message, Space, Typography, Card } from 'antd'
import { UploadOutlined, FileOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { uploadPermitFormFile } from '@/features/admin/services/permitFormsService'
import { resolveIpfsUrl, formatFileSize } from '../utils'

const { Text } = Typography

export default function FileUploadButton({ value, onChange, token }) {
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      message.error('Only PDF files are allowed')
      return false
    }

    try {
      setUploading(true)
      const result = await uploadPermitFormFile(file)
      onChange({
        cid: result.cid,
        fileName: result.fileName,
        size: result.size,
      })
      message.success('File uploaded successfully')
    } catch (err) {
      console.error('Upload failed:', err)
      message.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleRemove = () => {
    onChange({ cid: '', fileName: '', size: 0 })
  }

  const hasFile = value?.cid && value.cid.length > 0

  return (
    <div>
      {hasFile ? (
        <Card
          size="small"
          style={{
            borderColor: token.colorBorderSecondary,
            background: token.colorBgContainer,
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <FileOutlined style={{ color: token.colorPrimary }} />
              <Text>{value.fileName}</Text>
              <Text type="secondary">({formatFileSize(value.size)})</Text>
            </Space>
            <Space>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemove}
              >
                Remove
              </Button>
            </Space>
          </Space>
        </Card>
      ) : (
        <Upload
          accept=".pdf"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={uploading}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </Upload>
      )}

      <Modal
        title={value?.fileName || 'PDF Preview'}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        destroyOnClose
      >
        {hasFile && (
          <iframe
            src={resolveIpfsUrl(value.cid)}
            title={value.fileName}
            style={{ width: '100%', height: '70vh', border: 'none' }}
          />
        )}
      </Modal>
    </div>
  )
}
