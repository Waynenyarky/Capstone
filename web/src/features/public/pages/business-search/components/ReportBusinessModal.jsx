import { Modal, Drawer, Form, Select, Upload, Button, Input, Typography } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Option } = Select
const { Paragraph } = Typography

export default function ReportBusinessModal({ visible, onSubmit, onCancel, screens, token }) {
  const [form] = Form.useForm()

  const handleSubmit = () => {
    onSubmit()
    form.resetFields()
  }

  const handleCancel = () => {
    onCancel()
    form.resetFields()
  }

  return screens.md ? (
    <Modal
      title="Report Business"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Submit Report"
      cancelText="Cancel"
      width={600}
      centered
    >
      <Paragraph style={{ marginBottom: 24, color: token.colorTextSecondary }}>
        Help us maintain accurate business records by reporting businesses with incorrect information, fake permits, or other compliance issues.
      </Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Report Type"
          name="reportType"
          rules={[{ required: true, message: 'Please select a report type' }]}
        >
          <Select placeholder="Select report type">
            <Option value="fake_permit">Fake Permit</Option>
            <Option value="invalid_info">Invalid Information</Option>
            <Option value="expired_permit">Expired Permit</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please provide a description' }]}
        >
          <TextArea
            rows={4}
            placeholder="Describe the issue (e.g., Permit number seems invalid)"
          />
        </Form.Item>

        <Form.Item
          label="Optional Evidence"
          name="evidence"
        >
          <Upload
            listType="picture-card"
            maxCount={3}
            beforeUpload={() => false}
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item
          label="Contact Email"
          name="email"
          rules={[
            { required: true, message: 'Please provide your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="your@email.com" />
        </Form.Item>
      </Form>
    </Modal>
  ) : (
    <Drawer
      title="Report Business"
      open={visible}
      onClose={handleCancel}
      placement="bottom"
      height="auto"
      styles={{
        body: { paddingBottom: 80 },
      }}
      extra={
        <Button type="primary" onClick={handleSubmit} block>
          Submit Report
        </Button>
      }
    >
      <Paragraph style={{ marginBottom: 24, color: token.colorTextSecondary }}>
        Help us maintain accurate business records by reporting businesses with incorrect information, fake permits, or other compliance issues.
      </Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Report Type"
          name="reportType"
          rules={[{ required: true, message: 'Please select a report type' }]}
        >
          <Select placeholder="Select report type">
            <Option value="fake_permit">Fake Permit</Option>
            <Option value="invalid_info">Invalid Information</Option>
            <Option value="expired_permit">Expired Permit</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please provide a description' }]}
        >
          <TextArea
            rows={4}
            placeholder="Describe the issue (e.g., Permit number seems invalid)"
          />
        </Form.Item>

        <Form.Item
          label="Optional Evidence"
          name="evidence"
        >
          <Upload
            listType="picture-card"
            maxCount={3}
            beforeUpload={() => false}
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item
          label="Contact Email"
          name="email"
          rules={[
            { required: true, message: 'Please provide your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="your@email.com" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
