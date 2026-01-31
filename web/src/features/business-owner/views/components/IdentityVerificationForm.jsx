import React, { useState, useEffect, useCallback } from 'react'
import {
  Form,
  Select,
  Input,
  Upload,
  Row,
  Col,
  Typography,
  Card,
  Button,
  Space,
  Alert,
  Spin,
  DatePicker,
  Divider,
  Modal,
  message,
  theme,
  Slider,
} from 'antd'
import {
  UploadOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ScissorOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import Cropper from 'react-easy-crop'

import { ID_TYPES, getIdTypeOptions, getIdTypeConfig } from '../../config/idTypeConfig'
import IdVerificationStatus from './IdVerificationStatus'
import PhilippineAddressFields from '../../../../shared/components/PhilippineAddressFields'

// Address field names to handle specially
const ADDRESS_FIELDS = ['streetAddress', 'barangay', 'city', 'province', 'postalCode']

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3005'

// ID card aspect ratio (standard credit card size: 85.6mm x 53.98mm ≈ 1.586)
const ID_CARD_ASPECT_RATIO = 1.586

/**
 * Creates a cropped image from the source image and crop area
 */
const createCroppedImage = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Set canvas size to the crop size (max 1200px for optimal OCR)
  const maxSize = 1200
  let outputWidth = pixelCrop.width
  let outputHeight = pixelCrop.height

  if (outputWidth > maxSize) {
    const ratio = maxSize / outputWidth
    outputWidth = maxSize
    outputHeight = Math.round(pixelCrop.height * ratio)
  }

  canvas.width = outputWidth
  canvas.height = outputHeight

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  // Return as blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      'image/jpeg',
      0.9
    )
  })
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

/**
 * Identity Verification Form Component
 * 
 * Features:
 * - Dynamic fields based on ID type selection
 * - OCR extraction from uploaded images
 * - User verification of extracted data
 */
