import { useState, useCallback } from 'react'
import { Alert, Button, Space, Typography, AutoComplete, Popconfirm } from 'antd'
import { LockOutlined, UnlockOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons'
import { put, get } from '@/lib/http.js'
import { useAuthSession } from '@/features/authentication'
import { useNotifier } from '@/shared/notifications.js'

const { Text } = Typography

export default function ClaimBar({
  application,
  item,
  onClaimChange,
  apiBasePath = '/api/lgu-officer/permit-applications',
  entityLabel = 'application',
}) {
  const { currentUser } = useAuthSession()
  const { success, error: notifyError } = useNotifier()
  const [processing, setProcessing] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [officerSearch, setOfficerSearch] = useState('')
  const [officerOptions, setOfficerOptions] = useState([])
  const [selectedOfficer, setSelectedOfficer] = useState(null)

  const targetItem = item || application

  const appId = targetItem?.applicationId || targetItem?._id || targetItem?.businessId
  const claimedBy = targetItem?.reviewedBy
  const myId = currentUser?.id || currentUser?._id
  const claimedById = typeof claimedBy === 'object' ? claimedBy?._id : claimedBy
  const claimedByCurrentUser = claimedBy && myId && (String(claimedById) === String(myId))
  const claimedByName = claimedBy && typeof claimedBy === 'object'
    ? `${claimedBy.firstName || ''} ${claimedBy.lastName || ''}`.trim()
    : null

  const handleClaim = useCallback(async () => {
    if (!appId) return
    setProcessing(true)
    try {
      const res = await put(`${apiBasePath}/${appId}/claim`)
      success(`${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} claimed`)
      // Pass updated application data to parent for immediate UI update
      onClaimChange?.(res?.application || res)
    } catch (err) {
      notifyError(err, `Failed to claim ${entityLabel}`)
    } finally {
      setProcessing(false)
    }
  }, [appId, apiBasePath, success, notifyError, onClaimChange, entityLabel])

  const handleRelease = useCallback(async () => {
    if (!appId) return
    setProcessing(true)
    try {
      const res = await put(`${apiBasePath}/${appId}/release`)
      success(`${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} released`)
      // Pass updated application data to parent for immediate UI update
      onClaimChange?.(res?.application || res)
    } catch (err) {
      notifyError(err, `Failed to release ${entityLabel}`)
    } finally {
      setProcessing(false)
    }
  }, [appId, apiBasePath, success, notifyError, onClaimChange, entityLabel])

  const handleTransfer = useCallback(async () => {
    if (!appId || !selectedOfficer) return
    setProcessing(true)
    try {
      const res = await put(`${apiBasePath}/${appId}/transfer`, {
        targetOfficerId: selectedOfficer,
      })
      success(`${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} transferred`)
      setTransferOpen(false)
      setOfficerSearch('')
      setSelectedOfficer(null)
      // Pass updated application data to parent for immediate UI update
      onClaimChange?.(res?.application || res)
    } catch (err) {
      notifyError(err, `Failed to transfer ${entityLabel}`)
    } finally {
      setProcessing(false)
    }
  }, [appId, selectedOfficer, apiBasePath, success, notifyError, onClaimChange, entityLabel])

  const searchOfficers = useCallback(async (value) => {
    setOfficerSearch(value)
    if (!value || value.length < 2) { setOfficerOptions([]); return }
    try {
      const res = await get(`/api/auth/users/search?q=${encodeURIComponent(value)}&role=lgu_officer`, { skipAutoLogout: true })
      const list = Array.isArray(res) ? res : res?.data || []
      setOfficerOptions(
        list
          .filter(u => u._id !== currentUser?._id) // exclude self
          .map(u => ({
            value: u._id,
            label: `${u.firstName} ${u.lastName} (${u.email})`,
          }))
      )
    } catch {
      setOfficerOptions([])
    }
  }, [currentUser])

  if (!targetItem) return null

  // Not claimed by anyone
  if (!claimedBy) {
    return (
      <Alert
        type="info"
        showIcon
        icon={<UnlockOutlined />}
        style={{ marginBottom: 0 }}
        message={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text>This {entityLabel} is unclaimed. Claim it to start reviewing.</Text>
            <Button type="primary" size="small" icon={<LockOutlined />} loading={processing} onClick={handleClaim}>
              Claim
            </Button>
          </div>
        }
      />
    )
  }

  // Claimed by current user
  if (claimedByCurrentUser) {
    return (
      <Alert
        type="success"
        showIcon
        icon={<LockOutlined />}
        style={{ marginBottom: 0 }}
        message={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Text>You are reviewing this {entityLabel}.</Text>
            <Space size="small">
              {transferOpen ? (
                <>
                  <AutoComplete
                    size="small"
                    style={{ width: 220 }}
                    placeholder="Search officer..."
                    value={officerSearch}
                    options={officerOptions}
                    onSearch={searchOfficers}
                    onSelect={(val) => { setSelectedOfficer(val); setOfficerSearch(officerOptions.find(o => o.value === val)?.label || val) }}
                  />
                  <Button size="small" type="primary" disabled={!selectedOfficer} loading={processing} onClick={handleTransfer}>
                    Transfer
                  </Button>
                  <Button size="small" onClick={() => { setTransferOpen(false); setOfficerSearch(''); setSelectedOfficer(null) }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="small" icon={<SwapOutlined />} onClick={() => setTransferOpen(true)}>
                    Transfer
                  </Button>
                  <Popconfirm title={`Release this ${entityLabel}?`} description="It will become available for other officers." onConfirm={handleRelease} okText="Release">
                    <Button size="small" danger icon={<UnlockOutlined />} loading={processing}>
                      Release
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>
        }
      />
    )
  }

  // Claimed by another officer
  return (
    <Alert
      type="warning"
      showIcon
      icon={<UserOutlined />}
      style={{ marginBottom: 0 }}
      message={
        <Text>
          Claimed by <Text strong>{claimedByName || 'another officer'}</Text>. You can view but cannot take actions.
        </Text>
      }
    />
  )
}
