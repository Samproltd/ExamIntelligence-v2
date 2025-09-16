import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface College {
  _id: string;
  name: string;
  code: string;
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
    allowStudentSubscriptions: boolean;
  };
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AdminColleges: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/colleges', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch colleges');
      }

      const data = await response.json();
      setColleges(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collegeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/colleges/${collegeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete college');
      }

      setColleges(colleges.filter(college => college._id !== collegeId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete college');
    }
  };

  const toggleCollegeStatus = async (collegeId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/colleges/${collegeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update college status');
      }

      setColleges(colleges.map(college => 
        college._id === collegeId 
          ? { ...college, isActive: !currentStatus }
          : college
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update college');
    }
  };

  const filteredColleges = colleges.filter(college => {
    const matchesSearch = college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         college.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         college.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && college.isActive) ||
                         (filterActive === 'inactive' && !college.isActive);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  return (
    <>
      <Head>
        <title>Colleges Management - ExamIntelligence Admin</title>
        <meta name="description" content="Manage colleges and their settings" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Colleges Management</h1>
                  <p className="text-gray-600 mt-2">
                    Manage colleges and their settings for your platform
                  </p>
                </div>
                <Link
                  href="/admin/colleges/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add College
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Colleges
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, code, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Colleges</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Colleges Grid */}
            {filteredColleges.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No colleges found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterActive !== 'all' 
                    ? 'No colleges match your current filters.'
                    : 'Get started by creating your first college.'
                  }
                </p>
                {!searchTerm && filterActive === 'all' && (
                  <div className="mt-6">
                    <Link
                      href="/admin/colleges/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add College
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredColleges.map((college, index) => (
                  <motion.div
                    key={college._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* College Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
                            style={{ backgroundColor: college.branding.primaryColor }}
                          >
                            {college.logo ? (
                              <img
                                src={college.logo}
                                alt={college.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <BuildingOfficeIcon className="h-6 w-6" />
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
                            <p className="text-sm text-gray-600">{college.code}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          college.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {college.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* College Details */}
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="text-sm font-medium text-gray-900">{college.address}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Students</p>
                            <p className="text-sm font-medium text-gray-900">
                              {college.currentStudents}/{college.maxStudents}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Admin</p>
                            <p className="text-sm font-medium text-gray-900">{college.adminName}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Contact</p>
                          <p className="text-sm font-medium text-gray-900">{college.contactEmail}</p>
                          <p className="text-sm text-gray-500">{college.contactPhone}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(college.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/colleges/${college._id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/admin/colleges/${college._id}/edit`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleCollegeStatus(college._id, college.isActive)}
                            className={`inline-flex items-center px-3 py-1 border text-xs font-medium rounded ${
                              college.isActive
                                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {college.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(college._id)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-4">Delete College</h3>
                    <div className="mt-2 px-7 py-3">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this college? This action cannot be undone and will affect all associated data.
                      </p>
                    </div>
                    <div className="items-center px-4 py-3">
                      <button
                        onClick={() => handleDelete(deleteConfirm)}
                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AdminColleges;
