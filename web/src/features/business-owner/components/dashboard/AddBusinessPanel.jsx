import React from 'react'
import AddBusinessForm from '../AddBusinessForm'

function AddBusinessPanel({ onBack, onDraftCreated }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AddBusinessForm
        key="add-new"
        onBack={onBack}
        editingBusiness={null}
        onDraftCreated={onDraftCreated}
      />
    </div>
  )
}

export default AddBusinessPanel
