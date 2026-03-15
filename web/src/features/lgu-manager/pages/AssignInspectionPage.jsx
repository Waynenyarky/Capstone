/**
 * Assign Inspection Page
 * LGU Manager assigns inspections to inspectors
 * Two-panel layout matching Admin User Management design
 */
import React, { useState, useCallback } from 'react'
import { Typography, Button, Grid, Tabs, theme, Spin } from 'antd'
import {
  SafetyCertificateOutlined, ReloadOutlined,
  CalendarOutlined, ScheduleOutlined, ClockCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import LGUManagerLayout from '../components/LGUManagerLayout'
import useAssignInspectionPage from './inspections/useAssignInspectionPage'
import CalendarTab from './inspections/CalendarTab'
import AppointmentsTab from './inspections/AppointmentsTab'
import PendingInspectionsTab from './inspections/PendingInspectionsTab'
import CompletedInspectionsTab from './inspections/CompletedInspectionsTab'

const { Text } = Typography

const TAB_ITEMS = [
  { key: 'calendar', label: 'Calendar', icon: CalendarOutlined },
  { key: 'appointments', label: 'Appointments', icon: ScheduleOutlined },
  { key: 'pending', label: 'Pending Inspections', icon: ClockCircleOutlined },
  { key: 'completed', label: 'Completed', icon: CheckCircleOutlined },
]

export default function AssignInspectionPage() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const { token } = theme.useToken()

  const api = useAssignInspectionPage()
  const {
    tabKey, setTabKey, loading, lastUpdated, loadData,
    inspectors, allInspections, appointments,
    unassignedBusinesses, completedInspections,
    handleCreateInspection, handleReschedule,
  } = api

  // For calendar → appointments navigation
  const [highlightId, setHighlightId] = useState(null)
  const onNavigateToAppointment = useCallback((id) => {
    setHighlightId(id)
    setTabKey('appointments')
  }, [setTabKey])
  const clearHighlightId = useCallback(() => setHighlightId(null), [])

  const tabChildren = {
    calendar: (
      <CalendarTab
        allInspections={allInspections}
        onNavigateToAppointment={onNavigateToAppointment}
      />
    ),
    appointments: (
      <AppointmentsTab
        appointments={appointments}
        inspectors={inspectors}
        loading={loading}
        onReschedule={handleReschedule}
        highlightId={highlightId}
        clearHighlightId={clearHighlightId}
      />
    ),
    pending: (
      <PendingInspectionsTab
        unassignedBusinesses={unassignedBusinesses}
        inspectors={inspectors}
        loading={loading}
        onCreateInspection={handleCreateInspection}
      />
    ),
    completed: (
      <CompletedInspectionsTab
        completedInspections={completedInspections}
        loading={loading}
      />
    ),
  }

  /* ── Desktop: two-panel layout (matching UserManagementDesktopView) ── */
  const renderNavItem = ({ key, label, icon: Icon }, isSelected) => (
    <div
      key={key}
      role="button"
      tabIndex={0}
      onClick={() => setTabKey(key)}
      onKeyDown={(e) => e.key === 'Enter' && setTabKey(key)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '6px',
        borderRadius: token.borderRadius, cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none', transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = token.colorFillTertiary }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      {Icon && (
        <span
          style={{
            width: 32, height: 32, borderRadius: token.borderRadius,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 16 }} />
        </span>
      )}
      <Text
        strong={isSelected}
        type={isSelected ? undefined : 'secondary'}
        style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}
      >
        {label}
      </Text>
    </div>
  )

  const selectedMeta = TAB_ITEMS.find((i) => i.key === tabKey) || TAB_ITEMS[0]
  const SelectedIcon = selectedMeta.icon

  const desktopContent = (
    <div
      style={{
        display: 'flex', height: '100%', minHeight: 400,
        borderRadius: token.borderRadiusLG, overflow: 'hidden',
      }}
    >
      {/* Left nav panel */}
      <div
        style={{
          width: 240, flexShrink: 0,
          borderRight: `1px solid ${token.colorBorder}`,
          padding: 12, overflowY: 'auto',
          background: token.colorBgLayout,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TAB_ITEMS.map((item) => renderNavItem(item, tabKey === item.key))}
        </div>
      </div>

      {/* Right content panel */}
      <div
        style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
          background: token.colorBgContainer, overflow: 'hidden',
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            flexShrink: 0, padding: '16px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer, zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {SelectedIcon && (
                <span
                  style={{
                    width: 32, height: 32, borderRadius: token.borderRadius,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: token.colorFillTertiary, color: token.colorPrimary,
                  }}
                >
                  <SelectedIcon style={{ fontSize: 18 }} />
                </span>
              )}
              <Text strong style={{ fontSize: 16 }}>{selectedMeta.label}</Text>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {loading && allInspections.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Spin size="large" />
            </div>
          ) : (
            tabChildren[tabKey]
          )}
        </div>
      </div>
    </div>
  )

  const mobileContent = (
    <div style={{ overflow: 'auto' }}>
      <Tabs
        activeKey={tabKey}
        onChange={setTabKey}
        items={TAB_ITEMS.map(({ key, label }) => ({
          key,
          label,
          children: loading && allInspections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
          ) : (
            tabChildren[key]
          ),
        }))}
      />
    </div>
  )

  return (
    <LGUManagerLayout
      pageTitle="Inspection Management"
      pageIcon={<SafetyCertificateOutlined />}
      headerActions={
        <>
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} aria-label="Refresh" />
        </>
      }
    >
      <div style={isMobile ? { overflow: 'auto' } : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile ? mobileContent : desktopContent}
      </div>
    </LGUManagerLayout>
  )
}
