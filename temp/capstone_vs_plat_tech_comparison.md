# Comparison: Capstone Document vs Platform Tech Manuscript (with Immediate Requirements)

This document compares [temp/capstone_document.md](temp/capstone_document.md), [temp/plat_tech_old_manuscript.md](temp/plat_tech_old_manuscript.md), and [temp/Immediate_Requirements.md](temp/Immediate_Requirements.md) to surface differences and align with field findings.

---

## 1. Document Roles

| Document | Purpose |
|----------|--------|
| **capstone_document.md** | Full capstone thesis: research design, methodology, significance, scope, data gathering, respondent details, appendices (interview Q&As, observation form), definition of terms, references. |
| **plat_tech_old_manuscript.md** | Platform Technologies course deliverable: shorter, focused on how **AI** and **blockchain** work; sprint-based development (Sprint 1 AI, 2 Blockchain, 3 Web, 4 Mobile). |
| **Immediate_Requirements.md** | Field notes and requirements from BPLO visit (Alaminos City, officer Wilfredo Villena): actual workflows, forms, fees, inspections, renewals, retirement, appeals, AI/blockchain expectations, and to-dos. |

---

## 2. Methodology and Development Structure

| Aspect | Capstone document | Platform Tech manuscript |
|--------|-------------------|---------------------------|
| **Framework** | Kanban–XP hybrid; “phases” (no fixed sprints) | Agile; four **sprints** (AI → Blockchain → Web → Mobile) |
| **Phase 1** | Requirements gathering & field visit (BPLO interview, forms, observation) | Same idea under “Requirements Analysis” |
| **Phase 2** | **Prototype development**: (1) AI validation notebook (rule-based, 6 ML algorithms, Gemini), (2) Blockchain audit notebook (Gradio UI, Ganache) | **Sprint 1 (AI)** + **Sprint 2 (Blockchain)** with same technical content; Table 2.1 sprint overview |
| **Phase 3** | Core workflow implementation (registration, permit, inspection, fee, audit-service integration) | **Sprint 3 (Web)** |
| **Phase 4** | Security hardening (rate limit, X-API-Key, RBAC, sanitization, least-privilege audit) | Not a separate sprint; security is described in 2.6 Security Implementation |
| **Mobile** | Mentioned as feature (inspector mobile) | **Sprint 4 (Mobile)** explicitly |

**Difference:** Capstone uses “phases” and combines AI + blockchain in one prototype phase; Platform Tech uses “sprints” and separates Sprint 1 (AI) and Sprint 2 (Blockchain). Content is aligned; terminology differs by course.

---

## 3. AI: What It Does and How It Works

| Aspect | Capstone | Platform Tech manuscript | Immediate Requirements |
|--------|----------|---------------------------|-------------------------|
| **Primary use** | Document validation (completeness, inconsistency); LOB/tax code support via form | Same: document validation, LOB recommendation, managerial insights | **Unified form** validation; BPLO does **not** validate IDs; Manila offices verify later. AI should validate the **unified business permit form**, not IDs. Remove ID validation model. |
| **Tech** | Rule-based + traditional ML (SVM, RF, DT, LR, XGB, NN) + Gemini; Gradio UI | Rule-based + ML (e.g. TF-IDF + classifiers) + optional generative AI; LOB trained model + Gemini fallback | Use generative AI with expert-validated dataset; document prompts; Jupyter notebook prototype with interface; accuracy measure. |
| **Prototype** | AI validation notebook + Gradio UI | Sprint 1 deliverables; “how it works” in Table 2.1 and 2.5 | Jupyter notebook resembling actual model; tests; run instructions; validated dataset (even if not yet BPLO-validated). |

**Gap:** Immediate Requirements say BPLO does **not** validate IDs and that verification is done by Manila offices; AI should focus on the **unified form** (e.g. business activity, tax code, line of business). Both capstone and Platform Tech already emphasize “document completeness and inconsistency” and LOB; neither should claim ID validation as the main use. Manuscript is fine if “document” means the permit form; any mention of “ID validation” should be removed or reframed to unified form / business activity.

