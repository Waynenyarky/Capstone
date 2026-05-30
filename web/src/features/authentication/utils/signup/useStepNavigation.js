import { useCallback, useState } from 'react'

/**
 * Manages two-step form navigation for signup (account info → PIS).
 */
export function useStepNavigation(form) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNextStep = useCallback(async () => {
    try {
      await form.validateFields([
        'firstName', 'lastName', 'email', 'phoneNumber',
        'password', 'confirmPassword', 'termsAndConditions',
      ])
      setCurrentStep(1)
    } catch {
      // Validation errors will be shown by the form
    }
  }, [form])

  const handlePreviousStep = useCallback(() => {
    setCurrentStep(0)
  }, [])

  return { currentStep, handleNextStep, handlePreviousStep, setCurrentStep }
}
