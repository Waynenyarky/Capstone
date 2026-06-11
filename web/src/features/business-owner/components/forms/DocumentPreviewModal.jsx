import { Modal, Button, Typography, theme } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function DocumentPreviewModal({ open, onClose, url, label, type, isBlob }) {
  const { token } = theme.useToken()
  return (
    <Modal
      title={label}
      open={open}
      onCancel={onClose}
      width={type === 'image' ? 560 : 720}
      footer={[
        <Button
          key="openTab"
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => url && window.open(url, '_blank')}
        >
          Open in new tab
        </Button>,
        ...(url && !isBlob
          ? [
              <Button key="download" icon={<DownloadOutlined />} href={url} download>
                Download
              </Button>
            ]
          : []),
      ]}
    >
      {open && url && (
        <div style={{ minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'stretch', overflow: 'auto', flexDirection: 'column', width: '100%' }}>
          {type === 'image' && (
            <img
              src={url}
              alt={label}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            />
          )}
          {type === 'pdf' && !isBlob && (
            <iframe
              title={label}
              src={url}
              style={{ width: '100%', height: '70vh', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
            />
          )}
          {type === 'pdf' && isBlob && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Text style={{ display: 'block', marginBottom: 12 }}>
                This local PDF cannot be embedded. Use &quot;Open in new tab&quot; to view it.
              </Text>
              <Button type="primary" icon={<EyeOutlined />} onClick={() => url && window.open(url, '_blank')}>
                Open PDF in new tab
              </Button>
            </div>
          )}
          {type === 'other' && !isBlob && (
            <>
              <iframe
                title={label}
                src={url}
                style={{ width: '100%', height: '70vh', minHeight: 320, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
              />
              <Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                If the document does not appear above, use &quot;Open in new tab&quot; to view it.
              </Text>
            </>
          )}
          {type === 'other' && isBlob && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Text style={{ display: 'block', marginBottom: 12 }}>
                This local file cannot be embedded in the preview modal because your Content Security Policy blocks `blob:` URLs in frames.
              </Text>
              <Button type="primary" icon={<EyeOutlined />} onClick={() => url && window.open(url, '_blank')}>
                Open file in new tab
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
