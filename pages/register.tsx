import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  BuildingOfficeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import CollegeSelector from '../components/college/CollegeSelector';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface College {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  isActive: boolean;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

const Register: React.FC = () => {
  const router = useRouter();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Step 1: Basic Information
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    dateOfBirth: '',
  });
  
  // Step 2: College Selection
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  
  // Step 3: Subscription Selection
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
        router.push('/student');
    }
  }, [router]);
  
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
      
      if (formData.middleName && formData.middleName.trim().length < 2) {
        errors.middleName = 'Middle name must be at least 2 characters';
      }
      
      if (!formData.email.trim()) {
      errors.email = 'Email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    
      if (!formData.password) {
      errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
      if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 2) {
      if (!selectedCollege) {
        errors.college = 'Please select a college';
      }
    } else if (step === 3) {
      if (!selectedPlan) {
        errors.subscription = 'Please select a subscription plan';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    try {
      setLoading(true);
      setError(null);

      // Store registration data temporarily in localStorage for payment completion
      const registrationData = {
        name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim(),
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: 'student',
        college: selectedCollege?._id,
        mobile: formData.mobile,
        dateOfBirth: formData.dateOfBirth,
        selectedPlan: selectedPlan,
        selectedCollege: selectedCollege,
      };

      // Store in localStorage for payment completion
      localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
      
      // Redirect to payment page with plan ID
      if (selectedPlan) {
        router.push(`/student/subscription-plans/payment?planId=${selectedPlan._id}&registration=true`);
      } else {
        setError('Please select a subscription plan to continue');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <Layout title="Registration Successful - ExamIntelligence">
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-4"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Register - ExamIntelligence">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Join thousands of students preparing for their exams</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <span className="text-sm font-medium">{step}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step === 1 && 'Basic Info'}
                      {step === 2 && 'College'}
                      {step === 3 && 'Subscription'}
                    </p>
                  </div>
                  {step < 3 && (
                    <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-md p-4"
            >
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Form Content */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <UserIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600">Tell us about yourself</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your first name"
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.middleName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your middle name (optional)"
                      />
                      {validationErrors.middleName && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.middleName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
            <input
              type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your last name"
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
            )}
          </div>
          
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
            <input
              type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>
          
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
            <input
              type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Create a password"
            />
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>
          
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
            <input
              type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
              placeholder="Confirm your password"
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>
          

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: College Selection */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Select Your College</h2>
                    <p className="text-gray-600">Choose the college you're associated with</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College *
                    </label>
                    <CollegeSelector
                      selectedCollege={selectedCollege}
                      onCollegeSelect={setSelectedCollege}
                      placeholder="Search and select your college"
                    />
                    {validationErrors.college && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.college}</p>
                    )}
                  </div>

                  {selectedCollege && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 rounded-lg p-4"
                    >
                      <h3 className="font-medium text-blue-900 mb-2">Selected College</h3>
                      <p className="text-blue-800">{selectedCollege.name}</p>
                      <p className="text-sm text-blue-700">{selectedCollege.address}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Subscription Selection */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <CreditCardIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                    <p className="text-gray-600">Select a subscription plan to continue</p>
                  </div>

                  {selectedCollege && (
                    <div>
                      <SubscriptionPlans
                        collegeId={selectedCollege._id}
                        onPlanSelect={setSelectedPlan}
                        showComparison={true}
                        selectedPlanId={selectedPlan?._id}
                      />
                      {validationErrors.subscription && (
                        <p className="text-red-500 text-sm mt-2 text-center">{validationErrors.subscription}</p>
                      )}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
            disabled={loading}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircleIcon className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in here
            </Link>
          </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
