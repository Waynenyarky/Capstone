import { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Statistic, Table, Progress, Alert, 
  Typography, Space, Button, Tabs, Select, DatePicker,
  Line, Area
} from 'antd'
import { 
  ReloadOutlined, DownloadOutlined, AlertOutlined,
  ClockCircleOutlined, DatabaseOutlined, ApiOutlined
} from '@ant-design/icons'
import { Line, Area } from '@ant-design/plots'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

function PerformanceDashboard() {
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('24h')
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(24, 'hour'),
    dayjs()
  ])
  const [metrics, setMetrics] = useState({
    pageLoad: { avg: 1.2, p95: 2.1, p99: 3.4 },
    apiResponse: { avg: 120, p95: 250, p99: 450 },
    database: { avg: 45, p95: 89, p99: 156 },
    memory: { used: 68, total: 100, peak: 85 },
    errorRate: 0.2,
    uptime: 99.9,
    activeUsers: 1247
  })

  const [performanceData, setPerformanceData] = useState({
    pageLoadTimes: [],
    apiResponseTimes: [],
    databaseQueryTimes: [],
    memoryUsage: [],
    errorRates: [],
    activeUsers: []
  })

  const [slowQueries, setSlowQueries] = useState([
    { 
      query: 'find businesses with complex filters', 
      collection: 'businesses', 
      time: 234, 
      timestamp: '2024-01-15 14:32:10',
      frequency: 15
    },
    { 
      query: 'aggregate payments by date range', 
      collection: 'payments', 
      time: 189, 
      timestamp: '2024-01-15 14:28:45',
      frequency: 8
    },
    { 
      query: 'lookup user permissions', 
      collection: 'users', 
      time: 156, 
      timestamp: '2024-01-15 14:25:22',
      frequency: 23
    }
  ])

  const [alerts, setAlerts] = useState([
    {
      type: 'warning',
      message: 'API response time increased by 25%',
      timestamp: '2024-01-15 14:30:00',
      metric: 'apiResponse'
    },
    {
      type: 'error',
      message: 'Database connection pool exhausted',
      timestamp: '2024-01-15 14:15:00',
      metric: 'database'
    }
  ])

  useEffect(() => {
    fetchPerformanceData()
  }, [timeRange, dateRange])

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      // Simulate API call to fetch performance data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate sample data based on time range
      const generateTimeSeries = (baseValue, variance, points) => {
        return Array.from({ length: points }, (_, i) => ({
          time: dayjs().subtract(points - i, 'hour').format('HH:mm'),
          value: baseValue + (Math.random() - 0.5) * variance
        }))
      }

      const points = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720

      setPerformanceData({
        pageLoadTimes: generateTimeSeries(1.2, 0.4, points),
        apiResponseTimes: generateTimeSeries(120, 40, points),
        databaseQueryTimes: generateTimeSeries(45, 20, points),
        memoryUsage: generateTimeSeries(68, 15, points),
        errorRates: generateTimeSeries(0.2, 0.1, points),
        activeUsers: generateTimeSeries(1200, 300, points)
      })
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const pageLoadConfig = {
    data: performanceData.pageLoadTimes,
    xField: 'time',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 3,
      shape: 'circle'
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'Load Time',
        value: `${datum.value.toFixed(2)}s`
      })
    },
    annotations: [
      {
        type: 'line',
        start: ['min', 2],
        end: ['max', 2],
        style: {
          stroke: '#ff4d4f',
          lineDash: [2, 2]
        }
      }
    ]
  }

  const apiResponseConfig = {
    data: performanceData.apiResponseTimes,
    xField: 'time',
    yField: 'value',
    smooth: true,
    color: '#52c41a',
    areaStyle: {
      fill: '#52c41a',
      fillOpacity: 0.2
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'Response Time',
        value: `${datum.value.toFixed(0)}ms`
      })
    }
  }

  const memoryConfig = {
    data: performanceData.memoryUsage,
    xField: 'time',
    yField: 'value',
    smooth: true,
    color: '#fa8c16',
    areaStyle: {
      fill: '#fa8c16',
      fillOpacity: 0.2
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'Memory Usage',
        value: `${datum.value.toFixed(1)}%`
      })
    }
  }

  const slowQueryColumns = [
    {
      title: 'Query',
      dataIndex: 'query',
      key: 'query',
      ellipsis: true,
      width: '40%'
    },
    {
      title: 'Collection',
      dataIndex: 'collection',
      key: 'collection',
      width: '15%'
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '10%',
      render: (time) => (
        <Text type={time > 200 ? 'danger' : time > 100 ? 'warning' : 'success'}>
          {time}ms
        </Text>
      )
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      width: '10%',
      render: (freq) => `${freq}/hr`
    },
    {
      title: 'Last Seen',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '25%'
    }
  ]

  const alertColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (type) => (
        <Text type={type === 'error' ? 'danger' : 'warning'}>
          {type.toUpperCase()}
        </Text>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '20%'
    }
  ]

  const getHealthStatus = (value, thresholds) => {
    if (value <= thresholds.good) return { color: '#52c41a', status: 'Good' }
    if (value <= thresholds.warning) return { color: '#fa8c16', status: 'Warning' }
    return { color: '#ff4d4f', status: 'Critical' }
  }

  const pageLoadHealth = getHealthStatus(metrics.pageLoad.avg, { good: 1.0, warning: 2.0 })
  const apiHealth = getHealthStatus(metrics.apiResponse.avg, { good: 100, warning: 200 })
  const dbHealth = getHealthStatus(metrics.database.avg, { good: 50, warning: 100 })

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Performance Monitoring</Title>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { value: '1h', label: 'Last Hour' },
              { value: '24h', label: 'Last 24 Hours' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' }
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            showTime
            format="YYYY-MM-DD HH:mm"
          />
          <Button 
            icon={<ReloadOutlined />} 
            loading={loading}
            onClick={fetchPerformanceData}
          >
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />}>
            Export Report
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Page Load Time"
              value={metrics.pageLoad.avg}
              suffix="s"
              precision={2}
              valueStyle={{ color: pageLoadHealth.color }}
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">P95: {metrics.pageLoad.p95}s | P99: {metrics.pageLoad.p99}s</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="API Response Time"
              value={metrics.apiResponse.avg}
              suffix="ms"
              precision={0}
              valueStyle={{ color: apiHealth.color }}
              prefix={<ApiOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">P95: {metrics.apiResponse.p95}ms | P99: {metrics.apiResponse.p99}ms</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Database Query Time"
              value={metrics.database.avg}
              suffix="ms"
              precision={0}
              valueStyle={{ color: dbHealth.color }}
              prefix={<DatabaseOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">P95: {metrics.database.p95}ms | P99: {metrics.database.p99}ms</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={metrics.uptime}
              suffix="%"
              precision={1}
              valueStyle={{ color: metrics.uptime > 99 ? '#52c41a' : '#fa8c16' }}
              prefix={<AlertOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Error Rate: {metrics.errorRate}%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Charts */}
      <Tabs defaultActiveKey="overview" style={{ marginBottom: 24 }}>
        <Tabs.TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Page Load Times" size="small">
                <Line {...pageLoadConfig} height={200} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="API Response Times" size="small">
                <Area {...apiResponseConfig} height={200} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Memory Usage" size="small">
                <Area {...memoryConfig} height={200} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="System Resources" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text>CPU Usage</Text>
                    <Progress percent={45} size="small" />
                  </div>
                  <div>
                    <Text>Memory Usage</Text>
                    <Progress percent={metrics.memory.used} size="small" />
                  </div>
                  <div>
                    <Text>Disk Usage</Text>
                    <Progress percent={62} size="small" />
                  </div>
                  <div>
                    <Text>Network I/O</Text>
                    <Progress percent={28} size="small" />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Database" key="database">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Slow Queries" size="small">
                <Table
                  columns={slowQueryColumns}
                  dataSource={slowQueries}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Alerts" key="alerts">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Recent Alerts" size="small">
                {alerts.length === 0 ? (
                  <Alert
                    type="success"
                    message="No active alerts"
                    description="System is performing within normal parameters."
                  />
                ) : (
                  <Table
                    columns={alertColumns}
                    dataSource={alerts}
                    pagination={false}
                    size="small"
                  />
                )}
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard
