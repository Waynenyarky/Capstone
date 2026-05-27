import React from 'react'
import DynamicFaqSection from '@/shared/components/DynamicFaqSection'

export default function FaqSection() {
  return <div id="faq-section" style={{ scrollMarginTop: 80 }}><DynamicFaqSection slotId="landing-page-faq" /></div>
}
