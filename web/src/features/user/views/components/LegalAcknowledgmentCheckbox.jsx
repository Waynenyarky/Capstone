import { Form, Checkbox } from 'antd'

export default function LegalAcknowledgmentCheckbox({ name = 'legalAcknowledgment' }) {
  return (
    <Form.Item
      name={name}
      valuePropName="checked"
      rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject(new Error('You must acknowledge before continuing')) }]}
    >
      <Checkbox>
        I understand this action is irreversible and consent to account deletion.
      </Checkbox>
    </Form.Item>
  )
}
