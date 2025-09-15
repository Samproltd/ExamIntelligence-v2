import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Exam {
  _id: string;
  name: string;
}

interface DashboardStats {
  subjects: number;
  courses: number;
  exams: number;
  students: number;
  examsList: Exam[];
  recentExams: {
    _id: string;
    name: string;
    course: {
      _id: string;
      name: string;
    };
    totalStudents: number;
    averageScore: number;
    passRate: number;
  }[];
  studentStats: {
    totalActive: number;
    totalInactive: number;
    newThisMonth: number;
    batchDistribution: {
      batchName: string;
      count: number;
    }[];
  };
  examStats: {
    completed: number;
    upcoming: number;
    passRateDistribution: {
      examId?: string;
      examName?: string;
      range: string;
      count: number;
    }[];
    resultsOverTime: {
      month: string;
      passes: number;
      fails: number;
    }[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [filteredPassRateData, setFilteredPassRateData] = useState<any[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Use the real data from the API
        setStats(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Filter pass rate data based on selected exam
  useEffect(() => {
    if (stats) {
      if (selectedExamId === 'all') {
        // For "All Exams", use the general data without exam IDs
        const generalData = stats.examStats.passRateDistribution.filter(item => !item.examId);
        setFilteredPassRateData(generalData);
      } else {
        // Filter data for the selected exam
        const examData = stats.examStats.passRateDistribution.filter(
          item => item.examId === selectedExamId
        );
        setFilteredPassRateData(examData);
      }
    }
  }, [selectedExamId, stats]);

  // Handle exam selection change
  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExamId(e.target.value);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Admin Dashboard - Online Exam Portal">
        <div>
          {/* Header with Greeting */}
          <div className="bg-gradient-to-r from-primary-color to-blue-600 rounded-lg p-6 shadow-lg mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-white text-2xl font-bold">
                  {getGreeting()}, {user?.name || 'Admin'}
                </h2>
                <p className="text-blue-100 mt-1">Welcome to your admin dashboard</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-sm text-white">
                  <span className="opacity-80">Today is </span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="text-center bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-primary-color mb-2">
                    {stats?.subjects || 0}
                  </div>
                  <div className="text-gray-600">Subjects</div>
                </Card>

                <Card className="text-center bg-gradient-to-br from-white to-green-50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mx-auto mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {stats?.courses || 0}
                  </div>
                  <div className="text-gray-600">Courses</div>
                </Card>

                <Card className="text-center bg-gradient-to-br from-white to-purple-50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 mx-auto mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">{stats?.exams || 0}</div>
                  <div className="text-gray-600">Exams</div>
                </Card>

                <Card className="text-center bg-gradient-to-br from-white to-amber-50 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 text-amber-600 mx-auto mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-4xl font-bold text-amber-600 mb-2">
                    {stats?.students || 0}
                  </div>
                  <div className="text-gray-600">Students</div>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Student Distribution Chart */}
                <Card className="p-4">
                  <h2 className="text-xl font-bold mb-4">Student Distribution</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.studentStats.batchDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="batchName"
                          label={({ batchName, percent }) =>
                            `${batchName}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {stats?.studentStats.batchDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Exam Results Over Time */}
                <Card className="p-4">
                  <h2 className="text-xl font-bold mb-4">Exam Results Over Time</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats?.examStats.resultsOverTime}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="passes" stackId="a" fill="#4ade80" name="Passes" />
                        <Bar dataKey="fails" stackId="a" fill="#f87171" name="Fails" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Pass Rate Distribution */}
              <div className="mb-8">
                <Card className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Exam Pass Rate Distribution</h2>
                    <div className="mt-2 md:mt-0">
                      <select
                        className="form-select border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedExamId}
                        onChange={handleExamChange}
                      >
                        <option value="all">All Exams</option>
                        {stats?.examsList?.map(exam => (
                          <option key={exam._id} value={exam._id}>
                            {exam.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredPassRateData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" name="Number of Students">
                          {filteredPassRateData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {selectedExamId !== 'all' && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Showing pass rate distribution for:{' '}
                      {stats?.examsList.find(exam => exam._id === selectedExamId)?.name}
                    </div>
                  )}
                </Card>
              </div>

              {/* Recent Exam Performance */}
              <div>
                <h2 className="text-xl font-bold mb-4">Recent Exam Performance</h2>

                {stats?.recentExams && stats.recentExams.length > 0 ? (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exam Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Students
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg. Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pass Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.recentExams.map(exam => (
                          <tr key={exam._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{exam.course.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{exam.totalStudents}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {exam.averageScore.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {exam.passRate.toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Card>
                    <div className="text-center py-8 text-gray-500">
                      No exam results available yet.
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
