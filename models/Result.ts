import mongoose from 'mongoose';

interface IAnswer {
  question: mongoose.Types.ObjectId;
  selectedOption: string;
  isCorrect: boolean;
}

interface ICertificate {
  certificateId: string;
  issuedDate: Date;
  emailSent: boolean;
}

export interface IResult extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  startTime: Date;
  endTime: Date;
  certificate?: ICertificate;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOption: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const ResultSchema = new mongoose.Schema({
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
  answers: {
    type: [AnswerSchema],
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  certificate: {
    type: {
      certificateId: {
        type: String,
        required: true,
      },
      issuedDate: {
        type: Date,
        required: true,
      },
      emailSent: {
        type: Boolean,
        default: false,
      },
    },
    required: false,
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
ResultSchema.pre<IResult>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Define indexes
const indexes = [
  { key: { student: 1, exam: 1 }, options: {} },
  { key: { student: 1, exam: 1, attemptNumber: 1 }, options: { unique: true } },
];

// Create the model
const Result = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);

// Initialize indexes safely
const initializeIndexes = async () => {
  try {
    const collection = mongoose.connection.collection('results');

    // Get existing indexes
    const existingIndexes = await collection.listIndexes().toArray();

    // Create each index if it doesn't exist
    for (const index of indexes) {
      const indexName = Object.entries(index.key)
        .map(([key, value]) => `${key}_${value}`)
        .join('_');

      const indexExists = existingIndexes.some(existing => existing.name === indexName);

      if (!indexExists) {
        await collection
          .createIndex(index.key, index.options)
          .catch(err => console.error(`Error creating index ${indexName}:`, err));
      }
    }
  } catch (error) {
    console.error('Error managing indexes:', error);
  }
};

// Initialize indexes when the connection is ready
if (mongoose.connection.readyState === 1) {
  initializeIndexes();
} else {
  mongoose.connection.once('connected', initializeIndexes);
}

export default Result;
