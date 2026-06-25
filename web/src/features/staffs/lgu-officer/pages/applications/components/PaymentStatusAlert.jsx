import { Alert, Button, Typography } from 'antd'

const { Text } = Typography

export default function PaymentStatusAlert({ paymentGenStatus, onRetry, retryingPayments, formatDate }) {
  if (!paymentGenStatus) return null

  return (
    <Alert
      type={paymentGenStatus.paymentsGenerated ? 'success' : 'warning'}
      showIcon
      message={paymentGenStatus.paymentsGenerated ? 'Payments Generated' : 'Payment Generation Pending'}
      description={
        <div>
          {paymentGenStatus.paymentsGenerated ? (
            <div>
              <Text>Generated {paymentGenStatus.paymentGenerationMetadata?.paymentCount || 0} payment(s) on {formatDate(paymentGenStatus.paymentsGeneratedAt || paymentGenStatus.lastPaymentGenerationAttempt)}</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Total: ₱{(paymentGenStatus.paymentGenerationMetadata?.totalAmount || 0).toLocaleString()}</Text>
              </div>
            </div>
          ) : (
            <div>
              <Text>Payment generation failed or incomplete</Text>
              {paymentGenStatus.paymentGenerationErrors?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger" style={{ fontSize: 12 }}>{paymentGenStatus.paymentGenerationErrors.join(', ')}</Text>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={onRetry}
                  loading={retryingPayments}
                >
                  Retry Payment Generation
                </Button>
              </div>
            </div>
          )}
        </div>
      }
      style={{ marginBottom: 16 }}
    />
  )
}
