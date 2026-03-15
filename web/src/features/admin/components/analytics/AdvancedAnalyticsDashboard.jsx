import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Statistic, Table, Progress, Alert, 
  Typography, Space, Button, Tabs, Select, DatePicker,
  Line, Column, Area, Tooltip, Tag, Badge, Spin
} from 'antd'
import { 
  TrendingUpOutlined, TrendingDownOutlined, 
  AlertOutlined, CheckCircleOutlined, ClockCircleOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  RocketOutlined, BulbOutlined, TargetOutlined
} from '@ant-design/icons'
import { Line, Column, Area, Pie } from '@ant-design/plots'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs
const { Option } = Select

function AdvancedAnalyticsDashboard() {
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, dateRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Mock API call - in production, this would call the actual analytics service
      const mockData = await generateMockAnalyticsData()
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalyticsData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      timeRange,
      generatedAt: new Date(),
      summary: {
        totalUsers: 5000,
        avgResponseTime: 120,
        systemUptime: 99.9,
        revenueGrowth: 12.5,
        errorRate: 0.2
      },
      data: {
        performanceMetrics: {
          avgResponseTime: 120,
          p95ResponseTime: 250,
          p99ResponseTime: 450,
          errorRate: 0.2,
          throughput: 1500,
          responseTimes: generateTimeSeries('response_time', 30),
          errorRates: generateTimeSeries('error_rate', 30),
          throughput: generateTimeSeries('throughput', 30)
        },
        userBehaviorData: {
          totalUsers: 5000,
          activeUsers: 1247,
          avgSessionDuration: 8.5,
          bounceRate: 32,
          pageViews: 15000,
          activeUsers: generateTimeSeries('active_users', 30),
          sessionDuration: generateTimeSeries('session_duration', 30),
          bounceRate: generateTimeSeries('bounce_rate', 30)
        },
        businessMetrics: {
          revenue: 125000,
          registrations: 450,
          conversions: 89,
          churnRate: 2.3,
          revenue: generateTimeSeries('revenue', 30),
          registrations: generateTimeSeries('registrations', 30),
          conversions: generateTimeSeries('conversions', 30)
        },
        systemHealthData: {
          uptime: 99.9,
          cpuUsage: 45,
          memoryUsage: 68,
          diskUsage: 32,
          uptime: generateTimeSeries('uptime', 30),
          cpuUsage: generateTimeSeries('cpu_usage', 30),
          memoryUsage: generateTimeSeries('memory_usage', 30)
        },
        revenueData: {
          totalRevenue: 125000,
          growthRate: 12.5,
          avgTransactionValue: 250,
          revenue: generateTimeSeries('revenue', 30)
        }
      },
      analysis: {
        trendAnalysis: {
          performance: {
            responseTime: {
              current: 120,
              trend: 'stable',
              change: -2.5,
              direction: 'down',
              prediction: 118,
              confidence: 75
            },
            errorRate: {
              current: 0.2,
              trend: 'decreasing',
              change: -15.3,
              direction: 'down',
              prediction: 0.17,
              confidence: 82
            },
            throughput: {
              current: 1500,
              trend: 'increasing',
              change: 8.7,
              direction: 'up',
              prediction: 1630,
              confidence: 68
            }
          },
          userBehavior: {
            activeUsers: {
              current: 1247,
              trend: 'increasing',
              change: 5.2,
              direction: 'up',
              prediction: 1312,
              confidence: 71
            },
            sessionDuration: {
              current: 8.5,
              trend: 'stable',
              change: 1.1,
              direction: 'up',
              prediction: 8.6,
              confidence: 64
            },
            bounceRate: {
              current: 32,
              trend: 'decreasing',
              change: -3.8,
              direction: 'down',
              prediction: 30.8,
              confidence: 59
            }
          },
          businessMetrics: {
            revenue: {
              current: 125000,
              trend: 'increasing',
              change: 12.5,
              direction: 'up',
              prediction: 140625,
              confidence: 78
            },
            registrations: {
              current: 450,
              trend: 'increasing',
              change: 8.9,
              direction: 'up',
              prediction: 490,
              confidence: 72
            },
            conversions: {
              current: 89,
              trend: 'stable',
              change: 2.3,
              direction: 'up',
              prediction: 91,
              confidence: 65
            }
          }
        },
        predictions: {
          performance: {
            responseTime: {
              next30Days: { value: 118, confidence: 75, range: { low: 112, high: 124 } },
              next90Days: { value: 114, confidence: 65, range: { low: 105, high: 123 } }
            },
            errorRate: {
              next30Days: { value: 0.17, confidence: 82, range: { low: 0.15, high: 0.19 } },
              next90Days: { value: 0.14, confidence: 72, range: { low: 0.12, high: 0.16 } }
            },
            throughput: {
              next30Days: { value: 1630, confidence: 68, range: { low: 1520, high: 1740 } },
              next90Days: { value: 1890, confidence: 58, range: { low: 1710, high: 2070 } }
            }
          },
          userBehavior: {
            activeUsers: { value: 1312, confidence: 71 },
            sessionDuration: { value: 8.6, confidence: 64 },
            bounceRate: { value: 30.8, confidence: 59 }
          },
          business: {
            revenue: { value: 140625, confidence: 78 },
            registrations: { value: 490, confidence: 72 },
            conversions: { value: 91, confidence: 65 }
          },
          overallHealth: {
            score: 88,
            status: 'healthy',
            factors: ['Response time', 'Error rate', 'Throughput']
          }
        },
        insights: [
          {
            type: 'performance',
            severity: 'positive',
            title: 'Performance Improving',
            description: 'Response times are stable and error rates are decreasing',
            impact: 'positive',
            recommendation: 'Continue current optimization strategies'
          },
          {
            type: 'business',
            severity: 'positive',
            title: 'Revenue Growth Strong',
            description: 'Revenue is trending upward with 12.5% growth',
            impact: 'positive',
            recommendation: 'Identify and scale growth drivers'
          },
          {
            type: 'engagement',
            severity: 'warning',
            title: 'User Engagement Stable',
            description: 'User engagement metrics are stable but could be improved',
            impact: 'medium',
            recommendation: 'Consider engagement optimization campaigns'
          }
        ],
        recommendations: [
          {
            category: 'performance',
            priority: 'medium',
            title: 'Continue Performance Optimization',
            description: 'Based on Performance Improving',
            estimatedImpact: 'medium',
            effort: 'low',
            timeframe: 'ongoing'
          },
          {
            category: 'business',
            priority: 'high',
            title: 'Scale Growth Initiatives',
            description: 'Based on Revenue Growth Strong',
            estimatedImpact: 'high',
            effort: 'medium',
            timeframe: '30-60 days'
          },
          {
            category: 'engagement',
            priority: 'medium',
            title: 'Engagement Campaign',
            description: 'Based on User Engagement Stable',
            estimatedImpact: 'medium',
            effort: 'low',
            timeframe: '2-4 weeks'
          }
        ]
      }
    }
  }

  const generateTimeSeries = (metricType, days) => {
    const data = []
    const now = new Date()
    
    let baseValue = 100
    let trend = 0
    
    switch (metricType) {
      case 'response_time':
        baseValue = 120
        trend = -0.5
        break
      case 'error_rate':
        baseValue = 0.2
        trend = -0.01
        break
      case 'throughput':
        baseValue = 1500
        trend = 10
        break
      case 'active_users':
        baseValue = 1247
        trend = 5
        break
      case 'revenue':
        baseValue = 4000
        trend = 50
        break
      default:
        baseValue = 100
        trend = 0
    }
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const value = baseValue + (trend * (days - i)) + (Math.random() - 0.5) * baseValue * 0.1
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, value)
      })
    }
    
    return data
  }

  const renderTrendIndicator = (trend) => {
    const { trend: trendDirection, change, direction } = trend
    
    if (direction === 'up') {
      return (
        <Space>
          <TrendingUpOutlined style={{ color: '#52c41a' }} />
          <Text style={{ color: '#52c41a' }}>+{Math.abs(change)}%</Text>
        </Space>
      )
    } else if (direction === 'down') {
      return (
        <Space>
          <TrendingDownOutlined style={{ color: '#ff4d4f' }} />
          <Text style={{ color: '#ff4d4f' }}>{change}%</Text>
        </Space>
      )
    } else {
      return (
        <Space>
          <Text type="secondary">Stable</Text>
        </Space>
      )
    }
  }

  const renderOverviewTab = () => {
    if (!analyticsData) return null

    return (
      <Row gutter={[16, 16]}>
        {/* Key Metrics */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={analyticsData.summary.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={analyticsData.summary.avgResponseTime}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={analyticsData.summary.systemUptime}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Revenue Growth"
              value={analyticsData.summary.revenueGrowth}
              suffix="%"
              prefix={<TrendingUpOutlined />}
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        {/* Trend Analysis */}
        <Col xs={24} lg={12}>
          <Card title="Performance Trends" extra={<BarChartOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Response Time</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{analyticsData.analysis.trendAnalysis.performance.responseTime.current}ms</Text>
                  {renderTrendIndicator(analyticsData.analysis.trendAnalysis.performance.responseTime)}
                </div>
                <Progress 
                  percent={analyticsData.analysis.trendAnalysis.performance.responseTime.confidence} 
                  size="small" 
                  status={analyticsData.analysis.trendAnalysis.performance.responseTime.direction === 'down' ? 'success' : 'normal'}
                />
              </div>
              
              <div>
                <Text strong>Error Rate</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{analyticsData.analysis.trendAnalysis.performance.errorRate.current}%</Text>
                  {renderTrendIndicator(analyticsData.analysis.trendAnalysis.performance.errorRate)}
                </div>
                <Progress 
                  percent={analyticsData.analysis.trendAnalysis.performance.errorRate.confidence} 
                  size="small" 
                  status={analyticsData.analysis.trendAnalysis.performance.errorRate.direction === 'down' ? 'success' : 'normal'}
                />
              </div>
              
              <div>
                <Text strong>Throughput</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{analyticsData.analysis.trendAnalysis.performance.throughput.current}</Text>
                  {renderTrendIndicator(analyticsData.analysis.trendAnalysis.performance.throughput)}
                </div>
                <Progress 
                  percent={analyticsData.analysis.trendAnalysis.performance.throughput.confidence} 
                  size="small" 
                  status={analyticsData.analysis.trendAnalysis.performance.throughput.direction === 'up' ? 'success' : 'normal'}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Business Metrics" extra={<LineChartOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Revenue</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>₱{analyticsData.analysis.trendAnalysis.businessMetrics.revenue.current.toLocaleString()}</Text>
                  {renderTrendIndicator(analyticsData.analysis.trendAnalysis.businessMetrics.revenue)}
                </div>
                <Progress 
                  percent={analyticsData.analysis.trendAnalysis.businessMetrics.revenue.confidence} 
                  size="small" 
                  status={analyticsData.analysis.trendAnalysis.businessMetrics.revenue.direction === 'up' ? 'success' : 'normal'}
                />
              </div>
              
              <div>
                <Text strong>Registrations</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{analyticsData.analysis.trendAnalysis.businessMetrics.registrations.current}</Text>
                  {renderTrendIndicator(analyticsData.analysis.trendAnalysis.businessMetrics.registrations)}
                </div>
                <Progress 
                  percent={analyticsData.analysis.trendAnalysis.businessMetrics.registrations.confidence} 
                  size="small" 
                  status={analyticsData.analysis.trendAnalysis.businessMetrics.registrations.direction === 'up' ? 'success' : 'normal'}
                />
              </div>
              
              <div>
                <Text strong>Conversions</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{analyticsData.analysis.trendAnalysis.businessMetrics.conversions.current}</Text>
                  {renderTrendIndicator(analyticsData.analysis.trendAnalysis.businessMetrics.conversions)}
                </div>
                <Progress 
                  percent={analyticsData.analysis.trendAnalysis.businessMetrics.conversions.confidence} 
                  size="small" 
                  status={analyticsData.analysis.trendAnalysis.businessMetrics.conversions.direction === 'up' ? 'success' : 'normal'}
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* Insights */}
        <Col xs={24}>
          <Card title="Key Insights" extra={<BulbOutlined />}>
            <Row gutter={[16, 16]}>
              {analyticsData.analysis.insights.map((insight, index) => (
                <Col xs={24} md={8} key={index}>
                  <Alert
                    message={insight.title}
                    description={insight.description}
                    type={insight.severity === 'positive' ? 'success' : insight.severity === 'warning' ? 'warning' : 'info'}
                    showIcon
                    action={
                      <Button size="small" type="text">
                        View Details
                      </Button>
                    }
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Recommendations */}
        <Col xs={24}>
          <Card title="Recommendations" extra={<RocketOutlined />}>
            <Table
              dataSource={analyticsData.analysis.recommendations}
              columns={[
                {
                  title: 'Priority',
                  dataIndex: 'priority',
                  key: 'priority',
                  render: (priority) => (
                    <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
                      {priority.toUpperCase()}
                    </Tag>
                  )
                },
                {
                  title: 'Recommendation',
                  dataIndex: 'title',
                  key: 'title'
                },
                {
                  title: 'Impact',
                  dataIndex: 'estimatedImpact',
                  key: 'estimatedImpact',
                  render: (impact) => (
                    <Tag color={impact === 'high' ? 'green' : impact === 'medium' ? 'blue' : 'default'}>
                      {impact.toUpperCase()}
                    </Tag>
                  )
                },
                {
                  title: 'Effort',
                  dataIndex: 'effort',
                  key: 'effort',
                  render: (effort) => (
                    <Tag color={effort === 'low' ? 'green' : effort === 'medium' ? 'orange' : 'red'}>
                      {effort.toUpperCase()}
                    </Tag>
                  )
                },
                {
                  title: 'Timeframe',
                  dataIndex: 'timeframe',
                  key: 'timeframe'
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    )
  }

  const renderPredictionsTab = () => {
    if (!analyticsData) return null

    const { predictions } = analyticsData.analysis

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Overall Health Prediction" extra={<TargetOutlined />}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={predictions.overallHealth.score}
                    format={percent => `${percent}%`}
                    strokeColor={predictions.overallHealth.score > 70 ? '#52c41a' : predictions.overallHealth.score > 40 ? '#faad14' : '#ff4d4f'}
                  />
                  <Title level={4} style={{ marginTop: 16 }}>
                    {predictions.overallHealth.status.toUpperCase()}
                  </Title>
                </div>
              </Col>
              <Col xs={24} md={16}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Health Factors:</Text>
                  {predictions.overallHealth.factors.map((factor, index) => (
                    <div key={index}>
                      <Text>{factor}</Text>
                      <Progress percent={75 + Math.random() * 20} size="small" />
                    </div>
                  ))}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Performance Predictions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Response Time (30 days)</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Current: {analyticsData.analysis.trendAnalysis.performance.responseTime.current}ms</Text>
                  <Text>Predicted: {predictions.performance.responseTime.next30Days.value}ms</Text>
                </div>
                <div>
                  <Text type="secondary">
                    Range: {predictions.performance.responseTime.next30Days.range.low} - {predictions.performance.responseTime.next30Days.range.high}ms
                  </Text>
                </div>
                <Progress 
                  percent={predictions.performance.responseTime.next30Days.confidence} 
                  size="small" 
                />
              </div>
              
              <div>
                <Text strong>Error Rate (30 days)</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Current: {analyticsData.analysis.trendAnalysis.performance.errorRate.current}%</Text>
                  <Text>Predicted: {predictions.performance.errorRate.next30Days.value}%</Text>
                </div>
                <div>
                  <Text type="secondary">
                    Range: {predictions.performance.errorRate.next30Days.range.low} - {predictions.performance.errorRate.next30Days.range.high}%
                  </Text>
                </div>
                <Progress 
                  percent={predictions.performance.errorRate.next30Days.confidence} 
                  size="small" 
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Business Predictions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Revenue (30 days)</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Current: ₱{analyticsData.analysis.trendAnalysis.businessMetrics.revenue.current.toLocaleString()}</Text>
                  <Text>Predicted: ₱{predictions.business.revenue.value.toLocaleString()}</Text>
                </div>
                <Progress 
                  percent={predictions.business.revenue.confidence} 
                  size="small" 
                />
              </div>
              
              <div>
                <Text strong>Registrations (30 days)</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Current: {analyticsData.analysis.trendAnalysis.businessMetrics.registrations.current}</Text>
                  <Text>Predicted: {predictions.business.registrations.value}</Text>
                </div>
                <Progress 
                  percent={predictions.business.registrations.confidence} 
                  size="small" 
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    )
  }

  const renderChartsTab = () => {
    if (!analyticsData) return null

    const responseTimeConfig = {
      data: analyticsData.data.performanceMetrics.responseTimes,
      xField: 'date',
      yField: 'value',
      smooth: true,
      point: {
        size: 5,
        shape: 'diamond'
      },
      tooltip: {
        formatter: (datum) => ({
          name: 'Response Time',
          value: `${datum.value}ms`
        })
      }
    }

    const revenueConfig = {
      data: analyticsData.data.businessMetrics.revenue,
      xField: 'date',
      yField: 'value',
      smooth: true,
      color: '#52c41a',
      tooltip: {
        formatter: (datum) => ({
          name: 'Revenue',
          value: `₱${datum.value.toLocaleString()}`
        })
      }
    }

    const usersConfig = {
      data: analyticsData.data.userBehaviorData.activeUsers,
      xField: 'date',
      yField: 'value',
      smooth: true,
      color: '#1890ff',
      tooltip: {
        formatter: (datum) => ({
          name: 'Active Users',
          value: datum.value.toLocaleString()
        })
      }
    }

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Response Time Trend">
            <Line {...responseTimeConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Revenue Trend">
            <Line {...revenueConfig} />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="User Activity Trend">
            <Line {...usersConfig} />
          </Card>
        </Col>
      </Row>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading analytics data...</Text>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Advanced Analytics</Title>
          <Text type="secondary">Comprehensive analytics with trend analysis and predictions</Text>
        </Col>
        <Col>
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="7d">7 Days</Option>
              <Option value="30d">30 Days</Option>
              <Option value="90d">90 Days</Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
            />
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={fetchAnalyticsData}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          {renderOverviewTab()}
        </TabPane>
        <TabPane tab="Predictions" key="predictions">
          {renderPredictionsTab()}
        </TabPane>
        <TabPane tab="Charts" key="charts">
          {renderChartsTab()}
        </TabPane>
      </Tabs>
    </div>
  )
}

export default AdvancedAnalyticsDashboard
