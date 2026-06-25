import { useRef, useState, useEffect } from 'react'
import { Select, Button, Space, Badge, message, App, theme } from 'antd'
import { PlusOutlined, FileTextOutlined, ArrowLeftOutlined, SaveOutlined, DeleteOutlined, SendOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import FormContentEditor from '../../formDefinitions/components/FormContentEditor'
import DraftsModal from '../../formDefinitions/components/DraftsModal'
import AddVersionModal from '../../formDefinitions/components/AddVersionModal'
import { getPermitTypeVersions, createPermitTypeVersion, updatePermitTypeVersion, deletePermitTypeVersion, publishPermitTypeVersion } from '../../../services/permitFormsService'

const VERSION_STATUS_LABELS = {
  draft: 'Draft',
  published: 'Active',
  archived: 'Archived',
}

function formatDraftDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FormTab({ onChange, isMobile, permitTypeId, feeGroupId, onFeeGroupChange }) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const editorRef = useRef(null)
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [draftCreatedAt, setDraftCreatedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [draftsModalOpen, setDraftsModalOpen] = useState(false)
  const [addVersionModalOpen, setAddVersionModalOpen] = useState(false)
  const [_loading, setLoading] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [initialSections, setInitialSections] = useState(undefined)

  // Load versions when permitTypeId changes
  useEffect(() => {
    if (!permitTypeId) return

    const loadVersions = async () => {
      setLoading(true)
      try {
        const res = await getPermitTypeVersions(permitTypeId)
        const versionList = res?.versions || []
        setVersions(versionList)
        
        // Filter drafts
        const draftList = versionList.filter((v) => v.status === 'draft')
        setDrafts(draftList)
        
        // Select latest published version by default
        const published = versionList.filter((v) => v.status === 'published').sort((a, b) => b.version - a.version)
        if (published.length > 0) {
          setSelectedVersion(published[0]._id)
          setInitialSections(published[0].sections)
          if (published[0].feeGroupId) {
            onFeeGroupChange?.(published[0].feeGroupId)
          }
        } else {
          setSelectedVersion(null)
          setInitialSections([])
        }
      } catch (err) {
        console.error('Failed to load versions:', err)
        message.error('Failed to load form versions')
        setVersions([])
        setDrafts([])
        setSelectedVersion(null)
        setInitialSections([])
      } finally {
        setLoading(false)
      }
    }

    loadVersions()
  }, [permitTypeId, onFeeGroupChange])

  // Load selected version data when selectedVersion changes
  useEffect(() => {
    if (!selectedVersion || isEditingDraft) return
    
    const version = versions.find((v) => v._id === selectedVersion)
    if (version && version.sections) {
      setInitialSections(version.sections)
      if (version.feeGroupId) {
        onFeeGroupChange?.(version.feeGroupId)
      }
    } else {
      setInitialSections(undefined)
    }
  }, [selectedVersion, versions, isEditingDraft, onFeeGroupChange])

  const handleChange = () => {
    onChange?.()
  }

  const handleSave = async () => {
    if (!editorRef.current || !currentDraftId || !permitTypeId) return
    setSaving(true)
    try {
      const sections = editorRef.current.getSections()
      await updatePermitTypeVersion(permitTypeId, currentDraftId, { sections, feeGroupId })
      message.success('Draft saved')
      onChange?.()
    } catch (err) {
      console.error('Failed to save draft:', err)
      message.error('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    modal.confirm({
      title: 'Delete draft',
      content: 'Are you sure you want to delete this draft?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!currentDraftId || !permitTypeId) return
        try {
          await deletePermitTypeVersion(permitTypeId, currentDraftId)
          message.success('Draft deleted')
          setIsEditingDraft(false)
          setCurrentDraftId(null)
          // Reload versions
          const res = await getPermitTypeVersions(permitTypeId)
          const versionList = res?.versions || []
          setVersions(versionList)
          setDrafts(versionList.filter((v) => v.status === 'draft'))
        } catch (err) {
          console.error('Failed to delete draft:', err)
          message.error('Failed to delete draft')
        }
      },
    })
  }

  const handlePublish = () => {
    modal.confirm({
      title: 'Publish version',
      content: 'This form version will be published and become active.',
      okText: 'Publish',
      cancelText: 'Cancel',
      onOk: async () => {
        if (!currentDraftId || !permitTypeId) return
        try {
          await publishPermitTypeVersion(permitTypeId, currentDraftId)
          message.success('Version published')
          setIsEditingDraft(false)
          setCurrentDraftId(null)
          // Reload versions
          const res = await getPermitTypeVersions(permitTypeId)
          const versionList = res?.versions || []
          setVersions(versionList)
          setDrafts(versionList.filter((v) => v.status === 'draft'))
          // Select the newly published version
          const published = versionList.filter((v) => v.status === 'published').sort((a, b) => b.version - a.version)
          if (published.length > 0) {
            setSelectedVersion(published[0]._id)
          }
        } catch (err) {
          console.error('Failed to publish version:', err)
          message.error('Failed to publish version')
        }
      },
    })
  }

  const handleBack = () => {
    setIsEditingDraft(false)
    setCurrentDraftId(null)
  }

  const handleAddVersion = async (source) => {
    if (!permitTypeId) return
    try {
      const copyFromVersionId = source === 'previous' && versions.length > 0 
        ? versions.filter((v) => v.status === 'published').sort((a, b) => b.version - a.version)[0]?._id 
        : undefined
      
      const res = await createPermitTypeVersion(permitTypeId, { copyFromVersionId })
      const newVersion = res?.version
      if (newVersion) {
        setCurrentDraftId(newVersion._id)
        setIsEditingDraft(true)
        setDraftCreatedAt(newVersion.createdAt)
        message.success('New version created')
        // Reload versions
        const versionsRes = await getPermitTypeVersions(permitTypeId)
        const versionList = versionsRes?.versions || []
        setVersions(versionList)
        setDrafts(versionList.filter((v) => v.status === 'draft'))
      }
    } catch (err) {
      console.error('Failed to create version:', err)
      message.error('Failed to create version')
    }
  }

  const handleViewDraft = (draft) => {
    setDraftsModalOpen(false)
    setCurrentDraftId(draft.id)
    setSelectedVersion(draft.id)
    setIsEditingDraft(true)
    setDraftCreatedAt(draft.createdAt)
    
    // Load draft sections
    const draftVersion = versions.find((v) => v._id === draft.id)
    if (draftVersion && draftVersion.sections) {
      setInitialSections(draftVersion.sections)
    } else {
      setInitialSections([])
    }
  }

  const handleDeleteDraft = async (draft) => {
    if (!permitTypeId) return
    try {
      await deletePermitTypeVersion(permitTypeId, draft.id)
      message.success('Draft deleted')
      // Reload versions
      const res = await getPermitTypeVersions(permitTypeId)
      const versionList = res?.versions || []
      setVersions(versionList)
      setDrafts(versionList.filter((v) => v.status === 'draft'))
    } catch (err) {
      console.error('Failed to delete draft:', err)
      message.error('Failed to delete draft')
    }
  }

  const versionOptions = versions
    .filter((v) => v.status !== 'draft')
    .map((v) => ({
      value: v._id,
      label: `v${v.version} (${VERSION_STATUS_LABELS[v.status] || v.status})`,
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Version toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          flexShrink: 0,
        }}
      >
        {isEditingDraft ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space size="middle">
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Back
              </Button>
              <span>Draft created {formatDraftDate(draftCreatedAt)}</span>
            </Space>
            <Space size="middle">
              <Button
                icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />}
                onClick={() => setIsPreviewMode((p) => !p)}
              >
                {isPreviewMode ? 'Editor' : 'Preview'}
              </Button>
              <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={isPreviewMode}>
                Save Draft
              </Button>
              <Button icon={<DeleteOutlined />} danger onClick={handleDelete} disabled={isPreviewMode}>
                Delete Draft
              </Button>
              <Button type="primary" icon={<SendOutlined />} onClick={handlePublish} disabled={isPreviewMode}>
                Submit for Approval
              </Button>
            </Space>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space size="middle">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddVersionModalOpen(true)}>
                Add Version
              </Button>
              <Badge count={drafts.length} size="small">
                <Button icon={<FileTextOutlined />} onClick={() => setDraftsModalOpen(true)} disabled={drafts.length === 0}>
                  Drafts
                </Button>
              </Badge>
            </Space>
            <Space size="middle">
              {versionOptions.length > 0 && (
                <Select
                  value={selectedVersion}
                  onChange={setSelectedVersion}
                  options={versionOptions}
                  style={{ minWidth: 180 }}
                  placeholder="Version"
                />
              )}
            </Space>
          </div>
        )}
      </div>

      {/* Editor content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {isPreviewMode ? (
          <div style={{ padding: 24 }}>
            <p>Preview mode - coming soon</p>
          </div>
        ) : (
          <FormContentEditor
            ref={editorRef}
            onChange={handleChange}
            isMobile={isMobile}
            readOnly={!isEditingDraft}
            initialSections={initialSections}
          />
        )}
      </div>

      {/* Modals */}
      <DraftsModal
        open={draftsModalOpen}
        onClose={() => setDraftsModalOpen(false)}
        drafts={drafts.map((d) => ({
          id: d._id,
          createdAt: formatDraftDate(d.createdAt),
          createdBy: d.createdBy?.firstName || d.createdBy?.email || 'Admin',
          lastEditedAt: formatDraftDate(d.updatedAt),
          lastEditedBy: d.updatedBy?.firstName || d.updatedBy?.email || 'Admin',
        }))}
        onView={handleViewDraft}
        onDelete={handleDeleteDraft}
      />
      <AddVersionModal
        open={addVersionModalOpen}
        onClose={() => setAddVersionModalOpen(false)}
        industryLabel="all industries"
        formTypeLabel="Permit Form"
        hasPreviousVersion={versions.length > 0}
        hasGlobalForm={false}
        onConfirm={handleAddVersion}
      />
    </div>
  )
}
