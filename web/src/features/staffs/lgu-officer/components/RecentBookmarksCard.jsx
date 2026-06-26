import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, Button, Space, Spin, Empty, theme, Grid, Typography } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BookmarkService from '../infrastructure/services/bookmarkService'
import { PermitApplicationService } from '@/features/staffs/lgu-officer/infrastructure/services/permitApplicationService'
import { get } from '@/lib/http'

const { Title } = Typography

const { useBreakpoint } = Grid

export default function RecentBookmarksCard() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  const bookmarkService = useMemo(() => new BookmarkService(), [])
  const permitService = useMemo(() => new PermitApplicationService(), [])

  const loadBookmarks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await bookmarkService.getBookmarks()
      const bookmarksData = Array.isArray(response) ? response : (response.data || [])
      
      // Fetch full data for each bookmark
      const enrichedBookmarks = await Promise.all(
        bookmarksData.map(async (bookmark) => {
          try {
            if (bookmark.itemType === 'application') {
              const app = await permitService.getApplicationById(bookmark.itemId, bookmark.itemId)
              return { ...bookmark, itemData: app }
            } else if (bookmark.itemType === 'help_request') {
              const res = await get(`/api/help-requests/${bookmark.itemId}`, { skipAutoLogout: true })
              return { ...bookmark, itemData: res?.data || res }
            }
            return bookmark
          } catch (error) {
            console.error('Failed to fetch item data for bookmark:', bookmark._id, error)
            return bookmark
          }
        })
      )
      
      // Sort by createdAt (most recent first) and take top 3
      const sortedBookmarks = enrichedBookmarks
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3)
      
      setBookmarks(sortedBookmarks)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
      setBookmarks([])
    } finally {
      setLoading(false)
    }
  }, [bookmarkService, permitService])

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const handleBookmarkClick = useCallback((bookmark) => {
    navigate(`/staff/bookmarks?bookmarkId=${bookmark._id}`)
  }, [navigate])

  const handleViewAllClick = useCallback(() => {
    navigate('/staff/bookmarks')
  }, [navigate])

  const getBookmarkTitle = useCallback((bookmark) => {
    const item = bookmark.itemData
    if (!item) return 'Unknown'
    
    if (bookmark.itemType === 'application') {
      return item.businessName || item.formData?.businessName || 'Unnamed Business'
    } else if (bookmark.itemType === 'help_request') {
      return item.subject || 'No Subject'
    }
    
    return 'Unknown'
  }, [])

  return (
    <Card
      size="small"
      style={{
        width: '100%',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
      }}
      styles={{
        body: { padding: screens.lg ? '16px 16px 16px 16px' : '12px', paddingTop: screens.lg ? 90 : 48 }
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <StarOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />
        <Title level={5} style={{ margin: 0, fontSize: 16 }}>
          Recent Bookmarks
        </Title>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <Spin size="small" />
        </div>
      ) : bookmarks.length === 0 ? (
        <Empty description="No bookmarks yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
      ) : (
        <Space.Compact direction="vertical" style={{ width: '100%' }}>
          {bookmarks.map((bookmark) => (
            <Button
              key={bookmark._id}
              type="default"
              size="small"
              onClick={() => handleBookmarkClick(bookmark)}
              style={{
                textAlign: 'left',
                height: 'auto',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'flex-start',
              }}
            >
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                display: 'block',
              }}>
                {getBookmarkTitle(bookmark)}
              </span>
            </Button>
          ))}
          <Button
            type="default"
            size="small"
            onClick={handleViewAllClick}
            style={{
              textAlign: 'left',
              height: 'auto',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'flex-start',
            }}
          >
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              display: 'block',
            }}>
              View all bookmarks →
            </span>
          </Button>
        </Space.Compact>
      )}
    </Card>
  )
}
