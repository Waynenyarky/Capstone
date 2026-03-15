CHECKPOINT 2: Project Proposal & Threat Modelling



Course: Information Assurance and Security 2
Project Title: BizClear - A Blockchain-Enhanced Business Permit Processing and Inspection Tracking System with AI-assisted document validation
Student(s): 
Diaz, Mark Stephen C.
Enrique, John Wayne M.
Lazo, Keith Ardee
Brudo, Ericka Tresenio
Posadas, Xander
Instructor: Engelbert Cruz
Submission Date: 02-20-2026

1. Executive Summary

1.1 Project Overview
BizClear is a digital platform designed to streamline the management of business-related violations, permits, and appeals for the City Government of Alaminos. The system centralizes the submission, tracking, review, and resolution of business compliance issues that are traditionally handled through manual, paper-based processes within Alaminos City.
In addition to digitizing permit and inspection workflows, BizClear incorporates AI-powered business classification to assist LGU staff in accurately categorizing business permit applications, and a blockchain-based audit trail to ensure the integrity and immutability of critical permit and inspection records.
1.1.1 What the system does
Allows business owners to submit permit applications, upload supporting documents, track application status, and manage renewals through a centralized digital platform.
Enables LGU staff and officers to review applications, manage multi-office inspection workflows, process approvals, and communicate decisions through a unified system.
Provides inspectors with a dedicated mobile application for conducting field inspections, submitting findings, and coordinating with other offices.
Provides administrators with oversight tools such as dashboards, analytics, user management, and a real-time security monitoring panel.
Uses AI-powered business classification to:
Classify business descriptions into Lines of Business (LOB) categories using TF-IDF vectorization and scikit-learn
Support Filipino language input natively (e.g., "tindahan", "karinderia", "parlor") without hardcoded translation
Return confidence-scored recommendations to assist LGU staff in permit processing
Uses blockchain technology to:
Store SHA-256 cryptographic hashes of audit log entries on an Ethereum-compatible smart contract (Ganache)
Ensure records cannot be altered without detection through hash verification
Provide tamper-evident auditability via role-based access control (AUDITOR_ROLE) on the AuditLog smart contract

1.1.2 Intended users
Business Owners / Representatives – submit permit applications, upload documents, track application status, manage renewals, and receive notifications.
LGU Officers – review applications, process approvals, manage inspection workflows, and coordinate across offices (BPLO, BFP, Sanitary, Zoning, Engineering).
Inspectors – conduct field inspections via the mobile application, submit inspection reports, and synchronize findings in real time.
LGU Managers – oversee office operations, monitor processing metrics, and manage staff assignments.
System Administrators – manage users, roles, system configuration, security monitoring, and auditing.


1.1.3 Problem it solves
BizClear addresses delays, limited transparency, lost or misplaced records, and procedural inefficiencies resulting from the manual handling of business permit processing and inspections within Alaminos City. Traditional paper-based workflows across five offices (BPLO, BFP, Sanitary, Zoning, Engineering) increase processing time, create audit gaps, and make inter-office coordination difficult. By digitizing the entire process, BizClear enhances turnaround time, strengthens accountability mechanisms, ensures traceability of official actions through blockchain-secured audit trails, and improves public trust in regulatory enforcement, while significantly reducing administrative overhead for the city government.
1.2 System Scope
1.2.1 Included components
Web Application (React + Vite + Ant Design) – LGU-facing portal for permit management, inspection coordination, multi-office workflows, reporting, and administration. Business owners also access the web portal for application submission and status tracking.
Mobile Application (Flutter) – Inspector-dedicated mobile app for conducting field inspections, submitting reports with photographic evidence, and real-time synchronization with the backend.
Backend API (Node.js/Express, Microservices) – Four independent services: auth-service (authentication, MFA, session management), admin-service (user management, system configuration, form definitions), audit-service (audit logging, blockchain integration), and business-service (permit applications, inspections, payments, LOB classification).
AI Service (Python/Flask + scikit-learn) – Standalone classification service using TF-IDF vectorization for business description categorization with native Filipino language support.
Blockchain Service (Solidity 0.8.20 / Ganache) – Smart contracts (AccessControl.sol, AuditLog.sol) for immutable audit hash logging with role-based access control.
Database (MongoDB) – Secure storage for user accounts, roles, permit applications, inspection records, document metadata, and audit logs.
IPFS (Pinata) – Decentralized storage for uploaded documents referenced by content identifiers (CIDs).
1.2.2 Out of scope
Integration with national-level government systems or external court systems.
Automated legal decision-making (final decisions remain human-driven).
Offline-first mobile functionality beyond basic caching.
Identity document verification (handled by other offices per field visit findings).
1.3 Security Objective
Security and threat modeling are critical for BizClear because the system handles sensitive business data, personally identifiable information (PII), and official government records. The primary security objectives are to:
Ensure confidentiality of business and personal data through strong authentication, authorization, and encryption.
Maintain integrity of violation and appeal records so they cannot be altered without proper authorization or traceability.
Guarantee availability of the system for 24/7 access by businesses and LGU staff.
Enforce role-based access control (RBAC) and least-privilege principles to prevent unauthorized actions.
Provide auditability and accountability via logs and audit trails to support investigations and compliance.
Threat modeling helps identify potential risks such as unauthorized access, data tampering, privilege abuse, and denial-of-service attacks early in the design, allowing the system to implement appropriate controls before deployment.

2. System Architecture
2.1 Architecture Description
BizClear follows a client–server architecture with a microservice-oriented backend comprising four independent Node.js/Express services, a standalone Python/Flask AI service, and a Solidity smart contract layer on Ganache. This separation of concerns supports scalability, security isolation, and independent deployment of each component.
2.1.1 Web Application
A React-based single-page application (Vite + Ant Design) used by business owners, LGU officers, managers, and administrators.
Provides role-specific dashboards: business owners see application status and document uploads; LGU officers see application review queues with claim/release workflows; managers see office-wide analytics; administrators see user management, form definitions, and a security monitoring panel.
Communicates with the backend exclusively through secure API calls protected by JWT tokens and CSRF double-submit cookies.
2.1.2 Mobile Application
A Flutter-based mobile app used exclusively by inspectors (Code: `mobile/app/`).
View assigned inspection tasks, conduct field inspections with photo capture, submit digital inspection reports, and synchronize findings in real time.
Does not directly access the database; all interactions pass through the backend API with JWT authentication.
2.1.3 Backend API (Microservices)
Four independent Express.js services, each with its own routes, middleware, and models:
• auth-service (`backend/services/auth-service/`) – Authentication (JWT, bcrypt, MFA/TOTP, WebAuthn passkeys, Google OAuth2), session management, user profile operations, password policies, account lockout, CSRF protection, and security monitoring.
• admin-service (`backend/services/admin-service/`) – User administration, staff management, form definitions, system configuration, and admin audit logging.
• audit-service (`backend/services/audit-service/`) – Audit log management, blockchain hash logging, hash verification, and audit history retrieval.
• business-service (`backend/services/business-service/`) – Permit applications, inspection workflows, payment processing, LOB classification (proxies to AI service), renewals, cessation/retirement, and appeals.
Inter-service communication uses X-API-Key headers for authenticated service-to-service calls.
2.1.4 Database Server
MongoDB with Mongoose ODM. Stores user accounts (with bcrypt-hashed passwords and AES-256-GCM encrypted MFA secrets), roles, permit applications, inspection records, audit logs (with SHA-256 hashes), and document metadata.
Isolated from direct public access; only reachable by backend services using a least-privilege application database user (`deploy/mongo-init/01-create-app-user.js`).
Production deployments use TLS connections (`mongodb+srv` or `tls=true`) and encryption at rest.
2.1.5 Component Interaction Flow
Users interact through the web or mobile application, authenticating via a two-step login process (credentials + email OTP or TOTP MFA).
Client applications send requests to the backend API over HTTPS with JWT Bearer tokens.
The backend API enforces RBAC via `requireRole()` middleware, validates all inputs with Joi schemas and sanitization, and applies business logic.
The API reads from or writes to MongoDB as needed.
For sensitive actions (profile changes, admin operations), audit logs are created with SHA-256 hashes.
Audit hashes are queued for blockchain logging via `blockchainQueue` (non-blocking, with retry).
The AI service is called via HTTP when business description classification is needed.
2.1.6 AI Classification Service
A standalone Python/Flask service (`ai/`) that classifies business descriptions into Lines of Business categories.
Uses scikit-learn with TF-IDF vectorization, trained on 1,618 examples (73% Filipino language).
Natively supports Filipino input ("tindahan", "karinderia", "nagbebenta") without hardcoded translation dictionaries.
Returns confidence-scored LOB recommendations; does not make automated approval decisions.
Input length validation prevents DoS; character sanitization blocks injection; only classification results are returned (no training data exposed).
Code: `ai/predict_app.py` – `/predict` endpoint.
2.1.7 Blockchain Ledger Service
Solidity 0.8.20 smart contracts deployed on Ganache (Ethereum-compatible local blockchain).
AccessControl.sol (`blockchain/contracts/AccessControl.sol`) – Role-based access control with ADMIN_ROLE, AUDITOR_ROLE, USER_REGISTRAR_ROLE, and DOCUMENT_MANAGER_ROLE.
AuditLog.sol (`blockchain/contracts/AuditLog.sol`) – Immutable audit hash logging with O(1) hash verification (optimized from O(n) via direct mapping), paginated audit history retrieval, and audit statistics.
Only addresses with AUDITOR_ROLE can write to the ledger; read access is public for verification.
No raw PII is stored on-chain; only SHA-256 hashes, event types, and timestamps.


