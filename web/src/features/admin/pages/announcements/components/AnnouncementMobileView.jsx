import { Button, Card, theme, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import AnnouncementList from './AnnouncementList.jsx'
import AnnouncementDetailPanel from './AnnouncementDetailPanel.jsx'

const { Text } = Typography

export default function AnnouncementMobileView(props) {
  const { token } = theme.useToken()
  const { selected, setSelected } = props

  return (
    <Card
      styles={{ body: { background: 'transparent', padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
      style={{ background: 'transparent', border: 'none', height: '100%' }}
    >
      {selected ? (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setSelected(null)} size="large">
              Back
            </Button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <AnnouncementDetailPanel {...props} />
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <AnnouncementList {...props} />
        </div>
      )}
    </Card>
  )
}
