import React from 'react'
import { Modal, DatePicker, Typography } from 'antd'

const { Text } = Typography
const { RangePicker } = DatePicker

export default function MaintenanceExportModal({ open, onCancel, onOk, exportRange, onRangeChange, rowCount }) {
  return (
    <Modal
      title="Download requests"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Download CSV"
      okButtonProps={{ disabled: rowCount === 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Text type="secondary">Select start and end date for exported records (based on request date).</Text>
        <RangePicker
          value={exportRange}
          onChange={(value) => onRangeChange(value || [null, null])}
          style={{ width: '100%' }}
          format="MMM D, YYYY"
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {exportRange?.[0] && exportRange?.[1]
            ? `${rowCount} record${rowCount === 1 ? '' : 's'} ready to export`
            : 'Choose a date range to enable download'}
        </Text>
      </div>
    </Modal>
  )
}
