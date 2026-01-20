#!/usr/bin/env node
/**
 * Email Configuration Diagnostic Tool
 * 
 * This script checks if your email configuration is set up correctly
 * for sending OTP emails via SendGrid.
 * 
 * Usage: node check-email-config.js
 */

// Load .env from multiple locations (root and backend directory)
const path = require('path');
const fs = require('fs');

// Try root .env first (for Docker Compose), then backend/.env (for local dev)
const rootEnvPath = path.join(__dirname, '..', '.env');
const backendEnvPath = path.join(__dirname, '.env');

let envLoaded = false;
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
  console.log(`[Config] Loaded .env from: ${rootEnvPath}`);
  envLoaded = true;
} else if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
  console.log(`[Config] Loaded .env from: ${backendEnvPath}`);
  envLoaded = true;
} else {
  require('dotenv').config(); // Default behavior
  console.log('[Config] Loaded .env from current directory (or using defaults)');
}

console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('📧 Email Configuration Diagnostic');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Check required environment variables
const emailApiKey = process.env.EMAIL_API_KEY;
const emailProvider = process.env.EMAIL_API_PROVIDER || 'sendgrid';
const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log('Environment Configuration:');
console.log('───────────────────────────────────────────────────────────');
console.log(`NODE_ENV: ${nodeEnv}`);
console.log(`EMAIL_API_PROVIDER: ${emailProvider}`);
console.log(`EMAIL_API_KEY: ${emailApiKey ? `${emailApiKey.substring(0, 15)}...${emailApiKey.substring(emailApiKey.length - 5)} (${emailApiKey.length} chars)` : '❌ NOT SET'}`);
console.log(`DEFAULT_FROM_EMAIL: ${defaultFromEmail || '❌ NOT SET'}`);
console.log('');

// Validation checks
let hasErrors = false;
let hasWarnings = false;

console.log('Validation Results:');
console.log('───────────────────────────────────────────────────────────');

// Check EMAIL_API_KEY
if (!emailApiKey) {
  console.log('❌ EMAIL_API_KEY: NOT SET');
  console.log('');
  console.log('   📝 TO FIX:');
  console.log('   1. Go to: https://app.sendgrid.com/settings/api_keys');
  console.log('   2. Click "Create API Key"');
  console.log('   3. Name it (e.g., "Capstone Project")');
  console.log('   4. Select "Full Access" or "Restricted Access" with "Mail Send" permission');
  console.log('   5. Copy the API key (starts with "SG.")');
  console.log('   6. Add to your backend/.env file:');
  console.log('      EMAIL_API_KEY=SG.your_actual_key_here');
  console.log('');
  hasErrors = true;
} else {
  if (emailProvider.toLowerCase() === 'sendgrid' && !emailApiKey.startsWith('SG.')) {
    console.log('⚠️  EMAIL_API_KEY: Does not start with "SG." (may not be a valid SendGrid key)');
    hasWarnings = true;
  } else {
    console.log('✅ EMAIL_API_KEY: SET');
  }
}

// Check DEFAULT_FROM_EMAIL
if (!defaultFromEmail) {
  console.log('❌ DEFAULT_FROM_EMAIL: NOT SET');
  console.log('   → Add to .env: DEFAULT_FROM_EMAIL=noreply@yourdomain.com');
  console.log('   → Or with display name: DEFAULT_FROM_EMAIL="BizClear <noreply@yourdomain.com>"');
  console.log('   → Make sure this email is verified in SendGrid');
  hasErrors = true;
} else {
  // Parse email from display name format if present
  let emailOnly = defaultFromEmail;
  const nameMatch = defaultFromEmail.match(/^(.+?)\s*<(.+?)>$/);
  if (nameMatch) {
    emailOnly = nameMatch[2].trim();
  }
  
  if (!emailOnly.includes('@')) {
    console.log('❌ DEFAULT_FROM_EMAIL: Invalid format (missing @)');
    console.log('   → Current value: ' + defaultFromEmail);
    console.log('   → Should be: "email@domain.com" or "Display Name <email@domain.com>"');
    hasErrors = true;
  } else {
    console.log('✅ DEFAULT_FROM_EMAIL: SET');
    if (nameMatch) {
      console.log(`   → Email: ${emailOnly}`);
      console.log(`   → Display Name: ${nameMatch[1].trim()}`);
    } else {
      console.log(`   → Email: ${emailOnly}`);
    }
    console.log('   → Make sure this email is verified in SendGrid:');
    console.log('     https://app.sendgrid.com/settings/sender_auth/senders');
  }
}

// Check EMAIL_API_PROVIDER
if (emailProvider.toLowerCase() !== 'sendgrid') {
  console.log(`⚠️  EMAIL_API_PROVIDER: Set to "${emailProvider}" (expected "sendgrid")`);
  hasWarnings = true;
} else {
  console.log('✅ EMAIL_API_PROVIDER: Set to sendgrid');
}

// Check NODE_ENV
if (nodeEnv === 'development' && !emailApiKey) {
  console.log('⚠️  NODE_ENV: development mode - will use MOCK emails if EMAIL_API_KEY not set');
  hasWarnings = true;
}

console.log('');

// Summary
console.log('═══════════════════════════════════════════════════════════');
if (hasErrors) {
  console.log('❌ CONFIGURATION ERRORS FOUND');
  console.log('');
  console.log('Your email configuration has errors. OTP emails will NOT be sent.');
  console.log('Please fix the errors above and restart your backend server.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  CONFIGURATION WARNINGS');
  console.log('');
  console.log('Your email configuration has warnings. Please review them above.');
  console.log('Emails may still work, but some settings may need adjustment.');
  process.exit(0);
} else {
  console.log('✅ CONFIGURATION LOOKS GOOD!');
  console.log('');
  console.log('Your email configuration appears to be set up correctly.');
  console.log('OTP emails should be sent via SendGrid.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure your SendGrid sender email is verified');
  console.log('2. Restart your backend server');
  console.log('3. Test signup and check backend logs for email status');
  process.exit(0);
}
