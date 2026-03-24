import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, DatePicker, Divider, message, Spin } from 'antd'
import PhilippineAddressFields from '@/shared/components/PhilippineAddressFields'
import { get, patch } from '@/lib/http'
import dayjs from 'dayjs'

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'legally_separated', label: 'Legally Separated' },
  { value: 'annulled', label: 'Annulled' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
]

const EDUCATION_OPTIONS = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'high_school', label: 'High School' },
  { value: 'vocational', label: 'Vocational/Technical' },
  { value: 'college_undergraduate', label: 'College (Undergraduate)' },
  { value: 'college_graduate', label: 'College Graduate' },
  { value: 'college', label: 'College' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'others', label: 'Others' },
]

export default function EditOwnerModal({ open, owner, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (open && owner?._id) {
      setFetching(true)
      get(`/api/auth/lgu-officer/users/${owner._id}`)
        .then((res) => {
          const user = res.user || res
          form.setFieldsValue({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            middleName: user.middleName || '',
            suffix: user.suffix || '',
            phoneNumber: user.phoneNumber || '',
            sex: user.sex || undefined,
            dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
            maritalStatus: user.maritalStatus || undefined,
            placeOfBirth: user.placeOfBirth || '',
            nationality: user.nationality || '',
            highestEducationalAttainment: user.highestEducationalAttainment || undefined,
            fatherName: user.fatherName || '',
            motherName: user.motherName || '',
            distinctiveMark: user.distinctiveMark || '',
            address: {
              street: user.address?.street || '',
              barangay: user.address?.barangay || '',
              city: user.address?.city || '',
              province: user.address?.province || '',
              zipCode: user.address?.zipCode || '',
            },
          })
        })
        .catch((err) => {
          console.error('Failed to fetch owner details:', err)
          // Fallback to basic owner data
          form.setFieldsValue({
            firstName: owner.firstName || '',
            lastName: owner.lastName || '',
            phoneNumber: owner.phoneNumber || owner.phone || '',
          })
        })
        .finally(() => setFetching(false))
    } else if (!open) {
      form.resetFields()
    }
  }, [open, owner?._id, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // Convert dateOfBirth to ISO string if present
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        reason: 'Updated by LGU officer',
      }

      const res = await patch(`/api/auth/lgu-officer/users/${owner._id}`, payload)

      if (res.success && res.updated) {
        message.success(`Owner details updated (${res.changes?.length || 0} field(s) changed)`)
        onSuccess?.(res.user)
        onClose()
      } else if (res.success && !res.updated) {
        message.info('No changes detected')
        onClose()
      } else {
        message.error(res.message || 'Failed to update owner')
      }
    } catch (err) {
      console.error('Failed to update owner:', err)
      message.error(err?.response?.data?.message || err?.message || 'Failed to update owner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Edit Owner Details"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Save Changes"
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      {fetching ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical" style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 8 }}>
          <Divider orientation="left" plain style={{ marginTop: 0 }}>
            Basic Information
          </Divider>

          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'First name is required' }]}
          >
            <Input placeholder="First name" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Last name is required' }]}
          >
            <Input placeholder="Last name" maxLength={100} />
          </Form.Item>

          <Form.Item name="middleName" label="Middle Name (optional)">
            <Input placeholder="Middle name" maxLength={100} />
          </Form.Item>

          <Form.Item name="suffix" label="Suffix (optional)">
            <Input placeholder="e.g. Jr., Sr., III" maxLength={20} />
          </Form.Item>

          <Form.Item name="sex" label="Sex">
            <Select placeholder="Select sex" options={SEX_OPTIONS} allowClear />
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Date of Birth">
            <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="09XXXXXXXXX" maxLength={15} />
          </Form.Item>

          <Divider orientation="left" plain>
            Address
          </Divider>

          <PhilippineAddressFields form={form} namePrefix="address" required={false} compactLayout />

          <Divider orientation="left" plain>
            Other Information
          </Divider>

          <Form.Item name="maritalStatus" label="Marital Status">
            <Select placeholder="Select status" options={MARITAL_STATUS_OPTIONS} allowClear />
          </Form.Item>

          <Form.Item name="placeOfBirth" label="Place of Birth">
            <Input placeholder="Place of birth" maxLength={200} />
          </Form.Item>

          <Form.Item name="nationality" label="Nationality">
            <Input placeholder="e.g. Filipino" maxLength={50} />
          </Form.Item>

          <Form.Item name="highestEducationalAttainment" label="Education">
            <Select placeholder="Select education level" options={EDUCATION_OPTIONS} allowClear />
          </Form.Item>

          <Form.Item name="fatherName" label="Father's Name">
            <Input placeholder="Full name of father" maxLength={100} />
          </Form.Item>

          <Form.Item name="motherName" label="Mother's Name">
            <Input placeholder="Full name of mother" maxLength={100} />
          </Form.Item>

          <Form.Item name="distinctiveMark" label="Distinctive Mark (optional)">
            <Input placeholder="e.g. scar on left hand" maxLength={200} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
