import { useEffect, useCallback } from 'react'

function useDraftInitialization({
  isEditing,
  initialRegistrationType,
  formDefinition,
  loading,
  hasInitializedDraft,
  setHasInitializedDraft,
  handleTypeSelect,
  setRegistrationType,
  setStep,
  fetchFormDefinition,
  onDraftCreated
}) {
  useEffect(() => {
    if (!isEditing && initialRegistrationType && !formDefinition && !loading && !hasInitializedDraft) {
      setHasInitializedDraft(true)
      
      if (initialRegistrationType === 'permit' && onDraftCreated) {
        handleTypeSelect(initialRegistrationType)
      } else if (initialRegistrationType === 'general_permit' && onDraftCreated) {
        setRegistrationType(initialRegistrationType)
        setStep('category_selection')
      } else {
        fetchFormDefinition(initialRegistrationType)
      }
    }
  }, [
    isEditing,
    initialRegistrationType,
    formDefinition,
    loading,
    hasInitializedDraft,
    setHasInitializedDraft,
    handleTypeSelect,
    setRegistrationType,
    setStep,
    fetchFormDefinition,
    onDraftCreated
  ])
}

export default useDraftInitialization
