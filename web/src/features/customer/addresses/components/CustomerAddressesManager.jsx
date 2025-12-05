import React from 'react'
import { Card, Form, Input, Select, Button, Flex, Table, Tag } from 'antd'
import { usePHLocations } from '@/hooks/usePHLocations.js'
import { useCustomerAddresses } from '@/features/customer/addresses/hooks/useCustomerAddresses.js'

export default function CustomerAddressesManager() {
  const [form] = Form.useForm()
  const { provinceSelectProps, citySelectProps } = usePHLocations(form)
  const { addresses, primary, loading, saving, addAddress, removeAddress, makePrimary } = useCustomerAddresses()

  const columns = [
    { title: 'Label', dataIndex: 'label', key: 'label', render: (v, r) => (<>{v || '—'} {r.isPrimary && <Tag color="blue">Primary</Tag>}</>) },
    { title: 'Street', dataIndex: 'streetAddress', key: 'streetAddress' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    { title: 'Province', dataIndex: 'province', key: 'province' },
    { title: 'Zip', dataIndex: 'zipCode', key: 'zipCode' },
    { title: 'Actions', key: 'actions', render: (_, row) => (
      <Flex gap="small">
        {!row.isPrimary && <Button onClick={() => makePrimary(row.id)} loading={saving}>Make Primary</Button>}
        <Button danger onClick={() => removeAddress(row.id)} loading={saving}>Delete</Button>
      </Flex>
    )},
  ]

  const handleAdd = async (values) => {
    const payload = {
      label: values.label || '',
      streetAddress: values.streetAddress || '',
      province: values.province,
      city: values.city,
      zipCode: values.zipCode || '',
    }
    await addAddress(payload)
    form.resetFields()
  }

  return (
    <Card title="My Addresses" extra={primary ? <Tag color="blue">Using: {primary.city}{primary.province ? `, ${primary.province}` : ''}</Tag> : <Tag>Primary: not set</Tag>}>
      <Form form={form} layout="vertical" onFinish={handleAdd}>
        <Flex gap="small" wrap="wrap" style={{ marginBottom: 12 }}>
          <Form.Item name="label" label="Label" style={{ minWidth: 200 }}>
            <Input placeholder="e.g., Home" />
          </Form.Item>
          <Form.Item name="streetAddress" label="Street" style={{ minWidth: 240 }}>
            <Input />
          </Form.Item>
          <Form.Item name="province" label="Province" rules={[{ required: true }]}
            style={{ minWidth: 220 }}>
            <Select {...provinceSelectProps} />
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}
            style={{ minWidth: 220 }}>
            <Select {...citySelectProps} />
          </Form.Item>
          <Form.Item name="zipCode" label="Zip" style={{ minWidth: 140 }}>
            <Input />
          </Form.Item>
          <Flex align="end" style={{ marginBottom: 24 }}>
            <Button type="primary" htmlType="submit" loading={saving}>Add Address</Button>
          </Flex>
        </Flex>
      </Form>
      <Table rowKey="id" columns={columns} dataSource={addresses} loading={loading} pagination={{ pageSize: 5 }} />
    </Card>
  )
}