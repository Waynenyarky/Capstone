import React from 'react'
import { Typography, Empty, Card, Row, Col, Pagination } from 'antd'
import MaintenanceRequestCard from './MaintenanceRequestCard.jsx'

const { Text } = Typography

export default function MaintenanceRequestList({ requests, selectedId, onSelect, paginatedRequests, total, page, pageSize, onPageChange, loading, token }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0, padding: 12 }}>
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
