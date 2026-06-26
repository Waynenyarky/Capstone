import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Button, Table, Modal, Form, Input, Select, Space, Tag, Typography,
  Card, Statistic, Row, Col, Popconfirm, Alert, Grid, App, Tooltip,
} from 'antd'
import { PlusOutlined, ReloadOutlined, DeleteOutlined,
  EditOutlined, SearchOutlined, BarChartOutlined,
  LineChartOutlined, BulbOutlined, ApiOutlined, PlayCircleOutlined,
  DownloadOutlined, UploadOutlined,
} from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness'
import {
  getLobTrainerStats,
  getLobTrainingExamples,
  createLobTrainingExample,
  updateLobTrainingExample,
  deleteLobTrainingExample,
  triggerLobModelTraining,
  getLobAudit,
  getLobEvaluation,
  getGeminiStatus,
  getLobRecommendations,
  exportLobExamplesCsv,
  importLobExamplesCsv,
} from '../services/lobTrainerService'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const TAX_CODE_OPTIONS = LINE_OF_BUSINESS.map(l => ({
  value: l.taxCode,
  label: `${l.taxCode} — ${l.label || l.lineOfBusiness}`,
}))

function getDetailedLineOptions(taxCode) {
  const lob = LINE_OF_BUSINESS.find(l => l.taxCode === taxCode)
  if (!lob) return []
  return lob.detailedLines.map(dl => ({ value: dl, label: dl }))
}

