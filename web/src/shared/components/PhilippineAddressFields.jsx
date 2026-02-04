/**
 * Philippine Address Fields Component
 * 
 * Cascading select fields for Philippine addresses using PSGC API
 * Province → City/Municipality → Barangay
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Form, Select, Input, Row, Col, Spin } from 'antd'
import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  fetchBarangays,
  findProvinceByName,
  findCityByName,
  findBarangayByName,
} from '../services/psgcService'

const { Option } = Select

/**
 * Philippine Address Fields with cascading dropdowns
 * 
 * @param {Object} props
 * @param {Object} props.form - Ant Design form instance
 * @param {boolean} props.required - Whether fields are required
 * @param {boolean} props.disabled - Whether fields are disabled
 * @param {string} props.initialProvince - Initial province name (from OCR)
 * @param {string} props.initialCity - Initial city name (from OCR)
 * @param {string} props.initialBarangay - Initial barangay name (from OCR)
 * @param {string} props.initialStreet - Initial street address (from OCR)
 * @param {string} props.initialPostalCode - Initial postal code (from OCR)
 * @param {Function} props.onAddressChange - Callback when address changes
 */
export default function PhilippineAddressFields({
  form,
  required = false,
  disabled = false,
  initialProvince = '',
  initialCity = '',
  initialBarangay = '',
  initialStreet = '',
  initialPostalCode = '',
  onAddressChange,
}) {
  // Data states
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [barangays, setBarangays] = useState([])
  
  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)
  
  // Selected values
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)

  // Load provinces on mount
  useEffect(() => {
    loadProvinces()
  }, [])

  // Auto-match OCR values when provinces load
  useEffect(() => {
    if (provinces.length > 0 && initialProvince) {
      autoMatchProvince(initialProvince)
    }
  }, [provinces, initialProvince])

  // Auto-match city when cities load
  useEffect(() => {
    if (cities.length > 0 && initialCity) {
      autoMatchCity(initialCity)
    }
  }, [cities, initialCity])

  // Auto-match barangay when barangays load
  useEffect(() => {
    if (barangays.length > 0 && initialBarangay) {
      autoMatchBarangay(initialBarangay)
    }
  }, [barangays, initialBarangay])

  // Load provinces
  const loadProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const data = await fetchProvinces()
      setProvinces(data)
    } catch (error) {
      console.error('Failed to load provinces:', error)
    } finally {
      setLoadingProvinces(false)
    }
  }

  // Load cities for a province
  const loadCities = async (provinceCode) => {
    if (!provinceCode) {
      setCities([])
      return
    }
    
    setLoadingCities(true)
    try {
      const data = await fetchCitiesMunicipalities(provinceCode)
      setCities(data)
    } catch (error) {
      console.error('Failed to load cities:', error)
    } finally {
      setLoadingCities(false)
    }
  }

  // Load barangays for a city
  const loadBarangays = async (cityCode) => {
    if (!cityCode) {
      setBarangays([])
      return
    }
    
    setLoadingBarangays(true)
    try {
      const data = await fetchBarangays(cityCode)
      setBarangays(data)
    } catch (error) {
      console.error('Failed to load barangays:', error)
    } finally {
      setLoadingBarangays(false)
    }
  }

  // Auto-match province from OCR text
  const autoMatchProvince = async (provinceName) => {
    const match = await findProvinceByName(provinceName)
    if (match) {
      console.log(`Province matched: "${provinceName}" → "${match.name}"`)
      setSelectedProvince(match.code)
      form.setFieldValue('province', match.code)
      form.setFieldValue('provinceName', match.name)
      loadCities(match.code)
    } else {
      console.log(`Province not matched: "${provinceName}" - user needs to select manually`)
    }
  }

  // Auto-match city from OCR text
  const autoMatchCity = async (cityName) => {
    if (!selectedProvince) return
    
    // Clean up city name - handle common OCR issues
    let cleanCityName = cityName
      .replace(/GITY/gi, 'CITY')  // G -> C
      .replace(/ClTY/gi, 'CITY')  // l -> I
      .trim()
    
    // Handle partial city names (e.g., "Carlos City" should match "San Carlos City")
    const match = await findCityByName(cleanCityName, selectedProvince)
    if (match) {
      console.log(`City matched: "${cityName}" → "${match.name}"`)
      setSelectedCity(match.code)
      form.setFieldValue('city', match.code)
      form.setFieldValue('cityName', match.name)
      loadBarangays(match.code)
    } else {
      console.log(`City not matched: "${cityName}" - user needs to select manually`)
    }
  }

  // Auto-match barangay from OCR text
  const autoMatchBarangay = async (barangayName) => {
    if (!selectedCity) return
    const match = await findBarangayByName(barangayName, selectedCity)
    if (match) {
      console.log(`Barangay matched: "${barangayName}" → "${match.name}"`)
      form.setFieldValue('barangay', match.code)
      form.setFieldValue('barangayName', match.name)
    } else {
      console.log(`Barangay not matched: "${barangayName}" - user needs to select manually`)
    }
  }

  // Handle province change
  const handleProvinceChange = (value, option) => {
    setSelectedProvince(value)
    setSelectedCity(null)
    setCities([])
    setBarangays([])
    
    // Clear dependent fields
    form.setFieldValue('city', undefined)
    form.setFieldValue('cityName', undefined)
    form.setFieldValue('barangay', undefined)
    form.setFieldValue('barangayName', undefined)
    
    // Set province name for display/storage
    if (option) {
      form.setFieldValue('provinceName', option.children)
    }
    
    // Load cities for the selected province
    if (value) {
      loadCities(value)
    }
    
    onAddressChange?.()
  }

  // Handle city change
  const handleCityChange = (value, option) => {
    setSelectedCity(value)
    setBarangays([])
    
    // Clear dependent field
    form.setFieldValue('barangay', undefined)
    form.setFieldValue('barangayName', undefined)
    
    // Set city name for display/storage
    if (option) {
      form.setFieldValue('cityName', option.children)
    }
    
    // Load barangays for the selected city
    if (value) {
      loadBarangays(value)
    }
    
    onAddressChange?.()
  }

  // Handle barangay change
  const handleBarangayChange = (value, option) => {
    // Set barangay name for display/storage
    if (option) {
      form.setFieldValue('barangayName', option.children)
    }
    
    onAddressChange?.()
  }

  // Filter option for search
  const filterOption = (input, option) => {
    return (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
  }

  return (
    <>
      {/* Street Address - Free text */}
      <Col span={24}>
        <Form.Item
          name="streetAddress"
          label="House/Bldg No. & Street"
          initialValue={initialStreet}
          rules={required ? [{ required: true, message: 'Please enter house/building no. & street' }] : []}
        >
          <Input 
            placeholder="e.g., 133 Roxas Boulevard" 
            disabled={disabled}
          />
        </Form.Item>
      </Col>

      {/* Province Select */}
      <Col span={12}>
        <Form.Item
          name="province"
          label="Province"
          rules={required ? [{ required: true, message: 'Please select province' }] : []}
        >
          <Select
            showSearch
            placeholder="Select Province"
            loading={loadingProvinces}
            disabled={disabled || loadingProvinces}
            onChange={handleProvinceChange}
            filterOption={filterOption}
            notFoundContent={loadingProvinces ? <Spin size="small" /> : 'No provinces found'}
          >
            {provinces.map((province) => (
              <Option key={province.code} value={province.code}>
                {province.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        {/* Hidden field to store province name */}
        <Form.Item name="provinceName" hidden>
          <Input />
        </Form.Item>
      </Col>

      {/* City/Municipality Select */}
      <Col span={12}>
        <Form.Item
          name="city"
          label="City/Municipality"
          rules={required ? [{ required: true, message: 'Please select city/municipality' }] : []}
        >
          <Select
            showSearch
            placeholder={selectedProvince ? "Select City/Municipality" : "Select province first"}
            loading={loadingCities}
            disabled={disabled || !selectedProvince || loadingCities}
            onChange={handleCityChange}
            filterOption={filterOption}
            notFoundContent={
              loadingCities ? <Spin size="small" /> : 
              !selectedProvince ? 'Select province first' : 
              'No cities found'
            }
          >
            {cities.map((city) => (
              <Option key={city.code} value={city.code}>
                {city.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        {/* Hidden field to store city name */}
        <Form.Item name="cityName" hidden>
          <Input />
        </Form.Item>
      </Col>

      {/* Barangay Select */}
      <Col span={12}>
        <Form.Item
          name="barangay"
          label="Barangay"
          rules={required ? [{ required: true, message: 'Please select barangay' }] : []}
        >
          <Select
            showSearch
            placeholder={selectedCity ? "Select Barangay" : "Select city first"}
            loading={loadingBarangays}
            disabled={disabled || !selectedCity || loadingBarangays}
            onChange={handleBarangayChange}
            filterOption={filterOption}
            notFoundContent={
              loadingBarangays ? <Spin size="small" /> : 
              !selectedCity ? 'Select city first' : 
              'No barangays found'
            }
          >
            {barangays.map((barangay) => (
              <Option key={barangay.code} value={barangay.code}>
                {barangay.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        {/* Hidden field to store barangay name */}
        <Form.Item name="barangayName" hidden>
          <Input />
        </Form.Item>
      </Col>

      {/* Postal Code */}
      <Col span={12}>
        <Form.Item
          name="postalCode"
          label="Postal Code"
          initialValue={initialPostalCode}
          rules={[
            ...(required ? [{ required: true, message: 'Please enter postal code' }] : []),
            { pattern: /^\d{4}$/, message: 'Postal code must be 4 digits' }
          ]}
        >
          <Input 
            placeholder="e.g., 2420" 
            maxLength={4}
            disabled={disabled}
          />
        </Form.Item>
      </Col>
    </>
  )
}
