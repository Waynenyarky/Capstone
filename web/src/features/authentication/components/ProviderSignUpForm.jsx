import React from 'react'
import { Card, Button, Form } from 'antd'
import { useProviderSignUpFlow } from "@/features/authentication/hooks"
import { SignUpVerificationForm } from "@/features/authentication"
import { 
  OwnerInfoFields,
  BusinessInfoFields,
  ServiceAreasSection,
  SocialLinksList,
  TeamMembersList,
  TermsAndSubmit,
  ProviderApplicationReviewModal,
} from "@/features/authentication/components/provider"
 

export function ProviderSignUpForm() {
  const {
    step,
    form,
    isSubmitting,
    initialValues,
    categoryOptions,
    categoriesLoading,
    provinceSelectProps,
    citySelectProps,
    serviceAreasLoading,
    activeAreas,
    allActiveCities,
    businessTypeValue,
    reviewOpen,
    reviewValues,
    handleReview,
    closeReview,
    confirmReviewSubmission,
    prefillDemo,
    verificationProps,
  } = useProviderSignUpFlow({ onSubmit: console.log })

  if (step === 'verify') {
    return <SignUpVerificationForm {...verificationProps} />
  }

  return (
    <Card title="Provider Sign Up" extra={<Button onClick={prefillDemo}>Prefill Demo</Button>}>
      <Form
        name="providerSignUp"
        form={form}
        layout="vertical"
        onFinish={handleReview}
        initialValues={initialValues}
      >
        <OwnerInfoFields />
        <BusinessInfoFields
          categoryOptions={categoryOptions}
          categoriesLoading={categoriesLoading}
          provinceSelectProps={provinceSelectProps}
          citySelectProps={citySelectProps}
        />
        <ServiceAreasSection
          form={form}
          activeAreas={activeAreas}
          serviceAreasLoading={serviceAreasLoading}
          allActiveCities={allActiveCities}
        />
        <SocialLinksList />
        {String(businessTypeValue || '') !== 'Sole Proprietor' && <TeamMembersList />}
        <TermsAndSubmit isSubmitting={isSubmitting} />
      </Form>
      <ProviderApplicationReviewModal
        open={reviewOpen}
        values={reviewValues}
        onCancel={closeReview}
        onOk={confirmReviewSubmission}
        confirmLoading={isSubmitting}
      />
    </Card>
  )
}

export default ProviderSignUpForm