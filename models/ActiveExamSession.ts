import mongoose from 'mongoose';

export interface IActiveExamSession extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  startTime: Date;
  lastActive: Date;
  browserInfo: string;
  ipAddress: string;
  deviceInfo: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActiveExamSessionSchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    required: true,
    default: Date.now,
  },
  browserInfo: {
    type: String,
    required: false,
  },
  ipAddress: {
    type: String,
    required: false,
  },
  deviceInfo: {
    type: String,
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Update the lastActive and updatedAt field on save
ActiveExamSessionSchema.pre<IActiveExamSession>('save', function (next) {
  this.lastActive = new Date();
  this.updatedAt = new Date();
  next();
});

// Create a unique index on student+exam to ensure only one active session per student-exam
ActiveExamSessionSchema.index(
  { student: 1, exam: 1 },
  {
    unique: true,
    background: true,
  }
);

// Create index on isActive for quick filtering
ActiveExamSessionSchema.index({ isActive: 1 }, { background: true });

// Create the model
const ActiveExamSession =
  mongoose.models.ActiveExamSession ||
  mongoose.model<IActiveExamSession>('ActiveExamSession', ActiveExamSessionSchema);

export default ActiveExamSession;
