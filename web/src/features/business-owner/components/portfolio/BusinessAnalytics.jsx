import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  DatePicker,
  Space,
  Table,
  Progress,
  Statistic,
  Divider,
  Tooltip,
  Button,
  Tag
} from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShopOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useBusiness } from '../../../../hooks/useBusiness';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BusinessAnalytics = () => {
  const { businesses, loading } = useBusiness();
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [chartType, setChartType] = useState('revenue');

  // Mock analytics data - in real implementation, this would come from API
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [
      { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000 },
      { month: 'Feb', revenue: 52000, expenses: 31000, profit: 21000 },
      { month: 'Mar', revenue: 48000, expenses: 29000, profit: 19000 },
      { month: 'Apr', revenue: 61000, expenses: 35000, profit: 26000 },
      { month: 'May', revenue: 55000, expenses: 32000, profit: 23000 },
      { month: 'Jun', revenue: 67000, expenses: 38000, profit: 29000 }
    ],
    businessPerformance: [
      { name: 'Restaurant', revenue: 125000, growth: 12.5, status: 'active' },
      { name: 'Retail Store', revenue: 89000, growth: 8.2, status: 'active' },
      { name: 'Service Center', revenue: 67000, growth: -2.1, status: 'active' },
      { name: 'Online Shop', revenue: 45000, growth: 25.3, status: 'pending' }
    ],
    complianceMetrics: [
      { category: 'Permits', completed: 8, total: 10, percentage: 80 },
      { category: 'Inspections', completed: 12, total: 15, percentage: 80 },
      { category: 'Payments', completed: 45, total: 48, percentage: 94 },
      { category: 'Documents', completed: 23, total: 25, percentage: 92 }
    ],
    revenueDistribution: [
      { name: 'Restaurant', value: 45, color: '#1890ff' },
      { name: 'Retail Store', value: 32, color: '#52c41a' },
      { name: 'Service Center', value: 15, color: '#faad14' },
      { name: 'Online Shop', value: 8, color: '#f5222d' }
    ]
  });

  // Calculate key metrics
  const keyMetrics = {
    totalRevenue: analyticsData.revenue.reduce((sum, item) => sum + item.revenue, 0),
    totalExpenses: analyticsData.revenue.reduce((sum, item) => sum + item.expenses, 0),
    totalProfit: analyticsData.revenue.reduce((sum, item) => sum + item.profit, 0),
    averageGrowth: analyticsData.businessPerformance.reduce((sum, item) => sum + item.growth, 0) / analyticsData.businessPerformance.length,
    complianceRate: analyticsData.complianceMetrics.reduce((sum, item) => sum + item.percentage, 0) / analyticsData.complianceMetrics.length
  };

  // Performance table columns
  const performanceColumns = [
    {
      title: 'Business Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => <Text>₱{revenue.toLocaleString()}</Text>
    },
    {
      title: 'Growth',
      dataIndex: 'growth',
      key: 'growth',
      render: (growth) => (
        <Space>
          {growth > 0 ? (
            <TrendingUpOutlined style={{ color: '#52c41a' }} />
          ) : (
            <TrendingDownOutlined style={{ color: '#f5222d' }} />
          )}
          <Text style={{ color: growth > 0 ? '#52c41a' : '#f5222d' }}>
            {Math.abs(growth)}%
          </Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'processing'}>
          {status}
        </Tag>
      )
    }
  ];

  // Handle export
  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="business-analytics">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BarChartOutlined /> Business Analytics
        </Title>
        <Paragraph type="secondary">
          Comprehensive insights into your business portfolio performance
        </Paragraph>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Select Business"
              value={selectedBusiness}
              onChange={setSelectedBusiness}
              style={{ width: '100%' }}
            >
              <Option value="all">All Businesses</Option>
              {businesses?.map(business => (
                <Option key={business.id} value={business.id}>
                  {business.businessName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: '100%' }}
            >
              <Option value="revenue">Revenue Analysis</Option>
              <Option value="performance">Performance</Option>
              <Option value="compliance">Compliance</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              block
            >
              Export
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={keyMetrics.totalRevenue}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={keyMetrics.totalExpenses}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Net Profit"
              value={keyMetrics.totalProfit}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `₱${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Growth"
              value={keyMetrics.averageGrowth}
              prefix={<TrendingUpOutlined />}
              precision={1}
              suffix="%"
              valueStyle={{ color: keyMetrics.averageGrowth > 0 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Revenue Trend" extra={<LineChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#f5222d" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Revenue Distribution" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.revenueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Business Performance Table */}
      <Card title="Business Performance" style={{ marginBottom: '24px' }}>
        <Table
          columns={performanceColumns}
          dataSource={analyticsData.businessPerformance}
          rowKey="name"
          pagination={false}
          loading={loading}
        />
      </Card>

      {/* Compliance Metrics */}
      <Card title="Compliance Metrics">
        <Row gutter={[16, 16]}>
          {analyticsData.complianceMetrics.map((metric, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Progress
                  type="circle"
                  percent={metric.percentage}
                  format={(percent) => `${percent}%`}
                  strokeColor={metric.percentage >= 90 ? '#52c41a' : metric.percentage >= 70 ? '#faad14' : '#f5222d'}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>{metric.category}</Text>
                  <br />
                  <Text type="secondary">
                    {metric.completed} of {metric.total} completed
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default BusinessAnalytics;