2.2 Architecture Diagram


Figure 1 illustrates BizClear’s multi-tier architecture, showing interactions between users, client applications, the backend API, AI validation service, blockchain ledger, and database server, along with identified trust boundaries.

2.3 Trust Boundaries
Trust boundaries define where data crosses from a less trusted domain to a more trusted one. Identifying these boundaries is critical for threat modeling and security control placement.
2.3.1 Users ↔ Client Applications (Web/Mobile)
External users are considered untrusted.
Input validation, authentication mechanisms, and secure session handling are required at this boundary.
The client should never be trusted to enforce security-critical decisions.
2.3.2 Client Applications ↔ Backend API
This is a major trust boundary where all requests must be authenticated and authorized.
Secure communication (e.g., HTTPS/TLS) is required to protect data in transit.
The API must assume all incoming data may be malicious and perform strict validation and access checks.

2.3.3 Backend API ↔ Database Server
A highly trusted internal boundary.
Only the backend API is allowed database access using restricted service credentials.
Database-level access controls, parameterized queries, and auditing protect against data leakage, injection attacks, and unauthorized modifications.
2.3.4 Backend API ↔ AI Classification Service
Treated as a semi-trusted internal boundary.
Requires:
Input length validation to prevent DoS via extremely long inputs
Output limited to classification results only (no training data or model internals exposed)
Character sanitization blocks injection attempts
The AI service processes only business description text and returns LOB category recommendations; it does not access user data, PII, or the database directly
2.3.5 Backend API ↔ Blockchain Ledger
Highly trusted boundary.
Only authorized backend services can write to the ledger.
Read access is restricted to verification and auditing purposes.




3. Asset Identification
3.1 Critical Assets
The following assets are considered critical to the secure and reliable operation of the BizClear system. Compromise of these assets could result in legal, operational, or reputational damage to the LGU.
3.1.1 User Credentials
Includes usernames, hashed passwords, and role assignments for business owners, LGU staff, officers, and administrators.
Used to authenticate users and determine access levels within the system.
3.1.2 Personal and Sensitive Data
Includes personally identifiable information (PII) such as business owner names, contact details, business registration data, and violation records.
May also include uploaded documents submitted as evidence during appeals.
3.1.3 Authentication Tokens / Session Data
Includes access tokens, refresh tokens, and session identifiers issued after successful authentication.
Used to maintain authenticated sessions between clients and the backend API.
3.1.4 Violation and Appeal Records
Official LGU records documenting issued violations, appeal submissions, review actions, and final decisions.
These records have legal and regulatory significance.
3.1.5 Audit Logs
Logs capturing authentication events, data changes, and administrative actions.
Essential for accountability, incident response, and compliance investigations.
3.1.6 Application Source Code and Configuration:
Backend API code, web and mobile application code, and system configuration files.
Includes security-relevant configurations such as access control rules and environment settings.
3.1.7 AI Models and Classification Results
Trained TF-IDF + scikit-learn model used for business description classification into Lines of Business categories (`ai/models/lob_model.joblib`, `ai/models/tfidf_vectorizer.joblib`)
AI-generated confidence-scored LOB recommendations used to assist LGU staff in permit processing


3.1.8 Blockchain Ledger Data
Cryptographic hashes of violation and appeal records
Immutable transaction logs
Timestamped proof of record existence and integrity
3.2 CIA Triad Mapping
The table below maps each critical asset to the CIA triad, indicating which security properties are most important.
Asset
Confidentiality
Integrity
Availability
User credentials
High
High
Medium
Personal and sensitive data
High
High
Medium
Authentication tokens / sessions
High
High
High
Violation and appeal records
Medium
High
High
Audit logs
Medium
High
Medium
Application source code & configuration
Medium
High
High
AI models & classification outputs
Medium
High
Medium
Blockchain ledger records
Low
Very High
High




4. STRIDE Threat Model
4.1 STRIDE Overview
STRIDE is a threat modeling framework used to identify security threats by categorizing them into six classes:
Spoofing – Impersonating a legitimate user or system component to gain unauthorized access.
Tampering – Unauthorized modification of data, code, or configuration.
Repudiation – Performing actions without the ability to trace them back to the responsible user.
Information Disclosure – Unauthorized exposure of sensitive or confidential data.
Denial of Service (DoS) – Disrupting system availability or degrading performance to prevent legitimate use.
Elevation of Privilege – Gaining higher access rights than intended, bypassing authorization controls.
The STRIDE model is applied to BizClear’s major system components to systematically identify potential threats and guide the design of appropriate mitigations.
4.2 STRIDE Threat Table

System Component
STRIDE Category
Threat Description
Impact
Likelihood
Risk Score
Risk Priority
Mitigation
Web Application
Spoofing
Attacker logs in using stolen credentials
4
3
12
High
Multi-factor authentication (TOTP + WebAuthn), bcrypt password hashing, per-email rate limiting, Cloudflare Turnstile CAPTCHA. Code: `auth-service/src/routes/login.js`, `auth-service/src/routes/mfa.js`, `auth-service/src/middleware/rateLimit.js`
Web Application
Information Disclosure
Sensitive data exposed via improper access controls
4
3
12
High
RBAC enforcement via `requireRole()` middleware, server-side authorization checks on every endpoint. Code: `auth-service/src/middleware/auth.js:68-80`
Mobile Application
Tampering
Modified app bypasses client-side validation
3
3
9
Medium
Server-side Joi validation on all endpoints, sanitization via `sanitizer.js`, Helmet CSP headers. Code: `auth-service/src/middleware/validation.js`, `auth-service/src/lib/sanitizer.js`
Backend API
Spoofing
API requests made with stolen or forged tokens
5
4
20
Critical
Short-lived JWT tokens with token version check, HTTPS, admin step-up re-auth (5-min TTL). Code: `auth-service/src/middleware/auth.js:43-56` (token verification)
Backend API
Elevation of Privilege
User accesses admin-only endpoints
4
2
8
Medium
Strict RBAC via `requireRole()`, least-privilege enforcement, admin step-up middleware for sensitive actions. Code: `auth-service/src/middleware/auth.js:68-105`
Backend API
Denial of Service
Excessive API requests overwhelm services
4
3
12
High
Per-email/IP rate limiting, request throttling, real-time security monitoring with alerting. Code: `auth-service/src/middleware/rateLimit.js`, `auth-service/src/middleware/securityMonitor.js`
Database
Tampering
Unauthorized modification of violation or appeal records
5
2
10
Medium
Mongoose ODM (parameterized by design), least-privilege DB user, SHA-256 hashed audit logging with blockchain integration. Code: `deploy/mongo-init/01-create-app-user.js`, `audit-service/src/lib/auditLogger.js`
Database
Information Disclosure
Data leakage due to misconfiguration
4
2
8
Medium
Network isolation (DB only reachable by backend), encryption at rest (Atlas/WiredTiger), TLS connections, least-privilege access controls. Code: `auth-service/src/config/db.js:63`, `docs/security/database.md`
Logging / Audit System
Repudiation
Users deny actions due to insufficient logs
3
3
9
Medium
Immutable audit logs with SHA-256 hashes, blockchain-backed timestamping, user action tracing via 30+ event types. Code: `backend/src/models/AuditLog.js`, `blockchain/contracts/AuditLog.sol`
AI Classification Service
Information Disclosure
AI service exposes training data or model internals
4
2
8
Medium
Return only classification results (LOB category + confidence score); no training data or model weights exposed. Code: `ai/predict_app.py`

