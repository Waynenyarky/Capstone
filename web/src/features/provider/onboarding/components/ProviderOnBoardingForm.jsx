import React, { useMemo } from 'react'
import { Card, Row, Col, Checkbox, Tag, Typography, Button, Steps, Divider, Space } from 'antd'
import { useProviderOnboardingForm } from "@/features/provider/hooks"
import OfferingFormCard from "@/features/provider/offerings/components/OfferingFormCard.jsx"

export default function ProviderOnboardingForm({ onCompleted }) {
  const {
    currentStep,
    setCurrentStep,
    isSubmitting,
    allowedServices,
    selectedServiceIds,
    setSelectedServiceIds,
    initializeSelections,
    offerings,
    serviceMap,
    updateOffering,
    completeOnboarding,
  } = useProviderOnboardingForm({ onCompleted })

  const stepItems = useMemo(() => ([
    { title: 'Select Services' },
    { title: 'Configure Details' },
    { title: 'Summary' },
  ]), [])

  return (
    <>
      <Steps current={currentStep} items={stepItems} style={{ marginBottom: 16 }} />

      {currentStep === 0 && (
        <Card title="Step 1: Select Services" variant="outlined">
          <Typography.Paragraph>
            Choose the services you want to offer. You can only activate services within the categories you selected in your application. If you want to add another category later, please contact the admin.
          </Typography.Paragraph>
          <Divider />
          <Row gutter={[12, 12]}>
            <Col span={24}>
              {allowedServices.length === 0 ? (
                <Typography.Text type="secondary">
                  No services available for your selected categories yet.
                </Typography.Text>
              ) : (
                <Checkbox.Group
                  value={selectedServiceIds}
                  onChange={(vals) => setSelectedServiceIds(vals.map(String))}
                  style={{ width: '100%' }}
                >
                  <Row gutter={[8, 8]}>
                    {allowedServices.map((s) => (
                      <Col key={s.id} span={12}>
                        <Card size="small" hoverable>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space align="center">
                              <Checkbox value={s.id}>{s.name}</Checkbox>
                              {s.categoryName ? <Tag>{s.categoryName}</Tag> : null}
                            </Space>
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
            </Col>
          </Row>
          <Divider />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button disabled={selectedServiceIds.length === 0} loading={isSubmitting} type="primary" onClick={initializeSelections}>
              Next: Configure Details
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 1 && (
        <Card title="Step 2: Configure Details" variant="outlined">
          {offerings.length === 0 ? (
            <Typography.Text type="secondary">No offerings initialized yet.</Typography.Text>
          ) : (
            <Row gutter={[12, 12]}>
              {offerings.map((o) => (
                <Col span={12} key={o.id}>
                  <OfferingFormCard
                    offering={o}
                    service={serviceMap[o.serviceId]}
                    isSubmitting={isSubmitting}
                    updateOffering={updateOffering}
                  />
                </Col>
              ))}
            </Row>
          )}
          <Divider />
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>Back</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)}>Next: Summary</Button>
          </Space>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="Step 3: Summary" variant="outlined">
          {offerings.length === 0 ? (
            <Typography.Text type="secondary">No offerings configured.</Typography.Text>
          ) : (
            <>
              <Row gutter={[12, 12]}>
                {offerings.map((o) => (
                  <Col span={12} key={`sum-${o.id}`}>
                    <Card size="small" title={o.serviceName}>
                      <Typography.Text>
                        Pricing: {o.pricingMode}
                        {typeof o.fixedPrice === 'number' ? ` • Fixed: ${o.fixedPrice}` : ''}
                        {typeof o.hourlyRate === 'number' ? ` • Hourly: ${o.hourlyRate}` : ''}
                      </Typography.Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <Typography.Text>
                        {o.availability?.map((d) => (
                          <span key={`${o.id}-${d.day}`} style={{ marginRight: 8 }}>
                            {d.day.toUpperCase()}: {d.available ? `${d.startTime || '--:--'}–${d.endTime || '--:--'}` : 'Unavailable'}
                          </span>
                        ))}
                      </Typography.Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <Typography.Text>Emergency: {o.emergencyAvailable ? 'Yes' : 'No'}</Typography.Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <Typography.Text>Active: {o.active ? 'Yes' : 'No'}</Typography.Text>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Divider />
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrentStep(1)}>Back</Button>
                <Button type="primary" loading={isSubmitting} onClick={completeOnboarding}>Complete Onboarding</Button>
              </Space>
            </>
          )}
        </Card>
      )}
    </>
  )
}