/**
 * Use Case: Conduct Inspection
 * Business logic for conducting inspections
 * Domain layer - no dependencies
 */
export class ConductInspectionUseCase {
  constructor({ inspectionRepository }) {
    this.inspectionRepository = inspectionRepository
  }

  async execute({ inspectionId, findings, notes, conductedDate }) {
    if (!inspectionId) {
      throw new Error('Inspection ID is required')
    }

    if (!findings || !Array.isArray(findings)) {
      throw new Error('Findings array is required')
    }

    try {
      const inspection = await this.inspectionRepository.conduct({
        inspectionId,
        findings,
        notes,
        conductedDate: conductedDate || new Date()
      })
      return inspection
    } catch (error) {
      throw new Error(`Failed to conduct inspection: ${error.message}`)
    }
  }
}
