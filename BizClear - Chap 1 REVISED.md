# Chapter 1

# **PROJECT OVERVIEW**

## **Background of the Study**

Business permit processing is a fundamental regulatory function of Local Government Units (LGUs) that ensures businesses operate legally, safely, and in compliance with established standards. Efficient permit processing is essential because it directly affects local economic activity, public safety, and public trust in government institutions. When permit systems are slow, fragmented, or poorly monitored, they can discourage entrepreneurship, delay investments, and weaken regulatory enforcement.

With the advancement of digital technologies, governments worldwide have increasingly adopted e-government systems to improve the efficiency, transparency, and accessibility of public services. Studies highlight that digital platforms reduce processing time, minimize human error, and allow real-time monitoring of transactions. The digital transformation of public administration has been recognized as a critical vector for modernizing government services, strengthening transparency, and enhancing citizen engagement. According to the United Nations E-Government Survey 2024, despite global crises, nations worldwide have accelerated digital government strategies, with significant progress driven by investments in resilient infrastructure and technologies including artificial intelligence, cloud computing, and broadband (United Nations, 2024).

More recently, Artificial Intelligence (AI) and blockchain have emerged as transformative technologies capable of further enhancing digital governance. AI has been widely used to automate document validation, detect inconsistencies, and support decision-making. Research from the Alan Turing Institute demonstrates that AI-powered automation can significantly improve bureaucratic efficiency, with studies showing that 84% of complex government transactions are highly automatable, potentially saving the equivalent of 1,200 person-years of work annually if AI reduces processing time by just one minute per transaction (Bedi et al., 2024). Across U.S. federal agencies, generative AI use cases increased ninefold from 32 cases in 2023 to 282 in 2024, while total AI use cases nearly doubled from 571 to 1,110 (U.S. Government Accountability Office, 2025). AI deployment in government offers substantial efficiency gains, with agencies using AI for case processing potentially saving up to 35% of budget costs over ten years (Boston Consulting Group, 2025).

Blockchain technology has been recognized for its ability to ensure data integrity, transparency, and tamper-proof recordkeeping. A systematic literature review by Enríquez et al. (2024) identified best-practice blockchain-based governance models specifically focused on corruption and transparency, examining their characteristics, components, and the role of token economies in addressing asset ownership issues. Blockchain's immutable ledger and cryptographic security enable enhanced tracking of government fund allocation while reducing corruption risks (Agyekum et al., 2024). A 2024 survey by Al-Rawy et al. examined the current status and challenges of blockchain implementation in e-government services, surveying existing use cases and identifying research gaps in blockchain deployment across governmental organizations.

When combined, AI and blockchain technologies provide stronger benefits than using either technology alone. A 2025 bibliometric analysis by Sana et al. found that while AI and blockchain are separately applied in e-governance, there is a clear gap in empirical studies addressing their combined use. The study identified that AI enables real-time data processing and predictive insights for policy decisions and resource distribution in smart cities, while blockchain provides secure, immutable records of transactions and decisions, enhancing transparency and public trust. Related research emphasizes that AI–blockchain convergence improves data reliability and trust across business processes, and that AI's analytical capabilities, when combined with blockchain's immutable ledger, significantly enhance accountability and transparency in e-governance systems. These studies collectively show that integrated digital solutions are effective in addressing long-standing issues in public sector service delivery.

Research on e-government service quality demonstrates that high-quality digital services significantly impact citizen satisfaction and trust. A 2023 study by Reddick et al. identified five key dimensions of e-government service quality: ease of interaction, fulfillment, citizen care, security and privacy, and trustworthiness. The research found that trustworthiness and fulfillment are the strongest predictors of perceived citizen value in e-government services. A 2024 OECD study found that e-government does not directly improve trust in government but has an indirect effect through governance quality—meaning e-government systems must actively contribute to governance quality to build citizen trust (Sasaki, 2024). This relationship underscores the importance of prioritizing service quality improvements in digital government initiatives to foster healthier relationships between government and citizens.

### **Philippine E-Government Context**

