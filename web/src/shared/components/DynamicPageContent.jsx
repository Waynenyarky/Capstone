import { useState, useEffect } from 'react'
import { Layout, Typography, Collapse, theme, Skeleton, Grid } from 'antd'
import { useNavigate } from 'react-router-dom'
import { get } from '@/lib/http.js'
import HomeHeader from '@/features/public/components/HomeHeader'
import HomeFooter from '@/features/public/components/HomeFooter'
import dayjs from 'dayjs'

const { Content } = Layout
const { Title, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function DynamicPageContent({ slotId }) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const navigate = useNavigate()
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchPage = async () => {
      try {
        setLoading(true)
        const res = await get(`/api/cms/pages/${slotId}`)
        if (!cancelled) setPageData(res)
      } catch {
        if (!cancelled) setPageData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPage()
    return () => { cancelled = true }
  }, [slotId])

  const collapseItems = (pageData?.sections || []).map((section) => ({
    key: section.key,
    label: section.title,
    children: (
      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>
        {section.body}
      </Paragraph>
    ),
  }))

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgContainer }}>
      <HomeHeader onNavigate={navigate} />
      <Content style={{ padding: `${screens.md ? '160px' : '100px'} 16px 24px 16px`, maxWidth: 720, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !pageData ? (
          <Typography>
            <Paragraph type="secondary">Page content not available.</Paragraph>
          </Typography>
        ) : (
          <Typography>
            <Title level={screens.md ? 2 : 4} style={{ marginTop: 0 }}>{pageData.title}</Title>
            {pageData.updatedAt && (
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Last updated: {dayjs(pageData.updatedAt).format('MMMM D, YYYY')}
              </Paragraph>
            )}

            {pageData.introText && (
              <Paragraph>{pageData.introText}</Paragraph>
            )}

            {collapseItems.length > 0 && (
              <Collapse
                defaultActiveKey={[collapseItems[0]?.key]}
                items={collapseItems}
              />
            )}
          </Typography>
        )}
      </Content>
      <HomeFooter />
    </Layout>
  )
}