AI Classification Service
Repudiation
Disputes over AI-generated classification recommendations
3
3
9
Medium
Classification results are advisory only; human reviewers retain final authority; audit logs track all permit decisions

AI Classification Service
Denial of Service
Excessive classification requests overload AI service
3
3
9
Medium
Input length validation prevents oversized payloads; rate limiting on business-service proxy endpoint



Blockchain Ledger
Tampering


Attempt to alter ledger records
5
2
10
Medium
Immutable ledger, cryptographic hashes


Blockchain Ledger
Denial of Service


Ledger service unavailable
3
2
6
Low
Redundancy, failover
Blockchain Ledger
Elevation of Privilege


Unauthorized ledger writes


5
2
10
Medium
Permissioned access, key management


Blockchain Ledger


Repudiation
Actor denies submitting or approving a record


3
1
3
Low
Digital signatures, identity-bound transactions




4.3 Threat Prioritization
Threats were ranked based on a combination of impact and likelihood:
Impact reflects the potential damage to confidentiality, integrity, availability, legal compliance, and public trust.
Likelihood reflects how probable the threat is, considering system exposure and common attack patterns.
4.3.1 Highest-risk threats
These threats have high impact and medium-to-high likelihood, making them priority targets for mitigation.
API spoofing through stolen authentication tokens
Denial-of-service attacks against the backend API
Unauthorized access to sensitive business and appeal data
4.3.2 Medium-risk threats
These threats require strong preventive and detective controls but are less likely or slightly lower in impact.
Elevation of privilege due to misconfigured roles
Client-side tampering of the mobile application
Repudiation risks from insufficient logging
4.3.3 Low-risk threats
These are considered low risk due to strong network isolation and restricted access but are still addressed through defense-in-depth controls.
Direct database attacks from external actors


4.4 Risk Matrix / Prioritization
Category
Risk
Impact (1–5)
Likelihood (1–5)
Score
 (I × L)
Priority
Mitigation Strategy 
Owner
Acceptance Criteria
Technical / Data
Unauthorized access to violation and appeal records
5
4
20
Critical
Enforce RBAC, MFA, token validation, and continuous access monitoring
Backend Security Team
Zero unauthorized access incidents; 100% RBAC enforcement
Technical
Backend API downtime during peak submission periods
4
3
12
High
Auto-scaling infrastructure, load testing, uptime monitoring
System Architect
≥99.9% API uptime during peak hours
Data
Violation or appeal record tampering
5
2
10
Medium
Parameterized queries, database isolation, audit logging, blockchain integrity checks
Database Administrator
100% record integrity verified via audit logs
Process
Inadequate audit logging for appeals and decisions
3
3
9
Medium
Implement centralized, immutable logging with timestamps and user IDs
Compliance Officer
All critical actions logged with timestamp and user ID
People
LGU staff misusing elevated privileges
4
2
9
Medium
Least-privilege enforcement, periodic access reviews, approval workflows
System Administrator
Quarterly access reviews; zero unauthorized actions
Technical / Process
AI validation flags incorrect or misleading results
3
3
9
Medium
Human-in-the-loop review, AI output explainability, periodic model evaluation
AI Service Lead
≥90% reviewer agreement with AI flags
Technical
Denial of Service attack on Backend API
4
3
12
High
Rate limiting, request throttling, traffic monitoring, DDoS protection
Infrastructure Team
System handles traffic spikes without service outage
People / Process
Business owners submit incomplete or incorrect documents
3
4
12
High
AI-assisted completeness checks, clear submission guidelines, user prompts
Permit Processing Unit
≥95% submissions complete on first review
Data
Loss or corruption of audit logs
4
2
8
Medium
Log redundancy, secure centralized storage, integrity verification
Security Operations Team
100% log retention and integrity maintained
Technical
Blockchain ledger temporarily unavailable
3
2
6
Low
Ledger redundancy, failover mechanisms, deferred write queue
Blockchain Administrator
Core system operational during ledger downtime




4.5 Risk Justifications

Risk: “Unauthorized access to violation and appeal records”
Impact Assessment:
Legal: Exposure of official LGU records → Score 5


Confidentiality: PII and business data leakage → Score 5


Reputation: Loss of public trust in LGU system → Score 4


Operational: Unauthorized actions may invalidate cases → Score 4


Overall Impact = 5 (Highest factor governs)
Likelihood Assessment:
Exposure: Public-facing web and mobile access → Score 4


Attack Frequency: Access control attacks are common → Score 4


System Complexity: Multiple user roles and permissions → Score 4


Controls Present: RBAC reduces likelihood but not eliminate → Score 3


Overall Likelihood = 4 (average ≈ 3.75)
Risk Score = 5 × 4 = 20 (Critical)
Risk: “Backend API downtime during peak submission periods”
Impact Assessment:
Operational: Appeals and violations cannot be processed → Score 4


Legal: Missed deadlines may affect compliance → Score 4


Reputation: Users perceive system as unreliable → Score 3


Overall Impact = 4
Likelihood Assessment:
Usage Pattern: Peak usage during permit deadlines → Score 3


Architecture: Centralized API is single point of failure → Score 3


Mitigation: Monitoring and scaling reduce risk → Score 3


Overall Likelihood = 3
Risk Score = 4 × 3 = 12 (High)
Risk: “Violation or appeal record tampering”
Impact Assessment:
Legal: Altered records compromise legal validity → Score 5


Integrity: Decisions based on false data → Score 5


Auditability: Undermines accountability → Score 4


Overall Impact = 5
Likelihood Assessment:
Access Controls: Database is isolated → Score 2


Security Controls: Parameterized queries and logging → Score 2


Threat Source: Mostly insider or advanced attacker → Score 2


Overall Likelihood = 2
Risk Score = 5 × 2 = 10 (Medium)
Risk: “Inadequate audit logging for appeals and decisions”
Impact Assessment:
Legal: Cannot prove who approved or modified records → Score 3


Compliance: Weak evidence during investigations → Score 3


Reputation: Reduced trust in system fairness → Score 3


Overall Impact = 3
Likelihood Assessment:
Configuration Risk: Logging often incomplete → Score 3


Process Gaps: Logging overlooked during development → Score 3


Overall Likelihood = 3
Risk Score = 3 × 3 = 9 (Medium)
Risk: “LGU staff misusing elevated privileges”
Impact Assessment:
Integrity: Unauthorized approvals or changes → Score 4


Reputation: Abuse of authority damages public trust → Score 4


Overall Impact = 4
Likelihood Assessment:
RBAC: Roles limit exposure → Score 2


Human Factor: Insider misuse is possible → Score 2


Overall Likelihood = 2
Risk Score = 4 × 2 = 8 (Medium)
Risk: “AI validation flags incorrect or misleading results”
Impact Assessment:
Operational: Review delays or incorrect scrutiny → Score 3


Fairness: Businesses may be unfairly flagged → Score 3


