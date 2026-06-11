import PermitApplicationForm from '../forms/PermitApplicationForm'

function AddBusinessPanel({ onBack, onDraftCreated }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PermitApplicationForm
        key="add-new"
        onBack={onBack}
        editingApplication={null}
        onDraftCreated={onDraftCreated}
      />
    </div>
  )
}

export default AddBusinessPanel
