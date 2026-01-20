import React from 'react'
import { Modal, Card, List, Descriptions, Space, Tag, Typography, Divider, theme, Spin } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import { resolveAvatarUrl } from '@/lib/utils'

const { Title, Text } = Typography

export default function RequirementsViewModal({ visible, application, type, onClose, loading = false }) {
  const { token } = theme.useToken()

  // Extract data from application (handle null case)
  const business = application?.businessDetails || {}
  const requirementsChecklist = business?.requirementsChecklist || application?.requirementsChecklist || {}
  const lguDocuments = business?.lguDocuments || application?.lguDocuments || {}
  const birRegistration = business?.birRegistration || application?.birRegistration || {}
  const otherAgencyRegistrations = business?.otherAgencyRegistrations || application?.otherAgencyRegistrations || {}
  const businessRegistration = business || application || {}

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  const getDocumentUrl = (url) => {
    let actualUrl = url
    if (Array.isArray(url) && url.length > 0) {
      actualUrl = url[0]?.url || url[0]?.response?.url || url[0]
    }
    if (actualUrl && typeof actualUrl === 'object' && actualUrl.url) {
      actualUrl = actualUrl.url
    }
    const hasUrl = actualUrl && 
                   typeof actualUrl === 'string' && 
                   actualUrl.trim() !== '' && 
                   actualUrl !== 'undefined' && 
                   actualUrl !== 'null'
    
    return hasUrl ? resolveAvatarUrl(actualUrl) : null
  }

  const getDocumentStatus = (url, label) => {
    const actualUrl = getDocumentUrl(url)
    const hasUrl = actualUrl !== null
    
    return (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Space>
          {hasUrl ? (
            <>
              <Tag color="green" icon={<CheckCircleOutlined />}>Uploaded</Tag>
              <a 
                href={actualUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <EyeOutlined /> View
              </a>
            </>
          ) : (
            <Tag color="default" icon={<CloseCircleOutlined />}>Not uploaded</Tag>
          )}
        </Space>
      </Space>
    )
  }

  // LGU Documents list
  const lguDocumentsList = [
    { label: '2×2 ID Picture', url: lguDocuments.idPicture },
    { label: 'Community Tax Certificate (CTC)', url: lguDocuments.ctc },
    { label: 'Barangay Business Clearance', url: lguDocuments.barangayClearance },
    { label: 'DTI/SEC/CDA Registration', url: lguDocuments.dtiSecCda },
    { label: 'Lease Contract or Land Title', url: lguDocuments.leaseOrLandTitle },
    { label: 'Certificate of Occupancy', url: lguDocuments.occupancyPermit },
    { label: 'Health Certificate', url: lguDocuments.healthCertificate }
  ]

  // Count completed requirements
  const completedLguDocs = lguDocumentsList.filter(doc => getDocumentUrl(doc.url) !== null).length
  const totalLguDocs = lguDocumentsList.length
  const birDocsCompleted = [
    birRegistration.certificateUrl,
    birRegistration.booksOfAccountsUrl,
    birRegistration.authorityToPrintUrl
  ].filter(url => getDocumentUrl(url) !== null).length
  const totalBirDocs = 3

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: token.colorPrimary }} />
          <span>View Requirements - {application?.businessName || 'Business Registration'}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <button key="close" onClick={onClose} style={{ padding: '4px 15px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
          Close
        </button>
      ]}
      width={900}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading requirements...</Text>
            </div>
          </div>
        ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Requirements Checklist Status */}
          <Card title="Requirements Checklist Status" size="small">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Requirements Confirmed">
                {requirementsChecklist.confirmed ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Confirmed
                  </Tag>
                ) : (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    Not confirmed
                  </Tag>
                )}
                {requirementsChecklist.confirmedAt && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({formatDate(requirementsChecklist.confirmedAt)})
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="PDF Downloaded">
                {requirementsChecklist.pdfDownloaded ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Downloaded
                  </Tag>
                ) : (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    Not downloaded
                  </Tag>
                )}
                {requirementsChecklist.pdfDownloadedAt && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({formatDate(requirementsChecklist.pdfDownloadedAt)})
                  </Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* LGU Documents Checklist */}
          <Card 
            title={
              <Space>
                <span>LGU Documents</span>
                <Tag color={completedLguDocs === totalLguDocs ? 'green' : 'orange'}>
                  {completedLguDocs} / {totalLguDocs} Completed
                </Tag>
              </Space>
            }
            size="small"
          >
            <List
              bordered
              dataSource={lguDocumentsList}
              renderItem={(item) => (
                <List.Item>
                  {getDocumentStatus(item.url, item.label)}
                </List.Item>
              )}
            />
          </Card>

          {/* BIR Registration Status */}
          <Card 
            title={
              <Space>
                <span>BIR Registration</span>
                <Tag color={birDocsCompleted === totalBirDocs ? 'green' : 'orange'}>
                  {birDocsCompleted} / {totalBirDocs} Documents
                </Tag>
              </Space>
            }
            size="small"
          >
            <List
              bordered
              dataSource={[
                { label: 'BIR Certificate of Registration', url: birRegistration.certificateUrl },
                { label: 'Registration of Books of Accounts', url: birRegistration.booksOfAccountsUrl },
                { label: 'Authority to Print Official Receipts and Invoices', url: birRegistration.authorityToPrintUrl }
              ]}
              renderItem={(item) => (
                <List.Item>
                  {getDocumentStatus(item.url, item.label)}
                </List.Item>
              )}
            />
            {birRegistration.registrationNumber && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Registration Number: </Text>
                <Text>{birRegistration.registrationNumber}</Text>
              </div>
            )}
            {birRegistration.paymentReceiptUrl && (
              <div style={{ marginTop: 8 }}>
                {getDocumentStatus(birRegistration.paymentReceiptUrl, 'Payment Receipt')}
              </div>
            )}
          </Card>

          {/* Other Agency Registrations */}
          {otherAgencyRegistrations?.hasEmployees ? (
            <Card title="Other Government Agency Registrations" size="small">
              <List
                bordered
                dataSource={[
                  {
                    label: 'SSS Registration',
                    registered: otherAgencyRegistrations?.sss?.registered || false,
                    proofUrl: otherAgencyRegistrations?.sss?.proofUrl
                  },
                  {
                    label: 'PhilHealth Registration',
                    registered: otherAgencyRegistrations?.philhealth?.registered || false,
                    proofUrl: otherAgencyRegistrations?.philhealth?.proofUrl
                  },
                  {
                    label: 'Pag-IBIG Fund Registration',
                    registered: otherAgencyRegistrations?.pagibig?.registered || false,
                    proofUrl: otherAgencyRegistrations?.pagibig?.proofUrl
                  }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{item.label}</Text>
                      <Space>
                        {item.registered ? (
                          <>
                            <Tag color="green" icon={<CheckCircleOutlined />}>Registered</Tag>
                            {item.proofUrl && (
                              <a 
                                href={getDocumentUrl(item.proofUrl)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <EyeOutlined /> View Proof
                              </a>
                            )}
                          </>
                        ) : (
                          <Tag color="default" icon={<CloseCircleOutlined />}>Not registered</Tag>
                        )}
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            <Card title="Other Government Agency Registrations" size="small">
              <Text type="secondary">No employees - agency registrations not required</Text>
            </Card>
          )}

          {/* Business Registration Form Completion */}
          <Card title="Business Registration Form" size="small">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Registered Business Name">
                {businessRegistration.registeredBusinessName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Business Trade Name">
                {businessRegistration.businessTradeName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Business Registration Type">
                {businessRegistration.businessRegistrationType || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Registration Number">
                {businessRegistration.businessRegistrationNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Primary Line of Business">
                {businessRegistration.primaryLineOfBusiness || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Business Classification">
                {businessRegistration.businessClassification || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Form Completion Status">
                {businessRegistration.registeredBusinessName ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>
                ) : (
                  <Tag color="default" icon={<CloseCircleOutlined />}>Not completed</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Owner Identity Completion */}
          <Card title="Owner Identity Information" size="small">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Owner Full Name">
                {businessRegistration.ownerFullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="TIN">
                {businessRegistration.ownerTin || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Government ID Type">
                {businessRegistration.governmentIdType || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Government ID Number">
                {businessRegistration.governmentIdNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Identity Completion Status">
                {businessRegistration.ownerFullName && businessRegistration.ownerTin ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>
                ) : (
                  <Tag color="default" icon={<CloseCircleOutlined />}>Not completed</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Space>
        )}
      </div>
    </Modal>
  )
}
