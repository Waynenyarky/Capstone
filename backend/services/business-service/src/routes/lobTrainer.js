const express = require("express");
const multer = require("multer");
const { requireJwt } = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");
const respond = require("../middleware/respond");
const logger = require("../lib/logger");
const LobTrainingExample = require("../models/LobTrainingExample");
const {
  LINE_OF_BUSINESS,
} = require("../../../../shared/constants/lineOfBusiness");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
}); // 2MB max

const adminOnly = [requireJwt, requireRole(["admin"])];

const VALID_TAX_CODES = new Set(LINE_OF_BUSINESS.map((l) => l.taxCode));
const AUDIT_THRESHOLD = 5;

/** All taxonomy labels (taxCode|detailedLine) */
function getAllTaxonomyLabels() {
  const labels = [];
  for (const lob of LINE_OF_BUSINESS) {
    for (const dl of lob.detailedLines) {
      labels.push(`${lob.taxCode}|${dl}`);
    }
  }
  return labels;
}

function validateExample(body) {
  const { businessDescription, taxCode, detailedLine } = body;
  if (
    !businessDescription ||
    typeof businessDescription !== "string" ||
    businessDescription.trim().length < 10
  ) {
    return "businessDescription must be at least 10 characters";
  }
  if (!taxCode || !VALID_TAX_CODES.has(taxCode)) {
    return `Invalid taxCode. Must be one of: ${[...VALID_TAX_CODES].join(", ")}`;
  }
  const lob = LINE_OF_BUSINESS.find((l) => l.taxCode === taxCode);
  if (!detailedLine || !lob.detailedLines.includes(detailedLine)) {
    return `Invalid detailedLine for taxCode ${taxCode}`;
  }
  return null;
}

// GET /examples — list all training examples (with optional pagination)
router.get("/examples", ...adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : "";
    const taxCodeFilter = req.query.taxCode || "";

    const filter = {};
    if (search) {
      filter.businessDescription = { $regex: search, $options: "i" };
    }
    if (taxCodeFilter && VALID_TAX_CODES.has(taxCodeFilter)) {
      filter.taxCode = taxCodeFilter;
    }

    const [examples, total] = await Promise.all([
      LobTrainingExample.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LobTrainingExample.countDocuments(filter),
    ]);

    return respond.ok(res, 200, {
      examples,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error("Failed to list LOB training examples", {
      error: err.message,
    });
    return respond.error(
      res,
      500,
      "server_error",
      "Failed to list training examples",
    );
  }
});

// GET /examples/export — export all examples as CSV (for backup / bulk edit)
router.get("/examples/export", ...adminOnly, async (req, res) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const limit = Math.min(
      10000,
      Math.max(1, parseInt(req.query.limit, 10) || 10000),
    );
    const examples = await LobTrainingExample.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    if (format === "csv") {
      const header =
        "businessDescription,taxCode,lineOfBusiness,detailedLine,psicCode";
      const escape = (s) => {
        const t = String(s ?? "").replace(/"/g, '""');
        return t.includes(",") || t.includes('"') || t.includes("\n")
          ? `"${t}"`
          : t;
      };
      const rows = examples.map((e) =>
        [
          escape(e.businessDescription),
          e.taxCode,
          e.lineOfBusiness || "",
          e.detailedLine,
          e.psicCode || "",
        ].join(","),
      );
      const csv = [header, ...rows].join("\n");
      return respond.ok(res, 200, {
        csv,
        filename: "lob-training-examples.csv",
      });
    }
    return respond.ok(res, 200, { examples, total: examples.length });
  } catch (err) {
    logger.error("Failed to export LOB training examples", {
      error: err.message,
    });
    return respond.error(res, 500, "server_error", "Failed to export");
  }
});

/** Parse a simple CSV line (handles quoted fields) */
function parseCsvLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length) {
        if (line[end] === '"' && line[end + 1] !== '"') break;
        if (line[end] === '"' && line[end + 1] === '"') end += 2;
        else end += 1;
      }
      out.push(line.slice(i + 1, end).replace(/""/g, '"'));
      i = end + 1;
      if (line[i] === ",") i += 1;
      continue;
    }
    const comma = line.indexOf(",", i);
    if (comma === -1) {
      out.push(line.slice(i).trim());
      break;
    }
    out.push(line.slice(i, comma).trim());
    i = comma + 1;
  }
  return out;
}

