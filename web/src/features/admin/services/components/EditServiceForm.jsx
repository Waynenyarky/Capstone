import React from 'react'
import { Card, Form, Select, InputNumber, Button, Flex, Typography, Input, Upload, Radio } from 'antd'
import ImgCrop from 'antd-img-crop'
import { useEditServiceForm } from "@/features/admin/services/hooks/useEditServiceForm.js"
import { SERVICE_STATUS_OPTIONS } from "@/features/admin/services/constants/serviceStatus.js"
import { serviceNameRules, serviceDescriptionRules, serviceStatusRules, serviceCategoryRules } from "@/features/admin/services/validations/serviceRules.js"
import { fixedMinRules, fixedMaxRules, hourlyMinRules, hourlyMaxRules } from "@/features/admin/services/validations/pricingRules.js"
import { preventNonNumericKeyDown, sanitizeNumericPaste, sanitizeNumericInput } from "@/shared/forms"
import { ConfirmEditServiceModal } from "@/features/admin/services"
import { useConfirmEditServiceModal } from "@/features/admin/services/hooks/useConfirmEditServiceModal.js"

export default function EditServiceForm({ selectedServiceId }) {
  const {
    services,
    categories,
    isLoading,
    selected,
    form,
    currentImageList,
    selectedId,
    beforeUpload,
    getImageValueFromEvent,
    onUploadChange,
    onPreview,
    onSave,
    saving,
    hasChanges,
    onValuesChange,
  } = useEditServiceForm(selectedServiceId)

  const { open, values: pendingValues, show, hide, handleConfirm, confirmLoading } = useConfirmEditServiceModal({ onConfirm: onSave })

  const pricingMode = Form.useWatch('pricingMode', form)
  const uniqueNameValidator = async (_, value) => {
    const name = String(value || '').trim()
    if (!name) return Promise.resolve()
    const exists = (services || []).some((s) => String(s.id) !== String(selectedId) && String(s.name || '').trim().toLowerCase() === name.toLowerCase())
    if (exists) return Promise.reject(new Error('Service name must be unique'))
    return Promise.resolve()
  }

  return (
    <Card title="Edit Service">
      <Form form={form} layout="vertical" disabled={isLoading} initialValues={{ pricingMode: 'fixed', priceMin: null, priceMax: null, hourlyRateMin: null, hourlyRateMax: null }} onValuesChange={onValuesChange}>
        <Form.Item
          name="image"
          label="Service Image"
          valuePropName="fileList"
          getValueFromEvent={(e) => getImageValueFromEvent(e)}
        >
          <ImgCrop rotationSlider>
            <Upload
              beforeUpload={beforeUpload}
              listType="picture-card"
              onPreview={onPreview}
              accept="image/*"
              multiple={false}
              maxCount={1}
              fileList={currentImageList}
              onChange={onUploadChange}
            >
              {currentImageList.length < 1 && '+ Upload'}
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
          <Button type="primary" onClick={async () => { const vals = await form.validateFields(); show(vals) }} loading={saving} disabled={!selectedId || !hasChanges}>Save Changes</Button>
        </Flex>
      </Form>
      <ConfirmEditServiceModal
        open={open}
        selected={selected}
        values={pendingValues}
        onConfirm={handleConfirm}
        onCancel={hide}
        confirmLoading={confirmLoading}
      />
    </Card>
  )
}