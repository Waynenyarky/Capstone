import { useState, useCallback, useEffect, useMemo } from 'react'
import { Typography, Table, Empty, Tag } from 'antd'
import { getPayments } from '../../../services/paymentsService'
import { formatDate, formatCurrency } from '../../../utils/formatters.js'

const { Text } = Typography

export default function PaymentsTab({ businessId, _onPaymentComplete }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    getPayments({ businessId })
      .then(data => setPayments(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const displayPayments = useMemo(() => {
    const nonPending = []
    const pendingBySignature = new Map()

    for (const p of payments) {
      const isPending = p?.status === 'pending' && !p?.paidAt
      if (!isPending) {
        nonPending.push(p)
        continue
      }

      const sig = [
        p?.businessId || '',
        p?.paymentType || '',
        p?.relatedEntityType || '',
        p?.relatedEntityId || '',
        p?.description || '',
        Number(p?.amount || 0),
      ].join('|')

      const existing = pendingBySignature.get(sig)
      if (!existing) {
        pendingBySignature.set(sig, p)
      }
    }

    return [...nonPending, ...Array.from(pendingBySignature.values())]
  }, [payments])

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: v => formatDate(v), width: 120 },
    { title: 'Description', dataIndex: 'description', key: 'desc', render: (v, r) => v || r.paymentType || 'Payment' },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', width: 150,
      render: (v, r) => (
        <div>
          <div>{formatCurrency(v)}</div>
          {r.isOverdue && r.penaltyAmount > 0 && (
            <Text type="danger" style={{ fontSize: 11 }}>
              +{formatCurrency(r.penaltyAmount)} penalty
              {r.surchargeAmount > 0 && ` (surcharge: ${formatCurrency(r.surchargeAmount)})`}
              {r.interestAmount > 0 && ` (interest: ${formatCurrency(r.interestAmount)})`}
            </Text>
          )}
        </div>
      ),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: v => formatDate(v), width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'paid' ? 'success' : v === 'pending' ? 'processing' : v === 'cancelled' ? 'default' : 'warning'}>{v || 'N/A'}</Tag> },
  ]

  return (
    <Table
      size="small"
      rowKey={r => r._id || r.paymentId}
      columns={columns}
      dataSource={displayPayments}
      loading={loading}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No payment records" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  )
}
