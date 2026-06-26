import React from 'react'
import { Modal, Row, theme, Splitter } from 'antd'
import ApplicationAuditCard from './ApplicationAuditCard'
import ApplicationAuditDetailPanel from './ApplicationAuditDetailPanel'
import { useApplicationAudit } from './hooks/useApplicationAudit'

export default function ApplicationAuditHistoryModal({ open, onClose, applicationId }) {
  const { token: themeToken } = theme.useToken()
  const [selectedAudit, setSelectedAudit] = React.useState(null)

  const { audits } = useApplicationAudit(applicationId, open)

  const handleAuditSelect = (audit) => {
    setSelectedAudit(audit)
  }

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <Row gutter={[8, 8]}>
          {audits.map((audit) => (
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
