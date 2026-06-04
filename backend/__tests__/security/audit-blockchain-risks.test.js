const request = require("supertest");
const express = require("express");
const crypto = require("crypto");
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { createTestUsers, getTestTokens } = require("../helpers/fixtures");
const { cleanupTestData } = require("../helpers/cleanup");

/**
 * Build a lightweight express app that mounts the audit routes with
 * mocked auth so we can test rate-limiting and verify logic without
 * requiring the full audit-service startup or blockchain connection.
 */
function buildAuditTestApp() {
  const app = express();
  app.use(express.json());

  const {
    auditVerifyRateLimit,
    auditLogRateLimit,
  } = require("../../services/audit-service/src/middleware/rateLimit");
  const respond = require("../../services/audit-service/src/middleware/respond");

  const fakeAuth = (req, _res, next) => {
    req._userId = req.headers["x-test-user-id"] || "test-user";
    req._userEmail = req.headers["x-test-user-email"] || "test@example.com";
    req._userRole = req.headers["x-test-user-role"] || "business_owner";
    next();
  };

  const mockBlockchain = {
    verifyHash(hash) {
      const knownHashes = {
        [crypto.createHash("sha256").update("known-data").digest("hex")]: {
          exists: true,
          timestamp: Date.now(),
        },
      };
      return Promise.resolve(knownHashes[hash] || { exists: false });
    },
  };

  // ── GET /api/audit/verify/:auditLogId ──
  app.get(
    "/api/audit/verify/:auditLogId",
    fakeAuth,
    auditVerifyRateLimit(),
    async (req, res) => {
      return res.json({
        success: true,
        verified: false,
        auditLog: { id: req.params.auditLogId },
      });
    },
  );

  // ── POST /api/audit/verify-data (mirrors real route logic) ──
  app.post(
    "/api/audit/verify-data",
    fakeAuth,
    auditVerifyRateLimit(),
    async (req, res) => {
      try {
        const { data } = req.body;
        if (data == null || (typeof data === "string" && !data.trim())) {
          return respond.error(
            res,
            400,
            "missing_data",
            'Request body must include "data" (string) to verify',
          );
        }
        const dataStr =
          typeof data === "object" ? JSON.stringify(data) : String(data);
        const hash = crypto.createHash("sha256").update(dataStr).digest("hex");
        const verifyResult = await mockBlockchain.verifyHash(hash);

        return res.json({
          success: true,
          verified: verifyResult.exists || false,
          hash,
          blockchain: {
            exists: verifyResult.exists,
            timestamp: verifyResult.timestamp,
          },
        });
      } catch (err) {
        return respond.error(
          res,
          500,
          "verification_failed",
          "Failed to verify data",
        );
      }
    },
  );

  // ── POST /api/audit/log (for rate limit test) ──
  app.post("/api/audit/log", auditLogRateLimit(), async (req, res) => {
    return res.json({ success: true, queued: true });
  });

  return app;
}

