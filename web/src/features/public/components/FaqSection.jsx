import React from 'react'
import { Typography, Grid, theme, Collapse } from 'antd'
import { FAQ_ITEMS } from '@/features/public/constants/landing.constants.js'

const { Title, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function FaqSection() {
  const { token } = theme.useToken()
  const screens = useBreakpoint()

  const faqItems = FAQ_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    children: (
      <Paragraph style={{ marginBottom: 0 }}>
        {item.answer}
      </Paragraph>
    ),
  }))

  return (
    <section id="faq-section" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      <div
        style={{
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: screens.md ? '24px 28px' : '18px 14px',
          background: token.colorBgLayout,
        }}
      >
        <Title
          level={4}
          style={{
            marginTop: 0,
            marginBottom: 8,
            textAlign: screens.md ? 'left' : 'center',
          }}
        >
          Frequently Asked Questions
        </Title>
        <Paragraph
          type="secondary"
          style={{
            marginBottom: 16,
            textAlign: screens.md ? 'left' : 'center',
          }}
        >
          Quick answers about application timelines, updates, and submission best practices.
        </Paragraph>
        <Collapse
          items={faqItems}
          defaultActiveKey={['faq-1']}
          style={{ background: token.colorBgContainer, textAlign: 'left' }}
        />
      </div>
    </section>
  )
}
