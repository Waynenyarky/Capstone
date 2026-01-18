import React, { useState } from 'react'
import { Card, Typography, Alert, Descriptions, Space, Tag, Button, List, Divider, Modal, App, Form } from 'antd'
import { CheckCircleOutlined, FileTextOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons'
import { resolveAvatarUrl } from '@/lib/utils'
import LGUDocumentsUploadStep from './LGUDocumentsUploadStep'
import BIRRegistrationStep from './BIRRegistrationStep'
import OtherAgenciesStep from './OtherAgenciesStep'
import BusinessRegistrationForm from './BusinessRegistrationForm'

const { Title, Text, Paragraph } = Typography

export default function ApplicationReviewStep({ 
  businessData, 
  lguDocuments, 
  birRegistration, 
  otherAgencyRegistrations,
  onEdit,
  businessId,
  onDocumentsSave,
  onBIRSave,
  onAgenciesSave,
  onBusinessSave
}) {
  const { message } = App.useApp()
  const [editDocumentsModalOpen, setEditDocumentsModalOpen] = useState(false)
  const [editBIRModalOpen, setEditBIRModalOpen] = useState(false)
  const [editAgenciesModalOpen, setEditAgenciesModalOpen] = useState(false)
  const [editBusinessModalOpen, setEditBusinessModalOpen] = useState(false)
  const [businessForm] = Form.useForm()
  // Debug: Log the data to see what we're receiving
  React.useEffect(() => {
    console.log('ApplicationReviewStep - Received lguDocuments:', lguDocuments)
    console.log('ApplicationReviewStep - Received birRegistration:', birRegistration)
    console.log('ApplicationReviewStep - lguDocuments type:', typeof lguDocuments)
    console.log('ApplicationReviewStep - birRegistration type:', typeof birRegistration)
    if (lguDocuments) {
      console.log('ApplicationReviewStep - lguDocuments keys:', Object.keys(lguDocuments))
      console.log('ApplicationReviewStep - lguDocuments values:', Object.values(lguDocuments))
      console.log('ApplicationReviewStep - lguDocuments.idPicture:', lguDocuments.idPicture)
      console.log('ApplicationReviewStep - lguDocuments.ctc:', lguDocuments.ctc)
    }
    if (birRegistration) {
      console.log('ApplicationReviewStep - birRegistration keys:', Object.keys(birRegistration))
      console.log('ApplicationReviewStep - birRegistration values:', Object.values(birRegistration))
      console.log('ApplicationReviewStep - birRegistration.certificateUrl:', birRegistration.certificateUrl)
      console.log('ApplicationReviewStep - birRegistration.booksOfAccountsUrl:', birRegistration.booksOfAccountsUrl)
    }
  }, [lguDocuments, birRegistration])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const getDocumentUrl = (url) => {
    // Check if URL exists and is not empty string
    // Also handle cases where url might be in an array (from file upload component)
    let actualUrl = url
    if (Array.isArray(url) && url.length > 0) {
      actualUrl = url[0]?.url || url[0]?.response?.url || url[0]
    }
    // Handle both string URLs and object URLs
    if (actualUrl && typeof actualUrl === 'object' && actualUrl.url) {
      actualUrl = actualUrl.url
    }
    // Check for valid URL string (not empty, not 'undefined', not 'null')
    const hasUrl = actualUrl && 
                   typeof actualUrl === 'string' && 
                   actualUrl.trim() !== '' && 
                   actualUrl !== 'undefined' && 
                   actualUrl !== 'null'
    
    return hasUrl ? resolveAvatarUrl(actualUrl) : null
  }

  const getDocumentStatus = (url) => {
    const actualUrl = getDocumentUrl(url)
    const hasUrl = actualUrl !== null
    
    return (
      <Space>
        {hasUrl ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Uploaded</Tag>
        ) : (
          <Tag color="default">Not uploaded</Tag>
        )}
        {hasUrl && (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(actualUrl, '_blank')}
          >
            View
          </Button>
        )}
      </Space>
    )
  }

  const handleEditDocuments = () => {
    setEditDocumentsModalOpen(true)
  }

  const handleEditBIR = () => {
    setEditBIRModalOpen(true)
  }

  const handleDocumentsSave = async (documents) => {
    if (onDocumentsSave) {
      await onDocumentsSave(documents)
    }
    setEditDocumentsModalOpen(false)
    message.success('Documents updated successfully')
  }

  const handleBIRSave = async (birData) => {
    if (onBIRSave) {
      await onBIRSave(birData)
    }
    setEditBIRModalOpen(false)
    message.success('BIR registration updated successfully')
  }

  const handleAgenciesSave = async (agencyData) => {
    if (onAgenciesSave) {
      await onAgenciesSave(agencyData)
    }
    setEditAgenciesModalOpen(false)
    message.success('Agency registrations updated successfully')
  }

  const handleBusinessSave = async () => {
    if (!onBusinessSave) return
    const values = await businessForm.validateFields()
    await onBusinessSave(values)
    setEditBusinessModalOpen(false)
    message.success('Business information updated successfully')
  }

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Review Application Details</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Please review all information carefully before submission
          </Text>
        </div>

        <Alert
          message="Important"
          description="Please review all information carefully. Once submitted, you will not be able to edit the application without contacting the LGU officer."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Business Information Summary */}
          <Card title="Business Information" size="small">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Business Name">{businessData?.businessName}</Descriptions.Item>
              <Descriptions.Item label="Business Type">{businessData?.businessType}</Descriptions.Item>
              <Descriptions.Item label="Registration Agency">{businessData?.registrationAgency}</Descriptions.Item>
              <Descriptions.Item label="Registration Number">{businessData?.businessRegistrationNumber}</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {businessData?.location?.street}, {businessData?.location?.barangay}, {businessData?.location?.city}, {businessData?.location?.province}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Number">{businessData?.contactNumber}</Descriptions.Item>
              <Descriptions.Item label="Business Start Date">
                {businessData?.businessStartDate ? new Date(businessData.businessStartDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
            </Descriptions>
            {(onBusinessSave || onEdit) && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    if (onBusinessSave) {
                      businessForm.setFieldsValue(businessData || {})
                      setEditBusinessModalOpen(true)
                    } else if (onEdit) {
                      onEdit(2)
                    }
                  }}
                >
                  Edit Business Information
                </Button>
              </div>
            )}
          </Card>

          {/* LGU Documents */}
          <Card title="LGU Documents" size="small">
            <List
              bordered
              dataSource={[
                { label: '2×2 ID Picture', url: lguDocuments?.idPicture },
                { label: 'Community Tax Certificate (CTC)', url: lguDocuments?.ctc },
                { label: 'Barangay Business Clearance', url: lguDocuments?.barangayClearance },
                { label: 'DTI/SEC/CDA Registration', url: lguDocuments?.dtiSecCda },
                { label: 'Lease Contract or Land Title', url: lguDocuments?.leaseOrLandTitle },
                { label: 'Certificate of Occupancy', url: lguDocuments?.occupancyPermit },
                { label: 'Health Certificate', url: lguDocuments?.healthCertificate }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{item.label}</Text>
                    {getDocumentStatus(item.url)}
                  </Space>
                </List.Item>
              )}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="link" icon={<EyeOutlined />} onClick={handleEditDocuments}>
                Edit Documents
              </Button>
            </div>
          </Card>

          {/* BIR Registration */}
          <Card title="BIR Registration" size="small">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="BIR Registration Number">
                {birRegistration?.registrationNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Fee">
                {formatCurrency(birRegistration?.registrationFee || 500)}
              </Descriptions.Item>
              <Descriptions.Item label="Documentary Stamp Tax">
                {formatCurrency(birRegistration?.documentaryStampTax || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="BIR Certificate of Registration">
                {getDocumentStatus(birRegistration?.certificateUrl)}
              </Descriptions.Item>
              <Descriptions.Item label="Books of Accounts Registration">
                {getDocumentStatus(birRegistration?.booksOfAccountsUrl)}
              </Descriptions.Item>
              <Descriptions.Item label="Authority to Print">
                {getDocumentStatus(birRegistration?.authorityToPrintUrl)}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="link" icon={<EyeOutlined />} onClick={handleEditBIR}>
                Edit BIR Registration
              </Button>
            </div>
          </Card>

          {/* Other Agency Registrations */}
          {otherAgencyRegistrations?.hasEmployees && (
            <Card title="Other Government Agency Registrations" size="small">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="SSS Registration">
                  {otherAgencyRegistrations?.sss?.registered ? (
                    <Space>
                      <Tag color="green" icon={<CheckCircleOutlined />}>Registered</Tag>
                      {getDocumentStatus(otherAgencyRegistrations?.sss?.proofUrl)}
                    </Space>
                  ) : (
                    <Tag color="default">Not registered</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="PhilHealth Registration">
                  {otherAgencyRegistrations?.philhealth?.registered ? (
                    <Space>
                      <Tag color="green" icon={<CheckCircleOutlined />}>Registered</Tag>
                      {getDocumentStatus(otherAgencyRegistrations?.philhealth?.proofUrl)}
                    </Space>
                  ) : (
                    <Tag color="default">Not registered</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Pag-IBIG Fund Registration">
                  {otherAgencyRegistrations?.pagibig?.registered ? (
                    <Space>
                      <Tag color="green" icon={<CheckCircleOutlined />}>Registered</Tag>
                      {getDocumentStatus(otherAgencyRegistrations?.pagibig?.proofUrl)}
                    </Space>
                  ) : (
                    <Tag color="default">Not registered</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
              {onEdit && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button type="link" icon={<EyeOutlined />} onClick={() => setEditAgenciesModalOpen(true)}>
                    Edit Agency Registrations
                  </Button>
                </div>
              )}
            </Card>
          )}

          {!otherAgencyRegistrations?.hasEmployees && (
            <Card title="Other Government Agency Registrations" size="small">
              <Alert
                message="No Employees"
                description="Your business does not have employees, so agency registrations are not required."
                type="info"
                showIcon
              />
            </Card>
          )}
        </Space>

        <Divider />

        <Alert
          message="Ready to Submit"
          description="Once you submit this application, it will be sent to the LGU Officer for permit verification. You will receive a reference number to track your application status."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      </Card>

      {/* Edit Documents Modal */}
      <Modal
        title="Edit LGU Documents"
        open={editDocumentsModalOpen}
        onCancel={() => setEditDocumentsModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <LGUDocumentsUploadStep
          businessId={businessId}
          businessType={businessData?.businessType}
          initialDocuments={lguDocuments}
          inModal={true}
          onSave={handleDocumentsSave}
        />
      </Modal>

      {/* Edit BIR Registration Modal */}
      <Modal
        title="Edit BIR Registration"
        open={editBIRModalOpen}
        onCancel={() => setEditBIRModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <BIRRegistrationStep
          businessId={businessId}
          initialData={birRegistration}
          inModal={true}
          onSave={handleBIRSave}
        />
      </Modal>

      {/* Edit Agency Registrations Modal */}
      <Modal
        title="Edit Agency Registrations"
        open={editAgenciesModalOpen}
        onCancel={() => setEditAgenciesModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <OtherAgenciesStep
          businessId={businessId}
          initialData={otherAgencyRegistrations}
          onSave={handleAgenciesSave}
        />
      </Modal>

      {/* Edit Business Information Modal */}
      <Modal
        title="Edit Business Information"
        open={editBusinessModalOpen}
        onCancel={() => setEditBusinessModalOpen(false)}
        onOk={handleBusinessSave}
        width={900}
        destroyOnClose
      >
        <Form form={businessForm} layout="vertical" initialValues={businessData || {}}>
          <BusinessRegistrationForm form={businessForm} initialValues={businessData || {}} onValuesChange={() => {}} />
        </Form>
      </Modal>
    </div>
  )
}
