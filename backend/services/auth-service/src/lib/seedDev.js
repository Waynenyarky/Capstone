const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
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
      { name: 'Admin', slug: 'admin' },
      { name: 'Business Owner', slug: 'business_owner' },
      { name: 'LGU Manager', slug: 'lgu_manager' },
      { name: 'LGU Officer', slug: 'lgu_officer' },
      { name: 'LGU Inspector', slug: 'inspector' },
      { name: 'CSO', slug: 'cso' },
    ];

    for (const r of roles) {
      await Role.findOneAndUpdate({ slug: r.slug }, r, { upsert: true, new: true });
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

    // Ensure business owner
    await ensureUser('business@example.com', 'business_owner', 'Bob', 'Business', '+10000000093', {
      mustChangeCredentials: true,
    });

    logger.info('Dev seed completed successfully');
    logger.info(`Default password for all accounts: ${tempPassword}`);
  } catch (err) {
    logger.error('Dev seed failed', { error: err.message, stack: err.stack });
  }
}

module.exports = { seedDevDataIfEmpty };