Overall Impact = 3
Likelihood Assessment:
AI Limitations: False positives are common → Score 3


Training Data: May not cover all document variations → Score 3


Overall Likelihood = 3
Risk Score = 3 × 3 = 9 (Medium)
Risk: “Denial of Service attack on Backend API”
Impact Assessment:
Availability: System becomes unusable → Score 4


Operations: Appeals and violations halted → Score 4


Overall Impact = 4
Likelihood Assessment:
Public Exposure: API endpoints accessible online → Score 3


Attack Tools: DoS tools are widely available → Score 3


Overall Likelihood = 3
Risk Score = 4 × 3 = 12 (High)
Risk: “Incomplete or incorrect document submissions by business owners”
Impact Assessment:
Process: Appeals delayed or rejected → Score 3


Workload: Increased burden on reviewers → Score 3


Overall Impact = 3
Likelihood Assessment:
User Skill: Users vary in technical ability → Score 4


Document Complexity: Requirements may be unclear → Score 4


Overall Likelihood = 4
Risk Score = 3 × 4 = 12 (High)
Risk: “Loss or corruption of audit logs”
Impact Assessment:
Compliance: No traceability → Score 4


Security: Incidents cannot be investigated → Score 4


Overall Impact = 4
Likelihood Assessment:
Controls: Centralized logging reduces risk → Score 2


Threat Source: Mainly misconfiguration → Score 2


Overall Likelihood = 2
Risk Score = 4 × 2 = 8 (Medium)
Risk: “Blockchain ledger temporarily unavailable”
Impact Assessment:
Integrity Verification: Delayed verification only → Score 3


Operations: Core system remains functional → Score 2


Overall Impact = 3
Likelihood Assessment:
Environment: Permissioned and controlled → Score 2


Redundancy: Failover mechanisms exist → Score 2


Overall Likelihood = 2
Risk Score = 3 × 2 = 6 (Low)









5. Mapping to OWASP Top 10
5.1 Relevant OWASP Risks
Based on the identified STRIDE threats and system architecture, the following OWASP Top 10 risks are most relevant to BizClear, along with the implemented mitigations:
Injection – Risk of malicious input manipulating database queries or backend logic. Mitigated by: Mongoose ODM (parameterized queries), Joi schema validation, `sanitizer.js` (SQL/NoSQL/command injection detection and stripping), and `containsSqlInjection()` custom validators. Code: `auth-service/src/lib/sanitizer.js`, `auth-service/src/middleware/validation.js`.
Broken Authentication – Weak authentication or session handling leading to account compromise. Mitigated by: bcrypt hashing, JWT with token version invalidation, MFA (TOTP + WebAuthn), account lockout (5 attempts/15min), 90-day password expiry, 12-char password policy, Cloudflare Turnstile CAPTCHA, and generic error messages. Code: `auth-service/src/routes/login.js`, `auth-service/src/middleware/auth.js`, `auth-service/src/lib/accountLockout.js`.
Broken Access Control – Users accessing data or actions beyond their assigned roles. Mitigated by: `requireRole()` middleware on every protected endpoint, admin step-up re-authentication for sensitive actions, least-privilege DB user. Code: `auth-service/src/middleware/auth.js:68-105`.
Cryptographic Failures – Sensitive data exposed due to lack of encryption. Mitigated by: bcrypt for passwords, AES-256-GCM field-level encryption of all string data fields across the entire database (35+ models via Mongoose encryption plugin with randomized and deterministic modes), TLS for database connections, AES-256-CBC for backup encryption, SHA-256 for audit log hashes. Code: `backend/shared/lib/fieldCipher.js` (AES-256-GCM), `backend/shared/lib/encryptionPlugin.js` (Mongoose plugin), `auth-service/src/lib/secretCipher.js`, `deploy/backup.sh:77-86`.
Security Logging and Monitoring Failures – Insufficient logging preventing attack detection. Mitigated by: comprehensive AuditLog model (30+ event types), real-time security monitoring middleware, admin monitoring dashboard, blockchain-backed audit trail. Code: `backend/src/models/AuditLog.js`, `auth-service/src/middleware/securityMonitor.js`, `auth-service/src/routes/monitoring.js`.
Denial of Service – Abuse of system resources to disrupt availability. Mitigated by: per-email/IP rate limiting on all sensitive endpoints, security monitor tracking of rapid requests, input length limits, password max length (200 chars). Code: `auth-service/src/middleware/rateLimit.js`, `auth-service/src/middleware/securityMonitor.js`.
Insecure Design – Overreliance on AI outputs without human validation. Mitigated by: AI classification results are advisory only; human reviewers retain final authority; confidence scores allow reviewers to assess recommendation quality. Code: `ai/predict_app.py`.
Software and Data Integrity Failures – Compromised AI models or blockchain keys. Mitigated by: blockchain smart contract role-based access (only AUDITOR_ROLE can write), duplicate hash rejection, Solidity 0.8+ checked arithmetic, permissioned blockchain architecture. Code: `blockchain/contracts/AccessControl.sol`, `blockchain/contracts/AuditLog.sol`.
These risks are common in web and mobile systems that handle sensitive data and rely on APIs for core functionality.
5.2 STRIDE–OWASP Mapping Table
STRIDE Threat
OWASP Top 10 Category
Affected Component
Spoofing
Broken Authentication
Web, Mobile, API
Tampering
Injection
Web, API
Repudiation
Security Logging and Monitoring Failures
API, Logging System
Information Disclosure
Cryptographic Failures
API, Database
Denial of Service
Denial of Service
API
Elevation of Privilege
Broken Access Control
API, Web
Tampering
Insecure Design
AI Service
Denial of Service
Software & Data Integrity Failures
Blockchain
Spoofing
Broken Access Control
AI, API

This mapping helps align abstract threat categories with well-known industry vulnerabilities and recommended best practices.

6. Security Controls & Mitigations

6.1 Authentication Controls
BizClear implements a multi-layered authentication system that goes well beyond basic username-password verification. The login process follows a mandatory two-step flow: credential verification followed by either email OTP or TOTP-based multi-factor authentication. All authentication logic resides in the auth-service microservice.

6.1.1 Password Security
Passwords are hashed using bcrypt with a cost factor of 10–12 salt rounds before storage. The system enforces a strong password policy requiring a minimum of 12 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character, with a maximum length of 200 characters to prevent denial-of-service via extremely long inputs. Password history tracking prevents reuse of the last five passwords by comparing new passwords against stored bcrypt hashes. A 90-day password expiry policy forces credential rotation; expired passwords trigger a mandatory change on next login. Code: `backend/services/auth-service/src/lib/passwordValidator.js` (strength validation), `backend/services/auth-service/src/lib/passwordHistory.js` (reuse prevention), `backend/services/auth-service/src/lib/passwordExpiry.js` (90-day policy). To verify: register a user and inspect the `passwordHash` field in MongoDB — it begins with `$2b$` (bcrypt identifier).

6.1.2 Multi-Factor Authentication (MFA)
MFA is enforced for all staff and administrator accounts. The system supports two MFA methods: TOTP via authenticator apps (Google Authenticator, Authy) and WebAuthn passkeys (hardware security keys, biometric authenticators). TOTP secrets are encrypted at rest using AES-256-GCM with a per-user key derived from the user's password hash, ensuring that even database compromise does not expose raw TOTP secrets. Replay protection is implemented by tracking the last-used TOTP counter; resubmitting a previously used code returns a "Verification code already used" error. Code: `backend/services/auth-service/src/routes/mfa.js` (MFA lifecycle), `backend/services/auth-service/src/lib/secretCipher.js` (AES-256-GCM encryption), `backend/services/auth-service/src/lib/totp.js` (TOTP verification with counter tracking). To verify: log in as an admin account — the system requires MFA setup before granting access; check MongoDB `users` collection — `mfaSecret` values begin with `enc:v1:` (encrypted).

