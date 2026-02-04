import React from 'react'
import { Button, Card, Form } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import RequirementsChecklistStep from './RequirementsChecklistStep'
import BusinessRegistrationForm from './BusinessRegistrationForm'
import LGUDocumentsUploadStep from './LGUDocumentsUploadStep'
import BIRRegistrationStep from './BIRRegistrationStep'
import OtherAgenciesStep from './OtherAgenciesStep'
import ApplicationReviewStep from './ApplicationReviewStep'
import ApplicationStatusCard from './ApplicationStatusCard'

export default function BusinessRegistrationStepContent({
  currentStep,
  form,
  formData,
  applicationData,
  businessId,
  actualBusinessId,
  effectiveLguDocumentsWithStorage,
  effectiveBirRegistration,
  handleRequirementsConfirm,
  handleFormValuesChange,
  handleDocumentsSave,
  handleDocumentsSaveFromModal,
  handleBIRSave,
  handleBIRSaveFromModal,
  handleAgenciesSave,
  handleAgenciesSaveFromModal,
  handleBusinessSaveFromModal,
  handleReviewEdit,
  handleFinalSubmit,
  loading
}) {
  switch (currentStep) {
    case 0:
      return (
        <RequirementsChecklistStep
          businessId={businessId}
          businessType={applicationData.businessData?.businessType || formData?.businessType}
          onConfirm={handleRequirementsConfirm}
          onNext={handleRequirementsConfirm}
        />
      )
    case 1:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <BusinessRegistrationForm
            form={form}
            initialValues={applicationData.businessData || formData}
            onValuesChange={() => {}}
          />
        </Form>
      )
    case 2:
      return (
        <LGUDocumentsUploadStep
          businessId={actualBusinessId || businessId}
          businessType={applicationData.businessData?.businessType || formData?.businessType}
          initialDocuments={effectiveLguDocumentsWithStorage}
          onSave={handleDocumentsSave}
          onNext={handleDocumentsSave}
        />
      )
    case 3:
      return (
        <BIRRegistrationStep
          businessId={actualBusinessId || businessId}
          initialData={effectiveBirRegistration}
          onSave={handleBIRSave}
          onNext={handleBIRSave}
        />
      )
    case 4:
      return (
        <OtherAgenciesStep
          businessId={actualBusinessId || businessId}
          initialData={applicationData.otherAgencyRegistrations}
          onSave={handleAgenciesSave}
          onNext={handleAgenciesSave}
        />
      )
    case 5: {
      let reviewLguDocuments = null
      if (effectiveLguDocumentsWithStorage) {
        reviewLguDocuments = effectiveLguDocumentsWithStorage
      }
      let reviewBirRegistration = null
      if (applicationData.birRegistration) {
        reviewBirRegistration = applicationData.birRegistration
      } else if (formData?.birRegistration) {
        reviewBirRegistration = formData.birRegistration
      }
      const reviewOtherAgencies = applicationData.otherAgencyRegistrations || formData?.otherAgencyRegistrations || null

      return (
        <ApplicationReviewStep
          businessData={applicationData.businessData || formData}
          lguDocuments={reviewLguDocuments}
          birRegistration={reviewBirRegistration}
          otherAgencyRegistrations={reviewOtherAgencies}
          onEdit={handleReviewEdit}
          businessId={actualBusinessId || businessId}
          onDocumentsSave={handleDocumentsSaveFromModal}
          onBIRSave={handleBIRSaveFromModal}
          onAgenciesSave={handleAgenciesSaveFromModal}
          onBusinessSave={handleBusinessSaveFromModal}
        />
      )
    }
    case 6:
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
            <h2>Ready to Submit</h2>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>
              Review all information and submit your application to the LGU Officer for permit verification.
            </p>
            <Button
              type="primary"
              size="default"
              onClick={handleFinalSubmit}
              loading={loading}
              icon={<CheckCircleOutlined />}
            >
              Submit Application
            </Button>
          </div>
        </Card>
      )
    case 7:
      return (
        <ApplicationStatusCard
          businessId={businessId}
          status={formData?.applicationStatus}
          referenceNumber={applicationData.referenceNumber || formData?.applicationReferenceNumber}
          submittedAt={applicationData.submittedAt || formData?.submittedAt}
        />
      )
    default:
      return <div>Unknown step</div>
  }
}
