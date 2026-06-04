/**
 * Seed announcements for development/testing so the landing page shows real entries.
 *
 * Idempotent: inserts only when the announcements collection is empty.
 * Run when SEED_ANNOUNCEMENTS=true or SEED_DEV=true (after auth seed has created users).
 */

const Announcement = require("../models/Announcement");
const User = require("../models/User");
const Role = require("../models/Role");
const logger = require("../lib/logger");

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seedAnnouncementsIfEmpty() {
  const enabled =
    process.env.SEED_ANNOUNCEMENTS === "true" ||
    process.env.SEED_DEV === "true";
  if (!enabled) {
    return { seeded: false, reason: "SEED_ANNOUNCEMENTS or SEED_DEV not set" };
  }

  try {
    const existing = await Announcement.countDocuments();
    if (existing > 0) {
      logger.info(
        "Announcement seed: collection already has documents, skipping.",
      );
      return {
        seeded: false,
        reason: "already has announcements",
        count: existing,
      };
    }

    const adminRole = await Role.findOne({ slug: "admin" })
      .select("_id")
      .lean();
    if (!adminRole) {
      logger.info(
        "Announcement seed: admin role not found. Run auth SEED_DEV first.",
      );
      return { seeded: false, reason: "missing admin role" };
    }

    const admin = await User.findOne({ role: adminRole._id, isActive: true })
      .select("_id")
      .lean();
    if (!admin) {
      logger.info(
        "Announcement seed: no active admin user found. Run auth SEED_DEV first.",
      );
      return { seeded: false, reason: "missing admin user" };
    }

    const entries = [
      // DEADLINE REMINDERS (Public Audience)
      {
        title: "Business Permit Renewal Deadline Extended - Action Required",
        audience: "public",
        body: `The annual business permit renewal period is now open until March 31, 2026. Business owners are strongly encouraged to submit their renewal applications early to avoid delays during the final processing period. 

IMPORTANT DEADLINES:
• March 15, 2026: Last date for online renewal submission (online portal)
• March 25, 2026: Last date for in-person renewal (walk-ins at City Hall, 8 AM - 5 PM)
• March 31, 2026: Final deadline for all renewals

Applications submitted after March 25 may incur a 10% processing fee penalty and could extend your processing time by 5-7 business days. Please ensure all supporting documents are current, including business registration, tax identification numbers, and proof of compliance with local regulations.

For renewal assistance, visit our online portal at permits.cityportal.gov or contact the Business Licensing Department at (555) 123-4567.`,
        priority: "high",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(72),
        publishedAt: hoursAgo(72),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(72),
        updatedAt: hoursAgo(72),
      },
      {
        title: "Zoning Compliance Certificate Deadline - Submit Before May 15",
        audience: "public",
        body: `All businesses in the Commercial Zone A district must submit updated Zoning Compliance Certificates by May 15, 2026. This is a mandatory requirement for maintaining your business permit.

WHAT YOU NEED TO SUBMIT:
• Completed Zoning Compliance Certificate form (Form ZCC-2026)
• Current property survey or site plan
• Documentation of any building modifications or operational changes since last certification
• Proof of liability insurance coverage

Businesses that fail to submit the required documents by the deadline will have their business licenses automatically suspended until compliance is verified. Grace period submissions after May 15 will incur a $150 late filing fee.

Download the form and submit online at: permits.cityportal.gov/zoning-compliance
Paper submissions can be mailed to: City Planning Department, 100 City Hall Way, Suite 400.

For questions, contact the Zoning Compliance Office at (555) 234-5678.`,
        priority: "urgent",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(96),
        publishedAt: hoursAgo(96),
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(96),
        updatedAt: hoursAgo(96),
      },
      {
        title:
          "Health & Safety Inspection Period - Schedule Your Appointment Now",
        audience: "public",
        body: `Annual Health and Safety Inspections for food service establishments and retail businesses are scheduled for April and May 2026. All businesses must complete inspections to renew their operating permits.

INSPECTION SCHEDULING:
Appointments must be booked online no later than April 30, 2026. Limited slots are available. Schedule early to secure your preferred inspection date.

WHAT THE INSPECTION COVERS:
• Food safety and storage protocols
• Employee health and sanitation practices
• Equipment maintenance and cleanliness
• Fire safety and emergency procedures
• Waste management and disposal
• ADA compliance verification

Businesses found in violation of health codes may receive citation notices requiring corrective action before permit renewal. Minor violations must be corrected within 14 days; major violations require immediate remediation.

Schedule your inspection: permits.cityportal.gov/health-safety-inspections
Phone inquiries: (555) 345-6789`,
        priority: "high",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(48),
        publishedAt: hoursAgo(48),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(48),
        updatedAt: hoursAgo(48),
      },

      // HOLIDAY ADVISORIES (Public Audience)
      {
        title: "City Hall Holiday Closure Schedule - Memorial Day and Beyond",
        audience: "public",
        body: `Please note the following holiday closures for City Hall and all government offices. The Business Licensing and Permit Departments will be closed on the following dates:

UPCOMING HOLIDAY CLOSURES:
• Monday, May 26, 2026 - Memorial Day
• Thursday, July 2, 2026 - Independence Day (Friday observed)
• Friday, July 3 & Monday, July 6, 2026 - Extended weekend
• Tuesday, September 1, 2026 - Labor Day
• Wednesday, November 25 - Friday, November 27, 2026 - Thanksgiving Holiday
• Monday, December 21 - Friday, December 25, 2026 - Winter Holiday

SERVICES DURING CLOSURES:
Online permit applications can still be submitted 24/7, but applications submitted during holiday periods will be processed the next business day. Emergency services and urgent renewal inquiries should contact our emergency hotline at (555) 456-7890.

We will resume normal business hours at 8 AM on the day following each closure. We appreciate your patience and wish you a happy holiday season!`,
        priority: "normal",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(24),
        publishedAt: hoursAgo(24),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(24),
        updatedAt: hoursAgo(24),
      },

      // REGULATION UPDATES (Public Audience)
      {
        title:
          "New Environmental Compliance Standards - Effective April 1, 2026",
        audience: "public",
        body: `Effective April 1, 2026, all businesses are required to comply with updated environmental protection standards. These standards apply to all permitted business types and include new waste management and emissions monitoring requirements.

NEW REQUIREMENTS SUMMARY:
• Waste Reduction & Recycling: Businesses must implement a documented waste recycling program with a minimum 25% recycling rate
• Air Quality Monitoring: Facilities with outdoor operational areas must install and maintain approved air quality sensors
• Water Conservation: All food service and manufacturing facilities must install water-efficient fixtures and document water usage
• Hazardous Materials: Updated storage, labeling, and disposal protocols for all chemical and hazardous materials
• Carbon Footprint Reporting: Businesses with 50+ employees must submit annual carbon footprint assessments

COMPLIANCE TIMELINE:
• April 1 - June 30, 2026: Transition period with compliance guidance
• July 1, 2026: Enforcement begins; non-compliance may result in citations and fines up to $5,000

Resources and compliance training materials are available at: permits.cityportal.gov/environmental-standards
Contact Environmental Compliance Office: (555) 567-8901

We recommend reviewing these standards immediately and beginning implementation to ensure smooth compliance before the enforcement date.`,
        priority: "high",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(36),
        publishedAt: hoursAgo(36),
        expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(36),
        updatedAt: hoursAgo(36),
      },
      {
        title:
          "Updated ADA Accessibility Requirements - Immediate Implementation",
        audience: "public",
        body: `In accordance with latest federal guidelines, all public-facing business locations must now meet enhanced ADA accessibility standards. This mandatory update takes effect immediately.

ACCESSIBILITY UPGRADES REQUIRED:
• Parking: Minimum 10% of spaces must be designated accessible spaces with appropriate signage
• Entry Points: All main entrances must have wheelchair ramps with proper slope and handrails
• Restrooms: All employee and customer restrooms must include grab bars and accessible stalls
• Merchandise Display: Shelving and product displays must be accessible to seated customers
• Service Counters: At least one service counter must have a lowered section (36-48 inches) for accessibility
• Emergency Equipment: First aid kits and emergency equipment must be at accessible heights
• Signage: All signage must include Braille characters and tactile indicators

COMPLIANCE VERIFICATION:
Accessibility compliance will be verified during routine business inspections. Businesses not meeting requirements will be issued a compliance notice with a 60-day remediation deadline. Failure to comply may result in fines ranging from $1,000 to $10,000.

For accessibility consultation and technical assistance, contact our ADA Compliance Team at (555) 678-9012. Free consultation and assessment services are available.`,
        priority: "urgent",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(12),
        publishedAt: hoursAgo(12),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(12),
        updatedAt: hoursAgo(12),
      },

      // TEMPORARY OFFICE CLOSURES (Public Audience)
      {
        title: "Building Renovation - Temporary Office Closures May 1-31, 2026",
        audience: "public",
        body: `The City Hall Building is undergoing critical infrastructure renovation and electrical system upgrades from May 1-31, 2026. During this period, several departments will relocate or operate with limited capacity.

AFFECTED SERVICES:
• Business Licensing Department: CLOSED (Temporary office: 250 Commerce Street, Suite 200)
• Zoning & Planning: CLOSED (Temporary office: 250 Commerce Street, Suite 300)  
• Permits & Inspections: CLOSED (Temporary office: 250 Commerce Street, Suite 100)
• Finance & Revenue: OPEN (Normal location)

TEMPORARY LOCATIONS & HOURS:
All temporary offices will maintain regular business hours: Monday - Friday, 8 AM - 5 PM
Walk-ins are welcome, but appointments are recommended due to limited space.

ONLINE SERVICES:
All online permit applications, renewals, and inquiries continue to operate 24/7 during the renovation period. No service interruptions are expected.

We apologize for any inconvenience. The renovations will significantly improve building safety and system reliability. Estimated completion is May 31, 2026, with a return to normal operations by June 2, 2026.

For questions during the renovation period, call (555) 789-0123.`,
        priority: "high",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(60),
        publishedAt: hoursAgo(60),
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(60),
        updatedAt: hoursAgo(60),
      },
      {
        title: "Extended Office Closure - System Upgrade and Data Migration",
        audience: "public",
        body: `Please be advised that our Business Permit Processing System will be unavailable for extended maintenance on June 15-17, 2026 for critical system upgrades and data migration.

CLOSURE DETAILS:
• Dates: June 15-17, 2026 (Tuesday - Thursday)
• Time: All day (24 hours)
• Impact: Online portal will be unavailable; walk-in services suspended

WHAT THIS MEANS:
• Online permit applications cannot be submitted during this period
• Existing applications under review will continue processing after systems restart
• Inspections scheduled for June 15-17 will be automatically rescheduled for the following week
• Permit status inquiries will not be available online

ALTERNATIVES:
• Email urgent inquiries to: permits@cityportal.gov (responses provided after June 18)
• Call emergency hotline: (555) 890-1234 (limited staff available)
• Mail applications will be date-stamped upon receipt after systems restart

We expect to restore full service by 8 AM on Friday, June 18, 2026. Thank you for your patience as we implement these important system improvements that will provide faster processing and better security.`,
        priority: "normal",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(30),
        publishedAt: hoursAgo(30),
        expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(30),
      },
      // STAFF ANNOUNCEMENTS
      {
        title: "New Review Guidelines - Updated Processing Standards",
        audience: "staff",
        body: `All staff members are required to follow the updated review guidelines effective immediately. Key changes include:\n\nPROCESSING UPDATES:\n• Document verification must be completed within 48 hours of submission\n• Incomplete applications must be flagged within 24 hours with specific feedback\n• All approvals require cross-reference with the updated compliance checklist\n• Priority applications (urgent/high) must be processed within the same business day\n\nPlease review the complete guidelines document in the shared staff resources folder. Contact your supervisor if you have questions about the new procedures.`,
        priority: "high",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(24),
        publishedAt: hoursAgo(24),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(24),
        updatedAt: hoursAgo(24),
      },
      {
        title: "Staff Training Session - Digital Permit Processing System",
        audience: "staff",
        body: `A mandatory training session has been scheduled for all BPLO staff on the updated Digital Permit Processing System.\n\nSESSION DETAILS:\n• Date: Next Monday, 9:00 AM - 12:00 PM\n• Location: Training Room B (2nd Floor, City Hall)\n• Facilitator: IT Department\n\nTOPICS COVERED:\n• New workflow automation features\n• Document verification tools\n• Status tracking dashboard updates\n• Reporting and analytics improvements\n\nAttendance is mandatory. Please coordinate with your team leads for coverage during the session. Light refreshments will be provided.`,
        priority: "normal",
        status: "published",
        isActive: true,
        publishAt: hoursAgo(12),
        publishedAt: hoursAgo(12),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdBy: admin._id,
        createdAt: hoursAgo(12),
        updatedAt: hoursAgo(12),
      },
    ];

    await Announcement.insertMany(entries);
    logger.info("Announcements seeded", { created: entries.length });
    return { seeded: true, created: entries.length };
  } catch (err) {
    logger.warn("Seed announcements failed", { error: err.message });
    return { seeded: false, error: err.message };
  }
}

module.exports = { seedAnnouncementsIfEmpty };
