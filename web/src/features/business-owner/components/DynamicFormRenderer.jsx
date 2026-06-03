import React, { useState } from 'react'
import dayjs from 'dayjs'
import { Form } from '@/shared/components/AppForm'
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
  Modal,
  Space,
  theme,
  message,
} from 'antd'
import {
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import PhilippineAddressFields from '@/shared/components/PhilippineAddressFields'
import AlaminosAddressFields from '@/shared/components/AlaminosAddressFields'
import AiLobRecommendation from './AiLobRecommendation'
import { uploadFile } from '@/features/business-owner/services/businessRegistrationService'
import { resolveIpfsUrl } from '@/lib/ipfsUtils'

const { Text, Title } = Typography

const FILE_ICON_MAP = {
  pdf: <FilePdfOutlined />,
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
}

function getFileIcon(ext) {
  return FILE_ICON_MAP[ext?.toLowerCase()] || <FileOutlined />
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileUrlFromFormValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first && typeof first === 'object') {
      const cid = first.cid || first.ipfsCid || first.response?.cid || first.response?.ipfsCid
      const url = first.url || first.response?.url
      if (url && typeof url === 'string') return url
      if (cid && typeof cid === 'string') return cid
    }
  }
  return ''
}

// Mapping between form field keys and legacy lguDocuments keys
const DOCUMENT_KEY_MAPPING = {
  ownerGovernmentId: ['idPicture', 'ownerGovernmentId', 'ownerGovernmentIdIpfsCid'],
  ctcCedula: ['ctc', 'ctcCedula', 'ctcCedulaIpfsCid'],
  barangayClearance: ['barangayClearance', 'barangayClearanceIpfsCid'],
  dtiSecCdaCertificate: ['dtiSecCda', 'dtiSecCdaCertificate', 'dtiSecCdaCertificateIpfsCid'],
  leaseContractOrTitle: ['leaseOrLandTitle', 'leaseContractOrTitle', 'leaseContractOrTitleIpfsCid'],
  occupancyPermit: ['occupancyPermit', 'occupancyPermitIpfsCid'],
}

function getPersistedDocumentUrl(documents, field, formData = {}) {
  const fieldKey = field?.key || field?.label
  
  // Helper to extract CID from various formats
  const extractCid = (value) => {
    if (!value) return ''
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0]
      const cid = first?.cid || first?.ipfsCid || first?.response?.cid || first?.response?.ipfsCid || first?.url
      if (cid && typeof cid === 'string') return cid
    }
    return ''
  }
  
  // Check documents object (lguDocuments or formData passed as documents)
  if (documents && typeof documents === 'object' && field) {
    // Build candidate keys including legacy mappings
    const baseKeys = [
      field.documentKey,
      field.key,
      field.label,
    ].filter(Boolean)
    
    // Add IpfsCid variants
    const ipfsCidKeys = baseKeys.map(k => `${k}IpfsCid`)
    
    // Add legacy key mappings
    const legacyKeys = []
    for (const baseKey of baseKeys) {
      const mappings = DOCUMENT_KEY_MAPPING[baseKey]
      if (mappings) {
        legacyKeys.push(...mappings)
      }
    }
    
    const candidates = [...baseKeys, ...ipfsCidKeys, ...legacyKeys]

    for (const key of candidates) {
      const value = documents[key]
      const cid = extractCid(value)
      if (cid) return cid
    }
  }
  
  // Also check formData for document values
  if (formData && typeof formData === 'object' && fieldKey) {
    const cid = extractCid(formData[fieldKey])
    if (cid) return cid
  }
  
  return ''
}

