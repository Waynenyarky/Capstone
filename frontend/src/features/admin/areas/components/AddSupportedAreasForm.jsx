import React, { useMemo } from 'react'
import { Card, Form, Button, Flex, Typography } from 'antd'
import { useAddSupportedAreas } from "@/features/admin/areas/hooks/useAddSupportedAreas.js"
import { useProvincesOptions } from "@/features/admin/areas/hooks/useProvincesOptions.js"
import ProvinceCitiesRow from "@/features/admin/areas/molecules/ProvinceCitiesRow.jsx"
import AreasChangesDescription from "@/features/admin/areas/molecules/AreasChangesDescription.jsx"
import { buildExistingProvincesSet, buildActiveByProvinceMap, normalizeAreaGroups } from "@/features/admin/areas/lib/supportedAreasUtils.js"
import { useConfirmAreasSave } from "@/features/admin/areas"

export default function AddSupportedAreasForm() {
  const { areasByProvince, isLoading, saveAreas } = useAddSupportedAreas()
  const [form] = Form.useForm()
  const [pending, setPending] = React.useState(false)
  const { options: provincesOptions, loading: loadingProvinces } = useProvincesOptions()
  const confirmAreasSave = useConfirmAreasSave()

  // Track existing provinces (lowercased) to prevent adding duplicates
  const existingProvincesSet = useMemo(() => buildExistingProvincesSet(areasByProvince), [areasByProvince])

  const handleSave = async (vals) => {
    const groups = Array.isArray(vals?.areas) ? vals.areas : []
    const activeByProvince = buildActiveByProvinceMap(areasByProvince)
    const normalizedGroups = normalizeAreaGroups(groups, activeByProvince)
    const content = <AreasChangesDescription groups={groups} />
    return confirmAreasSave({
      content,
      normalizedGroups,
      existingProvincesSet,
      areasByProvince,
      saveAreas,
      form,
      setPending,
    })
  }

  return (
    <Card title="Add Supported Areas">
      <Typography.Paragraph type="secondary">
        Configure supported provinces and their cities. Click "Add Province" to select a province and its supported cities.
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ areas: [{ province: undefined, cities: [] }] }}
        onFinish={handleSave}
      >
        <Form.List name="areas">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <ProvinceCitiesRow
                  key={key}
                  name={name}
                  rest={rest}
                  form={form}
                  remove={remove}
                  provincesOptions={provincesOptions}
                  loadingProvinces={loadingProvinces}
                  existingProvincesSet={existingProvincesSet}
                  canRemove={name > 0}
                />
              ))}
              <Flex justify="start" gap="small">
                <Button onClick={() => add({ province: undefined, cities: [] })}>Add Another Province</Button>
              </Flex>
            </>
          )}
        </Form.List>
        <Flex justify="end" gap="small">
          <Button type="primary" htmlType="submit" loading={pending} disabled={pending || isLoading}>Continue</Button>
        </Flex>
      </Form>
    </Card>
  )
}