---

## 4. Blockchain: What It Does and How It Works

| Aspect | Capstone | Platform Tech manuscript | Immediate Requirements |
|--------|----------|---------------------------|-------------------------|
| **Role** | Audit trail: hash logging and verification on Ganache | Same: SHA-256 hashes on-chain; full records in DB; queue; verification endpoint | Audit logging; possibly multiple smart contracts (audit logs, document storage); working prototype with Ganache; tests; SHA-256; re-entrancy mitigation (e.g. only owner). |
| **Prototype** | Blockchain audit notebook with Gradio UI for logging/verifying hashes | Sprint 2; “how it works” in 2.5 and architecture 2.4 | Jupyter (or similar) notebook for audit feature; interface (e.g. upload file, see on IPFS / audit log). |

**Alignment:** Both documents and Immediate Requirements agree: hashes on-chain, full data off-chain, verification, queue. Manuscript is consistent. Capstone explicitly mentions Gradio UI; Platform Tech doesn’t need to unless you want to tie to the same prototype.

---

## 5. Workflow and BPLO Reality (Immediate Requirements vs Documents)

| Topic | Capstone / Platform Tech (current) | Immediate Requirements (BPLO reality) |
|-------|-------------------------------------|--------------------------------------|
| **Permit process** | General: application, encoding, inspections, payment | One **unified form**; officer verifies form → encodes to **integrated** system; ~20 min when no lines; only ID required from owner; officers create CTC, tax permits, etc. |
| **First step** | — | Owner must have a **record in PIS** (Personal Information System); officer creates it if not present. Then create permit using the unified form. |
| **Business activity** | Tax code, line of business, fees | **Dropdowns**: tax code (A–Z) → line of business → detailed line of business; determines fees. Need to research tax codes and detailed LOB. |
| **Renewal** | January; renewal form; late penalties | Every January; owner/rep with plate number; **financial statements** and other requirements; late: **25% of first quarter** as penalty + **2% monthly** interest. |
| **General permit** | — | Cooperative, association/foundation, chainsaw, firecracker stall, bazaar/vendors, cemetery stall, fish trap/bin/pond, etc.; separate requirement lists. |
| **Retirement** | — | Letter to city treasurer; business name, permit number, address, years active; inspectors verify business is retired. |
| **Abandoned business** | — | If no renewal by e.g. March, inspector visits; if business closed/not functional, BPLO reports “closed based on inspection.” Owner must settle penalties before new permit; new permit gets **new** permit number. |
| **Occupational permit** | — | **Per employee** (e.g. 5 employees = 5 forms); ~30 days (lab exams: urinalysis, fecalysis, Hepa-B, chest X-ray for food handlers; drug test, chest X-ray for non-food). |
| **Inspections** | Joint inspection, BFP/Sanitary/Zoning/Engineering | **After** permit; joint team (e.g. 4–5); one successful inspection → no more for the year; if issues, compliance period then re-inspection; non-compliance → penalty; repeated non-compliance → unannounced inspection → possible revocation. |
| **Violations / complaints** | — | Complainant goes to **barangay** first; if BPLO needed, barangay contacts BPLO; inspector visits. |
| **Appeals** | Appeal for mistakes | Owner can appeal officer/inspector mistakes (e.g. wrong violation); LGU manager may be alerted. |
| **Walk-in** | — | **Required**: walk-in supported; form filled → PIS check/create → encode to system. |
| **PIS / duplicate accounts** | — | PIS record required; need to **avoid duplicate accounts** (e.g. “already have permit/renewed” → link by email + code to existing PIS). |
| **Post-requirements** | — | **Renewal**: sanitary permit, building clearance, fire safety (30 working days or temp suspension). **New permit**: real property tax clearance, garbage fee, sanitary, zoning, fire safety. |
| **Fees / penalties** | Fee computation, late penalties | Fees depend on tax code/activity; penalty config should be **editable by admin** (not static); payment can be faked for now (no real third-party). |
| **LGU manager** | Dashboards, oversight | Suggested: manage inspectors, see progress, see complaints, **receive appeals**; one manager per department. |
| **Mobile** | Inspector mobile | **Inspector-only** mobile; GPS for photos to validate authenticity. |
| **Static data** | — | Remove **static** dashboard data on business owner side; real data only. |
| **Form definition** | — | Content should reflect **unified business permit form**; form definition feature for when the form rarely changes. |

