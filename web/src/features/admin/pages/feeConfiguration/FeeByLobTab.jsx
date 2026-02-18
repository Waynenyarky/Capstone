import React, { useState, useMemo, useEffect } from 'react'
import { Table, Button, Tag, Typography, Splitter, Modal, Pagination, Input, Select, Tooltip, Dropdown, theme } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { LINE_OF_BUSINESS_BY_CATEGORY } from '@/constants/lineOfBusiness.js'
import FeeConfigDetailPanel from './FeeConfigDetailPanel'

const { Text } = Typography
const PAGE_SIZE = 20

/** Turn snake_case LOB key into a readable label (e.g. electronic_electrical_store → Electronic electrical store). */
function formatLineOfBusinessLabel(lob) {
  if (lob == null || typeof lob !== 'string') return lob ?? '—'
  return lob
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function resolveTaxCode(record) {
  if (record.taxCode) return record.taxCode
  return LINE_OF_BUSINESS_BY_CATEGORY[record.lineOfBusiness]?.taxCode || '—'
}

export default function FeeByLobTab({
  configs = [],
  loading,
  onSave,
  onDelete,
  saving,
  selectedConfigId,
  setSelectedConfigId,
}) {
  const { token } = theme.useToken()
  const [modal, contextHolder] = Modal.useModal()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [taxCodeFilter, setTaxCodeFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const selectedConfig =
    selectedConfigId === 'new'
      ? { _id: null }
      : configs.find((c) => (c._id || c.id) === selectedConfigId) || null

  const taxCodeOptions = useMemo(() => {
    const codes = [...new Set((configs || []).map(resolveTaxCode).filter((c) => c && c !== '—'))]
    return codes.sort().map((tc) => ({ value: tc, label: tc }))
  }, [configs])

  const filteredConfigs = useMemo(() => {
    let list = configs || []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((rec) => {
        const tc = (resolveTaxCode(rec) || '').toLowerCase()
        const lobLabel = LINE_OF_BUSINESS_BY_CATEGORY[rec.lineOfBusiness]?.label || formatLineOfBusinessLabel(rec.lineOfBusiness) || ''
        const lob = lobLabel.toLowerCase()
        return tc.includes(q) || lob.includes(q)
      })
    }
    if (taxCodeFilter) {
      list = list.filter((rec) => resolveTaxCode(rec) === taxCodeFilter)
    }
    return list
  }, [configs, search, taxCodeFilter])

  const paginatedConfigs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredConfigs.slice(start, start + PAGE_SIZE)
  }, [filteredConfigs, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, taxCodeFilter, configs?.length])

  const activeFilterCount = taxCodeFilter ? 1 : 0

  const columns = [
    {
      title: 'Tax Code',
      key: 'taxCode',
      width: 80,
      render: (_, record) => <Tag>{resolveTaxCode(record)}</Tag>,
    },
    {
      title: 'Line of Business',
      dataIndex: 'lineOfBusiness',
      key: 'lineOfBusiness',
      render: (v) => {
        const entry = LINE_OF_BUSINESS_BY_CATEGORY[v]
        if (entry) return entry.label
        // Format snake_case to readable label when not in LINE_OF_BUSINESS constant
        return formatLineOfBusinessLabel(v)
      },
    },
    {
      title: 'Fee',
      dataIndex: 'mayorsPermitFee',
      key: 'mayorsPermitFee',
      width: 100,
      render: (v) => (v != null ? `₱${Number(v).toLocaleString()}` : '—'),
    },
    {
      title: 'Brackets',
      dataIndex: 'brackets',
      key: 'brackets',
      width: 90,
      render: (brackets) => (brackets?.length ? `${brackets.length}` : '—'),
    },
  ]

  const handleDelete = (id) => {
    modal.confirm({
      title: 'Delete this fee configuration?',
      icon: <ExclamationCircleOutlined />,
      content:
        'This action cannot be undone. If this is the last active configuration for this line of business, it will be deactivated instead.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await onDelete(id)
        setSelectedConfigId?.(null)
      },
    })
  }

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: 12,
          paddingBottom: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by line of business or tax code"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Dropdown
            open={filterOpen}
            onOpenChange={setFilterOpen}
            trigger={['click']}
            placement="bottomRight"
            popupRender={() => (
              <div
                style={{
                  padding: '16px 20px',
                  background: token.colorBgElevated,
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: token.boxShadowSecondary,
                  minWidth: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13 }}>Filters</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    onClick={() => setFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Tax code</Text>
                  <Select
                    placeholder="All tax codes"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={taxCodeFilter}
                    onChange={setTaxCodeFilter}
                    style={{ width: '100%' }}
                    options={taxCodeOptions}
                    size="small"
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setTaxCodeFilter(null)}
                    style={{ alignSelf: 'flex-start', padding: 0 }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          >
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                aria-label="Toggle filters"
              />
            </Tooltip>
          </Dropdown>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid #f0f0f0', borderTop: '1px solid #f0f0f0', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey={(r) => r._id || r.id}
            columns={columns}
            dataSource={paginatedConfigs}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Text type="secondary">No fee configurations. Add a line of business.</Text> }}
            rowClassName={(rec) =>
              (rec._id || rec.id) === selectedConfigId ? 'fee-config-row-selected' : ''
            }
            onRow={(rec) => ({
              onClick: () => setSelectedConfigId?.((rec._id || rec.id)),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredConfigs?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.fee-config-row-selected > td {
          background: #e6f4ff !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  return (
    <>
      {contextHolder}
      <Splitter style={{ height: '100%', minHeight: 400 }}>
        <Splitter.Panel min="25%" defaultSize="30%" style={{ overflow: 'hidden' }}>
          {tableContent}
        </Splitter.Panel>
        <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <FeeConfigDetailPanel
            config={selectedConfig}
            configs={configs}
            saving={saving}
            onSave={onSave}
            onDelete={onDelete ? handleDelete : undefined}
          />
        </Splitter.Panel>
      </Splitter>
    </>
  )
}
