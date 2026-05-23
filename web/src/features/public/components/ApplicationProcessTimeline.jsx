import { Typography, theme, Steps, Grid, Space } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  SearchOutlined,
  SafetyOutlined,
  TrophyOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

const PROCESS_STEPS = [
  {
    title: 'Create Account',
    description: 'Register your business account to get started with the application process.',
    icon: <UserOutlined />,
  },
  {
    title: 'Submit Requirements',
    description: 'Upload and submit all required documents for your business permit application.',
    icon: <FileTextOutlined />,
  },
  {
    title: 'Initial Verification',
    description: 'BPLO staff reviews your submitted documents for completeness and accuracy.',
    icon: <CheckCircleOutlined />,
  },
  {
    title: 'Assessment & Fees',
    description: 'Your application is assessed and applicable fees are calculated based on business type.',
    icon: <DollarOutlined />,
  },
  {
    title: 'Inspection',
    description: 'If applicable, an on-site inspection is scheduled to verify business location compliance.',
    icon: <SearchOutlined />,
    optional: true,
  },
  {
    title: 'Approval',
    description: 'Upon successful verification and payment, your permit application is approved.',
    icon: <SafetyOutlined />,
  },
  {
    title: 'Permit Release',
    description: 'Your business permit is issued and ready for download or pickup.',
    icon: <TrophyOutlined />,
  },
]

export default function ApplicationProcessTimeline() {
  const screens = useBreakpoint()
  const { token } = theme.useToken()

  const stepItems = PROCESS_STEPS.map((step, index) => ({
    key: index,
    title: (
      <Space direction="vertical" size={4}>
        <Text strong style={{ fontSize: '14px' }}>
          {step.title}
          {step.optional && (
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
              (if applicable)
            </Text>
          )}
        </Text>
      </Space>
    ),
    description: (
      <Text type="secondary" style={{ fontSize: '13px', lineHeight: 1.5 }}>
        {step.description}
      </Text>
    ),
    icon: step.icon,
  }))

  return (
    <section id="application-process-timeline" style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: screens.md ? '0 20px' : '0 16px' }}>
      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '32px 36px' : '24px 20px',
          background: token.colorBgLayout,
        }}
      >
        <Title
          level={4}
          style={{
            marginTop: 0,
            marginBottom: screens.md ? 12 : 8,
            textAlign: screens.md ? 'left' : 'center',
            fontSize: screens.md ? 20 : 18,
          }}
        >
          Application Process Timeline
        </Title>
        <Paragraph
          type="secondary"
          style={{
            marginBottom: screens.md ? 24 : 16,
            textAlign: screens.md ? 'left' : 'center',
            fontSize: screens.md ? 14 : 13,
            lineHeight: 1.6,
          }}
        >
          Understand the step-by-step process before registering your business.
        </Paragraph>
        <Steps
          direction={screens.md ? 'horizontal' : 'vertical'}
          current={-1}
          items={stepItems}
          style={{ textAlign: 'left' }}
          size={screens.md ? 'default' : 'small'}
        />
      </div>
    </section>
  )
}
