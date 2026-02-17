import React from 'react'
import { Image } from 'antd'

export default function QrDisplay({ dataUrl, src, size = 300, alt = 'QR Code' } = {}) {
  const imageSrc = dataUrl || src
  
  if (!imageSrc) return null
  
  return (
    <div style={{ 
      display: 'inline-block',
      padding: 20, 
      background: '#FFFFFF', 
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
