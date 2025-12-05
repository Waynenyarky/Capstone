import React from 'react'
import { Row, Col } from 'antd'
import { LogoutForm, LoggedInPasswordChangeFlow, LoggedInEmailChangeFlow, DeleteAccountFlow } from "@/features/authentication"
import EditCustomerProfileForm from "@/features/customer/components/EditCustomerProfileForm.jsx"
import BookAppointmentForm from "@/features/customer/appointments/components/BookAppointmentForm.jsx"
import AvailableServicesTable from "@/features/customer/appointments/components/AvailableServicesTable.jsx"
import { useState } from 'react'
import CustomerOnboarding from '@/features/customer/addresses/components/CustomerOnboarding.jsx'
import CustomerAddressesManager from '@/features/customer/addresses/components/CustomerAddressesManager.jsx'
import { useCustomerAddresses } from '@/features/customer/addresses/hooks/useCustomerAddresses.js'
import CustomerAppointmentsTabs from '@/features/customer/appointments/components/CustomerAppointmentsTabs.jsx'

export default function CustomerWorkspaceGate() {
  const [selectedService, setSelectedService] = useState(null)
  const { addresses, reload } = useCustomerAddresses()
  return (
    <>
      {Array.isArray(addresses) && addresses.length === 0 ? (
        <Row gutter={[12, 12]} style={{ padding: 24 }}>
          <Col span={24}>
            <CustomerOnboarding onCompleted={reload} />
          </Col>
        </Row>
      ) : null}
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <LogoutForm />
        </Col>
        <LoggedInPasswordChangeFlow />
        <LoggedInEmailChangeFlow />
        <Col span={6}>
          <EditCustomerProfileForm />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <DeleteAccountFlow />
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <CustomerAddressesManager />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={12}>
          <BookAppointmentForm selectedService={selectedService} onFinish={() => setSelectedService(null)} />
        </Col>
        <Col span={12}>
          <AvailableServicesTable onBook={(svc) => setSelectedService(svc)} />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <CustomerAppointmentsTabs />
        </Col>
      </Row>
    </>
  )
}