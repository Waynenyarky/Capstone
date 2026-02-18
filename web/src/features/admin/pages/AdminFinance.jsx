import React, { useState, useCallback } from 'react'
import { Button, Grid, Tabs, Typography } from 'antd'
import { AccountBookOutlined, ReloadOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import FinanceDesktopView from './finance/FinanceDesktopView'
import { FINANCE_NAV_ITEMS } from './finance/FinanceDesktopView'
import FinanceOverviewTab from './finance/FinanceOverviewTab'
import FinanceTransactionsTab from './finance/FinanceTransactionsTab'
import FinanceFeeConfigTab from './finance/FinanceFeeConfigTab'
import FinanceReportsTab from './finance/FinanceReportsTab'

const { Text } = Typography

const TAB_ITEMS = FINANCE_NAV_ITEMS.map(({ key, label }) => ({ key, label }))

export default function AdminFinance() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [tabKey, setTabKey] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(() => {
    setLastUpdated(new Date())
  }, [])

  const tabChildren = {
    overview: <FinanceOverviewTab />,
    transactions: <FinanceTransactionsTab />,
    'fee-config': <FinanceFeeConfigTab />,
    reports: <FinanceReportsTab />,
  }

  const mainHeaderActions = (
    <>
      {lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
      <Button icon={<ReloadOutlined />} onClick={load} aria-label="Refresh" />
    </>
  )

  return (
    <AdminLayout
      pageTitle="Finance"
      pageIcon={<AccountBookOutlined />}
      headerActions={mainHeaderActions}
    >
      <div
        style={
          isMobile
            ? { overflow: 'auto' }
            : { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        }
      >
        {isMobile ? (
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={TAB_ITEMS.map(({ key, label }) => ({ key, label, children: tabChildren[key] }))}
          />
        ) : (
          <FinanceDesktopView
            tabKey={tabKey}
            setTabKey={setTabKey}
            tabChildren={tabChildren}
            headerActions={null}
          />
        )}
      </div>
    </AdminLayout>
  )
}
