const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas directly in the script
const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  address: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  adminEmail: { type: String, required: true },
  adminName: { type: String, required: true },
  maxStudents: { type: Number, default: 0 },
  currentStudents: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  settings: {
    allowStudentRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    enableProctoring: { type: Boolean, default: false },
    enableCertificates: { type: Boolean, default: false },
    allowStudentSubscriptions: { type: Boolean, default: true },
  },
  branding: {
    logo: { type: String },
    primaryColor: { type: String, default: '#007bff' },
    secondaryColor: { type: String, default: '#6c757d' },
    customDomain: { type: String },
  },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'college_admin', 'college_staff', 'student'],
    default: 'student',
  },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentSubscription' },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'none'],
    default: 'none',
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  lastLoginAt: { type: Date },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  rollNumber: { type: String, trim: true },
  dateOfBirth: { type: Date },
  mobile: { type: String, trim: true },
  hasInviteSent: { type: Boolean, default: false },
  inviteSentAt: { type: Date },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
}, { timestamps: true });

// Create models
const College = mongoose.model('College', CollegeSchema);
const User = mongoose.model('User', UserSchema);
const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

async function setupMultiCollege() {
  try {
    console.log('🚀 Setting up multi-college structure...');
    
    await connectDB();

    // Step 1: Create default college
    console.log('\n📝 Step 1: Creating default college...');
    let defaultCollege = await College.findOne({ code: 'DEFAULT' });
    
    if (!defaultCollege) {
      defaultCollege = new College({
        name: 'Default College',
        code: 'DEFAULT',
        address: 'Default Address, City, State',
        contactEmail: 'admin@defaultcollege.com',
        contactPhone: '+91-0000000000',
        adminEmail: 'admin@defaultcollege.com',
        adminName: 'Default Admin',
        maxStudents: 10000,
        currentStudents: 0,
        isActive: true,
        settings: {
          allowStudentRegistration: true,
          requireEmailVerification: true,
          enableProctoring: true,
          enableCertificates: true,
          allowStudentSubscriptions: true,
        },
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
        },
      });
      
      await defaultCollege.save();
      console.log('✅ Default college created');
    } else {
      console.log('✅ Default college already exists');
    }

    // Step 2: Update existing admin user
    console.log('\n👤 Step 2: Updating admin user...');
    const existingAdmin = await User.findOne({ email: 'examadmin@gmail.com' });
    
    if (existingAdmin) {
      // Update admin user with new fields
      existingAdmin.role = 'admin';
      existingAdmin.college = defaultCollege._id;
      existingAdmin.subscriptionStatus = 'none';
      existingAdmin.isVerified = true;
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      existingAdmin.password = hashedPassword;
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const admin = new User({
        name: 'Exam Admin',
        email: 'examadmin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        college: defaultCollege._id,
        subscriptionStatus: 'none',
        isVerified: true,
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully');
    }

    // Step 3: Update existing users without college
    console.log('\n👥 Step 3: Updating existing users...');
    const usersWithoutCollege = await User.find({ college: { $exists: false } });
    console.log(`Found ${usersWithoutCollege.length} users without college assignment`);
    
    for (const user of usersWithoutCollege) {
      user.college = defaultCollege._id;
      user.subscriptionStatus = 'none';
      user.isVerified = true;
      
      // Update role if it's 'super_admin' to 'admin'
      if (user.role === 'super_admin') {
        user.role = 'admin';
      }
      
      await user.save();
    }
    console.log(`✅ Updated ${usersWithoutCollege.length} users`);

    // Step 4: Create default subscription plans
    console.log('\n💳 Step 4: Creating default subscription plans...');
    const existingPlans = await SubscriptionPlan.countDocuments();
    
    if (existingPlans === 0) {
      const defaultPlans = [
        {
          name: 'Basic Plan',
          description: 'Basic plan for 1 year with essential features',
          duration: 12,
          price: 2500,
          features: [
            'Unlimited Exams',
            'Basic Proctoring',
            'Email Support',
            'Standard Certificates'
          ],
          isActive: true,
          isDefault: true,
          createdBy: defaultCollege._id, // Using college ID as createdBy for now
          college: defaultCollege._id,
        },
        {
          name: 'Premium Plan',
          description: 'Premium plan for 2 years with advanced features',
          duration: 24,
          price: 4000,
          features: [
            'Unlimited Exams',
            'Advanced Proctoring',
            'Priority Support',
            'Premium Certificates',
            'Analytics Dashboard'
          ],
          isActive: true,
          isDefault: false,
          createdBy: defaultCollege._id,
          college: defaultCollege._id,
        },
        {
          name: 'Lifetime Access',
          description: 'Lifetime access to all features',
          duration: 999,
          price: 8000,
          features: [
            'Unlimited Exams',
            'All Proctoring Features',
            'Dedicated Support',
            'Premium Certificates',
            'Full Analytics',
            'Priority Updates'
          ],
          isActive: true,
          isDefault: false,
          createdBy: defaultCollege._id,
          college: defaultCollege._id,
        }
      ];

      for (const planData of defaultPlans) {
        const plan = new SubscriptionPlan(planData);
        await plan.save();
      }
      console.log('✅ Created 3 default subscription plans');
    } else {
      console.log('✅ Subscription plans already exist');
    }

    // Step 5: Update college student count
    console.log('\n📊 Step 5: Updating college statistics...');
    const studentCount = await User.countDocuments({ 
      role: 'student', 
      college: defaultCollege._id 
    });
    
    defaultCollege.currentStudents = studentCount;
    await defaultCollege.save();
    console.log(`✅ Updated college student count: ${studentCount}`);

    console.log('\n🎉 Multi-college setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log(`- Default college created/updated`);
    console.log(`- Admin user updated (email: examadmin@gmail.com, password: Admin@123)`);
    console.log(`- ${usersWithoutCollege.length} users migrated`);
    console.log(`- College student count: ${studentCount}`);
    console.log(`- Default subscription plans created`);
    console.log('\n🔑 Login Credentials:');
    console.log('Email: examadmin@gmail.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupMultiCollege()
    .then(() => {
      console.log('✅ Setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = setupMultiCollege;
