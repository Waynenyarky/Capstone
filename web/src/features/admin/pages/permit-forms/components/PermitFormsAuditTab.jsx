import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Tag, Typography, Empty, Descriptions, theme, Splitter, Grid, Input, Drawer } from 'antd'
import { DownloadOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { usePermitFormsAudit } from '../hooks'
import { AUDIT_EVENT_LABELS } from '../constants'
import ExportLogsModal from '@/features/admin/components/ExportLogsModal'

const { Text, Title } = Typography

const ACTION_TAG_COLORS = {
  permit_forms_published: 'success',
  permit_forms_reverted: 'warning',
  permit_forms_toggled: 'processing',
}

const actionLabel = (eventType) => AUDIT_EVENT_LABELS[eventType] || eventType || '—'

function LogDetailPanel({ log, token }) {
  if (!log) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a log to view details</Text>}
        />
      </div>
    )
  }

  const formatNewValue = (newValue) => {
    if (!newValue) return '—'
    try {
      const parsed = JSON.parse(newValue)
      if (parsed.sectionDescription !== undefined) {
        return parsed.sectionDescription
      }
      if (parsed.cards !== undefined) {
        return `${parsed.cards.length} card${parsed.cards.length !== 1 ? 's' : ''}`
      }
      return newValue
    } catch {
      return newValue
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexShrink: 0,
          padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorFillTertiary,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <FileTextOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {actionLabel(log.eventType)}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {log.userId?.firstName && log.userId?.lastName
              ? `${log.userId.firstName} ${log.userId.lastName}`
              : log.userId?.username || '—'}
          </Text>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
        <Descriptions
          column={1}
          size="small"
          styles={{
            label: { color: token.colorTextSecondary, fontSize: 12, paddingBottom: 2 },
            content: { fontSize: 13, paddingBottom: 12 },
          }}
        >
          <Descriptions.Item label="Action">
            <Tag color={ACTION_TAG_COLORS[log.eventType] || 'default'}>
              {actionLabel(log.eventType)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Admin">
            {log.userId?.firstName && log.userId?.lastName
              ? `${log.userId.firstName} ${log.userId.lastName}`
              : log.userId?.username || '—'}
          </Descriptions.Item>
          {log.role && (
            <Descriptions.Item label="Role"><Tag>{log.role}</Tag></Descriptions.Item>
          )}
          {log.fieldChanged && (
            <Descriptions.Item label="Field changed">{log.fieldChanged}</Descriptions.Item>
          )}
          {log.oldValue != null && log.oldValue !== '' && (
            <Descriptions.Item label="Previous value">
              <Text type="secondary" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{log.oldValue}</Text>
            </Descriptions.Item>
          )}
          {log.newValue != null && log.newValue !== '' && (
            <Descriptions.Item label="New value">
              <Text style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{formatNewValue(log.newValue)}</Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Timestamp">
            {dayjs(log.createdAt).format('MMMM D, YYYY HH:mm:ss')}
          </Descriptions.Item>
          {log.metadata?.ip && (
            <Descriptions.Item label="IP address">{log.metadata.ip}</Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </div>
  )
}

export default function PermitFormsAuditTab() {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { logs, loading, fetch } = usePermitFormsAudit()
  const [selectedLog, setSelectedLog] = useState(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch(1)
  }, [fetch])

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs
    const query = searchQuery.toLowerCase()
    return logs.filter(log => {
      const userName = log.userId?.firstName && log.userId?.lastName
        ? `${log.userId.firstName} ${log.userId.lastName}`
        : log.userId?.username || ''
      return (
        (log.eventType && log.eventType.toLowerCase().includes(query)) ||
        (userName && userName.toLowerCase().includes(query)) ||
        (log.role && log.role.toLowerCase().includes(query)) ||
        (log.fieldChanged && log.fieldChanged.toLowerCase().includes(query)) ||
        (log.oldValue && String(log.oldValue).toLowerCase().includes(query)) ||
        (log.newValue && String(log.newValue).toLowerCase().includes(query)) ||
        (log.createdAt && dayjs(log.createdAt).format('MMM D, YYYY HH:mm').toLowerCase().includes(query))
      )
    })
  }, [logs, searchQuery])

  const columns = useMemo(() => [
    {
      title: 'Action',
      dataIndex: 'eventType',
      key: 'action',
      width: 180,
      render: (v) => actionLabel(v),
    },
    {
      title: 'Admin',
      dataIndex: 'userId',
      key: 'userId',
      width: 180,
      render: (v) => v?.firstName && v?.lastName ? `${v.firstName} ${v.lastName}` : v?.username || '—',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      width: 180,
      render: (v) => v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—',
    },
  ], [])

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 8, gap: 8 }}>
        <Input
          placeholder="Search audit logs..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          style={{ flex: 1 }}
        />
        <Button icon={<DownloadOutlined />} onClick={() => setExportModalOpen(true)}>
          Export Logs
        </Button>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 8, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey={(r) => r._id || r.hash || Math.random()}
            columns={columns}
            dataSource={filteredLogs}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => (rec._id || rec.hash) === (selectedLog?._id || selectedLog?.hash) ? 'log-row-selected' : ''}
            onRow={(record) => ({
              onClick: () => setSelectedLog(record),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <Empty
                  image={<FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                  styles={{ image: { height: 60 } }}
                  description={<Text type="secondary">{searchQuery ? 'No matching logs found' : 'No audit logs yet'}</Text>}
                />
              ),
            }}
          />
        </div>
        <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
          </Typography.Text>
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.log-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const detailPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <LogDetailPanel log={selectedLog} token={token} />
    </div>
  )

  if (isMobile) {
    return (
      <>
        {tableContent}
        <Drawer
          title={selectedLog ? actionLabel(selectedLog.eventType) : 'Log Detail'}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          destroyOnHidden
          placement="bottom"
          height="100%"
          styles={{
            body: { padding: 0 }
          }}
        >
          {selectedLog && <LogDetailPanel log={selectedLog} token={token} />}
        </Drawer>
        <ExportLogsModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          exportType="permit-forms"
        />
      </>
    )
  }

  return (
    <Splitter style={{ height: '100%', padding: 0 }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden', padding: 0 }}>
        {tableContent}
      </Splitter.Panel>
      <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        {detailPanel}
      </Splitter.Panel>
      <ExportLogsModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        exportType="permit-forms"
      />
    </Splitter>
  )
}
