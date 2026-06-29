import { useState } from 'react'
import { Modal, Form, Input, Divider, Button, Typography, Empty } from 'antd'
import PanelCard from '@/shared/components/PanelCard'
import dayjs from 'dayjs'

const { Text } = Typography

export default function RegisterBusinessOwnerModal({ open, onClose }) {
  const [form] = Form.useForm()
  const [canSubmit, setCanSubmit] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [hasChecked, setHasChecked] = useState(false)

  const handleCheck = () => {
    form.validateFields().then((values) => {
      // Mock search - in real implementation, this would call an API
      const fullName = `${values.firstName} ${values.middleName} ${values.lastName} ${values.suffix}`.trim().toLowerCase()
      
      // Mock results - replace with actual API call
      const mockResults = [
        {
          _id: 'mock1',
          fullName: `${values.firstName} ${values.lastName}`,
          email: 'existing@example.com',
          phoneNumber: '+63 912 345 6789',
          address: '123 Main St, Manila',
          isActive: true,
          deletionPending: false,
          businessCount: 2,
          createdAt: '2024-01-15T08:00:00Z',
          lastLoginAt: '2024-06-28T10:30:00Z',
          applications: [
            { _id: 'app1', applicationReferenceNumber: 'BP-2024-0001', status: 'approved' },
            { _id: 'app2', applicationReferenceNumber: 'BP-2024-0005', status: 'under_review' },
          ],
          tags: [{ label: 'Potential Match', color: 'warning' }],
        },
        {
          _id: 'mock2',
          fullName: `${values.firstName} ${values.lastName} Jr`,
          email: 'existing.jr@example.com',
          phoneNumber: '+63 917 234 5678',
          address: '456 Oak Ave, Quezon City',
          isActive: false,
          deletionPending: false,
          businessCount: 1,
          createdAt: '2023-05-20T14:30:00Z',
          lastLoginAt: '2024-03-15T09:00:00Z',
          applications: [
            { _id: 'app3', applicationReferenceNumber: 'BP-2023-0010', status: 'approved' },
          ],
          tags: [{ label: 'Potential Match', color: 'warning' }],
        },
      ]
      
      setSearchResults(mockResults)
      setCanSubmit(true)
      setHasChecked(true)
    }).catch(() => {
      // Validation failed, keep submit disabled
    })
  }

  const handleFormChange = () => {
    // Re-enable check button and clear results when fields change
    setHasChecked(false)
    setCanSubmit(false)
    setSearchResults([])
    setSelectedResult(null)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      console.log('Form values:', values)
      // TODO: Implement actual submission logic
      onClose()
    }).catch(() => {
      // Validation failed
    })
  }

  const handleCancel = () => {
    form.resetFields()
    setCanSubmit(false)
    setSearchResults([])
    setSelectedResult(null)
    setHasChecked(false)
    onClose()
  }

  const handleResultSelect = (result) => {
    setSelectedResult(result)
  }

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="Register Business Owner"
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ padding: 16 }}>
        <Text style={{ display: 'block', marginBottom: 24 }}>
          Enter the business owner's name to check for existing records. If a match is found, you can link to the existing account. Otherwise, proceed with registration.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          initialValues={{
            firstName: '',
            middleName: '',
            lastName: '',
            suffix: '',
          }}
        >
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true, message: 'Please enter first name' }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item
          name="middleName"
          label="Middle Name"
          rules={[{ required: true, message: 'Please enter middle name' }]}
        >
          <Input placeholder="Enter middle name" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true, message: 'Please enter last name' }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>

        <Form.Item
          name="suffix"
          label="Suffix (Optional)"
        >
          <Input placeholder="e.g., Jr, Sr, III" />
        </Form.Item>

        <Divider />

        {/* Search Results */}
        <Button onClick={handleCheck} block disabled={hasChecked}>
          Check for existing records
        </Button>

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {searchResults.map((result) => {
              // Determine account status for primary tag
              let statusLabel = 'Active'
              let statusColor = 'green'
              if (result.deletionPending) {
                statusLabel = 'Pending Deletion'
                statusColor = 'orange'
              } else if (!result.isActive) {
                statusLabel = 'Inactive'
                statusColor = 'red'
              }

              const createdDate = result.createdAt ? dayjs(result.createdAt).format('MMMM D, YYYY') : null
              const lastLoginDate = result.lastLoginAt ? dayjs(result.lastLoginAt).format('MMMM D, YYYY') : null

              const tags = [
                { label: statusLabel, color: statusColor },
              ]
              if (result.email) {
                tags.push({ label: result.email, color: 'default' })
              }
              if (result.businessCount !== undefined) {
                tags.push({ label: `${result.businessCount} business${result.businessCount !== 1 ? 'es' : ''}`, color: 'default' })
              }
              const applicationCount = result.applications?.length || 0
              if (applicationCount > 0) {
                tags.push({ label: `${applicationCount} application${applicationCount !== 1 ? 's' : ''}`, color: 'default' })
              }

              const metaInfo = []
              if (createdDate) {
                metaInfo.push({ label: 'Registered on', value: createdDate })
              }
              if (lastLoginDate) {
                metaInfo.push({ label: 'Last logged in', value: lastLoginDate })
              }

              return (
                <PanelCard
                  key={result._id}
                  item={result}
                  selected={selectedResult?._id === result._id}
                  onClick={() => handleResultSelect(result)}
                  title={result.fullName}
                  description=""
                  metaInfo={metaInfo}
                  tags={tags}
                />
              )
            })}
          </div>
        )}
        </Form>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="primary" onClick={handleSubmit} disabled={!canSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  )
}
