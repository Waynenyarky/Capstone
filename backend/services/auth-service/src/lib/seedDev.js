const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Office = require('../models/Office');
const logger = require('./logger');

/**
 * Seed development data if enabled
 * Only runs when SEED_DEV=true
 */
async function seedDevDataIfEmpty() {
  try {
    // Only seed when SEED_DEV is explicitly set to 'true'
    const enabled = process.env.SEED_DEV === 'true';
    if (!enabled) {
      logger.info('Seed disabled (set SEED_DEV=true to enable)');
      return;
    }

    logger.info('Starting dev seed...');

    // Seed Roles first
    const roles = [
      { name: 'Admin', slug: 'admin', isStaffRole: false },
      { name: 'Business Owner', slug: 'business_owner', isStaffRole: false },
      { name: 'LGU Manager', slug: 'lgu_manager', isStaffRole: true },
      { name: 'LGU Officer', slug: 'lgu_officer', isStaffRole: true },
      { name: 'LGU Inspector', slug: 'inspector', isStaffRole: true },
      { name: 'CSO', slug: 'cso', isStaffRole: true },
    ];

    for (const r of roles) {
      await Role.findOneAndUpdate(
        { slug: r.slug },
        { ...r, displayName: r.name },
        { upsert: true, new: true }
      );
    }

    const offices = [
      { code: 'OSBC', name: 'OSBC - One Stop Business Center', group: 'Core Offices' },
      { code: 'CHO', name: 'CHO - City Health Office', group: 'Core Offices' },
      { code: 'BFP', name: 'BFP - Bureau of Fire Protection', group: 'Core Offices' },
      { code: 'CEO / ZC', name: 'CEO / ZC - City Engineering Office / Zoning Clearance', group: 'Core Offices' },
      { code: 'BH', name: 'BH - Barangay Hall / Barangay Business Clearance', group: 'Core Offices' },
      { code: 'DTI', name: 'DTI - Department of Trade and Industry', group: 'Preneed / Inter-Govt Clearances' },
      { code: 'SEC', name: 'SEC - Securities and Exchange Commission', group: 'Preneed / Inter-Govt Clearances' },
      { code: 'CDA', name: 'CDA - Cooperative Development Authority', group: 'Preneed / Inter-Govt Clearances' },
      { code: 'PNP-FEU', name: 'PNP-FEU - Firearms & Explosives Unit', group: 'Specialized / Conditional Offices' },
      { code: 'FDA / BFAD / DOH', name: 'FDA / BFAD / DOH - Food & Drug Administration', group: 'Specialized / Conditional Offices' },
      { code: 'PRC / PTR', name: 'PRC / PTR - Professional Regulatory Commission', group: 'Specialized / Conditional Offices' },
      { code: 'NTC', name: 'NTC - National Telecommunications Commission', group: 'Specialized / Conditional Offices' },
      { code: 'POEA', name: 'POEA - Philippine Overseas Employment Administration', group: 'Specialized / Conditional Offices' },
      { code: 'NIC', name: 'NIC - National Insurance Commission', group: 'Specialized / Conditional Offices' },
      { code: 'ECC / ENV', name: 'ECC / ENV - Environmental Compliance Certificate', group: 'Specialized / Conditional Offices' },
      { code: 'CTO', name: 'CTO - City Treasurer Office', group: 'Support / Coordination Offices' },
      { code: 'MD', name: 'MD - Market Division', group: 'Support / Coordination Offices' },
      { code: 'CLO', name: 'CLO - City Legal Office', group: 'Support / Coordination Offices' },
    ];

    for (const office of offices) {
      await Office.findOneAndUpdate(
        { code: office.code },
        { ...office, isActive: true },
        { upsert: true, new: true }
      );
    }

    const tempPassword = process.env.SEED_TEMP_PASSWORD || 'TempPass123!';
    const tempPasswordHash = await bcrypt.hash(tempPassword, 10);

    // In production (demo mode), never seed @example.com for role accounts — use Mailinator only.
    const isProduction = process.env.NODE_ENV === 'production';
    const mailinatorDefaults = {
      officer: 'bizclear-officer@mailinator.com',
      manager: 'bizclear-manager@mailinator.com',
      admin: 'bizclear-admin@mailinator.com',
      admin2: 'bizclear-admin2@mailinator.com',
      admin3: 'bizclear-admin3@mailinator.com',
      inspector: 'bizclear-inspector@mailinator.com',
      cso: 'bizclear-cso@mailinator.com',
      business: 'bizclear-business@mailinator.com',
    };
    const devEmails = {
      officer: process.env.DEV_EMAIL_OFFICER || (isProduction ? mailinatorDefaults.officer : 'officer@example.com'),
      manager: process.env.DEV_EMAIL_MANAGER || (isProduction ? mailinatorDefaults.manager : 'manager@example.com'),
      admin: process.env.DEV_EMAIL_ADMIN || (isProduction ? mailinatorDefaults.admin : 'admin@example.com'),
      admin2: process.env.DEV_EMAIL_ADMIN2 || (isProduction ? mailinatorDefaults.admin2 : 'admin2@example.com'),
      admin3: process.env.DEV_EMAIL_ADMIN3 || (isProduction ? mailinatorDefaults.admin3 : 'admin3@example.com'),
      inspector: process.env.DEV_EMAIL_INSPECTOR || (isProduction ? mailinatorDefaults.inspector : 'inspector@example.com'),
      cso: process.env.DEV_EMAIL_CSO || (isProduction ? mailinatorDefaults.cso : 'cso@example.com'),
      business: process.env.DEV_EMAIL_BUSINESS || (isProduction ? mailinatorDefaults.business : 'business@example.com'),
    };

    // In production, remove stale @example.com seeder accounts BEFORE creating new ones
    // (avoids unique-index conflicts on phoneNumber, etc.)
    if (isProduction) {
      const activeEmails = Object.values(devEmails);
      const staleExampleAccounts = [
        'admin@example.com', 'admin2@example.com', 'admin3@example.com',
        'officer@example.com', 'manager@example.com',
        'inspector@example.com', 'cso@example.com',
        'business@example.com',
      ].filter(e => !activeEmails.includes(e));

      if (staleExampleAccounts.length > 0) {
        const result = await User.deleteMany({
          email: { $in: staleExampleAccounts },
          createdBy: 'seeder',
        });
        if (result.deletedCount > 0) {
          logger.info(`Production cleanup: removed ${result.deletedCount} stale @example.com seeder account(s)`);
        }
      }
    }

    // Helper to ensure a user exists
    const ensureUser = async (email, roleSlug, firstName, lastName, phoneNumber, overrides = {}) => {
      const roleDoc = await Role.findOne({ slug: roleSlug });
      if (!roleDoc) {
        logger.warn(`Role '${roleSlug}' not found, skipping user ${email}`);
        return;
      }
      const passwordHash = overrides.passwordHash || tempPasswordHash;
      await User.findOneAndUpdate(
        { email },
        {
          role: roleDoc._id,
          firstName,
          lastName,
          email,
          phoneNumber: phoneNumber || '',
          passwordHash,
          termsAccepted: overrides.termsAccepted ?? true,
          mustChangeCredentials: overrides.mustChangeCredentials ?? false,
          mustSetupMfa: overrides.mustSetupMfa ?? false,
          mfaEnabled: overrides.mfaEnabled ?? false,
          mfaMethod: overrides.mfaMethod || '',
          mfaSecret: overrides.mfaSecret || '',
          isStaff: overrides.isStaff ?? false,
          isActive: overrides.isActive ?? true,
          office: overrides.office ?? '',
          createdBy: 'seeder',
        },
        { upsert: true, new: true, runValidators: false }
      );
      logger.info(`Ensured user: ${email} (${roleSlug})`);
    };

    // Ensure admin accounts
    await ensureUser(devEmails.admin, 'admin', 'Alice', 'Admin', '+10000000090', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    });
    await ensureUser(devEmails.admin2, 'admin', 'Alex', 'Admin', '+10000000091', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    });
    await ensureUser(devEmails.admin3, 'admin', 'Avery', 'Admin', '+10000000092', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    });

    // Ensure staff accounts (each assigned to an office)
    await ensureUser(devEmails.officer, 'lgu_officer', 'Larry', 'Officer', '+1-555-0303', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
      office: 'OSBC',
    });
    await ensureUser(devEmails.manager, 'lgu_manager', 'Mary', 'Manager', '+1-555-0404', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
      office: 'CTO',
    });
    await ensureUser(devEmails.inspector, 'inspector', 'Ian', 'Inspector', '+1-555-0505', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
      office: 'BFP',
    });
    await ensureUser(devEmails.cso, 'cso', 'Charlie', 'Support', '+1-555-0606', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
      office: 'OSBC',
    });

    // Ensure business owner
    await ensureUser(devEmails.business, 'business_owner', 'Bob', 'Business', '+10000000093', {
      mustChangeCredentials: isProduction,
      mustSetupMfa: false,
      mfaEnabled: false,
      mfaMethod: '',
    });

    logger.info('Dev seed completed successfully');
    logger.info(`Default password for all accounts: ${tempPassword}`);
  } catch (err) {
    logger.error('Dev seed failed', { error: err.message, stack: err.stack });
  }
}

module.exports = { seedDevDataIfEmpty };
