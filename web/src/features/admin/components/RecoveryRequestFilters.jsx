import { Form, Select, Button, Space, Grid } from 'antd'

const { useBreakpoint } = Grid
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
]

export default function RecoveryRequestFilters({ value = {}, onChange, onRefresh }) {
  const [form] = Form.useForm()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const handleValuesChange = (_, all) => {
    onChange?.(all)
  }

  return (
    <Form
      layout={isMobile ? 'vertical' : 'inline'}
      form={form}
      initialValues={value}
      onValuesChange={handleValuesChange}
      style={{ marginBottom: 8 }}
    >
      <Form.Item label="Status" name="status">
        <Select options={statusOptions} style={{ minWidth: isMobile ? undefined : 140, width: isMobile ? '100%' : undefined }} allowClear />
      </Form.Item>
      <Form.Item label="Office" name="office">
        <Select placeholder="Any" allowClear style={{ minWidth: isMobile ? undefined : 160, width: isMobile ? '100%' : undefined }} />
      </Form.Item>
      <Form.Item label="Role" name="role">
        <Select placeholder="Any" allowClear style={{ minWidth: isMobile ? undefined : 160, width: isMobile ? '100%' : undefined }} />
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
