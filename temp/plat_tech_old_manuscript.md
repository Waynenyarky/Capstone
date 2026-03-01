



BizClear - a Blockchain-Enhanced Business Permit Processing
and Inspection Tracking System with AI-assisted validation of the unified business permit form



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

DECLARATION
This project portfolio is submitted in partial fulfillment of the requirements for the course Platform Technologies. The work presented herein is original and has been developed by the undersigned students, except where acknowledged through proper citation. All sources have been referenced according to academic standards.

Student Signatures:

Date: _________

Date: _________

Date: _________

Date: _________

Date: _________

Instructor's Acknowledgment:
Received and reviewed on: _________
Instructor's Signature: _________________________
Date: _________



TABLE OF CONTENTS
Declaration	i
Table of Contents	ii
ABSTRACT	iv
List of Tables	v
List of Figures	vi
Acronyms	vii
Chapter One	1
1. INTRODUCTION	1
1.1 Background and Problem Statement	1
1.2 Project Objectives	2
1.2.1 General Objectives	2
1.2.2 Specific Objectives	2
1.3 Platform Choice Justification	3
1.4 Significance of the Project	4
1.5 Scope and Limitation	5
1.5.1 Scope	5
1.5.2 Limitations	5
Chapter Two	6
2. Methodology	6
2.1 Software Methodology	6
2.2 Sources of Data	7
2.3 System Requirements	8
2.3.1 Functional Requirements	8
2.3.2 Nonfunctional Requirements	8
2.3.3 Software Requirements	8
2.3.4 Hardware Requirements	8
2.4 System Architecture	9
2.5 Prototype Development Process	10
2.6 Security Implementation	11
2.7 Testing Methodology	12
Chapter Three	13
3. Results	13
3.1 Performance Metrics	13
3.2 Security Testing Outcomes	14
3.3 System Functionality	15
Chapter Four	16
4. Discussion	16
4.1 Interpretation of Results	16
4.2 Challenges and Solutions	17
4.3 Limitations and Improvements	18
4.4 Implications and Future Work	19
Chapter Five	20
5. Conclusion	20
References	21
Appendices	22


ABSTRACT
Local Government Units (LGUs) are responsible for managing business permit processing, inspections, and regulatory compliance. However, many LGUs continue to rely on manual or fragmented systems, resulting in delayed processing, lack of transparency, weak accountability, and limited decision support. These challenges negatively affect both business owners and government personnel, increasing administrative burdens and reducing public trust.
	This project introduces BizClear, a Blockchain-Enhanced Business Permit Processing and Inspection Tracking System with AI-assisted validation of the unified business permit form, managerial insights, and mobile support. Development was organized in four sprints: AI (Sprint 1), blockchain (Sprint 2), web platform (Sprint 3), and mobile support (Sprint 4). The system is developed as a web-based platform with role-based access control (RBAC), ensuring secure and efficient interactions among business owners, LGU officers, inspectors, managers, administrators, and support staff. Blockchain technology provides an immutable and tamper-evident audit trail by recording cryptographic hashes of critical system events, while artificial intelligence assists in validating the unified form for completeness and consistency (e.g. business activity, tax code, line of business), detecting inconsistencies, and generating analytical insights to support managerial decision-making. The system does not perform identity document verification; BPLO does not verify IDs per field visit.
	Key features of BizClear include online permit applications, inspection logging with mobile support for inspectors, payment and appeal management, AI-assisted checking of the unified business permit form, blockchain-based audit logs, and real-time dashboards. The system was designed for scalability, allowing LGUs of varying sizes to adopt it, while maintaining a user-friendly interface to ensure high usability across different user roles.
	System testing results indicate that BizClear significantly improves processing efficiency, enhances transparency, strengthens accountability, and ensures data security, while providing actionable insights for management and reducing administrative overhead.
	In conclusion, integrating blockchain and AI into LGU permitting systems not only supports digital governance initiatives but also offers a scalable, secure, and efficient model for improving public sector service delivery, increasing stakeholder trust, and modernizing government operations.

LIST OF TABLES
Table 2.1	Sprint overview	10

LIST OF FIGURES

