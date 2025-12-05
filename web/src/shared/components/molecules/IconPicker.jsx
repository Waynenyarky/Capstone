import React from 'react'
import { Select, Space } from 'antd'
import { iconOptions, getIconComponent } from './iconOptions.js'

export default function IconPicker({
  value,
  onChange,
  options = iconOptions,
  placeholder = 'Select an icon',
  style,
}) {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear
      showSearch
      optionLabelProp="label"
      optionFilterProp="label"
      style={{ width: '100%', ...style }}
    >
      {options.map(({ value: val, label }) => {
        const IconComponent = getIconComponent(val, options)
        return (
          <Select.Option key={val} value={val} label={label}>
            <Space>
              {IconComponent ? <IconComponent /> : null}
              {label}
            </Space>
          </Select.Option>
        )
      })}
    </Select>
  )
}