// Quick script to check student exam flow
// Run this in your browser console while logged in as a student

async function checkStudentExamFlow() {
  try {
    const token = localStorage.getItem('token');
    
    console.log('🔍 Checking student exam flow...');
    
    // Check student info
    const studentResponse = await fetch('/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const studentData = await studentResponse.json();
    
    console.log('📊 Student Dashboard Data:', studentData);
    
    // Check subscription status
    if (studentData.subscriptionStatus) {
      console.log('💳 Subscription Status:', studentData.subscriptionStatus);
      
      if (!studentData.subscriptionStatus.hasAssignment) {
        console.log('❌ ISSUE: No subscription plan assigned to batch');
        return;
      }
      
      if (!studentData.subscriptionStatus.hasSubscription) {
        console.log('❌ ISSUE: Student has no subscription');
        return;
      }
      
      if (studentData.subscriptionStatus.isExpired) {
        console.log('❌ ISSUE: Subscription has expired');
        return;
      }
    }
    
    // Check exams
    const examsResponse = await fetch('/api/student/exams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const examsData = await examsResponse.json();
    
    console.log('📝 Exams Data:', examsData);
    
    if (examsData.success) {
      console.log(`✅ Found ${examsData.exams.length} exams`);
    } else {
      console.log('❌ ISSUE:', examsData.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkStudentExamFlow();
