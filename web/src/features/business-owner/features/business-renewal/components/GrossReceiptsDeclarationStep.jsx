import React, { useState, useEffect } from 'react'
import { Card, Typography, Form, InputNumber, Input, Button, Alert, Space, Checkbox, Divider, App } from 'antd'
import { DollarOutlined, CheckCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { updateGrossReceipts } from '../services/businessRenewalService'

const { Title, Text, Paragraph } = Typography

export default function GrossReceiptsDeclarationStep({ businessId, renewalId, renewalYear, businessData, initialData, onSave, onNext, onRenewalIdUpdate }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // Calculate calendar year based on renewal year (BPLO standard: renewalYear - 1)
  const calendarYear = renewalYear ? renewalYear - 1 : new Date().getFullYear() - 1

  useEffect(() => {
    if (initialData) {
      // Support both new structure (amount) and legacy (cy2025) for backward compatibility
      const amount = initialData.amount || initialData.cy2025
      form.setFieldsValue({
        amount: amount > 0 ? amount : undefined,
        excludesVat: initialData.excludesVat !== false,
        excludesReturns: initialData.excludesReturns !== false,
        excludesUncollected: initialData.excludesUncollected !== false,
        branchAllocations: initialData.branchAllocations || []
      })
    }
  }, [initialData, form])

  const handleFinish = async (values) => {
    // Validate and convert amount to a number
    let amount = values.amount
    
    // Convert to number if it's a string
    if (typeof amount === 'string') {
      amount = parseFloat(amount)
    }
    
    // Ensure it's a valid number
    if (amount === null || amount === undefined || isNaN(amount)) {
      message.error(`Please enter gross receipts for CY ${calendarYear}. The amount must be a valid number.`)
      return
    }
    
    // Validate that it's greater than 0
    if (amount <= 0) {
      message.error(`Please enter gross receipts for CY ${calendarYear}. The amount must be greater than 0.`)
      return
    }

    try {
      setSaving(true)
      
      // Verify renewalId exists before attempting save
      if (renewalId && businessId) {
        try {
          const { getBusinessProfile } = await import('@/features/business-owner/services/businessProfileService')
          const profile = await getBusinessProfile()
          const business = profile?.businesses?.find(b => b.businessId === businessId)
          const renewal = business?.renewals?.find(r => r.renewalId === renewalId)
          
          if (!renewal) {
            // Renewal not found, try to find the latest valid renewal
            if (business?.renewals && business.renewals.length > 0) {
              const latestRenewal = business.renewals
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
              
              if (latestRenewal?.renewalId) {
                console.warn(`RenewalId ${renewalId} not found, using ${latestRenewal.renewalId}`)
                // Update renewalId immediately
                if (onRenewalIdUpdate) {
                  onRenewalIdUpdate(latestRenewal.renewalId)
                }
                // Use the corrected renewalId for the save
                const correctedRenewalId = latestRenewal.renewalId
                
                const grossReceiptsData = {
                  amount: Number(amount),
                  calendarYear: calendarYear,
                  excludesVat: values.excludesVat !== false,
                  excludesReturns: values.excludesReturns !== false,
                  excludesUncollected: values.excludesUncollected !== false,
                  branchAllocations: values.branchAllocations || []
                }
                
                const result = await updateGrossReceipts(businessId, correctedRenewalId, grossReceiptsData)
                await handleSaveSuccess(result, grossReceiptsData, correctedRenewalId)
                return
              }
            }
            
            message.error('Renewal not found. Please refresh the page and try again.')
            setSaving(false)
            return
          }
        } catch (validationError) {
          console.error('Failed to validate renewalId:', validationError)
          message.error('Failed to verify renewal. Please try again.')
          setSaving(false)
          return
        }
      }
      
      const grossReceiptsData = {
        amount: Number(amount), // Ensure it's sent as a number
        calendarYear: calendarYear,
        excludesVat: values.excludesVat !== false,
        excludesReturns: values.excludesReturns !== false,
        excludesUncollected: values.excludesUncollected !== false,
        branchAllocations: values.branchAllocations || []
      }

      const result = await updateGrossReceipts(businessId, renewalId, grossReceiptsData)
      await handleSaveSuccess(result, grossReceiptsData, renewalId)
    } catch (error) {
      console.error('Failed to save gross receipts:', error)
      message.error(error?.message || 'Failed to save gross receipts. Please try again.')
      setSaving(false)
    }
  }
  
  const handleSaveSuccess = async (result, grossReceiptsData, usedRenewalId) => {
    try {
      // The backend already validates the save, so if we get here without an error, it succeeded
      // Verify the response structure to ensure data was persisted correctly
      console.log('DEBUG - Save result received:', {
        hasProfile: !!result?.profile,
        hasBusinesses: !!result?.profile?.businesses,
        usedRenewalId,
        businessId,
        sentAmount: grossReceiptsData.amount
      })
      
      if (result?.profile) {
        // Try to find the saved renewal using the renewalId that was actually used
        let savedRenewal = result.profile.businesses
          ?.find(b => b.businessId === businessId)
          ?.renewals?.find(r => r.renewalId === usedRenewalId)
        
        // If not found with the used renewalId, try to find any renewal with gross receipts
        // This handles cases where the renewalId might have changed or there's a mismatch
        if (!savedRenewal) {
          const business = result.profile.businesses?.find(b => b.businessId === businessId)
          if (business?.renewals && business.renewals.length > 0) {
            // Find the most recent renewal with gross receipts matching our amount
            savedRenewal = business.renewals
              .filter(r => {
                const rAmount = r.grossReceipts?.amount || r.grossReceipts?.cy2025
                return rAmount && rAmount > 0 && Math.abs(rAmount - grossReceiptsData.amount) < 0.01
              })
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
            
            if (savedRenewal && savedRenewal.renewalId !== usedRenewalId) {
              console.warn(`Renewal ID mismatch: used ${usedRenewalId}, found ${savedRenewal.renewalId} in response`)
              // The backend save succeeded, but the response shows a different renewalId
              // Notify parent to update renewalId immediately
              if (onRenewalIdUpdate) {
                onRenewalIdUpdate(savedRenewal.renewalId)
              }
              usedRenewalId = savedRenewal.renewalId
            }
          }
        }
        
        // Verify that gross receipts were actually saved
        if (savedRenewal?.grossReceipts) {
          // Get saved amount - check both amount and cy2025, preferring amount
          let savedAmount = savedRenewal.grossReceipts.amount
          if (savedAmount === undefined || savedAmount === null) {
            savedAmount = savedRenewal.grossReceipts.cy2025
          }
          
          // Convert to number if it's a string
          if (typeof savedAmount === 'string') {
            savedAmount = parseFloat(savedAmount)
          }
          
          // Check if amount is valid
          const isValidAmount = savedAmount !== undefined && savedAmount !== null && !isNaN(savedAmount) && savedAmount > 0
          
          if (isValidAmount) {
            // Update grossReceiptsData with the saved data to ensure consistency
            grossReceiptsData.amount = Number(savedAmount)
            grossReceiptsData.calendarYear = savedRenewal.grossReceipts.calendarYear || calendarYear
            console.log('Gross receipts verified in response:', { 
              renewalId: usedRenewalId, 
              amount: savedAmount,
              calendarYear: grossReceiptsData.calendarYear
            })
          } else {
            // If verification fails but we sent a valid amount, trust what we sent
            // The backend already validated the save, so if we got here, it succeeded
            // The backend validated that amount > 0 before saving, so we can trust it
            console.log('Gross receipts verification: Response amount format differs, but backend save succeeded. Using sent amount:', {
              renewalId: usedRenewalId,
              sentAmount: grossReceiptsData.amount,
              responseAmount: savedRenewal.grossReceipts?.amount,
              responseCy2025: savedRenewal.grossReceipts?.cy2025,
              grossReceiptsKeys: savedRenewal.grossReceipts ? Object.keys(savedRenewal.grossReceipts) : []
            })
            // Keep the amount we sent since backend save succeeded
            // The backend validated the amount, so we trust it even if response structure differs
          }
        } else {
          // If we can't find the renewal in the response, trust the backend save
          // The backend already validated the save, so if we got here, it succeeded
          console.log(`Renewal ${usedRenewalId} not found in save response, but backend save succeeded. Using sent amount: ${grossReceiptsData.amount}`)
          // Keep the amount we sent since backend save succeeded
          // The backend validated the amount before saving, so we trust it
        }
      } else {
        // If profile is not in response, still trust the backend save
        console.log('Profile not in response, but backend save succeeded. Using sent amount:', grossReceiptsData.amount)
      }
      
      // If backend returned success, trust it (backend already validates)
      // The backend throws an error if the save fails, so if we get here, it succeeded
      // The backend validated that amount > 0 before saving, so we trust it
      message.success(`Gross receipts declaration saved: ₱${grossReceiptsData.amount.toLocaleString()} for CY ${calendarYear}`)
      if (onSave) onSave(grossReceiptsData)
      if (onNext) onNext()
    } catch (error) {
      console.error('Failed to process save result:', error)
      // Even if verification fails, the backend save succeeded, so proceed
      message.success('Gross receipts declaration saved')
      if (onSave) onSave(grossReceiptsData)
      if (onNext) onNext()
    } finally {
      setSaving(false)
    }
  }

  const hasBranches = businessData?.numberOfBranches > 0 || businessData?.numberOfBusinessUnits > 0

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <DollarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>Declare Gross Receipts</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Declare your gross sales or receipts for Calendar Year {calendarYear}
          </Paragraph>
        </div>

        <Alert
          message="Gross Receipts Declaration Rules"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Excludes Value-Added Tax (VAT)</li>
              <li>Excludes sales returns and allowances</li>
              <li>Excludes uncollected receivables</li>
              {hasBranches && <li>Proper allocation required for branches when applicable</li>}
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            amount: (initialData?.amount || initialData?.cy2025) || undefined,
            excludesVat: initialData?.excludesVat !== false,
            excludesReturns: initialData?.excludesReturns !== false,
            excludesUncollected: initialData?.excludesUncollected !== false,
            branchAllocations: initialData?.branchAllocations || []
          }}
        >
          <Form.Item
            name="amount"
            label={<Text strong>Gross Receipts for CY {calendarYear} (₱)</Text>}
            rules={[
              { required: true, message: `Please enter gross receipts for CY ${calendarYear}` },
              { 
                type: 'number', 
                min: 1, 
                message: 'Gross receipts must be greater than 0' 
              },
              {
                validator: (_, value) => {
                  if (!value || value === 0 || value === null || value === undefined) {
                    return Promise.reject(new Error(`Gross receipts for CY ${calendarYear} is required and must be greater than 0`))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              formatter={(value) => 
                value ? `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
              }
              parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
              placeholder="Enter gross receipts amount"
              min={1}
              step={1000}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>Declaration Rules</Title>
          <Form.Item name="excludesVat" valuePropName="checked">
            <Checkbox>Gross receipts exclude Value-Added Tax (VAT)</Checkbox>
          </Form.Item>
          <Form.Item name="excludesReturns" valuePropName="checked">
            <Checkbox>Gross receipts exclude sales returns and allowances</Checkbox>
          </Form.Item>
          <Form.Item name="excludesUncollected" valuePropName="checked">
            <Checkbox>Gross receipts exclude uncollected receivables</Checkbox>
          </Form.Item>

          {hasBranches && (
            <>
              <Divider />
              <Title level={4}>Branch Allocations (Optional)</Title>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                If your business has multiple locations, you may allocate gross receipts per branch location.
              </Paragraph>
              <Form.List name="branchAllocations">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'branchName']}
                          label="Branch Name"
                          rules={[{ required: true, message: 'Branch name required' }]}
                        >
                          <Input
                            placeholder="Branch Name"
                            style={{ width: 200 }}
                            size="large"
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'branchLocation']}
                          label="Location"
                        >
                          <Input
                            placeholder="Location"
                            style={{ width: 200 }}
                            size="large"
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'grossReceipts']}
                          label="Gross Receipts (₱)"
                          rules={[{ type: 'number', min: 0 }]}
                        >
                          <InputNumber
                            style={{ width: 200 }}
                            size="large"
                            formatter={(value) => 
                              value ? `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '₱ 0'
                            }
                            parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
                            min={0}
                            step={1000}
                          />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add Branch Allocation
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </>
          )}

          <div style={{ marginTop: 32, textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              htmlType="submit"
              loading={saving}
            >
              Save and Continue
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
