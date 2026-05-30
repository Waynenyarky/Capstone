import { Drawer, theme } from 'antd'
import CmsAuditDetailPanel from './CmsAuditDetailPanel'

export default function CmsAuditDetailDrawer({ open, onClose, audit, token }) {
  const { token: themeToken } = theme.useToken()
  const t = token ?? themeToken

  return (
    <Drawer
      title="Audit Details"
      open={open}
      onClose={onClose}
      placement="bottom"
      height="80%"
      styles={{ body: { padding: 0 } }}
    >
      <CmsAuditDetailPanel audit={audit} token={t} />
    </Drawer>
  )
}
