import React from 'react'
import { Form, Typography, Alert } from 'antd'
import PhilippineAddressFields from "@/shared/components/PhilippineAddressFields"
import { useEditUserProfileForm } from "@/features/user/hooks/useEditUserProfileForm.jsx"
import { useAuthSession } from "@/features/authentication"

const { Title } = Typography

export default function AddressSection() {
  const { currentUser } = useAuthSession()
  const role = currentUser?.role
  const roleKey = String(role?.slug || role || '').toLowerCase()
  const isBusinessOwner = roleKey === 'business_owner'
  
  const {
    form,
    inputVariant,
  } = useEditUserProfileForm()

  // Address section is only for business owners
  if (!isBusinessOwner) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Title level={4} type="secondary">
          Address information is only available for business owners
        </Title>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: 12, padding: '0 16px' }}>
        <Title level={5} style={{ marginBottom: 4, textAlign: 'center' }}>
          Address
        </Title>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px 24px' }}>
        <Form
          form={form}
          layout="vertical"
          style={{ width: 300, margin: '0 auto' }}
        >
          <PhilippineAddressFields 
            form={form} 
            namePrefix="address" 
            required={false} 
            variant={inputVariant} 
            compactLayout={true}
            disabled={true}
          />
        </Form>
      </div>
    </div>
  )
}
