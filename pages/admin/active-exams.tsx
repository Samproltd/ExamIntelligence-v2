import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, formatDistance } from 'date-fns';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
  batch?: {
    _id: string;
    name: string;
  };
}

interface Exam {
  _id: string;
  name: string;
  duration: number;
  course: {
    _id: string;
    name: string;
  };
}

interface SessionMetrics {
  elapsedMinutes: number;
  idleMinutes: number;
  remainingMinutes: number;
  progressPercentage: number;
  isIdle: boolean;
  isOvertime: boolean;
}

interface ActiveSession {
  _id: string;
  student: Student;
  exam: Exam;
  startTime: string;
  lastActive: string;
  browserInfo: string;
  ipAddress: string;
  deviceInfo: string;
  metrics: SessionMetrics;
}

interface ExamGroup {
  exam: Exam;
  students: ActiveSession[];
}

const ActiveExamsPage: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<ExamGroup[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/admin/active-exam-sessions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setActiveSessions(response.data.activeSessions);
      setGroupedSessions(response.data.groupedByExam);
      setTotalActive(response.data.totalActive);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch active exam sessions');
    } finally {
      setLoading(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    fetchActiveSessions();

    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchActiveSessions();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const getProgressColor = (metrics: SessionMetrics) => {
    if (metrics.isOvertime) return 'bg-red-500';
    if (metrics.progressPercentage > 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (session: ActiveSession) => {
    const { metrics } = session;

    if (metrics.isOvertime) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Overtime ({metrics.elapsedMinutes - session.exam.duration} min over)
        </span>
      );
    }

    if (metrics.isIdle) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Idle ({metrics.idleMinutes} min)
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Active Exams - Admin Dashboard">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Active Exam Sessions</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">Auto-refresh:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">Refresh every:</span>
                <select
                  value={refreshInterval}
                  onChange={e => setRefreshInterval(Number(e.target.value))}
                  className="block w-24 px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="10">10s</option>
                  <option value="30">30s</option>
                  <option value="60">1m</option>
                  <option value="300">5m</option>
                </select>
              </div>
              <button
                onClick={fetchActiveSessions}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh Now
              </button>
            </div>
          </div>

          {loading && !activeSessions.length ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
          ) : (
            <>
              <div className="mb-6">
                <Card>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Active Sessions Overview</h2>
                      <p className="text-gray-600">
                        There {totalActive === 1 ? 'is' : 'are'} currently{' '}
                        <span className="font-semibold text-blue-600">{totalActive}</span>{' '}
                        {totalActive === 1 ? 'student' : 'students'} taking {groupedSessions.length}{' '}
                        {groupedSessions.length === 1 ? 'exam' : 'exams'}.
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Last updated: {format(new Date(), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-sm text-gray-600">Idle (5+ min)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-sm text-gray-600">Overtime</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {totalActive === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No active exams</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are currently no students taking exams.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedSessions.map(group => (
                    <Card key={group.exam._id.toString()}>
                      <div className="mb-4 border-b pb-4">
                        <h2 className="text-xl font-semibold text-gray-900">{group.exam.name}</h2>
                        <p className="text-gray-600">
                          Course: {group.exam.course.name} • Duration: {group.exam.duration} minutes
                          • Students: {group.students.length}
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
                                Started
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Progress
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time Remaining
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Activity
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.students.map(session => (
                              <tr key={session._id.toString()} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {session.student.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {session.student.email}
                                      </div>
                                      {session.student.rollNumber && (
                                        <div className="text-xs text-gray-500">
                                          Roll: {session.student.rollNumber}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {session.student.batch?.name || 'No Batch'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {format(new Date(session.startTime), 'HH:mm:ss')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDistance(new Date(session.startTime), new Date(), {
                                      addSuffix: true,
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${getProgressColor(
                                        session.metrics
                                      )}`}
                                      style={{ width: `${session.metrics.progressPercentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {session.metrics.progressPercentage}% complete
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(session)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className={`text-sm font-medium ${
                                      session.metrics.isOvertime
                                        ? 'text-red-600'
                                        : session.metrics.remainingMinutes < 5
                                          ? 'text-orange-600'
                                          : 'text-green-600'
                                    }`}
                                  >
                                    {session.metrics.isOvertime
                                      ? 'Overtime'
                                      : `${session.metrics.remainingMinutes} minutes`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {format(new Date(session.lastActive), 'HH:mm:ss')}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      session.metrics.isIdle ? 'text-yellow-600' : 'text-gray-500'
                                    }`}
                                  >
                                    {formatDistance(new Date(session.lastActive), new Date(), {
                                      addSuffix: true,
                                    })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ActiveExamsPage;
