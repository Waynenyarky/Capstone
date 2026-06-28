import { useState, useEffect, useRef } from 'react'

export function useFormStepState(editingApplication, initialRegistrationType, form) {
  const isEditing = !!editingApplication
  const [step, setStep] = useState(isEditing ? 'form' : (initialRegistrationType ? 'form' : 'type_selection'))
  const [registrationType, setRegistrationType] = useState(editingApplication?.formType || initialRegistrationType || (isEditing ? 'permit' : null))
  const [generalPermitCategory, setGeneralPermitCategory] = useState(editingApplication?.category || null)

  const initialTypeRef = useRef(initialRegistrationType)

  // When switching to "Add" (editingApplication becomes null), reset to type selection
  // BUT skip reset if initialRegistrationType is provided (coming from welcome modal)
  // When editingApplication changes to a new business, update formValues immediately
  useEffect(() => {
    if (!editingApplication && !initialTypeRef.current) {
      setStep('type_selection')
      setRegistrationType(null)
      setGeneralPermitCategory(null)
      form.resetFields()
    } else if (editingApplication) {
      setGeneralPermitCategory(editingApplication.category || null)
      setRegistrationType(editingApplication.formType || 'permit')
    }
  }, [editingApplication, form])

  return {
    step,
    setStep,
    registrationType,
    setRegistrationType,
    generalPermitCategory,
    setGeneralPermitCategory,
  }
}
