import mongoose from 'mongoose';

export interface ISubject extends mongoose.Document {
  name: string;
  description: string;
  college: mongoose.Types.ObjectId; // Required
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [100, 'Name cannot be more than 100 characters'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required'],
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
SubjectSchema.pre<ISubject>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Register the model if it hasn't been registered yet
let Subject: mongoose.Model<ISubject>;

try {
  // Try to retrieve the existing model
  Subject = mongoose.model<ISubject>('Subject');
} catch (error) {
  // Model doesn't exist, so register it
  Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
}

export default Subject;