6.1.3 Session Management
Authentication tokens are JWT-based with configurable time-to-live (default 60 minutes). Each JWT includes a `tokenVersion` field that is checked against the user's current version in the database on every request. When a user logs out, changes their password, or an admin invalidates their session, the token version is incremented, immediately invalidating all previously issued tokens. Session records are stored in a dedicated Session model with role-based timeouts: 10 minutes for administrators, 1 hour for all other roles. Code: `backend/services/auth-service/src/middleware/auth.js` (JWT signing and verification with token version), `backend/services/auth-service/src/models/Session.js` (session records). To verify: log in on two browsers, change the password on one — the other session immediately returns 401 "session has been invalidated."

6.1.4 Account Lockout
After five consecutive failed login or verification attempts, the account is locked for 15 minutes. The lockout status is tracked per-user in the database with `failedVerificationAttempts` and `accountLockedUntil` fields. Successful authentication clears the failure counter. Administrators can manually unlock accounts. Code: `backend/services/auth-service/src/lib/accountLockout.js` (lockout logic), `backend/services/auth-service/src/routes/login.js:220-227` (lockout enforcement). To verify: enter the wrong password five times — the response changes to 423 "Account temporarily locked" with a `lockedUntil` timestamp.

6.1.5 Rate Limiting
Multiple rate limiters protect authentication endpoints: per-email login attempts, verification code requests (5 per 15 minutes), password change attempts (3 per hour), profile updates (10 per minute), ID uploads (5 per hour), and admin approval requests (10 per hour). Rate limiting uses the `express-rate-limit` library with per-email key generation that falls back to IP-based limiting. Code: `backend/services/auth-service/src/middleware/rateLimit.js` (all rate limiters). To verify: send rapid login requests — after exceeding the threshold, a 429 response is returned with `retryAfterSec`.

6.1.6 CAPTCHA and OAuth
Cloudflare Turnstile CAPTCHA integration protects against automated attacks on login and signup endpoints. Google OAuth2 is supported as an alternative authentication method. Code: `backend/services/auth-service/src/lib/turnstile.js` (CAPTCHA verification), `backend/services/auth-service/src/routes/login.js:91-98` (Google OAuth schema).

6.1.7 Admin Step-Up Re-Authentication
Sensitive administrative actions (staff management, account deletion approval) require a short-lived step-up JWT token (5-minute TTL) obtained through re-authentication. The step-up token is verified via the `requireAdminStepUp` middleware, which ensures the token belongs to the currently authenticated admin. Code: `backend/services/auth-service/src/middleware/auth.js:21-105` (step-up token signing and verification).

6.1.8 Generic Error Messages
All authentication failures return the same generic message ("Invalid email or password") regardless of whether the email exists, the password is wrong, or the account is locked. This prevents user enumeration attacks. Code: `backend/services/auth-service/src/routes/login.js:216` (generic error).

6.2 Input Validation Controls
BizClear employs a multi-layered input validation strategy that combines schema validation, content sanitization, and pattern detection to protect against injection attacks, cross-site scripting, and data corruption.

6.2.1 Schema Validation
Every API endpoint validates request bodies using Joi schemas before processing. Schemas define required fields, types, lengths, patterns, and custom validators. Invalid requests are rejected with 400-status responses containing specific validation error messages. Code: `backend/services/auth-service/src/middleware/validation.js` (Joi middleware), individual route files define schemas (e.g., `login.js:61-105`, `signup.js:46-52`). To verify: send a request with missing required fields or invalid types — Joi returns detailed error messages.

6.2.2 Sanitization
A dedicated sanitizer module provides context-specific sanitization functions: `sanitizeString()` removes null bytes, MongoDB `$`-operator prefixes, shell metacharacters, script tags, and event handlers; `sanitizeEmail()` normalizes and strips dangerous characters; `sanitizeName()` allows only letters, spaces, hyphens, and apostrophes; `sanitizePhoneNumber()` strips non-digit characters; `sanitizeIdNumber()` allows alphanumeric and common separators; `sanitizeObject()` recursively sanitizes all string values and strips keys starting with `$` to prevent NoSQL operator injection. Code: `backend/services/auth-service/src/lib/sanitizer.js` (all sanitization functions). To verify: send a name field containing `<script>alert('xss')</script>` — the script tags are stripped and only the text content remains.

6.2.3 XSS Protection
Cross-site scripting is prevented through three layers: (1) the sanitizer strips script tags, iframe tags, event handlers, and `javascript:` URIs from all string inputs; (2) Joi custom validators explicitly detect XSS patterns and reject the request with a 400 error; (3) Helmet middleware sets Content Security Policy (CSP) headers restricting script sources to `'self'`. Code: `sanitizer.js:111-128` (`containsXss()` detection), `profile.js:1685-1719` (Joi XSS validators), `auth-service/src/index.js:42-43` (Helmet CSP).

6.2.4 SQL and NoSQL Injection Protection
SQL injection patterns (UNION, SELECT, DROP, etc.) are detected by `containsSqlInjection()` and rejected at both the Joi validation and route handler levels. NoSQL injection is prevented by stripping MongoDB `$`-operator prefixes from string values and removing `$`-prefixed keys from objects via `sanitizeObject()`. Since the system uses MongoDB with Mongoose ODM, all queries are parameterized by design through Mongoose methods (`findOne()`, `findById()`, etc.), eliminating raw query string vulnerabilities. Code: `sanitizer.js:83-104` (SQL injection detection), `sanitizer.js:20` (MongoDB operator stripping), `sanitizer.js:194-195` (`$`-key removal).

6.2.5 CSRF Protection
Cross-Site Request Forgery is mitigated through a double-submit cookie pattern. The server generates a cryptographically random token (32 bytes via `crypto.randomBytes`), sets it in a cookie, and requires the client to send the same token in the `x-csrf-token` header on all state-changing requests (POST, PUT, PATCH, DELETE). Mismatched or missing tokens result in a 403 "csrf_invalid" response. The CSRF middleware is applied across all services. Code: `backend/services/auth-service/src/lib/csrf.js` and `backend/shared/csrf.js` (middleware and token handler). To verify: make a POST request without the `x-csrf-token` header when the cookie is set — a 403 response is returned.

6.2.6 File Upload Validation
File uploads are validated across four dimensions: file size (maximum 5MB), MIME type (restricted to image/jpeg, image/png, application/pdf), file extension (restricted to .jpg, .jpeg, .png, .pdf), and magic bytes verification (checking file headers against expected byte patterns for each type). This prevents attackers from uploading executable files disguised with legitimate extensions. Code: `backend/services/auth-service/src/lib/fileValidator.js` (all validation logic including magic bytes). To verify: rename a `.exe` file to `.jpg` and upload it — the magic bytes check fails with "File content does not match file type."

