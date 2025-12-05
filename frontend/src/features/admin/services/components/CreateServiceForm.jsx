import { Form, Input, Button, Flex, Card, Select, Upload, InputNumber, Radio } from 'antd'
import { serviceNameRules, serviceDescriptionRules, serviceStatusRules, serviceImageRules, serviceCategoryRules } from "@/features/admin/services/validations/serviceRules.js"
import { fixedMinRules, fixedMaxRules, hourlyMinRules, hourlyMaxRules } from "@/features/admin/services/validations/pricingRules.js"
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from "@/shared/forms"
import { SERVICE_STATUS_OPTIONS } from "@/features/admin/services/constants/serviceStatus.js"
import { useCategoryTable } from "@/features/admin/services/hooks/useCategoryTable.js"
import ImgCrop from 'antd-img-crop';
import { useServiceForm } from "@/features/admin/services/hooks/useServiceForm.js"
import { ConfirmCreateServiceModal } from "@/features/admin/services"
import { useConfirmCreateServiceModal } from "@/features/admin/services/hooks/useConfirmCreateServiceModal.js"
import { useServiceTable } from "@/features/admin/services/hooks/useServiceTable.js"

export default function CreateServiceForm({ onFinish }) {
  const { form, handleFinish, onPreview, beforeUpload, maxCount, onUploadChange } = useServiceForm(onFinish)
  const {
    open,
    values: pendingValues,
    show,
    hide,
    handleConfirm,
    confirmLoading,
  } = useConfirmCreateServiceModal({ onConfirm: handleFinish })
  const currentImageList = Form.useWatch('image', form) || []
  const pricingMode = Form.useWatch('pricingMode', form)
  const { categories } = useCategoryTable()
  const { services } = useServiceTable()

  // Quick helper to prefill demo values for fast local testing
  const handlePrefillDemo = () => {
    const rand = Math.floor(1000 + Math.random() * 9000)
    const firstCategoryId = (categories && categories[0]) ? categories[0].id : undefined
    form.setFieldsValue({
      name: `Home Assistance ${rand}`,
      description: 'General home assistance: errands, light cleaning, companionship.',
      categoryId: firstCategoryId,
      pricingMode: 'fixed',
      status: 'active',
      priceMin: 1500,
      priceMax: 3500,
      hourlyRateMin: null,
      hourlyRateMax: null,
    })
  }

  const uniqueNameValidator = async (_, value) => {
    const name = String(value || '').trim()
    if (!name) return Promise.resolve()
    const exists = (services || []).some((s) => String(s.name || '').trim().toLowerCase() === name.toLowerCase())
    if (exists) return Promise.reject(new Error('Service name must be unique'))
    return Promise.resolve()
  }

  return (
    <Card title="Create Service">
      <Form form={form} layout="vertical" initialValues={{ image: [], pricingMode: 'fixed', priceMin: null, priceMax: null, hourlyRateMin: null, hourlyRateMax: null }}>
        <Form.Item
          name="image"
          label="Service Image"
          rules={serviceImageRules}
          validateTrigger={["onChange","onSubmit"]}
        >
          <ImgCrop rotationSlider>
            <Upload
              beforeUpload={beforeUpload}
              listType="picture-card"
              onPreview={onPreview}
              accept="image/*"
              multiple={false}
              maxCount={maxCount}
              fileList={currentImageList}
              onChange={onUploadChange}
            >
              {currentImageList.length < maxCount && '+ Upload'}
            </Upload>
          </ImgCrop>
        </Form.Item>
        <Form.Item
          name="name"
          label="Service Name"
          rules={[...serviceNameRules, { validator: uniqueNameValidator }]}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Input allowClear autoComplete="on" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Service Description"
          rules={serviceDescriptionRules}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Input.TextArea allowClear autoComplete="on" />
        </Form.Item>
        <Form.Item
          name="categoryId"
          label="Service Category"
          rules={serviceCategoryRules}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Select allowClear placeholder="Select a category">
            {categories.map(category => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="pricingMode"
          label="Pricing Mode"
          rules={[{ required: true, message: 'Please select a pricing mode' }]}
          validateTrigger={["onChange","onSubmit"]}
          hasFeedback
        >
          <Radio.Group>
            <Radio.Button value="fixed">Fixed Price</Radio.Button>
            <Radio.Button value="hourly">Hourly Rate</Radio.Button>
            <Radio.Button value="both">Both</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="status"
          label="Service Status"
          rules={serviceStatusRules}
          validateTrigger={["onBlur","onSubmit"]}
          hasFeedback
        >
          <Select allowClear placeholder="Select a status">
            {SERVICE_STATUS_OPTIONS.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {(pricingMode === 'fixed' || pricingMode === 'both') && (
          <Form.Item
            name="priceMin"
            label="Minimum Fixed Price"
            dependencies={["pricingMode"]}
            rules={fixedMinRules(form)}
            validateTrigger={["onBlur","onSubmit"]}
            hasFeedback
          >
            <InputNumber min={0} step={1} precision={0} inputMode="numeric" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} style={{ width: '100%' }} prefix="₱" />
          </Form.Item>
        )}
        {(pricingMode === 'fixed' || pricingMode === 'both') && (
          <Form.Item
            name="priceMax"
            label="Maximum Fixed Price"
            dependencies={["priceMin","pricingMode"]}
            rules={fixedMaxRules(form)}
            validateTrigger={["onBlur","onSubmit"]}
            hasFeedback
          >
            <InputNumber min={0} step={1} precision={0} inputMode="numeric" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} style={{ width: '100%' }} prefix="₱" />
          </Form.Item>
        )}
        {(pricingMode === 'hourly' || pricingMode === 'both') && (
          <Form.Item
            name="hourlyRateMin"
            label="Minimum Hourly Rate"
            dependencies={["pricingMode"]}
            rules={hourlyMinRules(form)}
            validateTrigger={["onBlur","onSubmit"]}
            hasFeedback
          >
            <InputNumber min={0} step={1} precision={0} inputMode="numeric" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} style={{ width: '100%' }} prefix="₱" />
          </Form.Item>
        )}
        {(pricingMode === 'hourly' || pricingMode === 'both') && (
          <Form.Item
            name="hourlyRateMax"
            label="Maximum Hourly Rate"
            dependencies={["hourlyRateMin","pricingMode"]}
            rules={hourlyMaxRules(form)}
            validateTrigger={["onBlur","onSubmit"]}
            hasFeedback
          >
            <InputNumber min={0} step={1} precision={0} inputMode="numeric" onKeyDown={preventNonNumericKeyDown} onPaste={sanitizeNumericPaste} onInput={sanitizeNumericInput} style={{ width: '100%' }} prefix="₱" />
          </Form.Item>
        )}
        <Flex justify="end" gap="small">
          <Button onClick={handlePrefillDemo}>Prefill Demo</Button>
          <Button type="primary" onClick={async () => { const vals = await form.validateFields(); show(vals) }}>Continue</Button>
        </Flex>
      </Form>
      <ConfirmCreateServiceModal
        open={open}
        values={pendingValues}
        onConfirm={handleConfirm}
        onCancel={hide}
        confirmLoading={confirmLoading}
      />
    </Card>
  )
}