describe("Audit & Blockchain Risks — Platform Technology Risk Mitigations", () => {
  let app;

  beforeAll(() => {
    setupTestEnvironment();
    app = buildAuditTestApp();
  });

  // ───────────────────────────────────────────────────────────────
  // 3.7  Rate limit bypass (audit log)
  // ───────────────────────────────────────────────────────────────
  describe("Risk 3.7 — Audit Log Rate Limit", () => {
    it("[Normal] single audit log request succeeds", async () => {
      const res = await request(app)
        .post("/api/audit/log")
        .set("x-service-id", "test-service-normal")
        .send({ operation: "storeHash", params: ["abc", "test_event"] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("[Edge] 21st audit log request within window returns 429", async () => {
      const serviceId = `rate-test-audit-${Date.now()}`;
      const promises = [];
      for (let i = 0; i < 22; i++) {
        promises.push(
          request(app)
            .post("/api/audit/log")
            .set("x-service-id", serviceId)
            .send({
              operation: "storeHash",
              params: [`hash_${i}`, "test_event"],
            }),
        );
      }

      const results = await Promise.all(promises);
      const statuses = results.map((r) => r.status);
      expect(statuses.filter((s) => s === 200).length).toBeLessThanOrEqual(20);
      expect(statuses).toContain(429);
    });

    it("[Attack] sustained burst above 20/min is rate limited", async () => {
      const serviceId = `burst-test-${Date.now()}`;
      const results = [];
      for (let i = 0; i < 25; i++) {
        const res = await request(app)
          .post("/api/audit/log")
          .set("x-service-id", serviceId)
          .send({
            operation: "storeHash",
            params: [`hash_${i}`, "test_event"],
          });
        results.push(res.status);
      }

      const rateLimited = results.filter((s) => s === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 3.9  Hash enumeration
  // ───────────────────────────────────────────────────────────────
  describe("Risk 3.9 — Hash Enumeration", () => {
    it("[Normal] single verify request succeeds", async () => {
      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "enum-user-1")
        .send({ data: "known-data" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("[Normal] verify-data returns verified:true for known data", async () => {
      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "enum-user-known")
        .send({ data: "known-data" });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
    });

    it("[Normal] verify-data returns verified:false for unknown data", async () => {
      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "enum-user-unknown")
        .send({ data: "unknown-random-data-12345" });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(false);
    });

    it("[Edge] verify requests at rate limit boundary return 429", async () => {
      const userId = `enum-boundary-${Date.now()}`;
      const promises = [];
      for (let i = 0; i < 35; i++) {
        promises.push(
          request(app)
            .post("/api/audit/verify-data")
            .set("x-test-user-id", userId)
            .send({ data: `test-data-${i}` }),
        );
      }

      const results = await Promise.all(promises);
      const statuses = results.map((r) => r.status);
      expect(statuses.filter((s) => s === 200).length).toBeLessThanOrEqual(30);
      expect(statuses).toContain(429);
    });

    it("[Attack] rapid enumeration via GET verify is rate limited", async () => {
      const userId = `enum-get-${Date.now()}`;
      const promises = [];
      for (let i = 0; i < 35; i++) {
        promises.push(
          request(app)
            .get(
              `/api/audit/verify/6500000000000000000000${String(i).padStart(2, "0")}`,
            )
            .set("x-test-user-id", userId),
        );
      }

      const results = await Promise.all(promises);
      const statuses = results.map((r) => r.status);
      expect(statuses).toContain(429);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 3.10  Replay / verification spoofing
  // ───────────────────────────────────────────────────────────────
  describe("Risk 3.10 — Replay / Verification Spoofing", () => {
    it("[Normal] verify-data recomputes hash from supplied data", async () => {
      const data = "test-replay-data";
      const expectedHash = crypto
        .createHash("sha256")
        .update(data)
        .digest("hex");

      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "replay-user-1")
        .send({ data });

      expect(res.status).toBe(200);
      expect(res.body.hash).toBe(expectedHash);
    });

    it("[Edge] same data sent twice produces identical hash", async () => {
      const data = "idempotent-data-check";

      const res1 = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "replay-user-2a")
        .send({ data });

      const res2 = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "replay-user-2b")
        .send({ data });

      expect(res1.body.hash).toBe(res2.body.hash);
    });

    it('[Attack] client-supplied "hash" field in body is ignored', async () => {
      const data = "spoofed-data-test";
      const expectedHash = crypto
        .createHash("sha256")
        .update(data)
        .digest("hex");
      const fakeHash =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "replay-user-spoof")
        .send({ data, hash: fakeHash });

      expect(res.status).toBe(200);
      expect(res.body.hash).toBe(expectedHash);
      expect(res.body.hash).not.toBe(fakeHash);
    });

    it("[Attack] empty data is rejected", async () => {
      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "replay-user-empty")
        .send({ data: "" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("missing_data");
    });

    it("[Attack] object data is stringified and hashed server-side", async () => {
      const data = { foo: "bar", baz: 123 };
      const expectedHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");

      const res = await request(app)
        .post("/api/audit/verify-data")
        .set("x-test-user-id", "replay-user-obj")
        .send({ data });

      expect(res.status).toBe(200);
      expect(res.body.hash).toBe(expectedHash);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 3.2  Malicious document upload (magic-byte validation)
  // ───────────────────────────────────────────────────────────────
  describe("Risk 3.2 — Malicious Document Upload (magic-byte validator)", () => {
    const {
      validateMagicBytes,
    } = require("../../services/admin-service/src/lib/fileValidator");
    const fs = require("fs");
    const os = require("os");
    const path = require("path");

    function writeTempFile(buffer) {
      const tmpPath = path.join(
        os.tmpdir(),
        `test-magic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      fs.writeFileSync(tmpPath, buffer);
      return tmpPath;
    }

    afterEach(() => {
      // Cleanup is handled per-test below
    });

    it("[Normal] valid PDF file passes magic-byte check", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 fake pdf content");
      const tmpPath = writeTempFile(pdfBuffer);
      try {
        const result = await validateMagicBytes(tmpPath, "application/pdf");
        expect(result.valid).toBe(true);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("[Normal] valid DOCX (PK zip) passes magic-byte check", async () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const tmpPath = writeTempFile(docxBuffer);
      try {
        const result = await validateMagicBytes(
          tmpPath,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        expect(result.valid).toBe(true);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("[Edge] unknown MIME type is allowed (no magic bytes defined)", async () => {
      const buffer = Buffer.from("random content");
      const tmpPath = writeTempFile(buffer);
      try {
        const result = await validateMagicBytes(tmpPath, "text/plain");
        expect(result.valid).toBe(true);
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("[Attack] .pdf extension with non-PDF magic bytes is rejected", async () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      const tmpPath = writeTempFile(exeBuffer);
      try {
        const result = await validateMagicBytes(tmpPath, "application/pdf");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("does not match");
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });

    it("[Attack] .docx MIME with .exe magic bytes is rejected", async () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      const tmpPath = writeTempFile(exeBuffer);
      try {
        const result = await validateMagicBytes(
          tmpPath,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        expect(result.valid).toBe(false);
        expect(result.error).toContain("does not match");
      } finally {
        fs.unlinkSync(tmpPath);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 3.8  Ganache / RPC compromise (config assertion)
  // ───────────────────────────────────────────────────────────────
  describe("Risk 3.8 — Ganache RPC Exposure (config check)", () => {
    it("[Edge] production compose override removes Ganache host port", () => {
      const fs = require("fs");
      const prodOverride = fs.readFileSync(
        require("path").join(
          __dirname,
          "..",
          "..",
          "..",
          "docker-compose.prod.yml",
        ),
        "utf-8",
      );
      expect(prodOverride).toContain("ganache");
      expect(prodOverride).toContain("ports");
      expect(prodOverride).toMatch(/ports:\s*!override\s*\[\]/);
    });
  });
});
