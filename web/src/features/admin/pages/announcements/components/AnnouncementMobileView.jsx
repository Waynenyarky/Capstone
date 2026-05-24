import { Card } from 'antd'
import AnnouncementHeader from './AnnouncementHeader.jsx'
import AnnouncementList from './AnnouncementList.jsx'
import AnnouncementDetailPanel from './AnnouncementDetailPanel.jsx'

export default function AnnouncementMobileView(props) {
  const { selected } = props

  return (
    <Card
      styles={{ body: { background: 'transparent', padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
      style={{ background: 'transparent', border: 'none', height: '100%' }}
    >
      <AnnouncementHeader
        selected={selected}
        onBack={props.onBack}
        onCreateDraft={props.onCreateDraft}
        onRefresh={props.onRefresh}
        onOpenInfo={props.onOpenInfo}
        lastUpdated={props.lastUpdated}
        isMobile={props.isMobile}
      />

      {selected ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <AnnouncementDetailPanel {...props} />
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <AnnouncementList {...props} />
        </div>
      )}
    </Card>
  )
}
