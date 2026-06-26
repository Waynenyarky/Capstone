import { useState, useMemo, useRef, useEffect } from 'react'
import { Typography, Input, Empty, theme, Grid, Button, Tooltip, Pagination, Skeleton } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import FilterDropdown from './FilterDropdown'

const { Text } = Typography
const { useBreakpoint } = Grid

const DEFAULT_PAGE_SIZE = 20

export default function ListPanel({
  items = [],
  renderCard,
  onSelectItem,
  selectedId,
  isLoading = false,
  detailPanel: _detailPanel,
  searchPlaceholder = 'Search...',
  filterConfig = [],
  pageSize = DEFAULT_PAGE_SIZE,
}) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPosition, setFilterPosition] = useState({ top: 0, right: 0 })
  const filterButtonRef = useRef(null)
  const [page, setPage] = useState(1)

  // Initialize filter values from config
  const filterValues = useMemo(() => {
    const values = {}
    filterConfig.forEach((field) => {
      values[field.key] = field.value || null
    })
    return values
  }, [filterConfig])

  const [activeFilters, setActiveFilters] = useState(filterValues)

  useEffect(() => {
    if (filterOpen && filterButtonRef.current && !screens.xs) {
      const rect = filterButtonRef.current.getBoundingClientRect()
      setFilterPosition({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      })
    }
  }, [filterOpen, screens.xs])

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter((val) => val !== null && val !== undefined && val !== '').length
  }, [activeFilters])

  const filteredItems = useMemo(() => {
    let list = [...items]

    // Apply filters
    filterConfig.forEach((field) => {
      const value = activeFilters[field.key]
      if (value !== null && value !== undefined && value !== '') {
        list = list.filter((item) => {
          const itemValue = item[field.key]
          return String(itemValue) === String(value)
        })
      }
    })

    // Apply search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) => {
        const searchableFields = Object.keys(item)
        return searchableFields.some((key) => {
          const value = item[key]
          return value && String(value).toLowerCase().includes(q)
        })
      })
    }

    return list
  }, [items, activeFilters, search, filterConfig])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredItems.slice(start, end)
  }, [filteredItems, page, pageSize])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [activeFilters, search])

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearAllFilters = () => {
    const cleared = {}
    filterConfig.forEach((field) => {
      cleared[field.key] = null
    })
    setActiveFilters(cleared)
  }

  const filterFields = filterConfig.map((field) => ({
    key: field.key,
    label: field.label,
    placeholder: field.placeholder,
    value: activeFilters[field.key],
    onChange: (value) => handleFilterChange(field.key, value),
    options: field.options,
    disabled: field.disabled,
  }))

  const listContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '12px 12px 0 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        {filterConfig.length > 0 && (
          <div style={{ position: 'relative' }}>
            <Tooltip title="Filter">
              <Button
                ref={filterButtonRef}
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={() => setFilterOpen(!filterOpen)}
                aria-label="Toggle filters"
              />
            </Tooltip>
            <FilterDropdown
              open={filterOpen}
              onClose={() => setFilterOpen(false)}
              filterFields={filterFields}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClearAllFilters}
              position={filterPosition}
            />
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 12px 12px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ 
                padding: '16px', 
                border: `1px solid ${token.colorBorderSecondary}`, 
                borderRadius: '8px',
                backgroundColor: token.colorBgContainer
              }}>
                {/* Title with bookmark space */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Skeleton.Input active style={{ width: '60%' }} />
                  <Skeleton.Button active size="small" style={{ width: 16, height: 16 }} />
                </div>
                {/* Description */}
                <Skeleton.Input active size="small" style={{ width: '100%', marginBottom: 8 }} />
                <Skeleton.Input active size="small" style={{ width: '100%', marginBottom: 12 }} />
                {/* Meta info */}
                <Skeleton.Input active size="small" style={{ width: '50%', marginBottom: 12 }} />
                {/* Tags with separator */}
                <div style={{ paddingTop: 12, borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 8 }}>
                  <Skeleton.Button active size="small" style={{ width: 60 }} />
                  <Skeleton.Button active size="small" style={{ width: 50 }} />
                  <Skeleton.Button active size="small" style={{ width: 70 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Empty
            description="No items found"
            style={{ marginTop: 48 }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginatedItems.map((item, _idx) => {
              if (renderCard) {
                return renderCard(item, selectedId, onSelectItem)
              }
              return null
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
          Showing {paginatedItems.length} out of {filteredItems.length}
        </Text>
        <Pagination
          current={page}
          total={filteredItems.length}
          pageSize={pageSize}
          showSizeChanger={false}
          onChange={setPage}
          size="small"
        />
      </div>
    </div>
  )

  // Render list only (split layout is handled by SplitLayout)
  return listContent
}