In the Philippines, Republic Act No. 11032, also known as the Ease of Doing Business and Efficient Government Service Delivery Act of 2018, mandates maximum processing times for government transactions: 3 working days for simple transactions, 7 working days for complex transactions, and 20 working days for highly technical applications (Republic Act No. 11032, 2018). The law requires LGUs to establish Business One-Stop-Shops (BOSS) and automate their business permitting and licensing systems. However, compliance with these standards remains uneven across LGUs.

As of December 2024, only 838 out of 1,642 LGUs (approximately 51%) have been digitally connected through the eLGU program (Department of Information and Communications Technology, 2024). While approximately 60% of LGUs were automating business permit processing as of December 2023, only 39% accept online applications and merely 15% accept online payments (Department of the Interior and Local Government, 2023). Digitalization efforts have contributed to improved revenue collection, increasing from PHP 50 billion in 2018 to PHP 208 billion by late 2023, demonstrating the potential benefits of digital transformation (Philippine News Agency, 2023).

Despite these initiatives, progress remains uneven. A scoping review on digital governance in the Philippines found that while digital governance can improve public service delivery through responsiveness, accessibility, and efficiency, success requires overcoming adoption barriers, financial capability challenges, digital literacy deficiencies, and ICT infrastructure issues (Castillo, 2024). A 2022 study of Sorsogon local governments found that e-Government initiatives were mostly conducted in partnership with National Government Agencies, with most human resource development occurring through NGA-sponsored seminars and training. Few local governments partnered with the private sector or higher learning institutions (Fresco, 2022). Recent research proposing an integrative smart city framework for Philippine LGUs identified critical gaps including limited research and development investment, despite established ICT plans and active e-governance initiatives (Castañeda & Dizon, 2024). A case study of Muñoz LGU documented significant obstacles including budget limitations, skill gaps, cybersecurity issues, and user adoption challenges (Espiritu et al., 2023). Key challenges include red tape from legacy systems, staffing and training deficiencies, cybersecurity threats, connectivity issues, and lack of project continuity (Digital Watch, 2024).

Research on business permit systems in Philippine cities further demonstrates the importance of efficient permit processing. A 2024 study of 390 MSMEs in Iloilo City by Niño and Gentoral found that businesses reported high compliance with BPLS requirements, with very good to excellent business performance ratings. The research revealed a very strong positive relationship between compliance and satisfaction with BPLS, though only a negligible relationship between compliance and actual business performance. The study recommended fully implementing electronic BPLS systems as part of ease of doing business initiatives, highlighting the need for digital permit processing solutions that enhance both compliance and business satisfaction.

### **The Case of Dagupan City**

In Dagupan City, business permit processing involves multiple offices including the Business Permit and Licensing Office (BPLO), Bureau of Fire Protection (BFP), Sanitary Office, Zoning Office, and Engineering Office (City Government of Dagupan, n.d.). Business owners are typically required to submit physical documents and visit several offices to complete inspections and approvals. This process is largely manual, resulting in long queues, delayed approvals, difficulty in monitoring inspection status, and limited access to historical compliance records.

The current manual workflow in Dagupan City poses significant challenges in terms of efficiency and accountability. Inspection results are recorded separately by different offices, making coordination difficult and slowing down decision-making. Retrieving records for verification or audit purposes is time-consuming, and the absence of a centralized system increases the risk of data inconsistencies and manipulation.

**Specific examples of inefficiencies include:**

1. **Multiple Office Visits and Redundant Submissions.** A business owner applying for a new permit must physically visit up to five different offices (BPLO, BFP, Sanitary, Zoning, and Engineering), often on separate days due to varying office schedules and queuing times. Each office may require duplicate copies of the same base documents (e.g., DTI/SEC registration, barangay clearance, lease contract), leading to unnecessary paperwork and expenses.

2. **Sequential Processing Bottlenecks.** If a deficiency is identified at a later stage—for example, if the Zoning Office finds an incomplete land use requirement—the applicant must return to the BPLO to resubmit, then revisit all subsequent offices. This sequential dependency can extend what should be a 7-day process (per RA 11032) to 3-4 weeks or longer.

