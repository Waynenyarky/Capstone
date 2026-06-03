import React, { useRef } from 'react'
import { Drawer, Row, Pagination, theme } from 'antd'
import CmsAuditToolbar from './CmsAuditToolbar'
import CmsAuditCard from './CmsAuditCard'
import CmsAuditExportModal from './CmsAuditExportModal'
import { CMS_AUDIT_PAGE_SIZE } from '../constants/cmsAudit.constants'
import { useCmsAuditFilters } from '../hooks/useCmsAuditFilters'
import { useCmsAuditPagination } from '../hooks/useCmsAuditPagination'
import { useCmsAuditExport } from '../hooks/useCmsAuditExport'
import { useCmsAudit } from '../hooks/useCmsAudit'

export default function CmsAuditHistoryDrawer({ open, onClose, slotId, onAuditSelect }) {
  const { token: themeToken } = theme.useToken()
  const historyFilterRef = useRef(null)

  const { audits } = useCmsAudit(slotId)

  const {
    searchValue,
    setSearchValue,
    eventTypeFilter,
    setEventTypeFilter,
    clearFilters,
    activeFilterCount,
  } = useCmsAuditFilters()

  const filteredAudits = React.useMemo(() => {
    let list = [...audits]
    if (searchValue) {
      const searchLower = searchValue.toLowerCase()
      list = list.filter((audit) => {
        const user = audit.userId
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.toLowerCase() : ''
        const changedFields = audit.metadata?.changedFields?.join(' ') || ''
        return userName.includes(searchLower) || changedFields.toLowerCase().includes(searchLower)
      })
    }
    if (eventTypeFilter) {
      list = list.filter((audit) => audit.eventType === eventTypeFilter)
    }
    return list
  }, [audits, searchValue, eventTypeFilter])

  const { page, setPage, paginatedData } = useCmsAuditPagination(filteredAudits, CMS_AUDIT_PAGE_SIZE)

  const { exportOpen, setExportOpen, exportRange, setExportRange, handleExport, rowCount } = useCmsAuditExport(
    filteredAudits,
    () => setExportOpen(false)
  )

  return (
    <>
      <Drawer
        title="Audit History"
        open={open}
        onClose={onClose}
        placement="bottom"
        height="80%"
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flexShrink: 0, padding: 12, borderBottom: `1px solid ${themeToken.colorBorderSecondary}` }}>
            <CmsAuditToolbar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              eventTypeFilter={eventTypeFilter}
              onEventTypeChange={setEventTypeFilter}
              filterOpen={false}
              onToggleFilter={() => {}}
              onClearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
              onExport={() => setExportOpen(true)}
              exportDisabled={filteredAudits.length === 0}
              token={themeToken}
              filterRef={historyFilterRef}
              isMobile
            />
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            <Row gutter={[8, 8]}>
              {paginatedData.map((audit) => (
                <div key={audit._id} style={{ width: '100%' }}>
                  <CmsAuditCard
                    audit={audit}
                    selected={false}
                    onSelect={(a) => {
                      onAuditSelect?.(a)
                      onClose()
                    }}
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
              pageSize={CMS_AUDIT_PAGE_SIZE}
              showSizeChanger={false}
              onChange={setPage}
              size="small"
            />
          </div>
        </div>
      </Drawer>

      <CmsAuditExportModal
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={handleExport}
        exportRange={exportRange}
        onRangeChange={(value) => setExportRange(value || [null, null])}
        rowCount={rowCount}
      />
    </>
  )
}
