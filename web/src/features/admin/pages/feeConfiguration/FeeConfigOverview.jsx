import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, theme, Table, Tag } from 'antd'
import { DollarOutlined, UnorderedListOutlined, LinkOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { get } from '@/lib/http.js'

const { Text } = Typography

const CHARTER_URL = 'https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf'

const ACTION_LABELS = {
  fee_config_created: 'Created',
  fee_config_updated: 'Updated',
  fee_config_deleted: 'Deleted',
  penalty_config_updated: 'Penalty updated',
  penalty_config_reset: 'Penalty reset',
}
const actionLabel = (a) => ACTION_LABELS[a] || a || '—'

export default function FeeConfigOverview({ configs = [] }) {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const totalBrackets = configs.reduce((sum, c) => sum + (c.brackets?.length || 0), 0)
  const [recentActivity, setRecentActivity] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    get('/api/admin/fee-configuration-logs?limit=10')
      .then((res) => {
        if (!cancelled) {
          const list = res?.data?.logs ?? res?.logs ?? []
          setRecentActivity(Array.isArray(list) ? list : [])
        }
      })
      .catch(() => {
        if (!cancelled) setRecentActivity([])
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', padding: 16 }}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
          Summary
        </Text>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} sm={12}>
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
                    background: 'lightblue',
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
          <Col xs={24} sm={12}>
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
        </Row>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 15 }}>
            Recent activity
          </Text>
          <Link to="/admin/fee-configuration?tab=logs">View all</Link>
        </div>
        <Card size="small">
          <Table
            size="small"
            dataSource={recentActivity}
            rowKey={(r) => r._id || r.id || Math.random()}
            loading={recentLoading}
            pagination={false}
            onRow={(record) => ({
              onClick: () => {
                const id = record._id || record.id
                if (id) navigate(`/admin/fee-configuration?tab=logs&logId=${encodeURIComponent(id)}`)
              },
              style: { cursor: 'pointer' },
            })}
            columns={[
              {
                title: 'Action',
                dataIndex: 'action',
                key: 'action',
                width: 160,
                render: (v) => <Tag>{actionLabel(v)}</Tag>,
              },
              {
                title: 'Resource',
                key: 'resource',
                render: (_, r) => (r.resourceType === 'penalty' ? 'Penalty & Surcharge' : r.lineOfBusiness || 'Fee config'),
              },
              {
                title: 'Performed by',
                key: 'performedBy',
                render: (_, r) => {
                  const u = r.user
                  if (u) return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—'
                  return r.system || '—'
                },
              },
              {
                title: 'Date',
                dataIndex: 'at',
                key: 'date',
                width: 160,
                render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—'),
              },
            ]}
            locale={{ emptyText: 'No recent activity' }}
          />
        </Card>
      </div>

      <div>
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
