import React from 'react'
import { Modal, Row, Pagination, theme, Splitter } from 'antd'
import HelpRequestAuditToolbar from './HelpRequestAuditToolbar'
import HelpRequestAuditCard from './HelpRequestAuditCard'
import HelpRequestAuditDetailPanel from './HelpRequestAuditDetailPanel'
import HelpRequestAuditExportModal from './HelpRequestAuditExportModal'
import { useHelpRequestAuditFilters } from '../hooks/useHelpRequestAuditFilters'
import { useHelpRequestAuditPagination } from '../hooks/useHelpRequestAuditPagination'
import { useHelpRequestAuditExport } from '../hooks/useHelpRequestAuditExport'
import { useHelpRequestAudit } from '../hooks/useHelpRequestAudit'

const HELP_REQUEST_AUDIT_PAGE_SIZE = 20

export default function HelpRequestAuditHistoryModal({ open, onClose, requestId }) {
  const { token: themeToken } = theme.useToken()
  const [selectedAudit, setSelectedAudit] = React.useState(null)

  const { audits } = useHelpRequestAudit(requestId)

  const {
    searchValue,
    setSearchValue,
  } = useHelpRequestAuditFilters()

  const filteredAudits = React.useMemo(() => {
    let list = [...audits]
    if (searchValue) {
      const searchLower = searchValue.toLowerCase()
      list = list.filter((audit) => {
        const user = audit.userId || ''
        const eventType = audit.eventType || ''
        return user.toLowerCase().includes(searchLower) || eventType.toLowerCase().includes(searchLower)
      })
    }
    return list
  }, [audits, searchValue])

  const { page, setPage, paginatedData } = useHelpRequestAuditPagination(filteredAudits, HELP_REQUEST_AUDIT_PAGE_SIZE)

  const { exportOpen, setExportOpen, exportRange, setExportRange, handleExport, rowCount } = useHelpRequestAuditExport(
    filteredAudits,
    () => setExportOpen(false)
  )

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 0 }}>
        <HelpRequestAuditToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onExport={() => setExportOpen(true)}
          exportDisabled={filteredAudits.length === 0}
          token={themeToken}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <Row gutter={[8, 8]}>
          {paginatedData.map((audit) => (
            <div key={audit._id} style={{ width: '100%' }}>
              <HelpRequestAuditCard
                audit={audit}
                selected={selectedAudit?._id === audit._id}
                onSelect={setSelectedAudit}
                token={themeToken}
              />
            </div>
          ))}
        </Row>
      </div>

      <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${themeToken.colorBorderSecondary}` }}>
        <Pagination
          current={page}
          total={filteredAudits.length}
          pageSize={HELP_REQUEST_AUDIT_PAGE_SIZE}
          showSizeChanger={false}
          onChange={setPage}
          size="small"
        />
      </div>

      <HelpRequestAuditExportModal
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={handleExport}
        exportRange={exportRange}
        onRangeChange={(value) => setExportRange(value || [null, null])}
        rowCount={rowCount}
      />
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
            <HelpRequestAuditDetailPanel audit={selectedAudit} />
          </Splitter.Panel>
        </Splitter>
      </div>
    </Modal>
  )
}
