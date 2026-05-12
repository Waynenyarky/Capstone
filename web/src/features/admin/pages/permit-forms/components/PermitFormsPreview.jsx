import React, { useState, useRef, useCallback } from 'react'
import { Card, Typography, Button, Empty, Grid } from 'antd'
import { DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { resolveIpfsUrl } from '../utils'

const { Title, Paragraph, Text } = Typography

function PermitFormCard({ card }) {
  return (
    <Card
      title={card.title || 'Untitled'}
      size="small"
      style={{ display: 'flex', flexDirection: 'column', minWidth: 320, height: '100%' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
      {card.description && (
        <Paragraph
          type="secondary"
          style={{ marginBottom: 8, fontSize: 13 }}
        >
          {card.description}
        </Paragraph>
      )}

      {card.requirements && card.requirements.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
            Requirements:
          </Text>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {card.requirements.filter(Boolean).map((req, i) => (
              <li key={i} style={{ fontSize: 13, marginBottom: 2 }}>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.downloadableFile?.cid && (
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            href={resolveIpfsUrl(card.downloadableFile.cid)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Form
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function PermitFormsPreview({ cards, sectionDescription, token }) {
  const screens = Grid.useBreakpoint()
  const hasCards = cards && cards.length > 0
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  const handleScroll = useCallback(() => {
    updateScrollState()
  }, [updateScrollState])

  React.useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => updateScrollState())
    observer.observe(el)
    return () => observer.disconnect()
  }, [cards, updateScrollState])

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > div')?.offsetWidth || 340
    el.scrollBy({ left: direction === 'left' ? -cardWidth - 16 : cardWidth + 16, behavior: 'smooth' })
  }

  return (
    <div
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: screens.md ? '24px 28px' : '18px 14px',
        background: token.colorBgLayout,
      }}
    >
      <Title
        level={4}
        style={{
          marginTop: 0,
          marginBottom: 8,
          textAlign: 'left',
        }}
      >
        Permit Forms
      </Title>
      {sectionDescription && (
        <Paragraph
          type="secondary"
          style={{
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          {sectionDescription}
        </Paragraph>
      )}

      {!hasCards ? (
        <Empty description="No permit form cards to preview" />
      ) : (
        <div style={{ position: 'relative' }}>
          <style>{`.permit-scroll-track::-webkit-scrollbar { display: none; }`}</style>
          <div
            ref={scrollRef}
            className="permit-scroll-track"
            onScroll={handleScroll}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 16,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              paddingBottom: 8,
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {cards.map((card) => (
              <div
                key={card.cardId}
                style={{
                  flex: '0 0 auto',
                  width: screens.md ? 'calc(33.333% - 11px)' : screens.sm ? 'calc(50% - 8px)' : '100%',
                  minWidth: screens.md ? 320 : 'auto',
                  scrollSnapAlign: 'start',
                }}
              >
                <PermitFormCard card={card} />
              </div>
            ))}
          </div>
          {(canScrollLeft || canScrollRight) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                size="small"
              />
              <Button
                icon={<RightOutlined />}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                size="small"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
