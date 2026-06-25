/**
 * Seed CMS content (FAQ sections + Instruction slots) for development/testing.
 *
 * Idempotent: inserts only when collections are empty.
 * Run when SEED_CMS=true or SEED_DEV=true.
 */

const FaqSection = require("../models/FaqSection");
const InstructionContent = require("../models/InstructionContent");
const PageContent = require("../models/PageContent");
const PageChapter = require("../models/PageChapter");
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
        {
          slotId: "business-owner-application-faq",
          title: "Frequently Asked Questions",
          subtitle: "",
          items: [
            {
              key: "faq-1",
              question: "I already have an existing business permit. Do I need to apply again?",
              answer: "If you're renewing an existing permit, use the renewal process instead. This application is for new business permits only. Manual permit holders can transition to the online system for renewals and future transactions. First-time online users can create an account using their existing permit details to access renewal features. Existing online users should continue using the renewal process when their permit expires. New businesses should use this application for first-time business permits.",
            },
            {
              key: "faq-2",
              question: "What if I need to make changes to my submitted application?",
              answer: "You can edit your application until it's approved. If changes are requested during review, you'll receive notifications and can update the required sections directly from your dashboard.",
            },
            {
              key: "faq-3",
              question: "Can I apply for multiple business types or locations?",
              answer: "Yes, you can submit separate applications for each business type or location. Each application is processed independently and will have its own permit number.",
            },
            {
              key: "faq-4",
              question: "What happens if my application is rejected?",
              answer: "You'll receive specific reasons for rejection and can resubmit with corrections. There's no additional fee for resubmission within 30 days of the original rejection.",
            },
            {
              key: "faq-5",
              question: "How do I pay fees after approval?",
              answer: "Once approved, you'll receive payment instructions with multiple options: online payment, bank deposit, or in-person payment at City Hall. Payment must be completed within 15 days of approval.",
            },
            {
              key: "faq-6",
              question: "What documents do I need for different business types?",
              answer: "Requirements vary by business type. All businesses need DTI/SEC, Barangay Clearance, and valid IDs. Retail/Service businesses need a lease contract or title. Food service requires a health permit and sanitary permit. Manufacturing requires environmental compliance and fire safety. Educational institutions need DepEd/CHED permits and fire safety.",
            },
            {
              key: "faq-7",
              question: "How long does the application process take?",
              answer: "Standard processing is 3-5 business days. Complex businesses may take 7-10 days. You'll receive updates at each stage of the review process.",
            },
            {
              key: "faq-8",
              question: "Can I save my progress and return later?",
              answer: "Yes! Use \"Save as Draft\" anytime. Your application is saved for 30 days. You'll receive reminder emails if you haven't completed your application.",
            },
            {
              key: "faq-9",
              question: "What if I need to change my business address or type?",
              answer: "For address changes, submit a location update request. For business type changes, you may need a new permit if the change affects regulatory requirements. Contact the Business Permit Office for specific guidance.",
            },
            {
              key: "faq-10",
              question: "How do I close or transfer my business?",
              answer: "Business closure or transfer requires formal processing. For closure, submit retirement notice and clear all outstanding fees. For transfer, the new owner must apply for permit transfer with proper documentation. Requirements include clearance from Treasurer, final inspection, and tax clearance.",
            },
            {
              key: "faq-11",
              question: "What if my permit has already expired?",
              answer: "Expired permits require reapplication rather than renewal. You may need to pay penalties and undergo fresh inspection. Contact the Business Permit Office immediately to discuss your specific situation.",
            },
            {
              key: "faq-12",
              question: "What happens after my permit is approved?",
              answer: "Post-approval requirements include paying required fees within 15 days, displaying the permit prominently at your business location, preparing for routine compliance inspections, and renewing annually before expiration.",
            },
          ],
          isPublished: true,
          draftData: {
            subtitle: "",
            items: [
              {
                key: "faq-1",
                question: "I already have an existing business permit. Do I need to apply again?",
                answer: "If you're renewing an existing permit, use the renewal process instead. This application is for new business permits only. Manual permit holders can transition to the online system for renewals and future transactions. First-time online users can create an account using their existing permit details to access renewal features. Existing online users should continue using the renewal process when their permit expires. New businesses should use this application for first-time business permits.",
              },
              {
                key: "faq-2",
                question: "What if I need to make changes to my submitted application?",
                answer: "You can edit your application until it's approved. If changes are requested during review, you'll receive notifications and can update the required sections directly from your dashboard.",
              },
              {
                key: "faq-3",
                question: "Can I apply for multiple business types or locations?",
                answer: "Yes, you can submit separate applications for each business type or location. Each application is processed independently and will have its own permit number.",
              },
              {
                key: "faq-4",
                question: "What happens if my application is rejected?",
                answer: "You'll receive specific reasons for rejection and can resubmit with corrections. There's no additional fee for resubmission within 30 days of the original rejection.",
              },
              {
                key: "faq-5",
                question: "How do I pay fees after approval?",
                answer: "Once approved, you'll receive payment instructions with multiple options: online payment, bank deposit, or in-person payment at City Hall. Payment must be completed within 15 days of approval.",
              },
              {
                key: "faq-6",
                question: "What documents do I need for different business types?",
                answer: "Requirements vary by business type. All businesses need DTI/SEC, Barangay Clearance, and valid IDs. Retail/Service businesses need a lease contract or title. Food service requires a health permit and sanitary permit. Manufacturing requires environmental compliance and fire safety. Educational institutions need DepEd/CHED permits and fire safety.",
              },
              {
                key: "faq-7",
                question: "How long does the application process take?",
                answer: "Standard processing is 3-5 business days. Complex businesses may take 7-10 days. You'll receive updates at each stage of the review process.",
              },
              {
                key: "faq-8",
                question: "Can I save my progress and return later?",
                answer: "Yes! Use \"Save as Draft\" anytime. Your application is saved for 30 days. You'll receive reminder emails if you haven't completed your application.",
              },
              {
                key: "faq-9",
                question: "What if I need to change my business address or type?",
                answer: "For address changes, submit a location update request. For business type changes, you may need a new permit if the change affects regulatory requirements. Contact the Business Permit Office for specific guidance.",
              },
              {
                key: "faq-10",
                question: "How do I close or transfer my business?",
                answer: "Business closure or transfer requires formal processing. For closure, submit retirement notice and clear all outstanding fees. For transfer, the new owner must apply for permit transfer with proper documentation. Requirements include clearance from Treasurer, final inspection, and tax clearance.",
              },
              {
                key: "faq-11",
                question: "What if my permit has already expired?",
                answer: "Expired permits require reapplication rather than renewal. You may need to pay penalties and undergo fresh inspection. Contact the Business Permit Office immediately to discuss your specific situation.",
              },
              {
                key: "faq-12",
                question: "What happens after my permit is approved?",
                answer: "Post-approval requirements include paying required fees within 15 days, displaying the permit prominently at your business location, preparing for routine compliance inspections, and renewing annually before expiration.",
              },
            ],
          },
          publishedData: {
            subtitle: "",
            items: [
              {
                key: "faq-1",
                question: "I already have an existing business permit. Do I need to apply again?",
                answer: "If you're renewing an existing permit, use the renewal process instead. This application is for new business permits only. Manual permit holders can transition to the online system for renewals and future transactions. First-time online users can create an account using their existing permit details to access renewal features. Existing online users should continue using the renewal process when their permit expires. New businesses should use this application for first-time business permits.",
              },
              {
                key: "faq-2",
                question: "What if I need to make changes to my submitted application?",
                answer: "You can edit your application until it's approved. If changes are requested during review, you'll receive notifications and can update the required sections directly from your dashboard.",
              },
              {
                key: "faq-3",
                question: "Can I apply for multiple business types or locations?",
                answer: "Yes, you can submit separate applications for each business type or location. Each application is processed independently and will have its own permit number.",
              },
              {
                key: "faq-4",
                question: "What happens if my application is rejected?",
                answer: "You'll receive specific reasons for rejection and can resubmit with corrections. There's no additional fee for resubmission within 30 days of the original rejection.",
              },
              {
                key: "faq-5",
                question: "How do I pay fees after approval?",
                answer: "Once approved, you'll receive payment instructions with multiple options: online payment, bank deposit, or in-person payment at City Hall. Payment must be completed within 15 days of approval.",
              },
              {
                key: "faq-6",
                question: "What documents do I need for different business types?",
                answer: "Requirements vary by business type. All businesses need DTI/SEC, Barangay Clearance, and valid IDs. Retail/Service businesses need a lease contract or title. Food service requires a health permit and sanitary permit. Manufacturing requires environmental compliance and fire safety. Educational institutions need DepEd/CHED permits and fire safety.",
              },
              {
                key: "faq-7",
                question: "How long does the application process take?",
                answer: "Standard processing is 3-5 business days. Complex businesses may take 7-10 days. You'll receive updates at each stage of the review process.",
              },
              {
                key: "faq-8",
                question: "Can I save my progress and return later?",
                answer: "Yes! Use \"Save as Draft\" anytime. Your application is saved for 30 days. You'll receive reminder emails if you haven't completed your application.",
              },
              {
                key: "faq-9",
                question: "What if I need to change my business address or type?",
                answer: "For address changes, submit a location update request. For business type changes, you may need a new permit if the change affects regulatory requirements. Contact the Business Permit Office for specific guidance.",
              },
              {
                key: "faq-10",
                question: "How do I close or transfer my business?",
                answer: "Business closure or transfer requires formal processing. For closure, submit retirement notice and clear all outstanding fees. For transfer, the new owner must apply for permit transfer with proper documentation. Requirements include clearance from Treasurer, final inspection, and tax clearance.",
              },
              {
                key: "faq-11",
                question: "What if my permit has already expired?",
                answer: "Expired permits require reapplication rather than renewal. You may need to pay penalties and undergo fresh inspection. Contact the Business Permit Office immediately to discuss your specific situation.",
              },
              {
                key: "faq-12",
                question: "What happens after my permit is approved?",
                answer: "Post-approval requirements include paying required fees within 15 days, displaying the permit prominently at your business location, preparing for routine compliance inspections, and renewing annually before expiration.",
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
    const existingSlotIds = (await InstructionContent.find().select('slotId').lean()).map(doc => doc.slotId);
    
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
        {
          slotId: "help-request-info",
          description:
            "Help Requests allow business owners to submit questions, issues, or support requests directly to LGU officers. Officers can claim, respond to, and track these requests through a conversation interface. Internal notes are visible only to officers.",
          bulletPoints: [
            {
              title: "Claim requests",
              content:
                "Click 'Claim Request' to take ownership of a help request. Only you can respond and update the status while claimed. Release it when done so other officers can handle it.",
            },
            {
              title: "Respond to requester",
              content:
                "Use the conversation panel to send replies. The business owner receives email notifications for your responses. Attachments can be included if needed.",
            },
            {
              title: "Update status",
              content:
                "Change the request status to reflect progress: Open, In Progress, Needs Response, Waiting for Owner, Closed, or Invalid. Terminal statuses (Closed, Invalid) can be reopened within 24 hours.",
            },
            {
              title: "Set priority",
              content:
                "Mark requests as Low, Normal, or High priority to help triage urgent issues. High priority requests get faster response times.",
            },
            {
              title: "Internal notes",
              content:
                "Add internal notes visible only to officers. Use these for coordination, context sharing, or sensitive information that shouldn't be shared with the requester.",
            },
            {
              title: "View history",
              content:
                "Click the History button to see the full audit trail of status changes, priority updates, claim/release actions, and other modifications.",
            },
          ],
          faqItems: [
            {
              key: "1",
              question: "What happens when I claim a request?",
              answer:
                "Claiming assigns the request to you. Only you can respond and change its status while claimed. Other officers see it as 'Claimed by: [your name]' and can override if necessary.",
            },
            {
              key: "2",
              question: "Can I release a request I've claimed?",
              answer:
                "Yes, click 'Release Request' to return it to the unclaimed pool. This allows other officers to pick it up. You cannot release closed or invalid requests.",
            },
            {
              key: "3",
              question: "What's the difference between status options?",
              answer:
                "Open: New request awaiting action. In Progress: Actively being worked on. Needs Response: Waiting for business owner to respond. Waiting for Owner: Waiting for business owner action. Closed: Resolved and completed. Invalid: Not a valid request.",
            },
            {
              key: "4",
              question: "Can I reopen a closed request?",
              answer:
                "Yes, you can reopen closed or invalid requests within 24 hours of the status change. After 24 hours, the status becomes permanent and cannot be changed.",
            },
            {
              key: "5",
              question: "Do business owners see internal notes?",
              answer:
                "No, internal notes are visible only to LGU officers. Use them for coordination, context sharing, or sensitive information that shouldn't be shared with the requester.",
            },
          ],
          isPublished: true,
          draftData: {
            description:
              "Help Requests allow business owners to submit questions, issues, or support requests directly to LGU officers. Officers can claim, respond to, and track these requests through a conversation interface. Internal notes are visible only to officers.",
            bulletPoints: [
              {
                title: "Claim requests",
                content:
                  "Click 'Claim Request' to take ownership of a help request. Only you can respond and update the status while claimed. Release it when done so other officers can handle it.",
              },
              {
                title: "Respond to requester",
                content:
                  "Use the conversation panel to send replies. The business owner receives email notifications for your responses. Attachments can be included if needed.",
              },
              {
                title: "Update status",
                content:
                  "Change the request status to reflect progress: Open, In Progress, Needs Response, Waiting for Owner, Closed, or Invalid. Terminal statuses (Closed, Invalid) can be reopened within 24 hours.",
              },
              {
                title: "Set priority",
                content:
                  "Mark requests as Low, Normal, or High priority to help triage urgent issues. High priority requests get faster response times.",
              },
              {
                title: "Internal notes",
                content:
                  "Add internal notes visible only to officers. Use these for coordination, context sharing, or sensitive information that shouldn't be shared with the requester.",
              },
              {
                title: "View history",
                content:
                  "Click the History button to see the full audit trail of status changes, priority updates, claim/release actions, and other modifications.",
              },
            ],
            faqItems: [
              {
                key: "1",
                question: "What happens when I claim a request?",
                answer:
                  "Claiming assigns the request to you. Only you can respond and change its status while claimed. Other officers see it as 'Claimed by: [your name]' and can override if necessary.",
              },
              {
                key: "2",
                question: "Can I release a request I've claimed?",
                answer:
                  "Yes, click 'Release Request' to return it to the unclaimed pool. This allows other officers to pick it up. You cannot release closed or invalid requests.",
              },
              {
                key: "3",
                question: "What's the difference between status options?",
                answer:
                  "Open: New request awaiting action. In Progress: Actively being worked on. Needs Response: Waiting for business owner to respond. Waiting for Owner: Waiting for business owner action. Closed: Resolved and completed. Invalid: Not a valid request.",
              },
              {
                key: "4",
                question: "Can I reopen a closed request?",
                answer:
                  "Yes, you can reopen closed or invalid requests within 24 hours of the status change. After 24 hours, the status becomes permanent and cannot be changed.",
              },
              {
                key: "5",
                question: "Do business owners see internal notes?",
                answer:
                  "No, internal notes are visible only to LGU officers. Use them for coordination, context sharing, or sensitive information that shouldn't be shared with the requester.",
              },
            ],
          },
          publishedData: {
            description:
              "Help Requests allow business owners to submit questions, issues, or support requests directly to LGU officers. Officers can claim, respond to, and track these requests through a conversation interface. Internal notes are visible only to officers.",
            bulletPoints: [
              {
                title: "Claim requests",
                content:
                  "Click 'Claim Request' to take ownership of a help request. Only you can respond and update the status while claimed. Release it when done so other officers can handle it.",
              },
              {
                title: "Respond to requester",
                content:
                  "Use the conversation panel to send replies. The business owner receives email notifications for your responses. Attachments can be included if needed.",
              },
              {
                title: "Update status",
                content:
                  "Change the request status to reflect progress: Open, In Progress, Needs Response, Waiting for Owner, Closed, or Invalid. Terminal statuses (Closed, Invalid) can be reopened within 24 hours.",
              },
              {
                title: "Set priority",
                content:
                  "Mark requests as Low, Normal, or High priority to help triage urgent issues. High priority requests get faster response times.",
              },
              {
                title: "Internal notes",
                content:
                  "Add internal notes visible only to officers. Use these for coordination, context sharing, or sensitive information that shouldn't be shared with the requester.",
              },
              {
                title: "View history",
                content:
                  "Click the History button to see the full audit trail of status changes, priority updates, claim/release actions, and other modifications.",
              },
            ],
            faqItems: [
              {
                key: "1",
                question: "What happens when I claim a request?",
                answer:
                  "Claiming assigns the request to you. Only you can respond and change its status while claimed. Other officers see it as 'Claimed by: [your name]' and can override if necessary.",
              },
              {
                key: "2",
                question: "Can I release a request I've claimed?",
                answer:
                  "Yes, click 'Release Request' to return it to the unclaimed pool. This allows other officers to pick it up. You cannot release closed or invalid requests.",
              },
              {
                key: "3",
                question: "What's the difference between status options?",
                answer:
                  "Open: New request awaiting action. In Progress: Actively being worked on. Needs Response: Waiting for business owner to respond. Waiting for Owner: Waiting for business owner action. Closed: Resolved and completed. Invalid: Not a valid request.",
              },
              {
                key: "4",
                question: "Can I reopen a closed request?",
                answer:
                  "Yes, you can reopen closed or invalid requests within 24 hours of the status change. After 24 hours, the status becomes permanent and cannot be changed.",
              },
              {
                key: "5",
                question: "Do business owners see internal notes?",
                answer:
                  "No, internal notes are visible only to LGU officers. Use them for coordination, context sharing, or sensitive information that shouldn't be shared with the requester.",
              },
            ],
          },
        },
        {
          slotId: "lgu-officer-application-review",
          description:
            "Application Review allows LGU officers to review and approve or reject business permit applications. Officers can review form sections, request corrections, approve applications, and generate payment instructions.",
          bulletPoints: [
            {
              title: "Claim applications",
              content:
                "Click 'Claim Application' to take ownership of an application. Only you can review and make decisions while claimed. Release it when done so other officers can handle it.",
            },
            {
              title: "Review form sections",
              content:
                "Navigate through the application form sections using the left sidebar. Review each field for completeness, accuracy, and compliance with requirements.",
            },
            {
              title: "Make field decisions",
              content:
                "For each field, you can Approve (no issues), Reject (needs correction), or Request Change (minor issue). Add comments explaining your decision for the business owner.",
            },
            {
              title: "Submit review decision",
              content:
                "After reviewing all fields, submit your final decision: Approve (issue permit), Reject (deny permit), or Needs Revision (request corrections). The business owner will be notified.",
            },
            {
              title: "Generate payments",
              content:
                "When an application is approved, you can generate payment instructions. The system calculates fees based on business type, capitalization, and other factors.",
            },
            {
              title: "View history",
              content:
                "Click the History button to see the full audit trail of status changes, review decisions, claim/release actions, and other modifications.",
            },
          ],
          faqItems: [
            {
              key: "1",
              question: "What happens when I claim an application?",
              answer:
                "Claiming assigns the application to you. Only you can review and make decisions while claimed. Other officers see it as 'Claimed by: [your name]' and can override if necessary.",
            },
            {
              key: "2",
              question: "Can I release an application I've claimed?",
              answer:
                "Yes, click 'Release Application' to return it to the unclaimed pool. This allows other officers to pick it up. You cannot release approved or rejected applications.",
            },
            {
              key: "3",
              question: "What's the difference between Approve, Reject, and Needs Revision?",
              answer:
                "Approve: Application meets all requirements, permit will be issued. Reject: Application fails requirements, permit denied. Needs Revision: Application has correctable issues, business owner must fix and resubmit.",
            },
            {
              key: "4",
              question: "When should I reject vs. request revision?",
              answer:
                "Reject for fundamental issues (missing documents, ineligible business type, violations). Request revision for correctable issues (typos, missing signatures, unclear information).",
            },
            {
              key: "5",
              question: "How are fees calculated?",
              answer:
                "Fees are automatically calculated based on business type, capitalization, gross sales, and local tax ordinances. The system applies the correct fee schedule based on the application data.",
            },
          ],
          isPublished: true,
          draftData: {
            description:
              "Application Review allows LGU officers to review and approve or reject business permit applications. Officers can review form sections, request corrections, approve applications, and generate payment instructions.",
            bulletPoints: [
              {
                title: "Claim applications",
                content:
                  "Click 'Claim Application' to take ownership of an application. Only you can review and make decisions while claimed. Release it when done so other officers can handle it.",
              },
              {
                title: "Review form sections",
                content:
                  "Navigate through the application form sections using the left sidebar. Review each field for completeness, accuracy, and compliance with requirements.",
              },
              {
                title: "Make field decisions",
                content:
                  "For each field, you can Approve (no issues), Reject (needs correction), or Request Change (minor issue). Add comments explaining your decision for the business owner.",
              },
              {
                title: "Submit review decision",
                content:
                  "After reviewing all fields, submit your final decision: Approve (issue permit), Reject (deny permit), or Needs Revision (request corrections). The business owner will be notified.",
              },
              {
                title: "Generate payments",
                content:
                  "When an application is approved, you can generate payment instructions. The system calculates fees based on business type, capitalization, and other factors.",
              },
              {
                title: "View history",
                content:
                  "Click the History button to see the full audit trail of status changes, review decisions, claim/release actions, and other modifications.",
              },
            ],
            faqItems: [
              {
                key: "1",
                question: "What happens when I claim an application?",
                answer:
                  "Claiming assigns the application to you. Only you can review and make decisions while claimed. Other officers see it as 'Claimed by: [your name]' and can override if necessary.",
              },
              {
                key: "2",
                question: "Can I release an application I've claimed?",
                answer:
                  "Yes, click 'Release Application' to return it to the unclaimed pool. This allows other officers to pick it up. You cannot release approved or rejected applications.",
              },
              {
                key: "3",
                question: "What's the difference between Approve, Reject, and Needs Revision?",
                answer:
                  "Approve: Application meets all requirements, permit will be issued. Reject: Application fails requirements, permit denied. Needs Revision: Application has correctable issues, business owner must fix and resubmit.",
              },
              {
                key: "4",
                question: "When should I reject vs. request revision?",
                answer:
                  "Reject for fundamental issues (missing documents, ineligible business type, violations). Request revision for correctable issues (typos, missing signatures, unclear information).",
              },
              {
                key: "5",
                question: "How are fees calculated?",
                answer:
                  "Fees are automatically calculated based on business type, capitalization, gross sales, and local tax ordinances. The system applies the correct fee schedule based on the application data.",
              },
            ],
          },
          publishedData: {
            description:
              "Application Review allows LGU officers to review and approve or reject business permit applications. Officers can review form sections, request corrections, approve applications, and generate payment instructions.",
            bulletPoints: [
              {
                title: "Claim applications",
                content:
                  "Click 'Claim Application' to take ownership of an application. Only you can review and make decisions while claimed. Release it when done so other officers can handle it.",
              },
              {
                title: "Review form sections",
                content:
                  "Navigate through the application form sections using the left sidebar. Review each field for completeness, accuracy, and compliance with requirements.",
              },
              {
                title: "Make field decisions",
                content:
                  "For each field, you can Approve (no issues), Reject (needs correction), or Request Change (minor issue). Add comments explaining your decision for the business owner.",
              },
              {
                title: "Submit review decision",
                content:
                  "After reviewing all fields, submit your final decision: Approve (issue permit), Reject (deny permit), or Needs Revision (request corrections). The business owner will be notified.",
              },
              {
                title: "Generate payments",
                content:
                  "When an application is approved, you can generate payment instructions. The system calculates fees based on business type, capitalization, and other factors.",
              },
              {
                title: "View history",
                content:
                  "Click the History button to see the full audit trail of status changes, review decisions, claim/release actions, and other modifications.",
              },
            ],
            faqItems: [
              {
                key: "1",
                question: "What happens when I claim an application?",
                answer:
                  "Claiming assigns the application to you. Only you can review and make decisions while claimed. Other officers see it as 'Claimed by: [your name]' and can override if necessary.",
              },
              {
                key: "2",
                question: "Can I release an application I've claimed?",
                answer:
                  "Yes, click 'Release Application' to return it to the unclaimed pool. This allows other officers to pick it up. You cannot release approved or rejected applications.",
              },
              {
                key: "3",
                question: "What's the difference between Approve, Reject, and Needs Revision?",
                answer:
                  "Approve: Application meets all requirements, permit will be issued. Reject: Application fails requirements, permit denied. Needs Revision: Application has correctable issues, business owner must fix and resubmit.",
              },
              {
                key: "4",
                question: "When should I reject vs. request revision?",
                answer:
                  "Reject for fundamental issues (missing documents, ineligible business type, violations). Request revision for correctable issues (typos, missing signatures, unclear information).",
              },
              {
                key: "5",
                question: "How are fees calculated?",
                answer:
                  "Fees are automatically calculated based on business type, capitalization, gross sales, and local tax ordinances. The system applies the correct fee schedule based on the application data.",
              },
            ],
          },
        },
      ];

      // Filter out entries that already exist
      const newEntries = instructionEntries.filter(entry => !existingSlotIds.includes(entry.slotId));
      
      if (newEntries.length > 0) {
        await InstructionContent.insertMany(newEntries);
        logger.info("CMS instruction content seeded", {
          created: newEntries.length,
          skipped: instructionEntries.length - newEntries.length,
        });
        results.instructions = {
          seeded: true,
          created: newEntries.length,
          skipped: instructionEntries.length - newEntries.length,
        };
      } else {
        results.instructions = {
          seeded: false,
          reason: "all instruction slots already exist",
          count: existingInstructions,
        };
      }
  } catch (err) {
    logger.warn("Seed CMS instructions failed", { error: err.message });
    results.instructions = { seeded: false, error: err.message };
  }

  // ─── Page Chapters ──────────────────────────────────────────────────────────
  try {
    const existingChapters = await PageChapter.countDocuments();
    if (existingChapters > 0) {
      await PageChapter.deleteMany({});
      logger.info("Deleted existing page chapters for reseed", { deleted: existingChapters });
    }

    const chaptersToSeed = [
        // ─── Privacy Policy chapters ───
        {
          pageSlotId: "privacy-policy",
          order: 0,
          title: "Quick Summary",
          description: "Key points about how we handle your data, in plain language.",
          introText: "Here's what you need to know about your privacy when using BizClear Portal.",
          sections: [
            { key: "pp-0-1", title: "What we collect", body: "We collect your personal information (name, email, phone) and business details (trade name, address, documents) to process your permit applications." },
            { key: "pp-0-2", title: "Why we need it", body: "Your data helps us evaluate your application, calculate fees, verify documents with government agencies, and send you status updates." },
            { key: "pp-0-3", title: "Who sees it", body: "Only authorized LGU departments (Treasurer, Planning, Zoning) and national agencies (BFP, DTI/SEC) for verification. We never sell your data." },
            { key: "pp-0-4", title: "How we protect it", body: "We use encryption, access controls, and audit logs to keep your data safe." },
            { key: "pp-0-5", title: "Your rights", body: "You can ask to see, correct, or delete your data. You can also file a complaint with the National Privacy Commission." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "privacy-policy",
          order: 1,
          title: "Information We Collect",
          description: "What personal and business data we collect and why.",
          introText: "We only collect information that's necessary to process your business permit application.",
          sections: [
            { key: "pp-1-1", title: "Personal information", body: "We collect your full name, email address, phone number, and Tax Identification Number (TIN). This helps us identify you and contact you about your application.\n\nExample: When you sign up, we need your email to send account verification and your phone for MFA security." },
            { key: "pp-1-2", title: "Business information", body: "We collect your trade name, business address, capitalization amount, gross sales, and employee count. This is required for tax calculation and permit classification.\n\nExample: If you're opening a restaurant, we need your capitalization to determine your permit category and calculate fees." },
            { key: "pp-1-3", title: "Documents", body: "We collect DTI/SEC registration, Barangay Clearance, lease contracts, and Fire Safety Certificates. These are required by law for permit issuance.\n\nExample: Your DTI certificate proves your business is registered with the national government. We store it securely and only share it with verifying agencies." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "privacy-policy",
          order: 2,
          title: "How We Use Your Data",
          description: "The specific purposes for which we process your information.",
          introText: "Every piece of data we collect serves a specific purpose in your permit application journey.",
          sections: [
            { key: "pp-2-1", title: "Processing & evaluation", body: "We use your data to review your permit application, verify eligibility, and determine the appropriate permit type.\n\nWhat this means for you: The information you provide directly affects whether your application is approved and what fees you'll pay." },
            { key: "pp-2-2", title: "Taxes & fees calculation", body: "We use your capitalization and gross sales to compute your business taxes and permit fees based on local tax ordinances.\n\nWhat this means for you: Accurate financial information ensures you're charged the correct amount." },
            { key: "pp-2-3", title: "Document verification", body: "We share your documents with BFP (Bureau of Fire Protection), CHO (City Health Office), and CEO (City Engineer's Office) for required clearances.\n\nWhat this means for you: These agencies verify your compliance with safety, health, and zoning requirements." },
            { key: "pp-2-4", title: "Notifications", body: "We use your contact information to send you status updates, deadline reminders, and payment confirmations.\n\nWhat this means for you: You'll always know where your application stands and when action is needed." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "privacy-policy",
          order: 3,
          title: "Who We Share Your Data With",
          description: "The limited circumstances under which we share your information.",
          introText: "We do not sell your data. We only share it when necessary for your permit processing or when required by law.",
          sections: [
            { key: "pp-3-1", title: "Internal LGU departments", body: "We share your data with the City Treasurer (for tax assessment), City Planning (for zoning clearance), and City Zoning (for location verification).\n\nExample: The Treasurer needs your business address to determine your tax zone and applicable rates." },
            { key: "pp-3-2", title: "National agencies", body: "We share documents with BFP (for fire safety verification), DTI/SEC (for business registration verification), and other national agencies as required.\n\nExample: BFP verifies your Fire Safety Certificate to ensure your premises meet safety standards." },
            { key: "pp-3-3", title: "Legal requirements", body: "We may disclose your data to courts or law enforcement when required by law, court order, or to protect our rights and property.\n\nExample: If there's a legal investigation related to your business, we may be required to provide relevant records." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "privacy-policy",
          order: 4,
          title: "How We Protect Your Data",
          description: "The security measures we use to keep your information safe.",
          introText: "We use industry-standard security practices to protect your data from unauthorized access.",
          sections: [
            { key: "pp-4-1", title: "Encryption", body: "We use SSL/TLS encryption for all data in transit (when you submit information) and encrypt sensitive data at rest (when stored in our database).\n\nWhat this means for you: Even if someone intercepts your data, they won't be able to read it without the encryption key." },
            { key: "pp-4-2", title: "Access control", body: "We restrict access to your data based on user roles. Only authorized personnel can access your information, and all access is logged.\n\nWhat this means for you: Only the LGU staff who need your data for your specific application can see it. We track who accesses what and when." },
            { key: "pp-4-3", title: "Regular security updates", body: "We regularly update our security systems and conduct security audits to identify and fix vulnerabilities.\n\nWhat this means for you: Your data is protected by continuously improving security measures." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "privacy-policy",
          order: 5,
          title: "Your Rights",
          description: "Your data privacy rights under Philippine law and how to exercise them.",
          introText: "The Data Privacy Act of 2012 gives you specific rights over your personal data.",
          sections: [
            { key: "pp-5-1", title: "Right to access", body: "You can request a copy of all personal data we have about you. We'll provide it within 30 days of your request.\n\nHow to exercise this right: Contact the BPLO office with your identification details." },
            { key: "pp-5-2", title: "Right to correction", body: "If your information is inaccurate or incomplete, you can request that we correct it.\n\nHow to exercise this right: Log into your BizClear Portal account and update your profile, or contact BPLO for assistance." },
            { key: "pp-5-3", title: "Right to erasure", body: "You can request deletion of your data, subject to record-keeping laws. We may need to retain some data for legal or business purposes.\n\nHow to exercise this right: Submit a written request to BPLO explaining which data you want deleted and why." },
            { key: "pp-5-4", title: "Right to file a complaint", body: "If you believe your privacy rights have been violated, you can file a complaint with the National Privacy Commission (NPC).\n\nHow to exercise this right: Visit the NPC website at privacy.gov.ph or call their hotline." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "privacy-policy",
          order: 6,
          title: "Contact Us",
          description: "How to reach us if you have privacy questions or concerns.",
          introText: "If you have questions about this privacy policy or how we handle your data, we're here to help.",
          sections: [
            { key: "pp-6-1", title: "BPLO Office", body: "Visit the Business Permit and Licensing Office at City Hall during business hours (8 AM - 5 PM, Monday to Friday)." },
            { key: "pp-6-2", title: "Email", body: "Send your privacy questions to bplo@alaminoscity.gov.ph. We typically respond within 2-3 business days." },
            { key: "pp-6-3", title: "Phone", body: "Call the BPLO hotline at (075) 123-4567 for immediate assistance during business hours." },
          ],
          isPublished: true,
        },

        // ─── Terms of Service chapters ───
        {
          pageSlotId: "terms-of-service",
          order: 0,
          title: "Quick Summary",
          description: "Key points about using BizClear Portal, in plain language.",
          introText: "Here's what you need to know about using BizClear Portal responsibly.",
          sections: [
            { key: "tos-0-1", title: "Be honest", body: "Provide accurate information. False documents or statements are illegal and can get your permit revoked." },
            { key: "tos-0-2", title: "Keep your account secure", body: "Don't share your password. Use MFA for extra protection." },
            { key: "tos-0-3", title: "Use it legally", body: "Only use the portal for legitimate business registration. No bots, no hacking, no harassment." },
            { key: "tos-0-4", title: "Digital submissions are legal", body: "Your online submissions and e-signatures are legally valid under Philippine law." },
            { key: "tos-0-5", title: "We try our best", body: "We aim for high uptime but can't guarantee 100% availability. We're not liable for things outside our control." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 1,
          title: "Your Responsibilities",
          description: "What you agree to when using BizClear Portal.",
          introText: "By using BizClear Portal, you agree to these responsibilities.",
          sections: [
            { key: "tos-1-1", title: "Provide accurate information", body: "You must provide true, complete, and accurate information about yourself and your business. If something changes, update it promptly.\n\nWhat happens if you don't: Submitting false information is a criminal offense under the Revised Penal Code. Your permit may be revoked, and you may face legal action." },
            { key: "tos-1-2", title: "Keep your account secure", body: "You're responsible for keeping your password and account access secure. Don't share your login credentials with anyone.\n\nWhat happens if you don't: If someone else uses your account to submit false information, you're still responsible. Enable MFA for extra protection." },
            { key: "tos-1-3", title: "Use the system lawfully", body: "Use BizClear Portal only for legitimate business permit applications. Don't use it for fraud, money laundering, or any illegal activity.\n\nWhat happens if you don't: Illegal use will be reported to authorities, your account will be terminated, and you may face criminal charges." },
            { key: "tos-1-4", title: "Upload valid documents", body: "Only upload documents that are genuine, current, and legally obtained. Don't alter or forge documents.\n\nWhat happens if you don't: Submitting forged documents is a serious crime. Your application will be rejected, and you may be prosecuted." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 2,
          title: "What We Promise",
          description: "Our commitments to you as a service provider.",
          introText: "The City Government of Alaminos commits to providing you with a reliable and fair service.",
          sections: [
            { key: "tos-2-1", title: "Process applications fairly", body: "We'll review your application based on established rules and regulations, without discrimination or bias." },
            { key: "tos-2-2", title: "Protect your data", body: "We'll protect your personal and business information according to the Data Privacy Act of 2012. See our Privacy Policy for details." },
            { key: "tos-2-3", title: "Provide clear communication", body: "We'll send you status updates and notifications about your application through the portal and your registered contact information." },
            { key: "tos-2-4", title: "Maintain the system", body: "We'll keep the portal running smoothly and make improvements based on user feedback." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 3,
          title: "Digital Submissions & E-Signatures",
          description: "Legal validity of your online submissions.",
          introText: "Your online submissions are legally valid under Philippine law.",
          sections: [
            { key: "tos-3-1", title: "Electronic Commerce Act", body: "Under the Electronic Commerce Act of 2000 (Republic Act No. 8792), electronic documents and e-signatures have the same legal effect as their paper counterparts.\n\nWhat this means for you: Your online application is as legally binding as a paper application signed in person." },
            { key: "tos-3-2", title: "Your e-signature", body: "When you click \"Submit\" or check the agreement box, you're providing your electronic signature. This represents your consent to the terms and confirms the accuracy of your submission.\n\nWhat this means for you: Don't submit unless you've reviewed everything and agree. You can't claim you didn't mean to submit." },
            { key: "tos-3-3", title: "Document authenticity", body: "You confirm that all documents you upload are authentic and unaltered. Digital copies are accepted as valid for permit processing.\n\nWhat this means for you: Make sure your uploaded documents are clear, complete, and current. Blurry or incomplete documents may cause delays." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 4,
          title: "Prohibited Activities",
          description: "Actions that are not allowed on the platform.",
          introText: "The following activities are strictly prohibited and may result in account termination.",
          sections: [
            { key: "tos-4-1", title: "Unauthorized access", body: "Don't try to access other users' accounts, bypass security measures, or exploit vulnerabilities.\n\nExample: Trying to guess someone else's password or using automated tools to find security weaknesses." },
            { key: "tos-4-2", title: "Automated abuse", body: "Don't use bots, scrapers, or automated tools to interact with the portal. This includes automated form submissions or data harvesting.\n\nExample: Using a script to submit multiple fake applications or scrape business data from the system." },
            { key: "tos-4-3", title: "Disruption & harassment", body: "Don't disrupt the service, harass LGU staff, or abuse other users. This includes spam, threats, or offensive language.\n\nExample: Sending abusive messages to BPLO officers or flooding the system with fake support requests." },
            { key: "tos-4-4", title: "Fraudulent applications", body: "Don't submit applications for fake businesses, using stolen identities, or with forged documents.\n\nExample: Using someone else's DTI certificate or creating a fake business to obtain permits illegally." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 5,
          title: "Service Availability",
          description: "What to expect regarding system uptime and limitations.",
          introText: "We strive to keep BizClear Portal available, but some limitations apply.",
          sections: [
            { key: "tos-5-1", title: "Uptime commitment", body: "We aim for 99% uptime, but we cannot guarantee uninterrupted access. Scheduled maintenance will be announced in advance when possible.\n\nWhat this means for you: Plan ahead for important deadlines. Don't wait until the last minute to submit time-sensitive applications." },
            { key: "tos-5-2", title: "Liability limitations", body: "We're not liable for losses caused by service interruptions, your own errors, incomplete submissions, or delays from external agencies (BFP, CHO, CEO).\n\nExample: If your internet goes down while submitting, or if BFP takes longer than expected to verify your documents, we're not responsible for resulting delays." },
            { key: "tos-5-3", title: "External dependencies", body: "Some parts of the process depend on external agencies (BFP, CHO, CEO, DTI/SEC). We cannot control their response times.\n\nWhat this means for you: Allow extra time for external verifications, especially during peak periods." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 6,
          title: "Account Termination",
          description: "When and how we may suspend or terminate your account.",
          introText: "We reserve the right to take action against accounts that violate these terms.",
          sections: [
            { key: "tos-6-1", title: "Grounds for termination", body: "We may suspend or terminate your account for: submitting false information, fraudulent activity, prohibited activities, repeated violations of these terms, or illegal business operations.\n\nExample: If you submit a fake DTI certificate, your account will be terminated immediately." },
            { key: "tos-6-2", title: "Termination process", body: "For serious violations (fraud, forgery), we may terminate without prior notice. For minor issues, we'll typically issue a warning first.\n\nWhat this means for you: If you receive a warning, address it immediately to avoid account suspension." },
            { key: "tos-6-3", title: "After termination", body: "If your account is terminated, you may not create a new account without written permission from BPLO. Pending applications may be cancelled.\n\nWhat this means for you: Account termination is serious. Address issues promptly to avoid reaching this point." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 7,
          title: "Dispute Resolution",
          description: "How to resolve disagreements or issues with the service.",
          introText: "If you have a dispute with us, here's how to resolve it.",
          sections: [
            { key: "tos-7-1", title: "Contact us first", body: "If you disagree with a decision or have an issue, contact BPLO first. Most issues can be resolved through direct communication.\n\nHow to do this: Visit the BPLO office, email bplo@alaminoscity.gov.ph, or call (075) 123-4567." },
            { key: "tos-7-2", title: "Escalation", body: "If BPLO cannot resolve your issue, you may escalate to the City Mayor's Office or the appropriate local government oversight body.\n\nHow to do this: Submit a written complaint explaining the issue and what resolution you're seeking." },
            { key: "tos-7-3", title: "Legal action", body: "As a last resort, you may pursue legal remedies through the appropriate courts or government agencies.\n\nNote: Legal action should be a last resort after exhausting administrative remedies." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "terms-of-service",
          order: 8,
          title: "Contact Us",
          description: "How to reach us if you have questions about these terms.",
          introText: "If you have questions about these Terms of Service, we're here to help.",
          sections: [
            { key: "tos-8-1", title: "BPLO Office", body: "Visit the Business Permit and Licensing Office at City Hall during business hours (8 AM - 5 PM, Monday to Friday)." },
            { key: "tos-8-2", title: "Email", body: "Send your questions to bplo@alaminoscity.gov.ph. We typically respond within 2-3 business days." },
            { key: "tos-8-3", title: "Phone", body: "Call the BPLO hotline at (075) 123-4567 for immediate assistance during business hours." },
          ],
          isPublished: true,
        },

        // ─── BizClear Manual chapters ───
        {
          pageSlotId: "bizclear-manual",
          order: 0,
          title: "Quick Start",
          description: "Get started with BizClear Portal in 5 minutes.",
          introText: "New to BizClear? Here's the fastest way to get your first permit application submitted.",
          sections: [
            { key: "man-0-1", title: "Step 1: Create your account", body: "Go to bizclear.alaminoscity.gov.ph and click \"Sign Up\". Enter your full name, email, and create a strong password. You'll receive a verification email — click the link to confirm." },
            { key: "man-0-2", title: "Step 2: Set up MFA", body: "For your security, we require multi-factor authentication. Download an authenticator app (Google Authenticator, Authy) and scan the QR code. This takes about 2 minutes." },
            { key: "man-0-3", title: "Step 3: Gather your documents", body: "Before starting your application, have these ready: DTI/SEC registration, Barangay Clearance, lease contract or land title, government ID, and Cedula. Scan them as clear PDF or image files." },
            { key: "man-0-4", title: "Step 4: Start your application", body: "Log in, click \"New Application\", and select your business type. Fill in the form with your business details. Upload each document to the correct field. Review everything, then click \"Submit\"." },
            { key: "man-0-5", title: "Step 5: Track progress", body: "After submission, go to the \"Applications\" tab to see your status. You'll receive notifications when your application moves to the next stage (Under Review, Clearances, Payment, Approved)." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 1,
          title: "Creating Your Account",
          description: "Detailed guide to setting up your BizClear Portal account.",
          introText: "Your BizClear Portal account is your gateway to managing all your business permits.",
          sections: [
            { key: "man-1-1", title: "Sign up process", body: "1. Visit bizclear.alaminoscity.gov.ph\n2. Click the \"Sign Up\" button in the top right\n3. Enter your full legal name (as shown on your government ID)\n4. Enter your email address (use an email you check regularly)\n5. Create a password (at least 8 characters, mix of letters and numbers)\n6. Click \"Create Account\"\n7. Check your email for the verification link\n8. Click the link to verify your account\n\nTip: Use your business email if you have one. This keeps your personal and business communications separate." },
            { key: "man-1-2", title: "Setting up MFA", body: "Multi-factor authentication (MFA) adds an extra layer of security to your account.\n\n1. After verifying your email, you'll see the MFA setup screen\n2. Download an authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)\n3. Open the app and tap \"Add account\" or scan QR code\n4. Point your phone camera at the QR code on screen\n5. Enter the 6-digit code from the app to confirm\n6. Done! You'll now need this code every time you log in\n\nTip: Save your backup codes in a safe place. If you lose your phone, you can use these to access your account." },
            { key: "man-1-3", title: "Completing your profile", body: "After MFA setup, you'll be asked to complete your profile:\n\n1. Add your phone number (for SMS notifications)\n2. Set your preferred notification method (email or SMS)\n3. Add your business address (if you already have one)\n\nTip: Keep your profile updated. If you change your phone number or email, update it here so you don't miss important notifications." },
            { key: "man-1-4", title: "Common issues", body: "• Didn't receive verification email? Check your spam folder. If still not there, click \"Resend verification email\".\n• MFA code not working? Make sure your phone's time is set to automatic. Authenticator codes depend on correct time.\n• Forgot password? Click \"Forgot Password\" on the login page. You'll receive an email with reset instructions." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 2,
          title: "Dashboard Overview",
          description: "Understanding your BizClear Portal dashboard.",
          introText: "Your dashboard is your control center for all permit-related activities.",
          sections: [
            { key: "man-2-1", title: "Main sections", body: "• **Applications**: View all your permit applications (new, renewal, cessations)\n• **Payments**: See your fee assessments and payment history\n• **Documents**: Access your uploaded documents and permits\n• **Notifications**: View alerts and reminders about your applications\n• **Profile**: Update your personal and business information" },
            { key: "man-2-2", title: "Application status meanings", body: "• **Draft**: Application saved but not yet submitted\n• **Submitted**: Application is with BPLO for initial review\n• **Under Review**: BPLO is evaluating your application\n• **Clearances**: Your application is being verified by other departments (BFP, CHO, CEO)\n• **Payment**: Fees have been assessed, waiting for payment\n• **Approved**: Your permit is ready for download or pickup\n• **Rejected**: Application was not approved (see rejection reason)" },
            { key: "man-2-3", title: "Quick actions", body: "• Click \"New Application\" to start a new permit application\n• Click \"Renew\" next to an expiring permit to start renewal\n• Click \"View\" to see application details and upload additional documents\n• Click \"Download\" to get your approved permit PDF" },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 3,
          title: "New Business Permit Application",
          description: "Step-by-step guide to applying for your first business permit.",
          introText: "Follow these steps to submit your new business permit application correctly the first time.",
          sections: [
            { key: "man-3-1", title: "Before you begin", body: "Make sure you have these documents ready as clear PDF or image files:\n\n• DTI/SEC/CDA Certificate of Registration\n• Barangay Business Clearance\n• Contract of Lease or Land Title (if renting or own the property)\n• Government-issued ID (passport, driver's license, UMID)\n• Community Tax Certificate (Cedula)\n\nTip: Scan documents at 300 DPI for best quality. Make sure all text is readable." },
            { key: "man-3-2", title: "Starting your application", body: "1. Log in to BizClear Portal\n2. Click \"New Application\" on the dashboard\n3. Select your business type from the dropdown (retail, service, manufacturing, etc.)\n4. Click \"Continue\"\n\nTip: If you're unsure about your business type, choose the closest match. You can clarify with BPLO during review." },
            { key: "man-3-3", title: "Filling in business information", body: "You'll need to provide:\n\n• **Trade name**: The name you use for your business (e.g., \"Juan's Sari-Sari Store\")\n• **Business address**: Complete address including street, barangay, and city\n• **Capitalization**: Amount of money invested in the business\n• **Gross sales**: Expected annual revenue (for first year, estimate based on your business plan)\n• **Employee count**: Number of employees including yourself\n• **Line of business**: What your business does (e.g., \"selling groceries\")\n\nTip: Be accurate with financial information. This affects your tax assessment and permit fees." },
            { key: "man-3-4", title: "Uploading documents", body: "1. For each document field, click \"Upload\"\n2. Select the file from your computer\n3. Wait for the upload to complete (you'll see a checkmark)\n4. Review the preview to ensure it's clear and readable\n5. Repeat for all required documents\n\nTip: File size limit is 5MB per document. If your file is larger, compress it or split it into multiple pages." },
            { key: "man-3-5", title: "Review and submit", body: "Before submitting:\n\n1. Review all entered information for accuracy\n2. Check that all required documents are uploaded\n3. Read and agree to the Terms of Service\n4. Click \"Submit Application\"\n\nAfter submission, you'll receive a confirmation with your application reference number. Save this for your records.\n\nTip: Take a screenshot of the confirmation page or write down your reference number. You'll need it to track your application." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 4,
          title: "Renewing Your Permit",
          description: "Annual renewal process for existing business permits.",
          introText: "Business permits must be renewed annually. Here's how to renew yours.",
          sections: [
            { key: "man-4-1", title: "When to renew", body: "Permits expire on December 31 each year. Renewals open in January. You have until January 20 to renew without penalty. After January 20, late fees apply.\n\nTip: Set a calendar reminder for early January to avoid late fees." },
            { key: "man-4-2", title: "Renewal requirements", body: "For renewal, you'll need:\n\n• Previous year's business permit\n• Updated Barangay Business Clearance\n• Fire Safety Inspection Certificate (FSIC)\n• Sanitary Permit (if applicable for food/health businesses)\n• Updated Community Tax Certificate\n\nTip: Get your Barangay Clearance renewed in late December so it's ready for January renewal." },
            { key: "man-4-3", title: "Starting renewal", body: "1. Log in to BizClear Portal\n2. Go to the \"Applications\" tab\n3. Find your expiring permit and click \"Renew\"\n4. The system will pre-fill your business information from last year\n5. Review and update any information that has changed\n6. Upload the required documents\n7. Click \"Submit Renewal\"\n\nTip: Update your capitalization and gross sales if they've changed. This affects your tax assessment." },
            { key: "man-4-4", title: "What's different from new application", body: "Renewal is faster than a new application because:\n\n• Your business information is pre-filled\n• Some documents may not be required if unchanged\n• The process is streamlined for returning businesses\n\nHowever, you still need updated clearances and certificates for the current year." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 5,
          title: "Tracking Application Status",
          description: "How to monitor your application progress and understand each stage.",
          introText: "Your application goes through several stages before approval. Here's what happens at each stage.",
          sections: [
            { key: "man-5-1", title: "Application stages explained", body: "• **Submitted**: Your application is received by BPLO and queued for initial review\n• **Under Review**: BPLO officer is reviewing your application for completeness and compliance\n• **Clearances**: Your application is sent to BFP, CHO, and CEO for verification. This is often the longest stage.\n• **Payment**: All clearances are complete. Fees are computed and posted to your account.\n• **Approved**: Your permit is issued and ready for download or pickup\n• **Rejected**: Application was not approved. You'll see the reason and can address issues and resubmit." },
            { key: "man-5-2", title: "Using the Application Tracker", body: "1. Go to the \"Applications\" tab\n2. Click on your application to see details\n3. The tracker shows your current stage with a progress bar\n4. Below the tracker, you'll see:\n   - Date submitted\n- Current status\n- Next steps\n- Any required actions from you\n\nTip: If your application is stuck in \"Clearances\" for more than 2 weeks, contact BPLO to follow up." },
            { key: "man-5-3", title: "Notifications", body: "You'll receive notifications for:\n\n• When your application moves to a new stage\n• When documents are rejected or need clarification\n• When payment is due\n• When your permit is approved\n\nMake sure your notification preferences are set in your profile (email or SMS)." },
            { key: "man-5-4", title: "Responding to requests", body: "If BPLO requests additional information or documents:\n\n1. You'll receive a notification with details\n2. Go to the application and click \"View\"\n3. Upload the requested documents or provide the information\n4. Click \"Submit Response\"\n\nTip: Respond promptly. Applications with pending requests may be delayed if not addressed quickly." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 6,
          title: "Making Payments",
          description: "How fees are calculated and how to pay them.",
          introText: "Once your application passes review, fees are assessed. Here's how to pay.",
          sections: [
            { key: "man-6-1", title: "How fees are calculated", body: "Your permit fees are based on:\n\n• **Capitalization**: Higher capitalization = higher fees\n• **Gross sales**: Higher sales = higher taxes\n• **Business type**: Some categories have different rates\n• **Location**: Different zones may have different rates\n\nYou'll see a breakdown of all fees before payment. This includes:\n• Business permit fee\n• Mayor's permit fee\n• Sanitary fee\n• Fire safety fee\n• Other applicable fees\n\nTip: Fees are computed based on local tax ordinances. If you have questions about the calculation, contact BPLO." },
            { key: "man-6-2", title: "Payment methods", body: "You can pay through:\n\n• **Online payment**: Integrated payment gateway (credit/debit card, GCash, Maya)\n• **Over-the-counter**: Pay at City Hall Treasurer's Office\n• **Bank deposit**: Deposit to designated LGU bank account\n\nFor online payment:\n1. Go to the \"Payments\" tab\n2. Find your pending payment\n3. Click \"Pay Now\"\n4. Select your payment method\n5. Follow the prompts to complete payment\n6. You'll receive a confirmation receipt\n\nTip: Save your payment receipt. You may need it for your records or tax purposes." },
            { key: "man-6-3", title: "Proof of payment", body: "If paying over-the-counter or by bank deposit:\n\n1. After paying, take a photo or scan the receipt\n2. Go to your payment in BizClear Portal\n3. Click \"Upload Proof of Payment\"\n4. Upload the receipt image\n5. Click \"Submit\"\n\nBPLO will verify your payment and update your application status.\n\nTip: Make sure the receipt clearly shows the payment date, amount, and reference number." },
            { key: "man-6-4", title: "Payment issues", body: "- **Payment failed**: Check your card balance or try a different payment method. If the issue persists, contact your bank.\n- **Payment not reflected**: Wait 24 hours for processing. If still not reflected, upload proof of payment and contact BPLO.\n- **Overpaid**: Contact BPLO for refund processing. Refunds may take 2-4 weeks.\n- **Underpaid**: Pay the remaining amount. Your application will not proceed until full payment is received." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 7,
          title: "Inspections",
          description: "On-site inspection process and how to prepare.",
          introText: "Some business types require on-site inspections by city departments.",
          sections: [
            { key: "man-7-1", title: "Which businesses need inspections", body: "Inspections are typically required for:\n\n• Restaurants and food establishments (Sanitary inspection)\n• Manufacturing (Fire safety inspection)\n• Construction (Zoning and structural inspection)\n• Large retail stores (Fire safety inspection)\n• Any business with high foot traffic\n\nIf your business requires inspection, you'll be notified after your application is submitted." },
            { key: "man-7-2", title: "Inspection types", body: "• **Fire Safety Inspection**: Conducted by BFP. Checks fire exits, extinguishers, electrical wiring, and overall fire safety compliance.\n• **Sanitary Inspection**: Conducted by CHO. Checks food handling, cleanliness, waste disposal, and health compliance.\n• **Zoning Inspection**: Conducted by CEO/Zoning. Checks if your business location is zoned for your business type.\n• **Structural Inspection**: Conducted by CEO. Checks building safety and compliance with building codes." },
            { key: "man-7-3", title: "Preparing for inspection", body: "Before the inspection:\n\n1. Ensure your business premises are clean and organized\n2. Have all required equipment (fire extinguishers, first aid kit, etc.)\n3. Make sure all staff are present if required\n4. Have your business documents ready for inspection\n5. Clear any obstructions from fire exits\n\nTip: Do a self-inspection using the checklist provided by BPLO. This helps you identify issues before the official inspection." },
            { key: "man-7-4", title: "During the inspection", body: "1. The inspector will arrive at the scheduled time\n2. Present your business permit application documents\n3. Accompany the inspector as they check your premises\n4. Answer questions honestly\n5. Note any violations or issues pointed out\n6. Ask for clarification if you don't understand something\n\nTip: Be cooperative and respectful. Inspectors are there to help ensure your business is safe and compliant." },
            { key: "man-7-5", title: "After the inspection", body: "You'll receive an inspection report with:\n\n• Pass/Fail status\n• Any violations found\n• Required corrections (if any)\n• Timeline for corrections\n\nIf you pass: Your application proceeds to the next stage.\nIf you fail: Make the required corrections and request a re-inspection.\n\nTip: Address violations promptly. Delays in corrections can delay your permit issuance." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 8,
          title: "Post-Permit Compliance",
          description: "Ongoing obligations after receiving your permit.",
          introText: "Getting your permit is just the beginning. Here's how to stay compliant.",
          sections: [
            { key: "man-8-1", title: "Annual renewal", body: "Your permit expires on December 31 each year. You must renew it annually in January. See the \"Renewing Your Permit\" chapter for details.\n\nTip: Set a recurring calendar reminder for January 1 to start your renewal." },
            { key: "man-8-2", title: "Reporting changes", body: "You must report the following changes to BPLO within 30 days:\n\n• Change in business address\n• Change in business ownership\n• Change in business type or line of business\n• Significant increase in capitalization or gross sales\n• Change in business name\n\nTo report changes:\n1. Log in to BizClear Portal\n2. Go to your profile\n3. Update the relevant information\n4. Submit the change request\n\nTip: Keeping your information current ensures accurate tax assessment and compliance." },
            { key: "man-8-3", title: "Post-requirement notices", body: "BPLO may send post-requirement notices for:\n\n• Additional document requirements\n• Compliance inspections\n• Fee adjustments\n• Policy changes\n\nWhen you receive a notice:\n1. Read it carefully and understand what's required\n2. Respond by the deadline specified\n3. Upload requested documents or take required actions\n4. Keep proof of compliance\n\nTip: Don't ignore post-requirement notices. Non-compliance can result in permit suspension or fines." },
            { key: "man-8-4", title: "Displaying your permit", body: "You must display your business permit prominently at your business premises:\n\n• In a visible location near the entrance\n• In a frame or protective cover\n• With the current year's validation sticker\n\nInspectors may check for permit display during routine inspections.\n\nTip: If your permit is lost or damaged, you can request a reprint from BPLO for a small fee." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 9,
          title: "Common Issues & Solutions",
          description: "Troubleshooting guide for common problems.",
          introText: "Encountering an issue? Here are solutions to the most common problems.",
          sections: [
            { key: "man-9-1", title: "Document upload issues", body: "• **File too large**: Compress the file or split into multiple pages. Max size is 5MB.\n• **File not supported**: Use PDF, JPG, or PNG formats. Avoid DOC or DOCX.\n• **Upload stuck**: Refresh the page and try again. Check your internet connection.\n• **Document rejected**: Ensure the document is clear, readable, and not expired. Rescan if blurry." },
            { key: "man-9-2", title: "Application stuck in a stage", body: "• **Stuck in \"Submitted\"**: Contact BPLO to confirm receipt.\n• **Stuck in \"Clearances\" for more than 2 weeks**: Contact BPLO to follow up with BFP/CHO/CEO.\n• **Stuck in \"Payment\"**: Verify payment was successful. Upload proof of payment if needed.\n• **Stuck in \"Under Review\"**: BPLO may be waiting for additional information. Check your notifications." },
            { key: "man-9-3", title: "Login issues", body: "• **Forgot password**: Click \"Forgot Password\" and follow email instructions.\n• **MFA code not working**: Check your phone's time is set to automatic. Sync your authenticator app.\n• **Account locked**: Wait 15 minutes and try again, or contact BPLO to unlock.\n• **Email not verified**: Check spam folder. Click \"Resend verification email\"." },
            { key: "man-9-4", title: "Payment issues", body: "• **Payment failed**: Try a different payment method or card. Check your card balance.\n• **Payment not reflected**: Wait 24 hours. If still not reflected, upload proof of payment.\n• **Wrong amount**: Contact BPLO for correction. Do not pay again until the issue is resolved.\n• **Refund needed**: Contact BPLO with your payment details. Refunds take 2-4 weeks." },
            { key: "man-9-5", title: "Inspection issues", body: "• **Inspector didn't show up**: Wait 30 minutes past scheduled time, then contact BPLO.\n• **Failed inspection**: Make required corrections and request re-inspection.\n• **Disagree with inspection result**: File a written appeal to BPLO with supporting evidence.\n• **Need to reschedule**: Contact BPLO at least 24 hours before the scheduled time." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 10,
          title: "Glossary",
          description: "Key terms used in BizClear Portal and permit processing.",
          introText: "Understanding these terms will help you navigate the permit process more easily.",
          sections: [
            { key: "man-10-1", title: "BPLO", body: "Business Permit and Licensing Office — The LGU department responsible for issuing business permits." },
            { key: "man-10-2", title: "BFP", body: "Bureau of Fire Protection — National agency that conducts fire safety inspections." },
            { key: "man-10-3", title: "CHO", body: "City Health Office — LGU department that conducts sanitary and health inspections." },
            { key: "man-10-4", title: "CEO", body: "City Engineer's Office — LGU department that conducts structural and zoning inspections." },
            { key: "man-10-5", title: "DTI/SEC", body: "Department of Trade and Industry / Securities and Exchange Commission — National agencies that register businesses." },
            { key: "man-10-6", title: "Cedula", body: "Community Tax Certificate — Also known as cedula, this is a local tax certificate required for business transactions." },
            { key: "man-10-7", title: "Capitalization", body: "The amount of money invested in the business, used to determine permit fees and tax classification." },
            { key: "man-10-8", title: "Gross Sales", body: "Total revenue from sales before expenses, used for tax assessment." },
            { key: "man-10-9", title: "MFA", body: "Multi-Factor Authentication — A security measure requiring two forms of verification (password + code)." },
            { key: "man-10-10", title: "Line of Business", body: "The specific type of business activity (e.g., retail, food service, manufacturing)." },
          ],
          isPublished: true,
        },
        {
          pageSlotId: "bizclear-manual",
          order: 11,
          title: "Need Help?",
          description: "Contact information and support resources.",
          introText: "If you need assistance, we're here to help.",
          sections: [
            { key: "man-11-1", title: "BPLO Office", body: "Visit the Business Permit and Licensing Office at:\n\nCity Hall, Alaminos City\nBusiness Hours: 8 AM - 5 PM, Monday to Friday\n\nBring your application reference number and ID for faster service." },
            { key: "man-11-2", title: "Email support", body: "Send your questions to bplo@alaminoscity.gov.ph\n\nInclude your:\n• Full name\n• Business name (if applicable)\n• Application reference number (if applicable)\n• Detailed description of your issue\n\nWe typically respond within 2-3 business days." },
            { key: "man-11-3", title: "Phone support", body: "Call the BPLO hotline:\n\n(075) 123-4567\n\nAvailable during business hours (8 AM - 5 PM, Monday to Friday).\n\nHave your reference number ready when calling." },
            { key: "man-11-4", title: "Online resources", body: "• Visit bizclear.alaminoscity.gov.ph for FAQs and guides\n• Check the City Government of Alaminos official website for ordinances and tax schedules\n• Follow the official Facebook page for announcements and updates" },
          ],
          isPublished: true,
        },
      ];

      // Set publishedData for all published chapters
      const chaptersWithPublishedData = chaptersToSeed.map((ch) => ({
        ...ch,
        publishedData: ch.isPublished
          ? { title: ch.title, description: ch.description, introText: ch.introText, sections: ch.sections }
          : null,
      }));

      await PageChapter.insertMany(chaptersWithPublishedData);
      logger.info("CMS page chapters seeded", { created: chaptersWithPublishedData.length });
      results.pages = { seeded: true, created: chaptersWithPublishedData.length };
  } catch (err) {
    logger.warn("Seed CMS page chapters failed", { error: err.message });
    results.pages = { seeded: false, error: err.message };
  }

  return results;
}

module.exports = { seedCmsContentIfEmpty };