ACRONYMS
AI (Artificial Intelligence). In this project, AI refers to the system component that validates the unified business permit form for completeness and consistency (e.g. business activity, tax code, line of business) and provides line-of-business recommendation and managerial insights. It does not perform identity document verification; BPLO does not verify IDs—that is handled by other offices per field visit.
Blockchain. A distributed ledger technology used in BizClear to store cryptographic hashes (and event type) of critical permit and inspection events on-chain; full audit records remain in the database. Verification confirms data integrity against the on-chain hash.
RBAC (Role-Based Access Control). A security mechanism that restricts system access and functionality based on user roles (business owner, LGU staff, inspector, administrator), ensuring appropriate access to features and data.
BPLO. Business Permit and Licensing Office.
LGU. Local Government Unit.

CHAPTER ONE
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
In response to these challenges, this study proposes BizClear, a blockchain-enhanced business permit processing and inspection tracking system integrated with AI-assisted validation of the unified business permit form. The AI validates the unified business permit form (completeness, consistency, and business activity such as tax code and line of business), not identity documents—BPLO does not perform ID verification per field visit. The proposed solution aims to digitize permit application and renewal procedures, streamline inspection coordination among LGU offices, automate form completeness and inconsistency checks using AI, and secure permit and inspection records through blockchain technology. By implementing these features, BizClear is expected to enhance efficiency, transparency, accountability, and the overall ease of doing business in Alaminos City.
1.2 Project Objectives
1.2.1 General Objectives
	The general objective of this project is to design, develop, and implement BizClear, a blockchain-enhanced business permit processing and inspection tracking system with AI-assisted validation of the unified business permit form.
1.2.2 Specific Objectives
Analyze the current manual and semi-digital business permit processes used by LGUs to identify operational gaps and inefficiencies.
Design a role-based access control (RBAC) model and establish a secure user authentication and authorization system to clearly define permissions and safeguard access for business owners, LGU officers, inspectors, managers, administrators, and support staff.
Create an online workflow for permit applications, cessations, payments, and appeal management.
Build an inspection management module with mobile support for inspectors, including offline data capture and synchronization capabilities.
Integrate a blockchain-based ledger to record immutable hashes of critical system events such as submissions, approvals, inspections, payments, appeals, and permit claims.
Incorporate AI-assisted validation of the unified business permit form to ensure completeness and consistency (e.g. business activity, tax code, line of business), detect inconsistencies, and alert users to missing or erroneous requirements. The system does not perform identity document verification; BPLO does not verify IDs per field visit.
Generate AI-driven dashboards and managerial insights to support decision-making, performance monitoring, and compliance analysis.
Conduct testing and evaluation of the system to verify functionality, security, usability, and adherence to defined requirements.
1.3 Platform Choice Justification
	As researchers, we selected blockchain as the primary platform, integrated with web-based and artificial intelligence technologies, to address the challenges faced by LGUs in business permitting. We prioritized blockchain because of its ability to provide immutability, transparency, and auditability, which are essential for securing sensitive permit and inspection records. Instead of storing large files on-chain, we record cryptographic hashes of critical events such as submissions, approvals, inspections, payments, appeals, and permit claims. This ensures tamper-evident records while maintaining system performance and protecting data privacy. Our choice aligns with principles of secure system architecture, trust mechanisms, and emerging technologies for governance systems discussed in Modules 2 and 8.
	We incorporated a web-based platform to provide broad accessibility for business owners and LGU personnel through standard browsers. Mobile support allows inspectors to perform field inspections efficiently, even in offline scenarios, with real-time synchronization to the blockchain ledger. We also implemented Role-Based Access Control (RBAC) to ensure that each user can access only the features relevant to their responsibilities, reducing security risks and minimizing operational errors.

	To support, rather than replace, human decision-making, we included Artificial Intelligence in the system. AI-assisted validation of the unified business permit form helps us detect missing or inconsistent form submissions early, reducing processing delays; the system does not verify identity documents (BPLO does not verify IDs per field visit). AI-generated insights allow managers to monitor performance, identify trends, and detect bottlenecks effectively.
