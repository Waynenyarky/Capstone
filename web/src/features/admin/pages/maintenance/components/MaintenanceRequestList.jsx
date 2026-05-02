import React from 'react'
import { Typography, Empty, Row, Pagination, Grid } from 'antd'
import MaintenanceRequestCard from './MaintenanceRequestCard.jsx'

const { Text } = Typography
const { useBreakpoint } = Grid

export default function MaintenanceRequestList({ selectedId, onSelect, paginatedRequests, total, page, pageSize, onPageChange, loading, token, style }) {
  const screens = useBreakpoint()
  const isLg = screens.lg

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
      <div style={{ flex: 1, minHeight: 0,  display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflow: 'auto', flex: 1, minHeight: 0, paddingRight: isLg ? 12 : 0, paddingBottom: isLg ? 12 : 0, paddingLeft: isLg ? 12 : 0 }}>
          {loading ? null : paginatedRequests.length === 0 ? (
            <Empty description="No matching maintenance requests" style={{ marginTop: 24 }} />
          ) : (
            <Row gutter={[12, 12]}>
              {paginatedRequests.map((rec) => (
                <MaintenanceRequestCard
                  key={rec.approvalId}
                  approval={rec}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  token={token}
                />
              ))}
            </Row>
          )}
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
            Showing {paginatedRequests.length} out of {total}
          </Text>
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            showSizeChanger={false}
            onChange={onPageChange}
            size="small"
          />
        </div>
      </div>
    </div>
  )
}
