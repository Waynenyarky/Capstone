import { useState, useCallback, useRef, useEffect } from 'react'
import { Typography, Space, Button, Drawer, Modal, Form, Input, Select, App, theme } from 'antd'
import { 
  IdcardOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import { LayoutPageHeader } from '@/features/shared'
import { SiteStatusPill } from '@/features/shared/components'
import BizClearLogo from '@/shared/components/BizClearLogo.jsx'
import { useAuthSession } from '@/features/authentication'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { get, post } from '@/lib/http.js'
import OfficerLeftPanel from '../components/OfficerLeftPanel'
import OfficerRightPanel from './OfficerRightPanel'
import useOfficerData from '../hooks/useOfficerData'
import { useSocketConnection, useApplicationEvents } from '@/hooks/useSocket'

const { Text } = Typography

function BrandHeader() {
  const { token } = theme.useToken()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 32, height: 32, flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8
      }}>
        <BizClearLogo width={24} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 16, color: token.colorTextBase, whiteSpace: 'nowrap' }}>
        {import.meta.env.VITE_APP_BRAND_NAME || 'BizClear'}
      </span>
    </div>
  )
}

export default function OfficerDashboard() {
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const { currentUser } = useAuthSession()
  const themeSettings = useThemeSettings(message)

  const [activeTab, setActiveTab] = useState('toReview')
  const [selectedItem, setSelectedItem] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showSettings, setShowSettings] = useState(false) // Settings view state
  const [systemStatus, setSystemStatus] = useState('healthy') // healthy, warning, critical

  // Socket connection for realtime updates
  const { connected: socketConnected } = useSocketConnection()

  // Use the data hook
  const officerData = useOfficerData(activeTab, refreshTrigger)

  // Listen for realtime application events
  useApplicationEvents({
    onApplicationCreated: useCallback((data) => {
      console.log('[Realtime] New application:', data)
      message.info(`New application submitted: ${data.application?.businessName || 'Unknown'}`)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, [message]),
    onApplicationUpdated: useCallback((data) => {
      console.log('[Realtime] Application updated:', data)
      // Refresh if viewing the updated application
      if (selectedItem && (selectedItem._id === data.application?._id || selectedItem.businessId === data.application?.businessId)) {
        setRefreshTrigger(prev => prev + 1)
      }
      setLastUpdated(new Date())
    }, [selectedItem]),
    onApplicationClaimed: useCallback((data) => {
      console.log('[Realtime] Application claimed:', data)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, []),
    onApplicationReleased: useCallback((data) => {
      console.log('[Realtime] Application released:', data)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, []),
  })

  // Set initial last updated time when data loads
  useEffect(() => {
    if (officerData.counts && !lastUpdated) {
      setLastUpdated(new Date())
    }
  }, [officerData.counts, lastUpdated])

  // Sync selectedItem with refreshed toReview data so detail panel sees updated _requests
  useEffect(() => {
    if (!selectedItem || selectedItem._itemType !== 'business' || !officerData.toReview?.length) return
    const refreshed = officerData.toReview.find(card => card.businessId === selectedItem.businessId)
    if (refreshed && refreshed !== selectedItem) {
      setSelectedItem(prev => ({
        ...prev,
        ...refreshed,
        _itemId: prev._itemId,
        _itemType: prev._itemType,
      }))
    }
  }, [officerData.toReview])

  // Walk-in states
  const [walkInDrawerOpen, setWalkInDrawerOpen] = useState(false)
  const [walkInOwner, setWalkInOwner] = useState(null)

  // Register owner states
  const [registerOwnerOpen, setRegisterOwnerOpen] = useState(false)
  const [registerForm] = Form.useForm()
  const [registering, setRegistering] = useState(false)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    setLastUpdated(new Date())
  }, [])

  const getSystemStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      case 'critical':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    }
  }

  const handleItemSelect = useCallback((item) => {
    setSelectedItem(item)
  }, [])

  const handleTabChange = useCallback((tab) => {
    if (tab === 'settings') {
      setShowSettings(true)
      setActiveTab('toReview') // Keep previous tab active when exiting settings
    } else {
      setActiveTab(tab)
      setSelectedItem(null)
      setShowSettings(false)
    }
  }, [])

  const handleReviewComplete = useCallback(() => {
    officerData.refreshToReview?.()
    officerData.refreshApplicationTabs?.()
    officerData.refresh?.()
    refresh()
    // Don't clear selectedItem — keep the business card selected so officer sees updated state
  }, [officerData, refresh])

  const handleClaimChange = useCallback((updatedApplication) => {
    const selectedType = selectedItem?._itemType || activeTab

    // Always refresh To Review (cross-entity claimed queue)
    officerData.refreshToReview?.()

    // Refresh affected tabs for claim/release/transfer
    if (selectedType === 'editRequests') {
      officerData.refreshEditRequests?.()
    } else if (selectedType === 'cessation') {
      officerData.refreshCessations?.()
    } else {
      officerData.refreshApplicationTabs?.()
    }

    // Update selectedItem with fresh data from API response for immediate UI update
    if (updatedApplication && selectedItem) {
      const updatedItem = {
        ...selectedItem,
        ...updatedApplication,
        _itemId: selectedItem._itemId,
        _itemType: selectedItem._itemType,
      }
      setSelectedItem(updatedItem)
    }
  }, [officerData, selectedItem, activeTab])

  // ── Walk-In Application ──────────────────────────────────
  const handleCreateWalkIn = useCallback((owner = null) => {
    setWalkInOwner(owner)
    setWalkInDrawerOpen(true)
  }, [])

  const handleWalkInCreated = useCallback(() => {
    setWalkInDrawerOpen(false)
    setWalkInOwner(null)
    setActiveTab('drafts')
    refresh()
    message.success('Walk-in application created. Continue in My Drafts.')
  }, [refresh, message])

  // ── Register Owner ──────────────────────────────────────
  const handleRegisterOwner = useCallback(() => {
    setRegisterOwnerOpen(true)
  }, [])

  const handleRegisterSubmit = useCallback(async () => {
    try {
      const values = await registerForm.validateFields()
      setRegistering(true)
      await post('/api/auth/register-walk-in', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || '',
      })
      message.success('Owner registered successfully')
      registerForm.resetFields()
      setRegisterOwnerOpen(false)
      refresh()
    } catch (err) {
      if (err?.errorFields) return // validation error
      message.error(err?.message || 'Failed to register owner')
    } finally {
      setRegistering(false)
    }
  }, [registerForm, message, refresh])

  const leftContent = <BrandHeader />

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <LayoutPageHeader
        pageTitle="Officer Dashboard"
        pageIcon={<IdcardOutlined />}
        headerActions={
          <SiteStatusPill
            lastUpdated={lastUpdated}
            socketConnected={socketConnected}
            onRefresh={refresh}
            loading={false}
          />
        }
        viewNotificationsPath="/notifications"
        showPageHeader
        leftContent={leftContent}
        onSettingsClick={() => setShowSettings(true)} // Open settings in dashboard
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: token.colorBgContainer }}>
        {/* Left Panel */}
        <div style={{
          width: 240, minWidth: 240, maxWidth: 240,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          background: token.colorBgContainer,
        }}>
          <OfficerLeftPanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={officerData.counts}
            showSettings={showSettings}
          />
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <OfficerRightPanel
            selectedItem={selectedItem}
            onItemSelect={handleItemSelect}
            activeTab={activeTab}
            onReviewComplete={handleReviewComplete}
            onClaimChange={handleClaimChange}
            onCreateWalkIn={handleCreateWalkIn}
            onRegisterOwner={handleRegisterOwner}
            refresh={refresh}
            officerData={officerData}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            themeSettings={themeSettings}
          />
        </div>
      </div>

      {/* Walk-In Application Drawer */}
      <WalkInDrawer
        open={walkInDrawerOpen}
        owner={walkInOwner}
        onClose={() => { setWalkInDrawerOpen(false); setWalkInOwner(null) }}
        onCreated={handleWalkInCreated}
      />

      {/* Register Owner Modal */}
      <Modal
        title="Register New Business Owner"
        open={registerOwnerOpen}
        onCancel={() => { setRegisterOwnerOpen(false); registerForm.resetFields() }}
        onOk={handleRegisterSubmit}
        confirmLoading={registering}
        okText="Register"
      >
        <Form form={registerForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="First Name" />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Last Name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="phone" label="Phone (Optional)">
            <Input placeholder="Phone number" />
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          A temporary password will be generated and sent to the owner's email.
        </Text>
      </Modal>
    </div>
  )
}

