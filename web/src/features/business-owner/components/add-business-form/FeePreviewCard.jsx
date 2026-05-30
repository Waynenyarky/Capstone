import { useState, useEffect } from 'react'
import { Card, Descriptions, Alert } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { DollarOutlined } from '@ant-design/icons'
import { getFeePreview } from '../../services/feeService'

function FeePreviewCard({ lob }) {
  const [feeData, setFeeData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lob) { setFeeData(null); return }
    setLoading(true)
    getFeePreview(lob)
      .then(res => setFeeData(res?.data || res))
      .catch(() => setFeeData(null))
      .finally(() => setLoading(false))
  }, [lob])

  if (!lob) return null
  if (loading) return <Card size="small" style={{ marginBottom: 16 }}><LottieSpinner size="small" /> Loading fee estimate...</Card>
  if (!feeData?.feeConfig) return null

  const cfg = feeData.feeConfig
  const fmt = (v) => v != null ? `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'

  return (
    <Card size="small" title={<><DollarOutlined /> Fee Estimate</>} style={{ marginBottom: 16 }}>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Line of Business">{cfg.lineOfBusiness || lob}</Descriptions.Item>
        {cfg.mayorPermitFee != null && <Descriptions.Item label="Mayor's Permit Fee">{fmt(cfg.mayorPermitFee)}</Descriptions.Item>}
        {cfg.businessTax != null && <Descriptions.Item label="Business Tax">{fmt(cfg.businessTax)}</Descriptions.Item>}
        {cfg.sanitaryFee != null && <Descriptions.Item label="Sanitary Fee">{fmt(cfg.sanitaryFee)}</Descriptions.Item>}
        {cfg.fireSafetyFee != null && <Descriptions.Item label="Fire Safety Fee">{fmt(cfg.fireSafetyFee)}</Descriptions.Item>}
        {cfg.environmentalFee != null && <Descriptions.Item label="Environmental Fee">{fmt(cfg.environmentalFee)}</Descriptions.Item>}
      </Descriptions>
      <Alert type="info" message="This is an estimate. Final fees will be calculated during processing." showIcon style={{ marginTop: 8 }} />
    </Card>
  )
}

export default FeePreviewCard
