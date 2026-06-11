/**
 * Seeder for Application Process definitions.
 * Creates one process per application type with initial steps, costs, and time estimates.
 *
 * Usage: node seedApplicationProcesses.js
 */

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
  override: false,
});
dotenv.config({
  path: path.join(__dirname, "..", "..", "..", "..", "..", ".env"),
  override: false,
});

const connectDB = require("../config/db");

const INITIAL_PROCESSES = [
  {
    applicationType: "permit",
    title: "Business Permit Application",
    description:
      "Complete guide to applying for a new business permit. Follow these steps to register your business and obtain your permit.",
    totalEstimatedTime: "7-12 business days",
    totalEstimatedCost: "₱2,000 - ₱15,000",
    status: "published",
    steps: [
      {
        stepId: "permit-1",
        title: "Create Account & Register",
        description:
          "Register your business account on the platform to get started with the application process.",
        icon: "UserOutlined",
        optional: false,
        estimatedTime: "10-15 minutes",
        estimatedCost: "Free",
        requirements: [
          "Valid government-issued ID",
          "Active email address",
          "Mobile number for verification",
        ],
        order: 0,
      },
      {
        stepId: "permit-2",
        title: "Submit Requirements",
        description:
          "Upload and submit all required documents for your business permit application.",
        icon: "FileTextOutlined",
        optional: false,
        estimatedTime: "30-60 minutes",
        estimatedCost: "Free",
        requirements: [
          "DTI/SEC/CDA Registration Certificate",
          "Barangay Business Clearance",
          "Community Tax Certificate (Cedula)",
          "Contract of Lease / Land Title",
          "Location Map / Sketch",
          "2x2 ID Photo of Owner (2 copies)",
        ],
        order: 1,
      },
      {
        stepId: "permit-3",
        title: "Initial Verification",
        description:
          "BPLO staff reviews your submitted documents for completeness and accuracy.",
        icon: "CheckCircleOutlined",
        optional: false,
        estimatedTime: "1-2 business days",
        estimatedCost: "Free",
        requirements: [],
        order: 2,
      },
      {
        stepId: "permit-4",
        title: "Assessment & Fees",
        description:
          "Your application is assessed and applicable fees are calculated based on business type, capitalization, and floor area.",
        icon: "DollarOutlined",
        optional: false,
        estimatedTime: "1-2 business days",
        estimatedCost: "₱2,000 - ₱15,000 (varies by business type)",
        requirements: [
          "Financial statements (for existing businesses)",
          "Capitalization declaration",
        ],
        order: 3,
      },
      {
        stepId: "permit-5",
        title: "Inspection",
        description:
          "If applicable, an on-site inspection is scheduled to verify business location compliance with fire safety, sanitary, and zoning regulations.",
        icon: "SearchOutlined",
        optional: true,
        estimatedTime: "2-5 business days",
        estimatedCost: "Included in permit fees",
        requirements: [
          "Business premises must be accessible for inspection",
          "Fire extinguisher installed",
          "Proper signage displayed",
        ],
        order: 4,
      },
      {
        stepId: "permit-6",
        title: "Approval",
        description:
          "Upon successful verification and payment, your permit application is approved by the BPLO.",
        icon: "SafetyOutlined",
        optional: false,
        estimatedTime: "1-2 business days",
        estimatedCost: "Free",
        requirements: [],
        order: 5,
      },
      {
        stepId: "permit-7",
        title: "Permit Release",
        description:
          "Your business permit is issued digitally and recorded on the blockchain for tamper-proof verification. Ready for download.",
        icon: "TrophyOutlined",
        optional: false,
        estimatedTime: "Same day",
        estimatedCost: "Free",
        requirements: [],
        order: 6,
      },
    ],
  },
  {
    applicationType: "renewal",
    title: "Business Permit Renewal",
    description:
      "Annual renewal of your existing business permit. Ensure all previous year requirements and clearances are current.",
    totalEstimatedTime: "5-8 business days",
    totalEstimatedCost: "₱1,500 - ₱10,000",
    status: "published",
    steps: [
      {
        stepId: "renewal-1",
        title: "Submit Renewal Application",
        description:
          "Log in to your account, select your existing business, and submit the renewal application with updated documents.",
        icon: "FileTextOutlined",
        optional: false,
        estimatedTime: "15-30 minutes",
        estimatedCost: "Free",
        requirements: [
          "Previous year Business Permit (photocopy)",
          "Updated Barangay Business Clearance",
          "Community Tax Certificate (Cedula)",
          "Updated DTI/SEC/CDA Registration",
          "Official Receipt of previous year permit fees",
        ],
        order: 0,
      },
      {
        stepId: "renewal-2",
        title: "Previous Permit Validation",
        description:
          "System verifies your previous permit record and checks for outstanding violations or unpaid balances.",
        icon: "CheckCircleOutlined",
        optional: false,
        estimatedTime: "1 business day",
        estimatedCost: "Free",
        requirements: [],
        order: 1,
      },
      {
        stepId: "renewal-3",
        title: "Document Review",
        description:
          "BPLO staff verifies that current-year clearances and updated registrations are complete and valid.",
        icon: "SearchOutlined",
        optional: false,
        estimatedTime: "1-2 business days",
        estimatedCost: "Free",
        requirements: [
          "Fire Safety Inspection Certificate (current year)",
          "Sanitary Permit (current year)",
        ],
        order: 2,
      },
      {
        stepId: "renewal-4",
        title: "Fee Assessment & Payment",
        description:
          "Renewal fees are computed based on gross sales/receipts declared for the previous year. Late renewals may incur surcharges.",
        icon: "DollarOutlined",
        optional: false,
        estimatedTime: "1-2 business days",
        estimatedCost: "₱1,500 - ₱10,000 (based on gross sales)",
        requirements: [
          "Sworn Statement of Gross Sales/Receipts",
          "Financial statements",
        ],
        order: 3,
      },
      {
        stepId: "renewal-5",
        title: "Permit Renewal Issuance",
        description:
          "Renewed Business Permit is issued digitally and the blockchain audit trail is updated.",
        icon: "TrophyOutlined",
        optional: false,
        estimatedTime: "Same day",
        estimatedCost: "Free",
        requirements: [],
        order: 4,
      },
    ],
  },
  {
    applicationType: "cessation",
    title: "Business Cessation / Retirement",
    description:
      "Process for closing or retiring your business. Ensure all obligations are settled before filing for cessation.",
    totalEstimatedTime: "5-10 business days",
    totalEstimatedCost: "₱500 - ₱2,000",
    status: "published",
    steps: [
      {
        stepId: "cessation-1",
        title: "File Cessation Notice",
        description:
          "Submit your intent to close or retire the business through the platform.",
        icon: "FileTextOutlined",
        optional: false,
        estimatedTime: "15-30 minutes",
        estimatedCost: "Free",
        requirements: [
          "Business Permit (original or photocopy)",
          "Letter of Intent to Close",
          "Board Resolution (for corporations)",
        ],
        order: 0,
      },
      {
        stepId: "cessation-2",
        title: "Obligation Settlement Check",
        description:
          "BPLO verifies that all outstanding taxes, fees, and penalties have been settled.",
        icon: "DollarOutlined",
        optional: false,
        estimatedTime: "2-3 business days",
        estimatedCost: "₱500 - ₱2,000 (clearance fees + outstanding balances)",
        requirements: [
          "Proof of payment of all outstanding obligations",
          "Tax clearance from Treasurer's Office",
        ],
        order: 1,
      },
      {
        stepId: "cessation-3",
        title: "Final Inspection",
        description:
          "If applicable, a final inspection is conducted to verify the business has ceased operations.",
        icon: "SearchOutlined",
        optional: true,
        estimatedTime: "2-5 business days",
        estimatedCost: "Free",
        requirements: [
          "Premises accessible for inspection",
          "Business signage removed",
        ],
        order: 2,
      },
      {
        stepId: "cessation-4",
        title: "Cessation Approval",
        description:
          "BPLO processes and approves the business cessation. Your business record is updated accordingly.",
        icon: "CheckCircleOutlined",
        optional: false,
        estimatedTime: "1-2 business days",
        estimatedCost: "Free",
        requirements: [],
        order: 3,
      },
    ],
  },
  {
    applicationType: "appeal",
    title: "Application Appeal Process",
    description:
      "If your application was rejected, you may file an appeal to challenge the decision within 30 days.",
    totalEstimatedTime: "10-15 business days",
    totalEstimatedCost: "₱200 - ₱500",
    status: "published",
    steps: [
      {
        stepId: "appeal-1",
        title: "File Appeal",
        description:
          "Submit your appeal through the platform within 30 days of the rejection date, stating the grounds for appeal.",
        icon: "FileTextOutlined",
        optional: false,
        estimatedTime: "30-60 minutes",
        estimatedCost: "₱200 - ₱500 (appeal filing fee)",
        requirements: [
          "Copy of rejection notice",
          "Written grounds for appeal",
          "Supporting documents (if any)",
        ],
        order: 0,
      },
      {
        stepId: "appeal-2",
        title: "Appeal Review",
        description:
          "A review committee examines your appeal, the original application, and any new evidence submitted.",
        icon: "SearchOutlined",
        optional: false,
        estimatedTime: "5-7 business days",
        estimatedCost: "Free",
        requirements: [],
        order: 1,
      },
      {
        stepId: "appeal-3",
        title: "Decision & Resolution",
        description:
          "The committee issues a decision. If approved, your application proceeds; if denied, you'll receive detailed reasoning.",
        icon: "SafetyOutlined",
        optional: false,
        estimatedTime: "3-5 business days",
        estimatedCost: "Free",
        requirements: [],
        order: 2,
      },
    ],
  },
];

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI);
    const ApplicationProcess = require("../models/ApplicationProcess");

    const existing = await ApplicationProcess.countDocuments();
    if (existing > 0) {
      console.log(
        `ApplicationProcess already has ${existing} documents. Skipping seed.`,
      );
      return;
    }

    for (const processData of INITIAL_PROCESSES) {
      await ApplicationProcess.create(processData);
    }

    console.log(
      `Seeded ${INITIAL_PROCESSES.length} application processes (all published).`,
    );
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Idempotent seed function for startup.
 * Seeds application processes only when the collection is empty.
 * Returns result object for logging.
 */
async function seedApplicationProcessesIfEmpty() {
  const enabled =
    process.env.SEED_APPLICATION_PROCESSES === "true" ||
    process.env.SEED_DEV === "true";
  if (!enabled) {
    return {
      seeded: false,
      reason: "SEED_APPLICATION_PROCESSES or SEED_DEV not set",
    };
  }

  try {
    const ApplicationProcess = require("../models/ApplicationProcess");
    const existing = await ApplicationProcess.countDocuments();
    if (existing > 0) {
      return {
        seeded: false,
        reason: "already has application processes",
        count: existing,
      };
    }

    for (const processData of INITIAL_PROCESSES) {
      await ApplicationProcess.create(processData);
    }

    return { seeded: true, created: INITIAL_PROCESSES.length };
  } catch (err) {
    return { seeded: false, error: err.message };
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, seedApplicationProcessesIfEmpty, INITIAL_PROCESSES };
