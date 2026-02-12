import React from 'react'
import { Button, Space, theme, Tabs, Spin, Typography } from 'antd'
import BusinessOwnerLayout from '@/features/business-owner/views/components/BusinessOwnerLayout'
import { PlusOutlined, ReloadOutlined, FileSyncOutlined, FileTextOutlined, ShopOutlined } from '@ant-design/icons'
import PermitApplicationFilters from '../components/PermitApplicationFilters'
import RegistrationTable from '../components/RegistrationTable'
import RenewalTable from '../components/RenewalTable'
import ViewDetailsModal from '../components/ViewDetailsModal'
import EditRegistrationModal from '../components/EditRegistrationModal'
import EditRenewalModal from '../components/EditRenewalModal'
import ReviewCommentsModal from '../components/ReviewCommentsModal'
import RequirementsViewModal from '../components/RequirementsViewModal'
import { usePermitApplicationPage } from '../hooks/usePermitApplicationPage'

export default function PermitApplicationPage() {
  const { token } = theme.useToken()
  const { Text } = Typography
  const {
    navigate,
    activeTab,
    setActiveTabAndNavigate,
    loading,
    refreshing,
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
  } = usePermitApplicationPage()

  const showNoBusinessState = !loading && hasNoBusinesses

  return (
    <BusinessOwnerLayout
      pageTitle="Permit Applications"
      pageIcon={<FileTextOutlined />}
      headerActions={
        showNoBusinessState ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/owner/business-registration')}>
            Register business
          </Button>
        ) : (
          <Space>
            <Button icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh} loading={refreshing} title="Refresh status (auto-refreshes every 30 seconds)" />
            <Button icon={<PlusOutlined />} onClick={() => navigate('/owner/business-registration')}>Apply for New Permit</Button>
            <Button icon={<FileSyncOutlined />} onClick={() => navigate('/owner/business-renewal')}>Renew Existing Permits</Button>
          </Space>
        )
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <Spin size="large" tip="Loading..."><div style={{ minHeight: 48 }} /></Spin>
        </div>
      ) : showNoBusinessState ? (
        <div style={{ borderRadius: 8, width: '100%', padding: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Space direction="vertical" align="center" size={16} style={{ width: 250 }}>
              <ShopOutlined style={{ fontSize: 32, color: token?.colorTextTertiary }} />
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                  You need to register a business first to apply for permits or renewals.
                </Text>
              </div>
            </Space>
        </div>
      ) : (
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
        </div>
      )}

      {!showNoBusinessState && modalType === 'registration' && (
        <RequirementsViewModal visible={requirementsModalVisible} application={modalData} type={modalType} loading={modalLoading} onClose={closeRequirementsModal} />
      )}

      {!showNoBusinessState && (
        <>
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
        </>
      )}
    </BusinessOwnerLayout>
  )
}
