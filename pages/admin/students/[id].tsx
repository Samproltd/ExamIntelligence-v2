import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Snackbar from '../../../components/Snackbar';
import useToast from '../../../hooks/useToast';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface Student {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  rollNumber?: string;
  mobile?: string;
  dateOfBirth?: string;
  password?: string;
  batch?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  isBlocked?: boolean;
}

interface Result {
  _id: string;
  student: string;
  exam: {
    _id: string;
    name: string;
    course: {
      _id: string;
      name: string;
      subject: {
        _id: string;
        name: string;
      };
    };
  };
  answers: Array<{
    question: string;
    selectedOption: string;
    isCorrect: boolean;
    _id: string;
  }>;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  certificate?: {
    certificateId: string;
    issuedDate: string;
    emailSent: boolean;
    _id: string;
  };
}

interface Batch {
  _id: string;
  name: string;
}

const StudentDetailPage = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [editedStudent, setEditedStudent] = useState<Partial<Student>>({});

  // Toast notifications
  const { toast, showSuccess, showError, hideToast } = useToast();

  const router = useRouter();
  const { id } = router.query;
  const { token } = useSelector((state: RootState) => state.auth);

  // State for attempts remaining and notifications
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});
  const [attemptsData, setAttemptsData] = useState<{ [key: string]: number | null }>({});
  const [loadingdata, setLoadingdata] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [notifiedExams, setNotifiedExams] = useState<{ [key: string]: boolean }>({});

  // Fetch attempts remaining function
  const fetchAttemptsRemaining = async (examId: string) => {
    if (!token) {
      setErrors(prev => ({
        ...prev,
        [examId]: 'Authentication token is missing. Please log in again.',
      }));
      showError('Please log in to continue');
      router.push('/login');
      return;
    }

    try {
      setLoadingdata(prev => ({ ...prev, [examId]: true }));
      console.log(`Fetching attempts for exam ${examId} with token: ${token.slice(0, 10)}...`);

      // Use admin endpoint with studentId
      const response = await axios.get(`/api/admin/exams/${examId}?studentId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Exam API response for ${examId}:`, response.data);

      // Calculate attempts remaining
      const exam = response.data.exam;
      let remaining;
      if (exam.maxAttempts !== undefined && exam.attemptsMade !== undefined) {
        remaining = exam.maxAttempts - exam.attemptsMade;
      } else {
        remaining = null; // Handle cases where attempts data is unavailable
      }

      setAttemptsData(prev => ({ ...prev, [examId]: remaining }));
      setErrors(prev => ({ ...prev, [examId]: null }));
    } catch (err) {
      let errorMessage = 'Failed to fetch attempts';
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          errorMessage = 'Access denied. Only admins can access this endpoint.';
        } else if (err.response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          router.push('/login');
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.message || 'Invalid request. Please try again.';
        } else if (err.response.status === 404) {
          errorMessage = 'Exam not found.';
        } else {
          errorMessage = err.response.data?.message || err.message;
        }
      }
      console.error(`Error fetching attempts for exam ${examId}:`, err.response?.data || err);
      setErrors(prev => ({ ...prev, [examId]: errorMessage }));
      showError(errorMessage);
    } finally {
      setLoadingdata(prev => ({ ...prev, [examId]: false }));
    }
  };

  // Get number of attempts remaining
  useEffect(() => {
    if (!token) {
      showError('Please log in to continue');
      router.push('/login');
      return;
    }

    // Fetch attempts for exams that haven't been fetched or aren't loading
    results.forEach(result => {
      const examId = result.exam._id;
      if (examId && attemptsData[examId] === undefined && !loadingdata[examId] && !errors[examId]) {
        fetchAttemptsRemaining(examId);
      }
    });
  }, [results, attemptsData, loadingdata, errors, token, router, id]);

  // Fetch student details
  const fetchStudent = async () => {
    if (!id || !token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/students/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { student, results } = response.data;
      console.log('API Response - Student:', student);
      setStudent(student);
      setResults(results);

      // Initialize edit form with current values
      setEditedStudent({
        name: student.name,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        rollNumber: student.rollNumber,
        mobile: student.mobile,
        dateOfBirth: student.dateOfBirth,
        batch: student.batch,
      });
      console.log('Initialized editedStudent:', {
        name: student.name,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        rollNumber: student.rollNumber,
        mobile: student.mobile,
        dateOfBirth: student.dateOfBirth,
        batch: student.batch,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student details';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all batches
  const fetchBatches = async () => {
    if (!token) return;

    try {
      const response = await axios.get('/api/batches', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBatches(response.data.batches);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch batches';
      showError(errorMessage);
      console.error('Error fetching batches:', error);
    }
  };

  // Handle editing student
  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(`/api/students/${id}`, editedStudent, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state with edited student
      setStudent(response.data.student);

      // Show success message
      showSuccess('Student information updated successfully');

      setShowEditModal(false);

      // Refetch to get updated data including batch information
      fetchStudent();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error updating student:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting student
  const handleDeleteStudent = async () => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    if (!token) {
      showError('Please log in to continue');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.delete(`/api/students/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Show success message
      showSuccess('Student deleted successfully');

      // Redirect to students list after a brief delay
      setTimeout(() => {
        router.push('/admin/students');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete student';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Error deleting student:', error);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Effect to fetch student when ID changes
  useEffect(() => {
    if (id && token) {
      fetchStudent();
      fetchBatches();
    }
  }, [id, token]);

  // Helper to check if student has ever passed the exam
  const hasPassedExam = (examId: string): boolean => {
    return results.some(result => result.exam._id === examId && result.passed);
  };

  if (loading && !student) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout title="Student Details | Admin" description="View and manage student">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-8">Loading...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error && !student) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout title="Student Details | Admin" description="View and manage student">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/admin/students')}>Back to Students</Button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout
        title={`${
          student?.firstName && student?.lastName
            ? `${student.firstName} ${student.lastName}`
            : student?.name || 'Student'
        } | Admin`}
        description="View and manage student"
      >
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex text-sm">
              <Link href="/admin">
                <span className="text-blue-600 hover:underline">Dashboard</span>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/students">
                <span className="text-blue-600 hover:underline">Students</span>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-600">{student?.name}</span>
            </nav>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Student details */}
          {student && (
            <div className="mb-8">
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold">
                    {student.firstName && student.lastName
                      ? `${student.firstName} ${student.lastName}`
                      : student.name}
                  </h1>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log('Opening edit modal, editedStudent:', editedStudent);
                        setShowEditModal(true);
                      }}
                    >
                      Edit Student
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteStudent}
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    >
                      Delete Student
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Student Details</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {student.firstName && student.lastName ? (
                        <>
                          <p className="mb-2">
                            <span className="font-semibold">First Name:</span> {student.firstName}
                          </p>
                          <p className="mb-2">
                            <span className="font-semibold">Last Name:</span> {student.lastName}
                          </p>
                        </>
                      ) : (
                        <p className="mb-2">
                          <span className="font-semibold">Name:</span> {student.name}
                        </p>
                      )}
                      <p className="mb-2">
                        <span className="font-semibold">Email:</span> {student.email}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Mobile:</span> {student.mobile || '-'}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Date of Birth:</span>{' '}
                        {student.dateOfBirth ? formatDate(student.dateOfBirth) : '-'}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Roll Number:</span>{' '}
                        {student.rollNumber || '-'}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Batch:</span>{' '}
                        {student.batch ? (
                          <Link href={`/admin/batches/${student.batch._id}`}>
                            <span className="text-blue-600 hover:underline">
                              {student.batch.name}
                            </span>
                          </Link>
                        ) : (
                          'Not assigned'
                        )}
                      </p>
                      {student.batch && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <p className="text-yellow-800">
                            <strong>⚠️ Important:</strong> Student must have a valid subscription to see exams.
                            Batch assignment alone is not sufficient for exam access.
                          </p>
                        </div>
                      )}
                      <p className="mb-2">
                        <span className="font-semibold">Registered:</span>{' '}
                        {formatDate(student.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-2">Student Statistics</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="mb-2">
                        <span className="font-semibold">Total Exams Taken:</span> {results.length}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Average Score:</span>{' '}
                        {results.length > 0
                          ? `${(
                              results.reduce((acc, result) => acc + result.percentage, 0) /
                              results.length
                            ).toFixed(2)}%`
                          : 'N/A'}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Exams Passed:</span>{' '}
                        {results.filter(r => r.passed).length}
                      </p>
                      <p className="mb-2">
                        <span className="font-semibold">Exams Failed:</span>{' '}
                        {results.filter(r => !r.passed).length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Exam Results */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Exam Results</h2>

            {results.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600">No exam results found for this student.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Exam</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Subject</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Percentage</th>
                      <th className="px-4 py-3 text-center">Result</th>
                      <th className="px-4 py-3 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map(result => (
                      <tr key={result._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/admin/exams/${result.exam._id}`}>
                            <span className="text-blue-600 hover:underline font-medium">
                              {result.exam.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/courses/${result.exam.course._id}`}>
                            <span className="text-blue-600 hover:underline">
                              {result.exam.course.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/subjects/${result.exam.course.subject._id}`}>
                            <span className="text-blue-600 hover:underline">
                              {result.exam.course.subject.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.score} / {result.totalQuestions}
                        </td>
                        <td className="px-4 py-3 text-center">{result.percentage.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-center">
                          {result.passed ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Passed
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">{formatDate(result.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Student Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white py-2">Edit Student</h2>
                <form onSubmit={handleEditStudent}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">First Name</label>
                    <input
                      type="text"
                      value={editedStudent.firstName || ''}
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          firstName: e.target.value,
                          name: `${e.target.value} ${editedStudent.lastName || ''}`.trim(),
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editedStudent.lastName || ''}
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          lastName: e.target.value,
                          name: `${editedStudent.firstName || ''} ${e.target.value}`.trim(),
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last Name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input
                      type="email"
                      value={editedStudent.email || ''}
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={editedStudent.mobile || ''}
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          mobile: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mobile Number"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={
                        editedStudent.dateOfBirth ? editedStudent.dateOfBirth.substring(0, 10) : ''
                      }
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={editedStudent.rollNumber || ''}
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          rollNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Roll Number"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={editedStudent.password || ''}
                      onChange={e =>
                        setEditedStudent({
                          ...editedStudent,
                          password: e.target.value === '' ? undefined : e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave blank to keep current password"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Only fill this field if you want to reset the password
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Batch</label>
                    <select
                      value={
                        typeof editedStudent.batch === 'object' && editedStudent.batch
                          ? editedStudent.batch._id
                          : ''
                      }
                      onChange={e => {
                        const batchId = e.target.value;
                        if (batchId) {
                          const selectedBatch = batches.find(batch => batch._id === batchId);
                          if (selectedBatch) {
                            setEditedStudent({
                              ...editedStudent,
                              batch: {
                                _id: selectedBatch._id,
                                name: selectedBatch.name,
                              },
                            });
                          }
                        } else {
                          setEditedStudent({
                            ...editedStudent,
                            batch: undefined,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a batch</option>
                      {batches.map(batch => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                      <p className="text-orange-800">
                        <strong>⚠️ Note:</strong> Batch assignment alone won't give exam access. 
                        Student must also have a valid subscription to the plan assigned to this batch.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Snackbar for toast notifications */}
        <Snackbar open={toast.open} message={toast.message} type={toast.type} onClose={hideToast} />
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default StudentDetailPage;
