const express = require("express");
const router = express.Router();
const { requireJwt, requireRole } = require("../middleware/auth");
const respond = require("../middleware/respond");
const paymentGatewayService = require("../services/paymentGatewayService");

// POST /api/treasury/payments/verify - Verify a payment (treasury staff)
router.post(
  "/payments/verify",
  requireJwt,
  requireRole(["treasury", "admin"]),
  async (req, res) => {
    try {
      const { paymentId, verificationNotes } = req.body;
      const verifiedBy = req._userId;

      if (!paymentId) {
        return respond.error(
          res,
          400,
          "payment_required",
          "Payment ID is required",
        );
      }

      const result = await paymentGatewayService.verifyPayment(
        paymentId,
        verifiedBy,
        verificationNotes,
      );
      res.json(result);
    } catch (err) {
      console.error("POST /api/treasury/payments/verify error:", err);
      return respond.error(
        res,
        500,
        "verify_error",
        err.message || "Failed to verify payment",
      );
    }
  },
);

// GET /api/treasury/payments/pending - Get pending verifications
router.get(
  "/payments/pending",
  requireJwt,
  requireRole(["treasury", "admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await paymentGatewayService.getPendingVerifications(
        parseInt(page),
        parseInt(limit),
      );
      res.json(result);
    } catch (err) {
      console.error("GET /api/treasury/payments/pending error:", err);
      return respond.error(
        res,
        500,
        "fetch_error",
        err.message || "Failed to fetch pending payments",
      );
    }
  },
);

// GET /api/treasury/collections/daily - Get daily collection report
router.get(
  "/collections/daily",
  requireJwt,
  requireRole(["treasury", "admin"]),
  async (req, res) => {
    try {
      const { date } = req.query;
      const reportDate = date ? new Date(date) : new Date();
      const result =
        await paymentGatewayService.getDailyCollectionReport(reportDate);
      res.json(result);
    } catch (err) {
      console.error("GET /api/treasury/collections/daily error:", err);
      return respond.error(
        res,
        500,
        "report_error",
        err.message || "Failed to generate collection report",
      );
    }
  },
);

// POST /api/treasury/receipts/generate - Generate official receipt
router.post(
  "/receipts/generate",
  requireJwt,
  requireRole(["treasury", "admin"]),
  async (req, res) => {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return respond.error(
          res,
          400,
          "payment_required",
          "Payment ID is required",
        );
      }

      const result =
        await paymentGatewayService.generateOfficialReceipt(paymentId);
      res.json(result);
    } catch (err) {
      console.error("POST /api/treasury/receipts/generate error:", err);
      return respond.error(
        res,
        500,
        "receipt_error",
        err.message || "Failed to generate receipt",
      );
    }
  },
);

// POST /api/treasury/webhook/:gateway - Handle payment gateway webhooks
router.post("/webhook/:gateway", async (req, res) => {
  try {
    const { gateway } = req.params;
    const payload = req.body;
    const signature =
      req.headers["x-webhook-signature"] || req.headers["x-signature"];

    const result = await paymentGatewayService.handleWebhook(
      gateway,
      payload,
      signature,
    );
    res.json(result);
  } catch (err) {
    console.error(
      `POST /api/treasury/webhook/${req.params.gateway} error:`,
      err,
    );
    return respond.error(
      res,
      500,
      "webhook_error",
      err.message || "Failed to process webhook",
    );
  }
});

// POST /api/treasury/payments/gcash/create - Create GCash payment
router.post(
  "/payments/gcash/create",
  requireJwt,
  requireRole(["business_owner", "admin"]),
  async (req, res) => {
    try {
      const { amount, description, reference, businessId } = req.body;
      const userId = req._userId;

      if (!amount || !businessId) {
        return respond.error(
          res,
          400,
          "required_fields",
          "Amount and businessId are required",
        );
      }

      const result = await paymentGatewayService.createGCashPayment({
        amount,
        description,
        reference,
        businessId,
        userId,
      });

      res.json(result);
    } catch (err) {
      console.error("POST /api/treasury/payments/gcash/create error:", err);
      return respond.error(
        res,
        500,
        "payment_error",
        err.message || "Failed to create GCash payment",
      );
    }
  },
);

// POST /api/treasury/payments/maya/create - Create Maya payment
router.post(
  "/payments/maya/create",
  requireJwt,
  requireRole(["business_owner", "admin"]),
  async (req, res) => {
    try {
      const { amount, description, reference, businessId } = req.body;
      const userId = req._userId;

      if (!amount || !businessId) {
        return respond.error(
          res,
          400,
          "required_fields",
          "Amount and businessId are required",
        );
      }

      const result = await paymentGatewayService.createMayaPayment({
        amount,
        description,
        reference,
        businessId,
        userId,
      });

      res.json(result);
    } catch (err) {
      console.error("POST /api/treasury/payments/maya/create error:", err);
      return respond.error(
        res,
        500,
        "payment_error",
        err.message || "Failed to create Maya payment",
      );
    }
  },
);

// POST /api/treasury/payments/card/create - Create card payment
router.post(
  "/payments/card/create",
  requireJwt,
  requireRole(["business_owner", "admin"]),
  async (req, res) => {
    try {
      const { amount, description, reference, businessId, cardToken } =
        req.body;
      const userId = req._userId;

      if (!amount || !businessId) {
        return respond.error(
          res,
          400,
          "required_fields",
          "Amount and businessId are required",
        );
      }

      const result = await paymentGatewayService.createCardPayment({
        amount,
        description,
        reference,
        businessId,
        userId,
        cardToken,
      });

      res.json(result);
    } catch (err) {
      console.error("POST /api/treasury/payments/card/create error:", err);
      return respond.error(
        res,
        500,
        "payment_error",
        err.message || "Failed to create card payment",
      );
    }
  },
);

// POST /api/treasury/payments/bank-transfer/record - Record bank transfer
router.post(
  "/payments/bank-transfer/record",
  requireJwt,
  requireRole(["business_owner", "admin"]),
  async (req, res) => {
    try {
      const { amount, description, reference, businessId, bankDetails } =
        req.body;
      const userId = req._userId;

      if (!amount || !businessId || !bankDetails) {
        return respond.error(
          res,
          400,
          "required_fields",
          "Amount, businessId, and bankDetails are required",
        );
      }

      const result = await paymentGatewayService.recordBankTransfer({
        amount,
        description,
        reference,
        businessId,
        userId,
        bankDetails,
      });

      res.json(result);
    } catch (err) {
      console.error(
        "POST /api/treasury/payments/bank-transfer/record error:",
        err,
      );
      return respond.error(
        res,
        500,
        "payment_error",
        err.message || "Failed to record bank transfer",
      );
    }
  },
);

module.exports = router;
