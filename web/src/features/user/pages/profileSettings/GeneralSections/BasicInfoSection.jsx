import React from 'react'
import { Form, Input, Select, DatePicker, Typography } from 'antd'
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.jsx"
import {
  firstNameRules,
  lastNameRules,
  middleNameRules,
  suffixRules,
  phoneNumberRules,
} from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"

const { Title } = Typography
const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export default function BasicInfoSection() {
  const { currentUser } = useAuthSession()
  const role = currentUser?.role
  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isBusinessOwner = roleKey === 'business_owner'
  
  const {
    form,
    inputVariant,
  } = useEditUserProfileForm()

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <Title level={5} style={{ marginBottom: 4, textAlign: 'center' }}>
          Basic Information
        </Title>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Form
          form={form}
          layout="vertical"
          style={{ width: 300, margin: '0 auto' }}
        >
          <Form.Item 
            name="firstName" 
            label="First Name" 
            rules={firstNameRules} 
            help={undefined}
          >
            <Input placeholder="First name" variant={inputVariant} showCount maxLength={50} disabled />
          </Form.Item>
          <Form.Item 
            name="lastName" 
            label="Last Name" 
            rules={lastNameRules} 
            help={undefined}
          >
            <Input placeholder="Last name" variant={inputVariant} showCount maxLength={50} disabled />
          </Form.Item>
          
          {isBusinessOwner && (
            <>
              <Form.Item name="middleName" label="Middle Name (optional)" rules={middleNameRules}>
                <Input placeholder="Middle name" variant={inputVariant} disabled />
              </Form.Item>
              <Form.Item name="suffix" label="Suffix (optional)" rules={suffixRules}>
                <Input placeholder="e.g. Jr., Sr., III" variant={inputVariant} disabled />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input placeholder="Email" variant={inputVariant} disabled />
              </Form.Item>
              <Form.Item name="sex" label="Sex">
                <Select placeholder="Select sex" options={SEX_OPTIONS} allowClear variant={inputVariant} disabled />
              </Form.Item>
              <Form.Item name="dateOfBirth" label="Date of Birth (optional)">
                <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" variant={inputVariant} disabled />
              </Form.Item>
            </>
          )}
          
          <Form.Item 
            name="phoneNumber" 
            label="Phone Number" 
            rules={phoneNumberRules}
            help={undefined}
          >
            <Input
              placeholder="09XXXXXXXXX"
              variant={inputVariant}
              showCount
              maxLength={11}
              disabled
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
