import { useState, useEffect } from 'react'
import { Typography, theme, Select, Button, Card, Statistic, Row, Col, Space, App } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { DownloadOutlined } from '@ant-design/icons'
import { get } from '@/lib/http.js'

const { Text } = Typography

export default function FinanceReportsTab() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [period, setPeriod] = useState('month')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const loadReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period, year, month })
      const res = await get(`/api/business/admin/payments/report?${params}`)
      setReport(res?.data ?? res ?? {})
    } catch {
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReport() }, [period])

  const handleExportCSV = () => {
    if (!report?.payments?.length) { message.info('No data to export'); return }
    const rows = [['Date', 'Reference', 'Type', 'Amount', 'Status']]
    report.payments.forEach(p => {
      rows.push([
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        p.paymentId || '',
        p.paymentType || '',
        p.amount || 0,
        p.status || '',
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-report-${period}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
    message.success('Report exported')
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Space>
          <Text strong>Period:</Text>
          <Select value={period} onChange={setPeriod} style={{ width: 160 }} options={[
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' },
            { value: 'year', label: 'This Year' },
          ]} />
        </Space>
        <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={!report?.payments?.length}>
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><LottieSpinner /></div>
      ) : report ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic title="Total Revenue" value={report.totalAmount || 0} prefix="₱" precision={2} valueStyle={{ color: token.colorSuccess }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic title="Transactions" value={report.transactionCount || 0} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic title="Avg per Transaction" value={report.transactionCount ? (report.totalAmount / report.transactionCount) : 0} prefix="₱" precision={2} />
            </Card>
          </Col>
          {report.byType && Object.keys(report.byType).length > 0 && (
            <Col xs={24}>
              <Card size="small" title="Revenue by Type">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {Object.entries(report.byType).map(([type, amount]) => (
                    <div key={type} style={{ minWidth: 120 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{type.replace(/_/g, ' ')}</Text>
                      <div><Text strong>₱{Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text></div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
        </Row>
      ) : (
        <Text type="secondary">No report data available.</Text>
      )}
    </div>
  )
}
