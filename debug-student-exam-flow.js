const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import your models
const User = require('./models/User');
const Batch = require('./models/Batch');
const Exam = require('./models/Exam');
const BatchSubscriptionAssignment = require('./models/BatchSubscriptionAssignment');
const StudentSubscription = require('./models/StudentSubscription');
const SubscriptionPlan = require('./models/SubscriptionPlan');

// Database connection
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

// Main debugging function
const debugStudentExamFlow = async () => {
  try {
    console.log('🔍 Starting Student Exam Flow Debug...\n');
    
    const studentEmail = 'bhushan0242@gmail.com';
    
    // Step 1: Find the student
    console.log('📋 Step 1: Finding Student...');
    const student = await User.findOne({ email: studentEmail });
    
    if (!student) {
      console.log('❌ Student not found with email:', studentEmail);
      return;
    }
    
    console.log('✅ Student found:');
    console.log(`   - Name: ${student.name}`);
    console.log(`   - Email: ${student.email}`);
    console.log(`   - Role: ${student.role}`);
    console.log(`   - Batch ID: ${student.batch || 'NOT ASSIGNED'}`);
    console.log(`   - Is Blocked: ${student.isBlocked || false}`);
    console.log(`   - Created: ${student.createdAt}\n`);
    
    // Step 2: Check if student has a batch
    if (!student.batch) {
      console.log('❌ CRITICAL ISSUE: Student is not assigned to any batch!');
      console.log('   → This is why exams are not visible');
      console.log('   → Admin needs to assign student to a batch\n');
      return;
    }
    
    // Step 3: Get batch details
    console.log('📋 Step 2: Checking Batch Details...');
    const batch = await Batch.findById(student.batch).populate('subject college');
    
    if (!batch) {
      console.log('❌ Batch not found for student');
      return;
    }
    
    console.log('✅ Batch found:');
    console.log(`   - Name: ${batch.name}`);
    console.log(`   - Description: ${batch.description}`);
    console.log(`   - Year: ${batch.year}`);
    console.log(`   - Subject: ${batch.subject?.name || 'N/A'}`);
    console.log(`   - College: ${batch.college?.name || 'N/A'}`);
    console.log(`   - Is Active: ${batch.isActive}`);
    console.log(`   - Max Attempts: ${batch.maxAttempts || 'N/A'}\n`);
    
    // Step 4: Check batch subscription assignment
    console.log('📋 Step 3: Checking Batch-Subscription Assignment...');
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: student.batch,
      isActive: true
    }).populate('subscriptionPlan');
    
    if (!batchAssignment) {
      console.log('❌ CRITICAL ISSUE: Batch is not assigned to any subscription plan!');
      console.log('   → This is why exams are not visible');
      console.log('   → Admin needs to assign batch to a subscription plan');
      console.log('   → Go to /admin/batch-assignments and create assignment\n');
      return;
    }
    
    console.log('✅ Batch-Subscription Assignment found:');
    console.log(`   - Plan Name: ${batchAssignment.subscriptionPlan.name}`);
    console.log(`   - Plan Price: ₹${batchAssignment.subscriptionPlan.price}`);
    console.log(`   - Plan Duration: ${batchAssignment.subscriptionPlan.duration} months`);
    console.log(`   - Assignment Active: ${batchAssignment.isActive}`);
    console.log(`   - Assignment Date: ${batchAssignment.assignmentDate}\n`);
    
    // Step 5: Check student's individual subscription
    console.log('📋 Step 4: Checking Student Individual Subscription...');
    const studentSubscription = await StudentSubscription.findOne({
      student: student._id
    }).populate('plan');
    
    if (!studentSubscription) {
      console.log('❌ CRITICAL ISSUE: Student has no individual subscription!');
      console.log('   → This is why exams are not visible');
      console.log('   → Student needs to subscribe to the plan assigned to their batch');
      console.log(`   → Required Plan: ${batchAssignment.subscriptionPlan.name} (₹${batchAssignment.subscriptionPlan.price})\n`);
      return;
    }
    
    console.log('✅ Student Subscription found:');
    console.log(`   - Plan: ${studentSubscription.plan.name}`);
    console.log(`   - Status: ${studentSubscription.status}`);
    console.log(`   - Start Date: ${studentSubscription.startDate}`);
    console.log(`   - End Date: ${studentSubscription.endDate}`);
    console.log(`   - Is Expired: ${new Date() > studentSubscription.endDate}`);
    console.log(`   - Payment Status: ${studentSubscription.paymentStatus}\n`);
    
    // Step 6: Validate subscription
    const now = new Date();
    const isExpired = studentSubscription.endDate < now;
    
    if (isExpired) {
      console.log('❌ CRITICAL ISSUE: Student subscription has expired!');
      console.log(`   → Expired on: ${studentSubscription.endDate}`);
      console.log('   → Student needs to renew subscription\n');
      return;
    }
    
    if (studentSubscription.status !== 'active') {
      console.log(`❌ CRITICAL ISSUE: Student subscription status is "${studentSubscription.status}"!`);
      console.log('   → Subscription must be "active" to access exams\n');
      return;
    }
    
    // Step 7: Check plan mismatch
    if (studentSubscription.plan._id.toString() !== batchAssignment.subscriptionPlan._id.toString()) {
      console.log('❌ CRITICAL ISSUE: Subscription plan mismatch!');
      console.log(`   → Student subscribed to: ${studentSubscription.plan.name}`);
      console.log(`   → Batch requires: ${batchAssignment.subscriptionPlan.name}`);
      console.log('   → Student needs to subscribe to the correct plan\n');
      return;
    }
    
    console.log('✅ Subscription validation passed!\n');
    
    // Step 8: Check available exams
    console.log('📋 Step 5: Checking Available Exams...');
    const exams = await Exam.find({
      assignedBatches: { $in: [student.batch] }
    }).populate('course subject college');
    
    console.log(`✅ Found ${exams.length} exams assigned to student's batch:`);
    
    if (exams.length === 0) {
      console.log('❌ CRITICAL ISSUE: No exams are assigned to student\'s batch!');
      console.log('   → Admin needs to assign exams to the batch');
      console.log('   → Go to /admin/assign-exams and assign exams to batches\n');
      return;
    }
    
    exams.forEach((exam, index) => {
      console.log(`   ${index + 1}. ${exam.name}`);
      console.log(`      - Course: ${exam.course?.name || 'N/A'}`);
      console.log(`      - Duration: ${exam.duration} minutes`);
      console.log(`      - Total Marks: ${exam.totalMarks}`);
      console.log(`      - Max Attempts: ${exam.maxAttempts || 'N/A'}`);
      console.log(`      - Is Active: ${exam.isActive || true}`);
    });
    
    console.log('\n🎉 SUCCESS: Student should be able to see exams!');
    console.log('   → All validation checks passed');
    console.log('   → Student has valid subscription');
    console.log('   → Exams are assigned to student\'s batch');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
};

// Run the debug script
const runDebug = async () => {
  await connectDB();
  await debugStudentExamFlow();
  process.exit(0);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the script
runDebug();
