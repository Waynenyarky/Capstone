const FormDefinition = require("../models/FormDefinition");
const FormGroup = require("../models/FormGroup");
const AdminApproval = require("../models/AdminApproval");
const logger = require("../lib/logger");
const { createAuditLog } = require("../lib/auditLogger");
const {
  createInAppNotificationsForAdmins,
} = require("../lib/notificationService");
const {
  INDUSTRY_SCOPE_VALUES,
  BUSINESS_TYPE_VALUES,
  INDUSTRY_SCOPE_LABELS,
} = require("../../../../shared/constants");

// ─── Form Definition CRUD ─────────────────────────────────────────────────────

/**
 * List form definitions with filtering and pagination
 */
async function listFormDefinitions(filter, page, limit) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [definitions, total] = await Promise.all([
    FormDefinition.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "email firstName lastName")
      .populate("updatedBy", "email firstName lastName")
      .populate("publishedBy", "email firstName lastName")
      .lean(),
    FormDefinition.countDocuments(filter),
  ]);

  return {
    definitions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Get single form definition by ID
 */
async function getFormDefinitionById(id) {
  return FormDefinition.findById(id)
    .populate("createdBy", "email firstName lastName")
    .populate("updatedBy", "email firstName lastName")
    .populate("publishedBy", "email firstName lastName")
    .lean();
}

/**
 * Create new form definition (draft)
 */
async function createFormDefinition(data, userId) {
  const {
    formType,
    version,
    name,
    description,
    businessTypes,
    lguCodes,
    sections,
    downloads,
    effectiveFrom,
    effectiveTo,
  } = data;

  const definition = new FormDefinition({
    formType,
    version,
    name: name || `${formType} requirements v${version}`,
    description: description || "",
    status: "draft",
    businessTypes: businessTypes || [],
    lguCodes: (lguCodes || []).map((c) => c.toUpperCase()),
    sections: sections || [],
    downloads: downloads || [],
    effectiveFrom: effectiveFrom || null,
    effectiveTo: effectiveTo || null,
    createdBy: userId,
    updatedBy: userId,
    changeLog: [
      {
        action: "created",
        by: userId,
        at: new Date(),
        changes: {},
      },
    ],
  });

  await definition.save();
  return definition;
}

/**
 * Update form definition (draft only)
 */
async function updateFormDefinition(id, data, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (!definition.canEdit()) {
    throw new Error("Only draft form definitions can be edited");
  }

  const {
    version,
    name,
    description,
    businessTypes,
    lguCodes,
    sections,
    downloads,
    effectiveFrom,
    effectiveTo,
  } = data;

  // Track changes
  const changes = {};
  if (version !== undefined && version !== definition.version) {
    changes.version = { from: definition.version, to: version };
    definition.version = version;
  }
  if (name !== undefined) definition.name = name;
  if (description !== undefined) definition.description = description;
  if (businessTypes !== undefined) definition.businessTypes = businessTypes;
  if (lguCodes !== undefined)
    definition.lguCodes = lguCodes.map((c) => c.toUpperCase());
  if (sections !== undefined) {
    changes.sectionsCount = {
      from: definition.sections.length,
      to: sections.length,
    };
    definition.sections = sections;
  }
  if (downloads !== undefined) definition.downloads = downloads;
  if (effectiveFrom !== undefined) definition.effectiveFrom = effectiveFrom;
  if (effectiveTo !== undefined) definition.effectiveTo = effectiveTo;

  definition.updatedBy = userId;
  definition.addChangeLog("updated", userId, changes);

  await definition.save();
  return definition;
}

/**
 * Archive form definition
 */
async function archiveFormDefinition(id, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (!definition.canArchive()) {
    throw new Error("This form definition cannot be archived");
  }

  const previousStatus = definition.status;
  definition.status = "archived";
  definition.updatedBy = userId;
  definition.addChangeLog("archived", userId, { previousStatus });

  await definition.save();
  return definition;
}

/**
 * Delete draft form definition
 */
async function deleteFormDefinition(id, userId, role, ip, userAgent) {
  const definition = await FormDefinition.findById(id);
  if (!definition) {
    throw new Error("Form definition not found");
  }
  if (!definition.canEdit()) {
    throw new Error("Only draft form definitions can be deleted");
  }

  const formDefinitionId = String(definition._id);
  const formType = definition.formType || "";
  const version = definition.version || "";
  const name = definition.name || "";

  createAuditLog(
    userId,
    "form_definition_deleted",
    "form_definition",
    formDefinitionId,
    "",
    role,
    {
      formDefinitionId,
      formType,
      version,
      name,
      ip,
      userAgent,
    },
  ).catch((err) =>
    logger.warn("Failed to create audit log for form definition delete", {
      err,
    }),
  );

  await FormDefinition.deleteOne({ _id: definition._id });
}

/**
 * Duplicate form definition as new draft
 */
async function duplicateFormDefinition(id, userId) {
  const source = await FormDefinition.findById(id).lean();

  if (!source) {
    throw new Error("Form definition not found");
  }

  // Parse version and increment
  const versionParts = source.version.split(".");
  const lastPart =
    parseInt(versionParts[versionParts.length - 1] || "0") + 1;
  versionParts[versionParts.length - 1] = String(lastPart);
  const newVersion = versionParts.join(".");

  const duplicate = new FormDefinition({
    formType: source.formType,
    version: newVersion,
    name: `${source.name} (copy)`,
    description: source.description,
    status: "draft",
    businessTypes: source.businessTypes,
    lguCodes: source.lguCodes,
    sections: source.sections,
    downloads: source.downloads,
    effectiveFrom: null,
    effectiveTo: null,
    createdBy: userId,
    updatedBy: userId,
    changeLog: [
      {
        action: "created",
        by: userId,
        at: new Date(),
        changes: { duplicatedFrom: source._id },
      },
    ],
  });

  await duplicate.save();
  return duplicate;
}

/**
 * Set version as active (publish it, archive previous)
 */
async function setFormDefinitionActive(id, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (definition.status !== "draft") {
    throw new Error("Only draft versions can be set as active");
  }

  if (!definition.sections || definition.sections.length === 0) {
    throw new Error("Add at least one section before publishing");
  }

  const now = new Date();

  // Archive current published version in this group
  await FormDefinition.updateMany(
    { formGroupId: definition.formGroupId, status: "published" },
    {
      $set: { status: "archived", updatedBy: userId },
      $push: {
        changeLog: {
          action: "archived",
          by: userId,
          at: now,
          changes: { reason: "superseded" },
        },
      },
    },
  );

  // Publish this version
  definition.status = "published";
  definition.publishedBy = userId;
  definition.publishedAt = now;
  definition.effectiveFrom = now;
  definition.effectiveTo = null;
  definition.updatedBy = userId;
  definition.addChangeLog("published", userId, {});

  await definition.save();
  return definition;
}

/**
 * Submit form definition for 2-admin approval
 */
async function submitForApproval(id, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (!definition.canSubmitForApproval()) {
    throw new Error(
      "Form definition cannot be submitted for approval. Ensure it is a draft with at least one section.",
    );
  }

  // Create approval request
  const approvalId = AdminApproval.generateApprovalId();
  const approval = await AdminApproval.create({
    approvalId,
    requestType: "form_definition",
    userId, // The admin making the request
    requestedBy: userId,
    requestDetails: {
      formDefinitionId: String(definition._id),
      formType: definition.formType,
      version: definition.version,
      name: definition.name,
      sectionsCount: definition.sections.length,
      downloadsCount: definition.downloads.length,
    },
    status: "pending",
    requiredApprovals: 2,
  });

  // Update form definition status
  definition.status = "pending_approval";
  definition.approvalId = approvalId;
  definition.updatedBy = userId;
  definition.addChangeLog("submitted_for_approval", userId, { approvalId });

  await definition.save();

  // Notify other admins (in-app) so they can approve
  createInAppNotificationsForAdmins(
    "approval_request_pending",
    "Form definition pending approval",
    `"${definition.name}" (${definition.formType}) was submitted for approval (${approvalId}). Action required.`,
    "approval",
    approvalId,
    {
      requestType: "form_definition",
      formDefinitionId: String(definition._id),
    },
    userId,
  ).catch((err) =>
    console.error(
      "Failed to create form-approval-pending notifications:",
      err,
    ),
  );

  logger.info("Form definition submitted for approval", {
    formDefinitionId: String(definition._id),
    approvalId,
    submittedBy: userId,
  });

  return { definition, approval };
}

/**
 * Cancel pending approval and return to draft
 */
async function cancelApproval(id, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (definition.status !== "pending_approval") {
    throw new Error("Form definition is not pending approval");
  }

  // Update the approval to rejected/cancelled
  if (definition.approvalId) {
    await AdminApproval.updateOne(
      { approvalId: definition.approvalId },
      { status: "rejected" },
    );
  }

  // Return form to draft
  definition.status = "draft";
  definition.approvalId = "";
  definition.updatedBy = userId;
  definition.addChangeLog("rejected", userId, {
    reason: "Approval cancelled",
  });

  await definition.save();
  return definition;
}

/**
 * Add download to form definition
 */
async function addDownloadToFormDefinition(id, downloadEntry, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (!definition.canEdit()) {
    throw new Error("Only draft form definitions can have files uploaded");
  }

  definition.downloads.push(downloadEntry);
  definition.updatedBy = userId;
  definition.addChangeLog("updated", userId, {
    addedDownload: downloadEntry.label,
  });

  await definition.save();
  return { download: downloadEntry, definition };
}

/**
 * Remove download from form definition
 */
async function removeDownloadFromFormDefinition(id, index, userId) {
  const definition = await FormDefinition.findById(id);

  if (!definition) {
    throw new Error("Form definition not found");
  }

  if (!definition.canEdit()) {
    throw new Error("Only draft form definitions can have downloads removed");
  }

  const downloadIndex = parseInt(index);
  if (
    isNaN(downloadIndex) ||
    downloadIndex < 0 ||
    downloadIndex >= definition.downloads.length
  ) {
    throw new Error("Invalid download index");
  }

  const removed = definition.downloads.splice(downloadIndex, 1)[0];
  definition.updatedBy = userId;
  definition.addChangeLog("updated", userId, {
    removedDownload: removed.label,
  });

  await definition.save();

  let formDeleted = false;
  // If downloads array is empty, consider deleting the form definition
  if (definition.downloads.length === 0) {
    // Only auto-delete if it's a draft and has no other critical data
    if (definition.status === "draft" && !definition.hasActiveUsage()) {
      try {
        await FormDefinition.deleteOne({ _id: definition._id });
        formDeleted = true;
      } catch (deleteError) {
        console.error(
          "Failed to delete empty form definition:",
          deleteError,
        );
      }
    }
  }

  return { removed, definition, formDeleted };
}

/**
 * Get audit log entries for form definitions
 */
async function getFormDefinitionAuditLog(limit) {
  const entries = await FormDefinition.aggregate([
    { $match: { "changeLog.0": { $exists: true } } },
    { $unwind: "$changeLog" },
    { $sort: { "changeLog.at": -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "changeLog.by",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { email: 1, firstName: 1, lastName: 1 } }],
      },
    },
    {
      $addFields: {
        user: { $arrayElemAt: ["$user", 0] },
      },
    },
    {
      $project: {
        definitionId: "$_id",
        formGroupId: 1,
        formType: 1,
        industryScope: 1,
        version: 1,
        name: 1,
        action: "$changeLog.action",
        at: "$changeLog.at",
        changes: "$changeLog.changes",
        comment: "$changeLog.comment",
        user: 1,
        system: "$changeLog.system",
      },
    },
  ]);
  return entries;
}