function buildValidationRules(field) {
  const rules = []

  if (field.required) {
    // For file fields, use a custom validator
    if (field.type === 'file') {
      rules.push({
        validator: (_, value) => {
          // Check if file is uploaded (value should be an array with at least one file)
          if (!value || !Array.isArray(value) || value.length === 0) {
            return Promise.reject(new Error(`${field.label || 'This document'} is required`))
          }
          // Check if the file has a CID (was actually uploaded to IPFS)
          const hasUploadedFile = value.some(f => f?.cid || f?.ipfsCid || f?.url || f?.status === 'done')
          if (!hasUploadedFile) {
            return Promise.reject(new Error(`${field.label || 'This document'} must be uploaded`))
          }
          return Promise.resolve()
        }
      })
    } else {
      rules.push({ required: true, message: `${field.label || 'This field'} is required` })
    }
  }

  const validation = field.validation || {}

  if (validation.minLength) {
    rules.push({ min: validation.minLength, message: `Minimum ${validation.minLength} characters` })
  }
  if (validation.maxLength) {
    rules.push({ max: validation.maxLength, message: `Maximum ${validation.maxLength} characters` })
  }
  if (validation.pattern) {
    rules.push({ pattern: new RegExp(validation.pattern), message: 'Invalid format' })
  }

  return rules
}

function RepeatableGroupField({ field, form, token, readOnly }) {
  const groupFields = field.groupFields || []
  const minRows = field.minRows || 1
  const maxRows = field.maxRows || 20

  return (
    <Form.List name={field.key || field.label} initialValue={[{}]}>
      {(fields, { add, remove }) => (
        <div
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            overflow: 'hidden',
          }}
        >
          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '8px 12px',
              background: token.colorFillQuaternary,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {groupFields.map((gf, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 12 }}>{gf.label}</Text>
              </div>
            ))}
            <div style={{ width: 32, flexShrink: 0 }} />
          </div>

          {/* Rows */}
          {fields.map(({ key, name, ...restField }) => (
            <div key={key} style={{ display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'flex-start' }}>
              {groupFields.map((gf, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0 }}>
                  <Form.Item
                    {...restField}
                    name={[name, gf.key || gf.label]}
                    rules={gf.required && !readOnly ? [{ required: true, message: 'Required' }] : []}
                    style={{ marginBottom: 0 }}
                  >
                    {gf.type === 'select' || gf.type === 'multiselect' ? (
                      <Select
                        placeholder={gf.placeholder || 'Select...'}
                        style={{ width: '100%' }}
                        size="small"
                        mode={gf.type === 'multiselect' ? 'multiple' : undefined}
                        options={(gf.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
                        disabled={readOnly}
                      />
                    ) : gf.type === 'number' ? (
                      <InputNumber placeholder={gf.placeholder || ''} style={{ width: '100%' }} size="small" disabled={readOnly} />
                    ) : gf.type === 'date' ? (
                      <DatePicker 
                        style={{ width: '100%' }} 
                        size="small" 
                        disabled={readOnly}
                        format="YYYY-MM-DD"
                        getValueFromEvent={(value) => {
                          if (!value) return null
                          return dayjs.isDayjs(value) ? value : dayjs(value)
                        }}
                        normalize={(value) => {
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
                      />
                    ) : (
                      <Input placeholder={gf.placeholder || ''} size="small" disabled={readOnly} readOnly={readOnly} />
                    )}
                  </Form.Item>
                </div>
              ))}
              {!readOnly && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={fields.length <= minRows}
                  onClick={() => remove(name)}
                  style={{ flexShrink: 0 }}
                />
              )}
            </div>
          ))}

          {/* Add row button */}
          {!readOnly && (
            <div style={{ padding: '6px 12px 10px', borderTop: `1px dashed ${token.colorBorderSecondary}` }}>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                disabled={fields.length >= maxRows}
                onClick={() => add()}
                style={{ width: '100%' }}
              >
                Add row
              </Button>
            </div>
          )}
        </div>
      )}
    </Form.List>
  )
}

