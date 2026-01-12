import React from 'react'
import { Form, Input, Card, Button, Row, Col, Space } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.js"
import { firstNameRules, lastNameRules, phoneNumberRules } from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from "@/shared/forms"

export default function EditUserProfileForm({ embedded = false }) {
  const { form, isLoading, isSubmitting, handleFinish, handleValuesChange, isDirty, reload } = useEditUserProfileForm()
  const { currentUser } = useAuthSession()

  const content = (
    <Form 
      form={form} 
      layout="vertical" 
      onFinish={handleFinish} 
      disabled={isLoading} 
      onValuesChange={handleValuesChange}
      requiredMark="optional"
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item name="firstName" label="First Name" rules={firstNameRules}>
            <Input 
              size="large" 
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
              placeholder="First Name" 
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="lastName" label="Last Name" rules={lastNameRules}>
            <Input 
              size="large" 
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
              placeholder="Last Name" 
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="phoneNumber" label="Phone Number" rules={phoneNumberRules} help="Format: 09XXXXXXXXX">
            <Input
              size="large"
              prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              onKeyDown={preventNonNumericKeyDown}
              onPaste={sanitizePhonePaste}
              onInput={sanitizePhoneInput}
              placeholder="09XXXXXXXXX"
            />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
           {isDirty && (
              <Button 
                icon={<UndoOutlined />} 
                onClick={reload} 
                disabled={isSubmitting}
              >
                Discard Changes
              </Button>
           )}
           <Button 
             type="primary" 
             htmlType="submit" 
             size="large" 
             icon={<SaveOutlined />} 
             loading={isSubmitting} 
             disabled={isSubmitting || !isDirty}
           >
             Save Changes
           </Button>
        </Space>
      </div>
    </Form>
  )

  if (embedded) return content

  return (
    <Card title="Edit Profile">
      {content}
    </Card>
  )
}
