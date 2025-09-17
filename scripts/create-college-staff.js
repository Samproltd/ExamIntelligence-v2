const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';

// User Schema (simplified for script)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'college_admin', 'college_staff', 'student'],
    default: 'student'
  },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  subscriptionStatus: { 
    type: String, 
    enum: ['active', 'expired', 'suspended', 'none'],
    default: 'none'
  },
  isVerified: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// College Schema (simplified for script)
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  adminEmail: { type: String, required: true },
  adminName: { type: String, required: true },
  maxStudents: { type: Number, default: 1000 },
  currentStudents: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  settings: {
    allowStudentRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    enableProctoring: { type: Boolean, default: false },
    enableCertificates: { type: Boolean, default: false },
    allowStudentSubscriptions: { type: Boolean, default: true }
  },
  branding: {
    logo: { type: String, default: '' },
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#1E40AF' },
    customDomain: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const College = mongoose.model('College', collegeSchema);

async function createCollegeStaff() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first college (assuming it exists)
    const college = await College.findOne();
    if (!college) {
      console.log('No college found. Please create a college first.');
      return;
    }

    console.log(`Using college: ${college.name} (${college.code})`);

    // Create College Admin
    const collegeAdminData = {
      name: 'College Admin',
      email: 'college.admin@example.com',
      password: 'admin123',
      role: 'college_admin',
      college: college._id,
      isVerified: true,
      isBlocked: false
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    collegeAdminData.password = await bcrypt.hash(collegeAdminData.password, salt);

    // Check if college admin already exists
    let collegeAdmin = await User.findOne({ email: collegeAdminData.email });
    if (!collegeAdmin) {
      collegeAdmin = new User(collegeAdminData);
      await collegeAdmin.save();
      console.log('✅ College Admin created successfully:');
      console.log(`   Email: ${collegeAdminData.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Role: ${collegeAdminData.role}`);
      console.log(`   College: ${college.name}`);
    } else {
      console.log('⚠️  College Admin already exists:', collegeAdminData.email);
    }

    // Create College Staff
    const collegeStaffData = {
      name: 'College Staff',
      email: 'college.staff@example.com',
      password: 'staff123',
      role: 'college_staff',
      college: college._id,
      isVerified: true,
      isBlocked: false
    };

    // Hash password
    collegeStaffData.password = await bcrypt.hash(collegeStaffData.password, salt);

    // Check if college staff already exists
    let collegeStaff = await User.findOne({ email: collegeStaffData.email });
    if (!collegeStaff) {
      collegeStaff = new User(collegeStaffData);
      await collegeStaff.save();
      console.log('✅ College Staff created successfully:');
      console.log(`   Email: ${collegeStaffData.email}`);
      console.log(`   Password: staff123`);
      console.log(`   Role: ${collegeStaffData.role}`);
      console.log(`   College: ${college.name}`);
    } else {
      console.log('⚠️  College Staff already exists:', collegeStaffData.email);
    }

    // Create additional college staff members
    const additionalStaff = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        password: 'john123',
        role: 'college_staff'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'sarah123',
        role: 'college_staff'
      }
    ];

    for (const staffData of additionalStaff) {
      const fullStaffData = {
        ...staffData,
        college: college._id,
        isVerified: true,
        isBlocked: false
      };

      // Hash password
      fullStaffData.password = await bcrypt.hash(fullStaffData.password, salt);

      // Check if staff already exists
      let staff = await User.findOne({ email: fullStaffData.email });
      if (!staff) {
        staff = new User(fullStaffData);
        await staff.save();
        console.log(`✅ ${staffData.name} created successfully:`);
        console.log(`   Email: ${fullStaffData.email}`);
        console.log(`   Password: ${staffData.password}`);
        console.log(`   Role: ${fullStaffData.role}`);
        console.log(`   College: ${college.name}`);
      } else {
        console.log(`⚠️  ${staffData.name} already exists:`, fullStaffData.email);
      }
    }

    console.log('\n🎉 College staff creation completed!');
    console.log('\n📋 Login Credentials:');
    console.log('College Admin:');
    console.log('  Email: college.admin@example.com');
    console.log('  Password: admin123');
    console.log('  Dashboard: /college-admin');
    console.log('\nCollege Staff:');
    console.log('  Email: college.staff@example.com');
    console.log('  Password: staff123');
    console.log('  Dashboard: /college-staff');
    console.log('\nAdditional Staff:');
    console.log('  Email: john.smith@example.com | Password: john123');
    console.log('  Email: sarah.johnson@example.com | Password: sarah123');

  } catch (error) {
    console.error('Error creating college staff:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createCollegeStaff();
