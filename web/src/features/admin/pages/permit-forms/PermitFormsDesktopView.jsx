import { useState } from 'react'
import { theme, Segmented, Spin, Button, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PermitFormsEditor, PermitFormsPreview, PermitFormsAuditTab, PermitFormsHeader } from './components'
import { usePermitForms, usePermitFormsAutosave } from './hooks'
import { hasUnsavedChanges } from './utils'

export default function PermitFormsDesktopView({ onBackToMenu }) {
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

  // Create status tag
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
        <Spin size="large" />
      </div>
    )
  }

  const tabSelector = (
    <Segmented
      value={activeTab}
      onChange={setActiveTab}
      options={[
        { label: 'Editor', value: 'editor' },
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
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'editor' && (
          <div style={{ display: 'flex', gap: 0, height: '100%' }}>
            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 16px 16px 40px' }}>
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
            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 16, borderLeft: `1px solid ${token.colorBorderSecondary}` }}>
              <PermitFormsPreview
                cards={draftCards}
                sectionDescription={draftDescription}
                token={token}
              />
            </div>
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
