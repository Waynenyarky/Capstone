import React from 'react'
import { Form } from 'antd'
import {
  Step1ApplicationType,
  Step2TaxpayerInfo,
  Step3Addresses,
  Step4BusinessActivities,
  Step5Capital,
  Step6Accreditations,
  Step7ReviewSubmit,
} from './BusinessRegistrationForm'
import ApplicationStatusCard from './ApplicationStatusCard'

export default function BusinessRegistrationStepContent({
  currentStep,
  form,
  formData,
  applicationData,
  businessId,
  actualBusinessId,
  handleFormValuesChange,
  handleFinalSubmit,
  loading,
  // Legacy props kept for backward compatibility (unused in new flow)
  documentFields,
  effectiveLguDocumentsWithStorage,
  effectiveBirRegistration,
  handleRequirementsConfirm,
  handleDocumentsSave,
  handleDocumentsSaveFromModal,
  handleBIRSave,
  handleBIRSaveFromModal,
  handleAgenciesSave,
  handleAgenciesSaveFromModal,
  handleBusinessSaveFromModal,
  handleReviewEdit,
}) {
  switch (currentStep) {
    case 0:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step1ApplicationType form={form} />
        </Form>
      )
    case 1:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step2TaxpayerInfo form={form} />
        </Form>
      )
    case 2:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step3Addresses form={form} />
        </Form>
      )
    case 3:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step4BusinessActivities form={form} />
        </Form>
      )
    case 4:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step5Capital form={form} />
        </Form>
      )
    case 5:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step6Accreditations form={form} />
        </Form>
      )
    case 6:
      return (
        <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
          <Step7ReviewSubmit
            form={form}
            formData={applicationData?.businessData || formData}
            onSubmit={handleFinalSubmit}
            loading={loading}
          />
        </Form>
      )
    case 7:
      return (
        <ApplicationStatusCard
          businessId={businessId}
          status={formData?.applicationStatus}
          referenceNumber={applicationData?.referenceNumber || formData?.applicationReferenceNumber}
          submittedAt={applicationData?.submittedAt || formData?.submittedAt}
        />
      )
    default:
      return <div>Unknown step</div>
  }
}
