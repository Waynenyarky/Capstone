import { useState } from 'react'
import { theme, Button, Tag, Select } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PermitFormsEditor, PermitFormsPreview, PermitFormsAuditTab, PermitFormsHeader } from './components'
import { usePermitForms, usePermitFormsAutosave } from './hooks'
import { hasUnsavedChanges } from './utils'

export default function PermitFormsMobileView({ onBackToMenu }) {
  const { token } = theme.useToken()
  const [activeTab, setActiveTab] = useState('editor')

  const {
    loading,
    saving,
    publishing,
    draftCards,
    draftDescription,
    isEnabled,
    publishedCards,
    publishedDescription,
    isPublished,
    canUndo,
    canRedo,
    save,
    publish,
    revert,
    toggle,
    updateCards,
    updateDescription,
    addCard,
    deleteCard,
    updateCard,
    undo,
    redo,
  } = usePermitForms()

  usePermitFormsAutosave(draftCards, draftDescription, save)

  const unsaved = hasUnsavedChanges(draftCards, publishedCards, draftDescription, publishedDescription)

  let statusTag = null
  if (saving) {
    statusTag = <Tag>Saving...</Tag>
  } else if (isPublished && !unsaved) {
    statusTag = <Tag color="success">Published</Tag>
  } else if (unsaved) {
    statusTag = <Tag color="warning">Unsaved changes</Tag>
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 300 }}>
        <LottieSpinner size="large" />
      </div>
    )
  }

  const tabSelector = (
    <Select
      value={activeTab}
      onChange={setActiveTab}
      style={{ minWidth: 120 }}
      options={[
        { label: 'Editor', value: 'editor' },
        { label: 'Preview', value: 'preview' },
        { label: 'History', value: 'audit' },
      ]}
    />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgContainer, overflow: 'hidden' }}>
      <PermitFormsHeader
        statusTag={statusTag}
        canUndo={canUndo}
        canRedo={canRedo}
        hasChanges={unsaved}
        isEnabled={isEnabled}
        publishing={publishing}
        onToggle={toggle}
        onAddCard={addCard}
        onUndo={undo}
        onRedo={redo}
        onRevertAll={revert}
        onPublish={publish}
        onBackToMenu={onBackToMenu ? <Button icon={<ArrowLeftOutlined />} onClick={onBackToMenu} /> : null}
        tabSelector={tabSelector}
        token={token}
        isMobile
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'editor' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: '12px 12px 12px 40px' }}>
            <PermitFormsEditor
              cards={draftCards}
              sectionDescription={draftDescription}
              onUpdateCards={updateCards}
              onUpdateDescription={updateDescription}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              token={token}
            />
          </div>
        )}
        {activeTab === 'preview' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
            <PermitFormsPreview
              cards={draftCards}
              sectionDescription={draftDescription}
              token={token}
            />
          </div>
        )}
        {activeTab === 'audit' && (
          <div style={{ height: '100%', overflowY: 'auto', padding: 0 }}>
            <PermitFormsAuditTab token={token} />
          </div>
        )}
      </div>
    </div>
  )
}