6.2.7 Command Injection Protection
Shell metacharacters (`;`, `|`, `&`, backtick, `$`, `\`) are stripped from all string inputs by the sanitizer, preventing command injection in any context where input might reach system commands. Code: `sanitizer.js:23`.

6.3 Database Security Controls

6.3.1 Credential Storage
All secrets (database URIs, JWT secrets, API keys, email credentials, blockchain private keys) are stored in environment variable files (`.env`), never hardcoded in source code. The `.env` file is excluded from version control via `.gitignore`. MFA TOTP secrets are additionally encrypted using AES-256-GCM with a per-user key derived from the user's password hash. Code: `backend/services/auth-service/src/lib/secretCipher.js` (AES-256-GCM encryption/decryption), `.env.example` files document required environment variables without exposing values.

6.3.2 Role-Based Database Access
Application-level RBAC is enforced via `requireRole()` middleware that checks the JWT-embedded role against allowed roles for each endpoint. At the database level, a least-privilege application user is created via `deploy/mongo-init/01-create-app-user.js` with permissions restricted to the `capstone_project` database only. Code: `backend/services/auth-service/src/middleware/auth.js:68-80` (RBAC middleware).

6.3.3 Encryption at Rest — Full Database Field-Level Encryption
All string data fields across the entire MongoDB database are encrypted at the application level using AES-256-GCM. A Mongoose plugin (`backend/shared/lib/encryptionPlugin.js`) automatically encrypts fields before every save/update operation and decrypts them after every find/read operation. The encryption key is stored in the `FIELD_ENCRYPTION_KEY` environment variable (64-character hex string = 256-bit key).

Two encryption modes are used:
- **Randomized encryption** (default): Each encryption produces a unique ciphertext (random 12-byte IV), providing maximum security. Used for all PII and sensitive data fields.
- **Deterministic encryption**: The same plaintext always produces the same ciphertext (IV derived from HMAC-SHA256 of the plaintext), enabling exact-match database queries on fields like `email` and `username`.

The plugin is applied to all 35+ Mongoose models across both `auth-service` and `business-service`, covering:
- **User PII**: firstName, lastName, email, phoneNumber, address, nationality, etc.
- **Authentication data**: passwordHash, mfaSecret, tokens, OTP codes
- **Business data**: business names, TIN, addresses, contact info, owner identity
- **Audit/session data**: IP addresses, user agents, metadata, old/new values
- **Nested objects**: address subdocuments, metadata objects, form data
- **Array subdocuments**: password history, login IPs, checklist items, violations
- **Mixed-type fields**: metadata, formData, webhook payloads (deep recursive encryption)

Encrypted values are prefixed with `enc:v2:` (randomized) or `det:v2:` (deterministic) to prevent double-encryption and enable detection. Fields that are null, empty, non-string (Boolean, Number, Date, ObjectId), or already encrypted are automatically skipped. A migration script (`backend/scripts/migrate-encrypt-data.js`) encrypts existing plaintext data in-place. Code: `backend/shared/lib/fieldCipher.js` (AES-256-GCM encrypt/decrypt), `backend/shared/lib/encryptionPlugin.js` (Mongoose plugin), `.env.example` (FIELD_ENCRYPTION_KEY). To verify: inspect any document in MongoDB — all string fields show `enc:v2:` or `det:v2:` prefixed ciphertext instead of plaintext.

Additionally, production deployments using MongoDB Atlas benefit from automatic storage-level encryption at rest. The backup script supports AES-256-CBC encryption of backup archives when `BACKUP_ENCRYPTION_PASSWORD` is set. Code: `deploy/backup.sh:77-86` (backup encryption).

6.3.4 TLS Database Connections
Production MongoDB connections must use TLS. The connection configuration enforces this through `mongodb+srv` URIs (which require TLS) or explicit `tls=true` parameters. Code: `backend/services/auth-service/src/config/db.js:63` (TLS enforcement comment and implementation).

6.3.5 Audit Logging with Blockchain Integration
Every sensitive action in the system generates an audit log entry with a SHA-256 hash computed from the event data (userId, eventType, fieldChanged, oldValue, newValue, role, metadata, timestamp). The AuditLog model supports 30+ event types covering profile updates, password changes, MFA operations, admin approvals, account deletions, session management, and security events. After creating an audit log entry, the hash is queued for blockchain logging via the `blockchainQueue` module. The blockchain operation is non-blocking with retry logic, ensuring audit logging never blocks the primary operation. On the blockchain side, the `logAuditHash()` function in AuditLog.sol stores the hash with the event type and timestamp, making it immutable. The `verifyHash()` function provides O(1) lookup to confirm whether a given hash exists on-chain. Code: `backend/services/audit-service/src/lib/auditLogger.js` (audit log creation and blockchain queuing), `backend/src/models/AuditLog.js` (schema with hash verification method), `blockchain/contracts/AuditLog.sol:102-118` (on-chain logging).

6.4 Security Monitoring
BizClear includes a real-time security monitoring system that detects and alerts on suspicious activity. The security monitor middleware runs on every request and performs pattern-based threat detection.

6.4.1 Threat Detection
The security monitor scans request bodies, query parameters, and URL parameters for SQL injection patterns (SELECT, INSERT, UPDATE, DELETE, DROP, etc.), XSS patterns (script tags, javascript: URIs, event handlers, iframe/img/svg tags), suspicious user agents (missing or very short), and rapid request patterns from the same IP. Code: `backend/services/auth-service/src/middleware/securityMonitor.js:97-214` (detection logic).

6.4.2 Failed Login Tracking
Failed login attempts are tracked per IP address with associated user IDs. When five or more failures occur from the same IP, a high-severity security event is logged to both the application logger and the audit trail. Code: `securityMonitor.js:22-56` (tracking and alerting).

6.4.3 Rate Limit Violation Tracking
Rate limit violations are tracked per IP per endpoint. Repeated violations (10+) trigger high-severity alerts. Code: `securityMonitor.js:61-92`.

6.4.4 Admin Monitoring Dashboard
Administrators can access security statistics via the `/api/admin/monitoring/stats` endpoint, which returns failed login counts (last hour and last day), suspicious request counts, unique IPs with failed logins, and rate limit violation counts. Code: `backend/services/auth-service/src/routes/monitoring.js` (stats endpoint). To verify: log in as admin and call GET `/api/admin/monitoring/stats` — security metrics are returned.

6.4.5 Automatic Cleanup
Old security event data (older than 24 hours) is automatically cleaned up every hour to prevent memory growth. Code: `securityMonitor.js:302-323`.

6.5 Defense-in-Depth
BizClear applies defense-in-depth by layering security controls across all system components:
Web and Mobile Clients enforce input validation, secure session handling via JWT tokens, and CSRF token management.
Backend API enforces authentication (JWT + MFA), authorization (RBAC), input validation (Joi + sanitization), rate limiting, CSRF verification, and security monitoring on every request.
Database Layer restricts access to trusted services via least-privilege users, encrypts all string data fields at the application level using AES-256-GCM field-level encryption (35+ models, randomized + deterministic modes), hashes passwords with bcrypt, maintains immutable audit logs with SHA-256 hashes, and supports encrypted backups.
Blockchain Layer provides tamper-evident verification of audit records through immutable on-chain hash storage with role-based write access.
If one control fails, additional layers reduce the likelihood of a full system compromise.

6.6 AI-Specific Controls
AI classification outputs are advisory only; human reviewers retain final authority over all permit decisions. Input length validation prevents denial-of-service attacks from extremely long inputs, while the scikit-learn model processes all input as text features without code execution capability. The service returns only classification results (LOB category and confidence score) without exposing training data, model internals, or system information. The `/predict` endpoint is designed as a public classification endpoint that does not require authentication, as it processes only business descriptions without accessing sensitive data. Code: `ai/predict_app.py`.

6.7 Blockchain-Specific Controls
The blockchain layer uses a permissioned architecture where only addresses with the AUDITOR_ROLE (granted via AccessControl.sol) can write audit hashes to the ledger. No raw PII is stored on-chain; only SHA-256 hashes, event type strings, and block timestamps are recorded. The AuditLog smart contract validates all inputs: zero hashes are rejected ("Hash cannot be zero"), empty event types are rejected, and duplicate hashes are rejected ("Hash already exists"). Integer overflow protection is automatically provided by Solidity 0.8+ checked arithmetic. Reentrancy is not a concern as the contract makes no external calls. Code: `blockchain/contracts/AccessControl.sol` (role management), `blockchain/contracts/AuditLog.sol` (audit logging with input validation).


7. Limitations & Assumptions
7.1 Assumptions
The system is hosted in a trusted and secured cloud or data center environment.
Operating systems, frameworks, and dependencies are kept up to date.
Users follow basic security practices such as safeguarding their credentials.
7.2 Limitations
The threat model focuses on application-level threats and does not deeply analyze physical security or insider threats.
Zero-day vulnerabilities and advanced persistent threats are outside the scope of this analysis.
Third-party service risks are considered minimal and are not extensively modeled.
AI classification accuracy depends on training data quality and coverage of business description variations.
Blockchain ensures integrity but not correctness of data at entry.
AI bias and false positives are mitigated but not eliminated.
8. Conclusion
This threat modeling exercise identified key security risks affecting BizClear, particularly those related to authentication, access control, data protection, and system availability. By applying the STRIDE framework and mapping threats to the OWASP Top 10, the project gains a structured understanding of its security posture. Every identified threat has been addressed through concrete, implemented security controls documented in Section 6, with code references and verification instructions provided for each control.

The system implements defense-in-depth across all layers: multi-factor authentication with TOTP and WebAuthn passkeys, bcrypt password hashing with 90-day expiry and history tracking, JWT session management with token versioning for instant invalidation, account lockout after failed attempts, per-email rate limiting, multi-layer input validation and sanitization (Joi + sanitizer + Helmet CSP), CSRF double-submit cookies, file upload validation with magic bytes verification, real-time security monitoring with admin dashboards, comprehensive audit logging (30+ event types) with SHA-256 hashing and blockchain-backed immutability, AES-256-GCM field-level encryption of all string data across the entire MongoDB database (35+ models with randomized and deterministic modes), least-privilege database access, and encrypted backups.

Threat modeling adds value by identifying risks early, guiding the selection of appropriate controls, and improving system resilience before deployment. The model should be refined periodically by incorporating updated threat intelligence, conducting penetration testing, and performing code reviews as the system evolves.

Appendices
Appendix A: Full Architecture Diagram







Appendix B: Expanded STRIDE Threat Model
System Component
STRIDE Category
Threat Description
Impact
Likelihood
Risk Score
Risk Level
Mitigation
Web Application
Spoofing
Credential theft via phishing or keylogger
4
3
12
High
MFA (TOTP + WebAuthn), bcrypt password hashing, Cloudflare Turnstile CAPTCHA, real-time login monitoring via `securityMonitor.js`. Code: `auth-service/src/routes/login.js`, `auth-service/src/routes/mfa.js`
Web Application
Tampering
Malicious modification of client-side scripts
3
3
9
Medium
Server-side Joi validation, Helmet CSP headers, sanitization. Code: `auth-service/src/middleware/validation.js`, `auth-service/src/index.js:42-43`
Web Application
Repudiation
Users deny submitting appeals
3
3
9
Medium
Immutable audit logs with SHA-256 hashes and blockchain integration. Code: `backend/src/models/AuditLog.js`, `blockchain/contracts/AuditLog.sol`
Web Application
Information Disclosure
Exposed PII via URL parameters or error messages
4
3
12
High
Input sanitization via `sanitizer.js`, generic error messages prevent information leakage. Code: `auth-service/src/lib/sanitizer.js`, `auth-service/src/routes/login.js:216`
Web Application
Denial of Service
Excessive requests crash web server
4
3
12
High
Per-email/IP rate limiting, security monitoring with alerting. Code: `auth-service/src/middleware/rateLimit.js`, `auth-service/src/middleware/securityMonitor.js`
Web Application
Elevation of Privilege
Unauthorized access to admin functions
4
2
8
Medium
RBAC via `requireRole()`, least-privilege enforcement, admin step-up re-auth. Code: `auth-service/src/middleware/auth.js:68-105`
Mobile App
Spoofing
Fake app impersonates official app
3
3
9
Medium
App signing, secure API endpoints
Mobile App
Tampering
App binary modified to bypass validation
3
3
9
Medium
Server-side Joi validation on all endpoints; mobile app only communicates via authenticated API. Code: `auth-service/src/middleware/validation.js`
API
Spoofing
Token theft or session hijacking
5
4
20
Critical
Short-lived JWT with token version check, HTTPS, admin step-up re-auth (5-min TTL). Code: `auth-service/src/middleware/auth.js:43-56`
API
Tampering
Unauthorized data modification via API
4
3
12
High
RBAC authorization checks, Mongoose ODM (parameterized by design), input sanitization. Code: `auth-service/src/middleware/auth.js:68-80`, `auth-service/src/lib/sanitizer.js`
API
Information Disclosure
Sensitive data returned without proper auth
4
3
12
High
RBAC via `requireRole()`, access control checks on every endpoint, AES-256-GCM encryption for MFA secrets. Code: `auth-service/src/middleware/auth.js:68-80`, `auth-service/src/lib/secretCipher.js`
API
Denial of Service
API flood or resource exhaustion
4
3
12
High
Per-email/IP rate limiting, security monitoring with alerting, input length limits. Code: `auth-service/src/middleware/rateLimit.js`, `auth-service/src/middleware/securityMonitor.js`
Database
Tampering
Unauthorized modification of records
5
2
10
Medium
Least-privilege DB user, SHA-256 hashed audit logging with blockchain integration, Mongoose ODM (parameterized by design). Code: `deploy/mongo-init/01-create-app-user.js`, `audit-service/src/lib/auditLogger.js`
Database
Information Disclosure
Data leaks from misconfigured DB
4
2
8
Medium
Encryption at rest (Atlas/WiredTiger), TLS connections, network isolation, least-privilege access. Code: `auth-service/src/config/db.js:63`, `docs/security/database.md`
Logging System
Repudiation
Logs are altered or deleted
4
4
9
Medium
Immutable logs with SHA-256 hashes, blockchain-backed storage via AuditLog.sol, centralized audit service. Code: `backend/src/models/AuditLog.js`, `blockchain/contracts/AuditLog.sol`, `audit-service/src/lib/auditLogger.js`




Appendix C: OWASP Top 10 References
OWASP Top 10 – 2021: https://owasp.org/Top10/


Injection: Risks related to SQL, NoSQL, OS, and LDAP injection


Broken Authentication: Risks from weak authentication and session management


Sensitive Data Exposure / Cryptographic Failures: Risks from improper encryption or data handling


XML External Entities (XXE): Not currently in scope for BizClear but part of OWASP Top 10


Broken Access Control: Improper enforcement of user permissions


Security Logging & Monitoring Failures: Lack of sufficient logging and monitoring


Denial of Service: Risks of system unavailability due to traffic spikes or abus

9. System Security Checklist

Category 1: Authentication

[x] Strong password hashing (bcrypt/Argon2)
Implementation: bcrypt with 10–12 salt rounds. Code: `backend/services/auth-service/src/routes/login.js:232` (comparison), `signup.js` (hashing at registration). Verify: inspect MongoDB `users.passwordHash` — values start with `$2b$`.

[x] Secure sessions with expiry
Implementation: JWT with configurable TTL (default 60 min), Session model with role-based timeouts (admin=10min, others=1hr). Code: `backend/services/auth-service/src/middleware/auth.js:5` (`ACCESS_TOKEN_TTL_MINUTES`), `login.js:774` (session creation). Verify: decode a JWT — `exp` claim is set; wait past expiry — 401 returned.

[x] Generic login errors
Implementation: All auth failures return "Invalid email or password" regardless of failure reason. Code: `login.js:216`. Verify: attempt login with non-existent email — same error as wrong password.

[x] Rate limiting for logins
Implementation: Per-email rate limiting with fallback to IP; multiple limiters for different actions. Code: `backend/services/auth-service/src/middleware/rateLimit.js` (6 rate limiters). Verify: send rapid POST requests to `/api/auth/login/start` — 429 after threshold.

[x] MFA available or enforced
Implementation: TOTP (authenticator apps) and WebAuthn passkeys; enforced for staff/admin roles. Code: `backend/services/auth-service/src/routes/mfa.js` (MFA lifecycle), `login.js:296` (`requiresMfa` check). Verify: log in as admin — redirected to MFA setup/verification.

[x] Validated tokens (JWT)
Implementation: JWT verification with token version check against database on every request; version mismatch invalidates token. Code: `auth.js:43-56` (verification + token version). Verify: change password → previously issued tokens return 401.

[x] Strong password policy
Implementation: 12+ chars, uppercase, lowercase, digit, special char, max 200 chars; password history (last 5); 90-day expiry. Code: `backend/services/auth-service/src/lib/passwordValidator.js` (strength), `passwordHistory.js` (reuse), `passwordExpiry.js` (expiry). Verify: try registering with "weak" — 400 with specific requirements.

[x] Logout invalidates session
Implementation: Token version increment on logout/password change invalidates all tokens. Code: `auth.js:52-56`. Verify: log in on two browsers, log out on one — other returns 401.

[x] OAuth/SSO or advanced auth
Implementation: Google OAuth2 login + Cloudflare Turnstile CAPTCHA + admin step-up re-auth (5-min TTL). Code: `login.js:91-98` (Google OAuth), `backend/services/auth-service/src/lib/turnstile.js` (CAPTCHA), `auth.js:21-34` (step-up tokens).

[x] Account lockout
Implementation: 5 failed attempts → 15-minute lockout; admin manual unlock. Code: `backend/services/auth-service/src/lib/accountLockout.js`. Verify: enter wrong password 5 times → 423 response.

[x] IP tracking
Implementation: Login IP tracked per user for audit purposes. Code: `login.js:770` (`trackIP()`).

[x] TOTP replay protection
Implementation: Last-used TOTP counter tracked; resubmitted codes rejected. Code: `backend/services/auth-service/src/lib/verificationService.js:164-171`.

Category 2: Input Validation

[x] All inputs validated server-side
Implementation: Joi schema validation on every route with `validateBody()` middleware. Code: `backend/services/auth-service/src/middleware/validation.js`, route files (e.g., `login.js:61-105`). Verify: send malformed JSON — 400 with Joi error details.

[x] Parameterized queries (NoSQL equivalent)
Implementation: MongoDB with Mongoose ODM; all queries use parameterized methods (findOne, findById, etc.); no raw query strings. Code: all route handlers use Mongoose methods exclusively.

[x] XSS protection (multi-layer)
Implementation: (1) Sanitizer strips script/iframe/event handlers; (2) Joi custom validators detect XSS patterns; (3) Helmet CSP restricts script sources. Code: `sanitizer.js:25-28` (stripping), `sanitizer.js:111-128` (detection), `auth-service/src/index.js:42-43` (Helmet). Verify: send `<script>alert(1)</script>` in name field — stripped/rejected.

[x] File upload validation (type + size + magic bytes)
Implementation: 5MB limit, MIME type whitelist, extension whitelist, magic bytes verification (JPEG FF D8 FF, PNG 89 50 4E 47, PDF %PDF). Code: `backend/services/auth-service/src/lib/fileValidator.js`. Verify: upload renamed `.exe` → "File content does not match file type."

[x] API schema validation
Implementation: Joi schemas with custom validators for SQLi and XSS detection on profile/admin routes. Code: `backend/src/routes/auth/profile.js:1685-1719`. Verify: submit profile update with SQL keywords → 400 "contains potentially dangerous content."

[x] NoSQL injection protection
Implementation: `sanitizeObject()` strips `$`-prefixed keys; `sanitizeString()` removes `$[a-zA-Z]+` patterns. Code: `sanitizer.js:20,194-195`. Verify: send `{"email": {"$gt": ""}}` — `$gt` key stripped.

[x] CSRF tokens enabled
Implementation: Double-submit cookie pattern; `crypto.randomBytes(32)` token in cookie matched against `x-csrf-token` header on POST/PUT/PATCH/DELETE. Code: `backend/services/auth-service/src/lib/csrf.js`, `backend/shared/csrf.js`. Verify: POST without `x-csrf-token` header → 403 "csrf_invalid."

[x] Command injection protection
Implementation: Shell metacharacters (`;|&\`$\`) stripped from all inputs. Code: `sanitizer.js:23`.

Category 3: Database Security

[x] Secure credential storage (.env/vault)
Implementation: All secrets in `.env` files; `.gitignore` excludes `.env`; MFA secrets encrypted with AES-256-GCM. Code: `.env.example` (template), `backend/services/auth-service/src/lib/secretCipher.js` (AES-256-GCM). Verify: check `.gitignore` — `.env` listed; check MongoDB `mfaSecret` — starts with `enc:v1:`.

[x] Role-based access control
Implementation: `requireRole()` middleware checks JWT role against allowed roles; least-privilege DB user via init script. Code: `auth.js:68-80` (RBAC), `deploy/mongo-init/01-create-app-user.js` (DB user). Verify: access `/api/admin/*` as business_owner → 403.

[x] Database encryption at rest (full field-level encryption)
Implementation: All string data fields across the entire MongoDB database are encrypted at the application level using AES-256-GCM via a Mongoose encryption plugin applied to 35+ models. Two modes: randomized (unique ciphertext per write) for PII/sensitive data, and deterministic (same ciphertext for same input) for searchable fields like email/username. Encryption key stored in `FIELD_ENCRYPTION_KEY` env var. Additionally, MongoDB Atlas provides storage-level encryption at rest. Code: `backend/shared/lib/fieldCipher.js` (AES-256-GCM), `backend/shared/lib/encryptionPlugin.js` (Mongoose plugin), all model files in `auth-service/src/models/` and `business-service/src/models/`. Verify: inspect any document in MongoDB — all string fields show `enc:v2:` or `det:v2:` prefixed ciphertext.

[x] Encrypted backups
Implementation: AES-256-CBC encryption via OpenSSL when `BACKUP_ENCRYPTION_PASSWORD` is set; authenticated dump with least-privilege user. Code: `deploy/backup.sh:77-86`. Verify: run backup with password set → `.archive.enc` file created.

[x] Audit logging enabled
Implementation: 30+ event types; SHA-256 hashed entries; blockchain integration via queue; `verifyHash()` method for integrity checking. Code: `backend/src/models/AuditLog.js` (schema), `backend/services/audit-service/src/lib/auditLogger.js` (creation + blockchain queue), `blockchain/contracts/AuditLog.sol` (on-chain). Verify: change profile → audit entry appears in `/api/auth/audit/history`.

[x] TLS database connections
Implementation: Production requires `mongodb+srv` (TLS mandatory) or `tls=true`. Code: `backend/services/auth-service/src/config/db.js:63` (enforcement). Documented in `docs/security/database.md`.

[x] Database hardening
Implementation: Least-privilege app user, network isolation (DB only reachable by backend), authenticated backup dumps. Code: `deploy/mongo-init/01-create-app-user.js`, `deploy/backup.sh:64-67`.

Category 4: Threat Modeling

[x] Data Flow Diagram created
Implementation: Described in Section 2 (Architecture) with trust boundaries.

[x] STRIDE threats identified
Implementation: Full STRIDE analysis in Section 4 covering all system components with impact/likelihood scoring.

[x] OWASP Top 10 mapped
Implementation: STRIDE-to-OWASP mapping table in Section 5 covering 8 OWASP categories.

[x] Mitigation plan with priorities
Implementation: Risk matrix in Section 4.4 with Critical/High/Medium/Low priorities; each mitigation linked to code in Section 6.

[x] Risk assessment done
Implementation: Quantitative risk scoring (Impact × Likelihood) with detailed justifications in Section 4.5.

[x] Model updated regularly
Implementation: Review cadence documented in `docs/security/threat-model.md`; referenced from `docs/security/README.md`.

[x] Well-documented
Implementation: This document (IAS), plus `docs/security/README.md`, `docs/security/csrf.md`, `docs/security/database.md`, `docs/security/threat-model.md`, `docs/security/requirements-traceability.md`.

Category 5: Documentation

[x] Complete README
Implementation: `README.md` at project root with setup, deployment, and usage instructions.

[x] Security documentation
Implementation: `docs/security/` folder with README, csrf.md, database.md, threat-model.md, requirements-traceability.md. Code references and IAS checklist linked.

[x] API documentation
Implementation: JSDoc-style comments on all route handlers; Joi schemas serve as living API documentation; `.env.example` files document configuration.

[x] Deployment guide
Implementation: `docs/deployment/` folder with README.md, atlas.md (MongoDB Atlas setup), local.md (local development setup).

[x] Troubleshooting section
Implementation: `docs/troubleshooting/README.md`.

[x] Maintenance notes
Implementation: `docs/maintenance/README.md`.

[x] Organized and accessible docs
Implementation: `docs/TABLE_OF_CONTENTS.md` provides navigation across all documentation.

