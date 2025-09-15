import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Snackbar from '../../components/Snackbar';
import useToast from '../../hooks/useToast';
import { logout } from '../../store/slices/authSlice';

interface Student {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  createdAt: string;
  rollNumber?: string;
  mobile?: string;
  dateOfBirth?: string;
  batch?: {
    _id: string;
    name: string;
    description: string;
    year: number;
    isActive: boolean;
  };
  studentDetails?: {
    registrationNumber?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    parentName?: string;
    parentContact?: string;
  };
}

const StudentProfile: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/student/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStudent(response.data.student);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch profile';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title="Student Profile">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <Button variant="outline" onClick={() => router.push('/student')}>
              Back to Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow mb-4">{error}</div>
          ) : student ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 h-32 w-32 flex items-center justify-center">
                    <span className="text-5xl font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold">
                      {student.firstName && student.lastName
                        ? `${student.firstName} ${student.lastName}`
                        : student.name}
                    </h2>
                    <p className="text-blue-100 mt-1">{student.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Student</span>
                      {student.batch && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                          Batch: {student.batch.name}
                        </span>
                      )}
                      {student.rollNumber && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                          Roll: {student.rollNumber}
                        </span>
                      )}
                      {student.studentDetails?.registrationNumber && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                          Reg: {student.studentDetails.registrationNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card className="md:col-span-2">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Personal Information</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Full Name</div>
                        <div className="font-medium">{student.name}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Email Address</div>
                        <div className="font-medium">{student.email}</div>
                      </div>
                      {/* <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Phone Number</div>
                        <div className="font-medium">
                          {student.mobile || student.studentDetails?.phoneNumber || 'Not provided'}
                        </div>
                      </div> */}
                      {/* <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Date of Birth</div>
                        <div className="font-medium">
                          {student.dateOfBirth
                            ? formatDate(student.dateOfBirth)
                            : student.studentDetails?.dateOfBirth
                              ? formatDate(student.studentDetails.dateOfBirth)
                              : 'Not provided'}
                        </div>
                      </div> */}
                      {/* <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Gender</div>
                        <div className="font-medium capitalize">
                          {student.studentDetails?.gender || 'Not provided'}
                        </div>
                      </div> */}
                      {/* <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Roll Number</div>
                        <div className="font-medium">{student.rollNumber || 'Not provided'}</div>
                      </div> */}
                      {/* <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-500 text-sm">Registration Number</div>
                        <div className="font-medium">
                          {student.studentDetails?.registrationNumber || 'Not provided'}
                        </div>
                      </div> */}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500 text-sm">Account Created</div>
                      <div className="font-medium">{formatDate(student.createdAt)}</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500 text-sm">Address</div>
                      <div className="font-medium">
                        {student.studentDetails?.address || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Batch Information & Account Actions */}
                <div className="space-y-6">
                  {/* Batch Information */}
                  <Card>
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                          />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold">Batch Information</h2>
                    </div>

                    {student.batch ? (
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Batch Name</div>
                          <div className="font-medium">{student.batch.name}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Description</div>
                          <div className="font-medium">{student.batch.description}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Academic Year</div>
                          <div className="font-medium">{student.batch.year}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Status</div>
                          <div className="font-medium">
                            {student.batch.isActive ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-red-600">Inactive</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">You are not assigned to any batch.</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Please contact your administrator.
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Account Actions */}
                  <Card>
                    <div className="flex items-center mb-4">
                      <div className="bg-red-100 p-2 rounded-lg mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold">Account Actions</h2>
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push('/student/payments')}
                      >
                        Payment History
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Parent Information */}
              {(student.studentDetails?.parentName || student.studentDetails?.parentContact) && (
                <Card>
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Parent Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500 text-sm">Parent/Guardian Name</div>
                      <div className="font-medium">
                        {student.studentDetails?.parentName || 'Not provided'}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500 text-sm">Parent/Guardian Contact</div>
                      <div className="font-medium">
                        {student.studentDetails?.parentContact || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500">No profile information found.</p>
            </div>
          )}

          {/* Toast notifications */}
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

export default StudentProfile;
