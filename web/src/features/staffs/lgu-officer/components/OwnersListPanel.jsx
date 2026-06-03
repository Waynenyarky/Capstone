import { useState, useMemo, useEffect } from 'react'
import { Table, Pagination, Input, Button, Tooltip, Typography, Tag, Empty, theme } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'

const PAGE_SIZE = 20
const { Text } = Typography

export default function OwnersListPanel({
  owners = [],
  isLoading = false,
  selectedOwner,
  onSelectOwner,
  onRegisterOwner,
  ownerSearch,
  setOwnerSearch,
}) {
  const { token } = theme.useToken()
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [ownerSearch])

  // Paginate
  const paginatedOwners = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return owners.slice(start, start + PAGE_SIZE)
  }, [owners, currentPage])

  const columns = [
    {
      title: 'Status',
      key: 'status',
      width: 80,
      render: (_, rec) => (
        rec?.isActive !== false 
          ? <Tag color="green">Active</Tag> 
          : <Tag color="orange">Pending</Tag>
      ),
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, rec) => [rec?.firstName, rec?.lastName].filter(Boolean).join(' ') || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (val) => val || '—',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search + Register */}
      <div style={{ 
        flexShrink: 0, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        padding: 12, 
        borderBottom: `1px solid ${token.colorBorderSecondary}` 
      }}>
        <Input
          placeholder="Search owners (min 2 chars)..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={ownerSearch}
          onChange={(e) => setOwnerSearch(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Tooltip title="Register New Owner">
          <Button icon={<PlusOutlined />} onClick={onRegisterOwner}>
            Register
          </Button>
        </Tooltip>
      </div>

      {/* Table */}
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        ['--row-selected-bg']: token.colorPrimaryBg,
      }}>
        <div style={{ 
          flex: 1, 
          minHeight: 0, 
          overflow: 'auto',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Table
            rowKey="_id"
            size="small"
            columns={columns}
            dataSource={paginatedOwners}
            loading={isLoading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ 
              emptyText: (
                <Empty 
                  description={ownerSearch?.length >= 2 ? "No owners found" : "Type at least 2 characters to search"} 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                />
              ) 
            }}
            rowClassName={(rec) => rec?._id === selectedOwner?._id ? 'owner-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => onSelectOwner(rec),
              style: { cursor: 'pointer' },
            })}
          />
        </div>

        {/* Pagination */}
        {owners.length > PAGE_SIZE && (
          <div style={{ padding: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              current={currentPage}
              total={owners.length}
              pageSize={PAGE_SIZE}
              showSizeChanger={false}
              onChange={setCurrentPage}
              size="small"
            />
          </div>
        )}
      </div>

      <style>{`
        .ant-table-tbody > tr.owner-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
