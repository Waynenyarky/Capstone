import React from 'react'
import { Card, Space, Button, Input, Select, DatePicker, Row, Col, Typography } from 'antd'
import { FilterOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons'

const { Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const cardStyle = { marginBottom: 16, background: '#fafafa' }

/**
 * Filter section for permit application lists.
 * @param {'registration' | 'renewal'} variant - Which tab's filters to render
 * @param {object} filters - Current filter values (registrationFilters or renewalFilters)
 * @param {function} onFiltersChange - (nextFilters) => void
 * @param {function} onClear - () => void
 * @param {boolean} hasActive - Whether any filter is set (shows Clear All)
 * @param {number[]} [renewalYears] - For variant='renewal', unique years for dropdown
 */
export default function PermitApplicationFilters({
  variant,
  filters,
  onFiltersChange,
  onClear,
  hasActive,
  renewalYears = []
}) {
  const isRegistration = variant === 'registration'

  const title = (
    <Space>
      <FilterOutlined />
      <Text strong>Filters</Text>
      {hasActive && (
        <Button type="link" size="small" icon={<ClearOutlined />} onClick={onClear}>
          Clear All
        </Button>
      )}
    </Space>
  )

  if (isRegistration) {
    return (
      <Card size="small" style={cardStyle} title={title}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search Business Name"
              prefix={<SearchOutlined />}
              value={filters.businessName}
              onChange={(e) => onFiltersChange({ ...filters, businessName: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search Business ID"
              prefix={<SearchOutlined />}
              value={filters.businessId}
              onChange={(e) => onFiltersChange({ ...filters, businessId: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search Reference Number"
              prefix={<SearchOutlined />}
              value={filters.referenceNumber}
              onChange={(e) => onFiltersChange({ ...filters, referenceNumber: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['From date', 'To date']}
              value={filters.dateRange}
              onChange={(dates) => onFiltersChange({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by primary business"
              allowClear
              value={filters.isPrimary}
              onChange={(value) => onFiltersChange({ ...filters, isPrimary: value })}
            >
              <Option value={true}>Primary Only</Option>
              <Option value={false}>Non-Primary Only</Option>
            </Select>
          </Col>
        </Row>
      </Card>
    )
  }

  // Renewal variant
  return (
    <Card size="small" style={cardStyle} title={title}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search Business Name"
            prefix={<SearchOutlined />}
            value={filters.businessName}
            onChange={(e) => onFiltersChange({ ...filters, businessName: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search Business ID"
            prefix={<SearchOutlined />}
            value={filters.businessId}
            onChange={(e) => onFiltersChange({ ...filters, businessId: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search Reference Number"
            prefix={<SearchOutlined />}
            value={filters.referenceNumber}
            onChange={(e) => onFiltersChange({ ...filters, referenceNumber: e.target.value })}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Renewal Year"
            allowClear
            value={filters.renewalYear}
            onChange={(value) => onFiltersChange({ ...filters, renewalYear: value })}
          >
            {renewalYears.map((year) => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Renewal Status"
            allowClear
            value={filters.renewalStatus}
            onChange={(value) => onFiltersChange({ ...filters, renewalStatus: value })}
          >
            <Option value="draft">Draft</Option>
            <Option value="pending">Pending for Approval</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="Payment Status"
            allowClear
            value={filters.paymentStatus}
            onChange={(value) => onFiltersChange({ ...filters, paymentStatus: value })}
          >
            <Option value="paid">Paid</Option>
            <Option value="pending">Payment Pending</Option>
            <Option value="failed">Payment Failed</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['From date', 'To date']}
            value={filters.dateRange}
            onChange={(dates) => onFiltersChange({ ...filters, dateRange: dates })}
          />
        </Col>
      </Row>
    </Card>
  )
}
