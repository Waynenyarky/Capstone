import React from 'react'
import { Form, Input, Card, Flex, Button, Select, Typography, InputNumber, Checkbox } from 'antd'
import { useEditProviderProfileForm } from "@/features/provider/hooks"
import { usePHLocations } from "@/hooks/usePHLocations.js"
import { useSupportedAreasSelectProps } from "@/features/provider/hooks"
import { businessNameRules, businessTypeRules, yearsInBusinessRules, serviceAreasRules, serviceCategoriesRules, businessAddressRules, cityRules, provinceRules, zipCodeRules, businessPhoneRules, businessEmailRules, businessDescriptionRules } from "@/features/authentication/validations"
import { useAuthSession } from "@/features/authentication"
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from "@/shared/forms/index.js"

export default function EditProviderProfileForm() {
  const { form, isLoading, isSubmitting, handleFinish, categoryOptions, categoriesLoading } = useEditProviderProfileForm()
  const { provinceSelectProps, citySelectProps } = usePHLocations(form)
  const { provinceSelectProps: areasProvinceSelectProps, citySelectProps: areasCitySelectProps, allActiveCities } = useSupportedAreasSelectProps(form)
  const { currentUser } = useAuthSession()
  

  return (
    <Card title="Edit Business Profile">
      <Form form={form} layout="vertical" onFinish={handleFinish} disabled={isLoading}>
        <Typography.Text type="secondary">Owner Email: {currentUser?.email || '-'}</Typography.Text>
        <Form.Item name="businessName" label="Business Name" rules={businessNameRules}>
          <Input />
        </Form.Item>
        <Form.Item name="businessType" label="Business Type" rules={businessTypeRules}>
          <Select
            options={[
              { label: 'Sole Proprietor', value: 'Sole Proprietor' },
              { label: 'Partnership', value: 'Partnership' },
              { label: 'Corporation', value: 'Corporation' },
              { label: 'Cooperative', value: 'Cooperative' },
              { label: 'LLC', value: 'LLC' },
            ]}
            placeholder="Select business type"
          />
        </Form.Item>
        <Form.Item name="yearsInBusiness" label="Years in Business" rules={yearsInBusinessRules}>
          <InputNumber min={0} max={100} precision={0} inputMode="numeric" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} style={{ width: '100%' }} />
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
        <Form.Item name="serviceAreasProvince" label="Service Areas Province" tooltip="Select a province to pick cities served">
          <Select {...areasProvinceSelectProps} />
        </Form.Item>
        <Form.Item
          name="serviceAreas"
          label="Service Areas (Cities)"
          tooltip="Select cities you serve from the chosen province"
          rules={[
            ...serviceAreasRules,
            {
              validator: (_, value) => {
                const selected = Array.isArray(value) ? value : []
                const allowed = (allActiveCities || []).map((a) => String(a).trim().toLowerCase())
                if (allowed.length === 0) return Promise.resolve()
                const unsupported = selected.filter((a) => !allowed.includes(String(a || '').trim().toLowerCase()))
                if (unsupported.length > 0) {
                  return Promise.reject(new Error(`Unsupported city/cities: ${unsupported.join(', ')}`))
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select cities from chosen province"
            options={areasCitySelectProps.options}
            loading={areasCitySelectProps.loading}
            disabled={areasCitySelectProps.disabled}
            showSearch
            filterOption={areasCitySelectProps.filterOption}
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
          <Input inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} />
        </Form.Item>
        <Form.Item name="businessPhone" label="Business Phone" rules={businessPhoneRules}>
          <Input inputMode="numeric" pattern="[0-9]*" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} />
        </Form.Item>
        <Form.Item name="businessEmail" label="Business Email" rules={businessEmailRules}>
          <Input />
        </Form.Item>
        <Form.Item name="businessDescription" label="Business Description" rules={businessDescriptionRules}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Typography.Text>Licenses and Insurance</Typography.Text>
        <Form.Item name="hasInsurance" valuePropName="checked">
          <Checkbox>Has insurance</Checkbox>
        </Form.Item>
        <Form.Item name="hasLicenses" valuePropName="checked">
          <Checkbox>Has required licenses</Checkbox>
        </Form.Item>
        <Form.Item name="consentsToBackgroundCheck" valuePropName="checked">
          <Checkbox>Consents to background checks</Checkbox>
        </Form.Item>
        <Typography.Text>Team Members</Typography.Text>
        <Form.Item name="isSolo" valuePropName="checked" initialValue={true}>
          <Checkbox>I operate solo (no employees)</Checkbox>
        </Form.Item>
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
        <Flex justify="end">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting || isLoading}>Save Changes</Button>
        </Flex>
      </Form>
    </Card>
  )
}