3. **Uncoordinated Inspection Scheduling.** Inspections from BFP, Sanitary, and Engineering offices are scheduled independently, requiring business owners to be available on multiple unpredictable dates. A single business may receive inspection notices for three different days within a two-week period, disrupting business operations and requiring repeated coordination efforts.

4. **Paper-Based Record Vulnerabilities.** Inspection results and clearances are recorded in physical logbooks or standalone files. Locating historical compliance records for audit or renewal verification can take significant time, and physical documents are susceptible to loss, damage, or unauthorized alteration.

5. **Limited Status Visibility.** Business owners have no centralized way to track their application status across multiple offices. They must call or visit each office individually to inquire about progress, leading to uncertainty and wasted time.

Despite existing efforts, significant gaps remain in business permit processing systems. Current challenges include manual document submission, repetitive requirements, delayed inspections, poor inter-office coordination, and weak record security. Research by Scholta on digital transformation in public sector organizations emphasizes that while digital formats for professional development are increasingly adopted in the public sector, organizational structures and internal coordination mechanisms often hinder systematic implementation (Scholta, 2023). The digitalization of public services involving multiple offices requires effective coordination mechanisms, as the many actors involved in multi-office digital services need centralized coordination to benefit from both decentralized flexibility and centralized efficiency. These limitations increase the risk of lost or altered records, reduce transparency, and make it difficult for LGUs to track compliance histories accurately. The reviewed studies indicate a lack of empirical implementations that combine AI-assisted validation and blockchain-based security in local-level permit systems, particularly in developing country settings (Sana et al., 2025).

To address these challenges, this study proposes BizClear, a blockchain-enhanced business permit processing and inspection tracking system with AI-assisted document validation. The proposed system will digitize permit application and renewal processes, automate inspection coordination among LGU offices, utilize AI to check document completeness and inconsistencies, and secure permit and inspection records using blockchain technology. Through these features, BizClear is expected to improve efficiency, transparency, accountability, and overall ease of doing business in Dagupan City.

---

## **Conceptual Framework**

This study adopts the Input–Process–Output (IPO) framework, which is appropriate for system development research as it illustrates how identified inputs are transformed through defined processes into desired outputs.

**Input.** The inputs of the study include the existing manual business permit processes, identified problems such as delays and fragmented inspections, user requirements from business owners and LGU personnel, and the proposed system features including AI-assisted document validation and blockchain-based record security.

**Process.** The process involves requirements gathering and workflow analysis, system design and development using the Scrum Agile methodology, implementation of AI-based document validation, integration of digital inspection workflows, blockchain hashing and recording of permit and inspection data, and system testing and evaluation.

**Output.** The expected output is a fully developed digital business permit processing and inspection tracking system. The system is expected to produce faster permit processing, improved document accuracy, secure and tamper-proof records, and enhanced monitoring and reporting capabilities for LGUs.

*Figure 1.1 presents the Input–Process–Output (IPO) framework of the BizClear system.*

---

## **Statement of the Problem**

Business permit processing in Dagupan City is currently characterized by manual procedures, fragmented inspection workflows, and limited record security. These conditions result in processing delays, incomplete submissions, difficulty in monitoring compliance, and reduced transparency among involved LGU offices. There is a need for a unified digital system that streamlines permit processing, improves document validation, and ensures the integrity of official records.

Specifically, this study seeks to answer the following questions:

1. How can a digital business permit processing system improve the efficiency and accessibility of permit application and renewal in Dagupan City?
2. How can AI-assisted document validation reduce incomplete submissions and inconsistencies in business permit requirements?
3. How can blockchain technology enhance the integrity, transparency, and accountability of business permit and inspection records?
4. How feasible and acceptable is the proposed BizClear system to business owners and LGU personnel?

Given the system development nature of the study, formal research hypotheses are not applicable.

---

## **Statement of Objectives**

### **General Objective**

The general objective of this study is to design and develop BizClear, a blockchain-enhanced business permit processing and inspection tracking system with AI-assisted document validation for Dagupan City.

### **Specific Objectives**

Specifically, this study aims to:

1. Design a digital platform for business permit application, renewal, and tracking.
2. Develop an AI-assisted mechanism to validate document completeness and detect inconsistencies.
3. Implement a centralized inspection workflow for BPLO, BFP, Sanitary, Zoning, and Engineering offices.
4. Secure permit and inspection records using blockchain technology.
5. Evaluate the feasibility and usability of the BizClear system for LGU personnel and business owners.

### **Expected Measurable Outcomes**

The BizClear system aims to achieve the following measurable improvements:

| Metric | Current Baseline (Estimated) | Target |
|--------|------------------------------|--------|
| Average permit processing time | 15-20 working days | ≤7 working days (RA 11032 compliance) |
| Document rejection/return rate | 30-40% of initial submissions | ≤10% |
| Average office visits per application | 5-8 visits | 1-2 visits (digital submission) |
| Inspection coordination time | 10-14 days across all offices | ≤5 days (coordinated scheduling) |
| Record retrieval time for audits | 30-60 minutes per record | ≤2 minutes |
| Application status visibility | None (manual inquiry required) | Real-time tracking (100% visibility) |
| Applicant satisfaction rating | To be established via baseline survey | ≥4.0 out of 5.0 |

---

## **Significance of the Study**

**Business Owners and Entrepreneurs.** The proposed system will reduce processing time, minimize repeated document submissions, and provide real-time updates on permit and inspection status, improving overall ease of doing business.

**Business Permit and Licensing Office (BPLO).** The BPLO will benefit from a streamlined and centralized workflow that reduces manual workload, improves tracking of applications, and enhances decision-making efficiency.

**Other LGU Offices (BFP, Sanitary, Zoning, Engineering).** These offices will benefit from coordinated digital inspections, shared access to records, and improved compliance monitoring.

**Local Government Unit (LGU) Administrators and Policymakers.** The system will provide reliable data, dashboards, and secure records that support transparent governance and data-driven policy decisions.

**Future Researchers and Developers.** The study will serve as a reference for future research and system development projects involving AI, blockchain, and digital governance.

---

## **Stakeholder Roles and Responsibilities**

The following table outlines the key stakeholders, their roles within the BizClear system, and their specific responsibilities:

| Stakeholder | Role in System | Key Responsibilities |
|-------------|----------------|---------------------|
| **Business Owners/Applicants** | Primary end-users | Submit applications and required documents online; respond to deficiency notices; confirm inspection schedules; track application status; receive digital permits |
| **BPLO Staff** | Application processors | Review and verify submitted applications; coordinate with other offices; manage document requirements; process approvals; generate reports |
| **BPLO Head/Supervisor** | Approving authority | Provide final approval on permits; oversee processing workflows; monitor staff performance; generate compliance reports |
| **BFP Inspector** | Fire safety evaluator | Conduct fire safety inspections; submit digital inspection results; flag violations and require corrective actions |
| **Sanitary Inspector** | Health compliance evaluator | Verify sanitary requirements; conduct health and sanitation inspections; issue digital sanitary clearances |
| **Zoning Officer** | Land use compliance evaluator | Verify zoning compliance based on business location and type; approve or deny based on land use regulations |
| **Engineering Officer** | Structural compliance evaluator | Verify building and structural compliance; conduct inspections for structural safety; submit clearances |
| **City Administrator/Mayor's Office** | Executive oversight | Access dashboards for monitoring LGU-wide permit statistics; use data for policy decisions; ensure regulatory compliance |
| **System Administrator** | Technical support | Manage user accounts and access permissions; maintain system operations; handle technical issues and updates |

---

## **Scope and Limitations**

### **Scope**

This study covers the design and development of a digital business permit processing and inspection tracking system for Dagupan City. The system will cater to business owners and LGU offices involved in permit processing, including BPLO, BFP, Sanitary, Zoning, and Engineering offices. Features include digital application and renewal, AI-assisted document validation, inspection tracking, blockchain-secured records, and monitoring dashboards. The study will be conducted from December 2025 to March 2026.

### **Limitations**

The study will be limited to a pilot implementation within Dagupan City and will not include integration with national government systems. The system will focus on permit processing and inspection tracking and will not automate final approval decisions, which will remain under human authority.

### **Explicit Exclusions**

The following are explicitly outside the scope of this study:

- **National System Integration** – No integration with national government databases (e.g., BIR, SEC, DTI, PhilSys) due to complexity and authorization requirements
- **Payment Processing** – Fee computation and payment collection will continue through existing LGU payment systems; the system will only track payment status
- **Business Closure Processing** – Cessation of business operations and related processes are not included
- **Special Permits** – Specialized permits beyond standard business permits (e.g., environmental compliance certificates, special event permits) are excluded
- **Mobile Application** – The system will be web-based only; native mobile application development is not included
- **Inter-LGU Operations** – Data sharing between different LGUs or permit portability across cities/municipalities is not covered
- **Automated Penalty Computation** – Calculation of fines or penalties for non-compliance will not be automated
- **Legacy Data Migration** – Historical paper records will not be digitized or migrated into the system; only new applications processed through the system will be recorded
- **Third-Party Integrations** – Integration with private sector systems (e.g., banks, private inspection companies) is not included

---

## **Definition of Terms**

* **Artificial Intelligence (AI)** – In this study, AI refers to the system component used to automatically validate document completeness and detect inconsistencies in submitted business permit requirements.
* **Blockchain** – A distributed ledger technology used in the study to store cryptographic hashes of permit and inspection records to ensure data integrity.
* **Business Permit** – An official authorization issued by the LGU allowing a business to operate legally, processed digitally through the BizClear system.
* **Business Permit and Licensing Office (BPLO)** – The LGU office responsible for processing and approving business permits using the proposed system.
* **Document Validation** – The automated checking of submitted documents for completeness and consistency using AI.
* **eBOSS (Electronic Business One-Stop-Shop)** – A digital platform mandated by RA 11032 for streamlined business permit processing.
* **Inspection Log** – A digital record of inspection results from various LGU offices stored and secured by the system.
* **Immutability** – The property of blockchain records that prevents unauthorized modification of stored data.
* **LGU Dashboard** – A system interface that displays real-time permit status, inspection progress, and compliance metrics.
* **Permit Processing Time** – The duration from permit application submission to final approval, measured to evaluate system efficiency.
* **RA 11032** – Republic Act No. 11032, the Ease of Doing Business and Efficient Government Service Delivery Act of 2018.
* **Role-Based Access Control (RBAC)** – A security mechanism that restricts system access based on user roles.
* **Scrum Agile Methodology** – The development approach used in the study to iteratively design and implement the system.
* **Smart Inspection Workflow** – The coordinated digital process of scheduling, conducting, and recording inspections across offices.
* **Tamper-Proof Record** – A record secured using blockchain to prevent undetected modification.
* **Transparency** – The ability of stakeholders to view and verify permit and inspection status in real time.
* **BizClear System** – The proposed blockchain-enhanced business permit processing and inspection tracking platform developed in this study.

---

## **References**

Agyekum, K. O. B., Opoku-Mensah, E., & Botchway, S. Y. (2024). Blockchain-based system for enhancing transparency and accountability in government fund allocation. *Journal of Propulsion Technology*, 45(3), 234-251.

Al-Rawy, M., Sabri, K., & Malik, A. (2024). A survey on blockchain in e-government services: Status and challenges. *arXiv preprint arXiv:2402.02483*. https://arxiv.org/abs/2402.02483

Bedi, J., Sheridan, J., Walker, J., Doyle, C., & Sherlock, S. (2024). AI for bureaucratic productivity: Measuring the potential of AI to help automate 143 million UK government transactions. *arXiv preprint arXiv:2403.14712*. https://arxiv.org/html/2403.14712v1

Boston Consulting Group. (2025, January). How AI can cut through bureaucracy, boost efficiency, and build trust in government. BCG Publications. https://www.bcg.com/publications/2025/benefits-of-ai-in-government

Castañeda, J. A., & Dizon, R. L. (2024). Developing a smart city framework for Philippine LGUs: A policy-driven approach to digital transformation. *International Journal of Social Learning*, 4(3), 345-362. https://www.learning-gate.com/index.php/2576-8484/article/view/8998

