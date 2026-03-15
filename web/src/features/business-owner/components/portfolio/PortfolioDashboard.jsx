import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Badge, 
  Table, 
  Input, 
  Select, 
  Tag, 
  Progress, 
  Statistic,
  Tooltip,
  Avatar,
  Divider,
  Checkbox
} from 'antd';
import {
  ShopOutlined,
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  BarChartOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../../hooks/useAuth';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const PortfolioDashboard = () => {
  const { user } = useAuth();
  const { businesses, loading, updateBusinessProfile } = useBusiness();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or table

  // Filter businesses based on search and status
  const filteredBusinesses = businesses?.filter(business => {
    const matchesSearch = business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.businessType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || business.applicationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate portfolio statistics
  const portfolioStats = {
    total: businesses?.length || 0,
    active: businesses?.filter(b => b.applicationStatus === 'approved' || b.applicationStatus === 'active').length || 0,
    pending: businesses?.filter(b => b.applicationStatus === 'pending').length || 0,
    expired: businesses?.filter(b => b.applicationStatus === 'expired').length || 0,
    totalRevenue: businesses?.reduce((sum, b) => sum + (b.totalPayments || 0), 0) || 0,
    upcomingInspections: businesses?.reduce((sum, b) => sum + (b.pendingInspections || 0), 0) || 0
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      approved: { color: 'success', icon: <CheckCircleOutlined />, text: 'Active' },
      active: { color: 'success', icon: <CheckCircleOutlined />, text: 'Active' },
      pending: { color: 'processing', icon: <ClockCircleOutlined />, text: 'Pending' },
      expired: { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Expired' },
      suspended: { color: 'warning', icon: <AlertOutlined />, text: 'Suspended' }
    };
    return configs[status] || { color: 'default', icon: <ClockCircleOutlined />, text: 'Unknown' };
  };

  // Handle business selection
  const handleBusinessSelect = (businessId, selected) => {
    if (selected) {
      setSelectedBusinesses(prev => [...prev, businessId]);
    } else {
      setSelectedBusinesses(prev => prev.filter(id => id !== businessId));
    }
  };

  // Handle bulk operations
  const handleBulkAction = async (action) => {
    try {
      // Implement bulk operations based on action type
      switch (action) {
        case 'renew':
          // Bulk renewal logic
          console.log('Bulk renewal for:', selectedBusinesses);
          break;
        case 'suspend':
          // Bulk suspension logic
          console.log('Bulk suspension for:', selectedBusinesses);
          break;
        case 'export':
          // Bulk export logic
          console.log('Bulk export for:', selectedBusinesses);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  // Table columns
  const tableColumns = [
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <Space>
          <Avatar icon={<ShopOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.businessType}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'applicationStatus',
      key: 'status',
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Permit #',
      dataIndex: 'permitNumber',
      key: 'permitNumber',
      render: (permit) => (
        <Text code>{permit || 'N/A'}</Text>
      )
    },
    {
      title: 'Revenue',
      dataIndex: 'totalPayments',
      key: 'revenue',
      render: (revenue) => (
        <Text strong>₱{(revenue || 0).toLocaleString()}</Text>
      )
    },
    {
      title: 'Inspections',
      dataIndex: 'pendingInspections',
      key: 'inspections',
      render: (count) => (
        <Badge count={count || 0} showZero>
          <CalendarOutlined />
        </Badge>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Analytics">
            <Button type="text" icon={<BarChartOutlined />} size="small" />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="portfolio-dashboard" data-testid="portfolio-dashboard">
      {/* Header */}
      <div style={{ marginBottom: '24px' }} data-testid="portfolio-header">
        <Title level={2} data-testid="portfolio-title">
          <ShopOutlined /> Business Portfolio
        </Title>
        <Paragraph type="secondary">
          Manage and monitor all your businesses from one central dashboard
        </Paragraph>
      </div>

      {/* Portfolio Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} data-testid="portfolio-stats">
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="total-businesses-stat">
            <Statistic
              title="Total Businesses"
              value={portfolioStats.total}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="active-businesses-stat">
            <Statistic
              title="Active"
              value={portfolioStats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="pending-businesses-stat">
            <Statistic
              title="Pending"
              value={portfolioStats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card data-testid="total-revenue-stat">
            <Statistic
              title="Total Revenue"
              value={portfolioStats.totalRevenue}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Controls */}
      <Card style={{ marginBottom: '24px' }} data-testid="filters-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search businesses..."
              allowClear
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="business-search-input"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              data-testid="status-filter"
            >
              <Option value="all">All Status</Option>
              <Option value="approved">Active</Option>
              <Option value="pending">Pending</Option>
              <Option value="expired">Expired</Option>
              <Option value="suspended">Suspended</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              data-testid="add-business-button"
            >
              Add Business
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<ShopOutlined />}
                onClick={() => setViewMode('grid')}
                data-testid="grid-view-button"
              >
                Grid
              </Button>
              <Button
                type={viewMode === 'table' ? 'primary' : 'default'}
                icon={<BarChartOutlined />}
                onClick={() => setViewMode('table')}
                data-testid="table-view-button"
              >
                Table
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Bulk Actions */}
        {selectedBusinesses.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }} data-testid="bulk-actions">
            <Space>
              <Text strong data-testid="selected-count">{selectedBusinesses.length} businesses selected</Text>
              <Button size="small" onClick={() => handleBulkAction('renew')} data-testid="bulk-renew-button">
                Bulk Renew
              </Button>
              <Button size="small" onClick={() => handleBulkAction('suspend')} data-testid="bulk-suspend-button">
                Bulk Suspend
              </Button>
              <Button size="small" onClick={() => handleBulkAction('export')} data-testid="bulk-export-button">
                Export Data
              </Button>
              <Button size="small" onClick={() => setSelectedBusinesses([])} data-testid="clear-selection-button">
                Clear Selection
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* Business Display */}
      {viewMode === 'grid' ? (
        <Row gutter={[16, 16]} data-testid="business-grid">
          {filteredBusinesses.map(business => {
            const statusConfig = getStatusConfig(business.applicationStatus);
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={business.id}>
                <Card
                  hoverable
                  className="business-card"
                  data-testid="business-card"
                  data-business-id={business.id}
                  data-business-status={business.applicationStatus}
                  actions={[
                    <EyeOutlined key="view" />,
                    <EditOutlined key="edit" />,
                    <BarChartOutlined key="analytics" />
                  ]}
                  extra={
                    <Checkbox
                      checked={selectedBusinesses.includes(business.id)}
                      onChange={(e) => handleBusinessSelect(business.id, e.target.checked)}
                      data-testid="business-checkbox"
                    />
                  }
                >
                  <Card.Meta
                    avatar={<Avatar icon={<ShopOutlined />} />}
                    title={
                      <Space>
                        <Text strong data-testid="business-name">{business.businessName}</Text>
                        <Tag color={statusConfig.color} icon={statusConfig.icon} data-testid="business-status-tag">
                          {statusConfig.text}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">{business.businessType}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {business.address}
                        </Text>
                        <Divider style={{ margin: '8px 0' }} />
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">Permit:</Text>
                            <Text code>{business.permitNumber || 'N/A'}</Text>
                          </div>
                          <div>
                            <Text type="secondary">Revenue:</Text>
                            <Text strong>₱{(business.totalPayments || 0).toLocaleString()}</Text>
                          </div>
                          <div>
                            <Text type="secondary">Inspections:</Text>
                            <Badge count={business.pendingInspections || 0} showZero>
                              <CalendarOutlined />
                            </Badge>
                          </div>
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Table
          columns={tableColumns}
          dataSource={filteredBusinesses}
          rowKey="id"
          loading={loading}
          data-testid="business-table"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} businesses`
          }}
        />
      )}

      {/* Empty State */}
      {filteredBusinesses.length === 0 && !loading && (
        <Card style={{ textAlign: 'center', padding: '48px' }} data-testid="empty-state">
          <ShopOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={4} type="secondary">
            No businesses found
          </Title>
          <Paragraph type="secondary">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first business'
            }
          </Paragraph>
          <Button type="primary" icon={<PlusOutlined />} data-testid="add-first-business-button">
            Add Your First Business
          </Button>
        </Card>
      )}
    </div>
  );
};

export default PortfolioDashboard;