**Summary:** Capstone and Platform Tech describe the system at a high level. Immediate Requirements add the real BPLO workflow (PIS first, unified form, dropdowns, 20 min, renewals, general/occupational permits, retirement, inspections after permit, complaints via barangay, appeals, walk-in, no ID validation by BPLO). The **Platform Tech manuscript** doesn’t need to spell out every BPLO step; it only needs to stay consistent with “unified form + AI validation” and “audit hashes on blockchain,” and **not** imply that BPLO validates IDs.

---

## 6. Cross-Document Inconsistencies to Fix

1. **AI scope**
   - **Immediate Requirements:** BPLO does **not** validate IDs; Manila offices do verification; AI should validate the **unified form**.
   - **Action:** In both capstone and Platform Tech, ensure “document validation” clearly means permit/form completeness and consistency (and LOB/tax code), not ID verification. Remove or repurpose any “ID validation” model references.

2. **Methodology wording**
   - **Capstone:** Kanban–XP, “phases,” Phase 2 = AI + blockchain prototypes.
   - **Platform Tech:** Agile, four sprints (AI, Blockchain, Web, Mobile).
   - **Action:** No change needed; each document matches its course. Optionally add one line in Platform Tech that the approach is consistent with the capstone’s Kanban–XP hybrid, with work organized as four sprints.

3. **Respondent / data source**
   - **Capstone:** Table 2.1 = Respondent characteristics (Wilfredo Villena, business owner, mayor’s assistant); interview appendices.
   - **Platform Tech:** Table 2.1 = Sprint overview; “Sources of Data” is generic (BPLO staff, observation, test data, regulations).
   - **Action:** Platform Tech can stay generic for “Sources of Data.” If you want to align names, add “e.g. BPLO officer (Alaminos City), business owners, LGU staff” and optionally name Wilfredo Villena once in 2.2.

4. **Company profile / study site**
   - **Capstone:** Has “Company Profile” (Alaminos City, BPLO, BOSS, PSIC 2019, tax codes, 25% surcharge, 2% monthly interest).
   - **Platform Tech:** No company profile section; “Alaminos City” appears in problem statement and objectives.
   - **Action:** Platform Tech doesn’t require a full company profile; optional one-sentence study site in 1.1 or 1.5 is enough.

5. **References and appendices**
   - **Capstone:** Full references (Angrosino, Beck, Bowen, Creswell, Kvale, Scrum Alliance, Sommerville, plus literature); appendices with interview Q&As and observation form.
   - **Platform Tech:** Placeholder (“List all sources… Hugging Face, OpenAI docs, Remix IDE, OWASP…”); appendices placeholder.
   - **Action:** Platform Tech can keep placeholders or reuse capstone references for shared citations; appendices can point to “screenshots, test results, code snippets” and optionally “see capstone appendices for interview instruments.”

6. **Definition of terms**
   - **Capstone:** Full list (AI, BizClear, Blockchain, BOSS, Document Validation, RBAC, Kanban–XP Hybrid, etc.).
   - **Platform Tech:** “ACRONYMS” placeholder only.
   - **Action:** Add at least: AI (as used in the system), Blockchain (hash storage, verification), and RBAC; optional: BOSS, LGU, PIS if you mention them.

---

## 7. Immediate Requirements vs Manuscript Checklist

From Immediate_Requirements.md, items that affect **what the manuscript should not contradict** (no need to implement in the doc, but keep narrative consistent):

