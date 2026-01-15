import { useState, useEffect } from 'react'
import { Form, Upload, Button, Card, Typography, Space, Alert, Row, Col, Select, Input, message } from 'antd'
import { UploadOutlined, DeleteOutlined, EyeOutlined, UndoOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { uploadIdDocuments, getIdVerificationStatus, revertIdUpload } from '@/features/user/services/idUploadService.js'
import { useNotifier } from '@/shared/notifications.js'
import { SendCodeForCurrentUser, TotpVerificationForm, useAuthSession } from '@/features/authentication'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

export default function IDUploadForm() {
  const { currentUser, role, login } = useAuthSession()
  const { success, error } = useNotifier()
  const [form] = Form.useForm()
  
  const [loading, setLoading] = useState(false)
  const [, setStatusLoading] = useState(true) // Setter used but value not read
  const [idStatus, setIdStatus] = useState(null)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [verificationStep, setVerificationStep] = useState(null) // 'send' | 'verify' | null
  const [, setVerificationCode] = useState('') // Setter used but value comes from form parameter
  const [reverting, setReverting] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setStatusLoading(true)
      const data = await getIdVerificationStatus(currentUser, role)
      setIdStatus(data?.idVerification || null)
      
      if (data?.idVerification) {
        form.setFieldsValue({
          idType: data.idVerification.idType,
          idNumber: data.idVerification.idNumber,
        })
      }
    } catch (err) {
      console.error('Failed to load ID status:', err)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleFileChange = (field) => (info) => {
    const file = info.file
    if (field === 'front') {
      setFrontFile(file)
    } else {
      setBackFile(file)
    }
  }

  const handleRemove = (field) => () => {
    if (field === 'front') {
      setFrontFile(null)
    } else {
      setBackFile(null)
    }
  }

  const handleStartVerification = async () => {
    try {
      setVerificationStep('send')
    } catch (err) {
      error(err, 'Failed to start verification')
    }
  }

  const handleVerificationSent = () => {
    setVerificationStep('verify')
  }

  const handleVerificationSubmit = async ({ verificationCode: code }) => {
    setVerificationCode(code)
    setVerificationStep(null)
    await handleUpload(code)
  }

  const handleUpload = async (code = null) => {
    if (!frontFile) {
      message.error('Please upload the front of your ID')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('front', frontFile)
      if (backFile) {
        formData.append('back', backFile)
      }
      if (code) {
        formData.append('verificationCode', code)
      }

      const data = await uploadIdDocuments(formData, currentUser, role)
      success('ID documents uploaded successfully')
      
      // Update user session if needed
      if (data?.user) {
        const localRaw = localStorage.getItem('auth__currentUser')
        const remember = !!localRaw
        login(data.user, { remember })
      }
      
      setFrontFile(null)
      setBackFile(null)
      setVerificationCode('')
      await loadStatus()
    } catch (err) {
      console.error('ID upload error:', err)
      const errMsg = err?.message || 'Failed to upload ID documents'
      if (errMsg.includes('verification')) {
        // Need verification
        handleStartVerification()
      } else {
        error(err, errMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async () => {
    try {
      setReverting(true)
      await revertIdUpload(currentUser, role)
      success('ID upload reverted successfully')
      await loadStatus()
    } catch (err) {
      console.error('Failed to revert ID upload:', err)
      error(err, 'Failed to revert ID upload')
    } finally {
      setReverting(false)
    }
  }

  const canRevert = idStatus?.canRevertUntil && new Date(idStatus.canRevertUntil) > new Date()

  if (verificationStep === 'send') {
    return (
      <Card>
        <SendCodeForCurrentUser
          email={currentUser?.email}
          onSent={handleVerificationSent}
          title="Verify Identity"
          subtitle="We need to verify your identity before uploading ID documents."
        />
      </Card>
    )
  }

  if (verificationStep === 'verify') {
    return (
      <Card>
        <TotpVerificationForm
          email={currentUser?.email}
          onSubmit={handleVerificationSubmit}
          title="Enter Verification Code"
        />
      </Card>
    )
  }

  return (
    <div>
      {idStatus && (
        <Alert
          message={`ID Status: ${idStatus.status || 'Pending'}`}
          description={
            <div>
              {idStatus.frontImageUrl && (
                <div style={{ marginTop: 8 }}>
                  <Text>Front ID uploaded on {new Date(idStatus.uploadedAt).toLocaleString()}</Text>
                </div>
              )}
              {canRevert && (
                <div style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    danger
                    icon={<UndoOutlined />}
                    onClick={handleRevert}
                    loading={reverting}
                  >
                    Revert Upload (available until {new Date(idStatus.canRevertUntil).toLocaleString()})
                  </Button>
                </div>
              )}
            </div>
          }
          type={idStatus.status === 'verified' ? 'success' : 'info'}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="idType" label="ID Type">
              <Select placeholder="Select ID Type">
                <Option value="Driver's License">Driver's License</Option>
                <Option value="National ID">National ID</Option>
                <Option value="Passport">Passport</Option>
                <Option value="SSS ID">SSS ID</Option>
                <Option value="TIN ID">TIN ID</Option>
                <Option value="PhilHealth ID">PhilHealth ID</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="idNumber" label="ID Number">
              <Input placeholder="Enter ID Number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item label="Front of ID" required>
              <Upload
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/') || file.name.endsWith('.pdf')
                  if (!isImage) {
                    message.error('You can only upload image files or PDF!')
                    return false
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5
                  if (!isLt5M) {
                    message.error('File must be smaller than 5MB!')
                    return false
                  }
                  handleFileChange('front')({ file })
                  return false
                }}
                onRemove={handleRemove('front')}
                fileList={frontFile ? [frontFile] : []}
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>Upload Front</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Back of ID (Optional)">
              <Upload
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/') || file.name.endsWith('.pdf')
                  if (!isImage) {
                    message.error('You can only upload image files or PDF!')
                    return false
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5
                  if (!isLt5M) {
                    message.error('File must be smaller than 5MB!')
                    return false
                  }
                  handleFileChange('back')({ file })
                  return false
                }}
                onRemove={handleRemove('back')}
                fileList={backFile ? [backFile] : []}
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>Upload Back</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => handleStartVerification()}
              loading={loading}
              disabled={!frontFile}
            >
              Upload ID Documents
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
