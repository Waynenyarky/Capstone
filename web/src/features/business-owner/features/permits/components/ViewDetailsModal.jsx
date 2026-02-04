import React from 'react'
import { Modal, Descriptions, Typography, Tag, Spin, Alert } from 'antd'
import { getRegistrationStatusTagDisplay, getRenewalStatusTag, getPaymentStatusTag, formatDate } from '../constants/statusConfig.jsx'

const { Text } = Typography

export default function ViewDetailsModal({
  open,
  onClose,
  modalType,
  modalData,
  loading,
  token
}) {
  return (
    <Modal
      title={modalType === 'registration' ? 'Business Registration Details' : 'Business Renewal Details'}
      open={open}
      onCancel={onClose}
      footer={[{ key: 'close', children: 'Close', onClick: onClose }]}
      width={800}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : modalData ? (
        <Descriptions column={1} bordered>
          {modalType === 'registration' ? (
            <>
              <Descriptions.Item label="Business Name">
                <Text strong>{modalData.businessName}</Text>
                {modalData.isPrimary && <Tag color="blue" style={{ marginLeft: 8 }}>Primary</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Business ID">
                <Text copyable style={{ fontFamily: 'monospace' }}>{modalData.businessId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Reference Number">
                {modalData.referenceNumber && modalData.referenceNumber !== 'N/A' ? (
                  <Text copyable strong style={{ color: token.colorPrimary }}>{modalData.referenceNumber}</Text>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Date">{formatDate(modalData.registrationDate)}</Descriptions.Item>
              <Descriptions.Item label="Status">{getRegistrationStatusTagDisplay(modalData.status)}</Descriptions.Item>
              {modalData.businessDetails && (
                <>
                  <Descriptions.Item label="Business Type">{modalData.businessDetails.businessType || 'N/A'}</Descriptions.Item>
                  <Descriptions.Item label="DTI/SEC registration status">{modalData.businessDetails.registrationStatus || 'N/A'}</Descriptions.Item>
                </>
              )}
            </>
          ) : (
            <>
              <Descriptions.Item label="Business Name">
                <Text strong>{modalData.businessName}</Text>
                {modalData.isPrimary && <Tag color="blue" style={{ marginLeft: 8 }}>Primary</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Business ID">
                <Text copyable style={{ fontFamily: 'monospace' }}>{modalData.businessId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Renewal ID">
                <Text copyable style={{ fontFamily: 'monospace' }}>{modalData.renewalId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Reference Number">
                {modalData.referenceNumber && modalData.referenceNumber !== 'N/A' ? (
                  <Text copyable strong style={{ color: token.colorPrimary }}>{modalData.referenceNumber}</Text>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Renewal Year">{modalData.renewalYear || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Renewal Status">{getRenewalStatusTag(modalData.renewalStatus)}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">{getPaymentStatusTag(modalData.paymentStatus)}</Descriptions.Item>
              <Descriptions.Item label="Submitted Date">{formatDate(modalData.submittedAt)}</Descriptions.Item>
              {modalData.grossReceiptsDeclared && (
                <Descriptions.Item label="Gross Receipts Declared"><Text>Yes</Text></Descriptions.Item>
              )}
              {modalData.assessment && (
                <Descriptions.Item label="Assessment Total">
                  <Text strong>₱{modalData.assessment.total?.toLocaleString() || '0'}</Text>
                </Descriptions.Item>
              )}
            </>
          )}
        </Descriptions>
      ) : (
        <Alert message="No data available" type="warning" />
      )}
    </Modal>
  )
}
