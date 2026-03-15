import React from 'react'
import { Form, Input, Select, Typography, Alert } from 'antd'
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.jsx"
import {
  pisSexRules,
  pisDateOfBirthRules,
  pisMaritalStatusRules,
  pisPlaceOfBirthRules,
  pisNationalityRules,
  pisEducationRules,
  pisFatherNameRules,
  pisMotherNameRules,
} from "@/features/authentication/utils/validations/pisRules"
import { useAuthSession } from "@/features/authentication"

const { Title } = Typography

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'legally_separated', label: 'Legally Separated' },
  { value: 'annulled', label: 'Annulled' },
  { value: 'void', label: 'Void' },
]

const EDUCATION_OPTIONS = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'high_school', label: 'High School' },
  { value: 'college_undergraduate', label: 'College (Undergraduate)' },
  { value: 'college_graduate', label: 'College Graduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'vocational', label: 'Vocational/Technical' },
  { value: 'others', label: 'Others' },
]

export default function PersonalInfoSection() {
  const { currentUser } = useAuthSession()
  const role = currentUser?.role
  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isBusinessOwner = roleKey === 'business_owner'
  
  const {
    form,
    inputVariant,
  } = useEditUserProfileForm()

  // Personal info section is only for business owners
  if (!isBusinessOwner) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Title level={4} type="secondary">
          Personal information is only available for business owners
        </Title>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: 12, padding: '0 16px' }}>
        <Title level={5} style={{ marginBottom: 4, textAlign: 'center' }}>
          Personal Information
        </Title>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 24px' }}>
        <Form
          form={form}
          layout="vertical"
          style={{ width: 300, margin: '0 auto' }}
        >
          <Form.Item name="maritalStatus" label="Marital Status" rules={pisMaritalStatusRules}>
            <Select placeholder="Select status" options={MARITAL_STATUS_OPTIONS} allowClear variant={inputVariant} disabled />
          </Form.Item>
          <Form.Item name="placeOfBirth" label="Place of Birth" rules={pisPlaceOfBirthRules}>
            <Input placeholder="Place of birth" variant={inputVariant} disabled />
          </Form.Item>
          <Form.Item name="nationality" label="Nationality" rules={pisNationalityRules}>
            <Input placeholder="e.g. Filipino" variant={inputVariant} disabled />
          </Form.Item>
          <Form.Item name="highestEducationalAttainment" label="Education" rules={pisEducationRules}>
            <Select placeholder="Select education level" options={EDUCATION_OPTIONS} allowClear variant={inputVariant} disabled />
          </Form.Item>
          <Form.Item name="fatherName" label="Father's Name" rules={pisFatherNameRules}>
            <Input placeholder="Full name of father" variant={inputVariant} disabled />
          </Form.Item>
          <Form.Item name="motherName" label="Mother's Name" rules={pisMotherNameRules}>
            <Input placeholder="Full name of mother" variant={inputVariant} disabled />
          </Form.Item>
          <Form.Item name="distinctiveMark" label="Distinctive Mark (optional)">
            <Input placeholder="e.g. scar on left hand" variant={inputVariant} disabled />
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
