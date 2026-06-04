const axios = require("axios");

const ADMIN_SERVICE_URL =
  process.env.ADMIN_SERVICE_URL || "http://localhost:3003";
let containedUserIds = new Set();
let lastRefresh = 0;
const REFRESH_INTERVAL_MS = 60_000;

async function refreshContainedUsers() {
  if (Date.now() - lastRefresh < REFRESH_INTERVAL_MS) return;
  try {
    const headers = {};
    if (process.env.AUDIT_SERVICE_API_KEY)
      headers["X-API-Key"] = process.env.AUDIT_SERVICE_API_KEY;
    const res = await axios.get(
      `${ADMIN_SERVICE_URL}/api/admin/tamper/incidents/contained-users`,
      {
        headers,
        timeout: 5000,
      },
    );
    containedUserIds = new Set(res.data?.userIds || []);
    lastRefresh = Date.now();
  } catch {
    // Keep stale cache on failure
  }
}

function containmentCheck(req, res, next) {
  refreshContainedUsers()
    .then(() => {
      if (req._userId && containedUserIds.has(String(req._userId))) {
        return res.status(423).json({
          success: false,
          error:
            "Account temporarily restricted due to a security investigation. Contact an administrator.",
          code: "ACCOUNT_CONTAINED",
        });
      }
      next();
    })
    .catch(() => next());
}

module.exports = { containmentCheck };
