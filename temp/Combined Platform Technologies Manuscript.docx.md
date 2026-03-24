



BizClear 
A Blockchain-Enhanced Business Permit Processing and Inspection Tracking System with AI-Powered Business Classification and Audit Trail Management: An Alaminos City, Pangasinan LGU Solution 



Submitted by
Designation
Name of Student
Signature
Leader
Diaz, Mark Stephen 


Members
Enrique, John Wayne




Lazo, Keith Ardee




Brudo, Ericka Tresenio




Posadas, Xander





Submitted to:
Dr. Kris C. Calpotura, DIT

Date:
March 2026
TABLE OF CONTENTS
TABLE OF CONTENTS	1
LIST OF TABLES	3
LIST OF FIGURES	5
ACRONYMS	6
1. INTRODUCTION	7
1.1 Background and Problem Statement	7
1.2 Platform Choice Justification	10
2. METHODOLOGY	11
2.1 Software Methodology	11
2.2 Sources of Data	13
2.3 System Requirements	13
2.3.1 Functional Requirements	13
2.3.2 Nonfunctional Requirements	13
2.3.3 Software Requirements	14
2.3.4 Hardware Requirements	15
2.4 System Architecture	16
2.5 Sprint 1: Core Feature Development	18
2.5.1 AI Core Feature	18
2.5.2 Blockchain Core Feature	18
2.5.3 Web Feature	18
2.5.4 Mobile Feature	19
2.6 Sprint 2: Expansions and Integration	20
2.6.1 AI Expansion: Filipino Language Input Support	20
2.6.2 Blockchain Expansion: Audit History Retrieval	20
2.6.3 Integration	20
3. SECURITY CONSIDERATIONS	22
3.1 AI Track Security Implementation	22
3.2 Blockchain Track Security Implementation	23
3.3 Web Application Security	23
3.4 Security Testing Methodology	24
3.5 Threat Modeling and Risk Prioritization	24
3.5.1 Asset Identification and CIA Triad	24
3.5.2 STRIDE Threat Model	25
3.5.3 Risk Prioritization Matrix	25
3.5.4 Risk Justifications	26
3.5.5 OWASP Top 10 Mapping	26
3.6 Security Controls Implementation	27
3.6.1 Preventive Controls	27
3.6.2 Detective Controls	27
3.6.3 Defense-in-Depth	27
3.6.4 AI-Specific Controls	27
3.6.5 Blockchain-Specific Controls	28
4. PERFORMANCE AND SCALABILITY	29
4.1 Performance Metrics Overview	29
4.2 AI Track Performance Analysis	29
4.3 Blockchain Track Performance Analysis	30
4.4 Scalability Considerations	30
4.5 Performance vs. Security Trade-offs	30
5. EVALUATION AND TESTING	32
5.1 Testing Methodology	32
5.2 Sprint 1 Evaluation Results	32
5.3 Sprint 2 Evaluation Results	33
5.4 Evaluation Summary	34
6. REFLECTION AND LEARNINGS	35
6.1 Mark Stephen Diaz - Project Leader & Lead Developer	35
6.2 John Wayne Enrique - Blockchain Development	35
6.3 Keith Ardee Lazo - Frontend & Web Integration	36
6.4 Ericka Tresenio Brudo - Testing & Quality Assurance	36
6.5 Xander Posadas - System Architecture & Deployment	37
REFERENCES	39
APPENDICES	41
A.1 Sprint 1: AI Prototype Plan	41
A.2 Sprint 1: Blockchain Prototype Plan	43
B.1 Sprint 2: AI Prototype Plan	46
B.2 Sprint 2: Blockchain Prototype Plan	49
C.1 AI Model Evaluation Results	52
C.1.1 Sprint 1: English-Only Prototype Evaluation	52
C.1.2 Sprint 2: Bilingual Model Evaluation	53
C.2 Blockchain Prototype Test Results	54
C.2.1 Sprint 1: Core Audit Trail Test Results	54
C.2.2 Sprint 2: Gas Optimization and History Retrieval Test Results	55
D. Security Test Results	57
D.1 AI Security Test Results	57
D.2 Blockchain Security Test Results	57
E. Performance Metrics	58
E.1 AI Performance Metrics Table	58
E.2 Blockchain Performance Metrics Table	58
F. Evaluation Test Results	59
F.1 Sprint 1 Test Results Summary	59
F.2 Sprint 2 Test Results Summary	59
G. Security Threat Modeling Tables	60
G.1 CIA Triad Mapping for Critical Assets	60
G.2 STRIDE Threat Analysis	61
G.3 Risk Prioritization	64
G.4 Risk Justification	67
G.5 OWASP Top 10 Mapping	71
H. Screenshots of the System	72

LIST OF TABLES
Table
Description
0.1
List of Tables
0.2
List of Figures
0.3
Acronyms and Their Full Terms
B.1
Software Requirements
B.2
Hardware Requirements
C.1.1
Sprint 1 AI Training Configuration
C.1.2
Sprint 1 AI Functional Test Results
C.1.3
Sprint 2 AI Training Configuration
C.1.4
Sprint 2 AI Functional Test Results
C.2.1
Sprint 1 Blockchain Functional Test Results
C.2.2
Sprint 1 Blockchain Gas Consumption
C.2.3
Sprint 2 Blockchain New Function Test Results
C.2.4
V3 Gas Optimization Results
C.2.5
Ethereum Mainnet Cost Inputs
C.2.6
Ethereum Mainnet Monthly Cost Calculation
D.1
AI Security Test Results
D.2
Blockchain Security Test Results
E.1
AI Model Performance Metrics
E.2
Blockchain Performance Metrics
F.1
Sprint 1 Test Results Summary
F.2
Sprint 2 Test Results Summary
G.1
CIA Triad Mapping for Critical Assets
G.2
STRIDE Threat Analysis
G.3
Risk Prioritization Matrix
G.4
Risk Justifications
G.5
STRIDE to OWASP Top 10 Mapping
H
Screenshots of the System


Table 0.1 List of Tables

LIST OF FIGURES
Figure
Description
2.1
Kanban Development Workflow Diagram
2.2
System Architecture Diagram
A.1
Sprint 1 AI Classification Flow Diagram
A.2
Sprint 1 Blockchain Prototype Diagram
B.1
Sprint 2 AI Enhanced Classification Flow Diagram
B.2
Sprint 2 Blockchain Enhanced Audit Flow Diagram


Table 0.2 List of Figures
ACRONYMS
Acronym
Full Term
AI
Artificial Intelligence
API
Application Programming Interface
BPLO
Business Permits And Licensing Office
LGU 
Local Government Unit
RBAC
Role-Based Access Control
SHA
Secure Hash Algorithm
TLS
Transport Layer Security


Table 0.3 Acronyms and Their Full Terms
1. INTRODUCTION
1.1 Background and Problem Statement
	The issuance and regulation of business permits are among the core responsibilities of Local Government Units (LGUs), serving as a mechanism to ensure that enterprises operate lawfully, safely, and in accordance with regulatory standards. An effective business permit system plays a vital role in supporting local economic development, safeguarding public welfare, and strengthening public confidence in government institutions. Conversely, inefficient, fragmented, or poorly supervised permit processes may hinder business growth, delay investments, and weaken regulatory compliance, ultimately affecting overall economic performance.
	In recent years, the adoption of digital technologies has reshaped public service delivery across the globe through the expansion of e-government initiatives. Digital systems have been shown to streamline administrative procedures, reduce processing time, minimize errors, and enable real-time tracking of transactions. The digital transformation of public administration has been widely recognized as a crucial approach to enhancing transparency, improving service quality, and promoting citizen participation in governance (Ouboumlik & Ouazzani Touhami, 2024). More recently, emerging technologies such as Artificial Intelligence (AI) and blockchain have gained attention for their potential to further strengthen digital governance frameworks. AI technologies have been applied to automate verification of forms and case data, identify irregularities, and support decision-making processes (Adesoga et al., 2024), while blockchain technology offers secure, transparent, and tamper-resistant recordkeeping capabilities (Kumar et al., 2023).
	Evidence from public sector studies indicates that AI adoption contributes to improved efficiency, enhanced service delivery, and better resource management through automation and intelligent analytics (Tveita & Hustad, 2025). However, successful implementation of AI requires careful consideration of ethical concerns, trust, and workforce readiness, highlighting the importance of appropriate governance and regulatory frameworks (Tveita & Hustad, 2025). When AI is integrated with blockchain technology, these advantages are further reinforced. Research suggests that the convergence of AI and blockchain produces greater benefits than the standalone use of either technology. Kumar et al. (2023) emphasized that this integration enhances data accuracy, reliability, and trust across organizational processes. Similarly, Lubis et al. (2025) noted that combining AI’s analytical capabilities with blockchain’s immutable ledger significantly improves transparency and accountability in e-governance applications. Blockchain’s decentralized and tamper-proof structure has also been shown to reduce fraud risks and strengthen stakeholder confidence in digital systems (Priatmaja et al., 2024). Collectively, these findings demonstrate the effectiveness of integrated digital solutions in addressing persistent challenges within public sector service delivery.
	Research on e-government service quality further highlights its influence on citizen satisfaction and trust. High-quality digital services, particularly those that provide accurate, timely, and reliable information, have been found to positively affect citizen satisfaction, which in turn strengthens trust in government competence and service performance (Pramuditha et al., 2024). This relationship underscores the importance of prioritizing service quality when implementing digital government initiatives.
	Within the Philippine setting, various e-government programs have been introduced to modernize local governance; however, implementation outcomes remain inconsistent across LGUs. Studies reveal that many local governments continue to rely on disconnected systems, limited integration, and manual procedures despite the presence of basic information and communication technology (ICT) initiatives (De Castro, 2022). Research on smart city development in the Philippines points to challenges such as the absence of standardized platforms, insufficient coordination, and the lack of unified digital infrastructures, all of which restrict the full potential of e-governance efforts (Liponhay, 2023). Additional studies indicate that while some LGUs have established online portals, these platforms often fail to fully integrate transactions and records, resulting in incomplete digital service delivery (IOER International Multidisciplinary Research Journal, 2023). Other research attributes the slow progress of e-governance initiatives to limited budgets, outdated infrastructure, and underutilized ICT capabilities (Correa et al., 2022). Despite these barriers, digital transformation initiatives in selected areas have led to improvements in operational efficiency, revenue generation, and citizen access to public services, although disparities in infrastructure, technical capacity, and adoption levels persist (Cereno, 2024).
	Studies focusing on business permit systems in Philippine cities further emphasize the significance of efficient permit processing. Research on the Business Permits and Licensing System (BPLS) in Iloilo City found a strong relationship between system efficiency and business satisfaction, with respondents indicating that simplified and efficient processes encourage compliance and create a more favorable business environment (Niño & Gentoral, 2024). The study highlighted the importance of fully implementing electronic BPLS platforms as part of broader ease-of-doing-business initiatives.
