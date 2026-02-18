import React from 'react'
import { Row, Col, Card, Typography, theme } from 'antd'
import { DollarOutlined, UnorderedListOutlined, LinkOutlined } from '@ant-design/icons'

const { Text } = Typography

const CHARTER_URL = 'https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf'

export default function FeeConfigOverview({ configs = [] }) {
  const { token } = theme.useToken()
  const totalBrackets = configs.reduce((sum, c) => sum + (c.brackets?.length || 0), 0)
  const lastUpdated = configs.length
    ? configs.reduce((latest, c) => {
        const t = c.updatedAt ? new Date(c.updatedAt).getTime() : 0
        return t > latest ? t : latest
      }, 0)
    : null

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
        Summary
      </Text>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Lines of business</span>
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
                <span style={{ fontSize: 16, fontWeight: 600 }}>{configs.length}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Tax brackets (total)</span>
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
                  <DollarOutlined style={{ fontSize: 18 }} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{totalBrackets}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Last updated</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13 }}>
                  {lastUpdated
                    ? new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Reference
        </Text>
        <a href={CHARTER_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LinkOutlined />
          General Trias Citizen's Charter (OCBPLO 2025)
        </a>
      </div>
    </div>
  )
}
