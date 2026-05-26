import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Button,
  Input,
  Typography,
  Card,
  Tag,
  Space,
  Alert,
  Select,
  Divider,
  Empty,
  Modal,
  theme,
  message,
  Form,
} from 'antd'
import {
  RobotOutlined,
  SendOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { post } from '@/lib/http.js'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness.js'

const { Text, Paragraph } = Typography
const { TextArea } = Input

/** Used as Form.Item child for businessActivities so the form stores an array without passing it to a DOM input. */
function NoopControl() {
  return null
}

const TAX_CODE_OPTIONS = LINE_OF_BUSINESS.map(l => ({
  value: l.taxCode,
  label: `${l.taxCode} — ${l.label || l.lineOfBusiness}`,
}))

function getDetailedLinesForTaxCode(taxCode) {
  const lob = LINE_OF_BUSINESS.find(l => l.taxCode === taxCode)
  if (!lob) return []
  return lob.detailedLines.map((dl, idx) => ({
    value: dl,
    label: dl,
    psicCode: lob.psicCodes[idx] || '',
    lineOfBusiness: lob.lineOfBusiness,
  }))
}

function normalizeActivityFromForm(a) {
  if (!a || !a.taxCode) return null
  const lob = LINE_OF_BUSINESS.find(l => l.taxCode === a.taxCode)
  const detailedLine = a.detailedLine || a.detailedLineOfBusiness
  if (!detailedLine) return null
  const idx = lob ? lob.detailedLines.indexOf(detailedLine) : -1
  const psicCode = (lob && idx >= 0 && lob.psicCodes[idx]) ? lob.psicCodes[idx] : (a.psicCode || '')
  return {
    taxCode: a.taxCode,
    lineOfBusiness: a.lineOfBusiness || (lob && lob.lineOfBusiness) || '',
    detailedLine,
    psicCode,
    source: a.source === 'ai' ? 'ai' : 'manual',
  }
}

/** Normalize API recommendation to a plain object (avoids circular refs / proxy from response). */
function normalizeRecommendation(r) {
  if (!r || !r.taxCode || !r.detailedLine) return null
  return {
    taxCode: String(r.taxCode),
    lineOfBusiness: String(r.lineOfBusiness ?? ''),
    detailedLine: String(r.detailedLine),
    psicCode: r.psicCode != null ? String(r.psicCode) : '',
    source: 'ai',
  }
}

export default function AiLobRecommendation({ field, form, readOnly = false, formDataKey = null }) {
  const { token } = theme.useToken()
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [helpTip, setHelpTip] = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [genericSuggestionMessage, setGenericSuggestionMessage] = useState(null)
  const [userAddedItems, setUserAddedItems] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [manualAddVisible, setManualAddVisible] = useState(false)
  const [manualTaxCode, setManualTaxCode] = useState(null)
  const [manualDetailedLine, setManualDetailedLine] = useState(null)
  /** Keys "taxCode:detailedLine" of AI recommendations the user has confirmed */
  const [confirmedAiKeys, setConfirmedAiKeys] = useState(() => new Set())
  const initializedFromForm = useRef(false)
  const hasRestoredFromWatch = useRef(false)
  const prevFormDataKey = useRef(formDataKey)

  const watchedDesc = Form.useWatch('businessDescriptionText', form)
  const watchedHasAnalyzed = Form.useWatch('hasAnalyzedBusinessDescription', form)
  /* Avoid useWatch('businessActivities', form) — it can trigger circular-reference warnings
     when the form compares values. We read businessActivities only inside effects via
     form.getFieldValue('businessActivities'). */

  const allActivities = [...aiRecommendations, ...userAddedItems]

  const syncToForm = useCallback((activities) => {
    const mapped = activities.map(a => ({
      taxCode: a.taxCode,
      lineOfBusiness: a.lineOfBusiness,
      detailedLineOfBusiness: a.detailedLine,
      source: a.source || 'manual',
    }))
    form.setFieldValue('businessActivities', mapped)
    if (activities.length > 0) {
      form.setFieldValue('hasAnalyzedBusinessDescription', true)
    }
  }, [form])

  useEffect(() => {
    if (prevFormDataKey.current !== formDataKey) {
      prevFormDataKey.current = formDataKey
      initializedFromForm.current = false
      hasRestoredFromWatch.current = false
    }
  }, [formDataKey])

  useEffect(() => {
    if (initializedFromForm.current) return
    const desc = form.getFieldValue('businessDescriptionText')
    const activities = form.getFieldValue('businessActivities')
    const hasAnalyzed = form.getFieldValue('hasAnalyzedBusinessDescription')
    const confirmedKeys = form.getFieldValue('lobConfirmedAiKeys')
    if (desc != null && desc !== '') setDescription(String(desc))
    const arr = Array.isArray(activities) ? activities : []
    if (arr.length > 0) {
      const restored = arr.map(normalizeActivityFromForm).filter(Boolean)
      const aiRecs = restored.filter(r => r.source === 'ai')
      const manualRecs = restored.filter(r => r.source !== 'ai')
      if (aiRecs.length > 0) setAiRecommendations(aiRecs)
      if (manualRecs.length > 0) setUserAddedItems(manualRecs)
      if (Array.isArray(confirmedKeys) && confirmedKeys.length > 0) {
        setConfirmedAiKeys(() => new Set(confirmedKeys))
      }
    }
    if (hasAnalyzed === true || arr.length > 0) setHasSubmitted(true)
    initializedFromForm.current = true
  }, [form, formDataKey])

  useEffect(() => {
    if (!initializedFromForm.current) return
    const desc = watchedDesc != null && watchedDesc !== '' ? String(watchedDesc) : ''
    const activities = Array.isArray(form.getFieldValue('businessActivities'))
      ? form.getFieldValue('businessActivities')
      : []
    const hasAnalyzed = watchedHasAnalyzed === true
    if (desc !== '') setDescription(desc)
    if (activities.length > 0 && !hasRestoredFromWatch.current) {
      const restored = activities.map(normalizeActivityFromForm).filter(Boolean)
      const aiRecs = restored.filter(r => r.source === 'ai')
      const manualRecs = restored.filter(r => r.source !== 'ai')
      if (aiRecs.length > 0) setAiRecommendations(aiRecs)
      if (manualRecs.length > 0) setUserAddedItems(manualRecs)
      const confirmedKeys = form.getFieldValue('lobConfirmedAiKeys')
      if (Array.isArray(confirmedKeys) && confirmedKeys.length > 0) {
        setConfirmedAiKeys(() => new Set(confirmedKeys))
      }
      hasRestoredFromWatch.current = true
    }
    if (hasAnalyzed && !hasSubmitted) setHasSubmitted(true)
  }, [watchedDesc, watchedHasAnalyzed, description, hasSubmitted, form])

  const handleSubmit = useCallback(async () => {
    if (!description.trim() || description.trim().length < 10) {
      message.warning('Please provide a more detailed description (at least 10 characters).')
      return
    }

    form.setFieldValue('businessDescriptionText', description.trim())
    form.setFieldValue('hasAnalyzedBusinessDescription', true)
    setLoading(true)
    setError(null)
    setGenericSuggestionMessage(null)
    setHelpTip(null)

    try {
      const res = await post('/api/business/ai/recommend-line-of-business', { businessDescription: description.trim() }, { timeoutMs: 10 * 60 * 1000 })
      const rawRecs = res?.recommendations || []
      const recs = rawRecs.map(normalizeRecommendation).filter(Boolean)
      const serverMessage = res?.message

      if (recs.length === 0) {
        setError(serverMessage || 'Your description doesn\'t clearly match any of our current lines of business. Please add your line(s) manually below.')
        setHelpTip(res?.helpTip && res.helpTip.trim() ? res.helpTip : null)
        setAiRecommendations([])
        setConfirmedAiKeys(new Set())
        form.setFieldValue('lobConfirmedAiKeys', [])
        setGenericSuggestionMessage(null)
      } else {
        const manualKeys = new Set(userAddedItems.map(u => `${u.taxCode}:${u.detailedLine}`))
        const filteredRecs = recs.filter(r => !manualKeys.has(`${r.taxCode}:${r.detailedLine}`))
        setAiRecommendations(filteredRecs)
        setConfirmedAiKeys(new Set())
        form.setFieldValue('lobConfirmedAiKeys', [])
        setError(null)
        setHelpTip(null)
        setGenericSuggestionMessage(serverMessage && serverMessage.trim() ? serverMessage : null)
        syncToForm([...filteredRecs, ...userAddedItems])
      }
      setHasSubmitted(true)
    } catch (err) {
      const msg = err?.error?.message || err?.message || 'Failed to get AI recommendations. Please try again or add manually.'
      setError(msg)
      setHasSubmitted(true)
    } finally {
      setLoading(false)
    }
  }, [description, userAddedItems, syncToForm])

  const handleManualAdd = useCallback(() => {
    if (!manualTaxCode || !manualDetailedLine) {
      message.warning('Please select both a tax code and a detailed line of business.')
      return
    }
    const lob = LINE_OF_BUSINESS.find(l => l.taxCode === manualTaxCode)
    if (!lob) return

    const dlIdx = lob.detailedLines.indexOf(manualDetailedLine)
    const newItem = {
      taxCode: manualTaxCode,
      lineOfBusiness: lob.lineOfBusiness,
      detailedLine: manualDetailedLine,
      psicCode: lob.psicCodes[dlIdx] || '',
      source: 'manual',
    }

    const key = `${newItem.taxCode}:${newItem.detailedLine}`
    const exists = allActivities.some(a => `${a.taxCode}:${a.detailedLine}` === key)
    if (exists) {
      message.info('This line of business is already in the list.')
      return
    }

    const updated = [...userAddedItems, newItem]
    setUserAddedItems(updated)
    syncToForm([...aiRecommendations, ...updated])
    setManualTaxCode(null)
    setManualDetailedLine(null)
    setManualAddVisible(false)
    message.success('Line of business added.')
  }, [manualTaxCode, manualDetailedLine, allActivities, aiRecommendations, userAddedItems, syncToForm])

  const handleRemoveManual = useCallback((index) => {
    const updated = userAddedItems.filter((_, i) => i !== index)
    setUserAddedItems(updated)
    syncToForm([...aiRecommendations, ...updated])
  }, [aiRecommendations, userAddedItems, syncToForm])

  const sendLobFeedback = useCallback((businessDesc, recommendationsWithAccepted) => {
    if (!recommendationsWithAccepted?.length) return
    post('/api/business/ai/lob-feedback', {
      businessDescription: businessDesc || '',
      recommendations: recommendationsWithAccepted.map(r => ({
        taxCode: r.taxCode,
        lineOfBusiness: r.lineOfBusiness,
        detailedLine: r.detailedLine,
        accepted: r.accepted,
        acceptedWithEdits: r.acceptedWithEdits === true,
      })),
    }).catch(() => { /* fire-and-forget; don't block UI */ })
  }, [])

  const handleRemoveAi = useCallback((index) => {
    const rec = aiRecommendations[index]
    if (rec) {
      sendLobFeedback(description, [{ ...rec, accepted: false }])
      setConfirmedAiKeys(prev => {
        const n = new Set(prev)
        n.delete(`${rec.taxCode}:${rec.detailedLine}`)
        form.setFieldValue('lobConfirmedAiKeys', Array.from(n))
        return n
      })
    }
    const updated = aiRecommendations.filter((_, i) => i !== index)
    setAiRecommendations(updated)
    syncToForm([...updated, ...userAddedItems])
  }, [aiRecommendations, userAddedItems, syncToForm, description, sendLobFeedback, form])

  const handleConfirmAi = useCallback((rec) => {
    sendLobFeedback(description, [{ ...rec, accepted: true }])
    setConfirmedAiKeys(prev => {
      const next = new Set(prev).add(`${rec.taxCode}:${rec.detailedLine}`)
      form.setFieldValue('lobConfirmedAiKeys', Array.from(next))
      return next
    })
    message.success(`"${rec.detailedLine}" confirmed.`)
  }, [description, sendLobFeedback, form])

  const handleModalOk = useCallback(() => {
    handleManualAdd()
  }, [handleManualAdd])

  const detailedLineOptions = manualTaxCode ? getDetailedLinesForTaxCode(manualTaxCode) : []

  return (
    <div>
      <Form.Item name="businessDescriptionText" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name="hasAnalyzedBusinessDescription" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name="lobConfirmedAiKeys" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item
        name="businessActivities"
        hidden
        rules={readOnly ? [] : [{ validator: (_, value) => (value && Array.isArray(value) && value.length > 0 ? Promise.resolve() : Promise.reject(new Error('Select or add at least one line of business.'))) }]}
      >
        <NoopControl />
      </Form.Item>
      {field.helpText && (
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
          {field.helpText}
        </Text>
      )}

      <TextArea
        value={description}
        onChange={e => {
          if (readOnly) return
          const v = e.target.value
          setDescription(v)
          form.setFieldValue('businessDescriptionText', v)
          setError(null)
          setHelpTip(null)
        }}
        placeholder={field.placeholder || 'Describe what your business sells or does...'}
        autoSize={{ minRows: 3, maxRows: 8 }}
        maxLength={1000}
        showCount
        disabled={loading || readOnly}
        readOnly={readOnly}
        style={{ marginBottom: 12 }}
      />

      {!readOnly && (
        <Button
          type="primary"
          icon={loading ? null : <SendOutlined />}
          loading={loading}
          onClick={handleSubmit}
          disabled={!description.trim() || description.trim().length < 10}
          style={{ marginBottom: 16 }}
        >
          {loading ? 'Analyzing...' : hasSubmitted ? 'Re-analyze' : 'Analyze my business'}
        </Button>
      )}

      {error && (
        <Alert
          type="warning"
          message={error}
          description={helpTip}
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => { setError(null); setHelpTip(null) }}
        />
      )}

      {hasSubmitted && genericSuggestionMessage && aiRecommendations.length > 0 && (
        <Alert
          type="info"
          message={genericSuggestionMessage}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {hasSubmitted && aiRecommendations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <RobotOutlined style={{ color: token.colorPrimary }} />
            <Text strong>AI Recommended Lines of Business</Text>
            <Tag color="blue" style={{ marginLeft: 4 }}>{aiRecommendations.length}</Tag>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aiRecommendations.map((rec, idx) => {
              const recKey = `${rec.taxCode}:${rec.detailedLine}`
              const isConfirmed = confirmedAiKeys.has(recKey)
              return (
              <Card
                key={`ai-${idx}`}
                size="small"
                style={{
                  border: `1px solid ${isConfirmed ? token.colorSuccess : token.colorBorder}`,
                  background: isConfirmed ? token.colorSuccessBg : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Space size={8}>
                      <Text strong>{rec.detailedLine}</Text>
                      {isConfirmed && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>Confirmed</Tag>
                      )}
                    </Space>
                    <div style={{ marginTop: 2 }}>
                      <Tag>{rec.taxCode}</Tag>
                      <Tag>{rec.lineOfBusiness}</Tag>
                      {rec.psicCode && <Tag color="default">PSIC {rec.psicCode}</Tag>}
                    </div>
                  </div>
                  <Space size={4}>
                    {!readOnly && (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          title="Confirm"
                          aria-label="Confirm recommendation"
                          onClick={() => handleConfirmAi(rec)}
                          disabled={isConfirmed}
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<CloseOutlined />}
                          title="Remove"
                          aria-label="Remove recommendation"
                          onClick={() => handleRemoveAi(idx)}
                        />
                      </>
                    )}
                  </Space>
                </div>
              </Card>
              )
            })}
          </div>
        </div>
      )}

      {userAddedItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <PlusOutlined style={{ color: token.colorWarning }} />
            <Text strong>Manually Added</Text>
            <Tag color="orange" style={{ marginLeft: 4 }}>{userAddedItems.length}</Tag>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userAddedItems.map((item, idx) => (
              <Card
                key={`manual-${idx}`}
                size="small"
                style={{
                  border: `1px solid ${token.colorWarningBorder}`,
                  background: token.colorWarningBg,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>{item.detailedLine}</Text>
                    <div style={{ marginTop: 2 }}>
                      <Tag>{item.taxCode}</Tag>
                      <Tag>{item.lineOfBusiness}</Tag>
                      {item.psicCode && <Tag color="default">PSIC {item.psicCode}</Tag>}
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Remove line"
                      onClick={() => handleRemoveManual(idx)}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!readOnly && hasSubmitted && aiRecommendations.length === 0 && userAddedItems.length === 0 && !loading && (
        <Empty
          description="No lines of business yet. Describe your business above or add manually."
          style={{ marginBottom: 16 }}
        />
      )}

      {readOnly && hasSubmitted && allActivities.length === 0 && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          No lines of business specified.
        </Text>
      )}

      {!readOnly && hasSubmitted && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
            Something missing? You can describe more or add a line of business manually.
          </Paragraph>
          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setManualAddVisible(true)}
            >
              Add line manually
            </Button>
          </Space>
        </>
      )}

      <Modal
        title="Add Line of Business"
        open={manualAddVisible}
        onCancel={() => {
          setManualAddVisible(false)
          setManualTaxCode(null)
          setManualDetailedLine(null)
        }}
        onOk={handleModalOk}
        okText="Add"
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Tax Code</Text>
            <Select
              placeholder="Select tax code"
              value={manualTaxCode}
              onChange={val => { setManualTaxCode(val); setManualDetailedLine(null) }}
              options={TAX_CODE_OPTIONS}
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Detailed Line of Business</Text>
            <Select
              placeholder={manualTaxCode ? 'Select line of business' : 'Select a tax code first'}
              value={manualDetailedLine}
              onChange={setManualDetailedLine}
              options={detailedLineOptions}
              disabled={!manualTaxCode}
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
