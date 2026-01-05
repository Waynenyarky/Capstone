import React from 'react'
import { Image, Spin } from 'antd'
import QRCode from 'qrcode'

export default function QrDisplay({ uri, dataUrl, size = 160, alt = 'QR Code' } = {}) {
  const [src, setSrc] = React.useState(dataUrl || '')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    const produce = async () => {
      if (dataUrl) {
        setSrc(dataUrl)
        return
      }
      if (!uri) return
      try {
        setLoading(true)
        const d = await QRCode.toDataURL(uri)
        if (!mounted) return
        setSrc(d)
      } catch (err) {
        console.error('Failed to generate QR data URL', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    produce()
    return () => { mounted = false }
  }, [uri, dataUrl])

  if (loading) return <Spin />
  if (!src) return null

  return <Image src={src} alt={alt} width={size} height={size} preview={false} />
}