// POST /examples/import — bulk import from CSV (max 500 rows)
const IMPORT_MAX = 500;
router.post(
  "/examples/import",
  ...adminOnly,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return respond.error(res, 400, "file_required", "Upload a CSV file");
      }
      const text = req.file.buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        return respond.error(
          res,
          400,
          "validation_error",
          "CSV must have a header row and at least one data row",
        );
      }
      const headerCells = parseCsvLine(lines[0]).map((h) =>
        h.trim().toLowerCase(),
      );
      const descIdx = headerCells.findIndex((h) => h === "businessdescription");
      const taxIdx = headerCells.findIndex((h) => h === "taxcode");
      const dlIdx = headerCells.findIndex((h) => h === "detailedline");
      if (descIdx === -1 || taxIdx === -1 || dlIdx === -1) {
        return respond.error(
          res,
          400,
          "validation_error",
          "CSV must have columns: businessDescription, taxCode, detailedLine",
        );
      }
      const dataLines = lines.slice(1, 1 + IMPORT_MAX);
      let added = 0;
      const errors = [];
      for (let i = 0; i < dataLines.length; i++) {
        const row = parseCsvLine(dataLines[i]);
        const businessDescription = (row[descIdx] ?? "").trim();
        const taxCode = (row[taxIdx] ?? "").trim().toUpperCase();
        const detailedLine = (row[dlIdx] ?? "").trim();
        if (!businessDescription || businessDescription.length < 10) {
          errors.push(`Row ${i + 2}: description too short`);
          continue;
        }
        if (!taxCode || !VALID_TAX_CODES.has(taxCode)) {
          errors.push(`Row ${i + 2}: invalid taxCode`);
          continue;
        }
        const lob = LINE_OF_BUSINESS.find((l) => l.taxCode === taxCode);
        if (
          !lob ||
          !detailedLine ||
          !lob.detailedLines.includes(detailedLine)
        ) {
          errors.push(`Row ${i + 2}: invalid detailedLine for ${taxCode}`);
          continue;
        }
        const idx = lob.detailedLines.indexOf(detailedLine);
        await LobTrainingExample.create({
          businessDescription,
          taxCode,
          lineOfBusiness: lob.lineOfBusiness,
          detailedLine,
          psicCode: lob.psicCodes[idx] || "",
        });
        added += 1;
      }
      return respond.ok(res, 200, {
        added,
        totalRows: dataLines.length,
        skipped: dataLines.length - added,
        errors: errors.slice(0, 20),
      });
    } catch (err) {
      logger.error("Failed to import LOB training examples", {
        error: err.message,
      });
      return respond.error(
        res,
        500,
        "server_error",
        err.message || "Failed to import",
      );
    }
  },
);

// POST /examples — create a new training example
router.post("/examples", ...adminOnly, async (req, res) => {
  try {
    const validationErr = validateExample(req.body);
    if (validationErr) {
      return respond.error(res, 400, "validation_error", validationErr);
    }

    const { businessDescription, taxCode, detailedLine } = req.body;
    const lob = LINE_OF_BUSINESS.find((l) => l.taxCode === taxCode);
    const idx = lob.detailedLines.indexOf(detailedLine);

    const doc = await LobTrainingExample.create({
      businessDescription: businessDescription.trim(),
      taxCode,
      lineOfBusiness: lob.lineOfBusiness,
      detailedLine,
      psicCode: lob.psicCodes[idx] || "",
    });

    return respond.ok(res, 201, { example: doc });
  } catch (err) {
    logger.error("Failed to create LOB training example", {
      error: err.message,
    });
    return respond.error(
      res,
      500,
      "server_error",
      "Failed to create training example",
    );
  }
});

// PUT /examples/:id — update an existing training example
router.put("/examples/:id", ...adminOnly, async (req, res) => {
  try {
    const validationErr = validateExample(req.body);
    if (validationErr) {
      return respond.error(res, 400, "validation_error", validationErr);
    }

    const { businessDescription, taxCode, detailedLine } = req.body;
    const lob = LINE_OF_BUSINESS.find((l) => l.taxCode === taxCode);
    const idx = lob.detailedLines.indexOf(detailedLine);

    const doc = await LobTrainingExample.findByIdAndUpdate(
      req.params.id,
      {
        businessDescription: businessDescription.trim(),
        taxCode,
        lineOfBusiness: lob.lineOfBusiness,
        detailedLine,
        psicCode: lob.psicCodes[idx] || "",
      },
      { new: true, runValidators: true },
    );

    if (!doc) {
      return respond.error(res, 404, "not_found", "Training example not found");
    }

    return respond.ok(res, 200, { example: doc });
  } catch (err) {
    logger.error("Failed to update LOB training example", {
      error: err.message,
    });
    return respond.error(
      res,
      500,
      "server_error",
      "Failed to update training example",
    );
  }
});

