import { Splitter, theme } from 'antd'
import AnnouncementHeader from './AnnouncementHeader.jsx'
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
      <AnnouncementHeader
        selected={props.selected}
        onBack={props.onBack}
        onCreateDraft={props.onCreateDraft}
        onRefresh={props.onRefresh}
        onOpenInfo={props.onOpenInfo}
        lastUpdated={props.lastUpdated}
        isMobile={props.isMobile}
      />
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