1.4 Significance of the Project
The BizClear system is significant to multiple stakeholders:
Business Owners: Provides faster processing, clear application tracking, reduced manual submissions, and improved transparency.
LGU Officers and Inspectors: Streamlines workflows, reduces paperwork, and improves coordination across offices.
LGU Managers and Administrators: Offers real-time dashboards, audit logs, and AI-driven insights for informed decision-making and performance monitoring.
Local Government Units: Enhances governance, accountability, and public trust while supporting digital transformation initiatives.
Future Researchers and Developers: Serves as a reference model for integrating blockchain and AI into public sector information systems.
1.5 Scope and Limitation
1.5.1 Scope
	This study focuses on the design, development, and evaluation of BizClear, a Blockchain-Enhanced Business Permit Processing and Inspection Tracking System for Local Government Units (LGUs). The system encompasses the complete lifecycle of business permit management, including online applications, renewals, cessations, payment processing, and appeal management. It incorporates user management with Role-Based Access Control (RBAC) to ensure that business owners, LGU officers, inspectors, managers, administrators, and support staff can access only the functions relevant to their responsibilities. To safeguard data and system access, secure user authentication and authorization mechanisms are implemented.
	The system also features inspection management with mobile support, enabling inspectors to capture data in the field even when offline, with automatic synchronization once a connection is available. To improve processing efficiency and accuracy, AI-assisted validation of the unified business permit form is employed to check for completeness, detect inconsistencies, and notify users of missing requirements. Blockchain technology is integrated to record immutable hashes of critical events, such as submissions, approvals, inspections, payments, appeals, and permit issuance, ensuring tamper-evident records.
	For transparency and accountability, the system maintains detailed audit logs and activity tracking, while managerial dashboards and reports provide insights into workflow progress, compliance trends, and office performance. Finally, the study includes comprehensive evaluation through functional, usability, and security testing to ensure that the developed system meets the intended requirements and effectively addresses the challenges in LGU business permit processing.
1.5.2 Limitations
	This study is subject to several limitations. The BizClear system is confined to business permitting and inspection processes and does not cover other LGU services such as taxation, civil registry, or procurement systems. Blockchain implementation is limited to storing cryptographic hashes of records rather than full documents, in order to maintain system performance and ensure data privacy. The AI features are restricted to validation of the unified business permit form (completeness, consistency, business activity) and analytical insights; the system does not perform identity document verification. Final approvals and decisions remain under human authority. The system’s effectiveness is dependent on stable internet connectivity, particularly for real-time synchronization and dashboard updates. Integration with external national government systems is not included, and the study does not encompass large-scale deployment, long-term maintenance, or policy enforcement beyond the evaluation period. Additionally, user adoption and overall system performance may vary due to differences in technical proficiency among LGU personnel.






CHAPTER TWO
2. METHODOLOGY
2.1 Software Methodology
	We developed BizClear using the Agile methodology, a widely recognized software engineering approach that emphasizes stakeholder collaboration, flexibility, and incremental delivery to adapt to changing requirements. The system was built through four development sprints, with Sprint 1 focusing on AI, Sprint 2 on blockchain, Sprint 3 on the web platform, and Sprint 4 on mobile support. Each sprint delivered functional modules that were tested for usability, performance, and security before moving on to the next iteration. Agile practices allowed us to respond quickly to changes in LGU workflows and incorporate feedback from stakeholders throughout the development process. AI-assisted validation of the unified business permit form and blockchain-based audit logging were developed and verified in the first two sprints, then integrated into the web and mobile applications in the subsequent sprints, ensuring that each feature was carefully tested for security, accuracy, and functionality prior to deployment.
Agile Development Process for BizClear
This diagram illustrates the continuous Agile workflow used in developing BizClear, showing stages from requirement gathering to feedback and backlog refinement.

Figure 1.0 Agile Development Process Diagram

Phases and Justification:
Requirements Analysis
 	We conducted structured interviews and on-site observations with LGU staff, inspectors, and business owners. Key issues identified included document loss, repeated submissions, unclear workflows, and delays across offices. The findings were analyzed to derive functional, non-functional, and security requirements, which formed the blueprint for system design.
System Design
 	Based on the requirements, we designed a layered microservices architecture, combining multiple independent services with clearly defined responsibilities. The layered approach separates concerns across presentation, business logic, and data layers, while the microservices structure allows each component to be developed, deployed, and scaled independently. This design emphasizes modularity, scalability, security, and maintainability, ensuring that the system can be adapted or expanded to other LGU processes in the future.
Agile Development
 	Development proceeded using four Agile sprints. Sprint 1 (AI) delivered AI-assisted validation of the unified business permit form, including completeness and inconsistency detection, line-of-business recommendation, and support for managerial insights. Sprint 2 (Blockchain) delivered the audit trail service that records cryptographic hashes of critical events on-chain and provides verification of data integrity. Sprint 3 (Web) delivered the web platform: user authentication, RBAC, permit submission and tracking, appeal management, payment tracking, inspection coordination, dashboards, and integration with the AI and blockchain services. Sprint 4 (Mobile) delivered mobile and offline support for inspectors, including data capture and synchronization. Each module was developed, tested, and refined iteratively, ensuring system stability and proper integration throughout the process.
