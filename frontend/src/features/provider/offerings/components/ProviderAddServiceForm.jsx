import React, { useMemo, useState } from 'react'
import { Card, Typography, Divider, Checkbox, Row, Col, Space, Button } from 'antd'
import ConfirmAddServicesModal from '@/features/provider/offerings/components/ConfirmAddServicesModal.jsx'

export default function ProviderAddServiceForm({ allowedServices = [], offerings = [], onAdd, loading }) {
  const [selected, setSelected] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const availableServices = useMemo(() => {
    const offeredIds = new Set(offerings.map((o) => String(o.serviceId)))
    return allowedServices.filter((s) => !offeredIds.has(String(s.id)))
  }, [allowedServices, offerings])

  const handleAdd = async () => {
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (typeof onAdd === 'function') {
      await onAdd(selected)
      setSelected([])
    }
    setConfirmOpen(false)
  }

  return (
    <Card title="Add Services" size="small">
      <Typography.Text type="secondary">
        You can only add services within the categories you selected in your application.
      </Typography.Text>
      <Divider />
      {availableServices.length === 0 ? (
        <Typography.Text type="secondary">No additional services available.</Typography.Text>
      ) : (
        <Checkbox.Group
          value={selected}
          onChange={(vals) => setSelected(vals.map(String))}
          style={{ width: '100%' }}
        >
          <Row gutter={[8, 8]}>
            {availableServices.map((s) => (
              <Col key={s.id} span={24}>
                <Card size="small" hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Checkbox value={s.id}>{s.name}</Checkbox>
                    {s.description ? (
                      <Typography.Text type="secondary">{s.description}</Typography.Text>
                    ) : null}
                    <Typography.Text type="secondary">
                      Pricing: {s.pricingMode}
                      {typeof s.priceMin === 'number' && typeof s.priceMax === 'number' ? ` • Fixed range: ${s.priceMin}–${s.priceMax}` : ''}
                      {typeof s.hourlyRateMin === 'number' && typeof s.hourlyRateMax === 'number' ? ` • Hourly range: ${s.hourlyRateMin}–${s.hourlyRateMax}` : ''}
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      )}
      <Divider />
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={handleAdd} disabled={selected.length === 0} loading={loading}>
          Add Selected Services
        </Button>
      </Space>
      <ConfirmAddServicesModal
        open={confirmOpen}
        selectedIds={selected}
        availableServices={availableServices}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        confirmLoading={loading}
      />
    </Card>
  )
}
