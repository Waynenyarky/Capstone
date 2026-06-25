import { Modal, Typography, Button, Space, Divider, List, theme } from 'antd'
import { CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { useToken } = theme

export default function PaymentReceiptModal({
  visible,
  onClose,
  receiptId,
  receiptNumber,
  transactionDate,
  transactionName,
  fees = [],
  totalAmount,
  applicationReferenceNumber,
  buttonText = 'Download Receipt and Continue',
}) {
  const { token } = useToken()
  // Use backend receipt number if available, otherwise fall back to frontend-generated receipt ID
  const displayReceiptId = receiptNumber || receiptId

  const handleDownload = () => {
    // Create a simple text receipt for download
    const receiptText = `
PAYMENT RECEIPT
================
Receipt ID: ${displayReceiptId}
Transaction Date: ${transactionDate}
Transaction: ${transactionName}
Application Reference: ${applicationReferenceNumber}

FEE BREAKDOWN
${fees.map(fee => `${fee.label}: ₱${fee.amount.toFixed(2)}`).join('\n')}

TOTAL: ₱${totalAmount.toFixed(2)}

This is a mock payment receipt for testing purposes.
    `.trim()

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${displayReceiptId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    // Close modal after download
    onClose()
  }

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <span>Payment Successful</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            {buttonText}
          </Button>
        </Space>
      }
      width={520}
    >
      <div style={{ padding: '16px 0' }}>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14 }}>Receipt Details</Text>
        </div>

        <List
          size="small"
          bordered
          dataSource={[
            { label: 'Receipt ID', value: displayReceiptId },
            { label: 'Transaction Date', value: transactionDate },
            { label: 'Application Reference', value: applicationReferenceNumber },
          ]}
          renderItem={(item) => (
            <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{item.label}</Text>
              <Text strong>{item.value}</Text>
            </List.Item>
          )}
        />

        <Divider />

        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 14 }}>Fee Breakdown</Text>
        </div>

        <List
          size="small"
          bordered
          dataSource={fees || []}
          renderItem={(item) => (
            <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{item.label}</Text>
              <Text strong>₱{(item.amount || 0).toFixed(2)}</Text>
            </List.Item>
          )}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Total Amount Paid</Text>
              <Text strong style={{ color: token.colorPrimary, fontSize: 16 }}>
                ₱{(totalAmount || 0).toFixed(2)}
              </Text>
            </div>
          }
        />
      </div>
    </Modal>
  )
}
