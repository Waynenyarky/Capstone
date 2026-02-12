BizClear: A Blockchain-Audited Business Compliance Portal for Alaminos City with AI Document Validator

## 1. Problem Statement

LGU administrators in Alaminos City need efficient business permit processing with AI-assisted validation and tamper-proof audit records. Manual form validation is error-prone, and records must be verifiable.

## 2. Core Feature

A combined prototype covering:
- **AI Document Validation:** Traditional ML + Gemini for unified business permit form validation (see [ai_validation_prototype_plan.md](ai_validation_prototype_plan.md))
- **Blockchain Audit:** Immutable hash logging and verification for permit and inspection records (see [blockchain_audit_prototype_plan.md](blockchain_audit_prototype_plan.md))

Form definition management (admin UI for requirement templates) remains a supporting feature.

## 3. User Story and Acceptance Criteria

As an LGU administrator, I want AI-validated permit applications and blockchain-secured audit trails so that processing is faster and records are tamper-proof.

**Acceptance criteria:**
- AI validates form data (missing fields, PSIC, address, consistency)
- Audit events are logged as hashes on blockchain
- Hashes can be verified for tamper detection
## 4. Simple Diagram

See ai_validation_prototype_plan.md and blockchain_audit_prototype_plan.md for detailed diagrams.

## 5. Tools/APIs

- **Frontend:** React 18, Vite, Ant Design
- **Backend:** Node.js, Express microservices
- **Storage & Blockchain:** MongoDB, IPFS, Ganache
- **AI / ML:** scikit-learn, XGBoost, Google Gemini
- **Environment:** Docker, GitHub Codespaces

## 6. Test Plan

- **AI Validation:** Valid form → VALID; missing fields → INVALID with errors
- **Blockchain:** Log hash → Verify → true; tampered data → Verify → false
- **Form Definitions:** Admin creates form → draft or published

## 7. Risks & Mitigations

- **Risk 1:** IPFS downtime
  - **Mitigation:** Uploaded files fall back to local storage until it is up again
- **Risk 2:** Gemini API rate limit
  - **Mitigation:** ML-only path; cached responses for demo
- **Risk 3:** Scope creep
  - **Mitigation:** Define a "fallback" MVP

8. Roles & Timeline (Sprint 1)
Roles
Architect: Data model design, API routes, IPFS integration, blockchain audit hooks
Builder: React admin UI, form editor, version/draft management, responsive views
Validator: Test cases, seed data verification against Philippine policies

Timeline:
Day 1 - Schema, API routes, and core admin UI layout (two-panel view, navigation, form type selector)
Day 2 - Form editor (sections, fields, 10 field types, downloadable form uploads), draft/publish workflow, modals
Day 3 - Testing (backend + frontend), seed data, bug fixes, and demo preparation