Despite ongoing reforms, several challenges continue to affect business permit processing systems, including manual document handling, redundant requirements, delayed inspections, weak inter-office coordination, and inadequate record security. The digitalization of services that involve multiple government offices requires effective coordination structures, as successful multi-agency systems must balance decentralized operations with centralized oversight to achieve efficiency and consistency (Scholta et al., 2025). These issues increase the likelihood of data loss or manipulation, reduce transparency, and limit the ability of LGUs to accurately monitor compliance histories. Existing literature also reveals a scarcity of practical implementations that integrate AI-based validation of permit forms with blockchain-secured record management at the local government level, particularly in developing countries (Lubis et al., 2025).
The current workflow also presents challenges related to efficiency and accountability. Inspection results are documented separately by each office, making coordination difficult and slowing down overall decision-making. Record retrieval for verification or audit purposes is time-consuming, and the lack of a centralized system heightens the risk of data inconsistency and unauthorized alteration.
In response to these challenges, this study proposes BizClear, a blockchain-enhanced business permit processing and inspection tracking system with AI-powered business classification. The AI provides Filipino language support for business classification, enabling local business owners to describe their businesses in their native language and receive accurate Line of Business recommendations. The system does not perform identity document verification—BPLO does not verify IDs per field visit. The proposed solution aims to digitize permit application and renewal procedures, streamline inspection coordination among LGU offices, provide Filipino language business classification, and secure permit and inspection records through blockchain technology. By implementing these features, BizClear is expected to enhance efficiency, transparency, accountability, and the overall ease of doing business in Alaminos City.

1.2 Platform Choice Justification
	Local Government Units face persistent challenges in business permit processing, including manual document handling, delayed inspections, weak inter-office coordination, and inadequate record security. These issues affect business owners who experience slow processing times and lack of transparency, LGU personnel who struggle with fragmented workflows and paper-based systems, and managers who lack real-time insights for decision-making. The urgency of solving this problem is underscored by the Philippine government's push for digital transformation and ease-of-doing-business reforms.
The researchers considered two primary platform options for BizClear: a traditional web-based system with centralized database storage, and a blockchain-enhanced web platform with AI integration. The traditional approach offers simpler implementation but lacks tamper-evident audit trails and intelligent automation. The blockchain-enhanced approach provides immutable record-keeping and AI-powered features but requires more complex architecture. The researchers also considered mobile-only and desktop-only alternatives, but these would limit accessibility for diverse user groups.
The researchers chose the blockchain-enhanced web platform with AI integration because it excels across all three evaluation factors. In terms of scalability, the system can handle increasing users, data volume, and transaction loads without failure; the microservices architecture allows independent scaling of components, and blockchain hash storage keeps on-chain costs minimal while the system can expand to serve multiple LGUs. For user experience, the web-based interface provides accessibility through standard browsers for all user types, mobile support enables offline inspection capabilities fitting inspector field habits, and the AI-powered Filipino language classification allows local business owners to interact in their native language with response times averaging 53 milliseconds after optimization. Regarding business fit, the platform aligns with the development team's existing skills in web technologies and blockchain, requires minimal hardware investment since users access the system through existing devices, and the open-source technology stack ensures long-term maintainability without vendor lock-in. Although blockchain integration adds architectural complexity, the benefits of tamper-evident audit trails, AI-powered Filipino language support, and scalable web accessibility outweigh the implementation costs.

2. METHODOLOGY
2.1 Software Methodology
	The researchers developed BizClear using Kanban methodology, an agile framework that emphasizes visual workflow management, continuous delivery, and evolutionary change. This approach was selected because the evolving requirements discovered during BPLO field visits necessitated a flexible process that could adapt to new insights, the system development nature required frequent demos and validation of working prototypes, integration of AI and blockchain components benefited from iterative refinement, and the limited timeline and team size favored a lightweight, visual approach over rigid methodologies. The development workflow utilized a Kanban board with columns representing the development lifecycle: Backlog, To Do, In Progress, Testing, and Done, enabling the team to visualize work-in-progress limits and identify bottlenecks. The Kanban principle of "pull system" governed task assignment, with team members pulling new work only when capacity became available, ensuring sustainable development pace and preventing overcommitment. Continuous delivery was achieved through frequent small releases of working software, allowing for rapid feedback from the BPLO officer and iterative improvements based on real-world usage. The methodology's emphasis on "stop starting, start finishing" promoted completion of existing features before beginning new ones, which proved essential for managing the complex integration of multiple technologies while maintaining system quality and meeting project deadlines within the constrained timeline.
The development proceeded through four phases: Phase 1 (Requirements Gathering & Field Visit) involved conducting a field visit to Alaminos City BPLO to understand the manual business permit workflow, interviewing the BPLO officer using semi-structured questionnaires, and collecting and analyzing physical forms including the unified business permit form. Phase 2 (Prototype Development) involved building early working versions of key components: an AI business classification prototype with Filipino language support trained on 4000+ examples with 73% Filipino data, enabling local business owners to describe their businesses in their native language and receive accurate Line of Business recommendations, and a blockchain audit prototype with Gradio UI for logging and verifying audit hashes on Ganache. Phase 3 (Core Workflow Implementation) involved implementing the full BizClear platform including business registration, permit application and renewal workflows, inspection coordination across BPLO, BFP, Sanitary, Zoning, and Engineering offices, fee computation with late penalties, and integration with the AI classification service and blockchain audit-service. Phase 4 (Security Hardening) involved implementing rate limiting, service-to-service authentication using X-API-Key, role-based access control (RBAC), input sanitization to prevent injection attacks, and least-privilege audit history.


Figure 2.1 Kanban Development Workflow Diagram


2.2 Sources of Data
Primary sources included interviews and consultations with BPLO staff (including the BPLO officer at Alaminos City), inspectors, and business owners; observation of current LGU processes and review of existing permit forms and inspection records (including the unified business permit form); and system-generated test data used during development and evaluation. Secondary sources included reference materials from government regulations and guidelines. The study site was Alaminos City, Pangasinan; workflow and requirements were validated with the BPLO to align the system with actual permit processing practice.
2.3 System Requirements
2.3.1 Functional Requirements
User registration, authentication, and RBAC implementation.
Online submission and tracking of permit applications.
Cessation and appeal processing.
Inspection management with mobile/offline support.
Payment processing and receipt generation.
Blockchain-based recording of immutable event hashes.
Audit logging and reporting.
2.3.2 Nonfunctional Requirements
The following nonfunctional requirements are based on the ISO/IEC 25010 software product quality model and serve as the baseline criteria for evaluating BizClear's quality attributes in deployment and operations.
Functional Suitability: Provide accurate permit processing, inspection management, AI-assisted validation of the unified business permit form, and reporting features that match validated LGU workflows.
Performance Efficiency: Ensure the dashboard and core modules respond within 2 seconds under normal load and remain stable during peak submission periods through caching, query optimization, and load controls.
Compatibility: Support full functionality across major web browsers (Chrome, Edge, Firefox) and mobile platforms used by inspectors and field personnel.
Usability: Deliver intuitive, role-based interfaces that require minimal training for business owners, BPLO officers, inspectors, managers, and administrators.
Reliability: Maintain high service continuity for permit transactions and audit operations, with monitoring, failover handling, and controlled degradation during subsystem outages (e.g., deferred blockchain writes).
Security: Protect data and services through RBAC, MFA, token/session controls, input validation, encryption in transit and at rest, and tamper-evident audit logging aligned with data privacy and regulatory requirements.
Maintainability: Use modular microservices, documented APIs, standardized coding practices, and testable service boundaries to support defect isolation, updates, and long-term enhancement.
Portability: Enable deployment across local development, containerized environments, and cloud-hosted infrastructure with environment-based configuration and minimal platform lock-in.
2.3.3 Software Requirements
The system requires a combination of modern software tools and frameworks to ensure efficient development, secure data handling, and intelligent processing. These requirements cover essential components such as web browsers for accessibility, backend technologies for handling server-side operations, databases for structured data storage, blockchain for secure and immutable logging, and AI/ML libraries for advanced analytics and business classification. Together, these technologies provide a scalable and reliable foundation for the system’s overall functionality.

Component
Purpose
Web Browsers
Google Chrome, Microsoft Edge, Mozilla Firefox - For testing and accessing the system during development
Backend Framework
Supporting RESTful APIs - To develop server-side logic and expose services to the frontend
Database: MongoDB
To store and manage system data such as permits, users, and audit logs
Blockchain Framework
To securely log immutable events and support traceability
AI/ML Libraries
For business classification and analytics - To implement AI-powered business classification with Filipino language support and generate managerial insights


Table B.1 Software Requirements
2.3.4 Hardware Requirements
The system also requires appropriate hardware and connectivity to ensure reliable operation across different environments. These requirements outline the minimum and recommended specifications for servers, client devices, mobile devices, and network connectivity. Meeting these ensures that the system performs efficiently, supports smooth user interaction, and maintains consistent access to its features across all platforms.


Server/Backend
Requirement
Specification
Minimum
Any server capable of hosting API and database
Recommended
Stable server or cloud hosting for smoother performance
Client Devices
Minimum
Desktop, laptop, tablet, or smartphone
Recommended
Desktop, laptop, tablet, or smartphone with modern OS and browser
Mobile Devices
Minimum
Devices with camera support
Recommended
Devices with high-resolution camera for clearer inspection images
Network/Internet
Minimum
Stable internet connection
Recommended
High-speed internet for faster data transmission and reliability


