import React from 'react'
import { Card, Form, Select, Button, Flex, Typography, Switch } from 'antd'
import { citiesRules } from "@/features/admin/areas/validations/supportedAreaRules.js"
import { useEditSupportedAreaForm } from "@/features/admin/areas/hooks/useEditSupportedAreaForm.js"
import { useCitiesOptions } from "@/features/admin/areas/hooks/useCitiesOptions.js"

export default function EditSupportedAreaForm({ provinceName, onSaved }) {
const { record, isLoading, isSaving, saveFromForm } = useEditSupportedAreaForm(provinceName)
  const [form] = Form.useForm()
  const province = record?.province || provinceName || ''
  const { options: cityOptions, loading: loadingCities } = useCitiesOptions(province)

  React.useEffect(() => {
    if (record) {
      form.setFieldsValue({
        cities: Array.isArray(record.cities) ? record.cities : [],
        active: record.active !== false,
      })
    } else {
      form.resetFields()
    }
  }, [record, form])

const onSave = async () => {
  const res = await saveFromForm(form, { confirm: true, onSaved })
  return res
}

  if (!provinceName) {
    return (
      <Card title="Edit Supported Area">
        <Typography.Text type="secondary">Select a province from the table to edit.</Typography.Text>
        <Form form={form} style={{ display: 'none' }} />
      </Card>
    )
  }

  return (
    <Card title={'Edit Supported Area'}>
      <Form form={form} layout="vertical" disabled={isLoading}>
        <Form.Item label="Province">
          <Typography.Text strong>{province || '-'}</Typography.Text>
        </Form.Item>
        <Form.Item
          name="cities"
          label="Cities"
          rules={citiesRules()}
        >
          <Select
            mode="multiple"
            placeholder="Select cities from province"
            options={cityOptions}
            loading={loadingCities}
            allowClear
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="active" label="Status" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
        <Flex justify="end" gap="small">
          <Button type="primary" onClick={onSave} loading={isSaving}>
            Save Changes
          </Button>
        </Flex>
      </Form>
    </Card>
  )
}