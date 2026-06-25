import { useState, useMemo } from 'react'
import { Typography, Input, theme, List, Empty, Drawer, Space, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

import PermitTypeDetailPanel from '../components/PermitTypeDetailPanel'
import PermitTypeCard from '../components/PermitTypeCard'

import { PAGE_SIZE } from '../constants/forms.constants'
import { usePermitTypes } from '../hooks/usePermitTypes'

const { Text } = Typography

export default function AdminFormsMobileView() {
  const { token } = theme.useToken()

  const { permitTypes, _loading, _refresh } = usePermitTypes()
  const [selectedPermitId, setSelectedPermitId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [_page, _setPage] = useState(1)

  const filteredPermitTypes = useMemo(() => {
    if (!searchTerm) return permitTypes
    return permitTypes.filter((pt) =>
      pt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pt.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [permitTypes, searchTerm])

  const paginatedData = useMemo(() => {
    const start = (_page - 1) * PAGE_SIZE
    return filteredPermitTypes.slice(start, start + PAGE_SIZE)
  }, [filteredPermitTypes, _page])

  const _total = filteredPermitTypes.length

  const selectedPermitType = permitTypes.find((pt) => pt.cardId === selectedPermitId)

  const handleSelectPermit = (permitType) => {
    setSelectedPermitId(permitType.cardId)
  }

  const rightPanelContent = selectedPermitId ? (
    <PermitTypeDetailPanel key={selectedPermitId} permitType={selectedPermitType} isMobile />
  ) : null

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        placeholder="Search permit types..."
        prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
        allowClear
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {paginatedData.length === 0 ? (
        <Empty description="No permit types found" />
      ) : (
        <List
          grid={{ gutter: 12, column: 1 }}
          dataSource={paginatedData}
          renderItem={(item) => (
            <List.Item>
              <PermitTypeCard
                item={item}
                selectedId={selectedPermitId}
                token={token}
                onSelect={handleSelectPermit}
              />
            </List.Item>
          )}
        />
      )}
      <Drawer
        open={!!selectedPermitId}
        onClose={() => setSelectedPermitId(null)}
        title={
          <Space>
            <span>Form Details</span>
            <Tag color="success" style={{ fontWeight: 'normal' }}>
              Saved
            </Tag>
          </Space>
        }
        placement="right"
        width="100%"
        bodyStyle={{ padding: 0 }}
      >
        {rightPanelContent}
      </Drawer>
    </div>
  )
}
