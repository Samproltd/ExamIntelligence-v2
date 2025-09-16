import mongoose from 'mongoose';

export interface IStudentSubscription extends mongoose.Document {
  student: mongoose.Types.ObjectId; // Student who subscribed
  plan: mongoose.Types.ObjectId; // Subscription plan
  college: mongoose.Types.ObjectId; // Student's college
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  paymentId: string; // Razorpay payment ID
  amount: number; // Amount paid
  autoRenew: boolean; // Auto-renewal setting
  createdAt: Date;
  updatedAt: Date;
}

const StudentSubscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended', 'cancelled'],
      default: 'active',
    },
    paymentId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
StudentSubscriptionSchema.index({ student: 1, status: 1 });
StudentSubscriptionSchema.index({ college: 1, status: 1 });
StudentSubscriptionSchema.index({ endDate: 1, status: 1 });

// Register the model if it hasn't been registered yet
let StudentSubscription: mongoose.Model<IStudentSubscription>;

try {
  // Try to retrieve the existing model
  StudentSubscription = mongoose.model<IStudentSubscription>('StudentSubscription');
} catch (error) {
  // Model doesn't exist, so register it
  StudentSubscription = mongoose.model<IStudentSubscription>('StudentSubscription', StudentSubscriptionSchema);
}

export default StudentSubscription;
