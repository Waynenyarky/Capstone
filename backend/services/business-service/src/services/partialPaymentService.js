/**
 * Partial Payment Service
 * Handles partial payment processing, state consistency, and recovery
 */

const mongoose = require("mongoose");
const logger = require("../lib/logger");

// Payment state schema for tracking partial payments
const PaymentStateSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  businessId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Payment details
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },

  // State tracking
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "partial",
      "completed",
      "failed",
      "refunded",
    ],
    default: "pending",
  },

  // Partial payment details
  partialPayments: [
    {
      id: String,
      amount: Number,
      method: String,
      status: String,
      timestamp: Date,
      transactionId: String,
      gatewayResponse: Object,
    },
  ],

  // Recovery and retry
  retryAttempts: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  lastRetryAt: Date,
  nextRetryAt: Date,

  // Metadata
  reason: String,
  metadata: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PaymentState =
  mongoose.models.PaymentState ||
  mongoose.model("PaymentState", PaymentStateSchema);

class PartialPaymentService {
  /**
   * Process partial payment
   * @param {string} businessId - Business ID
   * @param {object} paymentData - Payment data
   */
  static async processPartialPayment(businessId, paymentData) {
    const {
      totalAmount,
      partialAmount,
      paymentMethod,
      transactionId,
      userId,
      reason = "Partial payment processing",
    } = paymentData;

    try {
      // Validate partial payment amount
      if (partialAmount <= 0 || partialAmount >= totalAmount) {
        throw new Error("Invalid partial payment amount");
      }

      // Check if payment state exists
      let paymentState = await PaymentState.findOne({
        businessId,
        status: { $in: ["pending", "processing", "partial"] },
        totalAmount,
      });

      if (!paymentState) {
        // Create new payment state
        paymentState = new PaymentState({
          paymentId: `partial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          businessId,
          userId,
          totalAmount,
          paidAmount: partialAmount,
          remainingAmount: totalAmount - partialAmount,
          status: partialAmount >= totalAmount ? "completed" : "partial",
          reason,
          metadata: paymentData.metadata || {},
        });
      } else {
        // Update existing payment state
        paymentState.paidAmount += partialAmount;
        paymentState.remainingAmount = totalAmount - paymentState.paidAmount;
        paymentState.status =
          paymentState.remainingAmount <= 0 ? "completed" : "partial";
      }

      // Add partial payment record
      const partialPayment = {
        id: `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: partialAmount,
        method: paymentMethod,
        status: "completed",
        timestamp: new Date(),
        transactionId,
        gatewayResponse: paymentData.gatewayResponse || {},
      };

      paymentState.partialPayments.push(partialPayment);
      paymentState.updatedAt = new Date();

      await paymentState.save();

      logger.info("Partial payment processed successfully", {
        paymentId: paymentState.paymentId,
        businessId,
        partialAmount,
        totalAmount,
        remainingAmount: paymentState.remainingAmount,
        status: paymentState.status,
      });

      return {
        success: true,
        paymentId: paymentState.paymentId,
        status: paymentState.status,
        paidAmount: paymentState.paidAmount,
        remainingAmount: paymentState.remainingAmount,
        totalAmount: paymentState.totalAmount,
        partialPaymentId: partialPayment.id,
      };
    } catch (error) {
      logger.error("Partial payment processing error", {
        error: error.message,
        businessId,
        paymentData,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Check payment state consistency
   * @param {string} businessId - Business ID
   */
  static async checkPaymentConsistency(businessId) {
    try {
      const paymentStates = await PaymentState.find({
        businessId,
        status: { $in: ["pending", "processing", "partial"] },
      });

      const inconsistencies = [];

      for (const paymentState of paymentStates) {
        const calculatedPaid = paymentState.partialPayments
          .filter((pp) => pp.status === "completed")
          .reduce((sum, pp) => sum + pp.amount, 0);

        const calculatedRemaining = paymentState.totalAmount - calculatedPaid;

        // Check for inconsistencies
        if (Math.abs(paymentState.paidAmount - calculatedPaid) > 0.01) {
          inconsistencies.push({
            type: "paid_amount_mismatch",
            paymentId: paymentState.paymentId,
            recorded: paymentState.paidAmount,
            calculated: calculatedPaid,
          });
        }

        if (
          Math.abs(paymentState.remainingAmount - calculatedRemaining) > 0.01
        ) {
          inconsistencies.push({
            type: "remaining_amount_mismatch",
            paymentId: paymentState.paymentId,
            recorded: paymentState.remainingAmount,
            calculated: calculatedRemaining,
          });
        }

        // Check if status should be updated
        if (calculatedRemaining <= 0 && paymentState.status !== "completed") {
          inconsistencies.push({
            type: "status_should_be_completed",
            paymentId: paymentState.paymentId,
            currentStatus: paymentState.status,
            remainingAmount: calculatedRemaining,
          });
        }
      }

      return {
        consistent: inconsistencies.length === 0,
        inconsistencies,
        totalPayments: paymentStates.length,
      };
    } catch (error) {
      logger.error("Payment consistency check error", {
        error: error.message,
        businessId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Recover partial payment state
   * @param {string} paymentId - Payment ID
   */
  static async recoverPartialPayment(paymentId) {
    try {
      const paymentState = await PaymentState.findOne({ paymentId });
      if (!paymentState) {
        throw new Error("Payment state not found");
      }

      // Recalculate amounts based on completed partial payments
      const completedPayments = paymentState.partialPayments.filter(
        (pp) => pp.status === "completed",
      );
      const calculatedPaid = completedPayments.reduce(
        (sum, pp) => sum + pp.amount,
        0,
      );
      const calculatedRemaining = paymentState.totalAmount - calculatedPaid;

      // Update payment state
      paymentState.paidAmount = calculatedPaid;
      paymentState.remainingAmount = calculatedRemaining;
      paymentState.status = calculatedRemaining <= 0 ? "completed" : "partial";
      paymentState.updatedAt = new Date();

      await paymentState.save();

      logger.info("Partial payment state recovered", {
        paymentId,
        businessId: paymentState.businessId,
        oldPaidAmount: paymentState.paidAmount,
        newPaidAmount: calculatedPaid,
        oldRemainingAmount: paymentState.remainingAmount,
        newRemainingAmount: calculatedRemaining,
        status: paymentState.status,
      });

      return {
        success: true,
        paymentId,
        recoveredAmount: calculatedPaid,
        remainingAmount: calculatedRemaining,
        status: paymentState.status,
      };
    } catch (error) {
      logger.error("Partial payment recovery error", {
        error: error.message,
        paymentId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get payment recovery options
   * @param {string} paymentId - Payment ID
   */
  static async getPaymentRecoveryOptions(paymentId) {
    try {
      const paymentState = await PaymentState.findOne({ paymentId });
      if (!paymentState) {
        throw new Error("Payment state not found");
      }

      const options = [];

      // Always offer state recovery
      options.push({
        type: "recover_state",
        description:
          "Recalculate payment amounts based on completed transactions",
        action: "recover",
        available: true,
      });

      // Offer retry for failed partial payments
      const failedPayments = paymentState.partialPayments.filter(
        (pp) => pp.status === "failed",
      );
      if (
        failedPayments.length > 0 &&
        paymentState.retryAttempts < paymentState.maxRetries
      ) {
        options.push({
          type: "retry_failed",
          description: `Retry ${failedPayments.length} failed payment(s)`,
          action: "retry",
          available: true,
          failedPayments: failedPayments.map((fp) => ({
            id: fp.id,
            amount: fp.amount,
            method: fp.method,
          })),
        });
      }

      // Offer refund for partial payments if needed
      if (paymentState.status === "partial" && paymentState.paidAmount > 0) {
        options.push({
          type: "refund_partial",
          description: "Refund partial payments and restart",
          action: "refund",
          available: true,
          refundableAmount: paymentState.paidAmount,
        });
      }

      // Offer completion if remaining amount is small
      if (
        paymentState.remainingAmount > 0 &&
        paymentState.remainingAmount < 100
      ) {
        options.push({
          type: "complete_payment",
          description: `Complete remaining payment of ${paymentState.remainingAmount}`,
          action: "complete",
          available: true,
          remainingAmount: paymentState.remainingAmount,
        });
      }

      return {
        paymentId,
        currentStatus: paymentState.status,
        paidAmount: paymentState.paidAmount,
        remainingAmount: paymentState.remainingAmount,
        totalAmount: paymentState.totalAmount,
        options,
      };
    } catch (error) {
      logger.error("Get payment recovery options error", {
        error: error.message,
        paymentId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get payment status with detailed information
   * @param {string} paymentId - Payment ID
   */
  static async getPaymentStatus(paymentId) {
    try {
      const paymentState = await PaymentState.findOne({ paymentId });
      if (!paymentState) {
        throw new Error("Payment state not found");
      }

      return {
        paymentId,
        businessId: paymentState.businessId,
        status: paymentState.status,
        totalAmount: paymentState.totalAmount,
        paidAmount: paymentState.paidAmount,
        remainingAmount: paymentState.remainingAmount,
        partialPayments: paymentState.partialPayments,
        retryAttempts: paymentState.retryAttempts,
        createdAt: paymentState.createdAt,
        updatedAt: paymentState.updatedAt,
      };
    } catch (error) {
      logger.error("Get payment status error", {
        error: error.message,
        paymentId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

module.exports = PartialPaymentService;