function DynamicField({ field, form, token, readOnly, businessId, onDocumentCid, onSaveDraft, formDataKey, documents = {}, revisionFieldKeys }) {
  const fieldName = field.key || field.label
  const rules = buildValidationRules(field)
  const [previewModal, setPreviewModal] = useState({ open: false, url: null, label: '', type: 'other', isBlob: false })

  // In revision mode, a field is editable only if it's in the flagged set
  const isRevisionEditable = revisionFieldKeys && revisionFieldKeys.has(fieldName)
  const effectiveReadOnly = readOnly || (revisionFieldKeys && !isRevisionEditable)

  const label = (
    <span>
      {field.label || '(Untitled field)'}
      
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
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules} required={field.required}>
          <Input placeholder={field.placeholder || ''} disabled={effectiveReadOnly} readOnly={effectiveReadOnly} />
        </Form.Item>
      )

    case 'textarea':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules} required={field.required}>
          <Input.TextArea placeholder={field.placeholder || ''} autoSize={{ minRows: 2, maxRows: 6 }} disabled={effectiveReadOnly} readOnly={effectiveReadOnly} />
        </Form.Item>
      )

    case 'number':
      return (
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules} required={field.required}>
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
          required={field.required}
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
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules} required={field.required}>
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
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules} required={field.required}>
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
      let fileList = Array.isArray(fieldValue) ? fieldValue : []
      
      const allFormValues = form.getFieldsValue(true) || {}
      
      // Helper to detect file type from URL and filename
      const detectFileType = (url, fileName) => {
        const lookup = `${url || ''} ${fileName || ''}`.toLowerCase()
        if (lookup.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|heic|heif)/i)) return 'image'
        if (lookup.match(/\.(pdf)/i)) return 'pdf'
        // For IPFS URLs without extensions, check accepted file types from field config
        const acceptedTypes = (field.validation?.acceptedFileTypes || '').toLowerCase()
        if (acceptedTypes.includes('jpg') || acceptedTypes.includes('png') || acceptedTypes.includes('jpeg')) {
          // If field accepts images and URL is IPFS, assume image
          if (url && (url.includes('/ipfs/') || url.includes('Qm') || url.includes('bafy'))) return 'image'
        }
        return 'other'
      }

      // Get the SINGLE best URL for this field - prioritize form value, then documents prop
      let documentUrl = null
      
      // Check if user explicitly cleared this field (empty array means removed)
      const wasExplicitlyCleared = Array.isArray(fieldValue) && fieldValue.length === 0
      
      // Try form value first (could be CID string or file array)
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        documentUrl = resolveIpfsUrl(fieldValue.trim()) || fieldValue.trim()
      } else if (Array.isArray(fieldValue) && fieldValue.length > 0) {
        const first = fieldValue[0]
        const cid = first?.url || first?.cid || first?.ipfsCid || first?.response?.cid
        if (cid) documentUrl = resolveIpfsUrl(cid) || cid
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
          type: detectFileType(documentUrl, field.label || fieldName),
          isBlob: typeof documentUrl === 'string' && documentUrl.startsWith('blob:'),
        })
      }

      return (
       <>
          {effectiveReadOnly ? (
            <>
              <Form.Item label={label}>
                {previewableFiles.length > 0 ? (
                  <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      const file = previewableFiles[0]
                      setPreviewModal({ open: true, url: file.url, label: file.name, type: file.type, isBlob: file.isBlob })
                    }}
                  >
                    {previewableFiles[0].name}
                  </Button>
                ) : (
                  <Text type="secondary">Not uploaded</Text>
                )}
              </Form.Item>
              {/* Preview Modal for read-only mode */}
              <Modal
                title={previewModal.label}
                open={previewModal.open}
                onCancel={() => setPreviewModal({ open: false, url: null, label: '', type: 'other', isBlob: false })}
                width={previewModal.type === 'image' ? 560 : 720}
                footer={[
                  <Button key="close" onClick={() => setPreviewModal({ open: false, url: null, label: '', type: 'other', isBlob: false })}>
                    Close
                  </Button>,
                  <Button
                    key="openTab"
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => previewModal.url && window.open(previewModal.url, '_blank')}
                  >
                    Open in new tab
                  </Button>,
                  ...(previewModal.url && !previewModal.isBlob
                    ? [
                        <Button key="download" icon={<DownloadOutlined />} href={previewModal.url} download>
                          Download
                        </Button>
                      ]
                    : []),
                ]}
              >
                {previewModal.open && previewModal.url && (
                  <div style={{ minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'stretch', overflow: 'auto', flexDirection: 'column', width: '100%' }}>
                    {previewModal.type === 'image' && (
                      <img
                        src={previewModal.url}
                        alt={previewModal.label}
                        style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                      />
                    )}
                    {previewModal.type === 'pdf' && !previewModal.isBlob && (
                      <iframe
                        title={previewModal.label}
                        src={previewModal.url}
                        style={{ width: '100%', height: '70vh', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
                      />
                    )}
                    {previewModal.type === 'pdf' && previewModal.isBlob && (
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <Text style={{ display: 'block', marginBottom: 12 }}>
                          This local PDF cannot be embedded. Use "Open in new tab" to view it.
                        </Text>
                        <Button type="primary" icon={<EyeOutlined />} onClick={() => previewModal.url && window.open(previewModal.url, '_blank')}>
                          Open PDF in new tab
                        </Button>
                      </div>
                    )}
                    {previewModal.type === 'other' && (
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <Text style={{ display: 'block', marginBottom: 12 }}>
                          Use "Open in new tab" to view this document.
                        </Text>
                        <Button type="primary" icon={<EyeOutlined />} onClick={() => previewModal.url && window.open(previewModal.url, '_blank')}>
                          Open in new tab
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Modal>
            </>
          ) : (
            <>
              {previewableFiles.length === 0 && (
                <Form.Item label={label} rules={rules} required={field.required}>
                  <Upload
                    beforeUpload={canUpload ? async (file) => {
                      try {
                        message.loading({ content: `Uploading ${file.name}...`, key: `upload-${fieldName}`, duration: 0 })
                        const res = await uploadFile(businessId, file, field.documentKey || fieldName)
                        const cid = res?.cid || res?.ipfsCid
                        if (cid && onDocumentCid) {
                          onDocumentCid(field.documentKey || fieldName, cid)
                        }
                        form.setFieldValue(fieldName, [{ uid: '-1', name: file.name, status: 'done', cid }])
                        message.success({ content: `${file.name} uploaded`, key: `upload-${fieldName}` })
                        // Auto-save draft after successful upload so document persists on refresh
                        if (typeof onSaveDraft === 'function') {
                          setTimeout(() => onSaveDraft(), 100)
                        }
                      } catch (err) {
                        message.error({ content: err?.message || 'Upload failed', key: `upload-${fieldName}` })
                      }
                      return false
                    } : () => false}
                    maxCount={1}
                    showUploadList={false}
                    accept={field.validation?.acceptedFileTypes?.split(',').map(t => `.${t.trim()}`).join(',')}
                    disabled={!canUpload}
                  >
                    <Button icon={<UploadOutlined />} disabled={!canUpload}>
                      {canUpload ? 'Upload file' : 'Save draft first to upload documents'}
                    </Button>
                  </Upload>
                </Form.Item>
              )}
            </>
          )}

          {previewableFiles.length > 0 && !effectiveReadOnly && (
            <Form.Item label={label} required={field.required} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <Text>{field.label}</Text>
              </div>
              {field.helpText && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 'normal', marginTop: 2 }}>
                    {field.helpText}
                  </Text>
                </div>
              )}
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {previewableFiles.map((file) => (
                  <Button
                    key={file.key}
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewModal({ open: true, url: file.url, label: file.name, type: file.type, isBlob: file.isBlob })}
                  >
                    {file.name}
                    <CloseOutlined
                      onClick={(e) => {
                        e.stopPropagation()
                        form.setFieldValue(fieldName, [])
                        if (onDocumentCid) {
                          onDocumentCid(field.documentKey || fieldName, null)
                        }
                      }}
                      style={{ marginLeft: 8, fontSize: 12, cursor: 'pointer' }}
                    />
                  </Button>
                ))}
              </Space>
            </Form.Item>
          )}

          <Modal
            title={previewModal.label}
            open={previewModal.open}
            onCancel={() => setPreviewModal({ open: false, url: null, label: '', type: 'other', isBlob: false })}
            width={previewModal.type === 'image' ? 560 : 720}
            footer={[
              <Button key="close" onClick={() => setPreviewModal({ open: false, url: null, label: '', type: 'other', isBlob: false })}>
                Close
              </Button>,
              <Button
                key="openTab"
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => previewModal.url && window.open(previewModal.url, '_blank')}
              >
                Open in new tab
              </Button>,
              ...(previewModal.url
                ? [
                    <Button key="download" icon={<DownloadOutlined />} href={previewModal.url} download>
                      Download
                    </Button>
                  ]
                : []),
            ]}
          >
            {previewModal.open && previewModal.url && (
              <div style={{ minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'stretch', overflow: 'auto', flexDirection: 'column', width: '100%' }}>
                {previewModal.type === 'image' && (
                  <img
                    src={previewModal.url}
                    alt={previewModal.label}
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                )}
                {previewModal.type === 'pdf' && !previewModal.isBlob && (
                  <iframe
                    title={previewModal.label}
                    src={previewModal.url}
                    style={{ width: '100%', height: '70vh', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
                  />
                )}
                {previewModal.type === 'pdf' && previewModal.isBlob && (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <Text style={{ display: 'block', marginBottom: 12 }}>
                      This local PDF cannot be embedded in the preview modal because your Content Security Policy blocks `blob:` URLs in frames.
                    </Text>
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => previewModal.url && window.open(previewModal.url, '_blank')}>
                      Open PDF in new tab
                    </Button>
                  </div>
                )}
                {previewModal.type === 'other' && !previewModal.isBlob && (
                  <>
                    <iframe
                      title={previewModal.label}
                      src={previewModal.url}
                      style={{ width: '100%', height: '70vh', minHeight: 320, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }}
                    />
                    <Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                      If the document does not appear above, use "Open in new tab" to view it.
                    </Text>
                  </>
                )}
                {previewModal.type === 'other' && previewModal.isBlob && (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <Text style={{ display: 'block', marginBottom: 12 }}>
                      This local file cannot be embedded in the preview modal because your Content Security Policy blocks `blob:` URLs in frames.
                    </Text>
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => previewModal.url && window.open(previewModal.url, '_blank')}>
                      Open file in new tab
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Modal>
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
              {getFileIcon(field.downloadFileType)}
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
                size="small"
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
        <Form.Item name={fieldName} valuePropName="checked" rules={effectiveReadOnly ? [] : rules} required={field.required}>
          <Checkbox disabled={effectiveReadOnly}>{field.placeholder || field.label}</Checkbox>
        </Form.Item>
      )

    case 'address':
      return (
        <Row gutter={[16, 0]}>
          <PhilippineAddressFields
            form={form}
            required={field.required}
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
            required={field.required}
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
        <Form.Item name={fieldName} label={label} rules={effectiveReadOnly ? [] : rules} required={field.required}>
          <Input
            placeholder={field.placeholder || `Unsupported field type: ${field.type || 'unknown'}`}
            disabled={effectiveReadOnly}
            readOnly={effectiveReadOnly}
          />
        </Form.Item>
      )
  }
}

export function filterSectionsByFormValues(sections, formValues) {
  if (!sections || !formValues || typeof formValues !== 'object') return sections || []
  return sections.filter((section) => {
    const when = section.showWhen
    if (!when || !when.field) return true
    const fieldValue = formValues[when.field]
    if (when.value !== undefined) return fieldValue === when.value
    if (when.values && Array.isArray(when.values)) return when.values.includes(fieldValue)
    return true
  })
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
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          {section.notes}
        </Text>
      )}
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
        <Title level={5} style={{ marginBottom: 16 }}>
          {section.category || `Section ${idx + 1}`}
        </Title>
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
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Title level={5} style={{ margin: 0 }}>
              {section.category || `Section ${sIdx + 1}`}
            </Title>
          }
        >
          {renderSectionContent(section, sIdx, form, token, isMobile, readOnly, businessId, onDocumentCid, onSaveDraft, formDataKey, documents, revisionFieldKeys, renderedFieldKeys)}
        </Card>
      ))}
    </div>
  )
}
