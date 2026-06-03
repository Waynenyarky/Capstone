import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Grid, Tabs, Typography } from 'antd'
import { AccountBookOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import FinanceDesktopView from './finance/FinanceDesktopView'
import { FINANCE_NAV_ITEMS } from './finance/FinanceDesktopView'
import FinanceOverviewTab from './finance/FinanceOverviewTab'
import FinanceTransactionsTab from './finance/FinanceTransactionsTab'
import FinanceReportsTab from './finance/FinanceReportsTab'
import FinanceInfoModal from './finance/FinanceInfoModal'

const { Text } = Typography

const TAB_ITEMS = FINANCE_NAV_ITEMS.map(({ key, label }) => ({ key, label }))

export default function AdminFinance() {
  const [searchParams] = useSearchParams()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [tabKey, setTabKey] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const load = useCallback(() => {
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'transactions') setTabKey('transactions')
  }, [searchParams])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action: evAction, tab } = event?.detail || {}
      if (evAction === 'setTab' && (tab === 'overview' || tab === 'transactions' || tab === 'reports')) {
        setTabKey(tab)
      } else if (evAction === 'refresh') {
        load()
      }
    }
    window.addEventListener('devtools:finance', handler)
    return () => window.removeEventListener('devtools:finance', handler)
  }, [load])

  const tabChildren = {
    overview: <FinanceOverviewTab />,
    transactions: <FinanceTransactionsTab />,
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
      <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="About" />
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
      <FinanceInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </AdminLayout>
  )
}
