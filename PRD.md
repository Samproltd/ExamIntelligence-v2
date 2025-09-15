# Product Requirements Document (PRD)
## College-Based Subscription Model for Online Exam Portal

### 1. Executive Summary

**Project Name:** ExamIntelligence - Multi-College Subscription Platform  
**Version:** 2.0  
**Date:** January 2025  
**Target Market:** Multiple Colleges, Universities, and Educational Institutions  

### 2. Current System Analysis

#### 2.1 Existing Architecture
- **Frontend:** Next.js with TypeScript, Redux for state management
- **Backend:** Next.js API Routes with JWT authentication
- **Database:** MongoDB with Mongoose ODM
- **Payment:** Razorpay integration for individual payments
- **Current Flow:** Subject → Course → Exam → Student → Batch

#### 2.2 Current Data Models
- **User:** Basic admin/student roles with batch association
- **Subject:** Independent subjects created by admins
- **Course:** Linked to subjects
- **Exam:** Linked to courses with batch assignments
- **Batch:** Contains students with security settings
- **Payment:** Individual exam-based payments (₹300-500 per incident)

### 3. New System Requirements

#### 3.1 Multi-College Architecture
**New Flow:** College → Subject → Course → Exam → Student → Batch

#### 3.2 Subscription Model
- **Individual Student Subscriptions:** Each student pays for their own subscription
- **Dynamic Pricing:** Admin can configure subscription amounts from admin panel
- **Flexible Plans:** Admin can create custom subscription plans with different durations and prices
- **No College-Level Subscriptions:** Colleges don't pay - only individual students subscribe

### 4. Detailed Feature Specifications

#### 4.1 College Management System

##### 4.1.1 College Entity
```typescript
interface ICollege {
  name: string;
  code: string; // Unique college code
  address: string;
  contactEmail: string;
  contactPhone: string;
  adminEmail: string;
  adminName: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  settings: {
    allowStudentRegistration: boolean;
    requireEmailVerification: boolean;
    enableProctoring: boolean;
    enableCertificates: boolean;
    allowStudentSubscriptions: boolean; // Allow students to subscribe
  };
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

##### 4.1.2 College Admin Role
- **Super Admin:** Platform owner with access to all colleges
- **College Admin:** Manages their specific college
- **College Staff:** Limited access within college

#### 4.2 Enhanced User Management

##### 4.2.1 Updated User Model
```typescript
interface IUser {
  // Existing fields
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'college_admin' | 'college_staff' | 'student';
  
  // New fields
  college: mongoose.Types.ObjectId; // Required for all users
  subscription?: mongoose.Types.ObjectId; // Reference to StudentSubscription
  subscriptionStatus: 'active' | 'expired' | 'suspended' | 'none'; // Current status
  isVerified: boolean;
  verificationToken?: string;
  lastLoginAt?: Date;
  
  // Existing fields
  batch?: mongoose.Types.ObjectId;
  rollNumber?: string;
  dateOfBirth?: Date;
  mobile?: string;
  isBlocked: boolean;
}
```

#### 4.3 Subscription Management

##### 4.3.1 Dynamic Subscription Plans
```typescript
interface ISubscriptionPlan {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  duration: number; // in months
  price: number; // Dynamic - set by admin
  features: string[];
  isActive: boolean;
  isDefault: boolean; // Default plan for new students
  createdBy: mongoose.Types.ObjectId; // Admin who created this plan
  college?: mongoose.Types.ObjectId; // Optional: college-specific plan
  createdAt: Date;
  updatedAt: Date;
}

