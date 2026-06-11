import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { Form } from '@/shared/components/AppForm'
import { filterSectionsByFormValues } from '../../utils/formUtils.js'
import {
  Input,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Checkbox,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Divider,
  theme,
  message,
} from 'antd'
import {
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import PhilippineAddressFields from '@/shared/components/PhilippineAddressFields'
import AlaminosAddressFields from '@/shared/components/AlaminosAddressFields'
import AiLobRecommendation from './AiLobRecommendation'
import { uploadFile } from '@/features/business-owner/services/businessRegistrationService'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'
import {
  getFileIcon,
  formatFileSize,
  getFileUrlFromFormValue,
  getPersistedDocumentUrl,
  buildValidationRules,
  detectFileType,
} from '../../utils/formUtils.js'
import { DownloadOutlined } from '@ant-design/icons'
import RepeatableGroupField from './RepeatableGroupField.jsx'
import DocumentPreviewModal from './DocumentPreviewModal.jsx'

const { Text, Title } = Typography


function DynamicField({ field, form, token, readOnly, businessId, onDocumentCid, onSaveDraft, formDataKey, documents = {}, revisionFieldKeys }) {
  const fieldName = field.key || field.label
  const rules = buildValidationRules(field)
  const [previewModal, setPreviewModal] = useState({ open: false, url: null, label: '', type: 'other', isBlob: false })
  const [uploading, setUploading] = useState(false)
  const [localFileList, setLocalFileList] = useState([])

  // Sync local file list with form value
  const formValue = form.getFieldValue(fieldName)
  useEffect(() => {
    if (Array.isArray(formValue) && formValue.length > 0) {
      setLocalFileList(formValue)
    } else {
      setLocalFileList([])
    }
  }, [formValue, fieldName])

  // In revision mode, a field is editable only if it's in the flagged set
  const isRevisionEditable = revisionFieldKeys && revisionFieldKeys.has(fieldName)
  const effectiveReadOnly = readOnly || (revisionFieldKeys && !isRevisionEditable)

  const label = (
    <span>
      {field.label || '(Untitled field)'}
      {field.required && <span style={{ color: token.colorError, marginLeft: 4 }}>*</span>}
      
      {field.helpText && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 'normal', marginTop: 2 }}>
          {field.helpText}
        </Text>
      )}
    </span>
  )

  switch (field.type) {
    case 'text':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules}>
          <Input placeholder={field.placeholder || ''} disabled={effectiveReadOnly} readOnly={effectiveReadOnly} />
        </Form.Item>
      )

    case 'textarea':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules}>
          <Input.TextArea placeholder={field.placeholder || ''} disabled={effectiveReadOnly} readOnly={effectiveReadOnly} />
        </Form.Item>
      )

    case 'number':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules}>
          <InputNumber
            placeholder={field.placeholder || ''}
            style={{ width: '100%' }}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
            disabled={effectiveReadOnly}
            readOnly={effectiveReadOnly}
          />
        </Form.Item>
      )

    case 'date':
      return (
        <Form.Item 
          name={fieldName} 
          label={label}
          rules={effectiveReadOnly ? [] : [
            ...rules,
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                if (dayjs.isDayjs(value)) {
                  return Promise.resolve()
                }
                if (typeof value === 'string' || value instanceof Date) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Invalid date format'))
              }
            }
          ]}
          getValueFromEvent={(value) => {
            // Ensure we always return a dayjs object or null
            if (!value) return null
            return dayjs.isDayjs(value) ? value : dayjs(value)
          }}
          normalize={(value) => {
            // Normalize value to dayjs
            if (!value) return null
            if (dayjs.isDayjs(value)) return value
            if (typeof value === 'string') {
              const parsed = dayjs(value)
              return parsed.isValid() ? parsed : null
            }
            if (value instanceof Date) {
              return dayjs(value)
            }
            return null
          }}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            disabled={effectiveReadOnly}
            format="YYYY-MM-DD"
          />
        </Form.Item>
      )

    case 'select':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules}>
          <Select
            placeholder={field.placeholder || 'Select...'}
            style={{ width: '100%' }}
            options={(field.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
            showSearch={!effectiveReadOnly}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled={effectiveReadOnly}
          />
        </Form.Item>
      )

    case 'multiselect':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules}>
          <Select
            mode="multiple"
            placeholder={field.placeholder || 'Select one or more...'}
            style={{ width: '100%' }}
            options={(field.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
            showSearch={!effectiveReadOnly}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            disabled={effectiveReadOnly}
          />
        </Form.Item>
      )

    case 'file': {
      const canUpload = Boolean(businessId && onDocumentCid && !effectiveReadOnly)
      const fieldValue = form.getFieldValue(fieldName)
      
      const allFormValues = form.getFieldsValue(true) || {}
      

      // Get the SINGLE best URL for this field - prioritize form value, then documents prop
      let documentUrl = null

      // Check if user explicitly cleared this field (empty array means removed)
      const wasExplicitlyCleared = Array.isArray(fieldValue) && fieldValue.length === 0

      // Try form value first (could be CID string or file array)
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        documentUrl = resolveIpfsUrl(fieldValue.trim()) || fieldValue.trim()
      } else if (Array.isArray(fieldValue) && fieldValue.length > 0) {
        const first = fieldValue[0]
        // Prioritize cid over url to avoid double-resolving
        const cid = first?.cid || first?.ipfsCid || first?.response?.cid || first?.url
        if (cid) {
          documentUrl = resolveIpfsUrl(cid) || cid
        }
        // Also handle local file blobs
        if (!documentUrl && first?.originFileObj instanceof File) {
          documentUrl = URL.createObjectURL(first.originFileObj)
        }
      }

      // Fallback to documents prop - but NOT if user explicitly cleared the field
      if (!documentUrl && !wasExplicitlyCleared) {
        const persistedUrl = getFileUrlFromFormValue(fieldValue) || getPersistedDocumentUrl(documents, field, allFormValues)
        if (persistedUrl) {
          documentUrl = resolveIpfsUrl(persistedUrl) || persistedUrl
        }
      }

      // Build single previewable file entry (no duplicates)
      const previewableFiles = []
      if (documentUrl) {
        previewableFiles.push({
          key: field.documentKey || fieldName,
          name: field.label || fieldName,
          url: documentUrl,
          type: detectFileType(documentUrl, field.label || fieldName, field.validation?.acceptedFileTypes),
          isBlob: typeof documentUrl === 'string' && documentUrl.startsWith('blob:'),
        })
      }

      return (
       <>
          {effectiveReadOnly ? (
            <>
              <Form.Item label={label}>
                {previewableFiles.length > 0 ? (
                  <Upload
                    listType="picture-card"
                    fileList={previewableFiles.map(f => ({
                      uid: f.key,
                      name: f.name,
                      url: f.url,
                      status: 'done'
                    }))}
                    onPreview={(_file) => {
                      const file = previewableFiles[0]
                      setPreviewModal({ open: true, url: file.url, label: file.name, type: file.type, isBlob: file.isBlob })
                    }}
                    showUploadList={{ showRemoveIcon: false }}
                  />
                ) : (
                  <Text type="secondary">Not uploaded</Text>
                )}
              </Form.Item>
              <DocumentPreviewModal
                open={previewModal.open}
                onClose={() => setPreviewModal({ open: false, url: null, label: '', type: 'other', isBlob: false })}
                url={previewModal.url}
                label={previewModal.label}
                type={previewModal.type}
                isBlob={previewModal.isBlob}
              />
            </>
          ) : (
            <>
              <Form.Item label={label} rules={rules}>
                <Upload
                  listType="picture-card"
                  beforeUpload={canUpload ? async (file) => {
                    setUploading(true)
                    try {
                      message.loading({ content: `Uploading ${file.name}...`, key: `upload-${fieldName}`, duration: 0 })
                      const res = await uploadFile(businessId, file, field.documentKey || fieldName)
                      const cid = res?.cid || res?.ipfsCid
                      if (cid && onDocumentCid) {
                        onDocumentCid(field.documentKey || fieldName, cid)
                      }
                      const uploadedFile = { uid: file.uid, name: file.name, status: 'done', cid, url: resolveIpfsUrl(cid) || cid }
                      form.setFieldValue(fieldName, [uploadedFile])
                      setLocalFileList([uploadedFile])
                      message.success({ content: `${file.name} uploaded`, key: `upload-${fieldName}` })
                      // Auto-save draft after successful upload so document persists on refresh
                      if (typeof onSaveDraft === 'function') {
                        setTimeout(() => onSaveDraft(), 100)
                      }
                    } catch (err) {
                      message.error({ content: err?.message || 'Upload failed', key: `upload-${fieldName}` })
                      form.setFieldValue(fieldName, [])
                      setLocalFileList([])
                    } finally {
                      setUploading(false)
                    }
                    return false
                  } : () => false}
                  maxCount={1}
                  fileList={localFileList}
                  onChange={({ fileList: newFileList }) => {
                    setLocalFileList(newFileList)
                    if (newFileList.length === 0) {
                      form.setFieldValue(fieldName, [])
                      if (onDocumentCid) {
                        onDocumentCid(field.documentKey || fieldName, null)
                      }
                    }
                  }}
                  onRemove={(_file) => {
                    form.setFieldValue(fieldName, [])
                    setLocalFileList([])
                    if (onDocumentCid) {
                      onDocumentCid(field.documentKey || fieldName, null)
                    }
                    // Force form validation update to trigger section completion recalculation
                    form.validateFields([fieldName]).catch(() => {})
                    // Auto-save draft after file removal so deletion persists on refresh
                    if (typeof onSaveDraft === 'function') {
                      setTimeout(() => onSaveDraft(), 100)
                    }
                    return false
                  }}
                  onPreview={(_file) => {
                    const previewFile = localFileList[0]
                    const fileType = detectFileType(previewFile.url, previewFile.name, field.validation?.acceptedFileTypes)
                    setPreviewModal({
                      open: true,
                      url: previewFile.url,
                      label: previewFile.name,
                      type: fileType,
                      isBlob: typeof previewFile.url === 'string' && previewFile.url.startsWith('blob:')
                    })
                  }}
                  accept={field.validation?.acceptedFileTypes?.split(',').map(t => `.${t.trim()}`).join(',')}
                  disabled={!canUpload || uploading || (localFileList.length > 0 && effectiveReadOnly)}
                >
                  {localFileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </>
          )}

          <DocumentPreviewModal
            open={previewModal.open}
            onClose={() => setPreviewModal({ open: false, url: null, label: '', type: 'other', isBlob: false })}
            url={previewModal.url}
            label={previewModal.label}
            type={previewModal.type}
            isBlob={previewModal.isBlob}
          />
        </>
      )
    }

    case 'download':
      return (
        <Form.Item label={label}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: token.colorFillQuaternary,
              borderRadius: token.borderRadius,
              border: `1px dashed ${token.colorBorder}`,
            }}
          >
            <span style={{ fontSize: 24, color: token.colorPrimary }}>
              {React.createElement(getFileIcon(field.downloadFileType))}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, display: 'block' }}>{field.downloadFileName || 'Template file'}</Text>
              {field.downloadFileSize > 0 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {field.downloadFileType?.toUpperCase()} · {formatFileSize(field.downloadFileSize)}
                </Text>
              )}
            </div>
            {field.downloadFileUrl && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href={field.downloadFileUrl}
                target="_blank"
              >
                Download
              </Button>
            )}
          </div>
        </Form.Item>
      )

    case 'checkbox':
      return (
        <Form.Item name={fieldName} valuePropName="checked" rules={effectiveReadOnly ? [] : rules}>
          <Checkbox disabled={effectiveReadOnly}>{field.placeholder || field.label}</Checkbox>
        </Form.Item>
      )

    case 'address':
      return (
        <Row gutter={[16, 0]}>
          <PhilippineAddressFields
            form={form}
              namePrefix={field.key || field.label}
            disabled={effectiveReadOnly}
          />
        </Row>
      )

    case 'address_alaminos':
      return (
        <Row gutter={[16, 0]}>
          <AlaminosAddressFields
            form={form}
              namePrefix={field.key || field.label}
            disabled={effectiveReadOnly}
          />
        </Row>
      )

    case 'repeatable_group':
      return (
        <Form.Item label={label}>
          <RepeatableGroupField field={field} form={form} token={token} readOnly={effectiveReadOnly} />
        </Form.Item>
      )

    case 'ai_lob_recommendation':
      return (
        <Form.Item label={label}>
          <AiLobRecommendation field={field} form={form} readOnly={effectiveReadOnly} formDataKey={formDataKey} />
        </Form.Item>
      )

    default:
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules}>
          <Input
            placeholder={field.placeholder || `Unsupported field type: ${field.type || 'unknown'}`}
            disabled={effectiveReadOnly}
            readOnly={effectiveReadOnly}
          />
        </Form.Item>
      )
  }
}