export default function IdentityVerificationForm({ 
  form, 
  profileData, 
  refreshProfile,
  isMobile = false 
}) {
  const { token } = theme.useToken()
  const [selectedIdType, setSelectedIdType] = useState(null)
  const [idTypeConfig, setIdTypeConfig] = useState(null)
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [ocrAvailable, setOcrAvailable] = useState(true)

  // Crop state
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [cropSide, setCropSide] = useState(null) // 'front' or 'back'
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // Watch for ID type changes
  const idType = Form.useWatch('idType', form)

  useEffect(() => {
    if (idType) {
      setSelectedIdType(idType)
      const config = getIdTypeConfig(idType)
      setIdTypeConfig(config)
      
      // Set default values for fields
      if (config) {
        config.fields.forEach(field => {
          if (field.defaultValue && !form.getFieldValue(field.name)) {
            form.setFieldValue(field.name, field.defaultValue)
          }
        })
      }
    }
  }, [idType, form])

  // Check OCR availability on mount
  useEffect(() => {
    checkOcrStatus()
  }, [])

  const checkOcrStatus = async () => {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ocr/status`)
      const data = await res.json()
      setOcrAvailable(data.available)
    } catch (err) {
      console.warn('Could not check OCR status:', err)
      setOcrAvailable(false)
    }
  }

  // Handle crop completion
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Handle image upload - show crop modal
  const handleImageUpload = async (file, side) => {
    // Read the file and show crop modal
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result)
      setCropSide(side)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)

    return false // Prevent default upload
  }

  // Handle crop confirmation
  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !cropImageSrc) return

    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(cropImageSrc, croppedAreaPixels)
      
      // Create a File object from the blob
      const croppedFile = new File([croppedBlob], `cropped_${cropSide}_id.jpg`, {
        type: 'image/jpeg',
      })
      
      // Add originFileObj for antd Upload compatibility
      croppedFile.originFileObj = croppedFile

      // Store the cropped image
      if (cropSide === 'front') {
        setFrontImage(croppedFile)
        
        // Update the form's file list with the cropped image
        const croppedUrl = URL.createObjectURL(croppedBlob)
        form.setFieldValue('idFileUrl', [{
          uid: '-1',
          name: croppedFile.name,
          status: 'done',
          url: croppedUrl,
          originFileObj: croppedFile,
        }])
      } else {
        setBackImage(croppedFile)
        
        const croppedUrl = URL.createObjectURL(croppedBlob)
        form.setFieldValue('idFileBackUrl', [{
          uid: '-2',
          name: croppedFile.name,
          status: 'done',
          url: croppedUrl,
          originFileObj: croppedFile,
        }])
      }

      // Close crop modal
      setShowCropModal(false)
      setCropImageSrc(null)

      message.success('Image cropped successfully!')

      // Trigger OCR for front image if available
      if (cropSide === 'front' && selectedIdType && ocrAvailable) {
        await extractTextFromImage(croppedFile)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
      message.error('Failed to crop image. Please try again.')
    }
  }

  // Cancel crop
  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImageSrc(null)
    setCropSide(null)
  }

  const extractTextFromImage = async (file) => {
    if (!file || !selectedIdType) return

    setExtracting(true)
    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)
      
      const config = getIdTypeConfig(selectedIdType)
      
      const response = await fetch(`${AI_SERVICE_URL}/ocr/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          idType: selectedIdType,
          ocrMapping: config?.ocrMapping || null,
        }),
      })

      const result = await response.json()

      if (result.success && Object.keys(result.extractedFields).length > 0) {
        setExtractedData(result)
        setShowVerifyModal(true)
        message.success('Text extracted from ID! Please verify the details.')
      } else if (!result.ocrAvailable) {
        message.info('OCR service not available. Please enter details manually.')
      } else {
        message.info('Could not extract text automatically. Please enter details manually.')
      }
    } catch (err) {
      console.error('OCR extraction failed:', err)
      message.warning('Could not extract text. Please enter details manually.')
    } finally {
      setExtracting(false)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file.originFileObj || file)
    })
  }

  const handleVerifyExtractedData = () => {
    if (extractedData?.extractedFields) {
      // Populate form with extracted data
      const fields = extractedData.extractedFields
      Object.entries(fields).forEach(([key, value]) => {
        if (value) {
          // Handle date fields
          if (key.toLowerCase().includes('date') && typeof value === 'string') {
            // Try to parse date
            const parsed = dayjs(value)
            if (parsed.isValid()) {
              form.setFieldValue(key, parsed)
            }
          } else {
            form.setFieldValue(key, value)
          }
        }
      })
      message.success('Extracted data applied to form. Please verify and correct if needed.')
    }
    setShowVerifyModal(false)
  }

  const handleManualEntry = () => {
    setShowVerifyModal(false)
    message.info('Please fill in the details manually.')
  }

  // Build validation rules for a field
  const buildFieldRules = (field) => {
    const rules = []
    
    if (field.required) {
      rules.push({ required: true, message: `${field.label} is required` })
    }
    
    if (field.minLength) {
      rules.push({ min: field.minLength, message: `${field.label} must be at least ${field.minLength} characters` })
    }
    
    if (field.pattern) {
      rules.push({
        pattern: field.pattern,
        message: field.patternMessage || `Invalid ${field.label} format`,
      })
    }
    
    // Add name validation - no gibberish for any name field
    const nameFields = ['lastName', 'firstName', 'middleName', 'givenName', 'givenNames', 'surname', 'maidenName']
    if (nameFields.includes(field.name)) {
      rules.push({
        validator: (_, value) => {
          if (!value) return Promise.resolve()
          // Check for repeated characters (gibberish detection)
          if (/(.)\1{4,}/.test(value)) {
            return Promise.reject(new Error(`Please enter a valid ${field.label.toLowerCase()}`))
          }
          // Names should have at least 2 characters
          if (value.trim().length < 2) {
            return Promise.reject(new Error(`${field.label} must be at least 2 characters`))
          }
          return Promise.resolve()
        }
      })
    }
    
    return rules
  }

  // Render dynamic field based on type
  const renderField = (field) => {
    const { name, label, required, placeholder, type, options, defaultValue } = field
    const rules = buildFieldRules(field)

    switch (type) {
      case 'date':
        return (
          <Form.Item key={name} name={name} label={label} rules={rules}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder={placeholder || `Select ${label}`}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        )

      case 'select':
        return (
          <Form.Item key={name} name={name} label={label} rules={rules}>
            <Select placeholder={placeholder || `Select ${label}`}>
              {options?.map(opt => (
                <Option key={opt} value={opt}>{opt}</Option>
              ))}
            </Select>
          </Form.Item>
        )

      case 'textarea':
        return (
          <Form.Item key={name} name={name} label={label} rules={rules}>
            <TextArea 
              rows={2} 
              placeholder={placeholder || `Enter ${label}`}
            />
          </Form.Item>
        )

      default:
        return (
          <Form.Item key={name} name={name} label={label} rules={rules}>
            <Input placeholder={placeholder || `Enter ${label}`} />
          </Form.Item>
        )
    }
  }

  const idTypeOptions = getIdTypeOptions()

  return (
    <>
    

      {/* Step 1: Select ID Type */}
      <Card 
        size="default" 
        title={
          <Space>
            <span style={{ 
              background: token.colorPrimary, 
              color: 'white', 
              borderRadius: '50%', 
              width: 24, 
              height: 24, 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 12
            }}>1</span>
            <span>Prove Your Identity</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form.Item 
          name="idType" 
          label="What type of government ID will you upload?"
          rules={[{ required: true, message: 'Please select an ID type' }]}
        >
          <Select 
            placeholder="Select your ID type" 
            showSearch
            optionFilterProp="children"
          >
            {idTypeOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Form.Item>
        {/* Consent Disclaimer - Only show when ID type is selected */}
        {selectedIdType && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8, marginBottom: 16 }}>
            By clicking "Verify & Continue", you confirm that the ID document you are uploading is genuine 
            and belongs to you, and you consent to the collection and processing of your personal information 
            for identity verification purposes in accordance with the Data Privacy Act of 2012.
          </Text>
        )}
      </Card>

      {/* Step 2: Upload ID Images (only show if ID type selected) */}
      {selectedIdType && (
        <Card 
          size="default" 
          title={
            <Space>
              <span style={{ 
                background: token.colorPrimary, 
                color: 'white', 
                borderRadius: '50%', 
                width: 24, 
                height: 24, 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 12
              }}>2</span>
              <span>Upload ID Images</span>
            </Space>
          }
          extra={
            ocrAvailable && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ScanOutlined /> Auto-extract enabled
              </Text>
            )
          }
          style={{ marginBottom: 16 }}
        >
          
          <Row gutter={[24, 16]}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item 
                name="idFileUrl" 
                label="Front of ID" 
                valuePropName="fileList" 
                getValueFromEvent={(e) => {
                  // Always return only the last file to enforce single file
                  if (Array.isArray(e)) return e.slice(-1)
                  return e?.fileList?.slice(-1) || []
                }}
                rules={[{ required: true, message: 'Front ID is required' }]}
              >
                <Upload 
                  name="idFile" 
                  listType="picture-card" 
                  maxCount={1} 
                  accept=".jpg,.jpeg,.png"
                  beforeUpload={(file) => handleImageUpload(file, 'front')}
                >
                  <div>
                    <ScissorOutlined />
                    <div style={{ marginTop: 8 }}>Upload & Crop</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            
            {idTypeConfig?.hasBack !== false && (
              <Col span={isMobile ? 24 : 12}>
                <Form.Item 
                  name="idFileBackUrl" 
                  label="Back of ID" 
                  valuePropName="fileList" 
                  getValueFromEvent={(e) => {
                    // Always return only the last file to enforce single file
                    if (Array.isArray(e)) return e.slice(-1)
                    return e?.fileList?.slice(-1) || []
                  }}
                  rules={[{ required: idTypeConfig?.hasBack, message: 'Back ID is required' }]}
                >
                <Upload 
                  name="idFileBack" 
                  listType="picture-card" 
                  maxCount={1} 
                  accept=".jpg,.jpeg,.png"
                  beforeUpload={(file) => handleImageUpload(file, 'back')}
                >
                  <div>
                    <ScissorOutlined />
                    <div style={{ marginTop: 8 }}>Upload & Crop</div>
                  </div>
                </Upload>
                </Form.Item>
              </Col>
            )}
          </Row>

          {extracting && (
            <Alert
              message="Extracting text from ID..."
              description="Please wait while we read your ID document."
              type="info"
              showIcon
              icon={<Spin size="small" />}
            />
          )}
        </Card>
      )}

      {/* Step 3: ID Details (only show if ID type selected) */}
      {selectedIdType && idTypeConfig && (
        <Card 
          size="default" 
          title={
            <Space>
              <span style={{ 
                background: token.colorPrimary, 
                color: 'white', 
                borderRadius: '50%', 
                width: 24, 
                height: 24, 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 12
              }}>3</span>
              <span>Verify ID Details</span>
            </Space>
          }
          extra={
            frontImage && ocrAvailable && (
              <Button 
                size="small" 
                icon={<ScanOutlined />}
                onClick={() => extractTextFromImage(frontImage)}
                loading={extracting}
              >
                Re-scan ID
              </Button>
            )
          }
          style={{ marginBottom: 16 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {extractedData 
              ? "We've extracted some details from your ID. Please verify and correct if needed."
              : "Please enter the details exactly as shown on your ID."
            }
          </Paragraph>

          <Row gutter={[16, 0]}>
            {idTypeConfig.fields.map((field, index) => {
              // Handle address fields specially - render PhilippineAddressFields once
              if (ADDRESS_FIELDS.includes(field.name)) {
                // Only render the address component for the first address field
                if (field.name === 'streetAddress') {
                  return (
                    <PhilippineAddressFields
                      key="address-fields"
                      form={form}
                      required={false}
                      disabled={false}
                      initialProvince={extractedData?.extractedFields?.province || ''}
                      initialCity={extractedData?.extractedFields?.city || ''}
                      initialBarangay={extractedData?.extractedFields?.barangay || ''}
                      initialStreet={extractedData?.extractedFields?.streetAddress || ''}
                      initialPostalCode={extractedData?.extractedFields?.postalCode || ''}
                    />
                  )
                }
                // Skip other address fields as they're handled by PhilippineAddressFields
                return null
              }
              
              return (
                <Col key={field.name} span={field.type === 'textarea' || isMobile ? 24 : 12}>
                  {renderField(field)}
                </Col>
              )
            })}
          </Row>
        </Card>
      )}


      {/* AI Verification Status - Only show if verification is complete (not pending) or if user has uploaded files */}
      {profileData?.ownerIdentity?.aiVerification && 
       profileData.ownerIdentity.aiVerification.status !== 'pending' && (
        <IdVerificationStatus 
          aiVerification={profileData.ownerIdentity.aiVerification}
          onRefresh={refreshProfile}
        />
      )}

      {/* Verify Extracted Data Modal */}
      <Modal
        title={
          <Space>
            <ScanOutlined />
            <span>Verify Extracted Information</span>
          </Space>
        }
        open={showVerifyModal}
        onCancel={() => setShowVerifyModal(false)}
        footer={[
          <Button key="manual" onClick={handleManualEntry}>
            Enter Manually
          </Button>,
          <Button key="verify" type="primary" icon={<CheckCircleOutlined />} onClick={handleVerifyExtractedData}>
            Use Extracted Data
          </Button>,
        ]}
        width={600}
      >
        {extractedData && (
          <>
            <Alert
              message="Review the extracted information"
              description="The following details were extracted from your ID. Click 'Use Extracted Data' to fill the form, then verify and correct any errors."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ background: token.colorFillSecondary, padding: 16, borderRadius: 8 }}>
              {Object.entries(extractedData.extractedFields).map(([key, value]) => (
                <Row key={key} style={{ marginBottom: 8 }}>
                  <Col span={10}>
                    <Text strong style={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Text>
                  </Col>
                  <Col span={14}>
                    <Text>{value}</Text>
                  </Col>
                </Row>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Confidence: {Math.round(extractedData.confidence * 100)}%
              </Text>
            </div>
          </>
        )}
      </Modal>

      {/* Image Crop Modal */}
      <Modal
        title={
          <Space>
            <ScissorOutlined />
            <span>Crop Your ID - {cropSide === 'front' ? 'Front' : 'Back'}</span>
          </Space>
        }
        open={showCropModal}
        onCancel={handleCropCancel}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleCropCancel}>
            Cancel
          </Button>,
          <Button 
            key="crop" 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={handleCropConfirm}
          >
            Crop & Continue
          </Button>,
        ]}
        destroyOnClose
      >
        <Alert
          message="Position your ID card within the frame"
          description="Drag to move, use the slider or scroll to zoom. Make sure the entire ID is visible and well-lit."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Cropper container */}
        <div 
          style={{ 
            position: 'relative', 
            height: 400, 
            background: token.colorBgContainer,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {cropImageSrc && (
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ID_CARD_ASPECT_RATIO}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={true}
              cropShape="rect"
              style={{
                containerStyle: {
                  borderRadius: 8,
                },
              }}
            />
          )}
        </div>

        {/* Zoom control */}
        <div style={{ marginTop: 16, padding: '0 16px' }}>
          <Space style={{ width: '100%' }} align="center">
            <ZoomOutOutlined style={{ fontSize: 18 }} />
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={setZoom}
              style={{ flex: 1, margin: '0 8px' }}
              tooltip={{ formatter: (value) => `${Math.round(value * 100)}%` }}
            />
            <ZoomInOutlined style={{ fontSize: 18 }} />
          </Space>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
            Tip: Scroll or pinch to zoom, drag to reposition
          </Text>
        </div>
      </Modal>
    </>
  )
}
