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
In addition to digitizing permit and violation workflows, BizClear incorporates AI-assisted document validation to help reviewers verify submitted appeal documents and a blockchain-based ledger to ensure the integrity and immutability of critical violation and appeal records.
1.1.1 What the system does
Allows business owners to view violations, submit appeals, upload supporting documents, and track appeal status in real time.
Enables LGU staff and officers to issue violations, review appeals, manage case workflows, and communicate decisions through a unified system.
Provides administrators with oversight tools such as dashboards, reports, and user management.
Uses AI-assisted document analysis to:
Validate document completeness and format
Detect potential anomalies (e.g., missing signatures, inconsistent dates)
Assist reviewers by flagging high-risk or incomplete submissions
Uses blockchain technology to:
Store cryptographic hashes of violation and appeal records
Ensure records cannot be altered without detection
Provide tamper-evident auditability for official LGU actions

1.1.2 Intended users
Business Owners / Representatives – submit and track appeals, receive notifications, and manage compliance records.
Enforcement Officers – issue and update violations in the field.
LGU Reviewers / Approvers – evaluate appeals, request additional information, and record decisions.
System Administrators – manage users, roles, system configuration, and auditing.


1.1.3 Problem it solves
BizClear addresses delays, limited transparency, lost or misplaced records, and procedural inefficiencies resulting from the manual handling of business violations and appeals within Alaminos City. Traditional paper-based workflows increase processing time, create audit gaps, and make record tracking difficult. By digitizing the entire process, BizClear enhances turnaround time, strengthens accountability mechanisms, ensures traceability of official actions, and improves public trust in regulatory enforcement, while significantly reducing administrative overhead for the city government.
1.2 System Scope
1.2.1 Included components
Web Application – LGU-facing portal for violation management, appeal review, reporting, and administration.
Mobile Application – Business-owner-facing app (and optional officer use) for viewing violations, submitting appeals, uploading documents, and receiving notifications.
Backend API – Central service handling business logic, authentication, authorization, workflows, and integrations between web/mobile clients.
Database – Secure storage for user accounts, roles, violations, appeal records, documents metadata, logs, and audit trails.
1.2.2 Out of scope
Integration with national-level government systems or external court systems.
Automated legal decision-making (final decisions remain human-driven).
Offline-first mobile functionality beyond basic caching
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
 BizClear follows a client–server architecture with a microservice-oriented backend, separating presentation, business logic, and independent services (such as AI, blockchain, and data storage) to support scalability, security, and maintainability.
2.1.1 Web Application
A browser-based interface used primarily by LGU staff, reviewers, and system administrators.
Provides dashboards, violation management, appeal review workflows, reporting, and user/role administration.
Communicates with the backend exclusively through secure API calls.
2.1.2 Mobile Application
A mobile app used mainly by inspectors.
View assigned violations and inspection tasks.
Submit inspection reports and supporting documents
Receive notifications regarding case updates and approvals
Does not directly access the database; all interactions pass through the backend API.
2.1.3 Backend API
Serves as the central control layer of the system.
Handles authentication, authorization (RBAC), business rules, workflow logic, and validation.
Exposes secure endpoints consumed by both web and mobile clients.
Acts as the only trusted intermediary between client applications and the database.
2.1.4 Database Server
Stores structured data such as user accounts, roles, violations, appeal records, decisions, and audit logs.
May store document metadata, while actual files are stored in secure object storage (if applicable).
Is isolated from direct public access and only reachable by the backend API.
2.1.5 Component Interaction Flow
Users interact with the system through either the web or mobile application.
Client applications authenticate users and send requests to the backend API over secure channels.
The backend API processes requests, enforces access controls, and applies business logic.
The API reads from or writes to the database as needed.
Responses are returned to the client applications and displayed to users.
Uploaded documents are forwarded to the AI Validation Service for analysis.
Validation results are stored and presented to reviewers.
Upon issuance or resolution of a violation or appeal:
A cryptographic hash is generated
The hash is written to the Blockchain Ledger
Any later modification can be detected by comparing hashes.
2.1.6 AI Validation Service
An internal service that analyzes uploaded appeal documents.
Performs:
Document type detection
Completeness checks
Consistency and anomaly detection
Returns validation results and risk flags to LGU reviewers.
Does not make automated approval or rejection decisions.
2.1.7 Blockchain Ledger Service
A permissioned blockchain component maintained by the LGU.
Stores:
Hashes of violation records
Hashes of appeal submissions and decisions
Timestamps and issuing authority identifiers
The actual data remains in the database; the blockchain stores proof of integrity, not raw PII.


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
2.3.4 Backend API ↔ AI Validation Service
Treated as a semi-trusted internal boundary.
Requires:
Secure API authentication
Input/output validation
Protection against model manipulation and poisoning
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
3.1.7 AI Models and Validation Results
Trained models used for document analysis
AI-generated risk flags and validation reports


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
AI models & validation outputs
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
Multi-factor authentication, secure password hashing, login rate limiting
Web Application
Information Disclosure
Sensitive data exposed via improper access controls
4
3
12
High
RBAC enforcement, server-side authorization checks
Mobile Application
Tampering
Modified app bypasses client-side validation
3
3
9
Medium
Server-side validation, API-side security checks
Backend API
Spoofing
API requests made with stolen or forged tokens
5
4
20
Critical
Short-lived tokens, HTTPS, token validation, refresh token rotation
Backend API
Elevation of Privilege
User accesses admin-only endpoints
4
2
8
Medium
Strict RBAC, least privilege, authorization middleware
Backend API
Denial of Service
Excessive API requests overwhelm services
4
3
12
High
Rate limiting, request throttling, monitoring
Database
Tampering
Unauthorized modification of violation or appeal records
5
2
10
Medium
Parameterized queries, restricted DB access, audit logging
Database
Information Disclosure
Data leakage due to misconfiguration
4
2
8
Medium
Network isolation, encryption at rest, access controls
Logging / Audit System
Repudiation
Users deny actions due to insufficient logs
3
3
9
Medium
Immutable audit logs, timestamping, user action tracing
AI Validation Service
Information Disclosure
AI leaks sensitive document data



