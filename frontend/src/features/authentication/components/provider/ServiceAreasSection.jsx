import React from 'react'
import { Form, Card, Flex, Select, Typography, Input, Button } from 'antd'
import { serviceAreasRules, createServiceAreasSupportedRule } from '@/features/authentication/validations'

function ProviderServiceAreaRow({ name, rest, form, remove, activeAreas, loading, disableAll }) {
  const province = Form.useWatch(['serviceAreasGroups', name, 'province'], form)

  const provincesOptions = React.useMemo(() => {
    return (Array.isArray(activeAreas) ? activeAreas : [])
      .map((grp) => ({ label: grp?.province || '', value: grp?.province || '' }))
      .filter((opt) => !!opt.label && !!opt.value)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [activeAreas])

  const cityOptions = React.useMemo(() => {
    const norm = String(province || '').trim().toLowerCase()
    const grp = (Array.isArray(activeAreas) ? activeAreas : []).find((g) => String(g?.province || '').trim().toLowerCase() === norm)
    const cities = Array.isArray(grp?.cities) ? grp.cities : []
    return cities
      .map((n) => ({ label: String(n || ''), value: String(n || '') }))
      .filter((opt) => !!opt.label && !!opt.value)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }, [activeAreas, province])

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Flex gap="small" wrap="wrap">
        <Form.Item
          {...rest}
          name={[name, 'province']}
          label="Province"
          rules={[
            { required: true, message: 'Select province' },
            {
              validator: (_, value) => {
                const all = form.getFieldValue('serviceAreasGroups') || []
                const norm = String(value || '').trim().toLowerCase()
                if (!norm) return Promise.resolve()
                const dup = all.some((g, idx) => idx !== name && String(g?.province || '').trim().toLowerCase() === norm)
                if (dup) return Promise.reject(new Error('Province already selected'))
                return Promise.resolve()
              },
            },
          ]}
          style={{ minWidth: 320, width: 380 }}
        >
          <Select
            showSearch
            placeholder="Select province"
            allowClear
            options={provincesOptions}
            loading={loading}
            disabled={disableAll}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Flex>
      <Flex gap="small" wrap="wrap">
        <Form.Item
          {...rest}
          name={[name, 'cities']}
          label="Cities"
          rules={[{ required: true, message: 'Select one or more cities' }]}
          style={{ minWidth: 320, width: 380 }}
        >
          <Select
            mode="multiple"
            placeholder="Select cities from chosen province"
            options={cityOptions}
            loading={loading}
            disabled={disableAll || !province}
            allowClear
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Flex align="end" style={{ marginLeft: 8 }}>
          <Button danger onClick={() => remove(name)} disabled={disableAll}>Remove Province</Button>
        </Flex>
      </Flex>
    </Card>
  )
}

export default function ServiceAreasSection({ form, activeAreas, serviceAreasLoading, allActiveCities }) {
  return (
    <>
      <Typography.Text>Service Areas</Typography.Text>
      {activeAreas.length === 0 && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          No active supported areas available
        </Typography.Paragraph>
      )}
      <Form.List name="serviceAreasGroups">
        {(fields, { add, remove }) => (
          <Card size="small" variant="outlined" style={{ background: '#fafafa', marginBottom: 8 }}>
            {fields.map(({ key, name, ...rest }) => (
              <ProviderServiceAreaRow
                key={key}
                name={name}
                rest={rest}
                form={form}
                remove={remove}
                activeAreas={activeAreas}
                loading={serviceAreasLoading}
                disableAll={activeAreas.length === 0}
              />
            ))}
            <Flex justify="start" gap="small">
              <Button onClick={() => add({ province: undefined, cities: [] })} disabled={serviceAreasLoading || activeAreas.length === 0}>
                Add Province
              </Button>
            </Flex>
          </Card>
        )}
      </Form.List>

      <Form.Item
        name="serviceAreas"
        hidden
        rules={[
          ...serviceAreasRules,
          createServiceAreasSupportedRule(allActiveCities),
        ]}
      >
        <Input type="hidden" />
      </Form.Item>
    </>
  )
}