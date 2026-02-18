import React from 'react'
import {
  Input,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Checkbox,
  Typography,
  Divider,
  Button,
  Row,
  Col,
  theme,
} from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { FIELD_TYPES } from '../constants'

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

/** Render a single field as a business owner would see it */
function PreviewField({ field, token }) {
  const label = (
    <div style={{ marginBottom: 4 }}>
      <Text strong style={{ fontSize: 13 }}>
        {field.label || '(Untitled field)'}
      </Text>
      {field.required && <Text type="danger" style={{ marginLeft: 4 }}>*</Text>}
      {field.helpText && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
          {field.helpText}
        </Text>
      )}
    </div>
  )

  let input = null

  switch (field.type) {
    case 'text':
      input = <Input placeholder={field.placeholder || ''} disabled />
      break
    case 'textarea':
      input = <Input.TextArea placeholder={field.placeholder || ''} autoSize={{ minRows: 2, maxRows: 4 }} disabled />
      break
    case 'number':
      input = <InputNumber placeholder={field.placeholder || ''} style={{ width: '100%' }} disabled />
      break
    case 'date':
      input = <DatePicker style={{ width: '100%' }} disabled />
      break
    case 'select':
      input = (
        <Select
          placeholder={field.placeholder || 'Select...'}
          style={{ width: '100%' }}
          disabled
          options={(field.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
        />
      )
      break
    case 'multiselect':
      input = (
        <Select
          mode="multiple"
          placeholder={field.placeholder || 'Select one or more...'}
          style={{ width: '100%' }}
          disabled
          options={(field.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
        />
      )
      break
    case 'file':
      input = (
        <Upload disabled showUploadList={false}>
          <Button icon={<UploadOutlined />} disabled>Upload file</Button>
        </Upload>
      )
      break
    case 'download':
      input = (
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
          <Button type="primary" size="small" icon={<DownloadOutlined />} disabled>
            Download
          </Button>
        </div>
      )
      break
    case 'checkbox':
      input = <Checkbox disabled>{field.placeholder || field.label}</Checkbox>
      break
    case 'address':
      input = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Select placeholder="Province" disabled style={{ width: '100%' }} />
          <Select placeholder="City / Municipality" disabled style={{ width: '100%' }} />
          <Select placeholder="Barangay" disabled style={{ width: '100%' }} />
          <Input placeholder="Street address, building, etc." disabled />
        </div>
      )
      break
    case 'repeatable_group': {
      const groupFields = field.groupFields || []
      input = (
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
                {gf.required && <Text type="danger" style={{ marginLeft: 2, fontSize: 11 }}>*</Text>}
              </div>
            ))}
            <div style={{ width: 32, flexShrink: 0 }} />
          </div>
          {/* Sample row */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'center' }}>
            {groupFields.map((gf, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0 }}>
                {gf.type === 'select' || gf.type === 'multiselect' ? (
                  <Select
                    placeholder={gf.placeholder || 'Select...'}
                    style={{ width: '100%' }}
                    disabled
                    size="small"
                    mode={gf.type === 'multiselect' ? 'multiple' : undefined}
                    options={(gf.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
                  />
                ) : gf.type === 'number' ? (
                  <InputNumber placeholder={gf.placeholder || ''} style={{ width: '100%' }} disabled size="small" />
                ) : gf.type === 'date' ? (
                  <DatePicker style={{ width: '100%' }} disabled size="small" />
                ) : (
                  <Input placeholder={gf.placeholder || ''} disabled size="small" />
                )}
              </div>
            ))}
            <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled style={{ flexShrink: 0 }} />
          </div>
          {/* Add row button */}
          <div style={{ padding: '6px 12px 10px', borderTop: `1px dashed ${token.colorBorderSecondary}` }}>
            <Button type="dashed" size="small" icon={<PlusOutlined />} disabled style={{ width: '100%' }}>
              Add row
            </Button>
          </div>
        </div>
      )
      break
    }
    default:
      input = <Input placeholder={field.placeholder || ''} disabled />
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {label}
      {input}
    </div>
  )
}

/**
 * FormPreview - Renders form sections and fields exactly as a business owner would see them.
 *
 * Props:
 *   sections - array of sections from the form definition
 *   isMobile - responsive flag
 */
/** Filter sections by showWhen when formValues is provided (e.g. conditional general permit category sections). */
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

export default function FormPreview({ sections, isMobile = false, formValues }) {
  const { token } = theme.useToken()
  const visibleSections = formValues ? filterSectionsByFormValues(sections, formValues) : (sections || [])

  if (!visibleSections.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Text type="secondary">
          {formValues && sections?.length > 0 ? 'No sections match the current form values. Change the category or other fields to see conditional sections.' : 'No form content to preview.'}
        </Text>
      </div>
    )
  }

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: isMobile ? 16 : 24,
      }}
    >
      {visibleSections.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: sIdx < visibleSections.length - 1 ? 24 : 0 }}>
          <Title level={5} style={{ marginBottom: 4 }}>
            {section.category || `Section ${sIdx + 1}`}
          </Title>
          {section.source && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Source: {section.source}
            </Text>
          )}
          {section.notes && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              {section.notes}
            </Text>
          )}
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={[16, 0]}>
            {section.items.map((item, fIdx) => {
              const span = item.span || 24
              const colSpan = isMobile ? 24 : span
              return (
                <Col key={fIdx} span={colSpan}>
                  <PreviewField field={item} token={token} />
                </Col>
              )
            })}
          </Row>
        </div>
      ))}
    </div>
  )
}
