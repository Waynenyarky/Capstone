import React from 'react'
import { Form, Input, Select, InputNumber, Typography } from 'antd'
import {
  businessNameRules,
  businessTypeRules,
  yearsInBusinessRules,
  serviceCategoriesRules,
  businessAddressRules,
  provinceRules,
  cityRules,
  zipCodeRules,
  businessPhoneRules,
  businessEmailRules,
  businessDescriptionRules,
} from '@/features/authentication/validations'
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from '@/shared/forms'

export default function BusinessInfoFields({
  categoryOptions,
  categoriesLoading,
  provinceSelectProps,
  citySelectProps,
}) {
  const BUSINESS_TYPE_OPTIONS = [
    { label: 'Sole Proprietor', value: 'Sole Proprietor' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'Corporation', value: 'Corporation' },
    { label: 'Cooperative', value: 'Cooperative' },
    { label: 'LLC', value: 'LLC' },
  ]

  return (
    <>
      <Typography.Text>Business Information</Typography.Text>
      <Form.Item name="businessName" label="Business Name" rules={businessNameRules}>
        <Input />
      </Form.Item>
      <Form.Item name="businessType" label="Business Type" rules={businessTypeRules}>
        <Select options={BUSINESS_TYPE_OPTIONS} placeholder="Select business type" />
      </Form.Item>
      <Form.Item name="yearsInBusiness" label="Years in Business" rules={yearsInBusinessRules}>
        <InputNumber min={0} max={100} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="servicesCategories" label="Service Categories You Provide" rules={serviceCategoriesRules}>
        <Select
          mode="multiple"
          options={categoryOptions}
          loading={categoriesLoading}
          placeholder="Select categories"
          allowClear
        />
      </Form.Item>
      <Form.Item name="streetAddress" label="Street Address" rules={businessAddressRules}>
        <Input />
      </Form.Item>
      <Form.Item name="province" label="Province" rules={provinceRules}>
        <Select {...provinceSelectProps} />
      </Form.Item>
      <Form.Item name="city" label="City" rules={cityRules}>
        <Select {...citySelectProps} />
      </Form.Item>
      <Form.Item name="zipCode" label="Zip Code" rules={zipCodeRules}>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={preventNonNumericKeyDown}
          onPaste={sanitizeNumericPaste}
          onInput={sanitizeNumericInput}
        />
      </Form.Item>
      <Form.Item name="businessPhone" label="Business Phone" rules={businessPhoneRules}>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          onKeyDown={preventNonNumericKeyDown}
          onPaste={sanitizeNumericPaste}
          onInput={sanitizeNumericInput}
        />
      </Form.Item>
      <Form.Item name="businessEmail" label="Business Email" rules={businessEmailRules}>
        <Input />
      </Form.Item>
      <Form.Item name="businessDescription" label="Business Description" rules={businessDescriptionRules}>
        <Input.TextArea rows={4} />
      </Form.Item>
    </>
  )
}