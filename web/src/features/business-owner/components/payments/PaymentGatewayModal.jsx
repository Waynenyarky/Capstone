import React, { useState } from 'react';
import {
  Modal,
  Button,
  Typography,
  message,
  Spin,
} from 'antd';
import { CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { post } from '@/lib/http.js';

const { Title, Text } = Typography;

/**
 * Simplified PaymentGatewayModal
 * Skips payment gateway — clicking "Pay Now" immediately marks payment as paid.
 * For demo/testing purposes.
 */
const PaymentGatewayModal = ({ visible, onCancel, onSuccess, amount, description, businessId, reference, paymentIds }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayNow = async () => {
    setLoading(true);
    try {
      // If we have specific payment IDs, mark each as paid
      const ids = paymentIds || (reference ? [reference] : []);
      
      if (ids.length > 0) {
        for (const paymentId of ids) {
          await post(`/api/business/payments/${paymentId}/pay`, {
            paymentMethod: 'demo_auto',
            transactionId: `DEMO-${Date.now()}`,
            referenceNumber: `REF-${Date.now()}`
          });
        }
      }
      
      setSuccess(true);
      message.success('Payment processed successfully!');
      onSuccess?.({ success: true, amount, paymentIds: ids });
    } catch (error) {
      console.error('Payment failed:', error);
      message.error('Payment failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    onCancel();
  };

  return (
    <Modal
      title="Make a Payment"
      open={visible}
      onCancel={handleClose}
      width={400}
      footer={null}
      destroyOnHidden
    >
      {!success ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <DollarOutlined style={{ fontSize: 48, color: '#52C41A', marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8 }}>
            Confirm Payment
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            {description || 'Payment'}
          </Text>
          <Title level={2} style={{ margin: '16px 0', color: '#52C41A' }}>
            ₱{amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 12 }}>
            Demo Mode: Payment will be marked as paid immediately
          </Text>
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handlePayNow}
            style={{ height: 48 }}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
          <Button
            style={{ marginTop: 12 }}
            block
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52C41A' }} />
          <Title level={3} style={{ marginTop: 24, color: '#52C41A' }}>
            Payment Successful!
          </Title>
          <Text style={{ display: 'block', marginTop: 16 }}>
            Your payment of ₱{amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })} has been processed.
          </Text>
          <Button
            type="primary"
            onClick={handleClose}
            style={{ marginTop: 24 }}
          >
            Done
          </Button>
        </div>
      )}
      
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(255,255,255,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Spin size="large" tip="Processing payment..." />
        </div>
      )}
    </Modal>
  );
};

export default PaymentGatewayModal;
