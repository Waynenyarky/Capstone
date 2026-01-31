import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Spin,
  Tag,
  Typography,
  Divider,
  Image,
  Tabs,
  Table,
  Empty,
  Button,
  Tooltip,
} from 'antd'
import {
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  LineChartOutlined,
  RobotOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3005'

/**
 * AIModelMetrics Component
 * 
 * Displays AI model training metrics, accuracy scores, and training curves.
 * Shows overfitting/underfitting analysis to help understand model performance.
 */
const AIModelMetrics = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelNotTrained, setModelNotTrained] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [history, setHistory] = useState(null)
  const [curvesImage, setCurvesImage] = useState(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    setModelNotTrained(false)
    setMetrics(null)
    setHistory(null)
    setCurvesImage(null)

    try {
      // First, check AI service health and model availability
      const healthRes = await fetch(`${AI_SERVICE_URL}/status`)
      if (!healthRes.ok) {
        throw new Error('AI service is not available')
      }
      
      const healthData = await healthRes.json()
      
      // Check if model is loaded (not in mock mode means model exists)
      if (!healthData.id_verification?.loaded) {
        setModelNotTrained(true)
        setLoading(false)
        return
      }

      // Model is loaded, fetch detailed metrics
      const [metricsRes, historyRes, curvesRes] = await Promise.allSettled([
        fetch(`${AI_SERVICE_URL}/training-metrics/id-verification`).then(r => r.ok ? r.json() : null),
        fetch(`${AI_SERVICE_URL}/training-metrics/id-verification/history`).then(r => r.ok ? r.json() : null),
        fetch(`${AI_SERVICE_URL}/training-metrics/id-verification/curves-base64`).then(r => r.ok ? r.json() : null),
      ])

      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value)
      } else {
        // Model loaded but no metrics file - still show as not trained
        setModelNotTrained(true)
      }

      if (historyRes.status === 'fulfilled' && historyRes.value) {
        setHistory(historyRes.value)
      }

      if (curvesRes.status === 'fulfilled' && curvesRes.value?.available) {
        setCurvesImage(`data:image/png;base64,${curvesRes.value.image_base64}`)
      }
    } catch (err) {
      console.error('Failed to fetch AI metrics:', err)
      setError(err.message || 'Failed to connect to AI service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  // Get fit status color and icon
  const getFitStatusDisplay = (status) => {
    switch (status) {
      case 'good':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Good Fit',
        }
      case 'overfitting':
        return {
          color: 'warning',
          icon: <WarningOutlined />,
          text: 'Overfitting',
        }
      case 'underfitting':
        return {
          color: 'error',
          icon: <ExclamationCircleOutlined />,
          text: 'Underfitting',
        }
      default:
        return {
          color: 'default',
          icon: <InfoCircleOutlined />,
          text: 'Unknown',
        }
    }
  }

  // Get training mode display
  const getTrainingModeDisplay = (mode) => {
    switch (mode) {
      case 'quick':
        return {
          color: 'orange',
          text: 'Quick Mode',
          description: 'Minimal data for fast training (~200 images)',
        }
      case 'standard':
        return {
          color: 'blue',
          text: 'Standard Mode',
          description: 'Balanced data for good results (~1000 images)',
        }
      case 'full':
        return {
          color: 'green',
          text: 'Full Mode',
          description: 'Maximum data for best accuracy (1000+ images)',
        }
      default:
        return {
          color: 'default',
          text: 'Unknown',
          description: 'Training mode not specified',
        }
    }
  }

  // Render confusion matrix
  const renderConfusionMatrix = (matrix) => {
    if (!matrix || matrix.length !== 2) return null

    const columns = [
      { title: '', dataIndex: 'label', key: 'label', width: 120 },
      { title: 'Predicted: Fake', dataIndex: 'fake', key: 'fake', align: 'center' },
      { title: 'Predicted: Legit', dataIndex: 'legit', key: 'legit', align: 'center' },
    ]

    const data = [
      { key: '1', label: 'Actual: Fake', fake: matrix[0][0], legit: matrix[0][1] },
      { key: '2', label: 'Actual: Legit', fake: matrix[1][0], legit: matrix[1][1] },
    ]

    return (
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        bordered
      />
    )
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading AI model metrics...</div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Failed to Connect to AI Service"
          description={
            <div>
              <Paragraph>{error}</Paragraph>
              <Paragraph type="secondary">
                Make sure the AI service is running. Check the Docker container status.
              </Paragraph>
            </div>
          }
          type="error"
          showIcon
          action={
            <Button onClick={fetchMetrics} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  if (modelNotTrained || !metrics) {
    return (
      <Card>
        <Alert
          message="AI Model Not Trained Yet"
          description={
            <div>
              <Paragraph>
                The ID verification AI model has not been trained yet. Training the model will enable 
                intelligent verification of uploaded ID documents.
              </Paragraph>
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                To train the model, run the following command from the project root:
              </Paragraph>
              <code style={{ 
                background: '#f5f5f5', 
                padding: '12px 16px', 
                display: 'block', 
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 13 
              }}>
                cd ai/id-verification && ./scripts/auto_train.sh
              </code>
              <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
                Note: Training requires downloading dataset images and may take several minutes depending 
                on your hardware and the training mode selected (quick/standard/full).
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          icon={<RobotOutlined />}
          action={
            <Button onClick={fetchMetrics} icon={<ReloadOutlined />}>
              Check Again
            </Button>
          }
        />
      </Card>
    )
  }

  const fitStatus = getFitStatusDisplay(metrics.fit_status)
  const trainingMode = getTrainingModeDisplay(metrics.training_mode)

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          ID Verification AI Model
        </Title>
        <Button onClick={fetchMetrics} icon={<ReloadOutlined />}>
          Refresh
        </Button>
      </div>

      {/* Key Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Accuracy"
              value={metrics.accuracy * 100}
              precision={1}
              suffix="%"
              valueStyle={{
                color: metrics.accuracy >= 0.9 ? '#3f8600' : metrics.accuracy >= 0.7 ? '#faad14' : '#cf1322',
              }}
            />
            <Progress
              percent={metrics.accuracy * 100}
              showInfo={false}
              strokeColor={metrics.accuracy >= 0.9 ? '#52c41a' : metrics.accuracy >= 0.7 ? '#faad14' : '#f5222d'}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Loss"
              value={metrics.loss}
              precision={4}
              valueStyle={{
                color: metrics.loss <= 0.3 ? '#3f8600' : metrics.loss <= 0.5 ? '#faad14' : '#cf1322',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Lower is better</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            {metrics.auc ? (
              <Statistic
                title="AUC Score"
                value={metrics.auc}
                precision={4}
                valueStyle={{
                  color: metrics.auc >= 0.9 ? '#3f8600' : metrics.auc >= 0.7 ? '#faad14' : '#cf1322',
                }}
              />
            ) : (
              <div>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>AUC Score</div>
                <Text type="secondary">N/A</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>Model Status</div>
            <Tag color={fitStatus.color} icon={fitStatus.icon} style={{ fontSize: 14, padding: '4px 8px' }}>
              {fitStatus.text}
            </Tag>
          </Card>
        </Col>
      </Row>

      {/* Training Mode & Data Info Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>Training Mode</div>
                <Tooltip title={trainingMode.description}>
                  <Tag color={trainingMode.color} style={{ fontSize: 14, padding: '4px 8px' }}>
                    {trainingMode.text}
                  </Tag>
                </Tooltip>
              </Col>
              <Col span={12}>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>Training Epochs</div>
                <Text strong style={{ fontSize: 16 }}>{metrics.training_config?.epochs || 'N/A'}</Text>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Training Data"
                  value={metrics.data_counts?.total_train || 'N/A'}
                  suffix="images"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Validation Data"
                  value={metrics.data_counts?.total_val || 'N/A'}
                  suffix="images"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total"
                  value={metrics.data_counts?.total || 'N/A'}
                  suffix="images"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Fit Status Alert */}
      <Alert
        message={`Model Analysis: ${fitStatus.text}`}
        description={metrics.fit_details}
        type={metrics.fit_status === 'good' ? 'success' : metrics.fit_status === 'overfitting' ? 'warning' : 'error'}
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Tabs for detailed info */}
      <Card>
        <Tabs
          items={[
            {
              key: 'curves',
              label: (
                <span>
                  <LineChartOutlined />
                  Training Curves
                </span>
              ),
              children: curvesImage ? (
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={curvesImage}
                    alt="Training Curves"
                    style={{ maxWidth: '100%', maxHeight: 600 }}
                    placeholder
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      These curves show training vs validation metrics over epochs.
                      Large gaps indicate overfitting.
                    </Text>
                  </div>
                </div>
              ) : (
                <Empty description="Training curves not available" />
              ),
            },
            {
              key: 'matrix',
              label: 'Confusion Matrix',
              children: metrics.confusion_matrix ? (
                <div>
                  <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    The confusion matrix shows how well the model classifies images.
                    Diagonal values (top-left and bottom-right) are correct predictions.
                  </Paragraph>
                  {renderConfusionMatrix(metrics.confusion_matrix)}
                </div>
              ) : (
                <Empty description="Confusion matrix not available" />
              ),
            },
            {
              key: 'info',
              label: 'Model Info',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text type="secondary">Version:</Text>
                      <div><Text strong>{metrics.model_version}</Text></div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Base Model:</Text>
                      <div><Text strong>{metrics.base_model}</Text></div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Created:</Text>
                      <div><Text strong>{new Date(metrics.created_at).toLocaleString()}</Text></div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Training Mode:</Text>
                      <div>
                        <Tag color={trainingMode.color}>{trainingMode.text}</Tag>
                      </div>
                    </Col>
                  </Row>

                  <Divider />

                  <Title level={5}>Training Data Breakdown</Title>
                  {metrics.data_counts ? (
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text type="secondary">Training - Legit IDs:</Text>
                        <div><Text strong>{metrics.data_counts.train_legit}</Text></div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Training - Fake/Wrong:</Text>
                        <div><Text strong>{metrics.data_counts.train_fake}</Text></div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Validation - Legit IDs:</Text>
                        <div><Text strong>{metrics.data_counts.val_legit}</Text></div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Validation - Fake/Wrong:</Text>
                        <div><Text strong>{metrics.data_counts.val_fake}</Text></div>
                      </Col>
                    </Row>
                  ) : (
                    <Text type="secondary">Data counts not available</Text>
                  )}

                  <Divider />

                  <Title level={5}>Important Notes</Title>
                  <ul>
                    {metrics.notes?.map((note, idx) => (
                      <li key={idx}>
                        <Text type="secondary">{note}</Text>
                      </li>
                    ))}
                  </ul>

                  {metrics.training_mode === 'quick' && (
                    <Alert
                      message="Quick Mode Training"
                      description="This model was trained in quick mode with minimal data. For better accuracy, retrain with full data using: ./ai/id-verification/scripts/auto_train.sh"
                      type="info"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default AIModelMetrics
