import { useState, useEffect } from 'react'
import { Card, Space, Typography, Button, Select, Input, Alert } from 'antd'
import { theme, App } from 'antd'

const { Text } = Typography
const { TextArea } = Input

export default function AppealCard({ application, onAppealResolved }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [appeal, setAppeal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [appealDecision, setAppealDecision] = useState(null)
  const [noAppeal, setNoAppeal] = useState(false)

  const businessId = application?.businessId || application?.applicationId
  const isRejected = application?.status === 'rejected' || application?.status === 'appeal_pending'

  useEffect(() => {
    if (!businessId || !isRejected) return
    
    const fetchAppeal = async () => {
      setLoading(true)
      try {
        const { get } = await import('@/lib/http')
        const res = await get(`/api/business/appeals/by-business/${businessId}`)
        const appeals = res?.data || []
        // Get the latest active appeal
        const activeAppeal = appeals.find(a => a.status === 'submitted' || a.status === 'under_review')
        if (activeAppeal) {
          setAppeal(activeAppeal)
          setNoAppeal(false)
        } else {
          setAppeal(null)
          setNoAppeal(true)
        }
      } catch (err) {
        console.error('Failed to fetch appeal:', err)
        setNoAppeal(true)
      } finally {
        setLoading(false)
      }
    }
    fetchAppeal()
  }, [businessId, isRejected])

  const handleResolveAppeal = async () => {
    if (!appeal || !appealDecision) return
    
    setResolving(true)
    try {
      const { put } = await import('@/lib/http')
      await put(`/api/business/appeals/${appeal._id}`, {
        status: appealDecision,
        resolution: resolution.trim() || undefined
      })
      message.success(`Appeal ${appealDecision === 'approved' ? 'approved' : 'rejected'} successfully`)
      setAppeal(null)
      setAppealDecision(null)
      setResolution('')
      onAppealResolved?.()
    } catch (err) {
      message.error(err?.message || 'Failed to resolve appeal')
    } finally {
      setResolving(false)
    }
  }

  const getAppealTypeLabel = (type) => {
    const labels = {
      'rejection_appeal': 'Appeal Rejection Decision',
      'wrong_assessment': 'Wrong Assessment',
      'wrong_fees': 'Wrong Fees',
      'wrong_violations': 'Wrong Violations',
      'other': 'Other'
    }
    return labels[type] || type
  }

  // Don't show for non-rejected applications
  if (!isRejected) {
    return null
  }

  // Show exhausted state
  if (application?.appealExhausted && !appeal) {
    return (
      <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
            <div><Text strong style={{ color: token.colorError }}>Appeal Rejected</Text></div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Result</Text>
            <div><Text strong>Appeal exhausted - Final decision stands</Text></div>
          </div>
        </Space>
      </Card>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
        <Text type="secondary">Loading appeal details...</Text>
      </Card>
    )
  }

  // Show no appeal state
  if (noAppeal || !appeal) {
    return null
  }

  // Show appeal details
  return (
    <Card title="Appeal" size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Type</Text>
          <div><Text strong>{getAppealTypeLabel(appeal.type)}</Text></div>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
          <div><Text strong style={{ 
            color: appeal.status === 'submitted' ? token.colorWarning 
                   : appeal.status === 'under_review' ? token.colorProcessing
                   : appeal.status === 'approved' ? token.colorSuccess
                   : token.colorError 
          }}>{appeal.status}</Text></div>
        </div>
        {appeal.reason && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Reason</Text>
            <div><Text>{appeal.reason}</Text></div>
          </div>
        )}
        {appeal.description && (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Description</Text>
            <div><Text>{appeal.description}</Text></div>
          </div>
        )}
        {appeal.status === 'submitted' || appeal.status === 'under_review' ? (
          <>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Your Decision</Text>
              <Select
                placeholder="Select decision"
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { label: 'Approve Appeal', value: 'approved' },
                  { label: 'Reject Appeal', value: 'rejected' }
                ]}
                value={appealDecision}
                onChange={setAppealDecision}
              />
            </div>
            {appealDecision && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Resolution (optional)</Text>
                <TextArea
                  rows={2}
                  placeholder="Add resolution notes..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  style={{ marginTop: 4 }}
                />
              </div>
            )}
            <Button
              type="primary"
              onClick={handleResolveAppeal}
              loading={resolving}
              disabled={!appealDecision}
              block
            >
              Resolve Appeal
            </Button>
          </>
        ) : (
          <Alert
            type={appeal.status === 'approved' ? 'success' : 'error'}
            message={`Appeal ${appeal.status}`}
            description={appeal.resolution || 'No resolution provided'}
          />
        )}
      </Space>
    </Card>
  )
}
