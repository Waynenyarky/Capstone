import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Typography, Space, Button, Drawer, Modal, Form, Input, Select, App, theme } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { get, post } from '@/lib/http.js'
import StaffLayout from '../../components/StaffLayout'
import OfficerRightPanel from './OfficerRightPanel'
import useOfficerData from '../hooks/useOfficerData'
import { useSocketConnection, useApplicationEvents } from '@/hooks/useSocket'

const { Text } = Typography

// Map URL paths to internal tab keys
const ROUTE_TO_TAB = {
  '/staff': 'toReview',
  '/staff/applications': 'applications',
  '/staff/appeals': 'appeals',
  '/staff/edit-requests': 'editRequests',
  '/staff/renewals': 'renewals',
  '/staff/cessation': 'cessation',
  '/staff/inspections': 'inspections',
  '/staff/help-requests': 'helpRequests',
  '/staff/drafts': 'drafts',
  '/staff/owners': 'owners',
  '/staff/logs': 'logs',
}


// ── Walk-In Drawer (business type selection → creation) ──────
function WalkInDrawer({ open, owner: initialOwner, onClose, onCreated }) {
  const [loading, setLoading] = useState(false)
  const [businessType, setBusinessType] = useState('regular')
  const [selectedOwner, setSelectedOwner] = useState(initialOwner)
  const [ownerOptions, setOwnerOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const { message } = App.useApp()
  const searchTimeoutRef = useRef(null)

  // Reset state when drawer opens/closes or initialOwner changes
  useEffect(() => {
    if (open) {
      setSelectedOwner(initialOwner)
      setOwnerOptions([])
      setBusinessType('regular')
    }
  }, [open, initialOwner])

  // Search for owners
  const handleOwnerSearch = useCallback(async (value) => {
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
    setOwnerOptions([])
  }, [ownerOptions])

  const handleClearOwner = useCallback(() => {
    setSelectedOwner(null)
  }, [])

  const handleCreateBusiness = useCallback(async () => {
    if (!selectedOwner) {
      message.warning('Please select a business owner first')
      return
    }
    setLoading(true)
    try {
      const res = await post('/api/business/applications', {
        ownerId: selectedOwner._id,
        businessType,
        source: 'walk_in'
      })
      message.success('Application created successfully')
      onCreated?.(res.application)
      onClose()
    } catch {
      message.error('Failed to create application')
    } finally {
      setLoading(false)
    }
  }, [selectedOwner, businessType, message, onCreated, onClose])

  return (
    <Drawer
      title="Walk-In Application"
      open={open}
      onClose={onClose}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong>Business Owner</Text>
          {selectedOwner ? (
            <div style={{ marginTop: 8 }}>
              <div>{selectedOwner.firstName} {selectedOwner.lastName}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{selectedOwner.email}</Text>
              <Button type="link" size="small" onClick={handleClearOwner} style={{ padding: 0 }}>
                Change
              </Button>
            </div>
          ) : (
            <Select
              showSearch
              placeholder="Search for owner"
              filterOption={false}
              onSearch={handleOwnerSearch}
              onChange={handleSelectOwner}
              options={ownerOptions.map(o => ({
                label: `${o.firstName} ${o.lastName} (${o.email})`,
                value: o._id
              }))}
              loading={searching}
              style={{ width: '100%', marginTop: 8 }}
            />
          )}
        </div>

        <div>
          <Text strong>Business Type</Text>
          <Select
            value={businessType}
            onChange={setBusinessType}
            style={{ width: '100%', marginTop: 8 }}
            options={[
              { label: 'Regular Business', value: 'regular' },
              { label: 'Large Scale', value: 'large_scale' },
              { label: 'Small Scale', value: 'small_scale' },
              { label: 'Micro Business', value: 'micro' }
            ]}
          />
        </div>

        <Button
          type="primary"
          block
          onClick={handleCreateBusiness}
          loading={loading}
          disabled={!selectedOwner}
        >
          Create Application
        </Button>
      </Space>
    </Drawer>
  )
}

export default function OfficerDashboard() {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const themeSettings = useThemeSettings(message)

  // Derive activeTab from URL
  const activeTab = useMemo(() => {
    return ROUTE_TO_TAB[location.pathname] || 'toReview'
  }, [location.pathname])

  const [selectedItem, setSelectedItem] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

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

  // Clear selectedItem when tab changes via URL
  useEffect(() => {
    setSelectedItem(null)
    setShowSettings(false)
  }, [activeTab])

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

  const handleItemSelect = useCallback((item) => {
    setSelectedItem(item)
  }, [])

  const handleReviewComplete = useCallback(() => {
    officerData.refreshToReview?.()
    officerData.refreshApplicationTabs?.()
    officerData.refresh?.()
    refresh()
  }, [officerData, refresh])

  const handleClaimChange = useCallback((updatedApplication) => {
    const selectedType = selectedItem?._itemType || activeTab

    officerData.refreshToReview?.()

    if (selectedType === 'editRequests') {
      officerData.refreshEditRequests?.()
    } else if (selectedType === 'cessation') {
      officerData.refreshCessations?.()
    } else {
      officerData.refreshApplicationTabs?.()
    }

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
    navigate('/staff/drafts')
    refresh()
    message.success('Walk-in application created. Continue in My Drafts.')
  }, [refresh, message, navigate])

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


  return (
    <StaffLayout
      hideSidebar={false}
      _noContentWrap
      onRefresh={refresh}
      lastUpdated={lastUpdated}
      socketConnected={socketConnected}
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: token.colorBgContainer }}>
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
          A temporary password will be generated and sent to the owner&apos;s email.
        </Text>
      </Modal>
    </StaffLayout>
  )
}
