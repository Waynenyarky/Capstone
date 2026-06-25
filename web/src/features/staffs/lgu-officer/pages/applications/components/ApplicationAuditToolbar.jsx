import { Button, Input } from 'antd'
import { SearchOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'

export default function ApplicationAuditToolbar({
  searchValue,
  onSearchChange,
  onExport,
  exportDisabled,
  onInfoClick,
  token,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <Input
        placeholder="Search by user, event type, or content"
        prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
        allowClear
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Tooltip title="Download records">
        <Button
          icon={<DownloadOutlined />}
          onClick={onExport}
          disabled={exportDisabled}
          aria-label="Download records"
        />
      </Tooltip>
      <Tooltip title="About audit events">
        <Button
          icon={<InfoCircleOutlined />}
          onClick={onInfoClick}
          aria-label="About audit events"
        />
      </Tooltip>
    </div>
  )
}
