/**
 * VerifyPermitPage
 * Public page for verifying business permits via QR code scan
 * Displays permit details and validity status without requiring authentication
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Card, Typography, Descriptions, Tag, Result, Space, Divider, 
  Alert, theme 
} from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { 
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ShopOutlined, CalendarOutlined, EnvironmentOutlined
} from '@ant-design/icons'
import { get } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

export default function VerifyPermitPage() {
  const { permitNumber } = useParams()
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [permit, setPermit] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!permitNumber) {
      setError('No permit number provided')
      setLoading(false)
      return
    }

    const fetchPermit = async () => {
      try {
        setLoading(true)
        const response = await get(`/api/business/permits/verify/${permitNumber}`)
        if (response?.permit) {
          setPermit(response.permit)
        } else if (response?.data?.permit) {
          setPermit(response.data.permit)
        } else if (response?.data) {
          setPermit(response.data)
        } else {
          setPermit(response)
        }
      } catch (err) {
        console.error('Permit verification failed:', err)
        setError(err?.message || 'Failed to verify permit')
      } finally {
        setLoading(false)
      }
    }

    fetchPermit()
  }, [permitNumber])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: token.colorFillAlter
      }}>
        <LottieSpinner size="large" tip="Verifying permit..." />
      </div>
    )
  }

  if (error || !permit) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: token.colorFillAlter,
        padding: 24
      }}>
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Result
            status="error"
            title="Permit Not Found"
            subTitle={error || `No permit found with number: ${permitNumber}`}
            extra={
              <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                If you believe this is an error, please contact the City Business Permits and Licensing Office (CBPLO).
              </Paragraph>
            }
          />
        </Card>
      </div>
    )
  }

  const isValid = permit.status === 'active' && 
    permit.expiryDate && 
    dayjs(permit.expiryDate).isAfter(dayjs())

  const isExpired = permit.expiryDate && dayjs(permit.expiryDate).isBefore(dayjs())

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: token.colorFillAlter,
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <SafetyCertificateOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
            Business Permit Verification
          </Title>
          <Text type="secondary">City Business Permits and Licensing Office</Text>
        </div>

        {/* Validity Status */}
        <Card style={{ marginBottom: 16 }}>
          {isValid ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Valid Permit"
              description="This business permit is valid and in good standing."
            />
          ) : isExpired ? (
            <Alert
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              message="Expired Permit"
              description={`This permit expired on ${dayjs(permit.expiryDate).format('MMMM D, YYYY')}.`}
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Invalid Permit"
              description="This permit is not currently active. Please verify with the CBPLO."
            />
          )}
        </Card>

        {/* Permit Details */}
        <Card title={
          <Space>
            <SafetyCertificateOutlined />
            <span>Permit Details</span>
          </Space>
        }>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Permit Number">
              <Text strong copyable>{permit.permitNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={isValid ? 'success' : isExpired ? 'error' : 'warning'}>
                {isExpired ? 'Expired' : (permit.status || 'Unknown')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Permit Type">
              {permit.permitType === 'initial' ? 'Initial Permit' : 'Renewal'}
            </Descriptions.Item>
            <Descriptions.Item label="Issue Date">
              <Space>
                <CalendarOutlined />
                {permit.issuedDate ? dayjs(permit.issuedDate).format('MMMM D, YYYY') : 'N/A'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Expiry Date">
              <Space>
                <CalendarOutlined />
                {permit.expiryDate ? dayjs(permit.expiryDate).format('MMMM D, YYYY') : 'N/A'}
              </Space>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions column={1} bordered size="small" title={
            <Space>
              <ShopOutlined />
              <span>Business Information</span>
            </Space>
          }>
            <Descriptions.Item label="Business Name">
              <Text strong>{permit.businessName || 'N/A'}</Text>
            </Descriptions.Item>
            {permit.businessAddress && (
              <Descriptions.Item label="Address">
                <Space>
                  <EnvironmentOutlined />
                  {permit.businessAddress}
                </Space>
              </Descriptions.Item>
            )}
            {permit.lineOfBusiness && (
              <Descriptions.Item label="Line of Business">
                {permit.lineOfBusiness}
              </Descriptions.Item>
            )}
            {permit.ownerName && (
              <Descriptions.Item label="Owner">
                {permit.ownerName}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            This verification was performed on {dayjs().format('MMMM D, YYYY [at] h:mm A')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            For inquiries, contact the CBPLO or visit the municipal hall.
          </Text>
        </div>
      </div>
    </div>
  )
}