// Example of how admin can create plans dynamically
const EXAMPLE_PLANS = {
  'basic_1_year': {
    name: 'Basic 1 Year',
    description: 'Basic plan for 1 year',
    duration: 12,
    price: 2500, // Admin can change this
    features: ['Unlimited Exams', 'Basic Proctoring', 'Email Support'],
    isDefault: true
  },
  'premium_2_year': {
    name: 'Premium 2 Years',
    description: 'Premium plan for 2 years with discount',
    duration: 24,
    price: 4000, // Admin can change this
    features: ['Unlimited Exams', 'Advanced Proctoring', 'Priority Support'],
    isDefault: false
  },
  'lifetime': {
    name: 'Lifetime Access',
    description: 'Lifetime access to all features',
    duration: 999, // 999 months = lifetime
    price: 8000, // Admin can change this
    features: ['Unlimited Exams', 'All Proctoring Features', 'Dedicated Support'],
    isDefault: false
  }
};
```

##### 4.3.2 Student Subscription Management
```typescript
interface IStudentSubscription {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId; // Student who subscribed
  plan: mongoose.Types.ObjectId; // Subscription plan
  college: mongoose.Types.ObjectId; // Student's college
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  paymentId: string; // Razorpay payment ID
  amount: number; // Amount paid
  autoRenew: boolean; // Auto-renewal setting
  createdAt: Date;
  updatedAt: Date;
}
```

##### 4.3.3 Admin Subscription Management System
```typescript
interface IAdminSubscriptionSettings {
  _id: mongoose.Types.ObjectId;
  defaultPlan: mongoose.Types.ObjectId; // Default plan for new students
  allowStudentSubscriptions: boolean; // Allow students to subscribe
  requireSubscriptionForExams: boolean; // Require subscription to take exams
  gracePeriodDays: number; // Grace period after expiration
  autoRenewalEnabled: boolean; // Enable auto-renewal
  createdBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}
```

**Admin Features:**
- **Create Subscription Plans:** Admins can create custom subscription plans
- **Dynamic Pricing:** Set and update prices for any plan at any time
- **Plan Management:** Activate/deactivate plans, set default plans
- **Revenue Tracking:** Monitor individual student subscription revenue
- **Student Access Control:** Override subscription requirements for specific students
- **Bulk Operations:** Apply pricing changes to multiple plans

##### 4.3.4 Payment Integration
- **Individual Student Payments:** Each student pays for their own subscription
- **Dynamic Pricing:** Payment amounts based on admin-configured plans
- **Razorpay Integration:** One-time payments for subscription plans
- **Payment History:** Track all individual student payments
- **Invoice Generation:** Automatic invoice creation for each student

#### 4.4 Enhanced Data Models

##### 4.4.1 Updated Subject Model
```typescript
interface ISubject {
  name: string;
  description: string;
  college: mongoose.Types.ObjectId; // Required
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

##### 4.4.2 Updated Course Model
```typescript
interface ICourse {
  name: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  college: mongoose.Types.ObjectId; // Required
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

##### 4.4.3 Updated Exam Model
```typescript
interface IExam {
  // Existing fields
  name: string;
  description: string;
  course: mongoose.Types.ObjectId;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  totalQuestions: number;
  questionsToDisplay: number;
  assignedBatches?: mongoose.Types.ObjectId[];
  maxAttempts: number;
  createdBy: mongoose.Types.ObjectId;
  
  // New fields
  college: mongoose.Types.ObjectId; // Required
  isActive: boolean;
  examType: 'practice' | 'assessment' | 'final';
  proctoringLevel: 'basic' | 'advanced' | 'ai_enhanced';
  
  createdAt: Date;
  updatedAt: Date;
}
```

##### 4.4.4 Updated Batch Model
```typescript
interface IBatch {
  // Existing fields
  name: string;
  description: string;
  year: number;
  isActive: boolean;
  maxAttempts: number;
  maxSecurityIncidents: number;
  enableAutoSuspend?: boolean;
  additionalSecurityIncidentsAfterRemoval: number;
  additionalAttemptsAfterPayment: number;
  createdBy: mongoose.Types.ObjectId;
  
