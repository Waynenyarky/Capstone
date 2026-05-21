import React from 'react'
import { Modal, Drawer, Typography, Timeline, Button, Grid, Divider } from 'antd'
import { DownloadOutlined, ClockCircleOutlined, CheckCircleOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { resolveIpfsUrl } from '../utils'

dayjs.extend(relativeTime)

const { Title, Text, Paragraph } = Typography

function DetailContent({ card }) {
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
      <Title level={5} style={{ margin: 0, marginBottom: 16 }}>
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
            Est. ~{totalDays} day{totalDays !== 1 ? 's' : ''}
          </Text>
        )}
        {card.lastUpdatedAt && (
          <Text type="secondary" style={{ fontSize: 12 }}>
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

export default function PermitFormDetailModal({ card, open, onClose }) {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  if (!card) return null

  if (isMobile) {
    return (
      <Drawer
        title={null}
        placement="bottom"
        open={open}
        onClose={onClose}
        height="100%"
        styles={{ body: { paddingTop: 12 } }}
      >
        <DetailContent card={card} />
      </Drawer>
    )
  }

  return (
    <Modal
      title={card.title || 'Permit Form Details'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <DetailContent card={card} />
    </Modal>
  )
}
