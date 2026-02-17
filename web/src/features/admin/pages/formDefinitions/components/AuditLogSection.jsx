import React, { useState, useMemo } from 'react'
import { Modal, Pagination, Space, Table, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import { INDUSTRY_LABELS, FORM_TYPE_LABELS, ACTION_LABELS } from '../constants'

const { Text } = Typography
const PAGE_SIZE = 10

export default function AuditLogSection({ entries }) {
  const { token } = theme.useToken()
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const allData = useMemo(() => {
    return (entries || []).map((e, i) => ({
      ...e,
      key: `${e.definitionId}-${e.at}-${i}`,
    }))
  }, [entries])

  const dataSource = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return allData.slice(start, start + PAGE_SIZE)
  }, [allData, currentPage])

  const columns = useMemo(() => [
    {
      title: 'Author',
      key: 'author',
      width: 100,
      ellipsis: true,
      render: (_, record) => {
        let name = '—'
        if (record.user) {
          name = [record.user.firstName, record.user.lastName].filter(Boolean).join(' ') || record.user.email
        } else if (record.system) {
          name = record.system
        }
        return <Text type="secondary">{name}</Text>
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 280,
      ellipsis: true,
      render: (_, record) => {
        const action = ACTION_LABELS[record.action] || record.action
        const formType = FORM_TYPE_LABELS[record.formType] || record.formType
        const industry = INDUSTRY_LABELS[record.industryScope] || record.industryScope || 'All'
        return <Text>{`${action} ${formType} – ${industry}`}</Text>
      },
    },
    {
      title: 'Time',
      key: 'time',
      width: 100,
      ellipsis: true,
      render: (_, record) => <Text type="secondary">{dayjs(record.at).fromNow()}</Text>,
    },
  ], [])

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', padding: 16, overflow: 'hidden' }}>
      <Text strong style={{ margin: 0, marginBottom: 12 }}>Recent activities</Text>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: allData.length > 0 ? '12px 12px 0 0' : 12, background: 'white' }}>
        <Table
          bordered
          dataSource={dataSource}
          columns={columns}
          size="small"
          pagination={false}
          scroll={{ x: 480 }}
          locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>No recent activity</Text> }}
          onRow={(record) => ({
            onClick: () => setSelectedEntry(record),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
      {allData.length > 0 && (
        <div style={{ flexShrink: 0, padding: '8px 12px', borderLeft: `1px solid ${token.colorBorderSecondary}`, borderRight: `1px solid ${token.colorBorderSecondary}`, borderBottom: `1px solid ${token.colorBorderSecondary}`, borderRadius: '0 0 12px 12px', background: 'white', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            size="small"
            simple
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={allData.length}
            onChange={setCurrentPage}
          />
        </div>
      )}
      <Modal
        title="Activity details"
        open={!!selectedEntry}
        onCancel={() => setSelectedEntry(null)}
        footer={null}
      >
        {selectedEntry && (() => {
          const e = selectedEntry
          const industry = INDUSTRY_LABELS[e.industryScope] || e.industryScope || 'All'
          const formLabel = `${FORM_TYPE_LABELS[e.formType] || e.formType} – ${industry}`
          const by = e.user
            ? [e.user.firstName, e.user.lastName].filter(Boolean).join(' ') || e.user.email
            : e.system || '—'
          return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{ACTION_LABELS[e.action] || e.action}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>{dayjs(e.at).format('MMM D, YYYY h:mm A')}</Text>
              </div>
              <div>
                <Text type="secondary">Form: </Text>
                <Text>{formLabel}</Text>
                {e.version && <Text type="secondary"> (v{e.version})</Text>}
              </div>
              {e.name && (
                <div>
                  <Text type="secondary">Name: </Text>
                  <Text>{e.name}</Text>
                </div>
              )}
              <div>
                <Text type="secondary">Author: </Text>
                <Text>{by}</Text>
              </div>
              {e.comment && (
                <div>
                  <Text type="secondary">Comment: </Text>
                  <Text>{e.comment}</Text>
                </div>
              )}
              {e.changes && Object.keys(e.changes).length > 0 && (
                <div>
                  <Text type="secondary">Changes: </Text>
                  <pre style={{ margin: '4px 0 0', fontSize: 12, background: 'var(--ant-color-fill-quaternary)', padding: 8, borderRadius: 4, overflow: 'auto' }}>
                    {JSON.stringify(e.changes, null, 2)}
                  </pre>
                </div>
              )}
            </Space>
          )
        })()}
      </Modal>
    </div>
  )
}
