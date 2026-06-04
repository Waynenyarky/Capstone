/**
 * Gas Policy Service
 * Controls which events get written on-chain vs off-chain to minimize gas costs.
 *
 * Tier A (must-anchor): legally significant — always written on-chain immediately
 * Tier B (digest-anchor): routine updates — batched/digested before on-chain write
 * Tier C (off-chain only): non-critical operational traces — never on-chain
 *
 * MAINNET_BUDGET mode: Stricter policy to hit $1,000/month target
 * - Only final legal outcomes get immediate anchor (permit_issued, permit_revoked, security_incident)
 * - All other events (including approvals/rejections) go to digest anchoring
 */

const TIER_A = "must-anchor";
const TIER_B = "digest-anchor";
const TIER_C = "off-chain-only";

// Get current gas mode from environment
function getGasMode() {
  return process.env.BLOCKCHAIN_GAS_MODE || "compact";
}

// Standard policy rules (for compact/batch modes)
const STANDARD_RULES = {
  // --- Tier A: legally significant, always anchor ---
  logAdminApproval: TIER_A,
  logCriticalEvent: TIER_A,

  // logAuditHash sub-classification by eventType pattern
  "logAuditHash:permit_issued": TIER_A,
  "logAuditHash:permit_revoked": TIER_A,
  "logAuditHash:business_approved": TIER_A,
  "logAuditHash:business_rejected": TIER_A,
  "logAuditHash:application_approved": TIER_A,
  "logAuditHash:application_rejected": TIER_A,
  "logAuditHash:role_change": TIER_A,
  "logAuditHash:admin_action": TIER_A,
  "logAuditHash:account_deletion": TIER_A,
  "logAuditHash:ownership_transfer": TIER_A,
  "logAuditHash:clearance_approved": TIER_A,
  "logAuditHash:clearance_rejected": TIER_A,
  "logAuditHash:inspection_completed": TIER_A,
  "logAuditHash:violation_issued": TIER_A,
  "logAuditHash:appeal_resolved": TIER_A,
  "logAuditHash:payment_confirmed": TIER_A,

  // --- Tier B: routine, batch/digest ---
  "logAuditHash:profile_update": TIER_B,
  "logAuditHash:email_change": TIER_B,
  "logAuditHash:password_change": TIER_B,
  "logAuditHash:login": TIER_B,
  "logAuditHash:logout": TIER_B,
  "logAuditHash:session_created": TIER_B,
  "logAuditHash:mfa_enabled": TIER_B,
  "logAuditHash:mfa_disabled": TIER_B,
  "logAuditHash:document_uploaded": TIER_B,
  "logAuditHash:status_change": TIER_B,

  // --- Tier C: off-chain only ---
  "logAuditHash:page_view": TIER_C,
  "logAuditHash:search": TIER_C,
  "logAuditHash:notification_sent": TIER_C,
  "logAuditHash:notification_read": TIER_C,
  "logAuditHash:export": TIER_C,
  "logAuditHash:filter_applied": TIER_C,
};

