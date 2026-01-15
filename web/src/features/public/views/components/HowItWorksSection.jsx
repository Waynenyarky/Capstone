import { Typography, Steps, Grid } from 'antd'
import { UserAddOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function HowItWorksSection() {
  const screens = useBreakpoint()

  return (
    <div style={{ padding: screens.md ? '80px 24px' : '40px 24px', background: '#fff', textAlign: 'center' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 16 }}>How It Works</Title>
        <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 60, maxWidth: 600, margin: '0 auto 60px' }}>
          Get your business permit in three simple steps. Our streamlined process ensures quick turnaround times.
        </Paragraph>
        
        <Steps 
          current={-1} 
          labelPlacement="vertical"
          items={[
            {
              title: 'Create Account',
              description: 'Register your business profile securely.',
              icon: <UserAddOutlined style={{ fontSize: 32 }} />,
            },
            {
              title: 'Submit Application',
              description: 'Upload documents and submit details.',
              icon: <FileTextOutlined style={{ fontSize: 32 }} />,
            },
            {
              title: 'Receive Permit',
              description: 'Get approved and download your permit.',
              icon: <CheckCircleOutlined style={{ fontSize: 32 }} />,
            },
          ]}
        />
      </div>
    </div>
  )
}
