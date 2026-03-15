import React, { useMemo, useState } from 'react'
import { Calendar, Badge, Typography, Tag, Button, Empty, theme } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const STATUS_COLORS = {
  pending: 'warning',
  in_progress: 'processing',
  completed: 'success',
}

export default function CalendarTab({ allInspections = [], onNavigateToAppointment }) {
  const { token } = theme.useToken()
  const [selectedDate, setSelectedDate] = useState(null)

  const inspectionsByDate = useMemo(() => {
    const map = {}
    for (const insp of allInspections) {
      if (!insp.scheduledDate) continue
      const key = dayjs(insp.scheduledDate).format('YYYY-MM-DD')
      if (!map[key]) map[key] = []
      map[key].push(insp)
    }
    return map
  }, [allInspections])

  const selectedInspections = useMemo(() => {
    if (!selectedDate) return []
    const key = selectedDate.format('YYYY-MM-DD')
    return inspectionsByDate[key] || []
  }, [selectedDate, inspectionsByDate])

  const dateCellRender = (value) => {
    const key = value.format('YYYY-MM-DD')
    const items = inspectionsByDate[key]
    if (!items || items.length === 0) return null
    const pending = items.filter((i) => i.status === 'pending').length
    const inProgress = items.filter((i) => i.status === 'in_progress').length
    const completed = items.filter((i) => i.status === 'completed').length
    return (
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
        {pending > 0 && <Badge status="warning" text={null} />}
        {inProgress > 0 && <Badge status="processing" text={null} />}
        {completed > 0 && <Badge status="success" text={null} />}
        <Text style={{ fontSize: 10, color: token.colorTextSecondary }}>{items.length}</Text>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12 }}>
        <Calendar
          fullscreen={false}
          cellRender={(current, info) => {
            if (info.type === 'date') return dateCellRender(current)
            return null
          }}
          onSelect={(date) => setSelectedDate(date)}
        />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '8px 0', flexWrap: 'wrap' }}>
          <span><Badge status="warning" /> Pending</span>
          <span><Badge status="processing" /> In Progress</span>
          <span><Badge status="success" /> Completed</span>
        </div>

        {/* Selected day details */}
        {selectedDate && (
          <div style={{ marginTop: 12 }}>
            <Text strong style={{ fontSize: 14 }}>
              {selectedDate.format('MMMM D, YYYY')}
            </Text>
            {selectedInspections.length === 0 ? (
              <Empty
                description="No inspections scheduled"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 12 }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {selectedInspections.map((insp) => (
                  <div
                    key={insp._id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorBgLayout,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text strong style={{ display: 'block', fontSize: 13 }}>
                        {insp.businessName || insp.businessId || 'Unknown'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {insp.inspectorName || 'Unassigned'} · <Tag color={STATUS_COLORS[insp.status] || 'default'} style={{ fontSize: 11, margin: 0 }}>{(insp.status || '').replace('_', ' ')}</Tag>
                      </Text>
                      {insp.scheduledTimeWindow?.start && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                          {dayjs(insp.scheduledTimeWindow.start).format('h:mm A')} – {dayjs(insp.scheduledTimeWindow.end).format('h:mm A')}
                        </Text>
                      )}
                    </div>
                    {insp.status !== 'completed' && onNavigateToAppointment && (
                      <Button
                        size="small"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => onNavigateToAppointment(insp._id)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
