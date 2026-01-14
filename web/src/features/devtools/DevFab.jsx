import { useState } from 'react'
import { FloatButton, Tooltip } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import DevPanel from './DevPanel'
import { useDevTools } from './DevToolsProvider'
import './devtools.css'

export default function DevFab() {
  const { enabled } = useDevTools()
  const [open, setOpen] = useState(false)

  if (!enabled) return null

  return (
    <>
      <Tooltip title="Developer tools">
        <FloatButton
          shape="circle"
          type="primary"
          icon={<BugOutlined />}
          onClick={() => setOpen(true)}
          style={{ right: 24, bottom: 28, zIndex: 1100 }}
        />
      </Tooltip>
      <DevPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
