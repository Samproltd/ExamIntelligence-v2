import mongoose from 'mongoose';

export interface IExamSuspension extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  incidents: mongoose.Types.ObjectId[]; // References to SecurityIncident documents
  suspensionTime: Date;
  reason: string;
  reviewedByAdmin: boolean;
  adminNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  removed?: boolean; // Flag to indicate if suspension has been removed
  removedAt?: Date; // When the suspension was removed
  isNew: boolean; // Flag to indicate if this is a newly created document
}

const ExamSuspensionSchema = new mongoose.Schema(
  {
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
    incidents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SecurityIncident',
      },
    ],
    suspensionTime: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
    },
    reviewedByAdmin: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    removed: {
      type: Boolean,
      default: false,
    },
    removedAt: {
      type: Date,
    },
    isNew: {
      type: Boolean,
      default: true,
      select: false, // Don't include in query results by default
    },
  },
  {
    suppressReservedKeysWarning: true,
  }
);

// Drop any existing indexes to avoid conflicts
ExamSuspensionSchema.index({ student: 1, exam: 1 }, { background: true });

// Create a unique compound index on student+exam+removed
// This ensures only one active suspension can exist per student-exam pair
ExamSuspensionSchema.index(
  { student: 1, exam: 1, removed: 1 },
  {
    unique: true,
    partialFilterExpression: { removed: { $ne: true } },
    background: true,
  }
);

// Create a pre-save hook to check for existing active suspensions
ExamSuspensionSchema.pre('save', async function (next) {
  // Only run this check for new documents (not updates)
  if (!this.isNew) {
    return next();
  }

  // Skip the check if this is a removed suspension
  if (this.removed) {
    return next();
  }

  try {
    // Check if there's already an active suspension for this student-exam pair
    const ExamSuspension = mongoose.model('ExamSuspension');
    const existingSuspension = await ExamSuspension.findOne({
      student: this.student,
      exam: this.exam,
      removed: { $ne: true },
    });

    if (existingSuspension) {
      // Instead of creating a duplicate, just use the existing one
      console.log(`Found existing suspension: ${existingSuspension._id}`);
      return next(new Error('DUPLICATE_SUSPENSION'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

let ExamSuspension: mongoose.Model<IExamSuspension>;

try {
  ExamSuspension = mongoose.model<IExamSuspension>('ExamSuspension');
} catch {
  ExamSuspension = mongoose.model<IExamSuspension>('ExamSuspension', ExamSuspensionSchema);
}

export default ExamSuspension;
