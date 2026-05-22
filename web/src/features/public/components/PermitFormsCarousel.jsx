import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Typography, Card, Button, Divider, Modal, Drawer, Timeline } from 'antd'
import { LeftOutlined, RightOutlined, ClockCircleOutlined, UnorderedListOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Paragraph, Text } = Typography

function resolveIpfsUrl(cid) {
  if (!cid) return ''
  if (cid.startsWith('http')) return cid
  const gateway = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'
  return `${gateway}${cid}`
}

function PermitFormDetailContent({ card }) {
  const totalDays = (card.processingSteps || []).reduce(
    (sum, s) => sum + (s.estimatedDurationDays || 0),
    0
  )

  const timelineItems = (card.processingSteps || [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((step, idx, arr) => {
      const isFirst = idx === 0
      const isLast = idx === arr.length - 1
      return {
        color: isFirst ? 'blue' : isLast ? 'green' : 'gray',
        dot: isLast ? <CheckCircleOutlined /> : undefined,
        children: (
          <div style={{ paddingBottom: 4 }}>
            <Text strong>{step.title}</Text>
            {step.description && (
              <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 2, fontSize: 13 }}>
                {step.description}
              </Paragraph>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {step.estimatedDurationDays === 0
                ? 'Same day'
                : `~${step.estimatedDurationDays} day${step.estimatedDurationDays !== 1 ? 's' : ''}`}
            </Text>
          </div>
        ),
      }
    })

  return (
    <div>
      <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
        {card.title || 'Untitled'}
      </Title>
      {card.description && (
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {card.description}
        </Paragraph>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {card.processingSteps && card.processingSteps.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <UnorderedListOutlined style={{ marginRight: 4 }} />
            {card.processingSteps.length} step{card.processingSteps.length !== 1 ? 's' : ''}
          </Text>
        )}
        {totalDays > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            ~{totalDays} day{totalDays !== 1 ? 's' : ''}
          </Text>
        )}
        {card.lastUpdatedAt && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            Updated {dayjs(card.lastUpdatedAt).fromNow()}
          </Text>
        )}
      </div>
      {card.requirements?.filter(Boolean).length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 32, marginBottom: 8 }}>Requirements</Title>
          <ul style={{ paddingLeft: 20, margin: 0, marginBottom: 32 }}>
            {card.requirements.filter(Boolean).map((req, i) => (
              <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{req}</li>
            ))}
          </ul>
        </>
      )}
      {timelineItems.length > 0 && (
        <>
          <Title level={5} style={{ margin: 0, marginBottom: 12, marginTop: 32 }}>Processing Steps</Title>
          <div style={{ padding: 16 }}>
            <Timeline items={timelineItems} />
          </div>
        </>
      )}
      {card.downloadableFile?.cid && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            href={resolveIpfsUrl(card.downloadableFile.cid)}
            target="_blank"
            rel="noopener noreferrer"
            block
          >
            Download Form{card.downloadableFile.fileName ? ` — ${card.downloadableFile.fileName}` : ''}
          </Button>
        </>
      )}
    </div>
  )
}

export default function PermitFormsCarousel({ cards, sectionDescription, screens, token }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const isMobile = !screens.md

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  const handleScroll = useCallback(() => {
    updateScrollState()
  }, [updateScrollState])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
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
    <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
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
        <div style={{ position: 'relative' }}>
          <style>{`.hero-permit-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div
            ref={scrollRef}
            className="hero-permit-scroll"
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
            {cards.map((card) => {
              const stepsCount = (card.processingSteps || []).length
              const totalDays = (card.processingSteps || []).reduce(
                (sum, s) => sum + (s.estimatedDurationDays || 0),
                0
              )
              return (
                <div
                  key={card.cardId || card._id}
                  style={{
                    flex: '0 0 auto',
                    width: screens.md ? 'calc(33.333% - 11px)' : screens.sm ? 'calc(50% - 8px)' : '100%',
                    minWidth: screens.md ? 320 : 'auto',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <Card
                    size="small"
                    onClick={() => setSelectedCard(card)}
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
                    <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
                      {card.title || 'Untitled'}
                    </Title>
                    {card.description && (
                      <Paragraph type="secondary" ellipsis={{ rows: 3 }} style={{ marginBottom: 8, fontSize: 13 }}>
                        {card.description}
                      </Paragraph>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {stepsCount > 0 && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <UnorderedListOutlined style={{ marginRight: 4 }} />
                          {stepsCount} step{stepsCount !== 1 ? 's' : ''}
                          {totalDays > 0 && <> · <ClockCircleOutlined style={{ marginRight: 4 }} />~{totalDays} day{totalDays !== 1 ? 's' : ''}</>}
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
                </div>
              )
            })}
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
      </div>

      {isMobile ? (
        <Drawer
          title={null}
          placement="bottom"
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          height="100%"
          styles={{ body: { paddingTop: 12 } }}
        >
          {selectedCard && <PermitFormDetailContent card={selectedCard} />}
        </Drawer>
      ) : (
        <Modal
          title={null}
          open={!!selectedCard}
          onCancel={() => setSelectedCard(null)}
          footer={null}
          width={600}
          styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        >
          {selectedCard && <PermitFormDetailContent card={selectedCard} />}
        </Modal>
      )}
    </section>
  )
}
