const mongoose = require('mongoose');

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

// Quick check function
const quickCheck = async () => {
  try {
    console.log('🔍 Quick Student Status Check for bhushan0242@gmail.com\n');
    
    // Import models
    const User = require('./models/User');
    const Batch = require('./models/Batch');
    const BatchSubscriptionAssignment = require('./models/BatchSubscriptionAssignment');
    const StudentSubscription = require('./models/StudentSubscription');
    const Exam = require('./models/Exam');
    
    const studentEmail = 'bhushan0242@gmail.com';
    
    // Find student
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      console.log('❌ Student not found');
      return;
    }
    
    console.log(`✅ Student: ${student.name} (${student.email})`);
    console.log(`   Batch: ${student.batch || 'NOT ASSIGNED'}`);
    
    if (!student.batch) {
      console.log('\n❌ ISSUE: Student has no batch assigned');
      console.log('   → Admin needs to assign student to a batch');
      return;
    }
    
    // Check batch assignment
    const batchAssignment = await BatchSubscriptionAssignment.findOne({
      batch: student.batch,
      isActive: true
    }).populate('subscriptionPlan');
    
    if (!batchAssignment) {
      console.log('\n❌ ISSUE: Batch not assigned to subscription plan');
      console.log('   → Admin needs to assign batch to subscription plan');
      console.log('   → Go to /admin/batch-assignments');
      return;
    }
    
    console.log(`✅ Batch assigned to: ${batchAssignment.subscriptionPlan.name}`);
    
    // Check student subscription
    const studentSubscription = await StudentSubscription.findOne({
      student: student._id
    }).populate('plan');
    
    if (!studentSubscription) {
      console.log('\n❌ ISSUE: Student has no subscription');
      console.log(`   → Student needs to subscribe to: ${batchAssignment.subscriptionPlan.name}`);
      return;
    }
    
    const isExpired = new Date() > studentSubscription.endDate;
    console.log(`✅ Student subscription: ${studentSubscription.plan.name}`);
    console.log(`   Status: ${studentSubscription.status}`);
    console.log(`   Expired: ${isExpired}`);
    
    if (isExpired || studentSubscription.status !== 'active') {
      console.log('\n❌ ISSUE: Subscription not active or expired');
      return;
    }
    
    // Check exams
    const exams = await Exam.find({
      assignedBatches: { $in: [student.batch] }
    });
    
    console.log(`✅ Exams assigned to batch: ${exams.length}`);
    
    if (exams.length === 0) {
      console.log('\n❌ ISSUE: No exams assigned to batch');
      console.log('   → Admin needs to assign exams to batch');
      console.log('   → Go to /admin/assign-exams');
      return;
    }
    
    console.log('\n🎉 All checks passed! Student should see exams.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the check
const runCheck = async () => {
  await connectDB();
  await quickCheck();
  process.exit(0);
};

runCheck();
