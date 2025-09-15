import mongoose from 'mongoose';

export interface IPayment extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  amount: number;
  status: 'created' | 'pending' | 'success' | 'failed';
  paymentType: 'suspended' | 'max_attempts';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  additionalAttempts?: number;
  additionalAttemptsGranted?: boolean;
  additionalAttemptsGrantedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['created', 'pending', 'success', 'failed'],
    default: 'created',
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['suspended', 'max_attempts'],
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  razorpayPaymentId: {
    type: String,
    required: false,
  },
  razorpaySignature: {
    type: String,
    required: false,
  },
  additionalAttempts: {
    type: Number,
    required: false,
  },
  additionalAttemptsGranted: {
    type: Boolean,
    default: false,
    required: false,
  },
  additionalAttemptsGrantedAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
PaymentSchema.pre<IPayment>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Define indexes
const indexes = [
  { key: { student: 1 }, options: {} },
  { key: { exam: 1 }, options: {} },
  { key: { razorpayOrderId: 1 }, options: { unique: true } },
];

// Only compile model once
const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

// Initialize indexes safely
const initializeIndexes = async () => {
  try {
    const collection = mongoose.connection.collection('payments');

    // Get existing indexes
    const existingIndexes = await collection.listIndexes().toArray();

    // Create each index if it doesn't exist
    for (const index of indexes) {
      const indexName = Object.entries(index.key)
        .map(([key, value]) => `${key}_${value}`)
        .join('_');

      const indexExists = existingIndexes.some(existing => existing.name === indexName);

      if (!indexExists) {
        await collection
          .createIndex(index.key, index.options)
          .catch(err => console.error(`Error creating index ${indexName}:`, err));
      }
    }
  } catch (error) {
    console.error('Error managing indexes:', error);
  }
};

// Initialize indexes when the connection is ready
if (mongoose.connection.readyState === 1) {
  initializeIndexes();
} else {
  mongoose.connection.once('connected', initializeIndexes);
}

export default Payment;