function renderSectionContent(section, sIdx, form, token, isMobile, readOnly, businessId, onDocumentCid, onSaveDraft, formDataKey, documents, revisionFieldKeys, renderedFieldKeys) {
  // Deduplicate items by key to prevent duplicate rendering
  const seenKeys = new Set()
  const uniqueItems = (section.items || []).filter((item) => {
    const fieldKey = item.key || item.label
    if (!fieldKey) return true
    // Skip if already rendered in this render cycle
    if (renderedFieldKeys && renderedFieldKeys.has(fieldKey)) return false
    if (seenKeys.has(fieldKey)) return false
    seenKeys.add(fieldKey)
    if (renderedFieldKeys) renderedFieldKeys.add(fieldKey)
    return true
  })

  return (
    <React.Fragment key={sIdx}>
      {section.source && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Source: {section.source}
        </Text>
      )}
      {section.notes && (
        <Text style={{  display: 'block', marginBottom: 12 }}>
          {section.notes}
        </Text>
      )}
      
      <Divider style={{ margin: '0 0 16px 0' }} />
      <Row gutter={[16, 0]}>
        {uniqueItems.map((item, fIdx) => {
          const colSpan = isMobile ? 24 : Math.min(Math.max(Number(item.span || 24), 1), 24)
          const fieldKey = item.key || item.label || `field-${fIdx}`

          if (item.type === 'address' || item.type === 'address_alaminos') {
            return (
              <Col key={`${sIdx}-${fieldKey}`} span={24}>
                <DynamicField field={item} form={form} token={token} readOnly={readOnly} businessId={businessId} onDocumentCid={onDocumentCid} onSaveDraft={onSaveDraft} formDataKey={formDataKey} documents={documents} revisionFieldKeys={revisionFieldKeys} />
              </Col>
            )
          }
          return (
            <Col key={`${sIdx}-${fieldKey}`} xs={24} sm={24} md={colSpan}>
              <DynamicField field={item} form={form} token={token} readOnly={readOnly} businessId={businessId} onDocumentCid={onDocumentCid} onSaveDraft={onSaveDraft} formDataKey={formDataKey} documents={documents} revisionFieldKeys={revisionFieldKeys} />
            </Col>
          )
        })}
      </Row>
    </React.Fragment>
  )
}

