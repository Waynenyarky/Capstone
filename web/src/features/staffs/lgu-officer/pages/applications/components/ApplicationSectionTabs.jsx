import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import ApplicationSectionContent from './ApplicationSectionContent'
import LobReviewBlock from './ApplicationLobReviewBlock'
import { formatDate, formatBoolean, formatCurrency, formatNumber } from '../utils/formatters'

export function createSectionTabs(sections, lobSectionIndex, formDefLoading, formData, fieldReviewDecisions, isActiveReviewState, handleFieldDecision, handleSaveLob, token, savingLob, businessReg, application, setDocumentModal, isFinalState = false, isResubmit = false) {
  return sections.map((section, idx) => {
    const isLobSection = idx === lobSectionIndex
    return {
      key: `section-${idx}`,
      label: section.category || `Section ${idx + 1}`,
      children: (
        <div style={{ padding: 16, overflow: 'auto' }}>
          {formDefLoading ? (
            <LottieSpinner tip="Loading..." />
          ) : isLobSection ? (
            <LobReviewBlock
              formData={formData}
              fieldReviewDecisions={fieldReviewDecisions}
              onFieldDecision={isActiveReviewState ? handleFieldDecision : undefined}
              onSaveLob={isActiveReviewState ? handleSaveLob : undefined}
              token={token}
              saving={savingLob}
              primaryLineOfBusiness={businessReg.primaryLineOfBusiness}
              reviewLocked={!isActiveReviewState}
              isFinalState={isFinalState}
            />
          ) : (
            <ApplicationSectionContent
              section={section}
              sectionIdx={idx}
              formData={formData}
              documents={application?.documents || {}}
              token={token}
              isFinalState={isFinalState}
              formatDate={formatDate}
              formatBoolean={formatBoolean}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
              onViewDocument={({ url, label, type }) => setDocumentModal({ open: true, url, label, type })}
              primaryLineOfBusiness={businessReg.primaryLineOfBusiness}
              fieldReviewDecisions={fieldReviewDecisions}
              onFieldDecision={isActiveReviewState ? handleFieldDecision : undefined}
              reviewLocked={!isActiveReviewState}
              application={application}
              isResubmit={isResubmit}
            />
          )}
        </div>
      ),
    }
  })
}