4
2
8
Medium
Data minimization, secure processing



AI Validation Service
Repudiation



Disputes over AI-generated validation results



3
3
9
Medium
Explainable outputs, audit logs



AI Validation Service
Denial of Service


Excessive document submissions overload AI service



3
3
9
Medium
Rate limiting, queueing, fallback processing



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
Based on the identified STRIDE threats and system architecture, the following OWASP Top 10 risks are most relevant to BizClear:
Injection – Risk of malicious input being used to manipulate database queries or backend logic.
Broken Authentication – Weak authentication or session handling leading to account compromise.
Broken Access Control – Users accessing data or actions beyond their assigned roles.
Cryptographic Failures – Sensitive data exposed due to lack of encryption or improper cryptographic practices.
Security Logging and Monitoring Failures – Insufficient logging that prevents detection of attacks or repudiation.
Denial of Service – Abuse of system resources to disrupt availability.
Insecure Design – Overreliance on AI outputs without human validation
Software and Data Integrity Failures – Compromised AI models or blockchain keys
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
6.1 Preventive Controls
Preventive controls are designed to stop security incidents before they occur:
Input Validation – All user inputs are validated and sanitized on the server side to prevent injection attacks.
Authentication and Authorization – Strong authentication mechanisms combined with role-based access control (RBAC) enforce least privilege.
Encryption – Data in transit is protected using TLS, while sensitive data at rest is encrypted in the database.
Secure Configuration – Default credentials are removed, and system components are hardened before deployment.
6.2 Detective Controls
Detective controls help identify and respond to security incidents:
Logging – Authentication events, data changes, and administrative actions are logged.
Monitoring – Automated monitoring detects abnormal behavior such as excessive failed logins or traffic spikes.
Error Handling – Errors are handled securely to avoid leaking sensitive system information to users.
6.3 Defense-in-Depth
BizClear applies defense-in-depth by layering security controls across all system components:
Web and Mobile Clients enforce basic validation and secure session handling.
Backend API enforces authentication, authorization, validation, and rate limiting.
Database Layer restricts access to trusted services, uses encryption, and maintains audit logs.
If one control fails, additional layers reduce the likelihood of a full system compromise. 

6.4 AI-Specific Controls
AI outputs are advisory only
Human reviewers retain final authority
Input and output validation for AI services
Periodic model review and retraining


6.5 Blockchain-Specific Controls
Permissioned blockchain (LGU-controlled nodes)
No raw PII stored on-chain
Secure key management for ledger access
Regular integrity verification against database records


