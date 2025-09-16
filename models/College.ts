import mongoose from 'mongoose';

export interface ICollege extends mongoose.Document {
  name: string;
  code: string; // Unique college code
  address: string;
  contactEmail: string;
  contactPhone: string;
  adminEmail: string;
  adminName: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Reference to User who created this college
  settings: {
    allowStudentRegistration: boolean;
    requireEmailVerification: boolean;
    enableProctoring: boolean;
    enableCertificates: boolean;
    allowStudentSubscriptions: boolean;
  };
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: [100, 'College name cannot be more than 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'College code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, 'College code cannot be more than 10 characters'],
    },
    address: {
      type: String,
      required: [true, 'College address is required'],
      trim: true,
      maxlength: [500, 'Address cannot be more than 500 characters'],
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      maxlength: [15, 'Phone number cannot be more than 15 characters'],
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
    },
    adminName: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
      maxlength: [50, 'Admin name cannot be more than 50 characters'],
    },
    maxStudents: {
      type: Number,
      required: [true, 'Max students is required'],
      min: [1, 'Max students must be at least 1'],
      default: 1000,
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: [0, 'Current students cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      allowStudentRegistration: {
        type: Boolean,
        default: true,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      enableProctoring: {
        type: Boolean,
        default: true,
      },
      enableCertificates: {
        type: Boolean,
        default: true,
      },
      allowStudentSubscriptions: {
        type: Boolean,
        default: true,
      },
    },
    branding: {
      logo: {
        type: String,
        default: '',
      },
      primaryColor: {
        type: String,
        default: '#3B82F6',
        match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color'],
      },
      secondaryColor: {
        type: String,
        default: '#1E40AF',
        match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color'],
      },
      customDomain: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Register the model if it hasn't been registered yet
let College: mongoose.Model<ICollege>;

try {
  // Try to retrieve the existing model
  College = mongoose.model<ICollege>('College');
} catch (error) {
  // Model doesn't exist, so register it
  College = mongoose.model<ICollege>('College', CollegeSchema);
}

export default College;
