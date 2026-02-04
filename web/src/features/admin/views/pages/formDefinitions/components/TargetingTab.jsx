import { Card, Form, Select, Divider, DatePicker } from 'antd'
import { BUSINESS_TYPE_OPTIONS } from '@/constants'

export default function TargetingTab({ form, definition, lgus, viewOnly }) {
  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          name="businessTypes"
          label="Business Types"
          extra={definition.formGroupId ? 'Derived from form group industry scope' : 'Leave empty to apply to all business types'}
        >
          <Select
            mode="multiple"
            placeholder="Select business types (or leave empty for all)"
            options={BUSINESS_TYPE_OPTIONS}
            disabled={viewOnly || !!definition.formGroupId}
          />
        </Form.Item>

        <Form.Item
          name="lguCodes"
          label="LGUs"
          extra="Leave empty to apply globally (all LGUs)"
        >
          <Select
            mode="multiple"
            placeholder="Select LGUs (or leave empty for all)"
            options={lgus.map((lgu) => ({ value: lgu.code, label: `${lgu.name} (${lgu.code})` }))}
            disabled={viewOnly}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Divider />

        <Form.Item
          name="effectiveFrom"
          label="Effective From"
          extra="When this definition becomes active"
        >
          <DatePicker showTime style={{ width: '100%' }} disabled={viewOnly} />
        </Form.Item>

        <Form.Item
          name="effectiveTo"
          label="Effective To (optional)"
          extra="When this definition expires (leave empty for no expiration)"
        >
          <DatePicker showTime style={{ width: '100%' }} disabled={viewOnly} />
        </Form.Item>
      </Form>
    </Card>
  )
}
