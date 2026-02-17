import React, { useImperativeHandle, forwardRef } from 'react'
import { Tabs, Button, App, Space } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { wizardSteps } from '../constants/wizardSteps.jsx'
import { useBusinessRegistrationWizard } from '../hooks/useBusinessRegistrationWizard.jsx'
import BusinessRegistrationStepContent from './BusinessRegistrationStepContent'

const BusinessRegistrationWizard = forwardRef(function BusinessRegistrationWizard(
  {
    businessId,
    isNewBusiness,
    formData,
    onComplete,
    onSaveBusiness
  },
  ref
) {
  const { message } = App.useApp()
  const {
    actualBusinessId,
    currentStep,
    isMobile,
    loading,
    form,
    applicationData,
    documentFields,
    effectiveLguDocumentsWithStorage,
    effectiveBirRegistration,
    isSubmitted,
    handleStepChange,
    handleRequirementsConfirm,
    handleFormValuesChange,
    handleFormSave,
    handleDocumentsSave,
    handleDocumentsSaveFromModal,
    handleBIRSave,
    handleBIRSaveFromModal,
    handleAgenciesSave,
    handleAgenciesSaveFromModal,
    handleBusinessSaveFromModal,
    handleReviewEdit,
    handleFinalSubmit,
    handleNext,
    handlePrev,
    saveDraft
  } = useBusinessRegistrationWizard({
    businessId,
    isNewBusiness,
    formData,
    onComplete,
    onSaveBusiness
  })

  useImperativeHandle(ref, () => ({ saveDraft }), [saveDraft])

  const totalSteps = wizardSteps.length

  return (
    <div>
      <Tabs
        activeKey={wizardSteps[currentStep]?.key}
        onChange={(key) => {
          if (isSubmitted && currentStep < totalSteps - 1) return
          const nextIndex = wizardSteps.findIndex((step) => step.key === key)
          if (nextIndex >= 0) handleStepChange(nextIndex)
        }}
        size={isMobile ? 'small' : 'middle'}
        tabBarStyle={{ marginBottom: isMobile ? 16 : 24 }}
        items={wizardSteps.map((step, index) => {
          const isComplete = index < currentStep
          return {
            key: step.key,
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{index + 1}.</span>
                <span>{step.title}</span>
                {isComplete && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              </span>
            )
          }
        })}
      />

      <div style={{ minHeight: isMobile ? 300 : 400 }}>
        <BusinessRegistrationStepContent
          currentStep={currentStep}
          form={form}
          formData={formData}
          applicationData={applicationData}
          documentFields={documentFields}
          businessId={businessId}
          actualBusinessId={actualBusinessId}
          effectiveLguDocumentsWithStorage={effectiveLguDocumentsWithStorage}
          effectiveBirRegistration={effectiveBirRegistration}
          handleRequirementsConfirm={handleRequirementsConfirm}
          handleFormValuesChange={handleFormValuesChange}
          handleDocumentsSave={handleDocumentsSave}
          handleDocumentsSaveFromModal={handleDocumentsSaveFromModal}
          handleBIRSave={handleBIRSave}
          handleBIRSaveFromModal={handleBIRSaveFromModal}
          handleAgenciesSave={handleAgenciesSave}
          handleAgenciesSaveFromModal={handleAgenciesSaveFromModal}
          handleBusinessSaveFromModal={handleBusinessSaveFromModal}
          handleReviewEdit={handleReviewEdit}
          handleFinalSubmit={handleFinalSubmit}
          loading={loading}
        />
      </div>

      {/* Navigation buttons for steps 0-5 (not review/submit or status) */}
      {currentStep < 6 && !isSubmitted && (
        <div style={{
          marginTop: isMobile ? 24 : 32,
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0
        }}>
          <Button
            onClick={handlePrev}
            disabled={currentStep === 0}
            size="default"
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Previous
          </Button>
          <Space>
            <Button
              type="primary"
              size="default"
              onClick={async () => {
                try {
                  // Validate current step fields before proceeding
                  await form.validateFields()
                  if (currentStep === 1 || currentStep === 0) {
                    // Save form data on taxpayer info or application type step
                    const values = form.getFieldsValue(true)
                    await handleFormSave(values)
                  } else {
                    handleNext()
                  }
                } catch (error) {
                  if (error?.errorFields?.length) {
                    message.error(`Please fix ${error.errorFields.length} error(s) in this step before continuing.`)
                  }
                }
              }}
              loading={loading}
            >
              {currentStep === 5 ? 'Proceed to Review' : 'Save & Continue'}
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
})

export default BusinessRegistrationWizard
