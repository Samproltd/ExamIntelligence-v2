import mongoose from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends mongoose.Document {
  text: string;
  options: IOption[];
  category: string;
  exam?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide option text'],
    trim: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true,
  },
  options: {
    type: [OptionSchema],
    required: [true, 'Please provide options'],
    validate: {
      validator: function (options: IOption[]) {
        // Ensure there are between 2 and 6 options
        if (options.length < 2 || options.length > 6) {
          return false;
        }
        
        // Ensure at least one option is correct
        return options.some(option => option.isCorrect);
      },
      message: 'Questions must have 2-6 options with at least one correct option',
    },
  },
  category: {
    type: String,
    required: [true, 'Please provide question category'],
    trim: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
QuestionSchema.pre<IQuestion>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);