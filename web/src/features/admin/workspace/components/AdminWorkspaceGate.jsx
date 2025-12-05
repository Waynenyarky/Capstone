import React from 'react'
import { Row, Col } from 'antd'
import { LogoutForm } from "@/features/authentication"
import { CreateCategoryForm, CreateServiceForm, CategoryTable, ServiceTable, EditServiceForm, EditCategoryForm } from "@/features/admin/services"
import { ProvidersTable, ProviderApplicationsTable, ReviewProviderStatusForm } from "@/features/admin/providers"
import { UsersTable } from "@/features/admin/users"
import { AddSupportedAreasForm, SupportedAreasTable, EditSupportedAreaForm } from "@/features/admin/areas"

export default function AdminWorkspaceGate() {
  const [selectedProvince, setSelectedProvince] = React.useState(null)
  const [selectedServiceId, setSelectedServiceId] = React.useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(null)
  const [selectedProviderId, setSelectedProviderId] = React.useState(null)
  return (
    <>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <LogoutForm />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={8}>
          <CreateCategoryForm />
        </Col>
        <Col span={8}>
          <CategoryTable onEdit={setSelectedCategoryId} />
        </Col>
        <Col span={8}>
          <EditCategoryForm selectedCategoryId={selectedCategoryId} />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <CreateServiceForm />
        </Col>
        <Col span={10}>
          <ServiceTable onEdit={setSelectedServiceId} />
        </Col>
        <Col span={8}>
          <EditServiceForm selectedServiceId={selectedServiceId} />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={16}>
          <ProvidersTable onReview={setSelectedProviderId} />
        </Col>
        <Col span={8}>
          <ReviewProviderStatusForm providerId={selectedProviderId} onReviewed={() => { setSelectedProviderId(null) }} />
        </Col>
      </Row>
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={6}>
          <AddSupportedAreasForm />
        </Col>
        <Col span={10}>
          <SupportedAreasTable onSelectProvince={setSelectedProvince} />
        </Col>
        <Col span={8}>
          <EditSupportedAreaForm provinceName={selectedProvince} onSaved={() => { setSelectedProvince(null) }} />
        </Col>
      </Row>
      <ProviderApplicationsTable />
      <Row gutter={[12, 12]} style={{ padding: 24 }}>
        <Col span={24}>
          <UsersTable />
        </Col>
      </Row>
    </>
  )
}