// MAINNET_BUDGET mode: Strict policy to hit $1,000/month target
// Only final legal outcomes get immediate anchor; everything else goes to digest
const MAINNET_BUDGET_RULES = {
  // --- Tier A: ONLY final legal outcomes + security incidents ---
  "logAuditHash:permit_issued": TIER_A,
  "logAuditHash:permit_revoked": TIER_A,
  "logCriticalEvent:security_incident": TIER_A,
  "logCriticalEvent:data_breach": TIER_A,
  "logCriticalEvent:unauthorized_access": TIER_A,

  // --- Tier B: Everything else goes to digest (15-min SLA) ---
  // Admin approvals/rejections now digest-anchored
  logAdminApproval: TIER_B,
  logCriticalEvent: TIER_B,
  "logAuditHash:business_approved": TIER_B,
  "logAuditHash:business_rejected": TIER_B,
  "logAuditHash:application_approved": TIER_B,
  "logAuditHash:application_rejected": TIER_B,
  "logAuditHash:role_change": TIER_B,
  "logAuditHash:admin_action": TIER_B,
  "logAuditHash:account_deletion": TIER_B,
  "logAuditHash:ownership_transfer": TIER_B,
  "logAuditHash:clearance_approved": TIER_B,
  "logAuditHash:clearance_rejected": TIER_B,
  "logAuditHash:inspection_completed": TIER_B,
  "logAuditHash:violation_issued": TIER_B,
  "logAuditHash:appeal_resolved": TIER_B,
  "logAuditHash:payment_confirmed": TIER_B,
  "logAuditHash:profile_update": TIER_B,
  "logAuditHash:email_change": TIER_B,
  "logAuditHash:password_change": TIER_B,
  "logAuditHash:login": TIER_B,
  "logAuditHash:logout": TIER_B,
  "logAuditHash:session_created": TIER_B,
  "logAuditHash:mfa_enabled": TIER_B,
  "logAuditHash:mfa_disabled": TIER_B,
  "logAuditHash:document_uploaded": TIER_B,
  "logAuditHash:status_change": TIER_B,

  // --- Tier C: off-chain only (same as standard) ---
  "logAuditHash:page_view": TIER_C,
  "logAuditHash:search": TIER_C,
  "logAuditHash:notification_sent": TIER_C,
  "logAuditHash:notification_read": TIER_C,
  "logAuditHash:export": TIER_C,
  "logAuditHash:filter_applied": TIER_C,
};

// Select active rules based on gas mode
function getActiveRules() {
  const mode = getGasMode();
  if (mode === "mainnet_budget") {
    return MAINNET_BUDGET_RULES;
  }
  return STANDARD_RULES;
}

// Legacy export for backward compatibility
const POLICY_RULES = STANDARD_RULES;

/**
 * Classify an operation into a gas policy tier.
 * @param {string} operation - e.g. 'logAuditHash', 'logCriticalEvent', 'logAdminApproval'
 * @param {string} [eventType] - e.g. 'profile_update', 'permit_issued'
 * @returns {{ tier: string, anchor: boolean, batch: boolean, skip: boolean, useDigest: boolean }}
 */
function classify(operation, eventType) {
  const rules = getActiveRules();
  const mode = getGasMode();

  // Try specific key first
  if (eventType) {
    const specificKey = `${operation}:${eventType}`;
    if (rules[specificKey]) {
      return _tierResult(rules[specificKey], mode);
    }
  }

  // Fallback to operation-level rule
  if (rules[operation]) {
    return _tierResult(rules[operation], mode);
  }

  // Unknown events default to Tier B (digest) to avoid silently dropping legally relevant data
  return _tierResult(TIER_B, mode);
}

/**
 * Classify using standard rules only (for backward compatibility)
 */
function classifyStandard(operation, eventType) {
  // Try specific key first
  if (eventType) {
    const specificKey = `${operation}:${eventType}`;
    if (POLICY_RULES[specificKey]) {
      return _tierResult(POLICY_RULES[specificKey]);
    }
  }

  // Fallback to operation-level rule
  if (POLICY_RULES[operation]) {
    return _tierResult(POLICY_RULES[operation]);
  }

  // Unknown events default to Tier B (batched) to avoid silently dropping legally relevant data
  return _tierResult(TIER_B);
}

function _tierResult(tier, mode = "compact") {
  const isMainnetBudget = mode === "mainnet_budget";
  return {
    tier,
    anchor: tier === TIER_A, // immediate on-chain write
    batch: tier === TIER_B, // queue for batched/digest write
    skip: tier === TIER_C, // off-chain only, no chain write
    // In mainnet_budget mode, Tier B uses epoch digest anchoring instead of simple batching
    useDigest: isMainnetBudget && tier === TIER_B,
  };
}

module.exports = {
  classify,
  classifyStandard,
  getGasMode,
  getActiveRules,
  TIER_A,
  TIER_B,
  TIER_C,
  POLICY_RULES,
  STANDARD_RULES,
  MAINNET_BUDGET_RULES,
};
