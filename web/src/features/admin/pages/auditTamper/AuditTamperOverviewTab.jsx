import React from 'react'
import { Row, Col, Card, Typography, theme, Button } from 'antd'
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'

const { Text } = Typography

export default function AuditTamperOverviewTab({ stats, onGoToIncidents }) {
  const { token } = theme.useToken()
  const open = stats?.open ?? 0
  const total = stats?.total ?? 0
  const acknowledged = stats?.acknowledged ?? 0
  const resolved = stats?.resolved ?? 0
  const hasOpen = open > 0

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
        Summary
      </Text>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Total incidents</span>
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
                  <UnorderedListOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{total}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Open (new)</span>
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
                    background: hasOpen ? token.colorErrorBg : token.colorFillQuaternary,
                    color: hasOpen ? token.colorError : token.colorTextSecondary,
                  }}
                >
                  <WarningOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{open}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Acknowledged</span>
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
                  <SafetyCertificateOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{acknowledged}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Resolved</span>
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
                  <CheckCircleOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{resolved}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        {hasOpen ? (
          <>
            <Text type="warning" strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              {open} open tamper incident(s) require attention.
            </Text>
            <p style={{ marginBottom: 12, color: token.colorTextSecondary }}>
              One or more audit log entries may have been altered or do not match the on-chain record. Review the Incidents tab to acknowledge, contain affected accounts, or resolve.
            </p>
            {onGoToIncidents && (
              <Button type="primary" icon={<FileDoneOutlined />} onClick={onGoToIncidents}>
                Go to Incidents
              </Button>
            )}
          </>
        ) : (
          <>
            <Text style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              No open tamper incidents. Ledger integrity is OK.
            </Text>
            <p style={{ marginBottom: 0, color: token.colorTextSecondary }}>
              Audit logs are verified against the blockchain. If any mismatch is detected, incidents will appear here and in the Incidents tab.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
