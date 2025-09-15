import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPaymentSignature } from '../../../utils/razorpay';
import dbConnect from '../../../utils/db';
import Payment from '../../../models/Payment';
import ExamSuspension from '../../../models/ExamSuspension';
import Result from '../../../models/Result';
import crypto from 'crypto';
import User from '../../../models/User';
import Batch from '../../../models/Batch';
import SecurityIncident from '../../../models/SecurityIncident';
import * as mongooseUtils from '../../../utils/mongooseUtils';

// Webhook handler for Razorpay callbacks
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify the webhook signature from Razorpay
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookSignature = req.headers['x-razorpay-signature'] as string;

    if (!webhookSecret || !webhookSignature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature' });
    }

    // Verify the webhook signature
    const requestBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(requestBody)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    // Process the webhook event
    const event = req.body;
    await dbConnect();

    switch (event.event) {
      case 'payment.authorized':
        // Payment has been authorized
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;

      case 'payment.failed':
        // Payment has failed
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'payment.captured':
        // Payment has been captured
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case 'refund.created':
        // Refund has been initiated
        await handleRefundCreated(event.payload.refund.entity);
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    // Acknowledge receipt of the webhook
    return res.status(200).json({ success: true, message: 'Webhook received and processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: (error as Error).message,
    });
  }
}

// Handler for payment.authorized event
async function handlePaymentAuthorized(payment: any) {
  try {
    // Find the corresponding payment in our database
    const orderId = payment.order_id;
    const dbPayment = await mongooseUtils.findOne(Payment, { razorpayOrderId: orderId });

    if (!dbPayment) {
      console.log(`Payment not found for order: ${orderId}`);
      return;
    }

    // Update the payment status
    dbPayment.status = 'pending';
    dbPayment.razorpayPaymentId = payment.id;
    await dbPayment.save();
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

// Handler for payment.failed event
async function handlePaymentFailed(payment: any) {
  try {
    // Find the corresponding payment in our database
    const orderId = payment.order_id;
    const dbPayment = await mongooseUtils.findOne(Payment, { razorpayOrderId: orderId });

    if (!dbPayment) {
      console.log(`Payment not found for order: ${orderId}`);
      return;
    }

    // Update the payment status
    dbPayment.status = 'failed';
    dbPayment.razorpayPaymentId = payment.id;
    await dbPayment.save();
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handler for payment.captured event
async function handlePaymentCaptured(payment: any) {
  try {
    // Find the corresponding payment in our database
    const orderId = payment.order_id;
    const dbPayment = await mongooseUtils.findOne(Payment, { razorpayOrderId: orderId });

    if (!dbPayment) {
      console.log(`Payment not found for order: ${orderId}`);
      return;
    }

    // Skip if already marked as success
    if (dbPayment.status === 'success') {
      return;
    }

    // Update the payment status
    dbPayment.status = 'success';
    dbPayment.razorpayPaymentId = payment.id;
    await dbPayment.save();

    console.log(`Payment captured and status updated to success: ${dbPayment._id}`);

    // Handle based on payment type
    if (dbPayment.paymentType === 'suspended') {
      // Get the student and batch information to find the batch settings
      const student = await mongooseUtils.findById(User, dbPayment.student);
      let additionalSecurityIncidentsAfterRemoval = 3; // Default value

      // Get batch-specific setting if available
      if (student?.batch) {
        const batch = await mongooseUtils.findById(Batch, student.batch);
        if (batch?.additionalSecurityIncidentsAfterRemoval !== undefined) {
          additionalSecurityIncidentsAfterRemoval = batch.additionalSecurityIncidentsAfterRemoval;
        }
      }

      console.log('WEBHOOK: SUSPENSION PAYMENT PROCESSING:', {
        studentId: dbPayment.student,
        examId: dbPayment.exam,
        batchId: student?.batch,
        additionalSecurityIncidentsAfterRemoval,
      });

      // Remove the suspension
      await mongooseUtils.updateMany(
        ExamSuspension,
        {
          student: dbPayment.student,
          exam: dbPayment.exam,
          removed: { $ne: true },
        },
        {
          $set: {
            removed: true,
            removedAt: new Date(),
          },
        }
      );

      // Mark older security incidents as handled to effectively reset the counter
      await mongooseUtils.updateMany(
        SecurityIncident,
        {
          student: dbPayment.student,
          exam: dbPayment.exam,
        },
        {
          $set: {
            handledByPayment: true,
            handledAt: new Date(),
          },
        }
      );

      // Create a note in the system about the reset
      const securityNote = new SecurityIncident({
        student: dbPayment.student,
        exam: dbPayment.exam,
        incidentType: 'system_note',
        incidentDetails: `Security incident counter reset after payment (webhook). Student can have ${additionalSecurityIncidentsAfterRemoval} more incidents before next suspension.`,
        userAgent: 'Webhook',
        ipAddress: 'Webhook',
        handledByPayment: false,
        suspensionRemovalPayment: dbPayment._id,
      });
      await securityNote.save();

      console.log(
        `Suspension removed and incidents reset for student: ${dbPayment.student}, exam: ${dbPayment.exam}`
      );
    } else if (dbPayment.paymentType === 'max_attempts') {
      console.log(`Processing max_attempts payment: ${dbPayment._id}`);

      // Get the student and batch information to find the batch settings
      const student = await mongooseUtils.findById(User, dbPayment.student);
      let additionalAttemptsAfterPayment = 2; // Default value

      // Get batch-specific setting if available
      if (student?.batch) {
        const batch = await mongooseUtils.findById(Batch, student.batch);
        if (batch?.additionalAttemptsAfterPayment !== undefined) {
          additionalAttemptsAfterPayment = batch.additionalAttemptsAfterPayment;
        }
      }

      // Direct approach to update the payment
      dbPayment.additionalAttempts = additionalAttemptsAfterPayment;
      dbPayment.additionalAttemptsGranted = true;
      dbPayment.additionalAttemptsGrantedAt = new Date();
      await dbPayment.save();

      console.log(
        `Additional attempts granted: ${additionalAttemptsAfterPayment} for payment: ${dbPayment._id}`
      );

      // No need to mark previous results as from previous payment cycle
      // This would make it harder to track multiple payments
      // We'll calculate total attempts across all payments instead

      console.log(`Payment processed successfully for student: ${dbPayment.student}`);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Handler for refund.created event
async function handleRefundCreated(refund: any) {
  try {
    // Find the corresponding payment in our database
    const paymentId = refund.payment_id;
    const dbPayment = await mongooseUtils.findOne(Payment, { razorpayPaymentId: paymentId });

    if (!dbPayment) {
      console.log(`Payment not found for Razorpay payment ID: ${paymentId}`);
      return;
    }

    // Mark the payment as refunded
    dbPayment.status = 'refunded';
    await dbPayment.save();

    console.log(`Payment ${dbPayment._id} marked as refunded`);
  } catch (error) {
    console.error('Error handling refund created:', error);
  }
}
