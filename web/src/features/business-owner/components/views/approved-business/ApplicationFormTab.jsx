import { useState, useEffect, useMemo } from 'react'
import { Typography, Empty, theme } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import DynamicFormRenderer from '../../forms/DynamicFormRenderer'
import { getActiveFormDefinition, getPublicFormDefinition } from '@/features/admin/services/formDefinitionService'
import { Form } from '@/shared/components/AppForm'
import { normalizeFormDataForRenderer } from '../../../utils/formDataNormalizers.js'
import { useDocuments } from '../../../utils/documentUtils.js'

const { Text } = Typography

export default function ApplicationFormTab({ business }) {
  const { token } = theme.useToken()
  const form = Form.useForm()[0]
  const [formDefinition, setFormDefinition] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadFormDefinition = async () => {
      // Try multiple possible ID fields
      const appId = business?.applicationId || business?._id || business?.businessId
      if (!appId) return
      
      setLoading(true)
      try {
        const formDefId = business?.formDefinitionId
        const formType = business?.formType || 'permit'

        let res
        if (formDefId) {
          res = await getPublicFormDefinition(formDefId)
        } else {
          res = await getActiveFormDefinition(formType, business?.businessType || null, null)
        }

        if (res?.success && res?.definition) {
          setFormDefinition(res.definition)
        }
      } catch (error) {
        console.error('Failed to load form definition:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFormDefinition()
  }, [business?.applicationId, business?._id, business?.businessId, business?.formDefinitionId, business?.formType, business?.businessType])

  const formData = useMemo(() => business?.formData && typeof business.formData === 'object' ? business.formData : {}, [business?.formData])
  const documents = useDocuments(business, formData)
  
  const normalizedFormData = useMemo(
    () => normalizeFormDataForRenderer(formData, formDefinition),
    [formData, formDefinition]
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <LottieSpinner size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading application form...</Text>
        </div>
      </div>
    )
  }

  if (!formDefinition) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          description={<Text type="secondary">Application form not available</Text>}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '100%' }}>
        <Form form={form} layout="vertical" initialValues={normalizedFormData}>
          <DynamicFormRenderer
            definition={formDefinition}
            form={form}
            formValues={normalizedFormData}
            readOnly={true}
            documents={documents}
            businessId={business?.businessId || business?._id}
            formDataKey={business?.businessId ?? business?._id ?? 'approved'}
          />
        </Form>
    </div>
  )
}
