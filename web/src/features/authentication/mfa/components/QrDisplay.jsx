import { Image, theme } from 'antd'

export default function QrDisplay({ dataUrl, src, size = 300, alt = 'QR Code' } = {}) {
  const { token } = theme.useToken()
  const imageSrc = dataUrl || src

  if (!imageSrc) return null

  return (
    <div style={{
      display: 'inline-block',
      padding: 20,
      background: token.colorBgContainer,
      borderRadius: 12,
      boxShadow: token.boxShadowSecondary,
    }}>
      <Image 
        src={imageSrc} 
        alt={alt} 
        width={size} 
        height={size} 
        preview={false}
        style={{
          display: 'block',
        }}
      />
    </div>
  )
}
