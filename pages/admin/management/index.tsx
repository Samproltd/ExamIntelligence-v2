import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingOfficeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  LinkIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../../components/AdminLayout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useRouter } from 'next/router';

interface ManagementStats {
  totalColleges: number;
  totalSubjects: number;
  totalCourses: number;
  totalExams: number;
  totalBatches: number;
  totalSubscriptionPlans: number;
  totalBatchAssignments: number;
  totalStudents: number;
}

const SuperAdminManagement: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<ManagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/management/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch management stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const managementSections = [
    {
      id: 'colleges',
      title: 'College Management',
      description: 'Create, manage, and configure colleges in the system',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      count: stats?.totalColleges || 0,
      actions: [
        { label: 'View All', path: '/admin/colleges', icon: EyeIcon },
        { label: 'Create New', path: '/admin/colleges/create', icon: PlusIcon },
      ]
    },
    {
      id: 'subjects',
      title: 'Subject Management',
      description: 'Create and manage academic subjects across colleges',
      icon: AcademicCapIcon,
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      count: stats?.totalSubjects || 0,
      actions: [
        { label: 'View All', path: '/admin/subjects', icon: EyeIcon },
        { label: 'Create New', path: '/admin/subjects/create', icon: PlusIcon },
      ]
    },
    {
      id: 'courses',
      title: 'Course Management',
      description: 'Create and manage courses with subject assignments',
      icon: BookOpenIcon,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      count: stats?.totalCourses || 0,
      actions: [
        { label: 'View All', path: '/admin/courses', icon: EyeIcon },
        { label: 'Create New', path: '/admin/courses/create', icon: PlusIcon },
      ]
    },
    {
      id: 'exams',
      title: 'Exam Management',
      description: 'Create, configure, and assign exams to courses and batches',
      icon: ClipboardDocumentListIcon,
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
      count: stats?.totalExams || 0,
      actions: [
        { label: 'View All', path: '/admin/exams', icon: EyeIcon },
        { label: 'Create New', path: '/admin/exams/create', icon: PlusIcon },
      ]
    },
    {
      id: 'batches',
      title: 'Batch Management',
      description: 'Create and manage student batches across colleges',
      icon: UsersIcon,
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      count: stats?.totalBatches || 0,
      actions: [
        { label: 'View All', path: '/admin/batches', icon: EyeIcon },
        { label: 'Create New', path: '/admin/batches/create', icon: PlusIcon },
      ]
    },
    {
      id: 'batch-assignments',
      title: 'Batch-Subscription Assignments',
      description: 'Assign batches to subscription plans for flexible access control',
      icon: LinkIcon,
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      count: stats?.totalBatchAssignments || 0,
      actions: [
        { label: 'View All', path: '/admin/batch-assignments', icon: EyeIcon },
        { label: 'Create New', path: '/admin/batch-assignments/create', icon: PlusIcon },
      ]
    },
  ];

  const quickStats = [
    {
      name: 'Total Colleges',
      value: stats?.totalColleges || 0,
      icon: BuildingOfficeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Exams',
      value: stats?.totalExams || 0,
      icon: ClipboardDocumentListIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Subscription Plans',
      value: stats?.totalSubscriptionPlans || 0,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Super Admin Management">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Super Admin Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Super Admin Management Center</h1>
          <p className="text-blue-100">
            Complete control over colleges, subjects, courses, exams, batches, and subscription assignments
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-md p-4"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
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
                      <dd className="text-2xl font-bold text-gray-900">
                        {stat.value.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {section.count} items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {section.description}
                </p>

                {/* Actions */}
                <div className="space-y-2">
                  {section.actions.map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={() => router.push(action.path)}
                      className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        actionIndex === 0
                          ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          : `text-white ${section.color} ${section.hoverColor}`
                      }`}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Flow Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Management Hierarchy</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">1. Create and manage <strong>Colleges</strong></span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">2. Create <strong>Subjects</strong> for academic content</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">3. Create <strong>Courses</strong> with subject assignments</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">4. Create <strong>Exams</strong> for courses</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">5. Create <strong>Batches</strong> for student groups</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">6. <strong>Assign Batches</strong> to Subscription Plans</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">New Assignment System</h3>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Batch-to-Subscription Assignment</h4>
                <p className="text-sm text-indigo-700 mb-2">
                  The new system allows flexible batch access through subscription plans:
                </p>
                <ul className="text-sm text-indigo-600 space-y-1">
                  <li>• One batch can be assigned to multiple subscription plans</li>
                  <li>• Students get batch access through their subscription</li>
                  <li>• Different subscription tiers = different batch access</li>
                  <li>• Simplified student onboarding process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SuperAdminManagement;
