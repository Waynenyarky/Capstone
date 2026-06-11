const express = require("express");
const router = express.Router();
const respond = require("../middleware/respond");
const ApplicationProcess = require("../models/ApplicationProcess");

// Simple in-memory cache for public endpoint
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// GET /api/public/application-processes — fetch all published processes
router.get("/", async (req, res) => {
  try {
    const cacheKey = "all-published";
    const cached = getCached(cacheKey);
    if (cached) {
      return respond.success(res, 200, cached);
    }

    const processes = await ApplicationProcess.find({
      status: "published",
    })
      .sort({ applicationType: 1 })
      .lean();

    setCache(cacheKey, processes);
    return respond.success(res, 200, processes);
  } catch (err) {
    return respond.error(res, 500, "fetch_error", err.message);
  }
});

// GET /api/public/application-processes/:applicationType — fetch active process for landing page
router.get("/:applicationType", async (req, res) => {
  try {
    const { applicationType } = req.params;
    const cacheKey = `type-${applicationType}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return respond.success(res, 200, cached);
    }

    const process = await ApplicationProcess.findActive(applicationType);
    if (!process) {
      return respond.error(
        res,
        404,
        "not_found",
        `No published application process found for type: ${applicationType}`,
      );
    }

    setCache(cacheKey, process);
    return respond.success(res, 200, process);
  } catch (err) {
    return respond.error(res, 500, "fetch_error", err.message);
  }
});

module.exports = router;
