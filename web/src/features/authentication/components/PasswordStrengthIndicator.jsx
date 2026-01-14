import { Progress, Space, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getPasswordStrength, validatePasswordRequirements, REQUIREMENT_LABELS } from '@/shared/utils/passwordStrength.js'

const { Text } = Typography

/**
 * Reusable password strength + requirements indicator
 */
export default function PasswordStrengthIndicator({ value = '' }) {
  const strength = getPasswordStrength(value)
  const validation = validatePasswordRequirements(value)

  if (!value) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Password Strength: </Text>
        <Text strong style={{ color: strength.color, fontSize: 12 }}>
          {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
        </Text>
      </div>
      <Progress
        percent={(strength.score / 4) * 100}
        showInfo={false}
        strokeColor={strength.color}
        style={{ marginBottom: 12 }}
      />
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {Object.entries(validation.checks).map(([key, passed]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {passed ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 14 }} />
            )}
            <Text
              style={{
                fontSize: 12,
                color: passed ? '#52c41a' : '#8c8c8c',
              }}
            >
              {REQUIREMENT_LABELS[key]}
            </Text>
          </div>
        ))}
      </Space>
    </div>
  )
}
