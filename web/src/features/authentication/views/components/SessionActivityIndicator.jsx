import { Tag, Tooltip } from 'antd'

export default function SessionActivityIndicator({ lastActivityAt }) {
  if (!lastActivityAt) return null
  const date = new Date(lastActivityAt)
  return (
    <Tooltip title={`Last activity: ${date.toLocaleString()}`}>
      <Tag color="blue">Active</Tag>
    </Tooltip>
  )
}
