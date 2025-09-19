import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import ProtectedRoute from '../../components/ProtectedRoute';
import Snackbar from '../../components/Snackbar';
import useToast from '../../hooks/useToast';

interface ExamCard {
  _id: string;
  name: string;
  course: {
    name: string;
    subject: {
      name: string;
    };
  };
  hasTaken: boolean;
  maxAttempts: number;
  result?: {
    attemptNumber: number;
    passed: boolean;
  };
}

interface ResultCard {
  _id: string;
  exam: {
    _id: string;
    name: string;
    course: {
      name: string;
    };
  };
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  createdAt: string;
  answers?: {
    isCorrect: boolean;
  }[];
}

interface DashboardData {
  upcomingExams: ExamCard[];
  recentResults: ResultCard[];
  user?: {
    name: string;
  };
  subscriptionStatus?: {
    hasAssignment: boolean;
    hasSubscription: boolean;
    subscription?: any;
    requiredPlan?: any;
    isExpired: boolean;
    daysUntilExpiry: number;
    status: string;
    message: string;
  };
}

const StudentDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingExams: [],
    recentResults: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState('');

  // Toast notifications
  const { toast, showError, hideToast } = useToast();

  useEffect(() => {
    // Set greeting based on time of day
    const hours = new Date().getHours();
    if (hours < 12) setTimeOfDay('Morning');
    else if (hours < 17) setTimeOfDay('Afternoon');
    else setTimeOfDay('Evening');

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/student/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDashboardData(response.data);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate today's date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = today.toLocaleDateString('en-US', options);

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title="Student Dashboard - Online Exam Portal">
        <div className="max-w-7xl mx-auto">
          {/* Tagline below navbar */}
          <div className="text-center py-3 mb-6 bg-blue-50 rounded-lg">
            <p className="text-xl font-medium text-blue-700 italic">
              "Empowering Excellence in IT Asset Management"
            </p>
          </div>

          {/* Hero section with welcome message */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold">
                  Good {timeOfDay}, {dashboardData.user?.name || 'Student'}!
                </h1>
                <p className="mt-2 text-blue-100">
                  Welcome to your Exam Intelligence dashboard. Here's your learning journey at a
                  glance.
                </p>
                <p className="text-blue-200 text-sm mt-2">{formattedDate}</p>
              </div>
              <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-medium">Quick tip:</p>
                <p className="text-xs text-blue-100">
                  Stay consistent with your study schedule for better results.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow">{error}</div>
          ) : (
            <>
          {/* Subscription Status Alert */}
          {dashboardData.subscriptionStatus && (
            <div className="mb-6">
              {!dashboardData.subscriptionStatus.hasAssignment ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">No Subscription Plan Assigned</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Your batch is not assigned to any subscription plan. Please contact your administrator.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !dashboardData.subscriptionStatus.hasSubscription ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Subscription Required</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>You need an active subscription to access exams. Required plan: <strong>{dashboardData.subscriptionStatus.requiredPlan?.name}</strong></p>
                        <p className="mt-1">Price: ₹{dashboardData.subscriptionStatus.requiredPlan?.price} for {dashboardData.subscriptionStatus.requiredPlan?.duration} months</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : dashboardData.subscriptionStatus.isExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Subscription Expired</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Your subscription has expired. Please renew to continue accessing exams.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{dashboardData.subscriptionStatus.message}</p>
                        {dashboardData.subscriptionStatus.daysUntilExpiry > 0 && (
                          <p className="mt-1">Plan: {dashboardData.subscriptionStatus.subscription?.plan?.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats and Upcoming Exams */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="md:col-span-2 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Upcoming Exams</h2>
                  </div>

                  {dashboardData.upcomingExams.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-gray-500 mt-2">No upcoming exams available.</p>
                      <p className="text-gray-400 text-sm mt-1">Check back later for updates.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.upcomingExams.slice(0, 3).map(exam => (
                        <div
                          key={exam._id}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div>
                            <div className="font-medium text-gray-800">{exam.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Course: <span className="text-indigo-600">{exam.course.name}</span>
                            </div>
                            {exam.hasTaken && exam.result && (
                              <div className="text-sm mt-2 flex items-center">
                                <span className="font-medium">Attempts: </span>
                                <span
                                  className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                    exam.result.passed
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {exam.result.attemptNumber} / {exam.maxAttempts}
                                </span>
                                {!exam.result.passed &&
                                  exam.result.attemptNumber < exam.maxAttempts && (
                                    <span className="text-blue-600 ml-2 text-xs">
                                      ({exam.maxAttempts - exam.result.attemptNumber} attempts
                                      remaining)
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>
                          <a
                            href={`/student/exams/${exam._id}`}
                            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                          >
                            View Exam →
                          </a>
                        </div>
                      ))}

                      {dashboardData.upcomingExams.length > 3 && (
                        <div className="text-right mt-4">
                          <Link href="/student/exams">
                            <span className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer">
                              <span>View all exams</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Your Progress</h2>
                  </div>

                  {dashboardData.recentResults.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p className="text-gray-500 mt-2">No exam results yet.</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Start taking exams to track your progress.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">Exams Taken:</span>
                          <span className="font-medium text-gray-800">
                            {dashboardData.recentResults.length}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, dashboardData.recentResults.length * 10)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        {(() => {
                          const avgScore =
                            dashboardData.recentResults.reduce(
                              (sum, result) => sum + result.percentage,
                              0
                            ) / dashboardData.recentResults.length;
                          return (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-600">Average Score:</span>
                                <span className="font-medium text-gray-800">
                                  {avgScore.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full">
                                <div
                                  className={`h-2 rounded-full ${
                                    avgScore >= 70
                                      ? 'bg-green-500'
                                      : avgScore >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${avgScore}%` }}
                                ></div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div>
                        {(() => {
                          const passRate = Math.round(
                            (dashboardData.recentResults.filter(r => r.passed).length /
                              dashboardData.recentResults.length) *
                              100
                          );
                          return (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-600">Pass Rate:</span>
                                <span className="font-medium text-gray-800">{passRate}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full">
                                <div
                                  className={`h-2 rounded-full ${
                                    passRate >= 70
                                      ? 'bg-green-500'
                                      : passRate >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${passRate}%` }}
                                ></div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="text-right pt-3 border-t border-gray-100">
                        <Link href="/student/results">
                          <span className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer">
                            <span>View all results</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Recent Results */}
              {dashboardData.recentResults.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Recent Results</h2>
                  </div>

                  <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exam
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.recentResults.slice(0, 5).map(result => (
                          <tr
                            key={result._id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {result.exam.name}
                              </div>
                              <div className="text-xs text-gray-500">{result.exam.course.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(result.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(result.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                                    result.percentage >= 70
                                      ? 'bg-green-100 text-green-800'
                                      : result.percentage >= 50
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  <span className="text-xs font-medium">
                                    {result.percentage.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {result.answers?.filter(a => a.isCorrect).length} /{' '}
                                  {result.totalQuestions}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {result.passed ? (
                                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                                  Passed
                                </span>
                              ) : (
                                <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a
                                href={`/student/results/${result._id}`}
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                              >
                                <span>Details</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="ml-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Add Snackbar component for toast notifications */}
          <Snackbar
            open={toast.open}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
