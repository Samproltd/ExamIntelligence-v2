import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';
import SubscriptionStatus from '../../components/subscription/SubscriptionStatus';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  college?: string;
  subscriptionStatus?: string;
}

interface College {
  _id: string;
  name: string;
  code: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
}

interface Exam {
  _id: string;
  name: string;
  course: {
    name: string;
    subject: {
      name: string;
    };
  };
  duration: number;
  totalMarks: number;
  hasTaken: boolean;
  maxAttempts: number;
  result?: {
    attemptNumber: number;
    passed: boolean;
    score: number;
  };
}

interface DashboardStats {
  totalExams: number;
  completedExams: number;
  passedExams: number;
  averageScore: number;
  upcomingExams: number;
}

const StudentDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch user data
      const userResponse = await fetch('/api/auth/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      setUser(userData.user);

      // Fetch college data if user has college
      if (userData.user.college) {
        const collegeResponse = await fetch(`/api/colleges/${userData.user.college}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (collegeResponse.ok) {
          const collegeData = await collegeResponse.json();
          setCollege(collegeData.data);
        }
      }

      // Fetch student dashboard data
      const dashboardResponse = await fetch('/api/student/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setExams(dashboardData.upcomingExams || []);
        setStats(dashboardData.stats || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Student Dashboard - ExamIntelligence</title>
        <meta name="description" content="Your personalized exam dashboard" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.name}!
                      </h1>
                      <p className="text-gray-600">
                        {college ? `Student at ${college.name}` : 'Student'}
                      </p>
                    </div>
                  </div>
                  {college && (
                    <div className="flex items-center">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: college.branding.primaryColor }}
                      >
                        {college.logo ? (
                          <img
                            src={college.logo}
                            alt={college.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <BuildingOfficeIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{college.name}</p>
                        <p className="text-sm text-gray-500">{college.code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Subscription Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <SubscriptionStatus
                userId={user?.id}
                onUpgrade={() => window.location.href = '/student/subscription-plans'}
                onRenew={() => window.location.href = '/student/subscription-plans'}
                className="max-w-4xl mx-auto"
              />
            </motion.div>

            {/* Stats Cards */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Exams</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedExams}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <ChartBarIcon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.upcomingExams}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upcoming Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Exams</h2>
                    <Link
                      href="/student/exams"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {exams.length === 0 ? (
                    <div className="text-center py-8">
                      <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming exams</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You don't have any upcoming exams at the moment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {exams.slice(0, 5).map((exam) => (
                        <div
                          key={exam._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{exam.name}</h3>
                            <p className="text-sm text-gray-600">
                              {exam.course.subject.name} • {exam.course.name}
                            </p>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {exam.duration} minutes
                              </span>
                              <span className="flex items-center">
                                <ChartBarIcon className="h-4 w-4 mr-1" />
                                {exam.totalMarks} marks
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {exam.hasTaken ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                            ) : (
                              <Link
                                href={`/student/exams/${exam._id}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Take Exam
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <Link
                href="/student/exams"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">Browse Exams</h3>
                    <p className="text-sm text-gray-600">View all available exams</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/student/results"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">View Results</h3>
                    <p className="text-sm text-gray-600">Check your exam results</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/student/subscription-plans"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <CreditCardIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">Subscription</h3>
                    <p className="text-sm text-gray-600">Manage your subscription</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default StudentDashboard;
