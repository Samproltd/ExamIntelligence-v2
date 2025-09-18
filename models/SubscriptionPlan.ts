import mongoose from 'mongoose';

export interface ISubscriptionPlan extends mongoose.Document {
  name: string;
  description: string;
  duration: number; // in months
  price: number; // Dynamic - set by admin
  features: string[];
  isActive: boolean;
  isDefault: boolean; // Default plan for new students
  createdBy: mongoose.Types.ObjectId; // Admin who created this plan
  colleges: mongoose.Types.ObjectId[]; // Multiple colleges this plan is available for
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      maxlength: [100, 'Plan name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 month'],
      max: [999, 'Duration cannot exceed 999 months'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    features: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Feature description cannot be more than 200 characters'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    colleges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
    }],
  },
  {
    timestamps: true,
  }
);

// Register the model if it hasn't been registered yet
let SubscriptionPlan: mongoose.Model<ISubscriptionPlan>;

try {
  // Try to retrieve the existing model
  SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan');
} catch (error) {
  // Model doesn't exist, so register it
  SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
}

export default SubscriptionPlan;
