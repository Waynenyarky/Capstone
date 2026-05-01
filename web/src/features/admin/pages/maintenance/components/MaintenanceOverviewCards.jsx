import React from 'react'
import { Card, Row, Col, Typography, Tag } from 'antd'
import {
  ApiOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  CloudOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { CARD_COLORS } from '../constants/maintenance.constants.js'

const { Text } = Typography

export default function MaintenanceOverviewCards({ services, dependencies, approvalStats, current, token }) {
  const serviceCards = services.map((service) => ({
    key: service.name,
    title: service.name,
    status: service.status,
    icon: service.name.toLowerCase().includes('auth') ? ApiOutlined :
           service.name.toLowerCase().includes('business') ? DatabaseOutlined :
           service.name.toLowerCase().includes('admin') ? ToolOutlined :
           service.name.toLowerCase().includes('audit') ? DatabaseOutlined :
           service.name.toLowerCase().includes('ai') ? RobotOutlined :
           service.name.toLowerCase().includes('ipfs') ? CloudOutlined :
           ApiOutlined,
    color: service.name.toLowerCase().includes('auth') ? CARD_COLORS.auth :
           service.name.toLowerCase().includes('business') ? CARD_COLORS.business :
           service.name.toLowerCase().includes('admin') ? CARD_COLORS.admin :
           service.name.toLowerCase().includes('audit') ? CARD_COLORS.audit :
           service.name.toLowerCase().includes('ai') ? CARD_COLORS.ai :
           service.name.toLowerCase().includes('ipfs') ? CARD_COLORS.ipfs :
           CARD_COLORS.mongodb,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Service Status Cards */}
      <div>
        <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
          Service Status
        </Text>
        <Row gutter={[16, 16]}>
          {serviceCards.map((card) => {
            const Icon = card.icon
            return (
              <Col key={card.key} xs={12} sm={8} md={6}>
                <Card
                  size="small"
                  style={{ height: '100%', borderColor: card.status === 'healthy' ? CARD_COLORS.on : CARD_COLORS.off }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon style={{ fontSize: 20, color: card.status === 'healthy' ? CARD_COLORS.on : CARD_COLORS.off }} />
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>{card.title}</Text>
                  </div>
                  <Tag
                    color={card.status === 'healthy' ? 'green' : 'red'}
                    style={{ marginTop: 8 }}
                  >
                    {card.status}
                  </Tag>
                </Card>
              </Col>
            )
          })}
        </Row>
      </div>

      {/* Dependencies Status */}
      {dependencies && (
        <div>
          <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
            Infrastructure Status
          </Text>
          <Row gutter={[16, 16]}>
            {Object.entries(dependencies).map(([key, status]) => (
              <Col key={key} xs={12} sm={8} md={6}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {key.toLowerCase().includes('mongo') ? (
                      <DatabaseOutlined style={{ fontSize: 20, color: CARD_COLORS.mongodb }} />
                    ) : (
                      <CloudOutlined style={{ fontSize: 20, color: CARD_COLORS.ipfs }} />
                    )}
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>{key}</Text>
                  </div>
                  <Tag color={status === 'connected' ? 'green' : 'red'} style={{ marginTop: 8 }}>
                    {status}
                  </Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Maintenance Schedule */}
      {current && (
        <div>
          <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
            Maintenance Schedule
          </Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ToolOutlined style={{ fontSize: 20, color: current.active ? CARD_COLORS.on : CARD_COLORS.off }} />
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>Status</Text>
                </div>
                <Tag color={current.active ? 'green' : 'default'}>
                  {current.active ? 'Active' : 'Inactive'}
                </Tag>
              </Card>
            </Col>
            {current.expectedResumeAt && (
              <Col xs={24} sm={12}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <ClockCircleOutlined style={{ fontSize: 20, color: CARD_COLORS.on }} />
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>Resumes At</Text>
                  </div>
                  <Text style={{ fontSize: 13 }}>
                    {new Date(current.expectedResumeAt).toLocaleString()}
                  </Text>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* Request Stats */}
      <div>
        <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
          Request Statistics
        </Text>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <Card size="small" style={{ borderColor: CARD_COLORS.pending }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined style={{ fontSize: 20, color: CARD_COLORS.pending }} />
                <div>
                  <Text style={{ fontSize: 12, display: 'block' }}>Pending</Text>
                  <Text strong style={{ fontSize: 16 }}>{approvalStats.pending}</Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small" style={{ borderColor: CARD_COLORS.approved }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ fontSize: 20, color: CARD_COLORS.approved }} />
                <div>
                  <Text style={{ fontSize: 12, display: 'block' }}>Approved</Text>
                  <Text strong style={{ fontSize: 16 }}>{approvalStats.approved}</Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small" style={{ borderColor: CARD_COLORS.rejected }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ToolOutlined style={{ fontSize: 20, color: CARD_COLORS.rejected }} />
                <div>
                  <Text style={{ fontSize: 12, display: 'block' }}>Rejected</Text>
                  <Text strong style={{ fontSize: 16 }}>{approvalStats.rejected}</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}
