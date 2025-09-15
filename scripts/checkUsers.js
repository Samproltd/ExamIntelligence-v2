import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Define a simplified schema matching the User model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  createdAt: Date,
  updatedAt: Date,
});

// Use the existing User model if available, otherwise create it
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('-password');
    console.log('\nAdmin users found:', admins.length);
    admins.forEach((admin, index) => {
      console.log(`\nAdmin #${index + 1}:`);
      console.log('ID:', admin._id);
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Created At:', admin.createdAt);
    });

    // Find all student users (limit to 5)
    const studentCount = await User.countDocuments({ role: 'student' });
    const students = await User.find({ role: 'student' }).limit(5).select('-password');
    console.log(`\nStudent users found: ${studentCount} (showing first 5)`);
    students.forEach((student, index) => {
      console.log(`\nStudent #${index + 1}:`);
      console.log('ID:', student._id);
      console.log('Name:', student.name);
      console.log('Email:', student.email);
    });
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers();
