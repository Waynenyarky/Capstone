import { Button, Select } from 'antd'
import { DashboardOutlined, CheckCircleOutlined } from '@ant-design/icons'

export default function FormSectionTabs({
  visibleSections,
  sectionCompleteMap,
  activeSectionIndex,
  setActiveSectionIndex,
  formReadOnly,
  isMobile,
  token
}) {
  // Build select options with check marks
  const selectOptions = []

  // Add Overview option for mobile
  if (!formReadOnly) {
    selectOptions.push({
      value: -1,
      label: (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          Overview
        </span>
      ),
    })
  }

  // Add form sections
  visibleSections.forEach((section, idx) => {
    const isComplete = sectionCompleteMap[idx] === true
    selectOptions.push({
      value: idx,
      label: (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {!formReadOnly && (
            <CheckCircleOutlined
              style={{
                marginRight: 8,
                color: isComplete ? token.colorSuccess : token.colorTextDisabled,
                flexShrink: 0,
              }}
            />
          )}
          {section.category || `Section ${idx + 1}`}
        </span>
      ),
    })
  })

  return (
    <div
      style={{
        flexShrink: 0,
        width: isMobile ? '100%' : 250,
        minWidth: isMobile ? undefined : 220,
        borderRight: isMobile ? 'none' : `1px solid ${token.colorBorderSecondary}`,
        padding: isMobile ? 16 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 12 : 4,
        overflowY: isMobile ? 'visible' : 'auto',
      }}
    >
      {isMobile ? (
        // Mobile: Use Select dropdown for all tabs including Overview
        <Select
          value={activeSectionIndex}
          onChange={(val) => setActiveSectionIndex(val)}
          options={selectOptions}
          placeholder="Select a section"
          style={{ width: '100%' }}
        />
      ) : (
        // Desktop: Use buttons
        <>
          {/* Overview tab - only show for drafts and editable forms */}
          {!formReadOnly && (
            <Button
              key="overview"
              type={activeSectionIndex === -1 ? 'primary' : 'default'}
              onClick={() => setActiveSectionIndex(-1)}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                fontWeight: activeSectionIndex === -1 ? 600 : 400,
                whiteSpace: 'normal',
                height: 'auto',
                minHeight: 40,
                padding: '8px 12px',
                lineHeight: 1.4,
                marginBottom: 8,
              }}
            >
              <DashboardOutlined style={{ marginRight: 8 }} />
              Overview
            </Button>
          )}
          {/* Desktop: Use buttons for form sections */}
          {visibleSections.map((section, idx) => {
          const isComplete = sectionCompleteMap[idx] === true
          return (
            <Button
              key={idx}
              type={idx === activeSectionIndex ? 'primary' : 'default'}
              onClick={() => setActiveSectionIndex(idx)}
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                fontWeight: idx === activeSectionIndex ? 600 : 400,
                whiteSpace: 'normal',
                height: 'auto',
                minHeight: 40,
                padding: '8px 12px',
                lineHeight: 1.4,
              }}
            >
              {!formReadOnly && (
                <CheckCircleOutlined
                  style={{
                    marginRight: 8,
                    color: idx === activeSectionIndex
                      ? (isComplete ? '#fff' : 'rgba(255, 255, 255, 0.65)')
                      : (isComplete ? token.colorSuccess : token.colorTextDisabled),
                    flexShrink: 0,
                  }}
                />
              )}
              {section.category || `Section ${idx + 1}`}
            </Button>
          )
        })}
        </>
      )}
    </div>
  )
}
