import React from 'react'
import { Row, Empty, Pagination, Typography } from 'antd'
import { PAGE_SIZE } from '../constants/contentManagement.constants'
import ContentItemCard from './ContentItemCard.jsx'

const { Text } = Typography

export default function ContentItemList({
  items,
  loading,
  selectedId,
  onSelect,
  currentPage,
  onPageChange,
  total,
  token,
  style,
  contentType,
}) {
  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, total)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ overflow: 'auto', flex: 1, minHeight: 0, paddingRight: 12, paddingBottom: 12, paddingLeft: 12 }}>
        {loading ? null : paginatedItems.length === 0 ? (
          <Empty description="No items found" style={{ marginTop: 24 }} />
        ) : (
          <Row gutter={[12, 12]}>
            {paginatedItems.map((item) => (
              <ContentItemCard
                key={item._id || item.slotId}
                item={item}
                selectedId={selectedId}
                onSelect={onSelect}
                token={token}
                contentType={contentType}
              />
            ))}
          </Row>
        )}
      </div>
      <div style={{ padding: '12px 12px 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Showing {startItem}-{endItem} of {total}
        </Text>
        <Pagination
          current={currentPage}
          total={total}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
          onChange={onPageChange}
          size="small"
        />
      </div>
    </div>
  )
}
