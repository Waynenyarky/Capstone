// Diagnostic script to check user's MFA status
// Run this in your backend container or locally

const mongoose = require('mongoose');
const User = require('./backend/services/auth-service/src/models/User');

async function checkUserMfaStatus(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizclear');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('\n==========================================');
    console.log('User:', user.email);
    console.log('==========================================');
    console.log('mfaEnabled (TOTP):', user.mfaEnabled);
    console.log('mfaSecret exists:', !!user.mfaSecret);
    console.log('mfaMethods:', user.mfaMethods);
    console.log('Passkey count:', user.webauthnCredentials?.length || 0);
    console.log('==========================================');
    console.log('\nStatus:');
    if (user.mfaEnabled) {
      console.log('❌ TOTP MFA is ENABLED - you need authenticator app codes');
    } else {
      console.log('✅ TOTP MFA is DISABLED');
    }
    
    if (user.webauthnCredentials?.length > 0) {
      console.log('✅ Passkeys are set up (' + user.webauthnCredentials.length + ' registered)');
    } else {
      console.log('❌ No passkeys registered');
    }
    
    console.log('\nFor password change:');
    if (user.mfaEnabled) {
      console.log('→ You WILL see MFA screen (TOTP is enabled)');
    } else if (user.webauthnCredentials?.length > 0) {
      console.log('→ You should NOT see MFA screen (passkey-only)');
    } else {
      console.log('→ You will get email OTP (no MFA)');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Usage: node check-mfa-status.js your-email@example.com
const email = process.argv[2];
if (!email) {
  console.log('Usage: node check-mfa-status.js your-email@example.com');
  process.exit(1);
}
checkUserMfaStatus(email);
