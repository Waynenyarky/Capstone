import { Row, Col } from 'antd'
import RecentBookmarksCard from '../components/RecentBookmarksCard'

const CARD_COL_PROPS = { xs: 24, md: 12, lg: 8 }

export default function OfficerDashboardPage() {
  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        {/* Recent Bookmarks Card */}
        <Col {...CARD_COL_PROPS}>
          <RecentBookmarksCard />
        </Col>
      </Row>
    </div>
  )
}
