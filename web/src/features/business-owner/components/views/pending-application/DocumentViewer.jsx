import { Typography, Button, Space, Image } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'

const { Text } = Typography

export default function DocumentViewer({ url, label }) {
  if (!url || url.trim() === '') {
    return <Text type="secondary">Not uploaded</Text>
  }

  const resolvedUrl = resolveIpfsUrl(url)
  if (!resolvedUrl) {
    return <Text type="secondary">Not available</Text>
  }

  // Infer type from extension
  const urlPath = resolvedUrl.split('?')[0]
  const originalPath = (typeof url === 'string' ? url : '').split('?')[0]
  const isImage = urlPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || originalPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)

  if (isImage) {
    return (
      <Space direction="vertical" size={4}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.open(resolvedUrl, '_blank')}
          onKeyDown={(e) => e.key === 'Enter' && window.open(resolvedUrl, '_blank')}
          style={{ cursor: 'pointer', display: 'inline-block' }}
        >
          <Image
            src={resolvedUrl}
            alt={label || 'Document'}
            width={120}
            height={120}
            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #d9d9d9' }}
            preview={false}
          />
        </div>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(resolvedUrl, '_blank')}>
          View document
        </Button>
      </Space>
    )
  }

  return (
    <Space>
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => window.open(resolvedUrl, '_blank')}>
        View document
      </Button>
      <Button type="link" size="small" icon={<DownloadOutlined />} href={resolvedUrl} download>
        Download
      </Button>
    </Space>
  )
}
