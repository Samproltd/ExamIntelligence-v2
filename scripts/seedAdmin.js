import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up proper directory path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  hasInviteSent: { type: Boolean, default: false },
  inviteSentAt: { type: Date },
});

// Check if model already exists to avoid overwriting
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    // Use default MongoDB URI if not provided
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'examadmin@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Updating password...');
      
      // Update the password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('Admin password updated successfully');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create admin user
    const admin = new User({
      name: 'Exam Admin',
      email: 'examadmin@gmail.com',
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: examadmin@gmail.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