// ─── Form Group Management ─────────────────────────────────────────────────────

/**
 * List form groups with filtering and pagination
 */
async function listFormGroups(filter, page, limit) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [groups, total] = await Promise.all([
    FormGroup.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    FormGroup.countDocuments(filter),
  ]);

  // Attach latest updatedAt from each group's versions
  const groupsWithMeta = await Promise.all(
    groups.map(async (g) => {
      const latest = await FormDefinition.findOne({ formGroupId: g._id })
        .sort({ updatedAt: -1 })
        .select("updatedAt")
        .lean();
      return {
        ...g,
        lastUpdated: latest?.updatedAt || g.updatedAt,
      };
    }),
  );

  return {
    groups: groupsWithMeta,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Get form group stats (activated, deactivated, retired)
 */
async function getFormGroupStats() {
  const now = new Date();
  const [activated, deactivated, retired] = await Promise.all([
    FormGroup.countDocuments({
      retiredAt: null,
      $or: [
        { deactivatedUntil: null },
        { deactivatedUntil: { $exists: false } },
        { deactivatedUntil: { $lte: now } },
      ],
    }),
    FormGroup.countDocuments({
      retiredAt: null,
      deactivatedUntil: { $exists: true, $ne: null, $gt: now },
    }),
    FormGroup.countDocuments({ retiredAt: { $ne: null } }),
  ]);
  return { activated, deactivated, retired };
}

/**
 * Get form group with all versions
 */
async function getFormGroupWithVersions(groupId) {
  const group = await FormGroup.findById(groupId).lean();
  if (!group) {
    throw new Error("Form group not found");
  }

  const versions = await FormDefinition.find({ formGroupId: group._id })
    .sort({ version: -1, updatedAt: -1 })
    .populate("createdBy", "email firstName lastName")
    .populate("updatedBy", "email firstName lastName")
    .populate("publishedBy", "email firstName lastName")
    .lean();

  return { group, versions };
}

/**
 * Get form group versions only
 */
async function getFormGroupVersions(groupId) {
  const group = await FormGroup.findById(groupId).lean();
  if (!group) {
    throw new Error("Form group not found");
  }

  const versions = await FormDefinition.find({ formGroupId: group._id })
    .sort({ version: -1, updatedAt: -1 })
    .populate("createdBy", "email firstName lastName")
    .populate("updatedBy", "email firstName lastName")
    .populate("publishedBy", "email firstName lastName")
    .lean();

  return versions;
}

/**
 * Create form group with first draft version
 */
async function createFormGroup(formType, industryScope, userId) {
  const existing = await FormGroup.findOne({
    formType,
    industryScope,
    retiredAt: null,
  });
  if (existing) {
    throw new Error("A form group with this type and industry already exists");
  }

  const typeLabels = {
    permit: "Unified Business Permit",
    general_permit: "General Permit",
    renewal: "Business Renewal",
    cessation: "Cessation",
    violation: "Violation",
    appeal: "Appeal",
    inspections: "Inspections",
  };
  const displayName = `${typeLabels[formType]} - ${INDUSTRY_SCOPE_LABELS[industryScope] || industryScope}`;

  const group = await FormGroup.create({
    formType,
    industryScope,
    displayName,
  });

  const year = new Date().getFullYear();
  const version = `${year}.1`;

  const businessTypes = industryScope === "all" ? [] : [industryScope];
  const definition = await FormDefinition.create({
    formGroupId: group._id,
    formType,
    version,
    industryScope,
    name: displayName,
    description: "",
    status: "draft",
    businessTypes,
    lguCodes: [],
    sections: [],
    downloads: [],
    effectiveFrom: null,
    effectiveTo: null,
    createdBy: userId,
    updatedBy: userId,
    changeLog: [
      { action: "created", by: userId, at: new Date(), changes: {} },
    ],
  });

  return { group, definition };
}

/**
 * Create new version for form group
 */
async function createFormGroupVersion(groupId, userId) {
  const group = await FormGroup.findById(groupId).lean();
  if (!group) {
    throw new Error("Form group not found");
  }

  const year = new Date().getFullYear();
  const existingVersions = await FormDefinition.find({
    formGroupId: group._id,
    version: { $regex: `^${year}\\.` },
  })
    .select("version")
    .lean();

  let nextNum = 1;
  for (const v of existingVersions) {
    const m = v.version.match(new RegExp(`^${year}\\.(\\d+)$`));
    if (m) nextNum = Math.max(nextNum, parseInt(m[1], 10) + 1);
  }
  const version = `${year}.${nextNum}`;

  const businessTypes =
    group.industryScope === "all" ? [] : [group.industryScope];
  const definition = await FormDefinition.create({
    formGroupId: group._id,
    formType: group.formType,
    version,
    industryScope: group.industryScope,
    name: group.displayName,
    description: "",
    status: "draft",
    businessTypes,
    lguCodes: [],
    sections: [],
    downloads: [],
    effectiveFrom: null,
    effectiveTo: null,
    createdBy: userId,
    updatedBy: userId,
    changeLog: [
      {
        action: "created",
        by: userId,
        at: new Date(),
        changes: { version },
      },
    ],
  });

  return definition;
}

/**
 * Retire form group (soft delete)
 */
async function retireFormGroup(groupId, userId, role, ip, userAgent) {
  const group = await FormGroup.findById(groupId);
  if (!group) {
    throw new Error("Form group not found");
  }
  if (group.retiredAt) {
    throw new Error("Form group is already retired");
  }
  group.retiredAt = new Date();
  await group.save();

  createAuditLog(
    userId,
    "form_group_retired",
    "form_group",
    String(group._id),
    "retired",
    role,
    {
      groupId: String(group._id),
      formType: group.formType,
      industryScope: group.industryScope,
      ip,
      userAgent,
    },
  ).catch((err) =>
    logger.warn("Failed to create audit log for form group retire", {
      err,
    }),
  );

  return group;
}

/**
 * Temporarily deactivate form group
 */
async function deactivateFormGroup(groupId, deactivatedUntil, reason, userId, role, ip, userAgent) {
  const group = await FormGroup.findById(groupId);
  if (!group) {
    throw new Error("Form group not found");
  }
  if (group.retiredAt) {
    throw new Error("Cannot deactivate a retired form group");
  }

  const until = new Date(deactivatedUntil);
  if (until <= new Date()) {
    throw new Error("Deactivated until must be in the future");
  }

  group.deactivatedAt = new Date();
  group.deactivatedUntil = until;
  group.deactivateReason = reason;
  await group.save();

  createAuditLog(
    userId,
    "form_group_deactivated",
    "form_group",
    String(group._id),
    "deactivated",
    role,
    {
      groupId: String(group._id),
      formType: group.formType,
      industryScope: group.industryScope,
      deactivatedUntil: until.toISOString(),
      reason,
      ip,
      userAgent,
    },
  ).catch((err) =>
    logger.warn("Failed to create audit log for form group deactivate", {
      err,
    }),
  );

  return group;
}

/**
 * Reactivate form group
 */
async function reactivateFormGroup(groupId, userId, role, ip, userAgent) {
  const group = await FormGroup.findById(groupId);
  if (!group) {
    throw new Error("Form group not found");
  }

  group.deactivatedAt = null;
  group.deactivatedUntil = null;
  group.deactivateReason = "";
  await group.save();

  createAuditLog(
    userId,
    "form_group_reactivated",
    "form_group",
    String(group._id),
    "reactivated",
    role,
    {
      groupId: String(group._id),
      formType: group.formType,
      industryScope: group.industryScope,
      ip,
      userAgent,
    },
  ).catch((err) =>
    logger.warn("Failed to create audit log for form group reactivate", {
      err,
    }),
  );

  return group;
}

module.exports = {
  // Form Definition CRUD
  listFormDefinitions,
  getFormDefinitionById,
  createFormDefinition,
  updateFormDefinition,
  archiveFormDefinition,
  deleteFormDefinition,
  duplicateFormDefinition,
  setFormDefinitionActive,
  submitForApproval,
  cancelApproval,
  addDownloadToFormDefinition,
  removeDownloadFromFormDefinition,
  getFormDefinitionAuditLog,
  // Form Group Management
  listFormGroups,
  getFormGroupStats,
  getFormGroupWithVersions,
  getFormGroupVersions,
  createFormGroup,
  createFormGroupVersion,
  retireFormGroup,
  deactivateFormGroup,
  reactivateFormGroup,
};
