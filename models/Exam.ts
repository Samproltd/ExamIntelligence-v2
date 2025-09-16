import mongoose from 'mongoose';

export interface IExam extends mongoose.Document {
  name: string;
  description: string;
  course: mongoose.Types.ObjectId;
  college: mongoose.Types.ObjectId; // Required
  duration: number; // in minutes
  totalMarks: number;
  passPercentage: number;
  totalQuestions: number; // Total number of questions in the pool
  questionsToDisplay: number; // Number of questions to show in the exam
  assignedBatches?: mongoose.Types.ObjectId[]; // Array of batch IDs this exam is assigned to
  maxAttempts: number;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  examType: 'practice' | 'assessment' | 'final';
  proctoringLevel: 'basic' | 'advanced' | 'ai_enhanced';
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide exam name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide exam description'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please provide course ID'],
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required'],
  },
  duration: {
    type: Number,
    required: [true, 'Please provide exam duration in minutes'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please provide total marks'],
  },
  passPercentage: {
    type: Number,
    required: true,
    default: 40,
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Please provide total number of questions'],
    min: [1, 'Total questions cannot be less than 1'],
  },
  questionsToDisplay: {
    type: Number,
    required: [true, 'Please provide number of questions to display'],
    min: [1, 'Questions to display cannot be less than 1'],
    validate: {
      validator: function (v: number) {
        return v <= (this as any).totalQuestions;
      },
      message: 'Number of questions to display cannot be greater than total questions',
    },
  },
  assignedBatches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
  ],
  maxAttempts: {
    type: Number,
    default: 1,
    min: [1, 'Max attempts cannot be less than 1'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  examType: {
    type: String,
    enum: ['practice', 'assessment', 'final'],
    default: 'assessment',
  },
  proctoringLevel: {
    type: String,
    enum: ['basic', 'advanced', 'ai_enhanced'],
    default: 'basic',
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
ExamSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Ensure unique exam names within a course
ExamSchema.index({ name: 1, course: 1 }, { unique: true });

// Create the model if it doesn't exist, otherwise use the existing one
const Exam = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);

export default Exam;
