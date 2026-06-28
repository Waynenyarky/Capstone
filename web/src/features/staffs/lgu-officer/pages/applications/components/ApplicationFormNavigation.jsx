import FormNavigation from '@/shared/components/FormNavigation'

export default function ApplicationFormNavigation({ mainNavItems, formNavItems, activeTab, onTabChange, getSectionStatus, isMobile = false }) {
  // Adapt getSectionStatus(sectionIdx) to getItemStatus(item) interface
  const getItemStatus = (item) => {
    if (!getSectionStatus) return null
    const sectionIdx = parseInt(String(item.key).replace('section-', ''), 10)
    return getSectionStatus(sectionIdx)
  }

  return (
    <FormNavigation
      mainNavItems={mainNavItems}
      formNavItems={formNavItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      getItemStatus={getItemStatus}
      isMobile={isMobile}
    />
  )
}
