import React from 'react'
import { Row, Col, Card, Typography, theme } from 'antd'
import { DollarOutlined, TransactionOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function FinanceOverviewTab() {
  const { token } = theme.useToken()

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
        Summary
      </Text>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Total collections (this month)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: token.colorPrimaryBg,
                    color: token.colorPrimary,
                  }}
                >
                  <DollarOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>—</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connect revenue API to show data
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Transactions (this month)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: token.colorSuccessBg,
                    color: token.colorSuccess,
                  }}
                >
                  <TransactionOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>—</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connect payments API to show count
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Pending collections
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: token.colorWarningBg,
                    color: token.colorWarning,
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>—</span>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Unpaid or overdue items
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
