import mongoose from 'mongoose';

export interface IBatch extends mongoose.Document {
  name: string;
  description: string;
  year: number;
  college: mongoose.Types.ObjectId; // Required
  department?: string;
  semester?: number;
  isActive: boolean;
  maxAttempts: number;
  maxSecurityIncidents: number;
  enableAutoSuspend?: boolean;
  additionalSecurityIncidentsAfterRemoval: number;
  additionalAttemptsAfterPayment: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      maxlength: [100, 'Batch name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Batch description is required'],
      trim: true,
      maxlength: [500, 'Batch description cannot be more than 500 characters'],
    },
    year: {
      type: Number,
      required: [true, 'Batch year is required'],
      min: [2000, 'Batch year must be at least 2000'],
      max: [2100, 'Batch year must be less than 2100'],
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department name cannot be more than 100 characters'],
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot be more than 12'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxAttempts: {
      type: Number,
      required: [true, 'Max attempts is required'],
      min: [1, 'Max attempts must be at least 1'],
      default: 3,
    },
    maxSecurityIncidents: {
      type: Number,
      required: false,
      min: [1, 'Max security incidents must be at least 1'],
      default: 5,
    },
    enableAutoSuspend: {
      type: Boolean,
      default: true,
    },
    additionalSecurityIncidentsAfterRemoval: {
      type: Number,
      required: false,
      min: [0, 'Additional security incidents must be at least 0'],
      default: 3,
    },
    additionalAttemptsAfterPayment: {
      type: Number,
      required: false,
      min: [1, 'Additional attempts must be at least 1'],
      default: 2,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Register the model if it hasn't been registered yet
let Batch: mongoose.Model<IBatch>;

try {
  // Try to retrieve the existing model
  Batch = mongoose.model<IBatch>('Batch');
} catch (error) {
  // Model doesn't exist, so register it
  Batch = mongoose.model<IBatch>('Batch', BatchSchema);
}

export default Batch;
