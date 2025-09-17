import mongoose from 'mongoose';

export interface IBatchSubscriptionAssignment extends mongoose.Document {
  batch: mongoose.Types.ObjectId; // Reference to Batch
  subscriptionPlan: mongoose.Types.ObjectId; // Reference to SubscriptionPlan
  college: mongoose.Types.ObjectId; // Reference to College
  assignedBy: mongoose.Types.ObjectId; // Super Admin who made the assignment
  isActive: boolean;
  assignmentDate: Date;
  notes?: string; // Optional notes about the assignment
  createdAt: Date;
  updatedAt: Date;
}

const BatchSubscriptionAssignmentSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch is required'],
    },
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: [true, 'Subscription plan is required'],
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignmentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for efficient queries
BatchSubscriptionAssignmentSchema.index({ batch: 1, subscriptionPlan: 1 }, { unique: true });
BatchSubscriptionAssignmentSchema.index({ college: 1, isActive: 1 });
BatchSubscriptionAssignmentSchema.index({ subscriptionPlan: 1, isActive: 1 });

// Register the model if it hasn't been registered yet
let BatchSubscriptionAssignment: mongoose.Model<IBatchSubscriptionAssignment>;

try {
  // Try to retrieve the existing model
  BatchSubscriptionAssignment = mongoose.model<IBatchSubscriptionAssignment>('BatchSubscriptionAssignment');
} catch (error) {
  // Model doesn't exist, so register it
  BatchSubscriptionAssignment = mongoose.model<IBatchSubscriptionAssignment>('BatchSubscriptionAssignment', BatchSubscriptionAssignmentSchema);
}

export default BatchSubscriptionAssignment;