Castillo, R. C. (2024). Digital governance in the Philippines: A scoping review of current challenges and opportunities. *Global Scientific and Academic Research Journal of Economics, Business and Management*, 3(2), 45-67. https://www.jescae.com/index.php/gssr/article/view/1204

City Government of Dagupan. (n.d.). Business permit processing. Official Website of the City Government of Dagupan. https://www.dagupan.gov.ph/business-permit-processing/

Department of Information and Communications Technology. (2024, December 1). Over half of LGUs now digitally connected—DICT. *Manila Bulletin*. https://mb.com.ph/2024/12/1/over-half-of-lg-us-now-digitally-connected-dict

Department of the Interior and Local Government. (2023). DILG: Digitalization raises LGUs' revenue collection to P208B. *Philippine News Agency*. https://www.pna.gov.ph/articles/1217536

Digital Watch. (2024). E-Government: Philippine digital transformation. DiploFoundation. https://dig.watch/resource/e-government-philippine-digital-transformation

Enríquez, R., Jiménez-Gómez, C. E., & Salazar-García, J. (2024). Blockchain-based governance models supporting corruption-transparency: A systematic literature review. *High-Confidence Computing*, 4(1), 100147. https://www.sciencedirect.com/science/article/pii/S2096720923000611

Espiritu, J. L., Tandoc, J. P., & Simeon, L. M. (2023). Digital transformation in local government: A case study of Muñoz, Nueva Ecija. *QUEST: Studies on Religion & Culture in Asia*, 8(1), 56-74. https://neust.journalintellect.com/quest/article/view/137

Fresco, R. G. (2022). E-Government initiatives of local governments in the Philippines. *Journal of Community Development Research (Humanities and Social Sciences)*, 15(3), 55-70. https://www.journal.nu.ac.th/JCDR/article/view/Vol-15-No-3-2022-55-70

Niño, J. C. P., & Gentoral, M. R. B. (2024). Compliance with business permits and licensing system requirements: Effects on business performance and satisfaction among MSMEs. *Philippine e-Journal*, 24445. https://ejournals.ph/article.php?id=24445

Philippine News Agency. (2023, October 24). ARTA targets 10-minute processing time for e-BOSS. *Manila Bulletin*. https://mb.com.ph/2024/1/24/arta-targets-10-mins-processing-time-for-e-boss

Reddick, C. G., Zheng, Y., & Puron-Cid, G. (2023). E-government service quality: An analysis of citizen satisfaction and continuance intention. *Government Information Quarterly*, 40(2), 101-115. https://tamucc-ir.tdl.org/

Republic Act No. 11032. (2018). Ease of Doing Business and Efficient Government Service Delivery Act of 2018. Official Gazette of the Republic of the Philippines. https://lawphil.net/statutes/repacts/ra2018/ra_11032_2018.html

Sana, S., Khan, M. S., & Ahmed, W. (2025). Synergizing AI and blockchain: A bibliometric analysis of their potential for transforming e-governance in smart cities. *Frontiers in Sustainable Cities*, 7, 1553816. https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2025.1553816/abstract

Sasaki, D. (2024). Linking e-government development and quality of governance to trust in government: Evidence from OECD member countries. *Transforming Government: People, Process and Policy*, 18(4), 512-528. https://www.ingentaconnect.com/content/mcb/tg/2024/00000018/00000004/art00005

Scholta, H. (2023). Professional development in digital transformation: Organizational factors affecting the implementation of digital learning platforms in public organizations. German University of Administrative Sciences Speyer. https://dl.gi.de/bitstreams/8e04356a-2873-4e7a-ad98-cbfd290caeeb/download

U.S. Government Accountability Office. (2025). Artificial intelligence: Generative AI use and management at federal agencies (GAO-25-107653). https://www.gao.gov/products/gao-25-107653

United Nations. (2024). United Nations E-Government Survey 2024. United Nations Department of Economic and Social Affairs. https://www.un-ilibrary.org/content/books/9789211067286

UK Department for Science, Innovation and Technology. (2023). Advai: Advanced evaluation of AI-powered identity verification systems. GOV.UK. https://www.gov.uk/ai-assurance-techniques/advai-advanced-evaluation-of-ai-powered-identity-verification-systems
