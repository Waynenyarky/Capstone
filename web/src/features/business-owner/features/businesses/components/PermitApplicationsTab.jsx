import React from 'react'
import { Button, Space, Tabs, Spin, Typography } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import PermitApplicationFilters from '@/features/business-owner/features/permits/components/PermitApplicationFilters'
import RegistrationTable from '@/features/business-owner/features/permits/components/RegistrationTable'
import RenewalTable from '@/features/business-owner/features/permits/components/RenewalTable'
import ViewDetailsModal from '@/features/business-owner/features/permits/components/ViewDetailsModal'
import EditRegistrationModal from '@/features/business-owner/features/permits/components/EditRegistrationModal'
import EditRenewalModal from '@/features/business-owner/features/permits/components/EditRenewalModal'
import ReviewCommentsModal from '@/features/business-owner/features/permits/components/ReviewCommentsModal'
import RequirementsViewModal from '@/features/business-owner/features/permits/components/RequirementsViewModal'
import { usePermitApplicationPage } from '@/features/business-owner/features/permits/hooks/usePermitApplicationPage'
import { theme } from 'antd'

const { Text } = Typography

export default function PermitApplicationsTab({ onSwitchTab }) {
  const { token } = theme.useToken()
  const {
    activeTab,
    setActiveTabAndNavigate,
    loading,
    hasNoBusinesses,
    registrationFilters,
    setRegistrationFilters,
    renewalFilters,
    setRenewalFilters,
    clearRegistrationFilters,
    clearRenewalFilters,
    hasActiveRegistrationFilters,
    hasActiveRenewalFilters,
    filteredPermits,
    filteredRenewals,
    renewalYears,
    viewModalVisible,
    requirementsModalVisible,
    editModalVisible,
    modalType,
    modalData,
    modalLoading,
    selectedRecord,
    selectedComments,
    commentsModalVisible,
    editForm,
    hasEmployeesValue,
    normFile,
    handleRefresh,
    handleView,
    handleViewRequirements,
    handleEdit,
    handleViewComments,
    customUploadRequest,
    handleResubmit,
    handleEditSubmit,
    canEdit,
    closeEditModal,
    closeViewModal,
    closeRequirementsModal,
    closeCommentsModal
  } = usePermitApplicationPage({ embedded: true })

  const showNoBusinessState = !loading && hasNoBusinesses

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Spin size="large" tip="Loading..."><div style={{ minHeight: 48 }} /></Spin>
      </div>
    )
  }

  if (showNoBusinessState) {
    return (
      <div style={{ borderRadius: 8, width: '100%', padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Space direction="vertical" align="center" size={16} style={{ width: 280 }}>
          <ShopOutlined style={{ fontSize: 32, color: token?.colorTextTertiary }} />
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            Add a business first, then apply for its permit.
          </Text>
          {typeof onSwitchTab === 'function' && (
            <Button type="primary" onClick={() => onSwitchTab('businesses')}>
              Go to Businesses
            </Button>
          )}
        </Space>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 8 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTabAndNavigate}
        items={[
          {
            key: 'registrations',
            label: 'Business Registration',
            children: (
              <div>
                <PermitApplicationFilters variant="registration" filters={registrationFilters} onFiltersChange={setRegistrationFilters} onClear={clearRegistrationFilters} hasActive={hasActiveRegistrationFilters} />
                <RegistrationTable
                  dataSource={filteredPermits}
                  loading={loading}
                  token={token}
                  onViewRequirements={handleViewRequirements}
                  onEdit={handleEdit}
                  onViewComments={handleViewComments}
                  canEdit={canEdit}
                />
              </div>
            )
          },
          {
            key: 'renewals',
            label: 'Business Renewal',
            children: (
              <div>
                <PermitApplicationFilters variant="renewal" filters={renewalFilters} onFiltersChange={setRenewalFilters} onClear={clearRenewalFilters} hasActive={hasActiveRenewalFilters} renewalYears={renewalYears} />
                <RenewalTable dataSource={filteredRenewals} loading={loading} token={token} onView={handleView} onEdit={handleEdit} canEdit={canEdit} />
              </div>
            )
          }
        ]}
      />

      {modalType === 'registration' && (
        <RequirementsViewModal visible={requirementsModalVisible} application={modalData} type={modalType} loading={modalLoading} onClose={closeRequirementsModal} />
      )}

      <ViewDetailsModal open={viewModalVisible} onClose={closeViewModal} modalType={modalType} modalData={modalData} loading={modalLoading} token={token} />

      {editModalVisible && modalType === 'registration' && (
        <EditRegistrationModal
          open={editModalVisible}
          onCancel={closeEditModal}
          modalData={modalData}
          selectedRecord={selectedRecord}
          loading={modalLoading}
          form={editForm}
          normFile={normFile}
          customUploadRequest={customUploadRequest}
          hasEmployeesValue={hasEmployeesValue}
          onResubmit={handleResubmit}
          onSave={handleEditSubmit}
        />
      )}

      {editModalVisible && modalType === 'renewal' && (
        <EditRenewalModal
          open={editModalVisible}
          onCancel={closeEditModal}
          modalData={modalData}
          selectedRecord={selectedRecord}
          loading={modalLoading}
          form={editForm}
          canEdit={canEdit}
          onSave={handleEditSubmit}
        />
      )}

      <ReviewCommentsModal open={commentsModalVisible} onClose={closeCommentsModal} selectedComments={selectedComments} />
    </div>
  )
}
