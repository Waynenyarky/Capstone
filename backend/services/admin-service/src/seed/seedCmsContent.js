/**
 * Seed CMS content (FAQ sections + Instruction slots) for development/testing.
 *
 * Idempotent: inserts only when collections are empty.
 * Run when SEED_CMS=true or SEED_DEV=true.
 */

const FaqSection = require("../models/FaqSection");
const InstructionContent = require("../models/InstructionContent");
const PageContent = require("../models/PageContent");
const logger = require("../lib/logger");

async function seedCmsContentIfEmpty() {
  const enabled =
    process.env.SEED_CMS === "true" || process.env.SEED_DEV === "true";
  if (!enabled) {
    return { seeded: false, reason: "SEED_CMS or SEED_DEV not set" };
  }

  const results = { faq: null, instructions: null };

  // ─── FAQ Sections ───────────────────────────────────────────────────────────
  try {
    const existingFaq = await FaqSection.countDocuments();
    if (existingFaq > 0) {
      results.faq = {
        seeded: false,
        reason: "already has FAQ sections",
        count: existingFaq,
      };
    } else {
      const faqEntries = [
        {
          slotId: "landing-page-faq",
          title: "Frequently Asked Questions",
          subtitle:
            "Quick answers about application timelines, updates, and submission best practices.",
          items: [
            {
              key: "faq-1",
              question: "How long does permit processing usually take?",
              answer:
                "Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.",
            },
            {
              key: "faq-2",
              question:
                "Can I submit my application even if one document is pending?",
              answer:
                "You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.",
            },
            {
              key: "faq-3",
              question: "How will I know if my permit status changes?",
              answer:
                "Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.",
            },
            {
              key: "faq-4",
              question:
                "What should I do if my application is returned for correction?",
              answer:
                "Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.",
            },
          ],
          isPublished: true,
          draftData: {
            subtitle:
              "Quick answers about application timelines, updates, and submission best practices.",
            items: [
              {
                key: "faq-1",
                question: "How long does permit processing usually take?",
                answer:
                  "Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.",
              },
              {
                key: "faq-2",
                question:
                  "Can I submit my application even if one document is pending?",
                answer:
                  "You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.",
              },
              {
                key: "faq-3",
                question: "How will I know if my permit status changes?",
                answer:
                  "Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.",
              },
              {
                key: "faq-4",
                question:
                  "What should I do if my application is returned for correction?",
                answer:
                  "Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.",
              },
            ],
          },
          publishedData: {
            subtitle:
              "Quick answers about application timelines, updates, and submission best practices.",
            items: [
              {
                key: "faq-1",
                question: "How long does permit processing usually take?",
                answer:
                  "Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.",
              },
              {
                key: "faq-2",
                question:
                  "Can I submit my application even if one document is pending?",
                answer:
                  "You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.",
              },
              {
                key: "faq-3",
                question: "How will I know if my permit status changes?",
                answer:
                  "Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.",
              },
              {
                key: "faq-4",
                question:
                  "What should I do if my application is returned for correction?",
                answer:
                  "Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.",
              },
            ],
          },
        },
      ];

      await FaqSection.insertMany(faqEntries);
      logger.info("CMS FAQ sections seeded", { created: faqEntries.length });
      results.faq = { seeded: true, created: faqEntries.length };
    }
  } catch (err) {
    logger.warn("Seed CMS FAQ failed", { error: err.message });
    results.faq = { seeded: false, error: err.message };
  }

  // ─── Instruction Content ────────────────────────────────────────────────────
  try {
    const existingInstructions = await InstructionContent.countDocuments();
    if (existingInstructions > 0) {
      results.instructions = {
        seeded: false,
        reason: "already has instruction content",
        count: existingInstructions,
      };
    } else {
      const instructionEntries = [
        {
          slotId: "maintenance-info",
          description:
            "When maintenance mode is on, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.",
          bulletPoints: [
            {
              title: "Current status",
              content:
                "See whether maintenance mode is on or off and the active message (if any).",
            },
            {
              title: "Enable / disable",
              content:
                "Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.",
            },
            {
              title: "Pending requests",
              content:
                "View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.",
            },
          ],
          faqItems: [
            {
              key: "1",
              question: "Who can turn maintenance mode on or off?",
              answer:
                "Only admins with appropriate permissions can enable or disable maintenance mode. Depending on your organization's settings, this may require approval from another admin.",
            },
            {
              key: "2",
              question: "What happens when maintenance mode is on?",
              answer:
                "When maintenance mode is active, non-admin users will see a maintenance page instead of the main application. They cannot access any features until maintenance is turned off.",
            },
            {
              key: "3",
              question: "Can I customize the maintenance message?",
              answer:
                "Yes, you can set a custom message that will be displayed to users during maintenance. This is useful for communicating expected downtime or reasons for maintenance.",
            },
          ],
          isPublished: true,
          draftData: {
            description:
              "When maintenance mode is on, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.",
            bulletPoints: [
              {
                title: "Current status",
                content:
                  "See whether maintenance mode is on or off and the active message (if any).",
              },
              {
                title: "Enable / disable",
                content:
                  "Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.",
              },
              {
                title: "Pending requests",
                content:
                  "View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.",
              },
            ],
            faqItems: [
              {
                key: "1",
                question: "Who can turn maintenance mode on or off?",
                answer:
                  "Only admins with appropriate permissions can enable or disable maintenance mode. Depending on your organization's settings, this may require approval from another admin.",
              },
              {
                key: "2",
                question: "What happens when maintenance mode is on?",
                answer:
                  "When maintenance mode is active, non-admin users will see a maintenance page instead of the main application. They cannot access any features until maintenance is turned off.",
              },
              {
                key: "3",
                question: "Can I customize the maintenance message?",
                answer:
                  "Yes, you can set a custom message that will be displayed to users during maintenance. This is useful for communicating expected downtime or reasons for maintenance.",
              },
            ],
          },
          publishedData: {
            description:
              "When maintenance mode is on, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.",
            bulletPoints: [
              {
                title: "Current status",
                content:
                  "See whether maintenance mode is on or off and the active message (if any).",
              },
              {
                title: "Enable / disable",
                content:
                  "Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.",
              },
              {
                title: "Pending requests",
                content:
                  "View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.",
              },
            ],
            faqItems: [
              {
                key: "1",
                question: "Who can turn maintenance mode on or off?",
                answer:
                  "Only admins with appropriate permissions can enable or disable maintenance mode. Depending on your organization's settings, this may require approval from another admin.",
              },
              {
                key: "2",
                question: "What happens when maintenance mode is on?",
                answer:
                  "When maintenance mode is active, non-admin users will see a maintenance page instead of the main application. They cannot access any features until maintenance is turned off.",
              },
              {
                key: "3",
                question: "Can I customize the maintenance message?",
                answer:
                  "Yes, you can set a custom message that will be displayed to users during maintenance. This is useful for communicating expected downtime or reasons for maintenance.",
              },
            ],
          },
        },
      ];

      await InstructionContent.insertMany(instructionEntries);
      logger.info("CMS instruction content seeded", {
        created: instructionEntries.length,
      });
      results.instructions = {
        seeded: true,
        created: instructionEntries.length,
      };
    }
  } catch (err) {
    logger.warn("Seed CMS instructions failed", { error: err.message });
    results.instructions = { seeded: false, error: err.message };
  }

  // ─── Page Content ─────────────────────────────────────────────────────────
  try {
    const existingPages = await PageContent.countDocuments();
    if (existingPages > 0) {
      results.pages = {
        seeded: false,
        reason: "already has page content",
        count: existingPages,
      };
    } else {
      const pageData = {
        introText: "",
        sections: [],
      };

      const privacyPolicySections = [
        {
          key: "pp-1",
          title: "1. Information we collect",
          body: "We collect data needed to process your business permits:\n\n• Personal: Name, email, phone, TIN.\n• Business: Trade name, address, capitalization, gross sales, employee count.\n• Documents: DTI/SEC registration, Barangay Clearance, lease contracts, Fire Safety Certificates.",
        },
        {
          key: "pp-2",
          title: "2. Purpose of data collection",
          body: "Your data is used for: processing and evaluating permit applications; calculating taxes and fees; verifying documents with BFP, CHO, CEO; and sending status and deadline notifications.",
        },
        {
          key: "pp-3",
          title: "3. Data sharing & disclosure",
          body: "We do not sell your data. We may share it with:\n\n• Internal LGU departments (Treasurer, Planning, Zoning) for clearance.\n• National agencies (BFP, DTI/SEC) for verification.\n• Courts or law enforcement when required by law.",
        },
        {
          key: "pp-4",
          title: "4. Security measures",
          body: "We use SSL/TLS for data in transit, encrypt sensitive data at rest, restrict access by role (RBAC), and maintain audit logs of access and changes.",
        },
        {
          key: "pp-5",
          title: "5. Your rights",
          body: "You may request access, correction, or erasure of your data (subject to record-keeping laws). You may file a complaint with the National Privacy Commission.",
        },
      ];

      const termsSections = [
        {
          key: "tos-1",
          title: "1. User responsibilities",
          body: "You agree to provide accurate information, keep your account secure, and use the system only for lawful business registration.\n\nNote: Submitting false documents or statements is a criminal offense under the Revised Penal Code and may result in permit revocation.",
        },
        {
          key: "tos-2",
          title: "2. Digital submissions",
          body: "Electronic submissions and e-signatures have the same legal effect as written signatures under the Electronic Commerce Act of 2000 (Republic Act No. 8792).",
        },
        {
          key: "tos-3",
          title: "3. Prohibited activities",
          body: "You may not: gain unauthorized access to the system or other accounts; use bots or scrapers; disrupt the system; or harass LGU staff or other users.",
        },
        {
          key: "tos-4",
          title: "4. Service availability",
          body: "We aim for high uptime but do not guarantee uninterrupted access. We are not liable for maintenance delays, user or connectivity errors, or delays from incomplete submissions or external verification.",
        },
        {
          key: "tos-5",
          title: "5. Intellectual property",
          body: "Content in the BizClear Portal is property of the City Government of Alaminos. Unauthorized reproduction or redistribution is prohibited.",
        },
        {
          key: "tos-6",
          title: "6. Termination",
          body: "The City Government may suspend or terminate your account without prior notice for violation of these terms or illegal business activity.",
        },
      ];

      const manualSections = [
        {
          key: "man-1",
          title: "1. Overview",
          body: "The BizClear Portal is the online business permit and licensing system of the City Government of Alaminos. It allows business owners to apply for new permits, renew existing ones, track application progress, and manage compliance requirements — all from a single digital platform.",
        },
        {
          key: "man-2",
          title: "2. Creating an account",
          body: 'Visit the portal and click "Sign Up". Provide your full name, valid email address, and a strong password. Complete multi-factor authentication (MFA) setup for account security. Once verified, you can begin your first application.',
        },
        {
          key: "man-3",
          title: "3. New business permit application",
          body: "Requirements for new applications:\n\n• DTI/SEC/CDA Certificate of Registration\n• Barangay Business Clearance\n• Contract of Lease or Land Title\n• Government-issued ID\n• Community Tax Certificate (Cedula)\n\nFill in the application form with accurate business details, upload required documents, and submit for review.",
        },
        {
          key: "man-4",
          title: "4. Renewal of business permit",
          body: "Renewal is available annually for existing permitted businesses. You will need:\n\n• Previous year's business permit\n• Updated Barangay Business Clearance\n• Fire Safety Inspection Certificate (FSIC)\n• Sanitary Permit (if applicable)\n• Updated Community Tax Certificate\n\nThe system will pre-fill your information from previous filings.",
        },
        {
          key: "man-5",
          title: "5. Tracking your application",
          body: "After submission, use the Application Tracker to monitor progress. Your application will move through stages: Submitted → Under Review → Clearances → Payment → Approved. You will receive notifications for each status change.",
        },
        {
          key: "man-6",
          title: "6. Payments",
          body: "Once your application passes review and clearances, fees are computed and posted to your account. Pay through the available payment channels (online or over the counter). Upload proof of payment or use the integrated payment gateway.",
        },
        {
          key: "man-7",
          title: "7. Inspections",
          body: "Some applications require on-site inspections by city departments (Fire, Sanitary, Zoning). Inspection schedules will appear in your notifications. Ensure your business premises are accessible during the scheduled window.",
        },
        {
          key: "man-8",
          title: "8. Post-permit requirements",
          body: "After receiving your permit, maintain compliance with ongoing requirements such as annual renewal, reporting changes in business information, and responding to post-requirement notices from the BPLO.",
        },
      ];

      const pageEntries = [
        {
          slotId: "privacy-policy",
          title: "Privacy Policy",
          introText:
            "The City Government of Alaminos processes your data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173). This policy describes how the BizClear Portal collects, uses, and protects your information.",
          sections: privacyPolicySections,
          isPublished: true,
          draftData: {
            ...pageData,
            introText:
              "The City Government of Alaminos processes your data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173). This policy describes how the BizClear Portal collects, uses, and protects your information.",
            sections: privacyPolicySections,
          },
          publishedData: {
            ...pageData,
            introText:
              "The City Government of Alaminos processes your data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173). This policy describes how the BizClear Portal collects, uses, and protects your information.",
            sections: privacyPolicySections,
          },
        },
        {
          slotId: "terms-of-service",
          title: "Terms of Service",
          introText:
            "By using the BizClear Portal you agree to these terms. These terms govern your use of the online business permit system provided by the City Government of Alaminos.",
          sections: termsSections,
          isPublished: true,
          draftData: {
            ...pageData,
            introText:
              "By using the BizClear Portal you agree to these terms. These terms govern your use of the online business permit system provided by the City Government of Alaminos.",
            sections: termsSections,
          },
          publishedData: {
            ...pageData,
            introText:
              "By using the BizClear Portal you agree to these terms. These terms govern your use of the online business permit system provided by the City Government of Alaminos.",
            sections: termsSections,
          },
        },
        {
          slotId: "bizclear-manual",
          title: "BizClear Manual",
          introText:
            "Welcome to the BizClear Portal user guide. This manual covers everything you need to know about applying for, renewing, and managing your business permits with the City Government of Alaminos.",
          sections: manualSections,
          isPublished: true,
          draftData: {
            ...pageData,
            introText:
              "Welcome to the BizClear Portal user guide. This manual covers everything you need to know about applying for, renewing, and managing your business permits with the City Government of Alaminos.",
            sections: manualSections,
          },
          publishedData: {
            ...pageData,
            introText:
              "Welcome to the BizClear Portal user guide. This manual covers everything you need to know about applying for, renewing, and managing your business permits with the City Government of Alaminos.",
            sections: manualSections,
          },
        },
      ];

      await PageContent.insertMany(pageEntries);
      logger.info("CMS page content seeded", { created: pageEntries.length });
      results.pages = { seeded: true, created: pageEntries.length };
    }
  } catch (err) {
    logger.warn("Seed CMS pages failed", { error: err.message });
    results.pages = { seeded: false, error: err.message };
  }

  return results;
}

module.exports = { seedCmsContentIfEmpty };
