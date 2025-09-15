import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with environment variables
export const initRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
};

// Create a new Razorpay order
export const createOrder = async (
  amount: number,
  currency: string,
  receipt: string,
  notes: Record<string, any> = {}
) => {
  const razorpay = initRazorpay();

  return await razorpay.orders.create({
    amount: amount * 100, // Convert to smallest currency unit (paise)
    currency,
    receipt,
    notes,
  });
};

// Verify Razorpay payment signature
export const verifyPaymentSignature = (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean => {
  // Create the signature verification string
  const signatureVerificationString = `${razorpay_order_id}|${razorpay_payment_id}`;

  // Generate HMAC hex digest using the Razorpay secret key
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(signatureVerificationString)
    .digest('hex');

  // Compare the signatures
  return generatedSignature === razorpay_signature;
};

// Types for payment-related data
export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrderData {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
  notes?: Record<string, any>;
  created_at?: number;
}

export interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  examName: string;
}

export default {
  initRazorpay,
  createOrder,
  verifyPaymentSignature,
};
