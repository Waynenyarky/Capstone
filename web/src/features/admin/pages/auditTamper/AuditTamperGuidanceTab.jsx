import React from 'react'
import { Typography, Card, theme } from 'antd'
import {
  SearchOutlined,
  LockOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
} from '@ant-design/icons'

const { Text, Title } = Typography

export default function AuditTamperGuidanceTab() {
  const { token } = theme.useToken()

  const sectionStyle = {
    marginBottom: 24,
  }

  const stepIcon = {
    width: 28,
    height: 28,
    borderRadius: token.borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 14,
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <Title level={5} style={{ marginBottom: 16 }}>
        What is audit log tampering?
      </Title>
      <p style={{ color: token.colorTextSecondary, marginBottom: 24 }}>
        The system stores a hash of each audit log entry and, when possible, records it on the blockchain. If someone alters an audit log after it was created, the stored hash will no longer match the data, or the on-chain record will not match. When that happens, a <strong>tamper incident</strong> is created and you are alerted on this page.
      </p>

      <Title level={5} style={{ marginBottom: 16 }}>
        How detection works
      </Title>
      <p style={{ color: token.colorTextSecondary, marginBottom: 24 }}>
        A background job runs periodically (e.g. hourly) and verifies recent audit logs. It compares the stored hash to the current record and checks the blockchain when available. Incidents are classified as <em>tamper_detected</em> (hash mismatch or missing on-chain match), <em>not_logged</em> (no on-chain transaction yet), or <em>verification_error</em> (temporary infrastructure issues).
      </p>

      <Title level={5} style={{ marginBottom: 16 }}>
        What to do when you are alerted
      </Title>

      <Card size="small" style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <span style={{ ...stepIcon, background: token.colorPrimaryBg, color: token.colorPrimary }}>
            <SearchOutlined />
          </span>
          <div>
            <Text strong>Triage</Text>
            <p style={{ margin: '4px 0 0', color: token.colorTextSecondary, fontSize: 13 }}>
              Review the incident details and affected users in the Incidents tab. Acknowledge the incident to indicate you have seen it and to reduce alert noise.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <span style={{ ...stepIcon, background: token.colorErrorBg, color: token.colorError }}>
            <LockOutlined />
          </span>
          <div>
            <Text strong>Contain</Text>
            <p style={{ margin: '4px 0 0', color: token.colorTextSecondary, fontSize: 13 }}>
              If needed, enable containment to freeze sensitive actions for the affected accounts until the situation is cleared. This limits further risk while you investigate.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <span style={{ ...stepIcon, background: token.colorWarningBg, color: token.colorWarning }}>
            <CheckCircleOutlined />
          </span>
          <div>
            <Text strong>Verify</Text>
            <p style={{ margin: '4px 0 0', color: token.colorTextSecondary, fontSize: 13 }}>
              Use the on-chain hash as the source of truth when available. Do not overwrite or correct audit records in the database; the evidence is kept for forensics.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ ...stepIcon, background: token.colorSuccessBg, color: token.colorSuccess }}>
            <FileDoneOutlined />
          </span>
          <div>
            <Text strong>Resolve</Text>
            <p style={{ margin: '4px 0 0', color: token.colorTextSecondary, fontSize: 13 }}>
              When the incident is handled, add resolution notes, lift containment if it is safe to do so, and mark the incident as resolved. All actions are logged for audit.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