  // New fields
  college: mongoose.Types.ObjectId; // Required
  department?: string;
  semester?: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4.5 Student Onboarding Flow

##### 4.5.1 Student Registration Process
1. **College Selection:** Student selects their college from dropdown
2. **Email Verification:** Verify email address
3. **Account Creation:** Create basic account (no subscription required initially)
4. **Profile Completion:** Complete profile with additional details
5. **Subscription Selection:** Choose from available subscription plans (optional)
6. **Payment:** Complete payment via Razorpay (if subscription selected)
7. **Account Activation:** Full access granted after successful payment

##### 4.5.2 Subscription Validation
- **Middleware:** Check individual student subscription status before exam access
- **Grace Period:** 7-day grace period after expiration for students
- **Plan Changes:** Allow students to upgrade/downgrade plans
- **Access Control:** Students without active subscription have limited access
- **Admin Override:** College admins can grant temporary access to students

### 5. Technical Implementation

#### 5.1 Database Schema Changes

##### 5.1.1 New Collections
- **Colleges:** College information and settings
- **SubscriptionPlans:** Admin-configured subscription plans (dynamic pricing)
- **StudentSubscriptions:** Individual student subscription records
- **AdminSettings:** Platform-wide settings including default plans

##### 5.1.2 Migration Strategy
1. **Create College Collection:** Add default college for existing data
2. **Update Existing Models:** Add college field to all existing models
3. **Data Migration:** Assign existing data to default college
4. **Index Optimization:** Add compound indexes for performance

#### 5.2 API Endpoints

##### 5.2.1 College Management APIs
```
GET    /api/colleges                    # List all colleges
POST   /api/colleges                    # Create new college
GET    /api/colleges/[id]               # Get college details
PUT    /api/colleges/[id]               # Update college
DELETE /api/colleges/[id]               # Delete college
GET    /api/colleges/[id]/students      # Get college students
GET    /api/colleges/[id]/stats         # Get college statistics
```

##### 5.2.2 Subscription Management APIs
```
# Admin APIs for managing subscription plans
GET    /api/admin/subscription-plans    # Get all subscription plans
POST   /api/admin/subscription-plans    # Create new subscription plan
PUT    /api/admin/subscription-plans/[id] # Update subscription plan
DELETE /api/admin/subscription-plans/[id] # Delete subscription plan

# Student APIs for subscription management
GET    /api/student/subscription-plans  # Get available plans for student
POST   /api/student/subscriptions       # Create student subscription
GET    /api/student/subscriptions/[id]  # Get student subscription details
PUT    /api/student/subscriptions/[id]  # Update student subscription
GET    /api/student/subscription-history # Get student payment history
```

##### 5.2.3 Enhanced User APIs
```
POST   /api/auth/register               # Enhanced registration
GET    /api/users/college/[id]          # Get users by college
PUT    /api/users/subscription          # Update user subscription
GET    /api/users/subscription-status   # Check subscription status
```

#### 5.3 Frontend Components

##### 5.3.1 New Components
- **CollegeSelector:** College selection dropdown
- **SubscriptionPlans:** Dynamic plan comparison and selection
- **PaymentForm:** Enhanced payment form with dynamic pricing
- **SubscriptionStatus:** Display current student subscription status
- **AdminSubscriptionManager:** Admin interface to manage subscription plans
- **StudentBillingHistory:** Individual student payment history
- **PlanCreator:** Admin component to create/edit subscription plans
- **DynamicPricingEditor:** Admin component to set and update plan prices
- **SubscriptionAnalytics:** Admin dashboard for subscription revenue tracking

##### 5.3.2 Updated Components
- **Navbar:** Add college context and subscription status
- **ProtectedRoute:** Enhanced with subscription validation
- **UserProfile:** Add subscription information
- **AdminDashboard:** Multi-college support

#### 5.4 Authentication & Authorization

##### 5.4.1 Enhanced JWT Token
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  college: string; // New field
  subscriptionStatus: string; // New field
  subscriptionType?: string; // New field
  iat: number;
  exp: number;
}
```

##### 5.4.2 Middleware Updates
- **College Validation:** Ensure user belongs to correct college
- **Subscription Check:** Validate subscription before exam access
- **Role-based Access:** Enhanced with college context

### 6. User Experience Flow

#### 6.1 Student Journey
1. **Landing Page:** View available colleges and plans
2. **College Selection:** Choose college from list
3. **Registration:** Create account with college context
4. **Plan Selection:** Choose subscription plan
5. **Payment:** Complete payment process
6. **Account Activation:** Receive confirmation email
7. **Dashboard Access:** Access college-specific dashboard
8. **Exam Taking:** Take exams with subscription validation

#### 6.2 College Admin Journey
1. **College Setup:** Create college profile
2. **Staff Management:** Add college staff members
3. **Content Creation:** Create subjects, courses, exams
4. **Student Management:** Monitor student subscriptions and access
5. **Analytics:** View college-specific analytics
6. **Settings:** Configure college-specific settings

#### 6.3 Super Admin Journey
1. **Platform Management:** Manage all colleges and users
2. **Subscription Plan Management:** Create and configure subscription plans with dynamic pricing
3. **Revenue Monitoring:** Monitor individual student subscription revenue
4. **Analytics:** Platform-wide analytics and insights
5. **Support:** Handle support requests
6. **Billing Management:** Manage billing and payment systems

### 7. Security & Compliance

#### 7.1 Data Isolation
- **College Data Separation:** Ensure data isolation between colleges
- **Access Control:** Strict role-based access control
- **API Security:** Enhanced API security with college context

#### 7.2 Payment Security
- **PCI Compliance:** Secure payment processing
- **Data Encryption:** Encrypt sensitive payment data
- **Audit Trails:** Complete audit trails for all transactions

#### 7.3 Privacy & GDPR
- **Data Retention:** Configurable data retention policies
- **User Consent:** Clear consent mechanisms
- **Data Export:** Allow users to export their data
- **Data Deletion:** Right to be forgotten implementation

### 8. Performance & Scalability

#### 8.1 Database Optimization
- **Indexing Strategy:** Optimize indexes for multi-college queries
- **Connection Pooling:** Implement connection pooling
- **Query Optimization:** Optimize queries for performance

#### 8.2 Caching Strategy
- **Redis Integration:** Implement Redis for session management
- **CDN Integration:** Use CDN for static assets
- **API Caching:** Cache frequently accessed data

#### 8.3 Monitoring & Analytics
- **Application Monitoring:** Implement comprehensive monitoring
- **Performance Metrics:** Track key performance indicators
- **Error Tracking:** Implement error tracking and alerting

### 9. Testing Strategy

#### 9.1 Unit Testing
- **Model Testing:** Test all data models
- **API Testing:** Test all API endpoints
- **Component Testing:** Test React components

#### 9.2 Integration Testing
- **Payment Integration:** Test payment flows
- **Database Integration:** Test database operations
- **Third-party Integration:** Test external service integrations

#### 9.3 End-to-End Testing
- **User Flows:** Test complete user journeys
- **Subscription Flows:** Test subscription management
- **Multi-college Scenarios:** Test multi-college functionality

### 10. Deployment & DevOps

#### 10.1 Environment Setup
- **Development:** Local development environment
- **Staging:** Staging environment for testing
- **Production:** Production environment with monitoring

#### 10.2 CI/CD Pipeline
- **Automated Testing:** Run tests on every commit
- **Automated Deployment:** Deploy to staging/production
- **Database Migrations:** Automated database migrations

#### 10.3 Monitoring & Logging
- **Application Logs:** Comprehensive logging
- **Error Tracking:** Real-time error tracking
- **Performance Monitoring:** Monitor application performance

### 11. Success Metrics

#### 11.1 Business Metrics
- **Monthly Recurring Revenue (MRR):** Track subscription revenue
- **Customer Acquisition Cost (CAC):** Track acquisition costs
- **Customer Lifetime Value (CLV):** Track customer value
- **Churn Rate:** Track subscription cancellations

#### 11.2 Technical Metrics
- **System Uptime:** Track system availability
- **Response Time:** Track API response times
- **Error Rate:** Track application errors
- **User Engagement:** Track user activity

### 12. Risk Assessment

#### 12.1 Technical Risks
- **Database Migration:** Risk of data loss during migration
- **Payment Integration:** Risk of payment failures
- **Performance Issues:** Risk of performance degradation

#### 12.2 Business Risks
- **Market Competition:** Risk from competitors
- **Regulatory Changes:** Risk from regulatory changes
- **Customer Adoption:** Risk of low customer adoption

#### 12.3 Mitigation Strategies
- **Backup Strategy:** Comprehensive backup and recovery
- **Testing Strategy:** Thorough testing before deployment
- **Monitoring Strategy:** Proactive monitoring and alerting

### 13. Timeline & Milestones

#### 13.1 Phase 1: Foundation (Weeks 1-4)
- Database schema design and migration
- College management system
- Enhanced user management
- Basic subscription system

#### 13.2 Phase 2: Core Features (Weeks 5-8)
- Subscription plans and pricing
- Payment integration
- Student onboarding flow
- College admin dashboard

#### 13.3 Phase 3: Advanced Features (Weeks 9-12)
- Advanced subscription management
- Multi-college analytics
- Enhanced security features
- Performance optimization

#### 13.4 Phase 4: Testing & Launch (Weeks 13-16)
- Comprehensive testing
- Performance optimization
- Security audit
- Production deployment

### 14. Conclusion

This PRD outlines the transformation of the existing single-tenant exam portal into a multi-college subscription-based platform. The implementation will provide a scalable, secure, and user-friendly solution for educational institutions while generating recurring revenue through subscription plans.

The phased approach ensures minimal disruption to existing users while gradually introducing new features and capabilities. The comprehensive testing strategy and monitoring implementation will ensure a smooth transition and ongoing system reliability.
