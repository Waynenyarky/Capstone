import { Modal, Button, Image, Typography, Space } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { theme } from 'antd'

const { Text } = Typography

export default function DocumentModal({ documentModal, onClose }) {
  const { token } = theme.useToken()

  return (
    <Modal
      title={documentModal.label}
      open={documentModal.open}
      onCancel={onClose}
      width={documentModal.type === 'image' ? 560 : 720}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="openTab"
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => documentModal.url && window.open(documentModal.url, '_blank')}
        >
          Open in new tab
        </Button>,
        ...(documentModal.type === 'pdf' && documentModal.url
          ? [
              <Button
                key="download"
                icon={<DownloadOutlined />}
                href={documentModal.url}
                download
              >
                Download
              </Button>
            ]
          : [])
      ]}
    >
      {documentModal.open && documentModal.url && (
        <div style={{ minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'stretch', overflow: 'auto', flexDirection: 'column', width: '100%' }}>
          {documentModal.type === 'image' && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Image
                src={documentModal.url}
                alt={documentModal.label}
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  display: 'block',
                }}
                preview={{
                  mask: (
                    <Space direction="vertical" size={4}>
                      <EyeOutlined style={{ fontSize: 16 }} />
                      <Text style={{ fontSize: 12, color: '#fff' }}>Zoom</Text>
                    </Space>
                  ),
                }}
              />
            </div>
          )}
          {documentModal.type === 'pdf' && (
            <iframe
              title={documentModal.label}
              src={documentModal.url}
              style={{ width: '100%', height: '70vh', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
            />
          )}
          {documentModal.type === 'other' && (
            <>
              <iframe
                title={documentModal.label}
                src={documentModal.url}
                style={{
                  width: '100%',
                  height: '70vh',
                  minHeight: 320,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadius,
                }}
              />
              <Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                If the document does not appear above, use &quot;Open in new tab&quot; to view it.
              </Text>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
