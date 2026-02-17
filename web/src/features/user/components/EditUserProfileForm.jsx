import React from 'react'
import { Form, Input, Card, Button, Row, Col, Space, Alert, Skeleton } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, SaveOutlined, UndoOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.jsx"
import { firstNameRules, lastNameRules, phoneNumberRules } from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizePhonePaste, sanitizePhoneInput } from "@/shared/forms"
import { formatPhoneNumber } from "@/shared/utils/phoneFormatter.js"

export default function EditUserProfileForm({ embedded = false }) {
  const { form, isLoading, isSubmitting, handleFinish, handleValuesChange, isDirty, reload } = useEditUserProfileForm()
  const { role } = useAuthSession()
  
  // Check if user is staff role (restricted fields)
  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isStaffRole = ['lgu_officer', 'lgu_manager', 'inspector', 'cso', 'staff'].includes(roleKey)

  if (isLoading) {
    return (
      <div>
        <Skeleton.Input active size="large" style={{ width: '100%', marginBottom: 24, height: 40 }} />
        <Skeleton.Input active size="large" style={{ width: '100%', marginBottom: 24, height: 40 }} />
        <Skeleton.Input active size="large" style={{ width: '100%', height: 40 }} />
      </div>
    )
  }

  const content = (
    <Form 
      form={form} 
      layout="vertical" 
      onFinish={handleFinish} 
      disabled={isLoading} 
      onValuesChange={handleValuesChange}
      requiredMark="optional"
    >
      {isStaffRole && (
        <Alert
          message="Profile Restrictions"
          description="Some profile fields (password, role, office, department) can only be changed by an administrator. Please contact your administrator if you need to update these fields."
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item 
            name="firstName" 
            label="First Name" 
            rules={firstNameRules}
            help="Enter your legal first name"
          >
            <Input 
              size="large" 
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
              placeholder="First Name"
              showCount
              maxLength={50}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="lastName" 
            label="Last Name" 
            rules={lastNameRules}
            help="Enter your legal last name"
          >
            <Input 
              size="large" 
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
              placeholder="Last Name"
              showCount
              maxLength={50}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item 
            name="phoneNumber" 
            label="Phone Number" 
            rules={phoneNumberRules} 
            help="Format: 09XXXXXXXXX (11 digits, starting with 09)"
          >
            <Input
              size="large"
              prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              onKeyDown={preventNonNumericKeyDown}
              onPaste={(e) => {
                sanitizePhonePaste(e)
                const pasted = e.clipboardData.getData('text')
                const formatted = formatPhoneNumber(pasted)
                setTimeout(() => {
                  form.setFieldValue('phoneNumber', formatted)
                }, 0)
              }}
              onInput={(e) => {
                sanitizePhoneInput(e)
                const value = e.target.value
                const formatted = formatPhoneNumber(value)
                if (formatted !== value) {
                  form.setFieldValue('phoneNumber', formatted)
                }
              }}
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
