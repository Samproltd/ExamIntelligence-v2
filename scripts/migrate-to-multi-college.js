const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
const User = require('../models/User');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const Exam = require('../models/Exam');
const Batch = require('../models/Batch');
const College = require('../models/College');

async function migrateToMultiCollege() {
  try {
    console.log('🚀 Starting migration to multi-college structure...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create default college
    console.log('\n📝 Step 1: Creating default college...');
    let defaultCollege = await College.findOne({ code: 'DEFAULT' });
    
    if (!defaultCollege) {
      defaultCollege = new College({
        name: 'Default College',
        code: 'DEFAULT',
        address: 'Default Address',
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

    // Step 2: Update User model
    console.log('\n👥 Step 2: Updating User model...');
    const usersWithoutCollege = await User.find({ college: { $exists: false } });
    console.log(`Found ${usersWithoutCollege.length} users without college assignment`);
    
    for (const user of usersWithoutCollege) {
      user.college = defaultCollege._id;
      user.subscriptionStatus = 'none';
      user.isVerified = true;
      
      // Update role if it's 'admin' to 'super_admin'
      if (user.role === 'admin') {
        user.role = 'super_admin';
      }
      
      await user.save();
    }
    console.log(`✅ Updated ${usersWithoutCollege.length} users`);

    // Step 3: Update Subject model
    console.log('\n📚 Step 3: Updating Subject model...');
    const subjectsWithoutCollege = await Subject.find({ college: { $exists: false } });
    console.log(`Found ${subjectsWithoutCollege.length} subjects without college assignment`);
    
    for (const subject of subjectsWithoutCollege) {
      subject.college = defaultCollege._id;
      subject.isActive = true;
      await subject.save();
    }
    console.log(`✅ Updated ${subjectsWithoutCollege.length} subjects`);

    // Step 4: Update Course model
    console.log('\n🎓 Step 4: Updating Course model...');
    const coursesWithoutCollege = await Course.find({ college: { $exists: false } });
    console.log(`Found ${coursesWithoutCollege.length} courses without college assignment`);
    
    for (const course of coursesWithoutCollege) {
      course.college = defaultCollege._id;
      course.isActive = true;
      await course.save();
    }
    console.log(`✅ Updated ${coursesWithoutCollege.length} courses`);

    // Step 5: Update Exam model
    console.log('\n📝 Step 5: Updating Exam model...');
    const examsWithoutCollege = await Exam.find({ college: { $exists: false } });
    console.log(`Found ${examsWithoutCollege.length} exams without college assignment`);
    
    for (const exam of examsWithoutCollege) {
      exam.college = defaultCollege._id;
      exam.isActive = true;
      exam.examType = 'assessment';
      exam.proctoringLevel = 'basic';
      await exam.save();
    }
    console.log(`✅ Updated ${examsWithoutCollege.length} exams`);

    // Step 6: Update Batch model
    console.log('\n👥 Step 6: Updating Batch model...');
    const batchesWithoutCollege = await Batch.find({ college: { $exists: false } });
    console.log(`Found ${batchesWithoutCollege.length} batches without college assignment`);
    
    for (const batch of batchesWithoutCollege) {
      batch.college = defaultCollege._id;
      await batch.save();
    }
    console.log(`✅ Updated ${batchesWithoutCollege.length} batches`);

    // Step 7: Update college student count
    console.log('\n📊 Step 7: Updating college statistics...');
    const studentCount = await User.countDocuments({ 
      role: 'student', 
      college: defaultCollege._id 
    });
    
    defaultCollege.currentStudents = studentCount;
    await defaultCollege.save();
    console.log(`✅ Updated college student count: ${studentCount}`);

    // Step 8: Create default subscription plans
    console.log('\n💳 Step 8: Creating default subscription plans...');
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    
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

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log(`- Default college created/updated`);
    console.log(`- ${usersWithoutCollege.length} users migrated`);
    console.log(`- ${subjectsWithoutCollege.length} subjects migrated`);
    console.log(`- ${coursesWithoutCollege.length} courses migrated`);
    console.log(`- ${examsWithoutCollege.length} exams migrated`);
    console.log(`- ${batchesWithoutCollege.length} batches migrated`);
    console.log(`- College student count: ${studentCount}`);
    console.log(`- Default subscription plans created`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToMultiCollege()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateToMultiCollege;