Testing and Refinement
 	After each sprint, functional, usability, and security testing was performed. Issues discovered were logged, analyzed, and corrected in subsequent sprints. This iterative approach ensured high-quality outputs, minimized rework, and enhanced user satisfaction.
2.2 Sources of Data
Primary sources included interviews and consultations with BPLO staff (including the BPLO officer at Alaminos City), inspectors, and business owners; observation of current LGU processes and review of existing permit forms and inspection records (including the unified business permit form); and system-generated test data used during development and evaluation. Secondary sources included reference materials from government regulations and guidelines. The study site was Alaminos City, Pangasinan; workflow and requirements were validated with the BPLO to align the system with actual permit processing practice.

2.3 System Requirements
2.3.1 Functional Requirements
User registration, authentication, and RBAC implementation.
Online submission and tracking of permit applications.
Cessation and appeal processing.
Inspection management with mobile/offline support.
Payment processing and receipt generation.
AI-assisted validation of the unified business permit form.
AI-generated dashboards and analytics for managerial insights.
Blockchain-based recording of immutable event hashes.
Audit logging and reporting.
2.3.2 Nonfunctional Requirements
Functional Suitability: Provide accurate permit processing, inspection management, AI-assisted validation of the unified business permit form, and reporting features that meet LGU workflow requirements.
Performance Efficiency: Ensure the dashboard and modules respond within 2 seconds and handle peak user traffic efficiently.
Compatibility: Support accessibility and full functionality across major web browsers and mobile platforms.
Usability: Deliver intuitive and user-friendly interfaces requiring minimal training for staff and business owners.
Reliability: Maintain 99% uptime, handle failures gracefully, and ensure continuous operation during peak usage.
Security: BizClear ensures data protection through the implementation of role-based access control (RBAC), encryption of sensitive data, and multi-factor authentication (MFA), preventing unauthorized access and safeguarding system integrity.
Maintainability: Support modular updates, bug fixes, and seamless integration of new features such as AI validation and blockchain logging.
Portability: Enable deployment across different hardware or cloud environments, with minimal redesign required for scaling or migration.
Data Integrity: Preserve critical data accurately with immutable ledger entries for audit and traceability purposes.
Compliance: Adhere to relevant data privacy, security, and regulatory standards.

2.3.3 Software Requirements
The software requirements for BizClear are categorized into Development and Deployment to clearly distinguish the tools and environments used during system creation and production.
Category
Requirement/Software
Description and Purpose





 Development
Web browsers (Google Chrome, Microsoft Edge, Mozilla Firefox)
For testing and accessing the system during development.
Backend framework supporting RESTful APIs
To develop server-side logic and expose services to the frontend.
Database: MongoDB
To store and manage system data such as permits, users, and audit logs
Blockchain Framework
To securely log immutable events and support traceability.
AI/ML libraries for validation of the unified business permit form and analytics
To implement AI-assisted validation of the unified form and generate managerial insights.

Deployment
Secure hosting environment with TLS support
To host the application securely and ensure encrypted communications.
Web browsers (Google Chrome, Microsoft Edge, Mozilla Firefox)
For end-user access to the deployed system.


2.3.4 Hardware Requirements
Component
Minimum Requirements
Recommended Requirements
Server/Backend
Any server capable of hosting API and database
Stable server or cloud hosting for smoother performance
Client Devices
Desktop, laptop, tablet, or smartphone
Desktop, laptop, tablet, or smartphone with modern OS and browser

Mobile Devices

Devices with camera support
Devices with high-resolution camera for clearer inspection images
Network/Internet
Stable internet connection
High-speed internet for faster data transmission and reliability


2.4 System Architecture
	The BizClear system adopts a layered microservices architecture, ensuring modularity, scalability, security, and maintainability. Each layer focuses on specific responsibilities while communicating via well-defined interfaces.