Table B.2 Hardware Requirements

2.4 System Architecture
	The BizClear system adopts a layered microservices architecture, ensuring modularity, scalability, security, and maintainability. Each layer focuses on specific responsibilities while communicating via well-defined interfaces.
User Layer (Client-Side Components)
Accessed by business owners, LGU officers, managers, super Admin, and Admin via web browsers.
Inspectors can access the system through mobile devices with camera support for inspection documentation.
Handles presentation logic, user interactions, and local input validation.
Admin Roles: Manage system configurations, user accounts, services, and oversee overall operations.

Application Layer (Microservices)
User Authentication & Role-Based Access Control (RBAC)
Permit Submission & Appeal Management
AI document validation
Payment processing
Blockchain logging
Reporting and dashboards
AI Business Classification Service
Provides Filipino language business classification, enabling local business owners to describe their businesses in their native language and receive accurate Line of Business recommendations. It uses a scikit-learn LinearSVC model trained on 4,032 bilingual examples with 73% Filipino data, employing TF-IDF vectorization with hybrid word-character features to recognize both English and Filipino terms like "tindahan", "karinderia", and "serbisyo". The model achieves 99.88% Top-1 accuracy across 80 LOB categories while maintaining response times optimized for production use. It does not perform identity document verification; BPLO does not verify IDs per field visit.
Blockchain Ledger Service
Stores only cryptographic hashes (and event type) of critical events on-chain; full audit records remain in the database. It supports verification of data integrity by recomputing the hash and checking it against the on-chain record, ensuring tamper-evidence without storing full documents on-chain.
Data Layer
A centralized database stores user data, permit records, inspection reports, payment records, and off-chain documents.
Provides secure storage, backup, and controlled access.




Figure 2.2 System Architecture Diagram

	The BizClear system employs a hybrid microservices architecture that strategically combines centralized and decentralized components to deliver a secure, scalable business permit management platform. At the user interface layer, mobile and web applications provide role-based access for business owners, LGU officers, and administrators, communicating through REST APIs to a microservices backend composed of five specialized services—Admin, AI LOB Model, Audit, Auth, and Business—each operating independently with isolated databases for enhanced fault tolerance and scalability. The system leverages external third-party services including IPFS via Pinata for decentralized document storage, Gemini AI for intelligent business classification, Resend for reliable email delivery, and Turnstile for bot protection, while maintaining MongoDB Atlas as the primary database for application data and metadata. Critical audit trails and document anchors are immutably recorded on the Ethereum blockchain, providing tamper-evident verification without storing sensitive data directly on-chain. This layered approach ensures clear separation of concerns, with each tier operating at defined trust levels—from public-facing clients to permissioned blockchain interactions—creating a robust foundation that balances operational efficiency with security and regulatory compliance requirements.
2.5 Sprint 1: Core Feature Development 
2.5.1 AI Core Feature
The AI core feature development implemented the foundational business classification system as planned in Appendix A.1, with comprehensive test results documented in Appendix C.1. The researchers developed a scikit-learn LinearSVC machine learning model trained on English business descriptions, establishing the core classification pipeline using TF-IDF vectorization for text processing. The implementation focused on English business classification, creating the technical foundation for Line of Business categorization with confidence scoring across 80 LOB categories. The AI service was built as a standalone Python/Flask classification service with REST API integration, achieving high accuracy while maintaining optimized response times suitable for production deployment. This initial prototype validated the machine learning approach and established the architecture for subsequent bilingual expansion in Sprint 2.
2.5.2 Blockchain Core Feature
Blockchain implementation established the audit trail system as planned in Appendix A.2, with comprehensive test results documented in Appendix C.2. The system ensures tamper-evident record keeping for all critical system events. The audit service computes SHA-256 cryptographic hashes of each significant event including permit submissions, approvals, inspections, payments, appeals, and permit claims, storing only the hash and event type on-chain via smart contract deployed on Ganache. Full audit records remain in the database for performance and privacy, while the immutable hashes on blockchain provide verification of data integrity without storing sensitive information publicly. The researchers implemented the AuditLog smart contract with role-based access control, ensuring only authorized users can log audit events through the AUDITOR_ROLE permission system. The blockchain component supports hash verification by recomputing hashes and checking against on-chain records, providing strong evidence of data integrity while maintaining system scalability by avoiding full document storage on-chain.
2.5.3 Web Feature
Web platform development created the comprehensive interface that serves as the primary access point for all user types including business owners, LGU officers, inspectors, managers, and administrators. The implementation included complete user registration and authentication systems with secure password handling, role-based access control (RBAC) with granular permissions for different user types, and full permit submission and tracking workflows with status updates throughout the application lifecycle. The web platform features appeal management for disputed decisions, payment tracking integration with fee computation and receipt generation, inspection coordination across multiple LGU offices (BPLO, BFP, Sanitary, Zoning, Engineering), and managerial dashboards providing real-time insights and analytics. The AI business classification and blockchain audit services developed in earlier phases were seamlessly integrated, ensuring that permit workflows automatically invoke AI classification for business descriptions and all critical actions are logged to the blockchain-backed audit trail for compliance and transparency.
2.5.4 Mobile Feature
Mobile support development targeted inspectors who need to conduct field inspections and capture data on-site using mobile devices. The mobile implementation enables inspectors to access inspection assignments, capture inspection data including photographs and notes, record findings and compliance assessments, and submit results directly from the field using mobile-optimized interfaces. The mobile components synchronize with the central system in real-time, ensuring that inspection data is immediately available to other LGU offices and managers. All critical inspection actions are logged to the blockchain-backed audit trail, maintaining the same tamper-evident record keeping as the web platform. The mobile support enhances inspector productivity by eliminating paperwork, reducing data entry errors, and enabling faster inspection cycles while ensuring accountability through comprehensive audit logging. This mobile capability ensures that inspection workflows and accountability are maintained effectively for field operations, supporting the overall goal of streamlined permit processing and regulatory compliance.


