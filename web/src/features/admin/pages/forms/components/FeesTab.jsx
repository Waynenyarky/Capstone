import { Form, Select, Typography, Divider } from 'antd'
import { useState, useEffect } from 'react'
import { getFeeGroups } from '@/features/admin/services/feeService'

const { Text, Title } = Typography

export default function FeesTab({ _permitTypeId, feeGroupId, onFeeGroupChange }) {
  const [feeGroups, setFeeGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeeGroups = async () => {
      setLoading(true)
      try {
        const groups = await getFeeGroups()
        setFeeGroups(groups || [])
      } catch (err) {
        console.error('Failed to fetch fee groups:', err)
        setFeeGroups([])
      } finally {
        setLoading(false)
      }
    }
    fetchFeeGroups()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <Title level={5}>Availment Fee</Title>
      <Form layout="vertical">
        <Form.Item>
          <Select
            placeholder="Select a fee group"
            loading={loading}
            value={feeGroupId}
            onChange={onFeeGroupChange}
            options={feeGroups.map((fg) => ({
              label: fg.name,
              value: fg._id,
            }))}
          />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '24px 0' }} />

      <Title level={5}>Penalties</Title>
      <Text type="secondary">Penalties configuration - coming soon</Text>
    </div>
  )
}
