import React, { useState } from 'react'
import { Select, Button, Typography, Card, Space, message } from 'antd'
import { CodeOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

/**
 * Dev-only panel to simulate security attacks. Shows a list of attacks;
 * selecting one displays sample code and a confirmation button to run it.
 * Renders nothing when not in DEV or when VITE_DEMO_UI is true.
 */
export default function DevSimulatedAttackPanel({ attacks = [], context = {}, title = 'Simulate Attack' }) {
  const [selectedKey, setSelectedKey] = useState(null)
  const [running, setRunning] = useState(false)

  if (import.meta.env.DEV !== true || import.meta.env.VITE_DEMO_UI === 'true') {
    return null
  }

  if (!attacks || attacks.length === 0) return null

  const selected = attacks.find((a) => a.key === selectedKey)

  const handleRun = async () => {
    if (!selected?.execute) return
    setRunning(true)
    try {
      await Promise.resolve(selected.execute(context))
      message.success('Attack simulation completed. Check network/audit for results.')
    } catch (err) {
      // Many attacks are designed to trigger errors (rate limit, lockout, etc.)
      const msg = err?.message || String(err)
      if (msg.includes('rate') || msg.includes('lock') || msg.includes('429') || msg.includes('403') || msg.includes('missing_data') || msg.includes('rejected as expected')) {
        message.info('Attack simulated as expected: ' + (err?.code || msg.slice(0, 60)))
      } else {
        message.error(msg.slice(0, 80))
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <CodeOutlined />
          <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
        </Space>
      }
      style={{ marginTop: 16, opacity: 0.85, maxWidth: 520 }}
      styles={{ body: { paddingTop: 8 } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Select
          placeholder="Select an attack to simulate..."
          value={selectedKey || undefined}
          onChange={setSelectedKey}
          style={{ width: '100%' }}
          options={attacks.map((a) => ({ value: a.key, label: a.label }))}
          allowClear
        />
        {selected && (
          <>
            {selected.description && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                {selected.description}
              </Text>
            )}
            {selected.sampleCode && (
              <pre
                style={{
                  margin: 0,
                  padding: 10,
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  borderRadius: 6,
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                <code>{selected.sampleCode}</code>
              </pre>
            )}
            <Button
              type="primary"
              danger
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              loading={running}
            >
              Run simulation
            </Button>
          </>
        )}
      </Space>
    </Card>
  )
}
