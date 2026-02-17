/**
 * Lab Exam Types for Occupational Permits
 *
 * Defines the required laboratory examinations based on whether the
 * applicant is a food handler or non-food worker.
 */

const LAB_EXAM_TYPES = {
  urinalysis: { value: 'urinalysis', label: 'Urinalysis' },
  fecalysis: { value: 'fecalysis', label: 'Fecalysis' },
  hepa_b: { value: 'hepa_b', label: 'Hepatitis B Screening' },
  xray: { value: 'xray', label: 'Chest X-Ray' },
  drug_test: { value: 'drug_test', label: 'Drug Test' },
}

// Lab exams required for food handlers
const FOOD_HANDLER_EXAMS = [
  LAB_EXAM_TYPES.urinalysis,
  LAB_EXAM_TYPES.fecalysis,
  LAB_EXAM_TYPES.hepa_b,
  LAB_EXAM_TYPES.xray,
]

// Lab exams required for non-food workers
const NON_FOOD_EXAMS = [
  LAB_EXAM_TYPES.drug_test,
  LAB_EXAM_TYPES.xray,
]

// All unique lab exam type values for MongoDB enum / validation
const LAB_EXAM_TYPE_VALUES = Object.keys(LAB_EXAM_TYPES)

// Values only arrays
const FOOD_HANDLER_EXAM_VALUES = FOOD_HANDLER_EXAMS.map((e) => e.value)
const NON_FOOD_EXAM_VALUES = NON_FOOD_EXAMS.map((e) => e.value)

/**
 * Get the applicable lab exams based on handler type
 * @param {boolean} isFoodHandler - true for food handler, false for non-food
 * @returns {Array} - Array of exam type objects
 */
function getExamsForHandlerType(isFoodHandler) {
  return isFoodHandler ? FOOD_HANDLER_EXAMS : NON_FOOD_EXAMS
}

module.exports = {
  LAB_EXAM_TYPES,
  LAB_EXAM_TYPE_VALUES,
  FOOD_HANDLER_EXAMS,
  FOOD_HANDLER_EXAM_VALUES,
  NON_FOOD_EXAMS,
  NON_FOOD_EXAM_VALUES,
  getExamsForHandlerType,
}
