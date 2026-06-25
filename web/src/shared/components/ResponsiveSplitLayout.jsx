import { useState, useCallback, useEffect } from 'react'
import { Grid, Drawer, Splitter } from 'antd'

const { useBreakpoint } = Grid

/**
 * ResponsiveSplitLayout - A reusable split layout component that adapts to screen size
 * 
 * Desktop: Uses Splitter with left/right panels
 * Mobile: Uses Drawer for detail panel (configurable placement)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.listContent - Left panel content (list of items)
 * @param {React.ReactNode} props.detailContent - Right panel content (detail view)
 * @param {string} props.drawerTitle - Title for mobile drawer
 * @param {Function} props.onDrawerClose - Callback when drawer closes
 * @param {string} props.mobileDrawerPlacement - Drawer placement for mobile: 'right' | 'bottom' (default: 'right')
 * @param {number} props.listMinWidth - Minimum width for list panel on desktop (default: 300)
 * @param {number} props.listMaxWidth - Maximum width for list panel on desktop (default: 400)
 * @param {string} props.listDefaultSize - Default size for list panel on desktop (default: '25%')
 * @param {string} props.detailDefaultSize - Default size for detail panel on desktop (default: '75%')
 * @param {number} props.mobileBreakpoint - Breakpoint for mobile view (default: 'lg')
 */
export default function ResponsiveSplitLayout({
  listContent,
  detailContent,
  drawerTitle = 'Details',
  onDrawerClose,
  mobileDrawerPlacement = 'right',
  listMinWidth = 300,
  listMaxWidth = 400,
  listDefaultSize = '25%',
  detailDefaultSize = '75%',
  mobileBreakpoint = 'lg',
}) {
  const screens = useBreakpoint()
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)

  // Open drawer when detail content is provided on mobile
  useEffect(() => {
    if (detailContent && !screens[mobileBreakpoint]) {
      setDetailDrawerOpen(true)
    }
  }, [detailContent, screens, mobileBreakpoint])

  const handleCloseDrawer = useCallback(() => {
    setDetailDrawerOpen(false)
    onDrawerClose?.()
  }, [onDrawerClose])

  // Mobile view: list as main panel, detail in drawer
  if (!screens[mobileBreakpoint]) {
    const drawerProps = {
      title: drawerTitle,
      open: detailDrawerOpen,
      onClose: handleCloseDrawer,
      styles: { body: { padding: 0 } },
    }

    if (mobileDrawerPlacement === 'right') {
      drawerProps.placement = 'right'
      drawerProps.width = '100%'
    } else {
      drawerProps.placement = 'bottom'
      drawerProps.height = '100%'
    }

    return (
      <>
        <div style={{ height: '100%', overflow: 'hidden' }}>
          {listContent}
        </div>
        <Drawer {...drawerProps}>
          {detailContent}
        </Drawer>
      </>
    )
  }

  // Desktop view: split panel
  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel 
        min={listMinWidth} 
        max={listMaxWidth} 
        defaultSize={listDefaultSize} 
        style={{ 
          overflow: 'hidden', 
          minWidth: `${listMinWidth}px`, 
          maxWidth: `${listMaxWidth}px` 
        }}
      >
        {listContent}
      </Splitter.Panel>
      <Splitter.Panel 
        min="50%" 
        defaultSize={detailDefaultSize} 
        style={{ overflow: 'hidden' }}
      >
        {detailContent || (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Select an item to view details
          </div>
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
