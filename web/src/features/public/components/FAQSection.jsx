import { Collapse, Typography, Grid } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

const { Title } = Typography
const { Panel } = Collapse
const { useBreakpoint } = Grid

export default function FAQSection() {
  const screens = useBreakpoint()

  const faqs = [
    {
      question: "What are the requirements for a new business permit?",
      answer: "Common requirements include Barangay Clearance, DTI/SEC Registration, Lease Contract, and Fire Safety Inspection Certificate. Specific requirements may vary by business type."
    },
    {
      question: "How long does the renewal process take?",
      answer: "With the online system, renewals can typically be processed within 1-3 working days, provided all documents are complete and fees are paid."
    },
    {
      question: "Can I pay my permit fees online?",
      answer: "Yes, we are integrating digital payment gateways. Currently, you can view your assessment online and pay at the City Treasurer's Office or authorized payment centers."
    },
    {
      question: "What if I forget my password?",
      answer: "You can click the 'Forgot Password' link on the login page to receive a password reset link via your registered email address."
    }
  ]

  return (
    <div style={{ background: '#f5f7fa', padding: screens.md ? '60px 0' : '40px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2}>Frequently Asked Questions</Title>
        </div>
        
        <Collapse 
          accordion 
          bordered={false} 
          expandIconPosition="end"
          style={{ background: 'transparent' }}
        >
          {faqs.map((faq, index) => (
            <Panel 
              header={<span style={{ fontWeight: 600, fontSize: 16 }}>{faq.question}</span>} 
              key={index}
              extra={<QuestionCircleOutlined style={{ color: '#1890ff' }} />}
              style={{ 
                marginBottom: 16, 
                background: '#fff', 
                borderRadius: 8, 
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>{faq.answer}</p>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  )
}
