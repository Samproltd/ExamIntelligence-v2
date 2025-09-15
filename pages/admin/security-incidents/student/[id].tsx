import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import AdminLayout from '../../../../components/AdminLayout';
import Button from '../../../../components/Button';
import Card from '../../../../components/Card';
import ProtectedRoute from '../../../../components/ProtectedRoute';

interface Student {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  rollNumber?: string;
  batch?: {
    _id: string;
    name: string;
  };
}

interface SecurityIncident {
  _id: string;
  student: string;
  exam: {
    _id: string;
    name: string;
    course: {
      _id: string;
      name: string;
    };
  };
  incidentType: string;
  incidentDetails: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalIncidents: number;
}

const StudentSecurityIncidentsPage: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalIncidents: 0,
  });
  const [examFilter, setExamFilter] = useState<string>('');
  const router = useRouter();
  const { id } = router.query;

  const incidentsPerPage = 20;

  // Fetch student details
  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`/api/students/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStudent(response.data.student);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch student details');
      }
    };

    if (id) {
      fetchStudent();
    }
  }, [id]);

  // Fetch security incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const params: any = {
          page: pagination.currentPage,
          limit: incidentsPerPage,
        };

        if (examFilter) {
          params.examId = examFilter;
        }

        const response = await axios.get(`/api/security-incidents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        });

        setIncidents(response.data.incidents);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalIncidents: response.data.totalIncidents,
        });
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch security incidents');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIncidents();
    }
  }, [id, pagination.currentPage, examFilter]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get human-readable incident type
  const getIncidentTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      TAB_SWITCH: 'Tab Switching',
      EXIT_FULLSCREEN: 'Exited Fullscreen',
      COPY_ATTEMPT: 'Copy Attempt',
      DEV_TOOLS_OPEN: 'Developer Tools',
      BROWSER_CLOSE: 'Browser Close Attempt',
    };

    return typeLabels[type] || type;
  };

  // Get incident type badge color
  const getIncidentTypeBadgeClass = (type: string) => {
    const typeClasses: { [key: string]: string } = {
      TAB_SWITCH: 'bg-yellow-100 text-yellow-800',
      EXIT_FULLSCREEN: 'bg-blue-100 text-blue-800',
      COPY_ATTEMPT: 'bg-red-100 text-red-800',
      DEV_TOOLS_OPEN: 'bg-purple-100 text-purple-800',
      BROWSER_CLOSE: 'bg-orange-100 text-orange-800',
    };

    return typeClasses[type] || 'bg-gray-100 text-gray-800';
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  // Handle exam filter change
  const handleExamFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExamFilter(e.target.value);
    setPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when filter changes
    }));
  };

  // Group incidents by exam
  const groupedIncidents = incidents.reduce(
    (groups: { [key: string]: SecurityIncident[] }, incident) => {
      // Skip if exam is null or invalid
      if (!incident.exam || !incident.exam._id) {
        console.warn('Skipping incident with missing or invalid exam data:', {
          incidentId: incident._id,
          exam: incident.exam,
          timestamp: incident.timestamp,
          incidentType: incident.incidentType,
        });
        return groups;
      }

      const examId = incident.exam._id;
      if (!groups[examId]) {
        groups[examId] = [];
      }
      groups[examId].push(incident);
      return groups;
    },
    {}
  );

  if (!id) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout
        title={`Security Incidents - ${
          student?.firstName && student?.lastName
            ? `${student.firstName} ${student.lastName}`
            : student?.name || 'Student'
        }`}
      >
        <div>
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex text-sm">
              <Link href="/admin">
                <span className="text-blue-600 hover:underline">Dashboard</span>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/security-incidents">
                <span className="text-blue-600 hover:underline">Security Incidents</span>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-600">{student?.name || 'Student'}</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Security Incidents</h1>
              {student && (
                <div className="text-gray-600">
                  <p className="font-medium">
                    {student.firstName && student.lastName
                      ? `${student.firstName} ${student.lastName}`
                      : student.name}
                  </p>
                  <p>{student.email}</p>
                  {student.rollNumber && <p>Roll Number: {student.rollNumber}</p>}
                  {student.batch && <p>Batch: {student.batch.name}</p>}
                </div>
              )}
            </div>

            {/* Filter by exam */}
            {incidents.length > 0 && (
              <div className="mt-4 md:mt-0">
                <label
                  htmlFor="exam-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Exam
                </label>
                <select
                  id="exam-filter"
                  className="form-control min-w-[200px]"
                  value={examFilter}
                  onChange={handleExamFilterChange}
                >
                  <option value="">All Exams</option>
                  {Object.entries(groupedIncidents).map(([examId, incidents]) => (
                    <option key={examId} value={examId}>
                      {incidents[0].exam.name} ({incidents.length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Incidents list */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : incidents.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No security incidents found for this student.</p>
                <Button onClick={() => router.push('/admin/security-incidents')}>
                  Back to Overview
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Showing {incidents.length} incidents of {pagination.totalIncidents} total
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Incident Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Agent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incidents.map(incident => (
                      <tr key={incident._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {incident.exam?.name}
                          </div>
                          {incident.exam?.course && (
                            <div className="text-xs text-gray-500">
                              {incident.exam?.course.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getIncidentTypeBadgeClass(
                              incident.incidentType
                            )}`}
                          >
                            {getIncidentTypeLabel(incident.incidentType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {incident.incidentDetails}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(incident.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {incident.userAgent || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default StudentSecurityIncidentsPage;
