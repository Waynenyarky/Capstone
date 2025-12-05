import React from 'react'
import { Card, Form, Select, Button, Flex } from 'antd'
import { useCitiesOptions } from "@/features/admin/areas/hooks/useCitiesOptions.js"
import { provinceRules, citiesRules } from "@/features/admin/areas/validations/supportedAreaRules.js"

export default function ProvinceCitiesRow({ name, rest, form, remove, provincesOptions, loadingProvinces, existingProvincesSet, canRemove = true }) {
  const province = Form.useWatch(['areas', name, 'province'], form)
  const { options: cityOptions, loading: loadingCities } = useCitiesOptions(province)

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
        <Form.Item
          {...rest}
          name={[name, 'province']}
          label="Province"
          rules={provinceRules({ form, areaIndex: name, existingProvincesSet })}
        >
          <Select
            showSearch
            placeholder="Select province"
            allowClear
            options={provincesOptions}
            loading={loadingProvinces}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item
          {...rest}
          name={[name, 'cities']}
          label="Cities"
          rules={citiesRules()}
        >
          <Select
            mode="multiple"
            placeholder="Select cities from chosen province"
            options={cityOptions}
            loading={loadingCities}
            disabled={!province}
            allowClear
            style={{ width: '100%' }}
          />
        </Form.Item>
        {canRemove && (
          <Flex align="end" style={{ marginLeft: 8 }}>
            <Button danger onClick={() => remove(name)}>Remove Province</Button>
          </Flex>
        )}
    </Card>
  )
}