export default function AdminLobTrainer() {
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const [stats, setStats] = useState(null)
  const [examples, setExamples] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [training, setTraining] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [filterTaxCode, setFilterTaxCode] = useState('')
  const [form] = Form.useForm()
  const [selectedTaxCode, setSelectedTaxCode] = useState('')
  const [audit, setAudit] = useState(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [geminiStatus, setGeminiStatus] = useState(null)
  const [geminiStatusLoading, setGeminiStatusLoading] = useState(false)
  const [auditThreshold, setAuditThreshold] = useState(5)
  const [tryDescription, setTryDescription] = useState('')
  const [tryResults, setTryResults] = useState(null)
  const [tryLoading, setTryLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importFileName, setImportFileName] = useState(null)
  const hasFetchedEvalRef = useRef(false)

  const fetchStats = useCallback(async () => {
    try {
      const data = await getLobTrainerStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }, [])

  const fetchExamples = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const data = await getLobTrainingExamples({
        page,
        limit: pagination.limit,
        search: searchText || undefined,
        taxCode: filterTaxCode || undefined,
      })
      setExamples(data.examples || [])
      setPagination(prev => ({
        ...prev,
        page: data.pagination?.page || page,
        total: data.pagination?.total || 0,
      }))
    } catch (err) {
      message.error(err.message || 'Failed to load training examples')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, searchText, filterTaxCode])

  const fetchAudit = useCallback(async () => {
    setAuditLoading(true)
    try {
      const data = await getLobAudit({ threshold: auditThreshold })
      setAudit(data)
    } catch (err) {
      message.error(err.message || 'Failed to load audit')
      setAudit(null)
    } finally {
      setAuditLoading(false)
    }
  }, [auditThreshold])

  const fetchEvaluation = useCallback(async () => {
    setEvalLoading(true)
    try {
      const data = await getLobEvaluation()
      setEvaluation(data)
    } catch (err) {
      message.error(err.message || 'Failed to load evaluation')
      setEvaluation(null)
    } finally {
      setEvalLoading(false)
    }
  }, [])

  const fetchGeminiStatus = useCallback(async () => {
    setGeminiStatusLoading(true)
    try {
      const data = await getGeminiStatus()
      setGeminiStatus(data)
    } catch (err) {
      message.error(err.message || 'Failed to check Gemini status')
      setGeminiStatus(null)
    } finally {
      setGeminiStatusLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchExamples(1) }, [fetchExamples])
  useEffect(() => { fetchGeminiStatus() }, [fetchGeminiStatus])
  useEffect(() => { fetchAudit() }, [fetchAudit])
  // Auto-load evaluation once when model service is configured so first visit isn't empty
  useEffect(() => {
    if (stats?.modelServiceConfigured && !hasFetchedEvalRef.current) {
      hasFetchedEvalRef.current = true
      fetchEvaluation()
    }
  }, [stats?.modelServiceConfigured, fetchEvaluation])

  const openCreateModal = () => {
    setEditingId(null)
    setSelectedTaxCode('')
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record) => {
    setEditingId(record._id)
    setSelectedTaxCode(record.taxCode)
    form.setFieldsValue({
      businessDescription: record.businessDescription,
      taxCode: record.taxCode,
      detailedLine: record.detailedLine,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateLobTrainingExample(editingId, values)
        message.success('Training example updated')
      } else {
        await createLobTrainingExample(values)
        message.success('Training example created')
      }
      setModalOpen(false)
      form.resetFields()
      fetchExamples(pagination.page)
      fetchStats()
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteLobTrainingExample(id)
      message.success('Training example deleted')
      fetchExamples(pagination.page)
      fetchStats()
    } catch (err) {
      message.error(err.message || 'Failed to delete')
    }
  }

  const handleTrain = async () => {
    setTraining(true)
    try {
      const result = await triggerLobModelTraining()
      message.success(result.message || 'Model retrained successfully')
      fetchStats()
    } catch (err) {
      message.error(err.message || 'Training failed')
    } finally {
      setTraining(false)
    }
  }

  const openAddExampleForLabel = (label) => {
    const [taxCode, ...rest] = (label || '').split('|')
    const detailedLine = rest.join('|').trim()
    if (!taxCode || !detailedLine) return
    setEditingId(null)
    setSelectedTaxCode(taxCode)
    form.setFieldsValue({ taxCode, detailedLine, businessDescription: '' })
    setModalOpen(true)
  }

  const handleTryModel = async () => {
    const desc = (tryDescription || '').trim()
    if (desc.length < 10) {
      message.warning('Enter at least 10 characters')
      return
    }
    setTryLoading(true)
    setTryResults(null)
    try {
      const data = await getLobRecommendations(desc)
      setTryResults(data.recommendations || [])
      if (!(data.recommendations?.length)) {
        message.info(data.message || 'No recommendations. Try a more specific description.')
      }
    } catch (err) {
      message.error(err.message || 'Recommendation failed')
      setTryResults([])
    } finally {
      setTryLoading(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      const data = await exportLobExamplesCsv()
      if (!data?.csv) return
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename || 'lob-training-examples.csv'
      a.click()
      URL.revokeObjectURL(url)
      message.success('Export downloaded')
    } catch (err) {
      message.error(err.message || 'Export failed')
    }
  }

  const handleImportCsv = async () => {
    if (!importFile) {
      message.warning('Select a CSV file first')
      return
    }
    setImporting(true)
    try {
      const result = await importLobExamplesCsv(importFile)
      message.success(`Imported ${result.added} examples${result.skipped ? `, ${result.skipped} skipped` : ''}`)
      setImportFile(null)
      setImportFileName(null)
      fetchExamples(1)
      fetchStats()
      fetchAudit()
    } catch (err) {
      message.error(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    {
      title: 'Description',
      dataIndex: 'businessDescription',
      key: 'businessDescription',
      ellipsis: true,
      width: isMobile ? 200 : undefined,
      render: (text) => (
        <Text style={{ maxWidth: 400 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Tax Code',
      dataIndex: 'taxCode',
      key: 'taxCode',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Detailed Line',
      dataIndex: 'detailedLine',
      key: 'detailedLine',
      ellipsis: true,
      width: isMobile ? 150 : undefined,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Delete this training example?"
            onConfirm={() => handleDelete(record._id)}
            okText="Delete Example"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const modelOnline = stats?.modelHealth?.status === 'ok'
  const modelLoaded = stats?.modelHealth?.model_loaded
  const ACCURACY_TARGET = 0.95
  const meetsTarget = evaluation && typeof evaluation.top1Accuracy === 'number' && evaluation.top1Accuracy >= ACCURACY_TARGET

  const recommendations = []
  if (audit?.summary) {
    if (audit.summary.belowCount > 0 || audit.summary.missingCount > 0) {
      const n = audit.summary.belowCount + audit.summary.missingCount
      recommendations.push(`Add more examples for ${n} label(s) below threshold (see Dataset Audit). Target: >= ${audit.summary.threshold ?? 5} examples per label.`)
    }
    if (audit.summary.adequateCount > 0 && (audit.summary.belowCount > 0 || audit.summary.missingCount > 0)) {
      recommendations.push('Run Train Model after adding examples to update the model.')
    }
  }
  if (evaluation && typeof evaluation.top1Accuracy === 'number') {
    if (evaluation.top1Accuracy < 0.5) {
      recommendations.push('Top-1 accuracy is low. Focus on labels with 0% recall in Model Evaluation.')
    }
    if (evaluation.lowestRecall?.length > 0 && evaluation.lowestRecall.some(r => r.recall === 0)) {
      recommendations.push('Add training examples for the low-recall labels listed in Model Evaluation.')
    }
  }
  if (recommendations.length === 0 && (audit?.summary || evaluation)) {
    recommendations.push('Dataset and model look in good shape. Add more examples for under-represented labels to improve accuracy.')
  }

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? 12 : 24, overflow: 'auto', flex: 1, minHeight: 0 }}>
        {!stats?.modelServiceConfigured && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Model service not configured"
            description={
              <>
                Set <Text code>LOB_MODEL_SERVICE_URL</Text> in your environment and start the Python service
                (<Text code>python ai/service/predict_app.py</Text>) to enable model training and predictions.
                The Gemini-based recommendation still works without this.
              </>
            }
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total Examples" value={stats?.totalExamples ?? '—'} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Tooltip title="Tax codes that have at least one training example">
                <span>
                  <Statistic title="Tax Codes Covered" value={stats?.byTaxCode?.length ?? '—'} />
                </span>
              </Tooltip>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Model Service"
                value={stats?.modelServiceConfigured ? (modelOnline ? 'Online' : 'Offline') : 'Not Set'}
                valueStyle={{ color: modelOnline ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Model Loaded"
                value={modelLoaded ? `Yes (${stats?.modelHealth?.num_labels ?? 0} labels)` : 'No'}
                valueStyle={{ color: modelLoaded ? '#52c41a' : undefined }}
              />
              {stats?.modelHealth?.algorithm && (
                <Text type="secondary" style={{ fontSize: 12 }}>{stats.modelHealth.algorithm}</Text>
              )}
              {stats?.modelHealth?.last_trained && (
                <div><Text type="secondary" style={{ fontSize: 11 }}>Last trained: {new Date(stats.modelHealth.last_trained).toLocaleString()}</Text></div>
              )}
            </Card>
          </Col>
        </Row>

        <Card
          size="small"
          title={
            <Space>
              <BulbOutlined />
              Recommended Actions
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {recommendations.length > 0 ? (
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              {recommendations.map((r, i) => (
                <li key={i}><Text>{r}</Text></li>
              ))}
            </ul>
          ) : (
            <Text type="secondary">Audit and evaluation load automatically. Recommendations will appear here once data is loaded.</Text>
          )}
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <BarChartOutlined />
              Dataset Audit
            </Space>
          }
          extra={
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>Target: ≥</Text>
              <Select
                size="small"
                value={auditThreshold}
                onChange={setAuditThreshold}
                options={[5, 10, 15].map((n) => ({ value: n, label: n }))}
                style={{ width: 56 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>examples</Text>
              <Button size="small" icon={<ReloadOutlined />} loading={auditLoading} onClick={fetchAudit}>
                Refresh
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Labels are from your training data (DB). Target: {'>='} {auditThreshold} examples per label for better CV.
          </Paragraph>
          {audit ? (
            <>
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col span={6}><Statistic title="Missing (0)" value={audit.summary?.missingCount ?? 0} /></Col>
                <Col span={6}><Statistic title={`Below (1–${auditThreshold - 1})`} value={audit.summary?.belowCount ?? 0} /></Col>
                <Col span={6}><Statistic title={`Adequate (≥${auditThreshold})`} value={audit.summary?.adequateCount ?? 0} /></Col>
                <Col span={6}><Statistic title="Total labels" value={audit.summary?.totalLabels ?? 0} /></Col>
              </Row>
              {audit.belowThreshold?.length > 0 && (
                <>
                  <Text strong>Labels below threshold (add more examples):</Text>
                  <Table
                    size="small"
                    dataSource={audit.belowThreshold}
                    rowKey="label"
                    pagination={{ pageSize: 10, showTotal: (t) => `${t} labels` }}
                    columns={[
                      { title: 'Count', dataIndex: 'count', width: 80, render: (c) => <Tag>{c}</Tag> },
                      { title: 'Label', dataIndex: 'label' },
                      {
                        title: '',
                        key: 'add',
                        width: 100,
                        render: (_, r) => (
                          <Button size="small" type="link" onClick={() => openAddExampleForLabel(r.label)}>
                            Add example
                          </Button>
                        ),
                      },
                    ]}
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
              {audit.missing?.length > 0 && (
                <>
                  <Alert
                    type="warning"
                    message={`${audit.missing.length} label(s) have no examples`}
                    description={
                      <Space direction="vertical" size="small">
                        {audit.missing.slice(0, 5).map((m) => (
                          <Space key={m.label}>
                            <Text>{m.label}</Text>
                            <Button size="small" type="link" onClick={() => openAddExampleForLabel(m.label)}>Add example</Button>
                          </Space>
                        ))}
                        {audit.missing.length > 5 && <Text type="secondary">...</Text>}
                      </Space>
                    }
                    style={{ marginTop: 8 }}
                  />
                </>
              )}
            </>
          ) : (
            <Text type="secondary">Click Refresh to load audit.</Text>
          )}
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <LineChartOutlined />
              Model Evaluation
            </Space>
          }
          extra={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={evalLoading}
              onClick={fetchEvaluation}
              disabled={!stats?.modelServiceConfigured}
            >
              Refresh
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          {!stats?.modelServiceConfigured ? (
            <Text type="secondary">Configure LOB_MODEL_SERVICE_URL and start the Python service to run evaluation.</Text>
          ) : evaluation ? (
            <>
              {evaluation.error && (
                <Alert type="warning" message={evaluation.error} style={{ marginBottom: 12 }} />
              )}
              {!evaluation.error && (
                <>
                  {typeof evaluation.top1Accuracy === 'number' && (
                    <Alert
                      type={meetsTarget ? 'success' : 'warning'}
                      showIcon
                      message={meetsTarget ? 'Model meets 95% accuracy target' : 'Below 95% accuracy target — add more examples for low-recall labels'}
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                    Target: 95% Top-1 accuracy. {evaluation.usingFixedTest ? 'Using fixed test set (unseen data).' : 'Using full dataset (metrics may be optimistic).'}
                  </Paragraph>
                  <Row gutter={16} style={{ marginBottom: 12 }}>
                    <Col span={8}><Statistic title="Top-1 accuracy" value={((evaluation.top1Accuracy ?? 0) * 100).toFixed(1)} suffix="%" /></Col>
                    <Col span={8}><Statistic title="Top-3 accuracy" value={((evaluation.top3Accuracy ?? 0) * 100).toFixed(1)} suffix="%" /></Col>
                    <Col span={8}><Statistic title="Top-5 accuracy" value={((evaluation.top5Accuracy ?? 0) * 100).toFixed(1)} suffix="%" /></Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: 12 }}>
                    <Col span={6}><Statistic title="Precision (macro)" value={(evaluation.precisionMacro ?? 0).toFixed(4)} /></Col>
                    <Col span={6}><Statistic title="Precision (weighted)" value={(evaluation.precisionWeighted ?? 0).toFixed(4)} /></Col>
                    <Col span={6}><Statistic title="Recall (macro)" value={(evaluation.recallMacro ?? 0).toFixed(4)} /></Col>
                    <Col span={6}><Statistic title="Recall (weighted)" value={(evaluation.recallWeighted ?? 0).toFixed(4)} /></Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: 12 }}>
                    <Col span={12}><Statistic title="F1 (macro)" value={(evaluation.macroF1 ?? 0).toFixed(4)} /></Col>
                    <Col span={12}><Statistic title="F1 (weighted)" value={(evaluation.weightedF1 ?? 0).toFixed(4)} /></Col>
                  </Row>
                  {evaluation.lowestRecall?.length > 0 && (
                    <>
                      <Text strong>Lowest recall (add more examples for these):</Text>
                      <Table
                        size="small"
                        dataSource={evaluation.lowestRecall}
                        rowKey="label"
                        pagination={false}
                        columns={[
                          { title: 'Recall', dataIndex: 'recall', width: 90, render: (r) => `${(r * 100).toFixed(0)}%` },
                          { title: 'Test n', dataIndex: 'total', width: 70 },
                          { title: 'Label', dataIndex: 'label' },
                        ]}
                        style={{ marginTop: 8 }}
                      />
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <Text type="secondary">Evaluation loads automatically when the model service is configured. Click Refresh to update.</Text>
          )}
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <PlayCircleOutlined />
              Try model
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Enter a business description to see LOB recommendations (same as the citizen form).
          </Paragraph>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%', marginBottom: 12 }} size="small">
            <TextArea
              placeholder='e.g. "I sell snacks and groceries in my sari-sari store"'
              value={tryDescription}
              onChange={(e) => setTryDescription(e.target.value)}
              rows={2}
              style={{ flex: 1, minWidth: isMobile ? '100%' : 280 }}
            />
            <Button type="primary" loading={tryLoading} onClick={handleTryModel} disabled={!stats?.modelServiceConfigured}>
              Get recommendations
            </Button>
          </Space>
          {tryResults && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text strong>Top suggestions:</Text>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                {tryResults.slice(0, 5).map((r, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <Text>{r.detailedLine}</Text> ({r.taxCode}) — {(r.confidence != null ? (r.confidence * 100).toFixed(1) : '—')}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <ApiOutlined />
              Gemini API
            </Space>
          }
          extra={
            <Button size="small" icon={<ReloadOutlined />} loading={geminiStatusLoading} onClick={fetchGeminiStatus}>
              Check
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Used for LOB recommendations and (in dev) help tips when descriptions are too vague.
          </Paragraph>
          {geminiStatus ? (
            <>
              <Row gutter={16} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <Statistic
                    title="Status"
                    value={geminiStatus.ok ? 'OK' : (geminiStatus.reason === 'not_configured' ? 'Not configured' : geminiStatus.reason === 'quota_exceeded' ? 'Quota exceeded' : geminiStatus.reason === 'model_not_found' ? 'Model not found' : 'Error')}
                    valueStyle={{
                      color: geminiStatus.ok ? '#52c41a' : geminiStatus.reason === 'not_configured' ? undefined : '#faad14',
                    }}
                  />
                </Col>
                {geminiStatus.model && (
                  <Col span={12}>
                    <Statistic title="Model" value={geminiStatus.model} />
                  </Col>
                )}
              </Row>
              {geminiStatus.message && !geminiStatus.ok && (
                <Text type="secondary" style={{ fontSize: 12 }}>{geminiStatus.message}</Text>
              )}
            </>
          ) : (
            <Text type="secondary">Click Check to see if Gemini can still be used.</Text>
          )}
        </Card>

        <Card
          size="small"
          title="Training Examples"
          extra={
            <Space wrap>
              <Button size="small" icon={<DownloadOutlined />} onClick={handleExportCsv}>
                Export CSV
              </Button>
              <Space wrap size="small">
                <span>
                  <input
                    type="file"
                    accept=".csv"
                    id="lob-import-csv"
                    style={{ width: 160, fontSize: 12 }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setImportFile(file)
                      setImportFileName(file ? file.name : null)
                    }}
                  />
                  {importFileName && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{importFileName}</Text>}
                </span>
                <Button size="small" icon={<UploadOutlined />} loading={importing} onClick={handleImportCsv} disabled={!importFile}>
                  Import CSV
                </Button>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Add Example
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Space style={{ marginBottom: 12 }} wrap>
            <Input
              placeholder="Search descriptions..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Filter by tax code"
              allowClear
              value={filterTaxCode || undefined}
              onChange={val => setFilterTaxCode(val || '')}
              options={TAX_CODE_OPTIONS}
              style={{ width: 220 }}
            />
          </Space>

          <Table
            rowKey="_id"
            columns={columns}
            dataSource={examples}
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: false,
              showTotal: (total) => `${total} examples`,
              onChange: (page) => fetchExamples(page),
            }}
            scroll={isMobile ? { x: 600 } : undefined}
            size="small"
          />
        </Card>

        <Modal
          title={editingId ? 'Edit Training Example' : 'Add Training Example'}
          open={modalOpen}
          onCancel={() => { setModalOpen(false); form.resetFields() }}
          onOk={handleSave}
          okText={editingId ? 'Update' : 'Create'}
          destroyOnHidden={false}
          width={600}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="businessDescription"
              label="Business Description"
              rules={[
                { required: true, message: 'Enter a business description' },
                { min: 10, message: 'At least 10 characters' },
              ]}
            >
              <TextArea
                rows={3}
                placeholder='e.g. "Nagtitinda ako ng pagkain at groceries" or "I run a laundry and dry cleaning shop"'
                maxLength={2000}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="taxCode"
              label="Tax Code"
              rules={[{ required: true, message: 'Select a tax code' }]}
            >
              <Select
                options={TAX_CODE_OPTIONS}
                placeholder="Select tax code"
                onChange={val => {
                  setSelectedTaxCode(val)
                  form.setFieldValue('detailedLine', undefined)
                }}
              />
            </Form.Item>

            <Form.Item
              name="detailedLine"
              label="Detailed Line of Business"
              rules={[{ required: true, message: 'Select a detailed line' }]}
            >
              <Select
                options={getDetailedLineOptions(selectedTaxCode || form.getFieldValue('taxCode'))}
                placeholder={selectedTaxCode ? 'Select detailed line' : 'Select a tax code first'}
                disabled={!selectedTaxCode && !form.getFieldValue('taxCode')}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  )
}