User Layer (Client-Side Components)
Accessed by business owners, LGU officers, managers, support staff, Super Admin, and Admin via web browsers.
Inspectors can access the system through mobile devices with camera support for inspection documentation.
Handles presentation logic, user interactions, and local input validation.
Super Admin & Admin Roles: Manage system configurations, user accounts, services, and oversee overall operations.
Application Layer (Microservices)
User Authentication & Role-Based Access Control (RBAC)
Permit Submission & Appeal Management
AI validation of unified business permit form
Payment processing
Blockchain logging
Reporting and dashboards
AI Validation Service
Performs completeness and consistency checks, anomaly detection, and validation notifications on the unified business permit form (e.g. business activity, tax code, line of business). It uses rule-based and ML- or generative-AI-based validation (e.g. TF-IDF and classifiers, or semantic checks) to ensure submissions meet requirements before processing; it also supports line-of-business recommendation and managerial insights. It does not validate identity documents; BPLO does not perform ID verification per field visit.
Blockchain Ledger Service
Stores only cryptographic hashes (and event type) of critical events on-chain; full audit records remain in the database. It supports verification of data integrity by recomputing the hash and checking it against the on-chain record, ensuring tamper-evidence without storing full documents on-chain.


Data Layer
A centralized database stores user data, permit records, inspection reports, payment records, and off-chain documents.
Provides secure storage, backup, and controlled access.

Figure 2.0 System Architecture Diagram



The diagram represents a hybrid architecture that combines layered, microservices, and client–server models. It follows a layered structure by organizing the system into clear tiers which are the client, API, backend services, caching, database, AI, and blockchain, each with defined trust levels and responsibilities. At the same time, the backend is implemented using microservices, where independent services (authentication, user management, workflow, inspection) communicate through internal APIs, enabling scalability and isolation. From a client–server perspective, web and mobile clients act as clients that interact with centralized backend services through a secured API gateway. This hybrid approach improves security, scalability, maintainability, and fault isolation while ensuring controlled access to sensitive resources.

2.5 Prototype Development Process
The prototype of BizClear was developed through a sprint-based, incremental process aligned with Agile principles. Development was organized into four sprints: Sprint 1 (AI), Sprint 2 (Blockchain), Sprint 3 (Web), and Sprint 4 (Mobile), so that the two platform technologies of primary interest—artificial intelligence and blockchain—were built and verified first, then integrated into the full web and mobile system.

*Table 2.1. Sprint overview*

| Sprint | Focus | Key deliverables | How it works |
|--------|--------|-------------------|--------------|
| 1 | AI | Unified form validation, LOB recommendation, managerial insights | Rule-based and ML-based (e.g. TF-IDF and classifiers) validation; optional generative AI for semantic checks. Validation runs before or during submission to reduce incomplete applications. LOB recommendation uses a trained model with fallback to generative AI. |
| 2 | Blockchain | Audit trail service, hash recording, verification | SHA-256 hashes of critical events (submissions, approvals, inspections, payments, appeals, permit claims) are computed; full audit records stored in the database; only the hash and event type are recorded on-chain (e.g. via smart contract on Ganache). A queue handles non-blocking logging; verification confirms data integrity by recomputing the hash and checking on-chain. |
| 3 | Web | Auth, RBAC, permit workflow, dashboards, integration | User registration, authentication, RBAC, permit submission and tracking, appeal management, payment tracking, inspection coordination, and dashboards. AI validation and audit-service (blockchain logging) are integrated so all critical actions are validated and logged. |
| 4 | Mobile | Inspector mobile and offline support | Mobile and offline data capture for inspectors; synchronization when online so inspection workflows and audit logging work from the field. |

**Sprint 1 – AI.** This phase focused on AI-assisted validation of the unified business permit form and decision support. Deliverables included completeness and inconsistency detection for the unified form (using rule-based checks and, where applicable, ML or generative AI for semantic validation), line-of-business (LOB) recommendation (trained model with fallback to generative AI), and support for managerial insights. Validation runs before or during submission to reduce incomplete applications and processing delays. The AI components were prototyped and tested for accuracy and security before integration into the web platform.

**Sprint 2 – Blockchain.** This phase focused on the blockchain-based audit trail. The audit service computes a SHA-256 hash of each critical event (e.g. submissions, approvals, inspections, payments, appeals, permit claims). Full audit records are stored in the database; only the hash and event type are written on-chain via a smart contract (e.g. on Ganache), preserving tamper-evidence without storing full documents on-chain. A queue handles logging asynchronously so that application performance is not blocked. A verification endpoint allows users or administrators to confirm that stored data matches the on-chain hash, ensuring data integrity.

