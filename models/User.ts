import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends mongoose.Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  batch?: mongoose.Types.ObjectId;
  rollNumber?: string;
  dateOfBirth?: Date;
  mobile?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  // Add these to your User interface/schema
  hasInviteSent: boolean;
  inviteSentAt: Date;
  // Block and Unblock
  isBlocked: boolean;
}

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    firstName: {
      type: String,
      maxlength: [25, 'First name cannot be more than 25 characters'],
    },
    lastName: {
      type: String,
      maxlength: [25, 'Last name cannot be more than 25 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['admin', 'student'],
      default: 'student',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Roll number cannot be more than 20 characters'],
    },
    dateOfBirth: {
      type: Date,
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: [15, 'Mobile number cannot be more than 15 characters'],
    },
    hasInviteSent: {
      type: Boolean,
      default: false,
    },
    inviteSentAt: {
      type: Date,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Register the model if it hasn't been registered yet
let User: mongoose.Model<IUser>;

try {
  // Try to retrieve the existing model
  User = mongoose.model<IUser>('User');
} catch (error) {
  console.log('Error creating User model:', error);
  // Model doesn't exist, so register it
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;
