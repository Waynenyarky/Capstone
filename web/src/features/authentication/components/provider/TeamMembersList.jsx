import React from 'react'
import { Form, Card, Flex, Input, Typography, Button } from 'antd'
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from '@/shared/forms'

export default function TeamMembersList() {
  return (
    <>
      <Typography.Text>Team Members</Typography.Text>
      <Form.List name="teamMembers">
        {(fields, { add, remove }) => (
          <Card size="small" variant="outlined" style={{ background: '#fafafa' }}>
            {fields.map(({ key, name, ...rest }) => (
              <Card key={key} size="small" style={{ marginBottom: 8 }}>
                <Flex gap="small" wrap="wrap">
                  <Form.Item {...rest} name={[name, 'firstName']} label="First Name" rules={[{ required: true, message: 'Enter first name' }]}> 
                    <Input />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'lastName']} label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}> 
                    <Input />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'email']} label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}> 
                    <Input />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'phone']} label="Phone" rules={[{ required: true, message: 'Enter phone' }]}> 
                    <Input inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} />
                  </Form.Item>
                </Flex>
                <Flex justify="end"><Button danger onClick={() => remove(name)}>Remove</Button></Flex>
              </Card>
            ))}
            <Flex justify="start">
              <Button onClick={() => add()}>Add Team Member</Button>
            </Flex>
          </Card>
        )}
      </Form.List>
    </>
  )
}