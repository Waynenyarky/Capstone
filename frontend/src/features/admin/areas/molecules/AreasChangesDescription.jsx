import React from 'react'
import { Descriptions, Tag, Flex } from 'antd'

export default function AreasChangesDescription({ groups }) {
  const list = Array.isArray(groups) ? groups : []
  return (
    <Descriptions column={1} variant="outlined" size="small">
      {list.length === 0 && (
        <Descriptions.Item label="Areas">None</Descriptions.Item>
      )}
      {list.map((g, idx) => (
        <Descriptions.Item key={`grp-${idx}`} label={g.province || `Province ${idx + 1}`}>
          {(Array.isArray(g.cities) && g.cities.length > 0)
            ? (
                <Flex gap="small" wrap="wrap">
                  {g.cities.map((name) => (
                    <Tag key={`city-${name}`}>{String(name)}</Tag>
                  ))}
                </Flex>
              )
            : '—'}
        </Descriptions.Item>
      ))}
    </Descriptions>
  )
}