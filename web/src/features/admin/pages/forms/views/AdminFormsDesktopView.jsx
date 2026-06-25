import { useState, useMemo } from 'react'
import { Typography, Input, theme, Row, Splitter, Pagination, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

import PermitTypeDetailPanel from '../components/PermitTypeDetailPanel'
import PermitTypeCard from '../components/PermitTypeCard'

import { PAGE_SIZE } from '../constants/forms.constants'
import { usePermitTypes } from '../hooks/usePermitTypes'

const { Text } = Typography

export default function AdminFormsDesktopView() {
  const { token } = theme.useToken()

  const { permitTypes, _loading, _refresh } = usePermitTypes()
  const [selectedPermitId, setSelectedPermitId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const filteredPermitTypes = useMemo(() => {
    if (!searchTerm) return permitTypes
    return permitTypes.filter((pt) =>
      pt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pt.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [permitTypes, searchTerm])

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredPermitTypes.slice(start, start + PAGE_SIZE)
  }, [filteredPermitTypes, page])

  const total = filteredPermitTypes.length
  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  const selectedPermitType = permitTypes.find((pt) => pt.cardId === selectedPermitId)

  const handleSelectPermit = (permitType) => {
    setSelectedPermitId(permitType.cardId)
  }

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0 }}>
        <Input
          placeholder="Search permit types..."
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: 12 }}>
        <div style={{ overflow: 'auto', flex: 1, minHeight: 0, paddingRight: 12, paddingBottom: 12, paddingLeft: 12 }}>
          {paginatedData.length === 0 ? (
            <Empty description="No permit types found" style={{ marginTop: 24 }} />
          ) : (
            <Row gutter={[12, 12]}>
              {paginatedData.map((item) => (
                <PermitTypeCard
                  key={item.cardId}
                  item={item}
                  selectedId={selectedPermitId}
                  token={token}
                  onSelect={handleSelectPermit}
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
            current={page}
            total={total}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  )

  const rightPanelContent = selectedPermitId ? (
    <PermitTypeDetailPanel key={selectedPermitId} permitType={selectedPermitType} />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">Select a permit type to view details</Text>
      </div>
    </div>
  )

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {leftPanelContent}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rightPanelContent}
      </Splitter.Panel>
    </Splitter>
  )
}