// DELETE /examples/:id — delete a training example
router.delete("/examples/:id", ...adminOnly, async (req, res) => {
  try {
    const doc = await LobTrainingExample.findByIdAndDelete(req.params.id);
    if (!doc) {
      return respond.error(res, 404, "not_found", "Training example not found");
    }
    return respond.ok(res, 200, { deleted: true });
  } catch (err) {
    logger.error("Failed to delete LOB training example", {
      error: err.message,
    });
    return respond.error(
      res,
      500,
      "server_error",
      "Failed to delete training example",
    );
  }
});

// POST /train — export all training examples and trigger model retraining
router.post("/train", ...adminOnly, async (req, res) => {
  try {
    const modelServiceUrl = process.env.LOB_MODEL_SERVICE_URL;
    const modelAdminToken = (process.env.LOB_MODEL_ADMIN_TOKEN || "").trim();
    if (!modelServiceUrl) {
      return respond.error(
        res,
        503,
        "service_unavailable",
        "LOB_MODEL_SERVICE_URL is not configured. Set it in the environment and start the Python model service.",
      );
    }
    if (!modelAdminToken) {
      return respond.error(
        res,
        503,
        "service_unavailable",
        "LOB_MODEL_ADMIN_TOKEN is not configured. Set the same token in both business-service and lob-model.",
      );
    }

    const examples = await LobTrainingExample.find().lean();
    if (examples.length < 10) {
      return respond.error(
        res,
        400,
        "insufficient_data",
        `Need at least 10 training examples. Currently have ${examples.length}.`,
      );
    }

    // Group by businessDescription to build the dataset format expected by the training service
    const grouped = {};
    for (const ex of examples) {
      if (!grouped[ex.businessDescription]) {
        grouped[ex.businessDescription] = [];
      }
      grouped[ex.businessDescription].push({
        taxCode: ex.taxCode,
        lineOfBusiness: ex.lineOfBusiness,
        detailedLine: ex.detailedLine,
        psicCode: ex.psicCode,
      });
    }

    const dataset = Object.entries(grouped).map(([desc, recs]) => ({
      businessDescription: desc,
      recommendations: recs,
    }));

    logger.info("Triggering LOB model training", {
      examples: examples.length,
      descriptions: dataset.length,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const trainHeaders = {
      "Content-Type": "application/json",
      "X-LOB-Admin-Token": modelAdminToken,
    };

    const trainRes = await fetch(`${modelServiceUrl}/train`, {
      method: "POST",
      headers: trainHeaders,
      body: JSON.stringify({ dataset }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!trainRes.ok) {
      const body = await trainRes.json().catch(() => ({}));
      logger.error("Model training service returned error", {
        status: trainRes.status,
        body,
      });
      return respond.error(
        res,
        502,
        "training_failed",
        body.error || "Model training service returned an error",
      );
    }

    const result = await trainRes.json();
    logger.info("LOB model training completed", { result });

    return respond.ok(res, 200, {
      success: true,
      message: "Model retrained successfully",
      trainingExamples: examples.length,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return respond.error(
        res,
        504,
        "training_timeout",
        "Model training took too long. Try again or check the Python service.",
      );
    }
    logger.error("Failed to trigger model training", {
      error: err.message,
      stack: err.stack,
    });
    return respond.error(
      res,
      500,
      "server_error",
      "Failed to trigger model training",
    );
  }
});

// GET /stats — training dataset statistics
router.get("/stats", ...adminOnly, async (req, res) => {
  try {
    const total = await LobTrainingExample.countDocuments();
    const byTaxCode = await LobTrainingExample.aggregate([
      { $group: { _id: "$taxCode", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const modelServiceUrl = process.env.LOB_MODEL_SERVICE_URL;
    let modelHealth = null;
    if (modelServiceUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const hRes = await fetch(`${modelServiceUrl}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (hRes.ok) modelHealth = await hRes.json();
      } catch (_) {
        modelHealth = { status: "unreachable" };
      }
    }

    return respond.ok(res, 200, {
      totalExamples: total,
      byTaxCode: byTaxCode.map((b) => ({ taxCode: b._id, count: b.count })),
      modelServiceConfigured: !!modelServiceUrl,
      modelHealth,
    });
  } catch (err) {
    logger.error("Failed to get LOB trainer stats", { error: err.message });
    return respond.error(
      res,
      500,
      "server_error",
      "Failed to get trainer stats",
    );
  }
});

// GET /audit — dataset audit: which labels need more examples (from DB)
router.get("/audit", ...adminOnly, async (req, res) => {
  try {
    let threshold = AUDIT_THRESHOLD;
    const q = req.query.threshold;
    if (q != null && q !== "") {
      const n = parseInt(q, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= 20) threshold = n;
    }

    const taxonomyLabels = getAllTaxonomyLabels();
    const aggregated = await LobTrainingExample.aggregate([
      {
        $group: {
          _id: { taxCode: "$taxCode", detailedLine: "$detailedLine" },
          count: { $sum: 1 },
        },
      },
    ]);
    const countByLabel = {};
    for (const row of aggregated) {
      const label = `${row._id.taxCode}|${row._id.detailedLine}`;
      countByLabel[label] = row.count;
    }

    const missing = [];
    const belowThreshold = [];
    const adequate = [];
    for (const label of taxonomyLabels) {
      const count = countByLabel[label] || 0;
      if (count === 0) {
        missing.push({ label, count: 0 });
      } else if (count < threshold) {
        belowThreshold.push({ label, count });
      } else {
        adequate.push({ label, count });
      }
    }
    belowThreshold.sort((a, b) => a.count - b.count);
    adequate.sort((a, b) => b.count - a.count);

    return respond.ok(res, 200, {
      missing,
      belowThreshold,
      adequate,
      summary: {
        totalLabels: taxonomyLabels.length,
        missingCount: missing.length,
        belowCount: belowThreshold.length,
        adequateCount: adequate.length,
        threshold,
      },
    });
  } catch (err) {
    logger.error("Failed to get LOB audit", { error: err.message });
    return respond.error(res, 500, "server_error", "Failed to get audit");
  }
});

// GET /evaluate — proxy to Python model service evaluation
router.get("/evaluate", ...adminOnly, async (req, res) => {
  try {
    const modelServiceUrl = process.env.LOB_MODEL_SERVICE_URL;
    const modelAdminToken = (process.env.LOB_MODEL_ADMIN_TOKEN || "").trim();
    if (!modelServiceUrl) {
      return respond.error(
        res,
        503,
        "service_unavailable",
        "LOB_MODEL_SERVICE_URL is not configured. Start the Python model service to run evaluation.",
      );
    }
    if (!modelAdminToken) {
      return respond.error(
        res,
        503,
        "service_unavailable",
        "LOB_MODEL_ADMIN_TOKEN is not configured. Set the same token in both business-service and lob-model.",
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const evalRes = await fetch(`${modelServiceUrl}/evaluate`, {
      signal: controller.signal,
      headers: {
        "X-LOB-Admin-Token": modelAdminToken,
      },
    });
    clearTimeout(timeout);
    if (!evalRes.ok) {
      const body = await evalRes.json().catch(() => ({}));
      return respond.error(
        res,
        evalRes.status === 503 ? 503 : 502,
        "evaluation_unavailable",
        body.error || "Model evaluation failed or model not loaded.",
      );
    }
    const data = await evalRes.json();
    return respond.ok(res, 200, data);
  } catch (err) {
    if (err.name === "AbortError") {
      return respond.error(
        res,
        504,
        "evaluation_timeout",
        "Evaluation took too long.",
      );
    }
    logger.error("Failed to get LOB evaluation", { error: err.message });
    return respond.error(res, 500, "server_error", "Failed to get evaluation");
  }
});

// GET /gemini-status — check if Gemini API is usable (for LOB recommendations and help tips)
const GEMINI_LOB_MODEL = process.env.GEMINI_LOB_MODEL || "gemini-2.5-flash";
router.get("/gemini-status", ...adminOnly, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return respond.ok(res, 200, {
        configured: false,
        ok: false,
        reason: "not_configured",
        message: "GEMINI_API_KEY is not set",
      });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_LOB_MODEL });
    const result = await model.generateContent("Reply with exactly: OK");
    const text = result?.response?.text?.()?.trim?.();
    if (text) {
      return respond.ok(res, 200, {
        configured: true,
        ok: true,
        model: GEMINI_LOB_MODEL,
      });
    }
    return respond.ok(res, 200, {
      configured: true,
      ok: false,
      reason: "empty_response",
      model: GEMINI_LOB_MODEL,
    });
  } catch (err) {
    const msg = err.message || "";
    let reason = "error";
    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("Too Many Requests")
    )
      reason = "quota_exceeded";
    else if (msg.includes("404") || msg.includes("not found"))
      reason = "model_not_found";
    logger.warn("Gemini status check failed", { reason, error: err.message });
    return respond.ok(res, 200, {
      configured: !!process.env.GEMINI_API_KEY,
      ok: false,
      reason,
      message: err.message || "Gemini check failed",
      model: GEMINI_LOB_MODEL,
    });
  }
});

module.exports = router;