7. Limitations & Assumptions
7.1 Assumptions
The system is hosted in a trusted and secured cloud or data center environment.
Operating systems, frameworks, and dependencies are kept up to date.
Users follow basic security practices such as safeguarding their credentials.
7.2 Limitations
The threat model focuses on application-level threats and does not deeply analyze physical security or insider threats.
Zero-day vulnerabilities and advanced persistent threats are outside the scope of this analysis.
Third-party service risks are considered minimal and are not extensively modeled.
AI validation accuracy depends on training data quality.
Blockchain ensures integrity but not correctness of data at entry.
AI bias and false positives are mitigated but not eliminated.
8. Conclusion
This threat modeling exercise identified key security risks affecting BizClear, particularly those related to authentication, access control, data protection, and system availability. By applying the STRIDE framework and mapping threats to the OWASP Top 10, the project gains a structured understanding of its security posture.
Threat modeling adds value by identifying risks early, guiding the selection of appropriate controls, and improving system resilience before deployment. As next steps, the model can be refined by incorporating quantitative risk scoring, periodic reviews, and security testing such as penetration testing and code reviews

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
MFA, secure password storage, login monitoring
Web Application
Tampering
Malicious modification of client-side scripts
3
3
9
Medium
Server-side validation, integrity checks
Web Application
Repudiation
Users deny submitting appeals
3
3
9
Medium
Immutable audit logs with timestamps
Web Application
Information Disclosure
Exposed PII via URL parameters or error messages
4
3
12
High
Input sanitization, proper error handling
Web Application
Denial of Service
Excessive requests crash web server
4
3
12
High
Rate limiting, monitoring, load balancing
Web Application
Elevation of Privilege
Unauthorized access to admin functions
4
2
8
Medium
RBAC, least privilege enforcement
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
Server-side validation, integrity checks
API
Spoofing
Token theft or session hijacking
5
4
20
Critical
Short-lived tokens, HTTPS, refresh token rotation
API
Tampering
Unauthorized data modification via API
4
3
12
High
Authorization checks, parameterized queries
API
Information Disclosure
Sensitive data returned without proper auth
4
3
12
High
RBAC, access control checks, encryption
API
Denial of Service
API flood or resource exhaustion
4
3
12
High
Rate limiting, throttling, monitoring
Database
Tampering
Unauthorized modification of records
5
2
10
Medium
Restricted access, audit logging, parameterized queries
Database
Information Disclosure
Data leaks from misconfigured DB
4
2
8
Medium
Encryption at rest, access controls, network isolation
Logging System
Repudiation
Logs are altered or deleted
4
4
9
Medium
Immutable logs, centralized storage, 




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
Strong password hashing (bcrypt/Argon2)
Secure sessions with expiry
Generic login errors
Rate limiting for logins
MFA available or enforced
Validated tokens (JWT)
Strong password policy
Logout invalidates session
OAuth/SSO or advanced auth
Category 2: Input Validation
All inputs validated server-side
Parameterized SQL queries
XSS protection (context-aware escaping)
File upload validation (type + size)
API schema validation
NoSQL injection protection
CSRF tokens enabled
Category 3: Database Security
Secure credential storage (.env/vault)
Role-based access control
Database encryption at rest
Encrypted backups
Audit logging enabled
TLS database connections
Database hardening
Category 4: Threat Modeling
Data Flow Diagram created
STRIDE threats identified
OWASP Top 10 mapped
Mitigation plan with priorities
Risk assessment done
Model updated regularly
Well-documented


Category 5: Documentation
Complete README
Security documentation
API documentation
Deployment guide
Troubleshooting section
Maintenance notes
Organized & accessible docs




































Checklist Item

Secure
(✓)

Needs
Fix (-)

