import mongoose from 'mongoose';

export interface ICourse extends mongoose.Document {
  name: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  college: mongoose.Types.ObjectId; // Required
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new mongoose.Schema({
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
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
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
CourseSchema.pre<ICourse>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Register the model if it hasn't been registered yet
let Course: mongoose.Model<ICourse>;

try {
  // Try to retrieve the existing model
  Course = mongoose.model<ICourse>('Course');
} catch (error) {
  // Model doesn't exist, so register it
  Course = mongoose.model<ICourse>('Course', CourseSchema);
}

export default Course;