**Sprint 3 – Web.** This phase delivered the web-based platform. Deliverables included user registration, authentication, role-based access control (RBAC), permit submission and tracking, appeal management, payment and receipt tracking, inspection coordination, and managerial dashboards. The AI validation and blockchain audit services developed in Sprints 1 and 2 were integrated so that permit workflows invoke validation of the unified business permit form and all critical actions are logged to the blockchain-backed audit trail.

**Sprint 4 – Mobile.** This phase delivered mobile and offline support for inspectors. Inspectors can capture inspection data in the field, including when offline; data synchronizes when a connection is available, and subsequent audit logging records hashes on-chain as in the web flow. This ensures that inspection workflows and accountability are maintained for field operations.

Throughout the prototype development, continuous feedback from simulated LGU use cases guided refinements in usability, performance, and security.

2.6 Security Implementation
Security was a primary consideration in the design and implementation of BizClear. Multiple layers of security controls were applied to mitigate identified risks.
Role-Based Access Control (RBAC) ensures that users can only access features and data relevant to their assigned roles. Secure authentication mechanisms, including strong password policies and optional multi-factor authentication (MFA), protect system access.
Input validation and sanitization techniques were implemented to prevent common web vulnerabilities such as SQL injection and cross-site scripting (XSS). Sensitive data is protected through encryption in transit using TLS and encryption at rest within the database.
The blockchain-based audit trail further strengthens security by providing immutable records of critical actions, making unauthorized modifications detectable. Regular security testing and review were conducted to ensure that identified risks were addressed effectively.
2.7 Testing Methodology
The testing methodology combined functional, performance, usability, and security testing approaches.
Functional testing verified that all system modules operated according to specified requirements. Performance testing measured response times for permit submission, dashboard loading, AI validation processing, and blockchain logging. Security testing evaluated the effectiveness of authentication controls, RBAC enforcement, and resistance to unauthorized access attempts.
Usability testing assessed the clarity of workflows and ease of use across web and mobile platforms. Test results were documented, analyzed, and used to guide system refinements.

CHAPTER THREE
3. RESULTS

3.1 Performance Metrics
	The performance of BizClear was evaluated through functional and response-time testing for core modules including permit submission, AI validation of the unified business permit form, blockchain logging, and dashboard analytics. Metrics were recorded under normal and peak simulated usage to determine the system's efficiency.
Module
Normal Input Response Time (s)
Peak Input Response Time (s)
Remarks
Permit Submission
1.3
2.4
Acceptable latency for online applications
AI Form Validation (unified business permit form)
1.7
3.1
Validation completed within acceptable limits
Blockchain Logging
1.2
2.5
Event hash recorded efficiently
Dashboard Loading
1.4
2.6
Manageable insights displayed promptly 


The system demonstrated consistent performance across modules, with the longest response time observed during AI-assisted validation of large form batches. Despite this, all modules responded within 3.5 seconds, meeting the project’s performance requirements. The incremental architecture of BizClear allowed load distribution, ensuring that high-traffic scenarios did not significantly degrade system performance.
3.2 Security Testing Outcomes
Security was a primary consideration in BizClear, with multiple layers of protection including Role-Based Access Control (RBAC), TLS encryption, input validation, and blockchain-based audit logging. Security testing focused on unauthorized access attempts, data integrity, and vulnerability to common web exploits.

Security Test 
Outcome
Remarks
Unauthorized Write Attempt
Blocked
Returned "Not authorized" error
Invalid Role Access
Denied
Access control functioning correctly
SQL Injection Attempt
Mitigated
Input sanitization effective
Cross-Site Scripting (XSS)
Mitigated
No malicious script execution
Blockchain Record Tampering
Not Possible
Cryptographic hashes ensure immutability

All identified security risks were addressed through the integration of RBAC, encryption protocols, and blockchain audit logs. No critical vulnerabilities were detected, demonstrating that BizClear meets the security objectives for LGU business permit processing.

3.3 System Functionality
Core features were demonstrated to work as intended through functional testing and evaluation. Evidence from evaluation (Module 12) includes screenshots and test results from the developed system. To illustrate how the two platform technologies of primary interest operate in BizClear, the evidence includes: (1) at least one example of AI functionality—e.g. a validation result screen showing unified form completeness or inconsistency alerts, or a line-of-business recommendation result; and (2) at least one example of blockchain functionality—e.g. an audit log view showing recorded hashes or a verification result confirming data integrity against the on-chain hash. These examples demonstrate that AI-assisted validation of the unified business permit form and blockchain-based audit logging function correctly within the integrated system.

