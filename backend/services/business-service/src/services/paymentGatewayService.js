const crypto = require("crypto");
const Payment = require("../models/Payment");
const { generateReferenceNumber } = require("../utils/referenceNumber");

// Payment Gateway Configuration
const GATEWAY_CONFIG = {
  gcash: {
    name: "GCash",
    sandbox: process.env.GCASH_SANDBOX === "true",
    merchantId: process.env.GCASH_MERCHANT_ID,
    apiKey: process.env.GCASH_API_KEY,
    apiSecret: process.env.GCASH_API_SECRET,
    checkoutUrl:
      process.env.GCASH_SANDBOX === "true"
        ? "https://sandbox.gcash.com/checkout"
        : "https://pay.gcash.com/checkout",
    webhookSecret: process.env.GCASH_WEBHOOK_SECRET,
  },
  maya: {
    name: "Maya",
    sandbox: process.env.MAYA_SANDBOX === "true",
    publicKey: process.env.MAYA_PUBLIC_KEY,
    secretKey: process.env.MAYA_SECRET_KEY,
    apiUrl:
      process.env.MAYA_SANDBOX === "true"
        ? "https://sandbox-payments.maya.ph"
        : "https://payments.maya.ph",
    webhookSecret: process.env.MAYA_WEBHOOK_SECRET,
  },
  stripe: {
    name: "Stripe",
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
};

/**
 * Create a GCash payment
 */
async function createGCashPayment({
  amount,
  description,
  reference,
  businessId,
  userId,
}) {
  try {
    const config = GATEWAY_CONFIG.gcash;

    // Create payment record
    const payment = new Payment({
      paymentId: await generateReferenceNumber("PAY"),
      userId,
      businessId,
      businessProfileId: businessId,
      paymentType: "registration_fee",
      description,
      amount,
      currency: "PHP",
      status: "pending",
      paymentMethod: "gcash",
      referenceNumber: reference,
      metadata: {
        gateway: "gcash",
        initiatedAt: new Date(),
      },
    });

    await payment.save();

    // Generate checkout URL (mock implementation - replace with actual GCash API)
    const checkoutToken = crypto.randomBytes(32).toString("hex");
    const checkoutUrl = `${config.checkoutUrl}?token=${checkoutToken}&reference=${payment.paymentId}&amount=${amount}`;

    return {
      success: true,
      paymentId: payment.paymentId,
      checkoutUrl,
      amount,
      currency: "PHP",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  } catch (error) {
    console.error("GCash payment creation failed:", error);
    throw new Error("Failed to create GCash payment: " + error.message);
  }
}

/**
 * Create a Maya payment
 */
async function createMayaPayment({
  amount,
  description,
  reference,
  businessId,
  userId,
}) {
  try {
    // Create payment record
    const payment = new Payment({
      paymentId: await generateReferenceNumber("PAY"),
      userId,
      businessId,
      businessProfileId: businessId,
      paymentType: "registration_fee",
      description,
      amount,
      currency: "PHP",
      status: "pending",
      paymentMethod: "maya",
      referenceNumber: reference,
      metadata: {
        gateway: "maya",
        initiatedAt: new Date(),
      },
    });

    await payment.save();

    // Generate checkout URL (mock implementation)
    const checkoutToken = crypto.randomBytes(32).toString("hex");
    const config = GATEWAY_CONFIG.maya;
    const checkoutUrl = `${config.apiUrl}/checkout?token=${checkoutToken}&ref=${payment.paymentId}`;

    return {
      success: true,
      paymentId: payment.paymentId,
      checkoutUrl,
      amount,
      currency: "PHP",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  } catch (error) {
    console.error("Maya payment creation failed:", error);
    throw new Error("Failed to create Maya payment: " + error.message);
  }
}

/**
 * Create a card payment (via Stripe)
 */
async function createCardPayment({
  amount,
  description,
  reference,
  businessId,
  userId,
  cardToken,
}) {
  try {
    // Create payment record
    const payment = new Payment({
      paymentId: await generateReferenceNumber("PAY"),
      userId,
      businessId,
      businessProfileId: businessId,
      paymentType: "registration_fee",
      description,
      amount,
      currency: "PHP",
      status: "processing",
      paymentMethod: "credit_card",
      referenceNumber: reference,
      metadata: {
        gateway: "stripe",
        cardToken,
        initiatedAt: new Date(),
      },
    });

    await payment.save();

    // Mock Stripe processing - in production, integrate with Stripe API
    // const stripe = require('stripe')(GATEWAY_CONFIG.stripe.secretKey);
    // const charge = await stripe.charges.create({...})

    return {
      success: true,
      paymentId: payment.paymentId,
      requiresAction: true,
      clientSecret:
        "mock_client_secret_" + crypto.randomBytes(16).toString("hex"),
    };
  } catch (error) {
    console.error("Card payment creation failed:", error);
    throw new Error("Failed to create card payment: " + error.message);
  }
}

/**
 * Record a bank transfer payment
 */
async function recordBankTransfer({
  amount,
  description,
  reference,
  businessId,
  userId,
  bankDetails,
}) {
  try {
    const payment = new Payment({
      paymentId: await generateReferenceNumber("PAY"),
      userId,
      businessId,
      businessProfileId: businessId,
      paymentType: "registration_fee",
      description,
      amount,
      currency: "PHP",
      status: "pending", // Requires verification
      paymentMethod: "bank_transfer",
      referenceNumber: reference,
      metadata: {
        bankName: bankDetails.bankName,
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        transferReference: bankDetails.referenceNumber,
        transferDate: bankDetails.transferDate,
        receiptImage: bankDetails.receiptImage,
      },
    });

    await payment.save();

    return {
      success: true,
      paymentId: payment.paymentId,
      message:
        "Bank transfer recorded. Payment will be verified by treasury staff.",
      requiresVerification: true,
    };
  } catch (error) {
    console.error("Bank transfer recording failed:", error);
    throw new Error("Failed to record bank transfer: " + error.message);
  }
}

/**
 * Verify a payment (for bank transfers and manual verification)
 */
async function verifyPayment(paymentId, verifiedBy, verificationNotes) {
  try {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending" && payment.status !== "processing") {
      throw new Error(`Cannot verify payment with status: ${payment.status}`);
    }

    // Generate receipt number
    const receiptNumber = await generateReferenceNumber("OR");

    payment.status = "paid";
    payment.paidAt = new Date();
    payment.verifiedAt = new Date();
    payment.processedBy = verifiedBy;
    payment.receiptNumber = receiptNumber;
    payment.notes = verificationNotes || payment.notes;

    await payment.save();

    return {
      success: true,
      payment: {
        paymentId: payment.paymentId,
        receiptNumber: payment.receiptNumber,
        status: payment.status,
        paidAt: payment.paidAt,
      },
    };
  } catch (error) {
    console.error("Payment verification failed:", error);
    throw new Error("Failed to verify payment: " + error.message);
  }
}

/**
 * Handle webhook from payment gateway
 */
async function handleWebhook(gateway, payload, signature) {
  try {
    // Verify webhook signature
    const config = GATEWAY_CONFIG[gateway];
    if (!config) {
      throw new Error(`Unknown gateway: ${gateway}`);
    }

    // Verify signature (implementation depends on gateway)
    // const isValid = verifyWebhookSignature(payload, signature, config.webhookSecret);
    // if (!isValid) throw new Error('Invalid webhook signature');

    // Process webhook payload
    const { paymentId, status, transactionId } = payload;

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (status === "success" || status === "paid") {
      const receiptNumber = await generateReferenceNumber("OR");
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.verifiedAt = new Date();
      payment.receiptNumber = receiptNumber;
      payment.transactionId = transactionId;
      payment.metadata.webhookReceivedAt = new Date();
    } else if (status === "failed") {
      payment.status = "failed";
      payment.failureReason = payload.failureReason || "Payment failed";
    }

    await payment.save();

    return {
      success: true,
      paymentId: payment.paymentId,
      status: payment.status,
    };
  } catch (error) {
    console.error("Webhook handling failed:", error);
    throw new Error("Failed to process webhook: " + error.message);
  }
}

/**
 * Get payments pending verification (for treasury)
 */
async function getPendingVerifications(page = 1, limit = 20) {
  try {
    const query = {
      status: "pending",
      paymentMethod: { $in: ["bank_transfer", "cash"] },
    };

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName email")
      .populate("processedBy", "firstName lastName");

    const total = await Payment.countDocuments(query);

    return {
      payments: payments.map((p) => ({
        paymentId: p.paymentId,
        businessId: p.businessId,
        amount: p.amount,
        description: p.description,
        paymentMethod: p.paymentMethod,
        status: p.status,
        referenceNumber: p.referenceNumber,
        metadata: p.metadata,
        user: p.userId,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Failed to get pending verifications:", error);
    throw new Error("Failed to get pending verifications: " + error.message);
  }
}

/**
 * Get daily collection report (for treasury)
 */
async function getDailyCollectionReport(date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await Payment.find({
      status: "paid",
      paidAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Aggregate by payment method
    const byMethod = {};
    const byType = {};
    let total = 0;

    payments.forEach((p) => {
      total += p.amount;

      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount;
      byType[p.paymentType] = (byType[p.paymentType] || 0) + p.amount;
    });

    return {
      date: startOfDay,
      total,
      count: payments.length,
      byMethod,
      byType,
      payments: payments.map((p) => ({
        paymentId: p.paymentId,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt,
      })),
    };
  } catch (error) {
    console.error("Failed to get daily collection report:", error);
    throw new Error("Failed to get daily collection report: " + error.message);
  }
}

/**
 * Generate official receipt
 */
async function generateOfficialReceipt(paymentId) {
  try {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (!payment.receiptNumber) {
      payment.receiptNumber = await generateReferenceNumber("OR");
      await payment.save();
    }

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.paymentId,
      amount: payment.amount,
      description: payment.description,
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt,
      businessId: payment.businessId,
    };
  } catch (error) {
    console.error("Failed to generate receipt:", error);
    throw new Error("Failed to generate receipt: " + error.message);
  }
}

module.exports = {
  createGCashPayment,
  createMayaPayment,
  createCardPayment,
  recordBankTransfer,
  verifyPayment,
  handleWebhook,
  getPendingVerifications,
  getDailyCollectionReport,
  generateOfficialReceipt,
  GATEWAY_CONFIG,
};
