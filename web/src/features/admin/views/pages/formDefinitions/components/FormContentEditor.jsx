import React, { useState, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react'
import {
  Button,
  Input,
  Select,
  Switch,
  Collapse,
  Typography,
  Space,
  Divider,
  Tag,
  Upload,
  theme,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  SettingOutlined,
  UploadOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
} from '@ant-design/icons'

import { FIELD_TYPES, DROPDOWN_SOURCES, VALIDATION_RULES, FIELD_TYPE_DEFAULTS, FIELD_SPAN_OPTIONS } from '../constants'
import { ISSUING_AGENCY_GROUPS } from '@/constants'
import { uploadFormTemplate } from '@/features/admin/services/formDefinitionService'

const { Text } = Typography

/** Build a new field with type-specific defaults */
function createFieldWithDefaults(type = 'text', overrides = {}) {
  const defaults = FIELD_TYPE_DEFAULTS[type] || FIELD_TYPE_DEFAULTS.text
  return {
    id: createId(),
    label: '',
    type,
    key: '',
    required: false,
    helpText: '',
    placeholder: defaults.placeholder ?? '',
    validation: { ...defaults.validation },
    dropdownSource: defaults.dropdownSource ?? 'static',
    dropdownOptions: [...(defaults.dropdownOptions || [])],
    span: 24,
    ...overrides,
  }
}

/** Apply type-specific defaults when field type changes (preserves id, label, required, helpText, span) */
function applyFieldTypeDefaults(field, newType) {
  const defaults = FIELD_TYPE_DEFAULTS[newType] || FIELD_TYPE_DEFAULTS.text
  // Strip download-specific fields when switching away from download
  const { downloadFileName, downloadFileSize, downloadFileType, downloadFileUrl, ...rest } = field
  const base = newType === 'download' ? field : rest
  return {
    ...base,
    type: newType,
    placeholder: defaults.placeholder ?? '',
    validation: { ...defaults.validation },
    dropdownSource: defaults.dropdownSource ?? 'static',
    dropdownOptions: [...(defaults.dropdownOptions || [])],
  }
}

// ─── Static mock data (seed) ───────────────────────────────────────
function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function getInitialSections() {
  return [
    {
      id: createId(),
      category: 'Local Government Unit (LGU)',
      source: 'OSBC',
      notes: '',
      items: [
        { id: createId(), label: 'Duly accomplished application form', type: 'download', required: true, helpText: 'Download this form, fill it out, then upload the completed version', placeholder: '', validation: { acceptedFileTypes: 'pdf,jpg,png', maxFileSize: 10 }, dropdownSource: 'static', dropdownOptions: [], downloadFileName: 'application-form.pdf', downloadFileSize: 245760, downloadFileType: 'pdf', downloadFileUrl: '/forms/application-form.pdf' },
        { id: createId(), label: 'Two 2×2 ID photos', type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Valid IDs of the business owner', type: 'file', required: true, helpText: 'Upload a clear scan or photo of a valid government-issued ID', placeholder: '', validation: { acceptedFileTypes: 'pdf,jpg,png' }, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Barangay business clearance', type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Occupancy permit', type: 'file', required: false, helpText: 'Required for establishments with physical premises', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Fire Safety Inspection Certificate', type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Community Tax Certificate (CTC)', type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
      ],
    },
    {
      id: createId(),
      category: 'Bureau of Internal Revenue (BIR)',
      source: 'BIR',
      notes: '',
      items: [
        { id: createId(), label: "Mayor's permit or proof of ongoing LGU application", type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'DTI / SEC / CDA registration', type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Barangay clearance', type: 'file', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
      ],
    },
    {
      id: createId(),
      category: 'Business Information',
      source: '',
      notes: 'Basic business details collected during registration',
      items: [
        { id: createId(), label: 'Business name', type: 'text', required: true, helpText: 'As registered with DTI/SEC/CDA', placeholder: 'Enter registered business name', validation: { minLength: 2, maxLength: 200 }, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Business type', type: 'select', required: true, helpText: 'Select the PSIC industry classification', placeholder: 'Select industry', validation: {}, dropdownSource: 'industries', dropdownOptions: [] },
        { id: createId(), label: 'Business address', type: 'address', required: true, helpText: 'Philippine address using PSGC', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [] },
        { id: createId(), label: 'Date of establishment', type: 'date', required: true, helpText: '', placeholder: '', validation: {}, dropdownSource: 'static', dropdownOptions: [], span: 12 },
        { id: createId(), label: 'Number of employees', type: 'number', required: true, helpText: '', placeholder: 'e.g. 5', validation: { minValue: 1 }, dropdownSource: 'static', dropdownOptions: [], span: 12 },
        { id: createId(), label: 'Brief description of business activities', type: 'textarea', required: false, helpText: 'Describe the main products or services offered', placeholder: 'Describe your business...', validation: { maxLength: 1000 }, dropdownSource: 'static', dropdownOptions: [] },
      ],
    },
  ]
}

// ─── Slugify label to storage key (camelCase) ────────────────────────
function slugifyLabelToKey(label) {
  if (!label || typeof label !== 'string') return ''
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('') || ''
}

// ─── File helpers ──────────────────────────────────────────────────
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
function getExtFromName(fileName) {
  const parts = (fileName || '').split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}
function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Field row (collapsed) ─────────────────────────────────────────
function FieldRow({ field, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, token, isMobile, definitionId, readOnly }) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isDropdown = field.type === 'select' || field.type === 'multiselect'
  const isDownload = field.type === 'download'
  const activeValidations = Object.entries(field.validation || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)

  const handleTemplateUpload = async (info) => {
    const file = info.file
    const ext = getExtFromName(file.name)
    const label = field.label || file.name.replace(/\.[^/.]+$/, '')

    // Try real IPFS upload if we have a definition ID
    if (definitionId) {
      setUploading(true)
      try {
        const res = await uploadFormTemplate(definitionId, file, label)
        if (res?.success && res.download) {
          onUpdate({
            ...field,
            label,
            downloadFileName: res.download.label || file.name,
            downloadFileSize: res.download.fileSize || file.size,
            downloadFileType: res.download.fileType || ext || 'pdf',
            downloadFileUrl: res.download.fileUrl || '',
          })
          setUploading(false)
          return
        }
      } catch (err) {
        console.warn('IPFS upload failed, falling back to local preview', err)
      }
      setUploading(false)
    }

    // Fallback: local preview URL
    onUpdate({
      ...field,
      label,
      downloadFileName: file.name,
      downloadFileSize: file.size,
      downloadFileType: ext || 'pdf',
      downloadFileUrl: URL.createObjectURL(file),
    })
  }

  return (
    <div
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        marginBottom: 8,
        background: token.colorBgContainer,
      }}
    >
      {/* Compact row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
        }}
      >
        {/* Download icon indicator */}
        {isDownload && (
          <DownloadOutlined style={{ color: token.colorPrimary, fontSize: 14, flexShrink: 0 }} />
        )}
        {readOnly ? (
          <Text style={{ flex: 1, minWidth: isMobile ? '100%' : 120, fontSize: 13 }}>
            {field.label || '(untitled field)'}
          </Text>
        ) : (
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder={isDownload ? 'Form name (e.g. Duly accomplished application form)' : 'Field label'}
            style={{ flex: 1, minWidth: isMobile ? '100%' : 120 }}
            size="small"
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          {readOnly ? (
            <Tag style={{ fontSize: 11, margin: 0 }}>
              {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
            </Tag>
          ) : (
            <Select
              value={field.type}
              onChange={(val) => onUpdate(applyFieldTypeDefaults(field, val))}
              options={FIELD_TYPES}
              style={{ width: isMobile ? 130 : 160 }}
              size="small"
              popupMatchSelectWidth={false}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {field.required && <Tag color="red" style={{ fontSize: 11, margin: 0 }}>Required</Tag>}
            {!field.required && !readOnly && (
              <>
                <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Req</Text>
                <Switch
                  size="small"
                  checked={field.required}
                  onChange={(checked) => onUpdate({ ...field, required: checked })}
                />
              </>
            )}
          </div>
          {!readOnly && (
            <>
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => setExpanded(!expanded)}
                style={{ color: expanded ? token.colorPrimary : undefined }}
              />
              <Button type="text" size="small" icon={<UpOutlined />} disabled={isFirst} onClick={onMoveUp} />
              <Button type="text" size="small" icon={<DownOutlined />} disabled={isLast} onClick={onMoveDown} />
              <Popconfirm title="Delete this field?" onConfirm={onDelete} okText="Delete" okButtonProps={{ danger: true }}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </div>
      </div>

      {/* Expanded options (edit mode only) */}
      {expanded && !readOnly && (
        <div
          style={{
            padding: '8px 12px 12px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Download type: template file upload */}
          {isDownload && (
            <>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Template file (applicants will download this)
                </Text>
                {field.downloadFileName ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius,
                    }}
                  >
                    <span style={{ fontSize: 22, color: token.colorPrimary }}>
                      {getFileIcon(field.downloadFileType)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 13, display: 'block' }} ellipsis>{field.downloadFileName}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {field.downloadFileType?.toUpperCase()}{field.downloadFileSize ? ` · ${formatFileSize(field.downloadFileSize)}` : ''}
                      </Text>
                    </div>
                    <Upload
                      beforeUpload={() => false}
                      showUploadList={false}
                      onChange={handleTemplateUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      maxCount={1}
                    >
                      <Button size="small" type="link">Replace</Button>
                    </Upload>
                  </div>
                ) : (
                  <Upload.Dragger
                    beforeUpload={() => false}
                    showUploadList={false}
                    onChange={handleTemplateUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    maxCount={1}
                    style={{ padding: '12px 0' }}
                  >
                    <p style={{ marginBottom: 4 }}>
                      <UploadOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />
                    </p>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Click or drag a file here to upload the template
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      PDF, DOC, DOCX, XLS, XLSX
                    </Text>
                  </Upload.Dragger>
                )}
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Help text (shown to user)</Text>
                <Input
                  value={field.helpText}
                  onChange={(e) => onUpdate({ ...field, helpText: e.target.value })}
                  placeholder="e.g. Download this form, fill it out, then upload the completed version"
                  size="small"
                />
              </div>
            </>
          )}

          {/* Non-download types: standard settings */}
          {!isDownload && (
            <>
              {/* Field key (for file type: storage key used in business owner uploads) */}
              {field.type === 'file' && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Field key (storage key for uploads)
                  </Text>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      value={field.key ?? ''}
                      onChange={(e) => onUpdate({ ...field, key: e.target.value.trim() })}
                      placeholder={slugifyLabelToKey(field.label) || 'e.g. idPicture'}
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <Button
                      size="small"
                      onClick={() => onUpdate({ ...field, key: slugifyLabelToKey(field.label) })}
                    >
                      Suggest from label
                    </Button>
                  </Space.Compact>
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                    Leave empty to auto-generate from label when used in business owner forms.
                  </Text>
                </div>
              )}

              {/* Row 0: Width / span */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Width (layout)</Text>
                <Select
                  value={field.span ?? 24}
                  onChange={(val) => onUpdate({ ...field, span: val })}
                  options={FIELD_SPAN_OPTIONS}
                  style={{ width: 160 }}
                  size="small"
                />
              </div>

              {/* Row 1: Placeholder + Help text */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Placeholder</Text>
                  <Input
                    value={field.placeholder}
                    onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
                    placeholder="Text shown inside the input"
                    size="small"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Help text (shown to user)</Text>
                  <Input
                    value={field.helpText}
                    onChange={(e) => onUpdate({ ...field, helpText: e.target.value })}
                    placeholder="Description shown below the field"
                    size="small"
                  />
                </div>
              </div>

              {/* Row 2: Dropdown source (if applicable) */}
              {isDropdown && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Dropdown data source</Text>
                  <Select
                    value={field.dropdownSource || 'static'}
                    onChange={(val) => onUpdate({ ...field, dropdownSource: val })}
                    options={DROPDOWN_SOURCES}
                    style={{ width: '100%' }}
                    size="small"
                  />
                  {field.dropdownSource === 'static' && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Options (comma-separated)
                      </Text>
                      <Input
                        value={(field.dropdownOptions || []).join(', ')}
                        onChange={(e) => {
                          const opts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          onUpdate({ ...field, dropdownOptions: opts })
                        }}
                        placeholder="e.g. Option A, Option B, Option C"
                        size="small"
                      />
                    </div>
                  )}
                  {field.dropdownSource && field.dropdownSource !== 'static' && (
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                      Options will be loaded automatically from the selected source.
                    </Text>
                  )}
                </div>
              )}

              {/* Row 3: Validation rules */}
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Validation rules</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {VALIDATION_RULES.map((rule) => {
                    const currentVal = field.validation?.[rule.value]
                    const isActive = currentVal !== undefined && currentVal !== '' && currentVal !== null
                    return (
                      <div key={rule.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag
                          color={isActive ? 'blue' : undefined}
                          style={{ cursor: 'default', fontSize: 12, margin: 0 }}
                        >
                          {rule.label}
                        </Tag>
                        <Input
                          value={currentVal ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            const newValidation = { ...field.validation }
                            if (v === '') {
                              delete newValidation[rule.value]
                            } else {
                              newValidation[rule.value] = rule.inputType === 'number' ? Number(v) || v : v
                            }
                            onUpdate({ ...field, validation: newValidation })
                          }}
                          placeholder={rule.inputType === 'number' ? '0' : 'value'}
                          size="small"
                          style={{ width: 80 }}
                          type={rule.inputType}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Active validations summary */}
              {activeValidations.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {activeValidations.map(([key, val]) => (
                    <Tag key={key} color="blue" style={{ fontSize: 11 }}>
                      {VALIDATION_RULES.find((r) => r.value === key)?.label || key}: {String(val)}
                    </Tag>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section panel ─────────────────────────────────────────────────
function SectionPanel({ section, sectionIndex, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, onChange, token, isMobile, definitionId, readOnly }) {
  const updateItem = (idx, updatedItem) => {
    const newItems = [...section.items]
    newItems[idx] = updatedItem
    onUpdate({ ...section, items: newItems })
  }
  const deleteItem = (idx) => {
    const newItems = section.items.filter((_, i) => i !== idx)
    onUpdate({ ...section, items: newItems })
  }
  const moveItem = (idx, dir) => {
    const newItems = [...section.items]
    const target = idx + dir
    if (target < 0 || target >= newItems.length) return
    ;[newItems[idx], newItems[target]] = [newItems[target], newItems[idx]]
    onUpdate({ ...section, items: newItems })
  }
  const addItem = () => {
    const newItem = createFieldWithDefaults('text')
    onUpdate({ ...section, items: [...section.items, newItem] })
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <Text strong style={{ fontSize: 14 }}>Section {sectionIndex + 1}</Text>
      <Tag style={{ marginLeft: 'auto', fontSize: 11 }}>{section.items.length} field{section.items.length !== 1 ? 's' : ''}</Tag>
    </div>
  )

  const extra = readOnly ? null : (
    <Space size={4} onClick={(e) => e.stopPropagation()}>
      <Button type="text" size="small" icon={<UpOutlined />} disabled={isFirst} onClick={onMoveUp} />
      <Button type="text" size="small" icon={<DownOutlined />} disabled={isLast} onClick={onMoveDown} />
      <Popconfirm title="Delete this section and all its fields?" onConfirm={onDelete} okText="Delete" okButtonProps={{ danger: true }}>
        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </Space>
  )

  return (
    <Collapse
      defaultActiveKey={['content']}
      style={{ marginBottom: 12 }}
      items={[
        {
          key: 'content',
          label: header,
          extra,
          children: (
            <div>
              {/* Section metadata */}
              {readOnly ? (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: section.notes ? 8 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Section name: </Text>
                      <Text style={{ fontSize: 13 }}>{section.category || '(unnamed)'}</Text>
                    </div>
                    {section.source && (
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Source: </Text>
                        <Text style={{ fontSize: 13 }}>{section.source}</Text>
                      </div>
                    )}
                  </div>
                  {section.notes && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Notes: {section.notes}</Text>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Section name</Text>
                      <Input
                        value={section.category}
                        onChange={(e) => onUpdate({ ...section, category: e.target.value })}
                        placeholder="e.g. Local Government Unit (LGU)"
                        size="small"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Source / issuing agency</Text>
                      <Select
                        value={section.source || undefined}
                        onChange={(val) => onUpdate({ ...section, source: val || '' })}
                        placeholder="Select issuing agency"
                        allowClear
                        size="small"
                        style={{ width: '100%' }}
                        options={ISSUING_AGENCY_GROUPS}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Section notes</Text>
                    <Input.TextArea
                      value={section.notes}
                      onChange={(e) => onUpdate({ ...section, notes: e.target.value })}
                      placeholder="Internal notes about this section..."
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      size="small"
                    />
                  </div>
                </>
              )}

              <Divider style={{ margin: '8px 0 12px' }} />

              {/* Fields */}
              {section.items.length === 0 && (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>
                  {readOnly ? 'No fields in this section.' : 'No fields yet. Add a field below.'}
                </Text>
              )}
              {section.items.map((item, idx) => (
                <FieldRow
                  key={item.id}
                  field={item}
                  onUpdate={(updated) => { updateItem(idx, updated); onChange?.() }}
                  onDelete={() => { deleteItem(idx); onChange?.() }}
                  onMoveUp={() => { moveItem(idx, -1); onChange?.() }}
                  onMoveDown={() => { moveItem(idx, 1); onChange?.() }}
                  isFirst={idx === 0}
                  isLast={idx === section.items.length - 1}
                  token={token}
                  isMobile={isMobile}
                  definitionId={definitionId}
                  readOnly={readOnly}
                />
              ))}

              {!readOnly && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => { addItem(); onChange?.() }}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  Add field
                </Button>
              )}
            </div>
          ),
        },
      ]}
    />
  )
}

// ─── Helpers: convert API sections ↔ editor sections ───────────────
/** Ensure each section/item has a local id for React keys */
function hydrateFromApi(apiSections) {
  if (!apiSections || !Array.isArray(apiSections) || apiSections.length === 0) {
    return []
  }
  return apiSections.map((s) => ({
    id: createId(),
    category: s.category || '',
    source: s.source || '',
    notes: s.notes || '',
    items: (s.items || []).map((item) => ({
      id: createId(),
      label: item.label || '',
      type: item.type || 'file',
      key: item.key || '',
      required: item.required ?? true,
      helpText: item.helpText || item.notes || '',
      placeholder: item.placeholder || '',
      validation: item.validation || {},
      dropdownSource: item.dropdownSource || 'static',
      dropdownOptions: item.dropdownOptions || [],
      span: item.span ?? 24,
      ...(item.type === 'download' ? {
        downloadFileName: item.downloadFileName || '',
        downloadFileSize: item.downloadFileSize || 0,
        downloadFileType: item.downloadFileType || '',
        downloadFileUrl: item.downloadFileUrl || '',
      } : {}),
    })),
  }))
}

/** Strip local ids and produce clean API-ready sections */
function dehydrateForApi(editorSections) {
  return editorSections.map((s) => ({
    category: s.category,
    source: s.source,
    notes: s.notes,
    items: s.items.map((item) => {
      const base = {
        label: item.label,
        type: item.type || 'file',
        key: item.key || '',
        required: item.required,
        notes: item.helpText || '',
        helpText: item.helpText || '',
        placeholder: item.placeholder || '',
        validation: item.validation || {},
        dropdownSource: item.dropdownSource || 'static',
        dropdownOptions: item.dropdownOptions || [],
        span: item.span ?? 24,
      }
      if (item.type === 'download') {
        base.downloadFileName = item.downloadFileName || ''
        base.downloadFileSize = item.downloadFileSize || 0
        base.downloadFileType = item.downloadFileType || ''
        base.downloadFileUrl = item.downloadFileUrl || ''
      }
      return base
    }),
  }))
}

// ─── Main editor ───────────────────────────────────────────────────
/**
 * Props:
 *   initialSections – array from API (or undefined for mock data)
 *   onChange        – called when content is modified (dirty tracking)
 *   isMobile        – responsive flag
 *
 * Ref handle:
 *   getSections()  – returns clean API-ready sections array
 *   getPendingFiles() – returns { sectionIdx, itemIdx, file } for download fields needing upload
 */
const FormContentEditor = forwardRef(function FormContentEditor({ initialSections, onChange, isMobile = false, definitionId, readOnly = false }, ref) {
  const { token } = theme.useToken()

  const [sections, setSections] = useState(() => {
    if (initialSections && initialSections.length > 0) {
      return hydrateFromApi(initialSections)
    }
    return getInitialSections()
  })

  // Re-hydrate when initialSections prop changes (e.g. loading a different definition)
  useEffect(() => {
    if (initialSections !== undefined) {
      setSections(initialSections.length > 0 ? hydrateFromApi(initialSections) : [])
    }
  }, [initialSections])

  // Expose data extraction to parent via ref
  useImperativeHandle(ref, () => ({
    getSections: () => dehydrateForApi(sections),
    getRawSections: () => sections,
  }), [sections])

  const updateSections = useCallback((newSections) => {
    setSections(newSections)
    onChange?.()
  }, [onChange])

  const updateSection = useCallback((idx, updated) => {
    setSections((prev) => {
      const next = [...prev]
      next[idx] = updated
      return next
    })
    onChange?.()
  }, [onChange])

  const deleteSection = useCallback((idx) => {
    setSections((prev) => prev.filter((_, i) => i !== idx))
    onChange?.()
  }, [onChange])

  const moveSection = useCallback((idx, dir) => {
    setSections((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    onChange?.()
  }, [onChange])

  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      {
        id: createId(),
        category: '',
        source: '',
        notes: '',
        items: [],
      },
    ])
    onChange?.()
  }, [onChange])

  return (
    <div>
      {sections.map((section, idx) => (
        <SectionPanel
          key={section.id}
          section={section}
          sectionIndex={idx}
          onUpdate={(updated) => updateSection(idx, updated)}
          onDelete={() => deleteSection(idx)}
          onMoveUp={() => moveSection(idx, -1)}
          onMoveDown={() => moveSection(idx, 1)}
          isFirst={idx === 0}
          isLast={idx === sections.length - 1}
          onChange={onChange}
          token={token}
          isMobile={isMobile}
          definitionId={definitionId}
          readOnly={readOnly}
        />
      ))}
      {!readOnly && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addSection}
          style={{ width: '100%' }}
        >
          Add section
        </Button>
      )}
    </div>
  )
})

export default FormContentEditor
