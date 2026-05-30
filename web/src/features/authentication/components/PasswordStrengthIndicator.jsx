import { Progress, Space, Typography, theme } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { getPasswordStrength, validatePasswordRequirements, getRequirementLabels } from '@/shared/utils/passwordStrength.js'

const { Text } = Typography
const { useToken } = theme

/**
 * Reusable password strength + requirements indicator.
 * Always visible; shows weak/empty state when value is empty.
 */
export default function PasswordStrengthIndicator({ value = '', minLength = 8 }) {
  const { token } = useToken()
  const strength = getPasswordStrength(value, {
    colorError: token.colorError,
    colorWarning: token.colorWarning,
    colorSuccess: token.colorSuccess,
  })
  const validation = validatePasswordRequirements(value, { minLength })
  const requirementLabels = getRequirementLabels(minLength)

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
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 14 }} />
            ) : (
              <CloseCircleOutlined style={{ color: token.colorBorder, fontSize: 14 }} />
            )}
            <Text
              style={{
                fontSize: 12,
                color: passed ? token.colorSuccess : token.colorTextTertiary,
              }}
            >
              {requirementLabels[key]}
            </Text>
          </div>
        ))}
      </Space>
    </div>
  )
}
