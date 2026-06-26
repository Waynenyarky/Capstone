import { useState, useCallback, useEffect } from 'react'
import { Grid, Typography } from 'antd'



import AdminLayout from '../components/AdminLayout'
import { FormDefinitionsDesktopView, FormDefinitionsMobileView } from './formDefinitions/components'
import FormDefinitionsInfoModal from './FormDefinitionsInfoModal'

const { Text } = Typography

export default function AdminFormDefinitions() {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [refreshKey, setRefreshKey] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])
  const openInfo = useCallback(() => setInfoOpen(true), [])
  const closeInfo = useCallback(() => setInfoOpen(false), [])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      if (event?.detail?.action === 'refresh') handleRefresh()
    }
    window.addEventListener('devtools:formdef', handler)
    return () => window.removeEventListener('devtools:formdef', handler)
  }, [handleRefresh])

  return (
    <AdminLayout>
      {isMobile ? (
        <FormDefinitionsMobileView refreshKey={refreshKey} onLastUpdated={setLastUpdated} />
      ) : (
        <FormDefinitionsDesktopView refreshKey={refreshKey} onLastUpdated={setLastUpdated} />
      )}
      <FormDefinitionsInfoModal open={infoOpen} onClose={closeInfo} isMobile={isMobile} />
    </AdminLayout>
  )
}
