import React from 'react'
import { Form, Card, Flex, Input, Typography, Button } from 'antd'

export default function SocialLinksList() {
  return (
    <>
      <Typography.Text>Social Media</Typography.Text>
      <Form.List name="socialLinks">
        {(fields, { add, remove }) => (
          <Card size="small" variant="outlined" style={{ background: '#fafafa' }}>
            {fields.map(({ key, name, ...rest }) => (
              <Flex key={key} gap="small" wrap="wrap" style={{ marginBottom: 8 }}>
                <Form.Item {...rest} name={name} label="Social Media URL">
                  <Input placeholder="https://..." />
                </Form.Item>
                <Flex align="end">
                  <Button danger onClick={() => remove(name)}>Remove</Button>
                </Flex>
              </Flex>
            ))}
            <Flex justify="start" gap="small">
              <Button onClick={() => add('')}>Add Social Media Link</Button>
            </Flex>
          </Card>
        )}
      </Form.List>
    </>
  )
}