export default function DynamicFormRenderer({
  definition,
  form,
  formValues = {},
  isMobile = false,
  activeSectionIndex,
  readOnly = false,
  businessId = null,
  onDocumentCid = null,
  onSaveDraft = null,
  formDataKey = null,
  documents = {},
  revisionFieldKeys,
}) {
  const { token } = theme.useToken()

  if (!definition) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Text type="secondary">No form definition loaded.</Text>
      </div>
    )
  }

  const sections = definition.sections || []
  const visibleSections = filterSectionsByFormValues(sections, formValues)

  if (!visibleSections.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Text type="secondary">
          {formValues && sections?.length > 0
            ? 'No sections match the current form values.'
            : 'No form content available.'}
        </Text>
      </div>
    )
  }

  // Step mode: render all sections so all Form.Items stay mounted (for full validation on submit),
  // but only display the active section
  if (typeof activeSectionIndex === 'number' && activeSectionIndex >= 0) {
    const idx = Math.min(activeSectionIndex, visibleSections.length - 1)
    const section = visibleSections[idx]
    const renderedFieldKeys = new Set()
    return (
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>
          {section.category || `Section ${idx + 1}`}
        </Title>
        {section.description && (
          <div style={{ fontSize: 12, marginBottom: 16, color: 'rgba(0, 0, 0, 0.88)' }}>
            {section.description}
          </div>
        )}
        {visibleSections.map((sec, sIdx) => (
          <div
            key={sIdx}
            data-section-index={sIdx}
            style={{ display: sIdx === idx ? 'block' : 'none' }}
            aria-hidden={sIdx !== idx}
          >
            {renderSectionContent(sec, sIdx, form, token, isMobile, readOnly, businessId, onDocumentCid, onSaveDraft, formDataKey, documents, revisionFieldKeys, renderedFieldKeys)}
          </div>
        ))}
      </div>
    )
  }

  // Default: all sections as cards
  const renderedFieldKeys = new Set()
  return (
    <div>
      {visibleSections.map((section, sIdx) => (
        <Card
          key={sIdx}
          style={{ marginBottom: 16 }}
          title={
            <Title level={5} style={{ margin: 0 }}>
              {section.category || `Section ${sIdx + 1}`}
            </Title>
          }
        >
          {section.description && (
            <div style={{  marginBottom: 16, }}>
              {section.description}
            </div>
          )}
          {renderSectionContent(section, sIdx, form, token, isMobile, readOnly, businessId, onDocumentCid, onSaveDraft, formDataKey, documents, revisionFieldKeys, renderedFieldKeys)}
        </Card>
      ))}
    </div>
  )
}
