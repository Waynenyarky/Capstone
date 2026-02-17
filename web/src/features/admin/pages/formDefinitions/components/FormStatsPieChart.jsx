import React, { useMemo } from 'react'
import { Pie } from '@ant-design/charts'

export default function FormStatsPieChart({ stats, size = 100 }) {
  const total = (stats?.activated ?? 0) + (stats?.deactivated ?? 0) + (stats?.retired ?? 0)

  const data = useMemo(
    () => [
      { type: 'Active', value: stats?.activated ?? 0 },
      { type: 'Deactivated', value: stats?.deactivated ?? 0 },
      { type: 'Retired', value: stats?.retired ?? 0 },
    ],
    [stats?.activated, stats?.deactivated, stats?.retired]
  )

  const config = useMemo(
    () => ({
      data,
      angleField: 'value',
      colorField: 'type',
      color: ['#52c41a', '#faad14', 'rgba(0,0,0,0.25)'],
      radius: 1.2,
      innerRadius: 1.0,
      legend: false,
      label: false,
      tooltip: false,
      animation: false,
    }),
    [data]
  )

  if (total === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.04)',
          fontSize: 12,
          color: 'var(--ant-color-text-tertiary)',
        }}
      >
        0
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size }}>
      <Pie {...config} />
    </div>
  )
}
