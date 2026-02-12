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
        },
        { upsert: true, new: true, runValidators: false }
      );
      logger.info(`Ensured user: ${email} (${roleSlug})`);
    };

    // Ensure admin accounts
    await ensureUser('admin@example.com', 'admin', 'Alice', 'Admin', '+10000000090', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    });
    await ensureUser('admin2@example.com', 'admin', 'Alex', 'Admin', '+10000000091', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    });
    await ensureUser('admin3@example.com', 'admin', 'Avery', 'Admin', '+10000000092', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
    });

    // Ensure staff accounts
    await ensureUser('officer@example.com', 'lgu_officer', 'Larry', 'Officer', '+1-555-0303', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
    });
    await ensureUser('manager@example.com', 'lgu_manager', 'Mary', 'Manager', '+1-555-0404', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
    });
    await ensureUser('inspector@example.com', 'inspector', 'Ian', 'Inspector', '+1-555-0505', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
    });
    await ensureUser('cso@example.com', 'cso', 'Charlie', 'Support', '+1-555-0606', {
      mustChangeCredentials: true,
      mustSetupMfa: true,
      isStaff: true,
    });

    // Ensure business owner (dev-only: no forced password change or MFA so you can log in without OTP/setup)
    await ensureUser('business@example.com', 'business_owner', 'Bob', 'Business', '+10000000093', {
      mustChangeCredentials: false,
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
