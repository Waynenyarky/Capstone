import { Form, Select, Button, Space } from 'antd'

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
]

export default function RecoveryRequestFilters({ value = {}, onChange, onRefresh }) {
  const [form] = Form.useForm()

  const handleValuesChange = (_, all) => {
    onChange?.(all)
  }

  return (
    <Form
      layout="inline"
      form={form}
      initialValues={value}
      onValuesChange={handleValuesChange}
      style={{ marginBottom: 8 }}
    >
      <Form.Item label="Status" name="status">
        <Select options={statusOptions} style={{ minWidth: 140 }} allowClear />
      </Form.Item>
      <Form.Item label="Office" name="office">
        <Select placeholder="Any" allowClear style={{ minWidth: 160 }} />
      </Form.Item>
      <Form.Item label="Role" name="role">
        <Select placeholder="Any" allowClear style={{ minWidth: 160 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={() => form.resetFields()}>Reset</Button>
          <Button type="primary" onClick={onRefresh}>Refresh</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
