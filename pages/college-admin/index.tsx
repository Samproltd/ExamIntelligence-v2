import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import CollegeAdminLayout from '../../components/CollegeAdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useRouter } from 'next/router';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalExams: number;
  activeExams: number;
  totalCourses: number;
  totalSubjects: number;
  totalBatches: number;
  recentResults: number;
}

interface College {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
}

const CollegeAdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/college-admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      setStats(statsData.data.stats);
      setCollege(statsData.data.college);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  if (loading) {
    return (
      <CollegeAdminLayout title="College Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </CollegeAdminLayout>
    );
  }

  if (error) {
    return (
      <CollegeAdminLayout title="College Admin Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </CollegeAdminLayout>
    );
  }

  const statCards = [
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Students',
      value: stats?.activeStudents || 0,
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Exams',
      value: stats?.totalExams || 0,
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Active Exams',
      value: stats?.activeExams || 0,
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpenIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'Total Subjects',
      value: stats?.totalSubjects || 0,
      icon: AcademicCapIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  const quickActions = [
    {
      name: 'Manage Students',
      description: 'View and manage student accounts',
      icon: UserGroupIcon,
      href: '/college-admin/students',
      color: 'bg-blue-600 hover:bg-blue-700',
      canManage: true,
    },
    {
      name: 'View Subjects',
      description: 'View subjects assigned to your college',
      icon: AcademicCapIcon,
      href: '/college-admin/subjects',
      color: 'bg-pink-600 hover:bg-pink-700',
      canManage: false,
    },
    {
      name: 'View Courses',
      description: 'View courses assigned to your college',
      icon: BookOpenIcon,
      href: '/college-admin/courses',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      canManage: false,
    },
    {
      name: 'View Exams',
      description: 'View exams assigned to your college',
      icon: ClipboardDocumentListIcon,
      href: '/college-admin/exams',
      color: 'bg-green-600 hover:bg-green-700',
      canManage: false,
    },
    {
      name: 'View Results',
      description: 'Check exam results and analytics',
      icon: ChartBarIcon,
      href: '/college-admin/results',
      color: 'bg-purple-600 hover:bg-purple-700',
      canManage: false,
    },
    {
      name: 'View Batches',
      description: 'View student batches information',
      icon: UsersIcon,
      href: '/college-admin/batches',
      color: 'bg-orange-600 hover:bg-orange-700',
      canManage: false,
    },
  ];

  return (
    <CollegeAdminLayout title="College Admin Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">College Admin Dashboard</h1>
          {college && (
            <p className="text-gray-600">
              Welcome to {college.name} ({college.code}) administration panel
            </p>
          )}
        </div>

        {/* Permission Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                College Admin Access Level
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You can <strong>manage students</strong> and <strong>view</strong> subjects, courses, exams, and results assigned to your college. 
                  Only Super Admin can create, edit, or delete subjects, courses, and exams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* College Info Card */}
        {college && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900">{college.name}</h3>
                  <p className="text-sm text-gray-500">College Code: {college.code}</p>
                  <p className="text-sm text-gray-500">{college.address}</p>
                  <p className="text-sm text-gray-500">
                    Contact: {college.contactEmail} | {college.contactPhone}
                  </p>
                  <p className="text-sm text-gray-500">
                    Students: {college.currentStudents} / {college.maxStudents}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <action.icon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push(action.href)}
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors ${
                        action.canManage 
                          ? `border-transparent text-white ${action.color}`
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {action.canManage ? (
                        <>
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          {action.name}
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          {action.name}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                College Admin dashboard initialized successfully
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                Access to {stats?.totalStudents || 0} student records (Management Access)
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                View access to {stats?.totalSubjects || 0} subjects and {stats?.totalCourses || 0} courses
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                View access to {stats?.totalExams || 0} exams (Contact Super Admin for changes)
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default CollegeAdminDashboard;
