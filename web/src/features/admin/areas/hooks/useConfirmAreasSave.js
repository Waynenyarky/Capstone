import { App } from 'antd'

// Confirm and persist supported areas changes
export default function useConfirmAreasSave() {
  const { modal } = App.useApp()
  return ({ content, normalizedGroups, existingProvincesSet, areasByProvince, saveAreas, form, setPending }) => {
    return new Promise((resolve) => {
      modal.confirm({
        title: 'Confirm Area Additions',
        content,
        centered: true,
        okText: 'Save',
        cancelText: 'Cancel',
        onOk: async () => {
          try {
            setPending?.(true)
            const filteredNew = normalizedGroups.filter((g) => !existingProvincesSet.has(String(g.province || '').trim().toLowerCase()))
            const mergedAreas = [
              ...(Array.isArray(areasByProvince) ? areasByProvince : []),
              ...filteredNew,
            ]
            const result = await saveAreas(mergedAreas)
            if (result?.saved) {
              form?.resetFields?.()
            }
          } finally {
            setPending?.(false)
            resolve(true)
          }
        },
        onCancel: () => resolve(false),
      })
    })
  }
}