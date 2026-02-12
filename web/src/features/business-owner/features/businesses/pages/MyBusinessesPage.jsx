import React, { useState, useCallback } from 'react'
import { Tabs, theme } from 'antd'
import { useSearchParams } from 'react-router-dom'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import BusinessesTab from '../components/BusinessesTab'
import PermitApplicationsTab from '../components/PermitApplicationsTab'
import CessationTab from '../components/CessationTab'
import AppealsTab from '../components/AppealsTab'

const TAB_KEYS = ['businesses', 'permits', 'cessation', 'appeals']

export default function MyBusinessesPage() {
  const { token } = theme.useToken()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const activeKey = TAB_KEYS.includes(tabFromUrl) ? tabFromUrl : 'businesses'
  const [localTab, setLocalTab] = useState(activeKey)

  const currentTab = tabFromUrl && TAB_KEYS.includes(tabFromUrl) ? tabFromUrl : localTab

  const setActiveTab = useCallback((key) => {
    setLocalTab(key)
    setSearchParams(key === 'businesses' ? {} : { tab: key }, { replace: true })
  }, [setSearchParams])

  const tabItems = [
    {
      key: 'businesses',
      label: 'Businesses',
      children: <BusinessesTab onSwitchTab={setActiveTab} />
    },
    {
      key: 'permits',
      label: 'Permit applications',
      children: <PermitApplicationsTab onSwitchTab={setActiveTab} />
    },
    {
      key: 'cessation',
      label: 'Cessation',
      children: <CessationTab />
    },
    {
      key: 'appeals',
      label: 'Appeals',
      children: <AppealsTab />
    }
  ]

  return (
    <BusinessOwnerLayout pageTitle="My Businesses" showPageHeader={true}>
      <div style={{ paddingTop: 16 }}>
        <Tabs
          activeKey={currentTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </div>
    </BusinessOwnerLayout>
  )
}
