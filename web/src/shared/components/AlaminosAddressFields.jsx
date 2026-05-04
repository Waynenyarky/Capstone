/**
 * Alaminos Address Fields
 *
 * Address fields for businesses within Alaminos City only: Barangay + House/Building/Street.
 * Postal code is optional. Uses PSGC API for Alaminos City barangays.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Form } from '@/shared/components/AppForm'
import { Select, Input, Row, Col, Spin } from 'antd'
import { fetchBarangays } from '@/shared/services/psgcService'

const { Option } = Select

// Alaminos City, Pangasinan – PSGC code
const ALAMINOS_CITY_CODE = '015503000'

const fieldName = (namePrefix, name) =>
  namePrefix ? [namePrefix, name] : name

export default function AlaminosAddressFields({
  form,
  namePrefix = '',
  required = false,
  disabled = false,
  initialStreet = '',
  initialBarangay = '',
  initialBarangayName = '',
  initialPostalCode = '',
  onAddressChange,
}) {
  const field = useCallback(
    (name) => fieldName(namePrefix, name),
    [namePrefix],
  )

  const [barangays, setBarangays] = useState([])
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingBarangays(true)
    fetchBarangays(ALAMINOS_CITY_CODE)
      .then((data) => {
        if (!cancelled) setBarangays(data || [])
      })
      .catch((err) => {
        console.error('Failed to load Alaminos barangays:', err)
        if (!cancelled) setBarangays([])
      })
      .finally(() => {
        if (!cancelled) setLoadingBarangays(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleBarangayChange = (value, option) => {
    if (option) {
      form.setFieldValue(field('barangayName'), option.children)
    }
    onAddressChange?.()
  }

  return (
    <>
      <Col xs={24} sm={12}>
        <Form.Item
          name={field('streetAddress')}
          label="House/Bldg No. & Street"
          initialValue={initialStreet}
          rules={required ? [{ required: true, message: 'Please enter house/building no. & street' }] : []}
        >
          <Input
            placeholder="e.g., 123 Rizal Street"
            disabled={disabled}
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name={field('barangay')}
          label="Barangay"
          rules={required ? [{ required: true, message: 'Please select barangay' }] : []}
        >
          <Select
            showSearch
            placeholder="Select Barangay"
            loading={loadingBarangays}
            disabled={disabled || loadingBarangays}
            onChange={handleBarangayChange}
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={loadingBarangays ? <Spin size="small" /> : 'No barangays found'}
          >
            {barangays.map((brgy) => (
              <Option key={brgy.code} value={brgy.code}>
                {brgy.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={field('barangayName')} hidden>
          <Input />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          name={field('postalCode')}
          label="Postal Code (optional)"
          initialValue={initialPostalCode}
          rules={[
            { pattern: /^\d{4}$/, message: 'Postal code must be 4 digits', required: false },
          ]}
        >
          <Input
            placeholder="e.g., 2404"
            maxLength={4}
            disabled={disabled}
          />
        </Form.Item>
      </Col>
    </>
  )
}
