import { Typography, Upload } from 'antd'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'

const { Text } = Typography

export default function DocumentViewer({ url, label, onViewDocument, _token }) {
  if (!url || url.trim() === '') {
    return <Text type="secondary">Not uploaded</Text>
  }

  const resolvedUrl = resolveIpfsUrl(url)
  if (!resolvedUrl) {
    return <Text type="secondary">Not available</Text>
  }

  // Infer type from extension in resolved URL first, then original url (IPFS CIDs often have no extension in gateway URL)
  const urlPath = resolvedUrl.split('?')[0]
  const originalPath = (typeof url === 'string' ? url : '').split('?')[0]
  const isImage = urlPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || originalPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  const isPdf = urlPath.toLowerCase().includes('.pdf') || originalPath.toLowerCase().includes('.pdf')
  const docType = isImage ? 'image' : isPdf ? 'pdf' : 'other'

  const openModal = () => {
    if (onViewDocument) {
      onViewDocument({ url: resolvedUrl, label: label || 'Document', type: docType })
    } else {
      window.open(resolvedUrl, '_blank')
    }
  }

  const fileList = [{
    uid: '1',
    name: label || 'Document',
    url: resolvedUrl,
    status: 'done'
  }]

  return (
    <Upload
      listType="picture-card"
      fileList={fileList}
      onPreview={(_file) => openModal()}
      showUploadList={{ showRemoveIcon: false }}
    />
  )
}
