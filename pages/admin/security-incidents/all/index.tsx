import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../../components/AdminLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import Button from '../../../../components/Button';
import Card from '../../../../components/Card';

interface Exam {
  _id: string;
  name: string;
}

interface SecurityIncident {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    batch?: {
      _id: string;
      name: string;
    };
  };
  exam: {
    _id: string;
    name: string;
  };
  incidentType: string;
  incidentDetails: string;
  timestamp: string;
  createdAt: string;
  causedSuspension?: boolean;
}

const AllSecurityIncidentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exams, setExams] = useState<Exam[]>([]);

  // Filters
  const [examFilter, setExamFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const router = useRouter();
  const incidentsPerPage = 20;

  // Fetch all security incidents with filters
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Prepare params with filters
        const params: any = {
          page: currentPage,
          limit: incidentsPerPage,
        };

        if (examFilter) {
          params.examId = examFilter;
        }

        if (startDate) {
          params.startDate = startDate;
        }

        if (endDate) {
          params.endDate = endDate;
        }

        const response = await axios.get('/api/security-incidents', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        });

        setIncidents(response.data.incidents);
        setTotalIncidents(response.data.total);
        setTotalPages(Math.ceil(response.data.total / incidentsPerPage));
      } catch (error) {
        console.error('Failed to fetch security incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [currentPage, examFilter, startDate, endDate]);

  // Fetch exams for filter dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/exams', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            limit: 100, // Get a larger list for the filter
          },
        });

        setExams(response.data.exams);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };

    fetchExams();
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when applying new filters
  };

  const clearFilters = () => {
    setExamFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const getIncidentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'window-blur': 'Window Blur',
      'tab-change': 'Tab Change',
      'full-screen-exit': 'Full Screen Exit',
      'paste-attempt': 'Paste Attempt',
      'multiple-windows': 'Multiple Windows',
      'face-not-visible': 'Face Not Visible',
      'multiple-faces': 'Multiple Faces',
      'unauthorized-person': 'Unauthorized Person',
      'speaking-detected': 'Speaking Detected',
    };

    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="All Security Incidents - Admin">
        <div className="pb-12">
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
              <span className="text-gray-600">All Incidents</span>
            </nav>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">All Security Incidents</h1>
            <Button variant="outline" onClick={() => router.push('/admin/security-incidents')}>
              Back to Overview
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
                  <select
                    value={examFilter}
                    onChange={e => setExamFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Exams</option>
                    {exams.map(exam => (
                      <option key={exam._id} value={exam._id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button type="submit">Apply Filters</Button>
              </div>
            </form>
          </Card>

          {/* Incidents List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : incidents.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No security incidents match your filters.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Showing {incidents.length} incidents of {totalIncidents} total
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
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
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incidents.map(incident => (
                      <tr key={incident._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {incident.student?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {incident.student?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {incident.student?.batch?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {incident.exam?.name || 'Unknown Exam'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            {getIncidentTypeLabel(incident.incidentType)}
                          </span>
                          {incident.causedSuspension && (
                            <span className="ml-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Suspension
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {incident.incidentDetails}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(incident.timestamp || incident.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/admin/security-incidents/student/${incident.student?._id}`}>
                            <span className="text-blue-600 hover:underline text-sm">
                              View Student
                            </span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
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

export default AllSecurityIncidentsPage;
