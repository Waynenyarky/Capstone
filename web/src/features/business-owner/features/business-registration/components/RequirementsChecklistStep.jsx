import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, Checkbox, Space, List, Divider, App, theme, Spin, Tag } from 'antd'
import { FileTextOutlined, DownloadOutlined, CheckCircleOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileOutlined } from '@ant-design/icons'
import { downloadRequirementsPDF, confirmRequirementsChecklist } from '../services/businessRegistrationService'
import { getRequirementsForType } from '../constants/requirementsByType.jsx'
import { getActiveFormDefinition } from '@/features/admin/services/formDefinitionService'

const { Title, Paragraph, Text } = Typography

const FILE_ICONS = {
  pdf: <FilePdfOutlined />,
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
}

export default function RequirementsChecklistStep({ businessId, businessType, lguCode, onConfirm, onNext }) {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [confirmed, setConfirmed] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [definition, setDefinition] = useState(null)
  const [formDefinitionId, setFormDefinitionId] = useState(null)
  const [deactivated, setDeactivated] = useState(null)

  // Fetch requirements from API with fallback to hardcoded
  useEffect(() => {
    let cancelled = false
    async function fetchRequirements() {
      setLoading(true)
      setDeactivated(null)
      try {
        const res = await getActiveFormDefinition('registration', businessType, lguCode)
        if (cancelled) return
        if (res.deactivated) {
          setDeactivated({
            availableAt: res.availableAt,
            reason: res.reason || 'This form is temporarily unavailable.',
          })
          setDefinition(null)
          setFormDefinitionId(null)
        } else if (res.definition) {
          setDefinition(res.definition)
          setFormDefinitionId(res.definition._id)
        }
      } catch (err) {
        // Fallback to hardcoded if API fails or no definition found
        console.log('Using fallback requirements:', err.message || 'API unavailable')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    fetchRequirements()
    return () => { cancelled = true }
  }, [businessType, lguCode])

  // Get requirements - from API definition or fallback to hardcoded
  const requirements = definition?.sections || getRequirementsForType(businessType)
  const downloads = definition?.downloads || []

  const getFileIcon = (fileType) => {
    return FILE_ICONS[fileType?.toLowerCase()] || <FileOutlined />
  }

  const handleDownloadPDF = async () => {
    // PDF download works even for "new" businesses - it's just a static checklist
    const businessIdToUse = businessId || 'new'

    try {
      setDownloading(true)
      await downloadRequirementsPDF(businessIdToUse)
      message.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF:', error)
      const errorMessage = error?.message || 'Failed to download PDF. Please try again.'
      message.error(errorMessage)
    } finally {
      setDownloading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmed) {
      message.warning('Please confirm that you have reviewed and understand all requirements')
      return
    }

    if (!businessId || businessId === 'new') {
      if (onConfirm) onConfirm(formDefinitionId)
      message.success('Requirements confirmed')
      if (onNext) onNext()
      return
    }

    try {
      setConfirming(true)
      await confirmRequirementsChecklist(businessId, formDefinitionId)
      if (onConfirm) onConfirm(formDefinitionId)
      message.success('Requirements confirmed')
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to confirm requirements:', error)
      message.error('Failed to confirm requirements. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  // Render item based on format (string from hardcoded or object from API)
  const renderItem = (item) => {
    if (typeof item === 'string') {
      return <List.Item>{item}</List.Item>
    }
    // Object format from API
    return (
      <List.Item>
        <Space direction="vertical" size={0}>
          <Space>
            <Text>{item.label}</Text>
            {item.required === false && <Tag color="default">Optional</Tag>}
          </Space>
          {item.notes && (
            <Text type="secondary" style={{ fontSize: 12 }}>{item.notes}</Text>
          )}
        </Space>
      </List.Item>
    )
  }

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>Loading requirements...</Paragraph>
      </Card>
    )
  }

  if (deactivated) {
    const availableDate = deactivated.availableAt
      ? new Date(deactivated.availableAt).toLocaleString(undefined, {
          dateStyle: 'long',
          timeStyle: 'short',
        })
      : null
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Title level={4} style={{ marginBottom: 16 }}>Form Temporarily Unavailable</Title>
          <Paragraph style={{ marginBottom: 8 }}>
            {deactivated.reason}
          </Paragraph>
          {availableDate && (
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              This form will be available again on <strong>{availableDate}</strong>.
            </Paragraph>
          )}
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            You cannot continue with your registration at this time. Please check back later or contact your LGU for assistance.
          </Paragraph>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'left', marginBottom: 32 }}>
          <FileTextOutlined style={{ fontSize: 32, color: token.colorPrimary, marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8 }}>Requirements</Title>
          <Paragraph type="secondary">
            Before proceeding with your business registration application, please review all required documents and registrations.
          </Paragraph>
        </div>

        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Requirements can vary by LGU and business type. Use this list as guidance and confirm with your local office.
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {requirements.map((section, index) => (
            <div key={`${section.category}-${index}`}>
              <Title level={5}>
                <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                {section.category}
              </Title>
              {section.source && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                  Source: {section.source}
                </Text>
              )}
              <List
                size="small"
                bordered
                dataSource={section.items}
                renderItem={renderItem}
              />
              {index < requirements.length - 1 && <Divider />}
            </div>
          ))}
        </Space>

        {/* Downloads section */}
        {downloads.length > 0 && (
          <>
            <Divider />
            <Title level={5}>Downloadable Forms</Title>
            <Paragraph type="secondary">
              Download and fill out these forms as part of your application.
            </Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              {downloads.map((download, index) => (
                <Card key={index} size="small">
                  <Space>
                    <span style={{ fontSize: 20, color: token.colorPrimary }}>
                      {getFileIcon(download.fileType)}
                    </span>
                    <div>
                      <Text strong>{download.label}</Text>
                      <br />
                      <Tag>{download.fileType?.toUpperCase() || 'FILE'}</Tag>
                    </div>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      href={download.fileUrl}
                      target="_blank"
                    >
                      Download
                    </Button>
                  </Space>
                </Card>
              ))}
            </Space>
          </>
        )}

        <Divider />

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            size="default"
            onClick={handleDownloadPDF}
            loading={downloading}
            style={{ marginRight: 16 }}
          >
            Download PDF Checklist
          </Button>
        </div>

        <Divider />

        <div style={{ marginTop: 32 }}>
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ fontSize: 16, lineHeight: '24px' }}
          >
            I have reviewed and understand all requirements. I confirm that I will prepare all necessary documents before proceeding.
          </Checkbox>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="default"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
            loading={confirming}
            disabled={!confirmed}
          >
            Confirm and Continue
          </Button>
        </div>
      </Card>
    </div>
  )
}
