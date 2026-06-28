import { Modal, Typography, List, Spin } from 'antd'

const { Text } = Typography

export default function ApplicationFeeBreakdownModal({ open, onCancel, feeData, loadingFees, token }) {
  return (
    <Modal
      title="Application Fee Breakdown"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      {loadingFees ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : feeData?.success ? (
        <div style={{ padding: 16 }}>
          <List
            size="small"
            bordered
            dataSource={feeData.fees || []}
            renderItem={(item) => (
              <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{item.label}</Text>
                <Text strong>₱{(item.amount || 0).toFixed(2)}</Text>
              </List.Item>
            )}
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Total Amount Due</Text>
                <Text strong style={{ color: token.colorPrimary, fontSize: 16 }}>₱{(feeData.total || 0).toFixed(2)}</Text>
              </div>
            }
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            * Payment will be processed after submission
          </Text>
        </div>
      ) : (
        <Text type="secondary">Unable to load fee details</Text>
      )}
    </Modal>
  )
}
