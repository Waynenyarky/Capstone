import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Select, DatePicker, Space, Typography, message, Alert } from 'antd';
import { TrendingUpOutlined, TrendingDownOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import { getPaymentAnalytics, getPaymentTrends, getCostOptimizationSuggestions } from '../../services/paymentService';
import { useBusiness } from '@/hooks/useBusiness';
import { useDebounce, usePerformanceMonitor } from '../../utils/performanceHooks.jsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentAnalytics = () => {
  const { business } = useBusiness();
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly');

  // Performance monitoring
  const { getMetrics } = usePerformanceMonitor('PaymentAnalytics');

  // Debounced timeframe changes to prevent excessive API calls
  const debouncedTimeframe = useDebounce(timeframe, 500);

  // Memoized chart data processing
  const processedTrends = useMemo(() => {
    if (!trends.length) return [];
    
    return trends.map(item => ({
      ...item,
      amount: parseFloat(item.amount || 0),
      count: parseInt(item.count || 0)
    }));
  }, [trends]);

  // Memoized payment distribution data
  const paymentDistribution = useMemo(() => {
    if (!analytics?.paymentDistribution) return [];
    
    return analytics.paymentDistribution.map((item, index) => ({
      ...item,
      value: parseFloat(item.value || 0)
    }));
  }, [analytics?.paymentDistribution]);

  // Memoized method breakdown data
  const methodBreakdown = useMemo(() => {
    if (!analytics?.methodBreakdown) return [];
    
    return analytics.methodBreakdown.map(item => ({
      ...item,
      count: parseInt(item.count || 0)
    }));
  }, [analytics?.methodBreakdown]);

  // Memoized status breakdown data
  const statusBreakdown = useMemo(() => {
    if (!analytics?.statusBreakdown) return [];
    
    return analytics.statusBreakdown.map(item => ({
      ...item,
      count: parseInt(item.count || 0)
    }));
  }, [analytics?.statusBreakdown]);

  // Optimized data fetching
  const fetchAnalytics = useCallback(async () => {
    if (!business?.id) return;
    
    setLoading(true);
    try {
      const [analyticsData, trendsData, suggestionsData] = await Promise.all([
        getPaymentAnalytics(business.id),
        getPaymentTrends(business.id, { timeframe: debouncedTimeframe }),
        getCostOptimizationSuggestions(business.id)
      ]);
      
      setAnalytics(analyticsData);
      setTrends(trendsData?.trends || []);
      setSuggestions(suggestionsData?.suggestions || []);
    } catch (error) {
      message.error('Failed to fetch payment analytics.');
    } finally {
      setLoading(false);
    }
  }, [business?.id, debouncedTimeframe]);

  // Memoized chart configurations
  const lineChartConfig = useMemo(() => ({
    data: processedTrends,
    xField: 'period',
    yField: 'amount',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  }), [processedTrends]);

  const pieChartConfig = useMemo(() => ({
    data: paymentDistribution,
    angleField: 'value',
    colorField: 'name',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'pie-legend-active' }, { type: 'element-active' }],
  }), [paymentDistribution]);

  const columnChartConfig = useMemo(() => ({
    data: methodBreakdown,
    xField: 'method',
    yField: 'count',
    columnWidthRatio: 0.8,
    meta: {
      count: {
        alias: 'Count',
      },
    },
  }), [methodBreakdown]);

  const statusColumnConfig = useMemo(() => ({
    data: statusBreakdown,
    xField: 'status',
    yField: 'count',
    columnWidthRatio: 0.8,
    meta: {
      count: {
        alias: 'Count',
      },
    },
  }), [statusBreakdown]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUpOutlined style={{ color: '#52c41a' }} />;
    if (trend < 0) return <TrendingDownOutlined style={{ color: '#f5222d' }} />;
    return null;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return '#52c41a';
    if (trend < 0) return '#f5222d';
    return '#1890ff';
  };

  if (!analytics) {
    return <Card loading={true} title="Payment Analytics" />;
  }

  return (
    <Card loading={loading} title="Payment Analytics">
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={timeframe}
          onChange={setTimeframe}
          style={{ width: 150 }}
        >
          <Option value="daily">Daily</Option>
          <Option value="weekly">Weekly</Option>
          <Option value="monthly">Monthly</Option>
          <Option value="yearly">Yearly</Option>
        </Select>
        <RangePicker onChange={setDateRange} />
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={analytics.totalPayments}
              prefix={<DollarOutlined />}
              suffix={
                <Space>
                  {getTrendIcon(analytics.paymentTrend)}
                  <Text style={{ color: getTrendColor(analytics.paymentTrend) }}>
                    {analytics.paymentTrend > 0 ? '+' : ''}{analytics.paymentTrend}%
                  </Text>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Payment"
              value={analytics.averagePayment}
              precision={2}
              prefix="$"
              suffix={
                <Space>
                  {getTrendIcon(analytics.averageTrend)}
                  <Text style={{ color: getTrendColor(analytics.averageTrend) }}>
                    {analytics.averageTrend > 0 ? '+' : ''}{analytics.averageTrend}%
                  </Text>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="On-Time Rate"
              value={analytics.onTimeRate}
              suffix="%"
              prefix={<CalendarOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Space>
                {getTrendIcon(analytics.onTimeTrend)}
                <Text style={{ color: getTrendColor(analytics.onTimeTrend) }}>
                  {analytics.onTimeTrend > 0 ? '+' : ''}{analytics.onTimeTrend}%
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Payment Efficiency"
              value={analytics.paymentEfficiency}
              suffix="%"
            />
            <div style={{ marginTop: 8 }}>
              <Space>
                {getTrendIcon(analytics.efficiencyTrend)}
                <Text style={{ color: getTrendColor(analytics.efficiencyTrend) }}>
                  {analytics.efficiencyTrend > 0 ? '+' : ''}{analytics.efficiencyTrend}%
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Payment Trends" size="small">
            <Line {...lineChartConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Payment Distribution" size="small">
            <Pie {...pieChartConfig} height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Payment Methods Breakdown" size="small">
            <Column {...columnChartConfig} height={250} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Payment Status Overview" size="small">
            <Column {...statusColumnConfig} height={250} />
          </Card>
        </Col>
      </Row>

      <Card title="Cost Optimization Suggestions" style={{ marginTop: 16 }}>
        {suggestions.length === 0 ? (
          <Alert
            message="No Suggestions Available"
            description="Your payment patterns are optimized. Keep up the good work!"
            type="success"
            showIcon
          />
        ) : (
          <List
            dataSource={suggestions}
            renderItem={suggestion => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{suggestion.title}</Text>
                      <Tag color="blue">Save ${suggestion.potentialSavings}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{suggestion.description}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          percent={suggestion.implementationDifficulty}
                          size="small"
                          format={() => `Difficulty: ${suggestion.implementationDifficulty}%`}
                        />
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="Financial Planning Tools" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Next Payment Prediction"
                value={analytics.nextPaymentPrediction}
                prefix="$"
                suffix={
                  <Text type="secondary">in {analytics.daysUntilNextPayment} days</Text>
                }
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Monthly Average"
                value={analytics.monthlyAverage}
                prefix="$"
                suffix={
                  <Text type="secondary">last 6 months</Text>
                }
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Yearly Projection"
                value={analytics.yearlyProjection}
                prefix="$"
                suffix={
                  <Text type="secondary">based on trends</Text>
                }
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </Card>
  );
};

export default PaymentAnalytics;
