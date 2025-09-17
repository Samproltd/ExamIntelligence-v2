import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import CollegeAdminLayout from '../../../components/CollegeAdminLayout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface Exam {
  _id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const CollegeAdminExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/college-admin/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await response.json();
      setExams(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'scheduled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Completed</span>;
      case 'draft':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Draft</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <CollegeAdminLayout title="Manage Exams">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </CollegeAdminLayout>
    );
  }

  return (
    <CollegeAdminLayout title="Manage Exams">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Exams</h1>
            <p className="text-gray-600">Create and manage exams for your students</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Exam
          </button>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Exams</dt>
                    <dd className="text-lg font-medium text-gray-900">{exams.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <PlayIcon className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Exams</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(e => e.status === 'active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(e => e.status === 'scheduled').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {exams.filter(e => e.status === 'completed').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exams Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Exams List</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage all exams in your college</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {exams.map((exam) => (
              <li key={exam._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                        {getStatusBadge(exam.status)}
                      </div>
                      <p className="text-sm text-gray-500">{exam.description}</p>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-xs text-gray-500">
                          Duration: {exam.duration} minutes
                        </span>
                        <span className="text-xs text-gray-500">
                          Questions: {exam.totalQuestions}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created: {new Date(exam.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="text-blue-400 hover:text-blue-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {exam.status === 'active' ? (
                      <button className="text-yellow-400 hover:text-yellow-600">
                        <PauseIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button className="text-green-400 hover:text-green-600">
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button className="text-red-400 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {exams.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exams found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first exam.
            </p>
            <div className="mt-6">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Exam
              </button>
            </div>
          </div>
        )}
      </div>
    </CollegeAdminLayout>
  );
};

export default CollegeAdminExams;