// ── Walk-In Drawer (business type selection → creation) ──────
function WalkInDrawer({ open, owner: initialOwner, onClose, onCreated }) {
  const [loading, setLoading] = useState(false)
  const [businessType, setBusinessType] = useState('regular')
  const [selectedOwner, setSelectedOwner] = useState(initialOwner)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerOptions, setOwnerOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const { message } = App.useApp()
  const searchTimeoutRef = useRef(null)

  // Reset state when drawer opens/closes or initialOwner changes
  useEffect(() => {
    if (open) {
      setSelectedOwner(initialOwner)
      setOwnerSearch('')
      setOwnerOptions([])
      setBusinessType('regular')
    }
  }, [open, initialOwner])

  // Search for owners
  const handleOwnerSearch = useCallback(async (value) => {
    setOwnerSearch(value)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (!value || value.length < 2) {
      setOwnerOptions([])
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await get(`/api/admin/users?search=${encodeURIComponent(value)}&role=business_owner&limit=10`)
        setOwnerOptions(res.users || [])
      } catch (err) {
        console.error('Owner search failed:', err)
        setOwnerOptions([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleSelectOwner = useCallback((userId) => {
    const owner = ownerOptions.find(o => o._id === userId)
    setSelectedOwner(owner)
    setOwnerSearch('')
    setOwnerOptions([])
  }, [ownerOptions])

  const handleClearOwner = useCallback(() => {
    setSelectedOwner(null)
  }, [])

  const handleCreate = async () => {
    if (!selectedOwner) {
      message.warning('Please select a business owner')
      return
    }
    setLoading(true)
    try {
      // Map 'regular' -> 'permit', 'temporary' -> 'general_permit'
      const permitType = businessType === 'temporary' ? 'general_permit' : 'permit'
      await post('/api/business/walk-in', {
        ownerId: selectedOwner._id,
        permitType,
      })
      onCreated()
    } catch (err) {
      message.error(err?.message || 'Failed to create walk-in application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title="Create Walk-In Application"
      open={open}
      onClose={onClose}
      width={400}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={handleCreate} disabled={!selectedOwner}>Create Draft</Button>
          </Space>
        </div>
      }
    >
      <Form layout="vertical">
        <Form.Item label="Business Type">
          <Select value={businessType} onChange={setBusinessType}>
            <Select.Option value="regular">Regular</Select.Option>
            <Select.Option value="temporary">Temporary</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Business Owner" required>
          {selectedOwner ? (
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div><Text strong>{selectedOwner.firstName} {selectedOwner.lastName}</Text></div>
                <Text type="secondary" style={{ fontSize: 12 }}>{selectedOwner.email}</Text>
              </div>
              <Button size="small" onClick={handleClearOwner}>Change</Button>
            </div>
          ) : (
            <Select
              showSearch
              placeholder="Search by name or email..."
              filterOption={false}
              onSearch={handleOwnerSearch}
              onChange={handleSelectOwner}
              loading={searching}
              notFoundContent={searching ? 'Searching...' : (ownerSearch.length < 2 ? 'Type at least 2 characters' : 'No owners found')}
              value={null}
            >
              {ownerOptions.map(owner => (
                <Select.Option key={owner._id} value={owner._id}>
                  <div>
                    <div>{owner.firstName} {owner.lastName}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{owner.email}</Text>
                  </div>
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
      </Form>
      <Text type="secondary" style={{ fontSize: 12 }}>
        This will create a draft application that you can fill out in the "My Drafts" tab.
      </Text>
    </Drawer>
  )
}
