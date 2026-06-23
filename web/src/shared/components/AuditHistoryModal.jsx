import React from 'react'
import { Modal, Row, Pagination, theme, Splitter, Empty, Typography, Input, Descriptions, Button, Tooltip } from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'

const { Text } = Typography

const AUDIT_HISTORY_PAGE_SIZE = 20

export default function AuditHistoryModal({ open, onClose, auditLogs = [] }) {
  const { token: themeToken } = theme.useToken()
  const [selectedAudit, setSelectedAudit] = React.useState(null)
  const [searchValue, setSearchValue] = React.useState('')
  const [page, setPage] = React.useState(1)

  const filteredLogs = React.useMemo(() => {
    if (!searchValue) return auditLogs
    const searchLower = searchValue.toLowerCase()
    return auditLogs.filter((audit) => {
      const user = audit.userName || audit.userId || ''
      const eventType = audit.eventType || ''
      return user.toLowerCase().includes(searchLower) || eventType.toLowerCase().includes(searchLower)
    })
  }, [auditLogs, searchValue])

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting audit logs:', filteredLogs)
  }

  const paginatedData = filteredLogs.slice((page - 1) * AUDIT_HISTORY_PAGE_SIZE, page * AUDIT_HISTORY_PAGE_SIZE)

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="Search by user or event type"
            prefix={<SearchOutlined style={{ color: themeToken.colorTextQuaternary }} />}
            allowClear
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              setPage(1)
            }}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Tooltip title="Download records">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
              aria-label="Download records"
            />
          </Tooltip>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {paginatedData.length === 0 ? (
          <Empty description="No audit logs found" />
        ) : (
          <Row gutter={[8, 8]}>
            {paginatedData.map((audit) => (
              <div
                key={audit._id}
                onClick={() => setSelectedAudit(audit)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedAudit(audit)
                  }
                }}
                tabIndex={0}
                role="button"
                style={{
                  width: '100%',
                  padding: 12,
                  border: `1px solid ${selectedAudit?._id === audit._id ? themeToken.colorPrimary : themeToken.colorBorderSecondary}`,
                  borderRadius: themeToken.borderRadius,
                  background: selectedAudit?._id === audit._id ? themeToken.colorFillAlter : themeToken.colorBgContainer,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 13 }}>{audit.eventType || 'Unknown Event'}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{formatDateTime(audit.timestamp)}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{audit.userName || audit.userId || 'Unknown User'}</Text>
              </div>
            ))}
          </Row>
        )}
      </div>

      {filteredLogs.length > AUDIT_HISTORY_PAGE_SIZE && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${themeToken.colorBorderSecondary}` }}>
          <Pagination
            current={page}
            total={filteredLogs.length}
            pageSize={AUDIT_HISTORY_PAGE_SIZE}
            showSizeChanger={false}
            onChange={setPage}
            size="small"
          />
        </div>
      )}
    </div>
  )

  const rightPanelContent = selectedAudit ? (
    <div style={{ padding: 16, overflow: 'auto' }}>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Event Type">
          {selectedAudit.eventType || 'Unknown Event'}
        </Descriptions.Item>
        <Descriptions.Item label="Timestamp">
          {formatDateTime(selectedAudit.timestamp)}
        </Descriptions.Item>
        <Descriptions.Item label="User">
          {selectedAudit.userName || selectedAudit.userId || 'Unknown User'}
        </Descriptions.Item>
        {selectedAudit.details && (
          <Descriptions.Item label="Details">
            <pre style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(selectedAudit.details, null, 2)}
            </pre>
          </Descriptions.Item>
        )}
      </Descriptions>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Empty description="Select an audit log to view details" />
    </div>
  )

  return (
    <Modal
      title="Audit History"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <div
        style={{
          height: 600,
          display: 'flex',
          border: `1px solid ${themeToken.colorBorderSecondary}`,
          borderRadius: themeToken.borderRadiusLG,
          overflow: 'hidden',
        }}
      >
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel min="30%" defaultSize="40%" style={{ overflow: 'hidden' }}>
            {leftPanelContent}
          </Splitter.Panel>
          <Splitter.Panel min="50%" defaultSize="60%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {rightPanelContent}
          </Splitter.Panel>
        </Splitter>
      </div>
    </Modal>
  )
}
