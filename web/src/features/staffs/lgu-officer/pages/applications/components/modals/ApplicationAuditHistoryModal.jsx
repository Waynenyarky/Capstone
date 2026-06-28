import React from 'react'
import { Modal, Row, theme, Splitter, Spin, Alert } from 'antd'
import ApplicationAuditCard from '../ApplicationAuditCard'
import ApplicationAuditDetailPanel from '../ApplicationAuditDetailPanel'
import { useApplicationAudit } from '../../hooks/useApplicationAudit'

export default function ApplicationAuditHistoryModal({ open, onClose, application }) {
  const { token: themeToken } = theme.useToken()
  const [selectedAudit, setSelectedAudit] = React.useState(null)

  const { auditLogs, loading, error } = useApplicationAudit(application, open)

  const handleAuditSelect = (audit) => {
    setSelectedAudit(audit)
  }

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {loading ? (
          <div style={{ padding: 12, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : error ? (
          <Alert
            message="Error loading audit logs"
            description={error}
            type="error"
            showIcon
            style={{ margin: 12 }}
          />
        ) : auditLogs.length > 0 ? (
          <Row gutter={[8, 8]}>
            {auditLogs.map((audit) => (
              <div key={audit._id} style={{ width: '100%' }}>
                <ApplicationAuditCard
                  audit={audit}
                  selected={selectedAudit?._id === audit._id}
                  onSelect={handleAuditSelect}
                  token={themeToken}
                />
              </div>
            ))}
          </Row>
        ) : (
          <div style={{ padding: 12, color: themeToken.colorTextSecondary }}>
            No audit history available
          </div>
        )}
      </div>
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
            <ApplicationAuditDetailPanel audit={selectedAudit} />
          </Splitter.Panel>
        </Splitter>
      </div>
    </Modal>
  )
}
