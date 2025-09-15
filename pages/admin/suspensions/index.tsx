import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import ProtectedRoute from '../../../components/ProtectedRoute';
import useToast from '../../../hooks/useToast';
import Snackbar from '../../../components/Snackbar';
import dashboard from '@/pages/api/admin/dashboard';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Exam {
  _id: string;
  name: string;
}

interface SecurityIncident {
  _id: string;
  incidentType: string;
  incidentDetails: string;
  timestamp: string;
}

interface ExamSuspension {
  _id: string;
  student: User;
  exam: Exam;
  incidents: SecurityIncident[];
  suspensionTime: string;
  reason: string;
  reviewedByAdmin: boolean;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: User;
  removed?: boolean;
  removedAt?: string;
}

// Group multiple suspensions by student-exam pair
interface GroupedSuspension {
  studentId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examName: string;
  suspensions: ExamSuspension[];
  hasActiveSuspension: boolean;
}

export default function SuspensionsPage() {
  const [loading, setLoading] = useState(true);
  const [suspensions, setSuspensions] = useState<ExamSuspension[]>([]);
  const [groupedSuspensions, setGroupedSuspensions] = useState<GroupedSuspension[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast notifications
  const { toast, showSuccess, showError, hideToast, showInfo } = useToast();
  // state declarations for email sending
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSuspensions();
  }, []);

  // Group suspensions whenever the raw suspensions change
  useEffect(() => {
    if (suspensions.length > 0) {
      const grouped: Record<string, GroupedSuspension> = {};

      // Group suspensions by student-exam pair
      suspensions.forEach(suspension => {
        // Skip if student or exam is null
        if (!suspension.student || !suspension.exam) {
          console.warn('Skipping suspension with missing student or exam data:', suspension);
          return;
        }

        const key = `${suspension.student._id}-${suspension.exam._id}`;

        if (!grouped[key]) {
          grouped[key] = {
            studentId: suspension.student._id,
            studentName: suspension.student.name || 'Unknown Student',
            studentEmail: suspension.student.email || 'No email',
            examId: suspension.exam._id,
            examName: suspension.exam.name || 'Unknown Exam',
            suspensions: [],
            hasActiveSuspension: false,
          };
        }

        // Add suspension to the group
        grouped[key].suspensions.push(suspension);

        // Check if any suspension in this group is active
        if (!suspension.removed) {
          grouped[key].hasActiveSuspension = true;
        }
      });

      // Convert the grouped object to array and sort suspensions by time (newest first)
      const groupedArray = Object.values(grouped).map(group => {
        // Sort suspensions within each group by time
        group.suspensions.sort(
          (a, b) => new Date(b.suspensionTime).getTime() - new Date(a.suspensionTime).getTime()
        );
        return group;
      });

      // Sort groups with active suspensions first, then by most recent suspension time
      groupedArray.sort((a, b) => {
        // Active suspensions first
        if (a.hasActiveSuspension && !b.hasActiveSuspension) return -1;
        if (!a.hasActiveSuspension && b.hasActiveSuspension) return 1;

        // Then by most recent suspension time
        const aLatestTime = new Date(a.suspensions[0].suspensionTime).getTime();
        const bLatestTime = new Date(b.suspensions[0].suspensionTime).getTime();
        return bLatestTime - aLatestTime;
      });

      setGroupedSuspensions(groupedArray);
    } else {
      setGroupedSuspensions([]);
    }
  }, [suspensions]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSuspensions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found in localStorage');
        setNotification({
          type: 'error',
          message: 'Authentication token not found. Please log in again.',
        });
        return;
      }

      console.log('Fetching suspensions with token:', token.substring(0, 10) + '...');

      const response = await axios.get('/api/admin/suspensions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Suspensions API response:', response.data);

      if (response.data.success) {
        setSuspensions(response.data.suspensions);
      } else {
        console.error('API returned error:', response.data.message);
        setNotification({
          type: 'error',
          message: response.data.message || 'Failed to load suspensions',
        });
      }
    } catch (error) {
      console.error('Failed to fetch suspensions:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      setNotification({
        type: 'error',
        message: 'Failed to load suspensions. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeSuspension = async (examId: string, studentId: string, suspensionId: string) => {
    try {
      setActionLoading(suspensionId);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/api/exams/suspension/remove',
        {
          examId,
          studentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setNotification({
          type: 'success',
          message: 'Suspension removed successfully',
        });
        // Update the local state to reflect the change
        setSuspensions(prevSuspensions =>
          prevSuspensions.map(suspension =>
            suspension._id === suspensionId
              ? {
                  ...suspension,
                  removed: true,
                  removedAt: new Date().toISOString(),
                }
              : suspension
          )
        );
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to remove suspension',
        });
      }
    } catch (error) {
      console.error('Failed to remove suspension:', error);
      setNotification({
        type: 'error',
        message: 'Failed to remove suspension',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getIncidentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EXIT_FULLSCREEN: 'Exit Fullscreen',
      TAB_SWITCH: 'Tab Change',
      BROWSER_CLOSE: 'Browser Close',
      COPY_ATTEMPT: 'Copy Attempt',
      DEV_TOOLS_OPEN: 'Dev Tools Open',
      CAMERA_INACTIVE: 'Camera Inactive',
      MULTIPLE_FACES: 'Multiple Faces',
      NO_FACE_DETECTED: 'No Face Detected',
    };

    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const viewStudentIncidents = (studentId: string) => {
    router.push(`/admin/security-incidents/student/${studentId}`);
  };

  const viewExamDetails = (examId: string) => {
    router.push(`/admin/exams/${examId}`);
  };

  // Send Notification via mail function
  const sendNotification = async (studentMail: string, studentName: string, examName: string) => {
    console.log('Send Mail Request intiated');
    // Set sending state to true for this email
    setSendingEmails(prev => ({ ...prev, [studentMail]: true }));
    try {
      // console.log("Initiating email send request with response data:",responseData);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/mailservice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: studentMail,
            emailType: 'suspension-revoke-notification',
            payload: {
              email: studentMail,
              name: studentName,
              examName: examName,
              dashboardLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5050'}/student`,
            },
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      // res.status(201).json({ message: 'User registered and email sent!' });
      console.log('mail sent');
      // Show success message
      showSuccess(`Mail sent to ${studentName}.`);
      return { status: 201, message: 'User registered and email sent!' };
    } catch (error) {
      console.error(error);
      // Show success message
      showError(`Some error occured.Can not send mail.`);
      return { status: 202, message: 'Registration successful, but failed to send email.' };
    } finally {
      // Reset sending state to false after the request completes
      setSendingEmails(prev => ({ ...prev, [studentMail]: false }));
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        <div className="pb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Exam Suspensions</h1>
            <Button onClick={() => router.push('/admin/security-incidents')}>
              View Security Incidents
            </Button>
          </div>

          {notification && (
            <div
              className={`mb-4 p-4 rounded-md ${
                notification.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {notification.message}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : groupedSuspensions.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-500">No exam suspensions found</h3>
                <p className="mt-2 text-gray-400">
                  There are no students with suspended exams at this time.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedSuspensions.map(group => (
                <Card key={`${group.studentId}-${group.examId}`} className="overflow-hidden">
                  <div
                    className={`border-l-4 ${
                      group.hasActiveSuspension ? 'border-red-500' : 'border-gray-300'
                    } pl-4`}
                  >
                    <div className="flex justify-between flex-wrap">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold mb-1">
                          {group.studentName}{' '}
                          <span className="text-sm font-normal text-gray-500">
                            ({group.studentEmail})
                          </span>
                        </h3>
                        <h4 className="font-medium">Exam: {group.examName}</h4>
                      </div>
                      <div className="flex items-start space-x-2">
                        {group.hasActiveSuspension ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Currently Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            All Suspensions Removed
                          </span>
                        )}
                        {group.suspensions.length > 1 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {group.suspensions.length} Suspensions
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Suspension history */}
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Suspension History:</h4>
                      <div className="space-y-4">
                        {group.suspensions.map((suspension, index) => (
                          <div
                            key={suspension._id}
                            className={`p-3 rounded-md ${
                              !suspension.removed
                                ? 'bg-red-50 border border-red-100'
                                : 'bg-gray-50 border border-gray-100'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">
                                Suspension #{group.suspensions.length - index}
                              </span>
                              <span className="text-sm text-gray-600">
                                {formatDate(suspension.suspensionTime)}
                              </span>
                            </div>
                            <p className="text-sm mb-2">
                              <span className="font-medium">Reason:</span> {suspension.reason}
                            </p>
                            {suspension.removed && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Removed:</span>{' '}
                                {formatDate(suspension.removedAt || '')}
                              </p>
                            )}

                            {!suspension.removed && (
                              <div className="mt-2 flex justify-end">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={actionLoading === suspension._id}
                                  onClick={() =>
                                    removeSuspension(group.examId, group.studentId, suspension._id)
                                  }
                                >
                                  Remove Suspension
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={sendingEmails[group.studentEmail]}
                        onClick={() =>
                          sendNotification(group.studentEmail, group.studentName, group.examName)
                        }
                      >
                        {sendingEmails[group.studentEmail] ? 'Sending Email' : 'Send Notification'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewStudentIncidents(group.studentId)}
                      >
                        View Student Incidents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewExamDetails(group.examId)}
                      >
                        View Exam Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        {/* Add Snackbar component for toast notifications */}
        <Snackbar open={toast.open} message={toast.message} type={toast.type} onClose={hideToast} />
      </AdminLayout>
    </ProtectedRoute>
  );
}
