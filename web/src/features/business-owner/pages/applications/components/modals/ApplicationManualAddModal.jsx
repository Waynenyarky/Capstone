import { Modal, Select, Typography } from 'antd'
import { TAX_CODE_OPTIONS } from '../../../../utils/lobUtils.js'

const { Text } = Typography

export default function ManualAddModal({ open, onCancel, onOk, manualTaxCode, manualDetailedLine, onTaxCodeChange, onDetailedLineChange, detailedLineOptions }) {
  return (
    <Modal
      title="Add Line of Business"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Add"
      destroyOnHidden
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>Tax Code</Text>
          <Select
            placeholder="Select tax code"
            value={manualTaxCode}
            onChange={val => { onTaxCodeChange(val); onDetailedLineChange(null) }}
            options={TAX_CODE_OPTIONS}
            showSearch
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>Detailed Line of Business</Text>
          <Select
            placeholder={manualTaxCode ? 'Select line of business' : 'Select a tax code first'}
            value={manualDetailedLine}
            onChange={onDetailedLineChange}
            options={detailedLineOptions}
            disabled={!manualTaxCode}
            showSearch
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </Modal>
  )
}
