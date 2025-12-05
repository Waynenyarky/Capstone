import React from 'react'
import { Row, Col } from 'antd'
import { LogoutForm, LoggedInPasswordChangeFlow, LoggedInEmailChangeFlow, DeleteAccountFlow } from "@/features/authentication"
import { EditProviderProfileForm } from "@/features/provider"
import { useProviderOfferings } from "@/features/provider/hooks"
import { ProviderAddServiceForm, ProviderServicesTable, ProviderEditServiceForm } from "@/features/provider"
import ProviderAppointmentsTable from '@/features/provider/appointments/components/ProviderAppointmentsTable.jsx'

export default function ProviderActiveWorkspace() {
  const { isSubmitting, allowedServices, offerings, serviceMap, initializeOfferings, updateOffering } = useProviderOfferings()
  const [selectedId, setSelectedId] = React.useState(null)
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <ProviderAddServiceForm
            allowedServices={allowedServices}
            offerings={offerings}
            onAdd={initializeOfferings}
            loading={isSubmitting}
          />
        </Col>
        <Col span={10}>
          <ProviderServicesTable
            offerings={offerings}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Col>
        <Col span={8}>
          <ProviderEditServiceForm
            selectedId={selectedId}
            offerings={offerings}
            serviceMap={serviceMap}
            isSubmitting={isSubmitting}
            updateOffering={updateOffering}
          />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <ProviderAppointmentsTable />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <LogoutForm />
        </Col>
        <LoggedInPasswordChangeFlow />
        <LoggedInEmailChangeFlow />
        <Col span={6}>
          <EditProviderProfileForm />
        </Col>
        <DeleteAccountFlow />
      </Row>
    </>
  )
}