2.6 Sprint 2: Expansions and Integration
2.6.1 AI Expansion: Filipino Language Input Support
This phase expanded the AI capabilities with enhanced Filipino language input support for business descriptions, as planned in Appendix B.1, with evaluation results documented in Appendix C.1. The enhancement incorporated additional Filipino training examples to enable Filipino-speaking business owners to describe their businesses in their native language and receive accurate Line of Business recommendations. The scikit-learn LinearSVC model with TF-IDF vectorization was enhanced to recognize Filipino terms such as "tindahan", "karinderia", "serbisyo", and "nagbebenta" directly without requiring translation, while simultaneously understanding English equivalents. The model achieved 99.88% Top-1 accuracy with 100% Top-3 and Top-5 accuracy across the bilingual test set. Comprehensive testing across NORMAL, EDGE, and ATTACK scenarios confirmed a 100% success rate with high confidence scores, validating the successful expansion to robust bilingual support. The AI service maintained optimized response times (53ms average) while processing Filipino language input, ensuring that the bilingual capabilities did not compromise system performance.
2.6.2 Blockchain Expansion: Audit History Retrieval
This phase expanded blockchain capabilities by implementing audit history retrieval functions and gas optimization strategies to support compliance dashboards and cost-effective audit trail management, as planned in Appendix B.2, with performance results documented in Appendix C.2. Three new functions were added to the AuditLog smart contract: \`getAuditHistory()\` enables retrieval of audit entries within specified time ranges, \`getRecentAudits()\` provides access to the most recent N audit entries for quick overview, and \`anchorDigestRoot()\` supports the V3 epoch digest anchoring strategy for gas cost optimization. The V3 optimization achieves an 87.4% reduction in monthly gas costs through epoch digest anchoring, reducing costs from approximately $3,300 to $416 per month on Ethereum mainnet for a 5,000-business LGU. These functions incorporate time-based filtering and pagination mechanisms to effectively manage gas costs while maintaining comprehensive audit trail access. Security testing confirmed that all authorization controls function properly and gas costs remain within the target budget for LGU deployment.

2.6.3 Integration
This phase completed the integration of all system components and implemented additional features for production readiness. The AI classification service was integrated with the permit application workflow, enabling automatic LOB recommendations during business registration. The blockchain audit trail was connected to all critical system events, ensuring tamper-evident logging of permit submissions, approvals, inspections, and payments. Additional features implemented included field-level AES-256-GCM encryption for sensitive MongoDB data, multi-factor authentication support, and comprehensive role-based access control across all user types.
3. SECURITY CONSIDERATIONS
3.1 AI Track Security Implementation
The AI business classification service implements security through input validation, safe processing, and controlled output exposure. The service treats all user input as plain text, preventing code execution vulnerabilities. Comprehensive security testing across NORMAL, EDGE, and ATTACK scenarios confirmed robust protection against common web threats, with all six security tests passing successfully as detailed in Appendix D.1.
The AI service demonstrates robust security through comprehensive testing across multiple attack vectors. Standard Filipino and English business descriptions are processed successfully with high confidence scores averaging 95% or higher, validating normal operational functionality. Edge cases such as empty inputs are handled gracefully with efficient validation errors responding in under 5 milliseconds, preventing system crashes from malformed requests while maintaining performance. Attack scenarios including XSS and SQL injection attempts are treated as plain text with no execution possible, ensuring malicious scripts cannot compromise the system architecture. The public authorization endpoint functions as designed for business predictions without exposing sensitive data, maintaining appropriate access boundaries. Data exposure controls ensure only LOB recommendations are returned, with no sensitive training data or system internals leaked during processing, protecting both intellectual property and user privacy.
The AI service implements multiple security guards to prevent potential attacks. Input length validation prevents Denial of Service attacks from extremely long inputs (maximum 2000 characters enforced), while character sanitization blocks script injection attempts. The scikit-learn model processes all input as text features without execution, and the service returns only classification results without exposing training data or system internals.
3.2 Blockchain Track Security Implementation
Blockchain security centers on smart contract access controls, data integrity protection, and safe transaction handling. The AuditLog smart contract implements role-based access control through the AUDITOR_ROLE permission system, ensuring only authorized users can log audit events to the blockchain. The complete blockchain security test results are documented in Appendix D.2.
The blockchain security implementation demonstrates comprehensive protection through rigorous testing of all critical security functions, with all five security tests passing. Authorization controls are properly enforced, as non-auditor accounts attempting to log audit hashes are correctly rejected with "account does not have required role" errors, preventing unauthorized access to audit logging capabilities. Input validation effectively blocks edge case exploitation, with zero hash attempts being rejected with appropriate validation messages, ensuring only valid data entries are processed. Data exposure protections maintain privacy by ensuring emitted events contain only hash and eventType information, with no sensitive data leaked to the public blockchain despite the transparent nature of distributed ledger technology. The smart contract architecture inherently prevents reentrancy attacks through the absence of external calls, eliminating a common vulnerability vector in blockchain applications. Integer overflow protection is automatically provided by Solidity 0.8+, preventing potential arithmetic attacks that could compromise contract state or calculations.
The AuditLog contract implements comprehensive security through role-based permissions, input validation, and safe arithmetic operations. The contract stores only cryptographic hashes rather than full documents, protecting sensitive data while maintaining audit trail integrity. All audit events are immutable once recorded, providing tamper-evident verification capabilities.
3.3 Web Application Security
Web security implements defense-in-depth through multiple protective layers. Role-Based Access Control (RBAC) ensures users can only access functions appropriate to their assigned roles (business owner, LGU officer, inspector, manager, administrator). Transport Layer Security (TLS) encrypts all communications between clients and servers, preventing data interception.
The web application employs comprehensive security controls through a defense-in-depth strategy that protects against multiple attack vectors while maintaining usability for LGU operations. Authentication mechanisms ensure secure user identity verification through robust password handling combined with multi-factor authentication support, adding an additional layer of protection beyond traditional credentials. Authorization is implemented through granular Role-Based Access Control (RBAC) with role-specific permissions and access controls, ensuring users can only access functions appropriate to their assigned roles. Input validation is enforced server-side for all user inputs to prevent injection attacks, with comprehensive sanitization and validation rules that block malicious code execution while allowing legitimate business data. Session management utilizes secure session handling with appropriate timeout and renewal policies, preventing session hijacking and ensuring user sessions remain protected throughout their lifecycle. API security is maintained through service-to-service authentication using X-API-Key headers for inter-service communication, establishing trusted communication channels between microservices while preventing unauthorized API access.
3.4 Security Testing Methodology
Security testing followed a comprehensive approach categorizing tests into NORMAL, EDGE, and ATTACK scenarios to thoroughly evaluate system resilience, as summarized in Appendices D.1 and D.2. NORMAL tests verified expected functionality under standard usage patterns. EDGE tests examined system behavior with boundary conditions and unusual but valid inputs. ATTACK tests simulated malicious attempts to compromise system security.
This systematic approach ensured comprehensive coverage of potential security vectors while validating that security measures do not interfere with legitimate system usage. All security tests passed successfully, demonstrating robust protection against identified threats while maintaining system usability for LGU operations.
3.5 Threat Modeling and Risk Prioritization
Security and threat modeling are critical for BizClear because the system handles sensitive business data, personally identifiable information (PII), and official government records. The primary security objectives are to ensure confidentiality of business and personal data through strong authentication, authorization, and encryption; maintain integrity of permit and appeal records so they cannot be altered without proper authorization or traceability; guarantee availability of the system for 24/7 access by businesses and LGU staff; enforce role-based access control (RBAC) and least-privilege principles to prevent unauthorized actions; and provide auditability and accountability via logs and audit trails to support investigations and compliance.

3.5.1 Asset Identification and CIA Triad
The following assets are considered critical to the secure and reliable operation of the BizClear system. Compromise of these assets could result in legal, operational, or reputational damage to the LGU.
Asset prioritization was aligned to actual BPLO operations. Credentials, personal/business data, and session tokens were classified with high confidentiality requirements because compromise can directly expose regulated information and enable account takeover. Integrity was treated as the dominant objective for permit records, audit logs, and blockchain anchors because these artifacts are used for compliance decisions, traceability, and legal defensibility. Availability requirements were weighted highest for active transaction paths (authentication, permit workflows, and verification endpoints) to reduce service disruption during permit deadlines and compliance periods.
Across the identified critical assets, confidentiality and integrity are consistently high-priority requirements, while availability is highest for operational records, sessions, and blockchain verification services. The full CIA Triad mapping is provided in Appendix G.1.
3.5.2 STRIDE Threat Model
STRIDE is a threat modeling framework used to identify security threats by categorizing them into six classes: Spoofing (impersonating a legitimate user), Tampering (unauthorized modification of data), Repudiation (performing untraceable actions), Information Disclosure (unauthorized data exposure), Denial of Service (disrupting availability), and Elevation of Privilege (gaining unauthorized access rights).
STRIDE coverage was applied across the full trust-boundary chain of the platform: user clients, API gateway and services, database persistence, AI inference service, and blockchain logging service. The intent was not only to list threats, but to connect each threat to controls already implemented in the stack (MFA, RBAC middleware, token validation, rate limiting, log immutability, and permissioned ledger writes).
The STRIDE analysis identified the highest-priority threat as API spoofing through stolen or forged tokens (Critical), followed by web/API information disclosure and API denial-of-service scenarios (High). Medium-priority risks are concentrated on data tampering, AI service misuse, and unauthorized blockchain write attempts. The complete STRIDE threat table is provided in Appendix G.2.
3.5.3 Risk Prioritization Matrix
The matrix intentionally includes technical, process, people, and data risks to avoid a narrow security-only view. Each risk entry was assigned an accountable owner (for example: backend security, system architecture, compliance, operations, and blockchain administration) to support implementation and periodic review. Mitigation definitions were written as operational controls rather than abstract guidance so they can be verified during sprint reviews and production readiness checks.
The risk matrix prioritizes unauthorized access to permit records as the top risk (Critical), followed by API downtime, denial-of-service attacks, and incomplete submission quality risks (High). Medium risks include data tampering, audit logging gaps, staff privilege misuse, AI misclassification effects, and log integrity concerns, while temporary blockchain unavailability is classified as Low due to failover and deferred write controls. The full risk matrix with mitigation owners is provided in Appendix G.3.
3.5.4 Risk Justifications
Risk scoring was justified through factor-based analysis per risk, not by single-value estimates. For each risk item, impact was decomposed into legal, operational, compliance, fairness, confidentiality, integrity, or reputation dimensions (as applicable), while likelihood was decomposed into exposure, threat prevalence, system complexity, process maturity, and existing control strength. This produced a more defensible rationale for prioritization and better traceability from risk score to mitigation assignment.
The full justification set covers all identified risk items, including unauthorized access, API downtime, record tampering, logging insufficiency, privilege misuse, AI output quality risk, denial-of-service, incomplete document submissions, audit log corruption, and temporary ledger unavailability. Complete factor-by-factor scoring is provided in Appendix G.4 (Risk Justification Scoring Table).
3.5.5 OWASP Top 10 Mapping
The identified STRIDE threats are mapped to the OWASP Top 10 security risks to align with industry-standard vulnerability classifications:
The mapping confirms direct alignment between the project threat model and OWASP categories, including Broken Authentication, Injection, Broken Access Control, Cryptographic Failures, Security Logging and Monitoring Failures, and Software/Data Integrity Failures. The complete STRIDE-to-OWASP mapping table is provided in Appendix G.5.


3.6 Security Controls Implementation 
Control placement follows trust boundaries identified in the architecture: untrusted client input boundary, authenticated API boundary, privileged data boundary, semi-trusted AI service boundary, and permissioned blockchain boundary. This ensures controls are not concentrated in a single layer and remain effective even when one layer is bypassed or degraded.
3.6.1 Preventive Controls
Preventive controls stop security incidents before they occur. Input validation ensures all user inputs are validated and sanitized server-side to prevent injection attacks using Joi schemas. Authentication and authorization combine strong password hashing (bcrypt), multi-factor authentication (TOTP and WebAuthn passkeys), and role-based access control (RBAC) to enforce least privilege. Encryption protects data in transit using TLS and sensitive data at rest using AES-256-GCM field-level encryption. Secure configuration removes default credentials and hardens all system components before deployment.
3.6.2 Detective Controls
Detective controls help identify and respond to security incidents. Comprehensive logging captures authentication events, data changes, and administrative actions to the MongoDB audit collection. Automated monitoring detects abnormal behavior such as excessive failed logins or traffic spikes. Error handling returns generic error messages to avoid leaking sensitive system information while logging detailed errors internally.
3.6.3 Defense-in-Depth
BizClear applies defense-in-depth by layering security controls across all system components. Web and mobile clients enforce basic validation and secure session handling. The backend API enforces authentication, authorization, validation, CSRF protection, and rate limiting. The database layer restricts access to trusted services, uses field-level encryption, and maintains audit logs. The blockchain layer provides tamper-evident verification of critical records. If one control fails, additional layers reduce the likelihood of a full system compromise.
3.6.4 AI-Specific Controls
AI outputs are advisory only with human reviewers retaining final authority. Input length validation prevents DoS attacks (maximum 2000 characters enforced). Character sanitization blocks script injection attempts. The scikit-learn model processes all input as text features without code execution. Only classification results are returned without exposing training data or model internals. Periodic model review and retraining maintain accuracy.
3.6.5 Blockchain-Specific Controls
The blockchain operates as a permissioned ledger with LGU-controlled access. No raw PII is stored on-chain; only cryptographic hashes and event types are recorded. Secure key management through the AUDITOR\_ROLE permission system restricts ledger writes to authorized accounts. Regular integrity verification compares on-chain hashes against database records to detect tampering.


4. PERFORMANCE AND SCALABILITY
Performance optimization and scalability planning were critical to ensuring BizClear can handle LGU operational demands while maintaining responsive user experience. The system underwent comprehensive performance testing across AI, blockchain, and web components, identifying bottlenecks and implementing optimizations that significantly improved system responsiveness and resource utilization. Detailed performance metrics are provided in Appendix E.
4.1 Performance Metrics Overview
Performance testing measured response times, throughput, and resource utilization under various load conditions. The testing methodology focused on identifying performance bottlenecks and validating optimization effectiveness through before-and-after comparisons. Key performance indicators included response times, memory usage, CPU utilization, and gas costs for blockchain operations. The AI service was tested on real Docker deployment, blockchain operations were tested on Ganache development network, web application was tested with simulated user loads, and database performance was measured with MongoDB query optimization.
Initial testing identified three critical bottlenecks requiring optimization. First, the AI taxonomy mapping exhibited O(n) complexity, rebuilding the 80-entry LOB mapping on every prediction request, causing unnecessary latency. Second, blockchain gas costs for per-transaction audit logging were prohibitively expensive for LGU budgets at scale, with baseline monthly costs reaching approximately $3,300 on Ethereum mainnet. Third, the web application dashboard exhibited slow initial load times due to synchronous data fetching and unoptimized database queries. Each bottleneck was systematically addressed through targeted optimizations detailed in the following sections.
4.2 AI Track Performance Analysis
The AI business classification service demonstrated significant performance improvements through caching optimization and model loading optimization. Initial testing revealed performance bottlenecks related to taxonomy mapping rebuild on every prediction request, which was addressed through implementing a persistent cache mechanism. The detailed AI performance metrics are documented in Appendix E.1.
After optimization, the AI service achieved a cold start response time of 328 milliseconds for initial model loading, with subsequent warmed response times averaging 53 milliseconds. The minimum response time recorded was 4.12 milliseconds, with a maximum of 13.65 milliseconds and an average of 6.94 milliseconds across all test requests. The service maintained a 100% success rate across 15 HTTP test requests. The taxonomy mapping optimization achieved dramatic performance improvements, reducing total time by 98.7% (from 14.01 milliseconds to 0.18 milliseconds for 1000 calls), representing a 77x speedup per call. The primary bottleneck was identified as O(n) complexity for taxonomy mapping, which was optimized to O(1) complexity through persistent caching of the 80-entry mapping.
4.3 Blockchain Track Performance Analysis
Blockchain performance focused on gas cost optimization and query efficiency. The AuditLog smart contract was analyzed for gas consumption patterns, with comprehensive gas cost measurements documented in Appendix E.2. The system implements a V3 gas optimization strategy that achieves significant cost reductions through epoch digest anchoring, reducing monthly costs to approximately $416 on Ethereum mainnet or under $5 on Layer 2 networks like Polygon.
The logAuditHash function consumes approximately 65,856 gas per operation, with the verifyHash function maintaining O(1) performance at approximately 8,800 gas regardless of dataset size. The V3 optimization strategy reduces monthly gas consumption by 87.4% compared to the baseline implementation through epoch digest anchoring, which collapses thousands of audit events into periodic digest root transactions. This approach enables the system to operate within a monthly budget of approximately $416 at standard gas prices on Ethereum mainnet, well within the target budget for LGU deployment.
4.4 Scalability Considerations
For horizontal scaling, the AI service uses a stateless design that enables multiple instances behind a load balancer, the web application uses containerized deployment that supports dynamic scaling, the database uses MongoDB replica sets for read scaling and high availability, and the blockchain smart contract design supports multiple auditor roles for distributed logging. For vertical scaling, the AI model loading benefits from increased RAM, multi-core utilization enables concurrent request processing, and SSD storage improves database and caching performance. Continuous performance monitoring was implemented to track response times, error rates, and resource utilization, enabling proactive identification of performance issues and capacity planning for future growth.
4.5 Performance vs. Security Trade-offs
Performance optimization was balanced against security requirements to ensure system responsiveness does not compromise security controls. Input validation adds minimal overhead (approximately 4 milliseconds) for significant security benefits, TLS encryption overhead is negligible compared to network latency, JWT authentication validation adds minimal processing time, and RBAC checks use database-indexed role queries for efficient authorization. The performance optimization efforts successfully achieved the non-functional requirement of 2-second dashboard response times while maintaining comprehensive security controls and data integrity protections.


5. EVALUATION AND TESTING
Comprehensive evaluation and testing validated BizClear's functionality, performance, security, and usability against established requirements and success criteria. The testing methodology employed multiple evaluation approaches including functional testing, performance benchmarking, security assessment, and user acceptance testing to ensure system readiness for LGU deployment. Detailed test results are provided in Appendix F.
5.1 Testing Methodology
The testing framework followed ISO 25010 quality characteristics with systematic test categorization into NORMAL, EDGE, and ATTACK scenarios. This approach ensured comprehensive coverage of expected usage patterns, boundary conditions, and potential security threats while validating that system controls do not interfere with legitimate operations. NORMAL tests verified standard usage patterns with valid inputs and expected workflows. EDGE tests examined boundary conditions, minimal inputs, and unusual valid scenarios. ATTACK tests simulated injection attempts, unauthorized access, and malformed requests.
The success criteria established for the system included achieving a 100% test pass rate across all categories, maintaining response times under 2 seconds for dashboard operations, identifying zero security vulnerabilities in critical components, achieving Filipino language classification accuracy above 95%, and maintaining blockchain audit trail integrity throughout all operations.
5.2 Sprint 1 Evaluation Results
Sprint 1 focused on core feature development including AI business classification, blockchain audit trail, web platform, and mobile support. Testing validated each component individually and through integration testing to ensure proper system functionality. The detailed Sprint 1 test results are documented in Appendix F.1, with comprehensive AI metrics in Appendix C.1 and blockchain performance data in Appendix C.2.
The AI business classification service achieved exceptional results across all test categories, with the model demonstrating 99.88% Top-1 accuracy on the held-out test set of 800 examples (see Appendix C.1 for detailed metrics). The model achieved 100% Top-3 and Top-5 accuracy, ensuring the correct Line of Business recommendation appears in the top suggestions. The macro F1 score reached 0.9988, with precision and recall both exceeding 99.8%, validating the model's ability to accurately classify business descriptions across all 80 LOB categories. The service successfully processed both Filipino and English business descriptions with high confidence scores, and response times remained under 100 milliseconds after optimization. The model was trained on 4,032 bilingual examples using LinearSVC with TF-IDF vectorization, incorporating a hybrid word-character feature extraction approach for robust handling of Filipino language variations.
Blockchain audit trail functionality was validated through comprehensive smart contract testing, ensuring secure hash logging and verification capabilities (see Appendix C.2 for detailed gas consumption data). All security tests passed, confirming proper role-based access controls through the AUDITOR_ROLE permission system. Hash logging operations consumed approximately 65,856 gas per transaction, and the immutable audit trail was maintained across all operations with query functions operating efficiently.
Web platform and mobile support testing validated user interface functionality, role-based access control, and cross-device compatibility. All major workflows were tested successfully including permit submission, inspection coordination, and dashboard functionality. The intuitive design required minimal training, proper permission enforcement was confirmed across all user types, responsive design functioned correctly across devices, and end-to-end permit processing was validated.
5.3 Sprint 2 Evaluation Results
Sprint 2 expanded system capabilities with enhanced Filipino language input support and audit history retrieval functions. Testing focused on validating expansion features while maintaining system performance and security. The detailed Sprint 2 test results are documented in Appendix F.2, with V3 gas optimization results in Appendix C.2.
The enhanced AI model demonstrated robust understanding of Filipino business terminology, achieving 100% success rate across NORMAL, EDGE, and ATTACK test scenarios. Filipino business descriptions such as "Nagtitinda ako ng mga de-lata, softdrinks, at mga basic na gamit" were correctly classified as retail/Sari-sari store with high confidence scores. Minimal Filipino input was handled effectively, and injection attempts were processed safely without security breaches.
Blockchain expansion testing validated audit history retrieval functions for performance and security. Time-based filtering and pagination mechanisms were tested to ensure efficient gas cost management while maintaining comprehensive audit access. Query performance remained within acceptable gas cost limits, effective date range filtering was implemented, proper result limiting for large datasets was confirmed, and authorization controls were maintained for audit data access.
5.4 Evaluation Summary
Comprehensive testing and evaluation validated BizClear's readiness for LGU deployment with strong performance across all quality characteristics. The system achieved 100% test pass rate for critical functionality while maintaining security, performance, and usability standards. Complete evaluation metrics are provided in Appendices C, D, E, and F.
The key achievements include all core features operating as specified, response times meeting non-functional requirements under 2 seconds for dashboard operations (Appendix E), zero critical security vulnerabilities identified (Appendix D), AI classification accuracy of 99.88% exceeding the 95% target (Appendix C.1), and stable operation under various load conditions. The comprehensive evaluation process confirmed that BizClear successfully addresses LGU business permit processing challenges while providing a solid foundation for future enhancements and scalability.

















6. REFLECTION AND LEARNINGS
6.1 Mark Stephen Diaz - Project Leader & Lead Developer
Building BizClear taught me that bringing together AI, blockchain, and web technologies is like conducting an orchestra where every instrument must play in harmony. The AI classification service was particularly eye-opening - I never thought a machine learning model could understand Filipino business descriptions like "tindahan ng pagkain" with 99.88% accuracy until we trained it with proper bilingual techniques. The microservices architecture felt like designing a city with different districts, each with its own purpose but connected by efficient roads of API communication. When we discovered the AI service was slowing down due to rebuilding the same mapping over and over, it was like finding a traffic jam and clearing it with a simple caching shortcut that made everything 98.7% faster.
The security side of this project was a constant reminder that we're handling real people's sensitive data. Implementing encryption wasn't just about writing code - it was about protecting Filipino business owners' information while keeping the system easy to use. The blockchain audit trail was fascinating because it showed how we could prove that no one tampered with government records without storing everything publicly. Our security testing approach, where we pretended to be hackers trying to break the system, actually made us better builders. Learning to balance strong security with user-friendly design was probably the most valuable lesson - after all, the best security system is useless if government workers can't actually use it to help their constituents.
6.2 John Wayne Enrique - Blockchain Development
Working on the blockchain component felt like solving a puzzle where every piece had to fit perfectly. When I first calculated that storing full audit records on-chain would cost LGUs about $3,300 per month, I realized we needed a smarter approach. The breakthrough came when we decided to store only cryptographic hashes - it was like keeping a fingerprint instead of the entire person, which cut costs by 87.4% to just $416 monthly. Developing the epoch digest anchoring strategy was like learning to bundle thousands of letters into one envelope - same security, much cheaper postage. Connecting the blockchain to our regular web services taught me that decentralized systems think differently, like how blockchain transactions can't be undone while database updates can.
The security challenges in blockchain were unlike anything I'd worked with before. Building the AUDITOR_ROLE system was like creating digital keys that only certain trusted people could use to access the audit log. What struck me most was how blockchain security had to be both technically sound and financially practical - there's no point building a fortress that costs more to operate than the value it protects. Our testing approach, where we tried to break our own system, revealed that blockchain vulnerabilities are different from web vulnerabilities. Once something is on the blockchain, it's there forever, so we had to get it right the first time. This taught me that in government systems, security isn't just about stopping bad guys - it's about building something that taxpayers can afford and that officials will actually use.
6.3 Keith Ardee Lazo - Frontend & Web Integration
Creating the user interface for BizClear was like being a translator between complex technology and everyday government workers. I had to design dashboards that business owners, LGU officers, and inspectors could all use without getting confused. The mobile component for field inspectors was particularly interesting - designing for someone standing in the sun, holding a phone, trying to record inspection results is completely different from designing for someone in an office. When we integrated the AI classification results, it was like teaching the computer to speak human language, showing confidence scores and recommendations in ways that made sense to people who aren't data scientists. The biggest challenge was making blockchain audit trails look friendly - turning cryptographic hashes into something that reads like a simple log that anyone can understand.
The security side of frontend development felt like being a digital bodyguard for government data. Implementing role-based access control meant making sure that business owners can't see other people's applications, and that inspectors can only access what they're supposed to see. It was like building doors with the right keys for the right people. Working with JWT tokens and secure authentication taught me that security has to be invisible to work well - if users notice it too much, they'll find ways around it. Our security testing was like playing hide-and-seek, where we tried to find every possible way someone could break into the system before real hackers could. The most important lesson was that security and user experience aren't enemies - the best security is the one that protects people without making their jobs harder.
6.4 Ericka Tresenio Brudo - Testing & Quality Assurance
Testing BizClear was like being a quality detective, looking for clues about what could go wrong before real users discovered problems. Creating our NORMAL, EDGE, and ATTACK testing approach was like developing a language to describe every possible way someone might use the system. For NORMAL tests, we imagined everyday scenarios like a business owner applying for a permit. For EDGE tests, we thought about unusual but valid situations, like someone entering the shortest possible business description. For ATTACK tests, we put on our black hats and tried to break the system like hackers would. Testing the AI component was particularly challenging - I had to come up with hundreds of Filipino business descriptions to make sure the 99.88% accuracy claim wasn't just luck. Blockchain testing required learning a whole new way of thinking about testing, since smart contracts can't be changed once deployed.
The security testing aspect was like playing chess against an imaginary opponent who knew all our weaknesses. I had to systematically think like someone trying to steal data or break into government systems. What surprised me most was how security testing wasn't just about finding technical flaws - it was about understanding how real people might accidentally or intentionally misuse the system. When we tested with actual LGU officers and business owners, I learned that the best security in the world is useless if it prevents government workers from serving their constituents. The biggest lesson was that quality assurance in government technology isn't just about making sure things work - it's about making sure they work for real people, in real situations, while keeping everyone's data safe. It's a balance between being thorough and being practical.
6.5 Xander Posadas - System Architecture & Deployment
Designing BizClear's architecture was like being a city planner for a digital government. I had to decide where to put the AI service, the blockchain component, the web application, and how they should all connect. Creating the five-service architecture felt like designing different neighborhoods - each with its own purpose but connected by efficient highways of API communication. The database design was particularly challenging because we had to balance keeping data separate for security with making it accessible when different services needed to work together. Setting up the deployment pipeline was like building an automated construction crew that could build, test, and deploy the system reliably. What I learned most was that good architecture is invisible - when it works well, people don't notice it, they just notice that the system works.
The security architecture was like building a fortress with multiple layers of defense. Implementing AES-256-GCM encryption across all databases felt like putting every piece of sensitive information in a locked safe that only authorized people could open. The microservices security design required thinking about how services talk to each other securely, like creating secure diplomatic channels between different government departments. Container security and secret management were like ensuring that the foundation of our digital building was solid and that only the right people had the master keys. The biggest lesson was that security architecture isn't a one-time decision - it has to evolve as new threats emerge. In government systems, trust is everything, and that trust is built through careful architectural decisions that protect citizens' data while still enabling the government to serve them effectively.

REFERENCES
Adesoga, A. A., Adegbuyi, O. A., & Oladele, O. P. (2024). Artificial intelligence and document verification in public sector services: A systematic review. Journal of E-Governance, 47(2), 112–128.
Cereno, M. P. (2024). Digital transformation in Philippine local government units: Progress and disparities. Philippine Journal of Public Administration, 68(1), 45–67.
Correa, M., Paredes, L., & Sandoval, R. (2022). Barriers to e-governance adoption in developing countries: Budget, infrastructure, and ICT utilization. Government Information Quarterly, 39(3), Article 101712. https://doi.org/10.1016/j.giq.2022.101712
De Castro, J. L. (2022). E-government implementation in Philippine LGUs: Disconnected systems and manual procedures. International Journal of Electronic Governance, 14(2), 189–208.
IOER International Multidisciplinary Research Journal. (2023). LGU online portals and integrated transaction systems: Gaps in digital service delivery. IOER International Multidisciplinary Research Journal, 5(2), 78–92.
Kumar, R., Tripathi, R., Marchang, N., & Garg, S. (2023). Integration of AI and blockchain for data accuracy and trust in organizational processes. Journal of Enterprise Information Management, 36(4), 1024–1044. https://doi.org/10.1108/JEIM-02-2022-0066
Liponhay, R. M. (2023). Smart city development in the Philippines: Standardization and digital infrastructure challenges. Asian Journal of Public Administration, 45(1), 34–52.
Lubis, A. R., Nasution, F., & Harahap, N. (2025). AI and blockchain in e-governance: Transparency and accountability in local government applications. Electronic Government, an International Journal, 21(2), 215–238.
Niño, A. G. M., & Gentoral, F. E. (2024). Compliance with business permits and licensing system requirements: Effects on business performance and satisfaction among MSMEs. IIARI Journals, 3(3), 24445. https://ejournals.ph/article.php?id=24445
Ouboumlik, L., & Ouazzani Touhami, K. (2024). Digital transformation of public administration: Transparency, service quality, and citizen participation. Transforming Government: People, Process and Policy, 18(1), 89–108. https://doi.org/10.1108/TG-05-2023-0062
Pramuditha, K. G., Wijesinghe, D., & Silva, N. (2024). E-government service quality and citizen satisfaction: Impact on trust in government. International Journal of Public Sector Management, 37(3), 312–330.
Priatmaja, I. W., Kusuma, D., & Wijaya, C. (2024). Blockchain for tamper-proof records and stakeholder confidence in digital government systems. Journal of Information Security and Applications, 79, Article 103681.
Scholta, H., Mertens, W., & Becker, J. (2025). Multi-agency coordination in digital government: Balancing decentralized operations and centralized oversight. Government Information Quarterly, 42(1), Article 101848.
Tveita, M., & Hustad, E. (2025). AI adoption in the public sector: Efficiency, trust, and workforce readiness. Public Management Review, 27(4), 1024–1046. https://doi.org/10.1080/14719037.2024.1853892
Republic Act No. 11032. (2018). An Act promoting ease of doing business and efficient delivery of government services. Official Gazette of the Republic of the Philippines. https://lawphil.net/statutes/repacts/ra2018/ra_11032_2018.html
Scrum Alliance. (2020). Scrum guide. https://scrumalliance.org/
Sommerville, I. (2016). Software engineering (10th ed.). Pearson.
Agyekum, K. O.-B. O., Botchway, R. K., & King, R. S. (2024). Blockchain-based system for enhancing transparency and accountability in government fund allocation. Propulsion Technology Journal, 1(1), Article 6888. https://doi.org/10.5281/zenodo.10558888
Al-Rawy, A., Salih, A., & Aljuboori, A. F. (2024). Blockchain in e-government services: Current status, challenges, and future directions. arXiv preprint arXiv:2402.02483. https://arxiv.org/abs/2402.02483
European Commission. (2022). European landscape on the use of blockchain technology by the public sector (JRC Technical Report). Publications Office of the European Union. https://publications.jrc.ec.europa.eu/repository/handle/JRC131202
Sana, A., Rehman, A., Iqbal, K., & Shah, S. M. A. (2025). Synergizing AI and blockchain: A bibliometric analysis of their potential for transforming e-governance in smart cities. Frontiers in Sustainable Cities, 7, Article 1553816. https://doi.org/10.3389/frsc.2025.1553816


APPENDICES
A.1 Sprint 1: AI Prototype Plan
Problem Statement
Business owners in Alaminos City describe their business in natural language (e.g., "computer repair shop," "restaurant and catering services") when applying for permits. BPLO officers must manually interpret these descriptions and map them to the correct Line of Business (LOB) categories, which is time-consuming and inconsistent. Incorrect LOB mapping leads to wrong tax codes, improper fee computation, and compliance issues.
Core Feature
An AI-powered business classification system that combines:
Traditional ML (TF-IDF vectorization with scikit-learn LinearSVC) for English business classification
Initial training dataset with English business descriptions
Standalone Python/Flask classification service with REST API
Confidence-scored LOB recommendations to assist LGU staff in permit processing
Foundation for subsequent bilingual expansion


User Story and Acceptance Criteria
As a BPLO officer, I want to input a business description and receive accurate LOB recommendations so that I can quickly classify businesses and ensure correct tax codes and fees.
Acceptance criteria:
Officer can input business description in Filipino or English
System returns LOB recommendations with confidence scores
Classification completes within 100 milliseconds
Service provides REST API endpoint for integration with main BizClear system
System maintains 95%+ accuracy on test dataset






Simple Diagram (Classification Flow)

Tools/API
Python: pandas, scikit-learn, flask, numpy
ML: TF-IDF vectorization, LinearSVC classifier
Dataset: English business description examples
API: Flask REST service (`ai/predict_app.py`)
Environment: Docker containerized service, integrates with Node.js backend
Classification models: Pre-trained joblib files (`ai/models/lob_model.joblib`)
Test Plan
Happy Path: "computer repair shop" → System returns [Repair Services, IT Services] with confidence scores
Happy Path: "restaurant and catering" → System returns [Food Services, Restaurant] with confidence scores
Edge Case: Minimal description "store" → System returns validation error requesting more detail
Edge Case: Technical business "software development" → System returns appropriate IT/BPO LOBs
Risks & Mitigations
Risk 1: New business types not in training data
Mitigation: System provides top 3 recommendations; BPLO officer can select appropriate LOB; model can be retrained with new examples
Risk 2: Low confidence scores for ambiguous descriptions
Mitigation: System flags low confidence (<60%) for manual review; provides multiple options for officer selection
Roles & Timeline
Roles
Architect: Designs classification pipeline, dataset schema, TF-IDF workflow, and API structure
Builder: Implements TF-IDF vectorization, trains scikit-learn model, builds Flask API service
Validator: Tests classification accuracy, Filipino language support, API integration, performance
Timeline
Day 1: Dataset preprocessing, TF-IDF vectorization, train scikit-learn model, accuracy evaluation
Day 2: Flask API development, confidence scoring, integration testing
Day 3: Performance optimization, API documentation, final validation and deployment


A.2 Sprint 1: Blockchain Prototype Plan
Problem Statement
Permit and inspection records must be tamper-proof and verifiable. Paper records and centralized databases can be altered without detection. LGU auditors and citizens need a way to verify that records have not been modified after issuance.
Core Feature
A blockchain-based audit trail that:
Stores cryptographic hashes (SHA256) of permit and inspection records on-chain
Uses Ganache (Ethereum) and Solidity smart contracts (AuditLog, DocumentStorage, UserRegistry)
Enables tamper detection: modified records produce different hashes, verification fails
User Story & Acceptance Criteria
As an auditor or system admin, I want to verify that an audit record's hash exists on the blockchain so that I can confirm the record has not been tampered with since it was logged.
Acceptance criteria:
Hash can be logged to blockchain (requires AUDITOR_ROLE)
Any party can verify a hash exists on-chain (read-only)
Verify Data: paste original content → hash → verify against on-chain (hash is one-way; we verify data matches)
Tampered data produces different hash; verification fails.
Prototype runs in notebook with embedded Gradio UI (logs table, verify hash, verify data, test scenarios)


Simple Diagram

Tools/API
Blockchain: Ganache, Truffle, Solidity
Python (notebook): web3.py, eth-account, hashlib, python-dotenv
Node.js (audit-service): web3.js, express
UI: Gradio (embedded in Jupyter notebook)
Environment: Docker (Ganache, deploy-contracts, audit-service), Jupyter
Test Plan
Happy Path: Log hash → Verify hash → Returns true
Verify Data: Paste original content → Verify → Returns verified/not found
Tamper Detection: Modify data → New hash → Verify original → Returns false
Security: Only AUDITOR_ROLE can log; re-entrancy mitigated; rate limiting (notebook: 5/min; audit-service: 20/min)
Edge Case: Large dataset verification (1000+ entries), empty hash validation, special characters in event types
Attack Case: Unauthorized access attempts, re-entrancy attacks, gas limit exhaustion, malformed hash inputs
Risks & Mitigations
Risk 1: Ganache not running
Mitigation: docker-compose up -d ganache; clear README
Risk 2: Contract addresses change after Ganache restart
Mitigation: Notebook reads from .env first (updated by deploy-contracts), then build artifacts; sanity check for empty contract code
Roles & Timeline
Roles
Architect: Creates Smart Contracts, Data flow, Hashing Logic
Builder: Implements Running Blockchain contracts
Validator: Test Scenarios
Timeline
Day 1: Contract structure, Hash Functions
Day 2: Deployment, Testing


B.1 Sprint 2: AI Prototype Plan
Problem Statement
The Sprint 1 AI prototype successfully classified English business descriptions, but business owners in Alaminos City speak Filipino and prefer to describe their businesses in their native language (e.g., "tindahan ng pagkain," "nagbebenta ng mga gamit"). The AI system needed expansion to support bilingual classification for both Filipino and English business descriptions.
Core Feature
An expanded AI-powered business classification system that adds Filipino language support:
Bilingual training data expansion with 4,032 total examples 
Enhanced TF-IDF vectorization with hybrid word-character features that recognizes Filipino business terms natively
Retrained scikit-learn LinearSVC model with bilingual capabilities
Flask REST API service with optimized bilingual classification
Native Filipino language support ("tindahan", "karinderia", "parlor", "nagbebenta") through canonical token mapping
99.88% Top-1 accuracy with 100% Top-3 and Top-5 accuracy across both languages
User Story and Acceptance Criteria
As a BPLO officer, I want to input business descriptions in Filipino or English and receive accurate LOB recommendations so that I can serve both Filipino-speaking and English-speaking business owners effectively.
Acceptance criteria:
Officer can input business description in Filipino or English
System returns top 3 LOB recommendations with confidence scores for both languages
System handles Filipino business terms natively (tindahan, karinderia, parlor, sari-sari, nagbebenta, etc.)
Classification completes within 100 milliseconds for both languages
System maintains 95%+ accuracy on bilingual dataset (achieved: 99.88%)



Simple Diagram (Enhanced Classification Flow)

Tools/API
Python: pandas, scikit-learn, flask, numpy
ML: Enhanced TF-IDF vectorization with hybrid word-character features, LinearSVC classifier
Dataset: 4,032 bilingual business examples
API: Flask REST service (`ai/predict_app.py`) with bilingual capabilities
Environment: Docker containerized service, integrates with Node.js backend
Classification models: Retrained joblib files with bilingual data (`ai/models/lob_model.joblib`)
Test Plan
Happy Path (Filipino): "tindahan ng pagkain" → System returns [Food Services, Retail] with high confidence
Happy Path (English): "computer repair shop" → System returns [Repair Services, IT Services] with high confidence
Edge Case: Mixed language "parlor for haircut and beauty" → System handles Filipino-English mix
Edge Case: Minimal Filipino input "tindahan" → System returns appropriate retail LOBs
Attack Case: Injection attempts → System treats as plain text, returns safe classification
Risks & Mitigations
Risk 1: Filipino language variations and regional terms
Mitigation: Training data includes Filipino examples covering various regions; TF-IDF handles word variations; system learns from actual usage patterns
Risk 2: Lower confidence scores for Filipino input compared to English
Mitigation: System flags low confidence (<60%) for manual review; provides multiple options for officer selection; continuous improvement through user feedback
Risk 3: Mixed language business descriptions
Mitigation: Enhanced TF-IDF vectorization handles code-switching; model trained on mixed-language examples; provides recommendations based on dominant language patterns
Roles & Timeline
Additional Roles
Filipino Language Specialist: Validates Filipino business terms and regional variations
Data Analyst: Prepares and validates bilingual training dataset
Enhanced Timeline
Day 4: Add 2,000 + Filipino examples to dataset 
Day 5: Retrain scikit-learn model with bilingual data, test Filipino language recognition
Day 6: Comprehensive testing of Filipino-English mixed input, performance optimization, API validation


B.2 Sprint 2: Blockchain Prototype Plan
Problem Statement
The Sprint 1 blockchain system only supports basic hash logging and verification. LGU auditors and compliance officers need advanced audit trail management capabilities to effectively monitor system activities, generate compliance reports, and analyze audit patterns. The current system lacks efficient query mechanisms for retrieving specific audit entries and filtering by date ranges.
Core Feature
An expanded blockchain audit trail system that adds:
Advanced audit history retrieval functions with time-based filtering
Pagination mechanisms to manage gas costs for large datasets
Enhanced AuditLog smart contract with three new functions:
`getAuditHistory()`: Retrieve audit entries within specified time ranges
`getRecentAudits()`: Access the most recent N audit entries for quick overview
Efficient gas cost management through optimized query patterns
Maintained security controls with role-based access protection
User Story and Acceptance Criteria
As an auditor or compliance officer, I want to retrieve audit history with filtering options and generate compliance statistics so that I can effectively monitor system activities and produce compliance reports.
Acceptance criteria:
Auditor can retrieve audit entries within specified date ranges
System provides pagination for large audit datasets
Query functions operate within acceptable gas cost limits
Security controls prevent unauthorized access to audit data









Simple Diagram (Enhanced Audit Flow)

Tools/API
Blockchain: Enhanced Ganache, Truffle, Solidity smart contracts
Python (audit analysis): web3.py, pandas for data analysis
Node.js (audit-service): Enhanced web3.js, express
Environment: Docker (Ganache, enhanced audit-service), Jupyter for analysis
Smart Contracts: Updated AuditLog.sol with new query functions
Test Plan
Happy Path: getAuditHistory(startDate, endDate) → Returns filtered audit entries
Happy Path: getRecentAudits(10) → Returns last 10 audit entries
Edge Case: Large date range query → Pagination handles dataset efficiently
Performance: Query functions complete within acceptable gas limits
Security: Non-authorized users cannot access audit retrieval functions
Integration: Audit service integrates with compliance dashboard
Risks & Mitigations
Risk 1: High gas costs for large audit dataset queries
Mitigation: Implemented pagination mechanisms; time-based filtering reduces result sets; query optimization for cost efficiency
Risk 2: Performance degradation as audit log grows
Mitigation: Efficient indexing strategies; pagination prevents full dataset scans; gas cost monitoring and optimization
Risk 3: Unauthorized access to sensitive audit data
Mitigation: Enhanced role-based access controls; audit trail access requires proper permissions; security testing validates authorization
Roles & Timeline
Additional Roles
Compliance Specialist: Defines audit requirements and dashboard specifications
Blockchain Optimizer: Optimizes smart contract functions for gas efficiency
Enhanced Timeline
Day 4: Design and implement getAuditHistory() function with time filtering
Day 5: Implement getRecentAudits() and pagination mechanisms
Day 6: Comprehensive testing of query functions, gas cost optimization, compliance dashboard integration



C.1 AI Model Evaluation Results
C.1.1 Sprint 1: English-Only Prototype Evaluation
Test Configuration
The Sprint 1 AI prototype was evaluated on English business descriptions to validate the core classification architecture before bilingual expansion.
Test Dataset: English business description examples
Test Method: scikit-learn evaluation metrics
Model: LinearSVC with TF-IDF vectorization
Training Configuration Table
Parameter
Value
Algorithm
LinearSVC 
Training Samples
English Business Descriptions
Feature Extractor
TF-IDF Vectorization
LOB Categories
80
Functional Test Results
Test Case
Input
Expected Output
Result
Happy Path (English)
"Computer Repair Shop"
Repair Services
PASSED
Happy Path (English)
"Restaurant and Catering"
Food Services
PASSED
Edge Case
"store"
Validation error
PASSED
Edge Case
"Software Development"
IT / BPO services
PASSED
Attack Case
XSS injection attempt
Safe text processing
PASSED



C.1.2 Sprint 2: Bilingual Model Evaluation
Test Configuration
The Sprint 2 bilingual model was evaluated on Filipino and English business descriptions to validate the expanded bilingual capabilities.
Test Environment: Docker containerized AI service
Test Dataset: Bilingual business description examples
Test Method: scikit-learn evaluation metrics
Model: LinearSVC with TF-IDF hybrid word-character vectorization
Training Configuration Table
Parameter
Value
Algorithm
LinearSVC
Training Samples
7,335 (including augmentation)
Base Samples
4,032 bilingual examples
Noisy Augmented Samples
3,218
Feature Extractor
TF-IDF Hybrid (Word + Character)
Cross-Validation Accuracy
99.99%
Functional Test Results
Test Case
Input
Expected Output
Result
Happy Path (English)
"Computer Repair Shop"
Repair Services
PASSED
Happy Path (Filipino)
"tindahan ng pagkain"
Food Services
PASSED
Edge Case
"store"
Validation error
PASSED
Edge Case
"Software Development"
IT / BPO services
PASSED
Attack Case
XSS injection attempt
Safe text processing
PASSED




C.2 Blockchain Prototype Test Results
C.2.1 Sprint 1: Core Audit Trail Test Results
Test Configuration
The Sprint 1 blockchain audit system established the core audit hash logging and verification functionality using Ganache deployment with real smart contract interactions.
Test Environment: Ganache local blockchain network
Smart Contracts: AccessControl.sol, AuditLog.sol
Test Method: Direct ethers.js contract interactions
Functional Test Results
Test Case
Status
Result
Details
Happy Path
Passed
Log hash → Verify hash → Returns true
Hash successfully logged and verified
Verify Data
Passed
Paste original content → Verify → Returns verified
Original content verified against blockchain
Tamper Detection
Passed
Modified data detection
Original hash valid, tampered hash correctly rejected
Security
Passed
AUDITOR_ROLE enforcement + public access
Unauthorized access blocked, public verification works
Edge Case
Passed
Large dataset + validation tests
1000 entries verified, empty/special chars handled
Attack Case
Passed
Security stress testing
Unauthorized access blocked, re-entrancy protected
Gas Consumption Table
Operation
Gas Used
Notes
logAuditHash (first)
65,856 gas
Contract initialization
logAuditHash (subsequent)
65,856 gas
Stable performance
logAuditHash (average)
65,856 gas
Consistent across operations
verifyHash
8,800 gas
O(1) - constant regardless of dataset size
AccessControl deployment
2.1 million gas
One-time cost
AuditLog deployment
1.8 million gas
One-time cost


C.2.2 Sprint 2: Gas Optimization and History Retrieval Test Results
Test Configuration
The Sprint 2 blockchain phase expanded audit functionality with history retrieval and V3 gas optimization using Ganache deployment and smart contract function testing.
Test Environment: Ganache local blockchain network
New Functions: getAuditHistory(), getRecentAudits(), anchorDigestRoot()
Optimization Strategy: V3 Epoch Digest Anchoring
Functional Test Results
Function
Test Case
Status
Details
getAuditHistory()
Time-range filtering
PASSED
Returns entries within specified dates
getAuditHistory()


Empty range


PASSED
Returns empty array correctly
getRecentAudits()
Recent N entries


PASSED
Returns last N audit entries
getRecentAudits()
Pagination


PASSED
Handles large datasets efficiently
anchorDigestRoot()
Digest anchoring
PASSED
Successfully anchors epoch digest
anchorDigestRoot()
Authorization
PASSED
AUDITOR_ROLE required






V3 Gas Optimization Results Table
Metric
Baseline (Sprint 1)
V3 Optimized (Sprint 2)
Reduction
Monthly Gas (5K LGU)
3.3M gas
416K gas
87.4%
Monthly Cost (Ethereum Mainnet)
~$3,300
~$416
87.4%


Ethereum Mainnet Cost Calculation Table
Input
Value
Calculation
Gas per on-chain write
65,856 gas
Measured from Sprint 1 tests
Cost per on-chain write
$0.066
Given cost assumption
Monthly audit events
50,000 events
5,000 businesses × 10 events/month
V3 batch size
100 events per digest
Design parameter
Sprint 2 overhead
$383.00
Epoch management + retrieval overhead


Ethereum Mainnet Monthly Cost Calculation Table
Scenario
On-chain writes/month
Calculation
Monthly Cost
Sprint 1 (per-transaction logging)
50,000 writes
50,000 × $0.066
$3,300
Sprint 2 V3 (digest anchoring only)
500 digests
(50,000 ÷ 100) × $0.066
$33.00
Sprint 2 V3 (total)
500 digests + overhead
$33.00 + $383.00
$416


D. Security Test Results
D.1 AI Security Test Results
Test Category
Test Case
Input
Result
Status
NORMAL
Filipino description
"tindahan ng pagkain"
Correct classification
PASSED
NORMAL
English description
"computer repair shop"
Correct classification
PASSED
EDGE
Empty input validation
""
Validation error returned in <5 ms
PASSED
BOUNDARY
Overlength input validation
2500-character description
Rejected (max 2000 chars enforced)
PASSED
ATTACK
Injection suite (XSS + SQL)
"<script>..." and "'; DROP TABLE..."
Treated as plain text, no execution
PASSED
DATA EXPOSURE
Prediction endpoint output filtering
Valid business description
Only LOB results returned; no model internals exposed
PASSED


D.2 Blockchain Security Test Results
Test Category
Test Case
Result
Status
Authorization
Non-auditor log attempt
Rejected with role error
PASSED
Input Validation
Zero hash attempt
Rejected with validation error
PASSED
Data Exposure
Event emission check
Only hash and eventType exposed
PASSED
Attack
Re-entrancy attempt
Protected by contract design
PASSED
Arithmetic Safety
Integer overflow/underflow checks
Solidity 0.8+ automatic revert protections active
PASSED



E. Performance Metrics
E.1 AI Performance Metrics Table
AI Model Performance Metrics Table
Metric
Value
Top-1 Accuracy
99.88%
Top-3 Accuracy
100.00%
Top-5 Accuracy
100.00%
Macro Precision
0.9990
Weighted Precision
0.9986
Macro Recall
0.9986
Weighted Recall
0.9988
Macro F1 Score
0.9988
Weighted F1 Score
0.9987
Test Rows
800
Number of LOB Categories
80


E.2 Blockchain Performance Metrics Table
Metric
Value
logAuditHash Gas
65,856 gas
verifyHash Gas
8,800 gas (O(1))
Baseline Monthly Gas (5K LGU)
3.3M gas
V3 Monthly Gas (5K LGU)
416K gas
Baseline Monthly Budget (Mainnet)
~$3,300
V3 Monthly Budget (Mainnet)
~$416
V3 Monthly Budget (Polygon)
~$0.16


F. Evaluation Test Results
F.1 Sprint 1 Test Results Summary
Component
Tests
Passed
Failed
Pass Rate
AI Classification
5
5
0
100%
Blockchain Audit
6
6
0
100%
Web Platform
8
8
0
100%
Mobile Support
4
4
0
100%
Total
23
23
0
100%

F.2 Sprint 2 Test Results Summary
Component
Tests
Passed
Failed
Pass Rate
AI Filipino Support
6
6
0
100%
Blockchain Gas Optimization
4
4
0
100%
Integration
5
5
0
100%
Total
15
15
0
100%




G. Security Threat Modeling Tables
G.1 CIA Triad Mapping for Critical Assets
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




G.2 STRIDE Threat Analysis
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
16
High
Immutable logs, centralized storage, retention policies



G.3 Risk Prioritization
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
8
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




G.4 Risk Justification
Category
Risk
Impact
Likelihood
Score
Priority
Mitigation Strategy
Owner
Acceptance Criteria
Technical/Data
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
>=99.9% API uptime during peak hours
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
8
Medium
Least-privilege enforcement, periodic access reviews, approval workflows
System Administrator
Quarterly access reviews; zero unauthorized actions
Technical/Process
AI validation flags incorrect or misleading results
3
3
9
Medium
Human-in-the-loop review, AI output explainability, periodic model evaluation
AI Service Lead
>=90% reviewer agreement with AI flags
Technical
Denial of Service attack on Backend API
4
3
12
High
Rate limiting, request throttling, traffic monitoring, DDoS protection
Infrastructure Team
System handles traffic spikes without service outage
People/Process
Business owners submit incomplete or incorrect documents
3
4
12
High
AI-assisted completeness checks, clear submission guidelines, user prompts
Permit Processing Unit
>=95% submissions complete on first review
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




G.5 OWASP Top 10 Mapping
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



H. Screenshots of the System
Landing Page

Login Page







Registration Page

Admin Dashboard








User Management

Form Definitions








Business Owner Dashboard

Account Settings Page

Business Owner Application Form

LGU Officer Dashboard