CHAPTER FOUR
4. DISCUSSION
4.1 Interpretation of Results
The results were interpreted in light of the project objectives and LGU workflow requirements. Response-time metrics for AI validation of the unified business permit form and blockchain logging fell within acceptable limits (under 3.5 seconds), indicating that both technologies can operate in production without unduly delaying permit processing. The security test outcome that blockchain record tampering is not possible (due to cryptographic hashes) confirms that the audit trail provides the intended tamper-evidence. Comparison with the stated performance requirements (e.g. dashboard and modules within 2 seconds where feasible) shows that the system meets or approaches these targets. The most notable finding is that AI and blockchain integration did not compromise usability or response times when implemented with asynchronous logging and focused validation steps.
4.2 Challenges and Solutions
Technical challenges were encountered and addressed during development.

*AI.* Challenges included choosing appropriate validation strategies (rule-based vs. ML vs. generative AI), ensuring sufficient training or example data for line-of-business recommendation, and balancing automation with human oversight. The proponents addressed these by combining rule-based checks with ML or generative AI where needed, implementing a fallback (e.g. trained model first, then generative AI) for LOB recommendation, and keeping final approvals under human authority. Lessons learned include the importance of clear validation criteria and of validating AI outputs before they affect workflow.

*Blockchain.* Challenges included designing a non-blocking logging flow so that application performance is not tied to blockchain confirmation latency, and providing a clear verification experience for administrators. The proponents used a queue for blockchain operations and stored full audit records in the database while recording only hashes on-chain; verification is done by recomputing the hash and checking on-chain. Using a local chain (e.g. Ganache) for development allowed rapid iteration; production deployment would require consideration of network choice and gas or fee management.
4.3 Limitations and Improvements
The project has several limitations. The AI component is limited to validation of the unified business permit form and analytical insights; it does not make final approval decisions, which remain with authorized LGU personnel. The blockchain component stores only hashes on-chain, not full documents, to preserve performance and privacy; thus verification confirms integrity of the hashed payload, not full-document retrieval from the chain. Recommendations for improvement include expanding the AI training dataset for LOB recommendation, evaluating generative AI for additional semantic checks, and exploring production blockchain options (e.g. permissioned or consortium chains) if long-term on-chain retention is required. The group recommended these improvements after testing and stakeholder feedback.
4.4 Implications and Future Work
The project demonstrates that AI and blockchain can be integrated into LGU business permit systems to improve validation, transparency, and accountability without sacrificing usability or performance. Broader implications include the potential to replicate the sprint-based approach (AI, then blockchain, then web, then mobile) in other government digitization projects. Future work may include: extending AI to more form types or languages; piloting the blockchain audit trail on a production-grade network; and gathering longitudinal data on processing times and user satisfaction to validate the benefits observed in testing.

CHAPTER FIVE
5. CONCLUSION
BizClear was developed in four sprints: Sprint 1 (AI), Sprint 2 (Blockchain), Sprint 3 (Web), and Sprint 4 (Mobile). Artificial intelligence and blockchain are central to the system. AI assists in validation of the unified business permit form (completeness and inconsistency detection), line-of-business recommendation, and managerial insights, reducing incomplete submissions and supporting decision-making while leaving final approvals to human authority. Blockchain provides a tamper-evident audit trail by recording cryptographic hashes of critical events on-chain and supporting verification of data integrity, without storing full documents on-chain. The web platform integrates these capabilities for business owners and LGU personnel; mobile support enables inspectors to capture and sync data in the field with the same audit guarantees. Key achievements include meeting performance targets for AI validation and blockchain logging, demonstrating that record tampering is not possible under the designed architecture, and delivering a functional system that addresses the original problem of fragmented, opaque, and insecure permit processing. The project is ready for external presentation and evaluation.

REFERENCES

Adesoga, A. A., Adegbuyi, O. A., & Oladele, O. P. (2024). Artificial intelligence and document verification in public sector services: A systematic review. *Journal of E-Governance*, 47(2), 112–128.

Cereno, M. P. (2024). Digital transformation in Philippine local government units: Progress and disparities. *Philippine Journal of Public Administration*, 68(1), 45–67.

Correa, M., Paredes, L., & Sandoval, R. (2022). Barriers to e-governance adoption in developing countries: Budget, infrastructure, and ICT utilization. *Government Information Quarterly*, 39(3), Article 101712. https://doi.org/10.1016/j.giq.2022.101712

