/**
 * Seed CMS content (FAQ sections + Instruction slots) for development/testing.
 *
 * Idempotent: inserts only when collections are empty.
 * Run when SEED_CMS=true or SEED_DEV=true.
 */

const FaqSection = require('../models/FaqSection')
const InstructionContent = require('../models/InstructionContent')
const logger = require('../lib/logger')

async function seedCmsContentIfEmpty() {
  const enabled = process.env.SEED_CMS === 'true' || process.env.SEED_DEV === 'true'
  if (!enabled) {
    return { seeded: false, reason: 'SEED_CMS or SEED_DEV not set' }
  }

  const results = { faq: null, instructions: null }

  // ─── FAQ Sections ───────────────────────────────────────────────────────────
  try {
    const existingFaq = await FaqSection.countDocuments()
    if (existingFaq > 0) {
      results.faq = { seeded: false, reason: 'already has FAQ sections', count: existingFaq }
    } else {
      const faqEntries = [
        {
          slotId: 'landing-page-faq',
          title: 'Frequently Asked Questions',
          subtitle: 'Quick answers about application timelines, updates, and submission best practices.',
          items: [
            {
              key: 'faq-1',
              question: 'How long does permit processing usually take?',
              answer: 'Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.',
            },
            {
              key: 'faq-2',
              question: 'Can I submit my application even if one document is pending?',
              answer: 'You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.',
            },
            {
              key: 'faq-3',
              question: 'How will I know if my permit status changes?',
              answer: 'Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.',
            },
            {
              key: 'faq-4',
              question: 'What should I do if my application is returned for correction?',
              answer: 'Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.',
            },
          ],
          isPublished: true,
          draftData: {
            subtitle: 'Quick answers about application timelines, updates, and submission best practices.',
            items: [
              {
                key: 'faq-1',
                question: 'How long does permit processing usually take?',
                answer: 'Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.',
              },
              {
                key: 'faq-2',
                question: 'Can I submit my application even if one document is pending?',
                answer: 'You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.',
              },
              {
                key: 'faq-3',
                question: 'How will I know if my permit status changes?',
                answer: 'Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.',
              },
              {
                key: 'faq-4',
                question: 'What should I do if my application is returned for correction?',
                answer: 'Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.',
              },
            ],
          },
          publishedData: {
            subtitle: 'Quick answers about application timelines, updates, and submission best practices.',
            items: [
              {
                key: 'faq-1',
                question: 'How long does permit processing usually take?',
                answer: 'Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.',
              },
              {
                key: 'faq-2',
                question: 'Can I submit my application even if one document is pending?',
                answer: 'You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.',
              },
              {
                key: 'faq-3',
                question: 'How will I know if my permit status changes?',
                answer: 'Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.',
              },
              {
                key: 'faq-4',
                question: 'What should I do if my application is returned for correction?',
                answer: 'Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.',
              },
            ],
          },
        },
      ]

      await FaqSection.insertMany(faqEntries)
      logger.info('CMS FAQ sections seeded', { created: faqEntries.length })
      results.faq = { seeded: true, created: faqEntries.length }
    }
  } catch (err) {
    logger.warn('Seed CMS FAQ failed', { error: err.message })
    results.faq = { seeded: false, error: err.message }
  }

  // ─── Instruction Content ────────────────────────────────────────────────────
  try {
    const existingInstructions = await InstructionContent.countDocuments()
    if (existingInstructions > 0) {
      results.instructions = { seeded: false, reason: 'already has instruction content', count: existingInstructions }
    } else {
      const instructionEntries = [
        {
          slotId: 'maintenance-info',
          description: 'When maintenance mode is on, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.',
          bulletPoints: [
            { title: 'Current status', content: 'See whether maintenance mode is on or off and the active message (if any).' },
            { title: 'Enable / disable', content: 'Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.' },
            { title: 'Pending requests', content: 'View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.' },
          ],
          faqItems: [
            {
              key: '1',
              question: 'Who can turn maintenance mode on or off?',
              answer: 'Only admins with appropriate permissions can enable or disable maintenance mode. Depending on your organization\'s settings, this may require approval from another admin.',
            },
            {
              key: '2',
              question: 'What happens when maintenance mode is on?',
              answer: 'When maintenance mode is active, non-admin users will see a maintenance page instead of the main application. They cannot access any features until maintenance is turned off.',
            },
            {
              key: '3',
              question: 'Can I customize the maintenance message?',
              answer: 'Yes, you can set a custom message that will be displayed to users during maintenance. This is useful for communicating expected downtime or reasons for maintenance.',
            },
          ],
          isPublished: true,
          draftData: {
            description: 'When maintenance mode is on, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.',
            bulletPoints: [
              { title: 'Current status', content: 'See whether maintenance mode is on or off and the active message (if any).' },
              { title: 'Enable / disable', content: 'Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.' },
              { title: 'Pending requests', content: 'View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.' },
            ],
            faqItems: [
              {
                key: '1',
                question: 'Who can turn maintenance mode on or off?',
                answer: 'Only admins with appropriate permissions can enable or disable maintenance mode. Depending on your organization\'s settings, this may require approval from another admin.',
              },
              {
                key: '2',
                question: 'What happens when maintenance mode is on?',
                answer: 'When maintenance mode is active, non-admin users will see a maintenance page instead of the main application. They cannot access any features until maintenance is turned off.',
              },
              {
                key: '3',
                question: 'Can I customize the maintenance message?',
                answer: 'Yes, you can set a custom message that will be displayed to users during maintenance. This is useful for communicating expected downtime or reasons for maintenance.',
              },
            ],
          },
          publishedData: {
            description: 'When maintenance mode is on, non-admin users are redirected to the public maintenance page and see the message you set. They cannot use the main application until maintenance is turned off. Enable/disable requests may require approval; this page shows the current system status and any pending requests.',
            bulletPoints: [
              { title: 'Current status', content: 'See whether maintenance mode is on or off and the active message (if any).' },
              { title: 'Enable / disable', content: 'Request to turn maintenance mode on or off. You can set or update the message shown to users. If approval is required, the request appears in Requests until another admin approves it.' },
              { title: 'Pending requests', content: 'View and act on pending maintenance requests (approve or reject) from this page or from the Requests page.' },
            ],
            faqItems: [
              {
                key: '1',
                question: 'Who can turn maintenance mode on or off?',
                answer: 'Only admins with appropriate permissions can enable or disable maintenance mode. Depending on your organization\'s settings, this may require approval from another admin.',
              },
              {
                key: '2',
                question: 'What happens when maintenance mode is on?',
                answer: 'When maintenance mode is active, non-admin users will see a maintenance page instead of the main application. They cannot access any features until maintenance is turned off.',
              },
              {
                key: '3',
                question: 'Can I customize the maintenance message?',
                answer: 'Yes, you can set a custom message that will be displayed to users during maintenance. This is useful for communicating expected downtime or reasons for maintenance.',
              },
            ],
          },
        },
      ]

      await InstructionContent.insertMany(instructionEntries)
      logger.info('CMS instruction content seeded', { created: instructionEntries.length })
      results.instructions = { seeded: true, created: instructionEntries.length }
    }
  } catch (err) {
    logger.warn('Seed CMS instructions failed', { error: err.message })
    results.instructions = { seeded: false, error: err.message }
  }

  return results
}

module.exports = { seedCmsContentIfEmpty }
