const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Batch = require('../models/Batch');
const BatchSubscriptionAssignment = require('../models/BatchSubscriptionAssignment');
const StudentSubscription = require('../models/StudentSubscription');
const Exam = require('../models/Exam');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examintelligence', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkStudent = async () => {
  try {
    console.log('🔍 Checking student: bhushan0242@gmail.com\n');
    
    const student = await User.findOne({ email: 'bhushan0242@gmail.com' });
    
    if (!student) {
      console.log('❌ Student not found');
      return;
    }
    
    console.log('✅ Student found:');
    console.log(`   Name: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Role: ${student.role}`);
    console.log(`   Batch: ${student.batch || 'NOT ASSIGNED'}`);
    console.log(`   College: ${student.college}`);
    console.log(`   Is Blocked: ${student.isBlocked}`);
    console.log(`   Subscription Status: ${student.subscriptionStatus}\n`);
    
    if (!student.batch) {
      console.log('❌ ISSUE: Student has no batch assigned');
      console.log('   → Admin needs to assign student to a batch\n');
      return;
    }
    
    const batch = await Batch.findById(student.batch).populate('subject college');
    if (!batch) {
      console.log('❌ Batch not found');
      return;
    }
    
    console.log('✅ Batch found:');
    console.log(`   Name: ${batch.name}`);
    console.log(`   Subject: ${batch.subject?.name || 'N/A'}`);
    console.log(`   College: ${batch.college?.name || 'N/A'}`);
    console.log(`   Is Active: ${batch.isActive}\n`);
    
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: student.batch,
      isActive: true
    }).populate('subscriptionPlan');
    
    if (!batchAssignment) {
      console.log('❌ ISSUE: Batch not assigned to subscription plan');
      console.log('   → Admin needs to assign batch to subscription plan');
      console.log('   → Go to /admin/batch-assignments\n');
      return;
    }
    
    console.log('✅ Batch-Subscription Assignment found:');
    console.log(`   Plan: ${batchAssignment.subscriptionPlan.name}`);
    console.log(`   Price: ₹${batchAssignment.subscriptionPlan.price}`);
    console.log(`   Duration: ${batchAssignment.subscriptionPlan.duration} months\n`);
    
    const studentSubscription = await StudentSubscription.findOne({
      student: student._id
    }).populate('plan');
    
    if (!studentSubscription) {
      console.log('❌ ISSUE: Student has no subscription');
      console.log(`   → Student needs to subscribe to: ${batchAssignment.subscriptionPlan.name}`);
      console.log(`   → Price: ₹${batchAssignment.subscriptionPlan.price}\n`);
      return;
    }
    
    const isExpired = new Date() > studentSubscription.endDate;
    
    console.log('✅ Student Subscription found:');
    console.log(`   Plan: ${studentSubscription.plan.name}`);
    console.log(`   Status: ${studentSubscription.status}`);
    console.log(`   Expired: ${isExpired}`);
    console.log(`   End Date: ${studentSubscription.endDate}\n`);
    
    if (isExpired) {
      console.log('❌ ISSUE: Subscription expired');
      return;
    }
    
    if (studentSubscription.status !== 'active') {
      console.log(`❌ ISSUE: Subscription status is "${studentSubscription.status}"`);
      return;
    }
    
    const exams = await Exam.find({
      assignedBatches: { $in: [student.batch] }
    });
    
    console.log(`✅ Exams assigned to batch: ${exams.length}`);
    
    if (exams.length === 0) {
      console.log('❌ ISSUE: No exams assigned to batch');
      console.log('   → Admin needs to assign exams to batch');
      console.log('   → Go to /admin/assign-exams\n');
      return;
    }
    
    console.log('\n🎉 SUCCESS: Student should see exams!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const run = async () => {
  await connectDB();
  await checkStudent();
  process.exit(0);
};

run();