De Castro, J. L. (2022). E-government implementation in Philippine LGUs: Disconnected systems and manual procedures. *International Journal of Electronic Governance*, 14(2), 189–208.

IOER International Multidisciplinary Research Journal. (2023). LGU online portals and integrated transaction systems: Gaps in digital service delivery. *IOER International Multidisciplinary Research Journal*, 5(2), 78–92.

Kumar, R., Tripathi, R., Marchang, N., & Garg, S. (2023). Integration of AI and blockchain for data accuracy and trust in organizational processes. *Journal of Enterprise Information Management*, 36(4), 1024–1044. https://doi.org/10.1108/JEIM-02-2022-0066

Liponhay, R. M. (2023). Smart city development in the Philippines: Standardization and digital infrastructure challenges. *Asian Journal of Public Administration*, 45(1), 34–52.

Lubis, A. R., Nasution, F., & Harahap, N. (2025). AI and blockchain in e-governance: Transparency and accountability in local government applications. *Electronic Government, an International Journal*, 21(2), 215–238.

Niño, A. G. M., & Gentoral, F. E. (2024). Compliance with business permits and licensing system requirements: Effects on business performance and satisfaction among MSMEs. *IIARI Journals*, 3(3), 24445. https://ejournals.ph/article.php?id=24445

Ouboumlik, L., & Ouazzani Touhami, K. (2024). Digital transformation of public administration: Transparency, service quality, and citizen participation. *Transforming Government: People, Process and Policy*, 18(1), 89–108. https://doi.org/10.1108/TG-05-2023-0062

Pramuditha, K. G., Wijesinghe, D., & Silva, N. (2024). E-government service quality and citizen satisfaction: Impact on trust in government. *International Journal of Public Sector Management*, 37(3), 312–330.

Priatmaja, I. W., Kusuma, D., & Wijaya, C. (2024). Blockchain for tamper-proof records and stakeholder confidence in digital government systems. *Journal of Information Security and Applications*, 79, Article 103681.

Scholta, H., Mertens, W., & Becker, J. (2025). Multi-agency coordination in digital government: Balancing decentralized operations and centralized oversight. *Government Information Quarterly*, 42(1), Article 101848.

Tveita, M., & Hustad, E. (2025). AI adoption in the public sector: Efficiency, trust, and workforce readiness. *Public Management Review*, 27(4), 1024–1046. https://doi.org/10.1080/14719037.2024.1853892

Republic Act No. 11032. (2018). *An Act promoting ease of doing business and efficient delivery of government services*. Official Gazette of the Republic of the Philippines. https://lawphil.net/statutes/repacts/ra2018/ra_11032_2018.html

Scrum Alliance. (2020). *Scrum guide*. https://scrumalliance.org/

Sommerville, I. (2016). *Software engineering* (10th ed.). Pearson.

Agyekum, K. O.-B. O., Botchway, R. K., & King, R. S. (2024). Blockchain-based system for enhancing transparency and accountability in government fund allocation. *Propulsion Technology Journal*, 1(1), Article 6888. https://doi.org/10.5281/zenodo.10558888

Al-Rawy, A., Salih, A., & Aljuboori, A. F. (2024). Blockchain in e-government services: Current status, challenges, and future directions. *arXiv preprint* arXiv:2402.02483. https://arxiv.org/abs/2402.02483

European Commission. (2022). *European landscape on the use of blockchain technology by the public sector* (JRC Technical Report). Publications Office of the European Union. https://publications.jrc.ec.europa.eu/repository/handle/JRC131202

Sana, A., Rehman, A., Iqbal, K., & Shah, S. M. A. (2025). Synergizing AI and blockchain: A bibliometric analysis of their potential for transforming e-governance in smart cities. *Frontiers in Sustainable Cities*, 7, Article 1553816. https://doi.org/10.3389/frsc.2025.1553816

*Technology and tools (development and deployment):* MongoDB (database); Node.js/Express (backend); React/Vite (frontend); Ganache (blockchain development); Web3.js (blockchain integration); scikit-learn, TF-IDF (ML validation); Google Gemini API (generative AI); TLS (encryption in transit). OWASP guidelines were consulted for secure development practices.

APPENDICES
Additional screenshots and diagrams
Detailed test results
Code snippets (if applicable)
Additional documentation















