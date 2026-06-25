import { Form, Select, Typography } from 'antd'
import { useState, useEffect } from 'react'
import { getFeeGroups } from '@/features/admin/services/feeService'

const { Text } = Typography

export default function AvailmentFeeTab({ _permitTypeId, value, onChange }) {
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
      <Form layout="vertical">
        <Form.Item label="Select Fee Group for Availment">
          <Select
            placeholder="Select a fee group"
            loading={loading}
            value={value}
            onChange={onChange}
            options={feeGroups.map((fg) => ({
              label: fg.name,
              value: fg._id,
            }))}
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12 }}>
          This fee group will be applied when business owners avail of this permit type.
        </Text>
      </Form>
    </div>
  )
}
