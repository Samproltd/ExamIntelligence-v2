# College Admin & College Staff Roles Guide

## 🎯 Overview

The ExamIntelligence system now supports a comprehensive role-based access control system with four distinct user roles:

1. **Admin** - System administrator with full access
2. **College Admin** - College-level administrator with management permissions
3. **College Staff** - College staff with view-only permissions
4. **Student** - Students with exam-taking and profile management permissions

---

## 🔐 Role Permissions

### **Admin Role**
- **Full System Access**: Manage all colleges, users, and system settings
- **College Management**: Create, edit, and delete colleges
- **Staff Management**: Create and manage college-admin and college-staff users
- **Subscription Plans**: Create and manage subscription plans for all colleges
- **Security**: View security incidents and manage exam suspensions
- **Dashboard**: `/admin`

### **College Admin Role**
- **College-Specific Management**: Full control over their assigned college
- **Student Management**: Create, edit, and manage student accounts
- **Exam Management**: Create, schedule, and manage exams
- **Course Management**: Create and manage courses and subjects
- **Batch Management**: Create and manage student batches
- **Results**: View and analyze exam results
- **Dashboard**: `/college-admin`

### **College Staff Role**
- **View-Only Access**: Can view all college data but cannot modify
- **Student Information**: View student profiles and progress
- **Exam Monitoring**: View exam details and status
- **Results Viewing**: View exam results and analytics
- **Limited Permissions**: Cannot create, edit, or delete data
- **Dashboard**: `/college-staff`

### **Student Role**
- **Exam Taking**: Take assigned exams
- **Results Viewing**: View their own exam results
- **Certificate Access**: Download certificates
- **Profile Management**: Update personal information
- **Dashboard**: `/student`

---

## 🚀 How to Create College Staff

### **Method 1: Using Admin Dashboard**

1. **Login as Admin**
   - Email: `examadmin@gmail.com`
   - Password: `Admin@123`
   - Dashboard: `/admin`

2. **Navigate to College Staff Management**
   - Go to Admin Dashboard
   - Click on "College Staff" in the sidebar
   - Click "Add Staff Member" button

3. **Create Staff Member**
   - Fill in the required information:
     - Name
     - Email
     - Password
     - Role (College Admin or College Staff)
     - College (select from dropdown)
   - Click "Create Staff"

### **Method 2: Using Script (Already Done)**

The system has been pre-populated with sample college staff users:

#### **College Admin**
- **Email**: `college.admin@example.com`
- **Password**: `admin123`
- **Role**: College Admin
- **Dashboard**: `/college-admin`

#### **College Staff**
- **Email**: `college.staff@example.com`
- **Password**: `staff123`
- **Role**: College Staff
- **Dashboard**: `/college-staff`

#### **Additional Staff Members**
- **Email**: `john.smith@example.com` | **Password**: `john123`
- **Email**: `sarah.johnson@example.com` | **Password**: `sarah123`

---

## 🔄 Login Flow & Redirects

### **Automatic Role-Based Redirects**

When users log in, they are automatically redirected to their appropriate dashboard based on their role:

- **Admin** → `/admin`
- **College Admin** → `/college-admin`
- **College Staff** → `/college-staff`
- **Student** → `/student`

### **Login Process**

1. **Go to Login Page**: `/login`
2. **Enter Credentials**: Email and password
3. **Automatic Redirect**: Based on user role
4. **Dashboard Access**: Role-specific dashboard with appropriate permissions

---

## 📊 Dashboard Features

### **Admin Dashboard** (`/admin`)
- **System Overview**: Total colleges, users, exams, etc.
- **College Management**: Create and manage colleges
- **Staff Management**: Create and manage college staff
- **Subscription Plans**: Manage subscription plans
- **Security Monitoring**: View security incidents
- **System Settings**: Configure global settings

### **College Admin Dashboard** (`/college-admin`)
- **College Overview**: College-specific statistics
- **Student Management**: Manage students in their college
- **Exam Creation**: Create and schedule exams
- **Course Management**: Manage courses and subjects
- **Batch Management**: Organize students into batches
- **Results Analysis**: View and analyze exam results

### **College Staff Dashboard** (`/college-staff`)
- **View-Only Access**: All features are read-only
- **Student Information**: View student profiles
- **Exam Monitoring**: Monitor exam progress
- **Results Viewing**: View exam results
- **Permission Notice**: Clear indication of limited permissions

---

## 🛡️ Security Features

### **Role-Based Access Control**
- Each role has specific permissions
- Users can only access features allowed for their role
- Automatic redirects prevent unauthorized access

### **College Isolation**
- College Admin and Staff can only access their assigned college data
- Data is isolated between different colleges
- No cross-college data access

### **Account Management**
- **Block/Unblock**: Admin can block/unblock any user
- **Password Management**: Users can change passwords
- **Account Verification**: All staff accounts are auto-verified

---

## 🔧 Management Features

### **Staff Management (Admin Only)**
- **Create Staff**: Add new college admin or staff members
- **Edit Staff**: Update staff information and roles
- **Block/Unblock**: Control staff access
- **Delete Staff**: Remove staff members
- **View Details**: Complete staff information

### **Role Assignment**
- **College Admin**: Full management permissions for their college
- **College Staff**: View-only access to college data
- **Automatic Assignment**: Staff are assigned to specific colleges

---

## 📝 Usage Examples

### **Creating a New College Admin**

1. Login as System Admin
2. Go to "College Staff" → "Add Staff Member"
3. Fill in details:
   - Name: "Dr. Jane Smith"
   - Email: "jane.smith@college.edu"
   - Password: "securepassword123"
   - Role: "College Admin"
   - College: Select the college
4. Click "Create Staff"
5. New admin can login and access `/college-admin`

### **Creating a New College Staff**

1. Login as System Admin
2. Go to "College Staff" → "Add Staff Member"
3. Fill in details:
   - Name: "John Doe"
   - Email: "john.doe@college.edu"
   - Password: "staffpassword123"
   - Role: "College Staff"
   - College: Select the college
4. Click "Create Staff"
5. New staff can login and access `/college-staff`

---

## 🎉 Ready to Use!

The college admin and staff system is now fully functional with:

✅ **Role-based dashboards** for each user type
✅ **Permission-based access control** 
✅ **College-specific data isolation**
✅ **Staff management interface** for admins
✅ **Automatic login redirects** based on roles
✅ **Sample users** ready for testing

**Start using the system by logging in with any of the provided credentials!**
