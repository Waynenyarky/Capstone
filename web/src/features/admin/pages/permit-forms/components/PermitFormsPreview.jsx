import React, { useState, useRef, useCallback } from 'react'
import { Card, Typography, Button, Empty, Grid } from 'antd'
import { LeftOutlined, RightOutlined, ClockCircleOutlined, UnorderedListOutlined } from '@ant-design/icons'
import PermitFormDetailModal from './PermitFormDetailModal'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Paragraph, Text } = Typography

function PermitFormCard({ card, onViewDetails, token }) {
  const stepsCount = (card.processingSteps || []).length
  const totalDays = (card.processingSteps || []).reduce(
    (sum, s) => sum + (s.estimatedDurationDays || 0),
    0
  )

  return (
    <Card
      size="small"
      onClick={() => onViewDetails(card)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 320,
        height: '100%',
        cursor: 'pointer',
        border: `1px solid ${token.colorBorderSecondary}`,
        transition: 'border-color 0.2s',
      }}
      styles={{
        body: { flex: 1, display: 'flex', flexDirection: 'column' },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = token.colorPrimary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = token.colorBorderSecondary
      }}
    >
      <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
        {card.title || 'Untitled'}
      </Title>
      {card.description && (
        <Paragraph
          type="secondary"
          ellipsis={{ rows: 3 }}
          style={{ marginBottom: 8, fontSize: 13 }}
        >
          {card.description}
        </Paragraph>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {stepsCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <UnorderedListOutlined style={{ marginRight: 4 }} />
            {stepsCount} step{stepsCount !== 1 ? 's' : ''}
            {totalDays > 0 && <span> · <ClockCircleOutlined style={{ marginRight: 4 }} />~{totalDays} day{totalDays !== 1 ? 's' : ''}</span>}
          </Text>
        )}
        {card.lastUpdatedAt && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Updated {dayjs(card.lastUpdatedAt).fromNow()}
          </Text>
        )}
      </div>
    </Card>
  )
}

export default function PermitFormsPreview({ cards, sectionDescription, token }) {
  const screens = Grid.useBreakpoint()
  const hasCards = cards && cards.length > 0
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

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
        Forms and Requirements
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
                <PermitFormCard card={card} onViewDetails={setSelectedCard} token={token} />
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

      <PermitFormDetailModal
        card={selectedCard}
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  )
}