Remarks/Observation (e.g.,
"Used bcrypt for
passwords," "Saw raw SQL
in code")

1. Authentication &
Authorization: Login requires
encrypted credentials (e.g., HTTPS in
transit, hashed in DB). Access to
restricted routes (e.g., /admin) is
properly controlled.
2. Input Validation & Data
Handling: Evidence of sanitized
inputs to prevent SQLi or XSS (e.g.,
using parameterized queries,
escaping output).
3. Data Protection at Rest: Sensitive
data (passwords, PII) is encrypted or
hashed in the database.
4. Secure Data Deletion: The
"delete" function truly removes
data or archives it securely, rather
than just changing its visibility.
5. Error Handling & Logging: Error
messages shown to the user are
generic. Logs do not expose
sensitive data like passwords or
database schemas.


CHECKPOINT 2: SYSTEM SECURITY (Rubrics)

Course Code: ITE 370 -_____ Group #: __________
Course Description: ___IAS 2_____ Date:_______________________

Group Rubric for Class Reporting
Criteria Excellent (5) Good (4) Fair (3) Needs

Improvement (2)
SCORE

Authentication
(6)

Strong hashing,
secure sessions,
MFA, token
validation,
logout, rate
limiting

Most controls
present but
missing 1–2

Basic controls
only

No security
controls _______ /30

Input
Validation (5)

Full server
validation,
SQL/XSS/CSRF
protection,
schema checks
Some
protections
missing

Minimal
validation Lack validation _______ /25

Database
Security (4)

Encrypted DB,
RBAC, TLS,
backups, logs

Partial
encryption or
RBAC

Weak DB
security

No security _______ /20

Threat
Modeling (3)

DFD, STRIDE,
OWASP, risk
scoring,
mitigation

Partial
analysis

Minimal
documentation Basic/inconsistent _______/15

Documentation
(2)

Complete,
secure, clear
docs

Mostly
complete Basic docs

Poorly written

_______ /10

TOTAL SCORE: (60%)

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Individual Rubric for Class Reporting
Criteria Excellent (5) Good (4) Fair (3) Needs
Improvement
(2)

Score

Knowledge of
Topic

Deep
understanding
Good
understanding

Somewhat
unclear

Poor
understanding

Preparedness Fully
prepared

Mostly
prepared

Some
preparation

Unprepared

Speaking
Skills

Clear,
confident,
good pace

Mostly clear Unclear at
times

Poor clarity

Ability to
answer

Excellent and
creative

Clear and
relevant

Basic No idea at all

Teamwork All members
participated
equally

Most
participated

Unequal
participation

Very uneven
or poor
collaboration

TOTAL SCORE: (40%)

NAME

Knowledge
of Topic

Prepared
ness

Speaking
Skills

Ability
to
answer
Teamwork Total
Score:

1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
Comments:
__________________________________________________________________
__________________________________________________________________
__________________________________________________________________

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
CHECKPOINT 2: SYSTEM SECURITY CHECKLIST
Category 1: Authentication
• ☐ Strong password hashing (bcrypt/Argon2)
• ☐ Secure sessions with expiry
• ☐ Generic login errors
• ☐ Rate limiting for logins
• ☐ MFA available or enforced
• ☐ Validated tokens (JWT)
• ☐ Strong password policy
• ☐ Logout invalidates session
• ☐ OAuth/SSO or advanced auth (bonus)

Category 2: Input Validation
• ☐ All inputs validated server-side
• ☐ Parameterized SQL queries
• ☐ XSS protection (context-aware escaping)
• ☐ File upload validation (type + size)
• ☐ API schema validation
• ☐ NoSQL injection protection
• ☐ CSRF tokens enabled

Category 3: Database Security
• ☐ Secure credential storage (.env/vault)
• ☐ Role-based access control

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
• ☐ Database encryption at rest
• ☐ Encrypted backups
• ☐ Audit logging enabled
• ☐ TLS database connections
• ☐ Database hardening

Category 4: Threat Modeling
• ☐ Data Flow Diagram created
• ☐ STRIDE threats identified
• ☐ OWASP Top 10 mapped
• ☐ Mitigation plan with priorities
• ☐ Risk assessment done
• ☐ Model updated regularly
• ☐ Well-documented

Category 5: Documentation
• ☐ Complete README
• ☐ Security documentation
• ☐ API documentation
• ☐ Deployment guide
• ☐ Troubleshooting section
• ☐ Maintenance notes
• ☐ Organized & accessible docs

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
SYSTEM SECURITY CHECKPOINT FORM
Tick (✔) the box that best describes the system.
For Faculty Evaluator use

Category 1: Authentication
Criteria

Checkpoint
Questions

Password
Storage

Are
passwords
hashed
securely?
☐
Plaintext
☐
MD5/SHA1
☐
bcrypt/Argon2

☐ bcrypt + salt/pepper

Session
Management

Do sessions
expire and use
secure flags?

☐ None ☐ No expiry ☐ Expiry set ☐ Expiry + secure flags

Error
Handling

Do login
errors leak
info?

☐ Leaks ☐
Inconsistent

☐ Generic ☐ Generic + logs

Brute Force
Protection

Are login
attempts
limited?

☐ None ☐ Counting ☐ Rate limit ☐ Rate + CAPTCHA

MFA / 2FA Is MFA

enforced? ☐ None ☐ Planned ☐ Optional ☐ Mandatory (admin)

Token
Security

Are auth
tokens
validated?

☐ None ☐ Basic

☐ JWT
validated

☐ Short-lived + refresh

Password
Policy

Is there a
strong
password
policy?

☐ None ☐ Length ☐ Length +
complexity

☐ + expiration

Logout /
Inactivity

Does logout
destroy the
session?

☐ None ☐ Partial ☐ Invalidate ☐ Auto timeout

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Criteria Checkpoint
Questions

Extra Credit

Advanced
authentication
used?

☐ None
☐
OAuth/SSO

☐ Biometrics ☐ Hardware/passkeys

Category 2: Input Validation
Criteria Checkpoint Questions
Server
Validation

Is all input validated
server-side?

☐
None
☐ Some ☐ All ☐ + Sanitization

SQL Injection Are queries protected? ☐
Raw
☐
Escaped
☐
Parameterized
☐ ORM

XSS Is output safely
escaped?

☐
None
☐ Basic

☐ Context
aware

☐ CSP + sanitize

File Upload Are uploads checked? ☐
None
☐ Type
only

☐ Type + size ☐ + scanning

API
Validation Are APIs validated? ☐
None
☐ Manual ☐ Schema ☐ Auto +
feedback

NoSQL
Injection

Are NoSQL queries
protected?

☐
None
☐ Filter ☐ Param

☐ ORM +
validation

CSRF Is CSRF protection
enabled?

☐
None
☐ Token ☐ Sync tokens ☐ SameSite +
token

Category 3: Database Security
Criteria Checkpoint
Credential
Storage

How are DB creds
stored?

☐
Hardcoded

☐ Exposed
.env

☐ Secure
.env

☐ Vault

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Criteria Checkpoint
Access Control Who can access

DB? ☐ Admin all ☐ Roles ☐ RBAC ☐ RBAC + ABAC

Encryption at
Rest

Is data encrypted? ☐ None ☐ Some ☐ Full ☐ Field + TDE

Backup
Security

Are backups
secured? ☐ None
☐
Unencrypted
☐
Encrypted

☐ Encrypted +
offsite

Audit Logging Are DB actions

logged? ☐ None ☐ Errors ☐ Full logs ☐ Real-time
alerts

Connection
Security

Are connections
encrypted? ☐ Plain ☐ Self-signed ☐ Valid
TLS

☐ mTLS +
pinning

Hardening Is DB hardened? ☐ Default ☐ Basic
☐
Hardened

☐ Scanned +
patched

Category 4: Threat Modeling
Criteria Checkpoint
DFD

Is a data flow diagram
created?

☐
None
☐
Basic
☐ Detailed ☐ Trust boundaries

STRIDE Are threats identified? ☐
None
☐ Few
☐ All
STRIDE

☐ Detailed

OWASP Is OWASP mapped? ☐
None
☐
Basic
☐ Top 10 ☐ + CVSS

Mitigation

Is there a mitigation
plan?

☐
None
☐
Basic
☐
Prioritized

☐ Owners +
timeline

Risk
Assessment Are risks scored? ☐
None
☐
Basic
☐
Qualitative

☐ Quantitative

Updates Is model updated? ☐
Static
☐
Once
☐ Regular ☐ Automated

ITE 370 – IAS 2 Dr. Engelbert Q. Cruz
Criteria Checkpoint
Documentation Is it well documented? ☐ Poor
☐
Basic
☐ Clear ☐ Visual

Category 5: Documentation
Criteria Checkpoint
README Is there a complete README? ☐ None ☐ Basic ☐ Full + security
Security Docs Are controls documented? ☐ None ☐ List ☐ Detailed
API Docs Are APIs documented? ☐ None ☐ List ☐ Full spec
Deployment Are steps documented? ☐ None ☐ Basic ☐ Secure
Troubleshooting Are common issues listed? ☐ None ☐ Some ☐ Full
Maintenance Are updates documented? ☐ None ☐ Notes ☐ Schedule
Accessibility Is it well organized? ☐ No ☐ Basic ☐ Searchable

Comments:
__________________________________________________________________
__________________________________________________________________
__________________________________________________________________


