import { Splitter, theme } from 'antd'
import AnnouncementList from './AnnouncementList.jsx'
import AnnouncementDetailPanel from './AnnouncementDetailPanel.jsx'

export default function AnnouncementDesktopView(props) {
  const { token } = theme.useToken()

  return (
    <div
      style={{
        height: 'calc(100vh - 120px)',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Splitter style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Splitter.Panel min="280px" defaultSize="30%" max="40%" style={{ overflow: 'hidden', background: token.colorBgContainer }}>
          <AnnouncementList {...props} />
        </Splitter.Panel>
        <Splitter.Panel min="60%" defaultSize="80%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', background: token.colorBgContainer }}>
          <AnnouncementDetailPanel {...props} />
        </Splitter.Panel>
      </Splitter>
    </div>
  )
}