- [x] Sprint 1 = AI, Sprint 2 = Blockchain, Sprint 3 = Web, Sprint 4 = Mobile — **manuscript already aligned**
- [x] AI validates **unified form** (completeness, consistency, LOB/tax code), not IDs — **manuscript says “document completeness and inconsistency” and LOB; ensure no “ID validation”**
- [x] Blockchain: audit hashes, Ganache, verification, queue — **manuscript aligned**
- [ ] PIS and walk-in: manuscript doesn’t need to detail PIS or walk-in; capstone can add in methodology/data gathering
- [ ] Post-requirements (sanitary, fire, zoning, etc.): capstone scope; Platform Tech can stay high-level (“inspection and post-requirements”)
- [ ] Penalty/fee config editable by admin: implementation detail; no need in Platform Tech unless you mention “configurable fees/penalties”
- [ ] LGU manager (appeals, inspectors, complaints): implementation detail; manuscript “managers” and “dashboards” are enough
- [ ] Mobile = inspector only, GPS for photos: manuscript already says “mobile and offline support for inspectors”; optional: “including photo capture with location for verification”

---

## 8. Summary Table: Where the Two Main Documents Differ

| Section / topic | Capstone | Platform Tech |
|-----------------|----------|----------------|
| **Structure** | Chapters 1–2 + appendices; research design, respondents, phases | Shorter; Ch 1–5 + refs + appendices; sprint-focused |
| **Methodology** | Kanban–XP, 4 phases (Requirements, Prototype, Core, Security) | Agile, 4 sprints (AI, Blockchain, Web, Mobile) |
| **Table 2.1** | Respondent characteristics | Sprint overview |
| **Company profile** | Yes (Alaminos, BPLO, fees) | No (only “Alaminos City” in text) |
| **AI prototype** | Phase 2; rule-based + 6 ML + Gemini; Gradio | Sprint 1; rule-based + ML + generative AI; LOB + fallback |
| **Blockchain prototype** | Phase 2; Gradio UI; Ganache | Sprint 2; queue, verification; Ganache |
| **Security** | Phase 4 (rate limit, X-API-Key, RBAC, etc.) | Section 2.6 (RBAC, TLS, validation, blockchain audit) |
| **Mobile** | Feature in core workflow | Sprint 4 |
| **References** | Full list | Placeholder |
| **Appendices** | Interview Q&As, observation form, forms list | Placeholder (screenshots, tests, code) |
| **Definition of terms** | Full | Acronyms placeholder |

---

## 9. Recommended Next Steps

1. **Platform Tech manuscript**
   - Do a quick pass for “ID validation” or “document verification” and ensure it means **unified permit form** (and LOB), not ID verification.
   - Optionally add 1–2 definitions (AI, Blockchain, RBAC) under Acronyms.
   - Optionally add one sentence in 2.2 naming BPLO officer / Alaminos as primary data source.

2. **Capstone document**
   - In “AI” and “document validation” sections, state explicitly that validation targets the **unified business permit form** (and business activity / LOB), not ID verification, and that BPLO does not perform ID verification (per field visit).
   - Ensure Phase 2 prototype description matches what you actually built (notebooks, Gradio, 6 algorithms, Gemini, Ganache audit).

3. **Immediate_Requirements**
   - Use as the single source of truth for BPLO workflow (PIS, unified form, dropdowns, renewals, penalties, inspections, appeals, walk-in, post-requirements). When updating capstone or app, align with this.
   - Implement or plan: PIS-first flow, walk-in support, duplicate-account mitigation, editable penalty config, LGU manager role, inspector-only mobile with GPS, removal of static dashboard data and ID validation model.

4. **Consistency**
   - Keep “AI = form/completeness/LOB, not ID” and “blockchain = audit hashes + verification” the same in both documents and in any new docs (e.g. LOB model training, blockchain prototype plan).

If you tell me which document you want to edit first (capstone vs Platform Tech) and whether you want changes only in narrative or also in structure, I can propose concrete edits next.
