import React, { useState } from 'react'
import {
  Form,
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
  Card,
  theme,
  message,
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
import PhilippineAddressFields from '@/shared/components/PhilippineAddressFields'

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

function buildValidationRules(field) {
  const rules = []
  
  if (field.required) {
    rules.push({ required: true, message: `${field.label || 'This field'} is required` })
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

function RepeatableGroupField({ field, form, token }) {
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
                {gf.required && <Text type="danger" style={{ marginLeft: 2, fontSize: 11 }}>*</Text>}
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
                    rules={gf.required ? [{ required: true, message: 'Required' }] : []}
                    style={{ marginBottom: 0 }}
                  >
                    {gf.type === 'select' || gf.type === 'multiselect' ? (
                      <Select
                        placeholder={gf.placeholder || 'Select...'}
                        style={{ width: '100%' }}
                        size="small"
                        mode={gf.type === 'multiselect' ? 'multiple' : undefined}
                        options={(gf.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
                      />
                    ) : gf.type === 'number' ? (
                      <InputNumber placeholder={gf.placeholder || ''} style={{ width: '100%' }} size="small" />
                    ) : gf.type === 'date' ? (
                      <DatePicker style={{ width: '100%' }} size="small" />
                    ) : (
                      <Input placeholder={gf.placeholder || ''} size="small" />
                    )}
                  </Form.Item>
                </div>
              ))}
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={fields.length <= minRows}
                onClick={() => remove(name)}
                style={{ flexShrink: 0 }}
              />
            </div>
          ))}
          
          {/* Add row button */}
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
        </div>
      )}
    </Form.List>
  )
}

function DynamicField({ field, form, token }) {
  const fieldName = field.key || field.label
  const rules = buildValidationRules(field)
  
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
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Input placeholder={field.placeholder || ''} />
        </Form.Item>
      )
      
    case 'textarea':
      return (
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Input.TextArea placeholder={field.placeholder || ''} autoSize={{ minRows: 2, maxRows: 6 }} />
        </Form.Item>
      )
      
    case 'number':
      return (
        <Form.Item name={fieldName} label={label} rules={rules}>
          <InputNumber
            placeholder={field.placeholder || ''}
            style={{ width: '100%' }}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
          />
        </Form.Item>
      )
      
    case 'date':
      return (
        <Form.Item name={fieldName} label={label} rules={rules}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      )
      
    case 'select':
      return (
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Select
            placeholder={field.placeholder || 'Select...'}
            style={{ width: '100%' }}
            options={(field.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      )
      
    case 'multiselect':
      return (
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Select
            mode="multiple"
            placeholder={field.placeholder || 'Select one or more...'}
            style={{ width: '100%' }}
            options={(field.dropdownOptions || []).map((o) => ({ value: o, label: o }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      )
      
    case 'file':
      return (
        <Form.Item name={fieldName} label={label} rules={rules} valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            accept={field.validation?.acceptedFileTypes?.split(',').map(t => `.${t.trim()}`).join(',')}
          >
            <Button icon={<UploadOutlined />}>Upload file</Button>
          </Upload>
        </Form.Item>
      )
      
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
        <Form.Item name={fieldName} valuePropName="checked" rules={rules}>
          <Checkbox>{field.placeholder || field.label}</Checkbox>
        </Form.Item>
      )
      
    case 'address':
      return (
        <Row gutter={[16, 0]}>
          <PhilippineAddressFields form={form} required={field.required} />
        </Row>
      )
      
    case 'repeatable_group':
      return (
        <Form.Item label={label}>
          <RepeatableGroupField field={field} form={form} token={token} />
        </Form.Item>
      )
      
    default:
      return (
        <Form.Item name={fieldName} label={label} rules={rules}>
          <Input placeholder={field.placeholder || ''} />
        </Form.Item>
      )
  }
}

function filterSectionsByFormValues(sections, formValues) {
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

export default function DynamicFormRenderer({ 
  definition, 
  form, 
  formValues = {},
  isMobile = false,
  onValuesChange,
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
            {(section.items || []).map((item, fIdx) => {
              const span = item.span || 24
              const colSpan = isMobile ? 24 : span
              
              if (item.type === 'address') {
                return (
                  <Col key={fIdx} span={24}>
                    <DynamicField field={item} form={form} token={token} />
                  </Col>
                )
              }
              
              return (
                <Col key={fIdx} span={colSpan}>
                  <DynamicField field={item} form={form} token={token} />
                </Col>
              )
            })}
          </Row>
        </Card>
      ))}
    </div>
  )
}
