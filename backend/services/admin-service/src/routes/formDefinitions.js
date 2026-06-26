const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  requireJwt,
  requireRole,
  requireAdminStepUp,
} = require("../middleware/auth");
const { validateBody, Joi } = require("../middleware/validation");
const respond = require("../middleware/respond");
const logger = require("../lib/logger");
const {
  INDUSTRY_SCOPE_VALUES,
  BUSINESS_TYPE_VALUES,
  INDUSTRY_SCOPE_LABELS,
} = require("../../../../shared/constants");
const formDefinitionService = require("../services/formDefinitionService");

const router = express.Router();

// Setup file upload storage
const formTemplatesRoot = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "uploads",
  "form-templates",
);
const ensureDir = (dir) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_) {}
};

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params;
    const formDir = path.join(formTemplatesRoot, id || "unknown");
    ensureDir(formDir);
    cb(null, formDir);
  },
  filename: (req, file, cb) => {
    const safeOriginal = (file.originalname || "file").replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );
    const stamp = Date.now();
    cb(null, `template_${stamp}_${safeOriginal}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow only PDFs and common document types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.match(/\.(pdf|doc|docx|xls|xlsx)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, XLS, XLSX files are allowed"), false);
    }
  },
});

// Validation schemas
const requirementItemSchema = Joi.object({
  label: Joi.string().required(),
  required: Joi.boolean().optional(),
  notes: Joi.string().allow("", null).optional(),
  type: Joi.string()
    .valid(
      "text",
      "textarea",
      "number",
      "date",
      "select",
      "multiselect",
      "file",
      "download",
      "checkbox",
      "address",
      "address_alaminos",
      "repeatable_group",
      "ai_lob_recommendation",
    )
    .optional(),
  placeholder: Joi.string().allow("", null).optional(),
  helpText: Joi.string().allow("", null).optional(),
  span: Joi.number().min(1).max(24).optional(),
  validation: Joi.object().unknown(true).optional(),
  dropdownSource: Joi.string().allow("", null).optional(),
  dropdownOptions: Joi.array().items(Joi.string()).optional(),
  downloadFileName: Joi.string().allow("", null).optional(),
  downloadFileSize: Joi.number().optional(),
  downloadFileType: Joi.string().allow("", null).optional(),
  downloadFileUrl: Joi.string().allow("", null).optional(),
  downloadIpfsCid: Joi.string().allow("", null).optional(),
});

const sectionSchema = Joi.object({
  category: Joi.string().required(),
  source: Joi.string().allow("", null).optional(),
  items: Joi.array().items(requirementItemSchema).optional(),
  notes: Joi.string().allow("", null).optional(),
});

const downloadSchema = Joi.object({
  label: Joi.string().required(),
  fileUrl: Joi.string().required(),
  ipfsCid: Joi.string().allow("", null).optional(),
  fileType: Joi.string().optional(),
  fileSize: Joi.number().optional(),
  uploadedAt: Joi.date().optional(),
});

const createFormDefinitionSchema = Joi.object({
  formType: Joi.string()
    .valid(
      "permit",
      "general_permit",
      "renewal",
      "cessation",
      "violation",
      "appeal",
      "inspections",
    )
    .required(),
  version: Joi.string().required(),
  name: Joi.string().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),
  businessTypes: Joi.array()
    .items(Joi.string().valid(...BUSINESS_TYPE_VALUES))
    .optional(),
  lguCodes: Joi.array().items(Joi.string()).optional(),
  sections: Joi.array().items(sectionSchema).optional(),
  downloads: Joi.array().items(downloadSchema).optional(),
  effectiveFrom: Joi.date().allow(null).optional(),
  effectiveTo: Joi.date().allow(null).optional(),
});

const updateFormDefinitionSchema = Joi.object({
  version: Joi.string().optional(),
  name: Joi.string().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),
  businessTypes: Joi.array()
    .items(Joi.string().valid(...BUSINESS_TYPE_VALUES))
    .optional(),
  lguCodes: Joi.array().items(Joi.string()).optional(),
  sections: Joi.array().items(sectionSchema).optional(),
  downloads: Joi.array().items(downloadSchema).optional(),
  effectiveFrom: Joi.date().allow(null).optional(),
  effectiveTo: Joi.date().allow(null).optional(),
});

// GET /api/admin/forms - List form definitions
router.get("/", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const { formType, status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (formType) filter.formType = formType;
    if (status) filter.status = status;
    if (search && String(search).trim()) {
      const raw = String(search).trim();
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { version: { $regex: escaped, $options: "i" } },
        { formType: { $regex: escaped, $options: "i" } },
      ];
    }

    const result = await formDefinitionService.listFormDefinitions(filter, page, limit);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("GET /api/admin/forms error:", err);
    return respond.error(
      res,
      500,
      "form_list_failed",
      "Failed to load form definitions",
    );
  }
});

// --- Form Groups (must be before /:id) ---

const createFormGroupSchema = Joi.object({
  formType: Joi.string()
    .valid(
      "permit",
      "general_permit",
      "renewal",
      "cessation",
      "violation",
      "appeal",
      "inspections",
    )
    .required(),
  industryScope: Joi.string()
    .valid(...INDUSTRY_SCOPE_VALUES)
    .default("all"),
});

// GET /api/admin/forms/groups - List form groups for table
router.get("/groups", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      formType,
      industryScope,
      search,
      page = 1,
      limit = 50,
      includeRetired = "false",
    } = req.query;

    const filter = {};
    if (formType) filter.formType = formType;
    if (industryScope) filter.industryScope = industryScope;
    if (includeRetired !== "true") filter.retiredAt = null;
    if (search && String(search).trim()) {
      const raw = String(search).trim();
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { displayName: { $regex: escaped, $options: "i" } },
        { formType: { $regex: escaped, $options: "i" } },
        { industryScope: { $regex: escaped, $options: "i" } },
      ];
    }

    const result = await formDefinitionService.listFormGroups(filter, page, limit);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("GET /api/admin/forms/groups error:", err);
    return respond.error(
      res,
      500,
      "form_groups_list_failed",
      "Failed to load form groups",
    );
  }
});

// GET /api/admin/forms/audit-log - Recent form definition change activity
router.get(
  "/audit-log",
  requireJwt,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const entries = await formDefinitionService.getFormDefinitionAuditLog(limit);
      return res.json({ success: true, entries });
    } catch (err) {
      console.error("GET /api/admin/forms/audit-log error:", err);
      return respond.error(
        res,
        500,
        "audit_log_failed",
        "Failed to load audit log",
      );
    }
  },
);

// GET /api/admin/forms/groups/stats - Counts for activated, deactivated, retired
router.get(
  "/groups/stats",
  requireJwt,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const stats = await formDefinitionService.getFormGroupStats();
      return res.json({ success: true, stats });
    } catch (err) {
      console.error("GET /api/admin/forms/groups/stats error:", err);
      return respond.error(
        res,
        500,
        "form_groups_stats_failed",
        "Failed to load form group stats",
      );
    }
  },
);

// GET /api/admin/forms/groups/:groupId - Get group + all versions
router.get(
  "/groups/:groupId",
  requireJwt,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const result = await formDefinitionService.getFormGroupWithVersions(req.params.groupId);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error("GET /api/admin/forms/groups/:groupId error:", err);
      if (err.message === "Form group not found") {
        return respond.error(res, 404, "form_group_not_found", err.message);
      }
      return respond.error(
        res,
        500,
        "form_group_get_failed",
        "Failed to load form group",
      );
    }
  },
);

// POST /api/admin/forms/groups - Create form group + first draft version
router.post(
  "/groups",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  validateBody(createFormGroupSchema),
  async (req, res) => {
    try {
      const userId = req._userId;
      const { formType, industryScope = "all" } = req.body;

      const result = await formDefinitionService.createFormGroup(formType, industryScope, userId);
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      console.error("POST /api/admin/forms/groups error:", err);
      if (err.message === "A form group with this type and industry already exists") {
        return respond.error(res, 400, "form_group_exists", err.message);
      }
      return respond.error(
        res,
        500,
        "form_group_create_failed",
        "Failed to create form group",
      );
    }
  },
);

// GET /api/admin/forms/groups/:groupId/versions - List versions (same as GET group, but versions only)
router.get(
  "/groups/:groupId/versions",
  requireJwt,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const versions = await formDefinitionService.getFormGroupVersions(req.params.groupId);
      return res.json({ success: true, versions });
    } catch (err) {
      console.error(
        "GET /api/admin/forms/groups/:groupId/versions error:",
        err,
      );
      if (err.message === "Form group not found") {
        return respond.error(res, 404, "form_group_not_found", err.message);
      }
      return respond.error(
        res,
        500,
        "form_versions_list_failed",
        "Failed to load versions",
      );
    }
  },
);

// POST /api/admin/forms/groups/:groupId/versions - Create new version (draft)
router.post(
  "/groups/:groupId/versions",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const definition = await formDefinitionService.createFormGroupVersion(req.params.groupId, userId);
      return res.status(201).json({ success: true, definition });
    } catch (err) {
      console.error(
        "POST /api/admin/forms/groups/:groupId/versions error:",
        err,
      );
      if (err.message === "Form group not found") {
        return respond.error(res, 404, "form_group_not_found", err.message);
      }
      return respond.error(
        res,
        500,
        "form_version_create_failed",
        "Failed to create version",
      );
    }
  },
);

// POST /api/admin/forms/groups/:groupId/retire - Retire form group (soft)
router.post(
  "/groups/:groupId/retire",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const role = req._userRole || "admin";
      const group = await formDefinitionService.retireFormGroup(
        req.params.groupId,
        userId,
        role,
        req.ip,
        req.get("user-agent"),
      );
      return res.json({ success: true, group });
    } catch (err) {
      console.error("POST /api/admin/forms/groups/:groupId/retire error:", err);
      if (err.message === "Form group not found") {
        return respond.error(res, 404, "form_group_not_found", err.message);
      }
      if (err.message === "Form group is already retired") {
        return respond.error(res, 400, "already_retired", err.message);
      }
      return respond.error(
        res,
        500,
        "retire_failed",
        "Failed to retire form group",
      );
    }
  },
);

// POST /api/admin/forms/groups/:groupId/deactivate - Temporarily deactivate form group
const deactivateSchema = Joi.object({
  deactivatedUntil: Joi.date().iso().required(),
  reason: Joi.string().allow("").optional(),
});
router.post(
  "/groups/:groupId/deactivate",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  validateBody(deactivateSchema),
  async (req, res) => {
    try {
      const userId = req._userId;
      const role = req._userRole || "admin";
      const { deactivatedUntil, reason = "" } = req.body;
      const group = await formDefinitionService.deactivateFormGroup(
        req.params.groupId,
        deactivatedUntil,
        reason,
        userId,
        role,
        req.ip,
        req.get("user-agent"),
      );
      return res.json({ success: true, group });
    } catch (err) {
      console.error(
        "POST /api/admin/forms/groups/:groupId/deactivate error:",
        err,
      );
      if (err.message === "Form group not found") {
        return respond.error(res, 404, "form_group_not_found", err.message);
      }
      if (err.message === "Cannot deactivate a retired form group") {
        return respond.error(res, 400, "cannot_deactivate_retired", err.message);
      }
      if (err.message === "Deactivated until must be in the future") {
        return respond.error(res, 400, "invalid_date", err.message);
      }
      return respond.error(
        res,
        500,
        "deactivate_failed",
        "Failed to deactivate form group",
      );
    }
  },
);

// POST /api/admin/forms/groups/:groupId/reactivate - Reactivate form group
router.post(
  "/groups/:groupId/reactivate",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const role = req._userRole || "admin";
      const group = await formDefinitionService.reactivateFormGroup(
        req.params.groupId,
        userId,
        role,
        req.ip,
        req.get("user-agent"),
      );
      return res.json({ success: true, group });
    } catch (err) {
      console.error(
        "POST /api/admin/forms/groups/:groupId/reactivate error:",
        err,
      );
      if (err.message === "Form group not found") {
        return respond.error(res, 404, "form_group_not_found", err.message);
      }
      return respond.error(
        res,
        500,
        "reactivate_failed",
        "Failed to reactivate form group",
      );
    }
  },
);

// PUT /api/admin/forms/:id/set-active - Set version as active (publish it, archive previous)
router.put(
  "/:id/set-active",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const definition = await formDefinitionService.setFormDefinitionActive(req.params.id, userId);
      return res.json({ success: true, definition });
    } catch (err) {
      console.error("PUT /api/admin/forms/:id/set-active error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "Only draft versions can be set as active") {
        return respond.error(res, 400, "form_not_draft", err.message);
      }
      if (err.message === "Add at least one section before publishing") {
        return respond.error(res, 400, "form_no_sections", err.message);
      }
      return respond.error(
        res,
        500,
        "set_active_failed",
        "Failed to set version as active",
      );
    }
  },
);

// GET /api/admin/forms/:id - Get single form definition
router.get("/:id", requireJwt, requireRole(["admin"]), async (req, res) => {
  try {
    const definition = await formDefinitionService.getFormDefinitionById(req.params.id);
    if (!definition) {
      return respond.error(
        res,
        404,
        "form_not_found",
        "Form definition not found",
      );
    }
    return res.json({ success: true, definition });
  } catch (err) {
    console.error("GET /api/admin/forms/:id error:", err);
    return respond.error(
      res,
      500,
      "form_get_failed",
      "Failed to load form definition",
    );
  }
});

// POST /api/admin/forms - Create new form definition (draft)
router.post(
  "/",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  validateBody(createFormDefinitionSchema),
  async (req, res) => {
    try {
      const userId = req._userId;
      const definition = await formDefinitionService.createFormDefinition(req.body, userId);
      return res.status(201).json({ success: true, definition });
    } catch (err) {
      console.error("POST /api/admin/forms error:", err);
      return respond.error(
        res,
        500,
        "form_create_failed",
        "Failed to create form definition",
      );
    }
  },
);

// PUT /api/admin/forms/:id - Update form definition (draft only)
router.put(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  validateBody(updateFormDefinitionSchema),
  async (req, res) => {
    try {
      const userId = req._userId;
      const definition = await formDefinitionService.updateFormDefinition(req.params.id, req.body, userId);
      return res.json({ success: true, definition });
    } catch (err) {
      console.error("PUT /api/admin/forms/:id error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "Only draft form definitions can be edited") {
        return respond.error(res, 400, "form_not_editable", err.message);
      }
      return respond.error(
        res,
        500,
        "form_update_failed",
        "Failed to update form definition",
      );
    }
  },
);

// POST /api/admin/forms/:id/submit-for-approval - Submit form definition for 2-admin approval
router.post(
  "/:id/submit-for-approval",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const { definition, approval } = await formDefinitionService.submitForApproval(req.params.id, userId);
      return res.json({
        success: true,
        definition,
        approval: {
          approvalId: approval.approvalId,
          status: approval.status,
          requiredApprovals: approval.requiredApprovals,
        },
      });
    } catch (err) {
      console.error(
        "POST /api/admin/forms/:id/submit-for-approval error:",
        err,
      );
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message.includes("cannot be submitted for approval")) {
        return respond.error(res, 400, "form_cannot_submit", err.message);
      }
      return respond.error(
        res,
        500,
        "submit_approval_failed",
        "Failed to submit form for approval",
      );
    }
  },
);

// POST /api/admin/forms/:id/cancel-approval - Cancel pending approval and return to draft
router.post(
  "/:id/cancel-approval",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const definition = await formDefinitionService.cancelApproval(req.params.id, userId);
      return res.json({ success: true, definition });
    } catch (err) {
      console.error("POST /api/admin/forms/:id/cancel-approval error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "Form definition is not pending approval") {
        return respond.error(res, 400, "not_pending", err.message);
      }
      return respond.error(
        res,
        500,
        "cancel_failed",
        "Failed to cancel approval",
      );
    }
  },
);

// POST /api/admin/forms/:id/archive - Archive a form definition
router.post(
  "/:id/archive",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const definition = await formDefinitionService.archiveFormDefinition(req.params.id, userId);
      return res.json({ success: true, definition });
    } catch (err) {
      console.error("POST /api/admin/forms/:id/archive error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "This form definition cannot be archived") {
        return respond.error(res, 400, "form_cannot_archive", err.message);
      }
      return respond.error(
        res,
        500,
        "form_archive_failed",
        "Failed to archive form definition",
      );
    }
  },
);

// POST /api/admin/forms/:id/duplicate - Duplicate a form definition as a new draft
router.post(
  "/:id/duplicate",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const duplicate = await formDefinitionService.duplicateFormDefinition(req.params.id, userId);
      return res.status(201).json({ success: true, definition: duplicate });
    } catch (err) {
      console.error("POST /api/admin/forms/:id/duplicate error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      return respond.error(
        res,
        500,
        "form_duplicate_failed",
        "Failed to duplicate form definition",
      );
    }
  },
);

// POST /api/admin/forms/:id/upload - Upload template file
router.post(
  "/:id/upload",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  upload.single("file"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return respond.error(res, 400, "file_required", "No file uploaded");
      }

      const { validateMagicBytes } = require("../lib/fileValidator");
      const magicCheck = await validateMagicBytes(
        req.file.path,
        req.file.mimetype,
      );
      if (!magicCheck.valid) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (_) {}
        return respond.error(
          res,
          400,
          "invalid_file_content",
          magicCheck.error || "File content does not match declared file type",
        );
      }

      const { scanFile } = require("../../../../shared/fileScan");
      const scanResult = await scanFile(req.file.path);
      if (!scanResult.clean) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (_) {}
        return respond.error(
          res,
          400,
          "file_rejected",
          "File could not be accepted. Please try a different file.",
        );
      }

      // Try IPFS upload if available
      let ipfsService = null;
      try {
        ipfsService = require("../lib/ipfsService");
        if (!ipfsService.isAvailable()) {
          await ipfsService.initialize();
        }
      } catch (err) {
        logger.warn("IPFS service not available for form template upload", {
          error: err.message,
        });
      }

      let fileUrl, ipfsCid;

      if (ipfsService && ipfsService.isAvailable()) {
        try {
          const fileBuffer = await fs.promises.readFile(req.file.path);
          const fileName =
            req.file.originalname || path.basename(req.file.path);
          const { cid, size } = await ipfsService.uploadFile(
            fileBuffer,
            fileName,
          );

          await ipfsService.pinFile(cid).catch((err) => {
            logger.warn("Failed to pin template to IPFS", {
              cid,
              error: err.message,
            });
          });

          fileUrl = ipfsService.getGatewayUrl(cid);
          ipfsCid = cid;

          // Delete local file after IPFS upload
          try {
            await fs.promises.unlink(req.file.path);
          } catch (_) {}

          logger.info("Form template uploaded to IPFS", { cid, formId: id });
        } catch (ipfsErr) {
          logger.error("IPFS upload failed for form template", {
            error: ipfsErr.message,
          });
          // Fall through to local storage
        }
      }

      // Fallback to local storage
      if (!fileUrl) {
        const filename = path.basename(req.file.path);
        fileUrl = `/uploads/form-templates/${id}/${filename}`;
        ipfsCid = "";
        logger.info("Form template saved to local storage", {
          url: fileUrl,
          formId: id,
        });
      }

      // Add to downloads array via service
      const downloadEntry = {
        label: req.body.label || req.file.originalname || "Template",
        fileUrl,
        ipfsCid: ipfsCid || "",
        fileType:
          path.extname(req.file.originalname || "").replace(".", "") || "pdf",
        fileSize: req.file.size,
        uploadedAt: new Date(),
      };

      const result = await formDefinitionService.addDownloadToFormDefinition(id, downloadEntry, req._userId);
      return res.json({
        success: true,
        download: result.download,
        definition: result.definition,
      });
    } catch (err) {
      console.error("POST /api/admin/forms/:id/upload error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "Only draft form definitions can have files uploaded") {
        return respond.error(res, 400, "form_not_editable", err.message);
      }
      return respond.error(
        res,
        500,
        "upload_failed",
        err.message || "Failed to upload file",
      );
    }
  },
);

// DELETE /api/admin/forms/:id - Delete draft form definition
router.delete(
  "/:id",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const userId = req._userId;
      const role = req._userRole || "admin";
      await formDefinitionService.deleteFormDefinition(
        req.params.id,
        userId,
        role,
        req.ip,
        req.get("user-agent"),
      );
      return res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/admin/forms/:id error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "Only draft form definitions can be deleted") {
        return respond.error(res, 400, "form_not_editable", err.message);
      }
      return respond.error(
        res,
        500,
        "form_delete_failed",
        "Failed to delete form definition",
      );
    }
  },
);

// DELETE /api/admin/forms/:id/downloads/:index - Remove a download from form definition
router.delete(
  "/:id/downloads/:index",
  requireJwt,
  requireRole(["admin"]),
  requireAdminStepUp,
  async (req, res) => {
    try {
      const { id, index } = req.params;
      const result = await formDefinitionService.removeDownloadFromFormDefinition(id, index, req._userId);
      if (result.formDeleted) {
        return res.json({
          success: true,
          removed: result.removed,
          formDeleted: true,
          message: "Download removed and empty form definition deleted",
        });
      }
      return res.json({ success: true, removed: result.removed, definition: result.definition });
    } catch (err) {
      console.error("DELETE /api/admin/forms/:id/downloads/:index error:", err);
      if (err.message === "Form definition not found") {
        return respond.error(res, 404, "form_not_found", err.message);
      }
      if (err.message === "Only draft form definitions can have downloads removed") {
        return respond.error(res, 400, "form_not_editable", err.message);
      }
      if (err.message === "Invalid download index") {
        return respond.error(res, 400, "invalid_index", err.message);
      }
      return respond.error(
        res,
        500,
        "remove_download_failed",
        "Failed to remove download",
      );
    }
  },
);

module.exports = router;
