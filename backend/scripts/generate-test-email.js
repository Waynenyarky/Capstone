#!/usr/bin/env node
/**
 * Print a temporary test email address (Mailinator) for signup/E2E testing.
 * Any mail sent to this address can be read at https://www.mailinator.com by
 * entering the local part (the part before @).
 *
 * Usage:
 *   node backend/scripts/generate-test-email.js
 *   node backend/scripts/generate-test-email.js signup
 *   node backend/scripts/generate-test-email.js roles   # print 5 role emails + .env snippet
 */

const arg = process.argv[2]

if (arg === 'roles') {
  const roles = [
    { role: 'LGU Officer', email: 'bizclear-officer@mailinator.com', inbox: 'bizclear-officer' },
    { role: 'Manager', email: 'bizclear-manager@mailinator.com', inbox: 'bizclear-manager' },
    { role: 'Admin', email: 'bizclear-admin@mailinator.com', inbox: 'bizclear-admin' },
    { role: 'Admin 2', email: 'bizclear-admin2@mailinator.com', inbox: 'bizclear-admin2' },
    { role: 'Admin 3', email: 'bizclear-admin3@mailinator.com', inbox: 'bizclear-admin3' },
  ]
  console.log('')
  console.log('Five role emails (Mailinator) — add to .env and run seed:')
  console.log('')
  roles.forEach(({ role, email, inbox }) => {
    console.log(`  ${role.padEnd(12)} ${email}  (inbox: ${inbox})`)
  })
  console.log('')
  console.log('Copy into .env:')
  console.log('DEV_EMAIL_OFFICER=bizclear-officer@mailinator.com')
  console.log('DEV_EMAIL_MANAGER=bizclear-manager@mailinator.com')
  console.log('DEV_EMAIL_ADMIN=bizclear-admin@mailinator.com')
  console.log('DEV_EMAIL_ADMIN2=bizclear-admin2@mailinator.com')
  console.log('DEV_EMAIL_ADMIN3=bizclear-admin3@mailinator.com')
  console.log('')
  console.log('Then ensure SEED_DEV=true and restart auth service so seed runs.')
  console.log('Read OTPs at https://www.mailinator.com (enter inbox name above).')
  console.log('')
  process.exit(0)
}

const prefix = arg || 'test'
const local = `${prefix}-${Date.now()}`
const email = `${local}@mailinator.com`
console.log('')
console.log('Temporary test email (Mailinator):')
console.log('  ' + email)
console.log('')
console.log('To read messages: open https://www.mailinator.com and enter inbox: ' + local)
console.log('')
