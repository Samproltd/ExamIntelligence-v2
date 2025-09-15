import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../utils/auth';
import dbConnect from '../../../utils/db';
import Payment from '../../../models/Payment';
import ExamSuspension from '../../../models/ExamSuspension';
import { verifyPaymentSignature } from '../../../utils/razorpay';
import User from '../../../models/User';
import Batch from '../../../models/Batch';
import SecurityIncident from '../../../models/SecurityIncident';
import * as mongooseUtils from '../../../utils/mongooseUtils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Only students can verify payments
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can verify payments',
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data',
      });
    }

    // Find the payment in our database
    const payment = await mongooseUtils.findOne(Payment, { razorpayOrderId: razorpay_order_id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify the payment signature using our utility
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      // Update payment status to failed
      payment.status = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // If the signature is valid, update the payment status
    payment.status = 'success';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    console.log('PAYMENT VERIFICATION SUCCESS:', {
      paymentId: payment._id,
      paymentType: payment.paymentType,
      studentId: payment.student,
      examId: payment.exam,
    });

    // Handle based on payment type
    if (payment.paymentType === 'suspended') {
      // Get the student and batch information to find the batch settings
      const student = await mongooseUtils.findById(User, payment.student);
      let additionalSecurityIncidentsAfterRemoval = 3; // Default value

      // Get batch-specific setting if available
      if (student?.batch) {
        const batch = await mongooseUtils.findById(Batch, student.batch);
        if (batch?.additionalSecurityIncidentsAfterRemoval !== undefined) {
          additionalSecurityIncidentsAfterRemoval = batch.additionalSecurityIncidentsAfterRemoval;
        }
      }

      console.log('SUSPENSION PAYMENT PROCESSING:', {
        studentId: payment.student,
        examId: payment.exam,
        batchId: student?.batch,
        additionalSecurityIncidentsAfterRemoval,
      });

      // Remove the suspension
      await mongooseUtils.updateMany(
        ExamSuspension,
        {
          student: payment.student,
          exam: payment.exam,
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
          student: payment.student,
          exam: payment.exam,
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
        student: payment.student,
        exam: payment.exam,
        incidentType: 'system_note',
        incidentDetails: `Security incident counter reset after payment. Student can have ${additionalSecurityIncidentsAfterRemoval} more incidents before next suspension.`,
        userAgent: req.headers['user-agent'] || 'System',
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'System',
        handledByPayment: false,
        suspensionRemovalPayment: payment._id,
      });
      await securityNote.save();

      console.log('SUSPENSION REMOVED AND INCIDENTS RESET FOR STUDENT:', payment.student);
    } else if (payment.paymentType === 'max_attempts') {
      // Completely reworked approach for additional attempts
      console.log('MAX ATTEMPTS PAYMENT DETECTED:', {
        paymentId: payment._id,
        studentId: payment.student,
        examId: payment.exam,
      });

      // Get the student and batch information to find the batch settings
      const student = await mongooseUtils.findById(User, payment.student);
      let additionalAttemptsAfterPayment = 2; // Default value

      // Get batch-specific setting if available
      if (student?.batch) {
        const batch = await mongooseUtils.findById(Batch, student.batch);
        if (batch?.additionalAttemptsAfterPayment !== undefined) {
          additionalAttemptsAfterPayment = batch.additionalAttemptsAfterPayment;
        }
      }

      console.log('ADDITIONAL ATTEMPTS SETTINGS:', {
        studentId: payment.student,
        examId: payment.exam,
        batchId: student?.batch,
        additionalAttemptsAfterPayment,
      });

      // Directly modify the payment document fields
      payment.set('additionalAttempts', additionalAttemptsAfterPayment);
      payment.set('additionalAttemptsGranted', true);
      payment.set('additionalAttemptsGrantedAt', new Date());

      console.log('UPDATED PAYMENT DOCUMENT:', {
        additionalAttempts: payment.get('additionalAttempts'),
        additionalAttemptsGranted: payment.get('additionalAttemptsGranted'),
        additionalAttemptsGrantedAt: payment.get('additionalAttemptsGrantedAt'),
      });

      // Save the updated document
      await payment.save();

      // Re-fetch the payment to verify it was saved correctly
      const updatedPayment = await mongooseUtils.findById(Payment, payment._id);

      console.log('RE-FETCHED PAYMENT:', {
        additionalAttempts: updatedPayment?.additionalAttempts,
        additionalAttemptsGranted: updatedPayment?.additionalAttemptsGranted,
        additionalAttemptsGrantedAt: updatedPayment?.additionalAttemptsGrantedAt,
        paymentType: updatedPayment?.paymentType,
        status: updatedPayment?.status,
      });

      // No need to mark previous results as from previous payment cycle
      // This would make it harder to track multiple payments
      // We'll calculate total attempts across all payments instead

      console.log('MAX ATTEMPTS PAYMENT PROCESSING COMPLETED');
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        id: payment._id,
        status: payment.status,
        paymentType: payment.paymentType,
        amount: payment.amount,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: (error as Error).message,
    });
  }
};

export default authenticateAPI(handler);
