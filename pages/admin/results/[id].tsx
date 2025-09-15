import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';

interface Answer {
  question: {
    _id: string;
    text?: string;
    questionText?: string;
    options: { [key: string]: string } | Array<{ text: string; isCorrect: boolean; _id: string }>;
    correctAnswer: string;
    marks: number;
  };
  selectedOption: string;
  isCorrect: boolean;
}

interface ResultDetail {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    batch: {
      _id: string;
      name: string;
      year: number;
    };
  };
  exam: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    totalMarks: number;
    passPercentage: number;
    course: {
      _id: string;
      name: string;
    };
  };
  answers: Answer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

// Additional interfaces for student analytics
interface SecurityIncident {
  _id: string;
  incidentType: string;
  incidentDetails: string;
  timestamp: string;
}

interface StudentAnalytics {
  totalAttempts: number;
  securityIncidents: SecurityIncident[];
  totalIncidents: number;
  suspensions: number;
}

const ResultDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<StudentAnalytics>({
    totalAttempts: 0,
    securityIncidents: [],
    totalIncidents: 0,
    suspensions: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResultDetail();
    }
  }, [id]);

  // Fetch student analytics when result is loaded
  useEffect(() => {
    if (result?.student?._id && result?.exam?._id) {
      fetchStudentAnalytics();
    }
  }, [result]);

  const fetchResultDetail = async () => {
    try {
      setLoading(true);

      // Get the authentication token
      const token = localStorage.getItem('token');

      const response = await axios.get(`/api/admin/results/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setResult(response.data.result);
        setError('');
      } else {
        setError('Failed to load result details');
      }
    } catch (err) {
      console.error('Error fetching result details:', err);
      setError('Failed to load result details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnalytics = async () => {
    if (!result) return;

    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch all attempts by this student for this exam
      const attemptsResponse = await axios.get(`/api/admin/results`, {
        params: {
          exam: result.exam._id,
          search: result.student.email,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch security incidents for this student and exam
      const incidentsResponse = await axios.get(`/api/security-incidents/${result.student._id}`, {
        params: {
          examId: result.exam._id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Count suspensions (could be a separate API, but using incidents for now)
      const suspensionIncidents =
        incidentsResponse.data.incidents?.filter(
          (incident: SecurityIncident) => incident.incidentType === 'suspension'
        ) || [];

      setAnalytics({
        totalAttempts: attemptsResponse.data.pagination?.total || 0,
        securityIncidents: incidentsResponse.data.incidents || [],
        totalIncidents: incidentsResponse.data.pagination?.total || 0,
        suspensions: suspensionIncidents.length,
      });
    } catch (err) {
      console.error('Error fetching student analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;

    if (hours > 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm:ss');
  };

  const renderStatusBadge = () => {
    if (!result) return null;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {result.passed ? 'Passed' : 'Failed'}
      </span>
    );
  };

  // Helper function to extract option value properly based on format
  const getOptionText = (options: any, optionKey: string): string => {
    // Check if options is an object with key-value pairs
    if (options && typeof options === 'object' && !Array.isArray(options)) {
      return options[optionKey] || optionKey;
    }

    // Check if options is an array of option objects
    if (options && Array.isArray(options)) {
      const option = options.find(
        opt =>
          opt._id === optionKey || opt.text === optionKey || (typeof opt === 'object' && opt.text)
      );
      return option ? (typeof option === 'object' ? option.text : option) : optionKey;
    }

    return optionKey;
  };

  // Add a helper function to get the question text
  const getQuestionText = (question: Answer['question'] | undefined): string => {
    if (!question) return 'Question unavailable';

    // Try both text and questionText fields
    return question.text || question.questionText || 'Question unavailable';
  };

  return (
    <AdminLayout title="Result Details - Admin Dashboard">
      <div className="mx-auto px-4">
        <div className="mb-10">
          {/* Breadcrumb */}
          <div className="flex items-center mb-6">
            <Link href="/admin/results">
              <div className="text-primary-color hover:text-primary-dark cursor-pointer">
                &larr; Back to Results
              </div>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-6">Result Details</h1>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">{error}</div>
          ) : result ? (
            <div className="space-y-6">
              {/* Result Header */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">{result.exam.name}</h2>
                  {renderStatusBadge()}
                </div>
                <p className="text-gray-600 mb-6">{result.exam.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Student Information</h3>
                    <div className="text-sm">
                      <p className="mb-1">
                        <strong>Name:</strong> {result.student.name}
                      </p>
                      <p className="mb-1">
                        <strong>Email:</strong> {result.student.email}
                      </p>
                      <p className="mb-1">
                        <strong>Phone:</strong> {result.student.phone || 'N/A'}
                      </p>
                      <p>
                        <strong>Batch:</strong> {result.student.batch?.name || 'N/A'} (
                        {result.student.batch?.year || 'N/A'})
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Exam Information</h3>
                    <div className="text-sm">
                      <p className="mb-1">
                        <strong>Course:</strong> {result.exam.course.name}
                      </p>
                      <p className="mb-1">
                        <strong>Duration:</strong> {result.exam.duration} min
                      </p>
                      <p className="mb-1">
                        <strong>Total Marks:</strong> {result.exam.totalMarks}
                      </p>
                      <p>
                        <strong>Pass Percentage:</strong> {result.exam.passPercentage}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Result Summary</h3>
                    <div className="text-sm">
                      <p className="mb-1">
                        <strong>Score:</strong> {result.score} / {result.totalQuestions}
                      </p>
                      <p className="mb-1">
                        <strong>Percentage:</strong> {result.percentage.toFixed(2)}%
                      </p>
                      <p className="mb-1">
                        <strong>Status:</strong>{' '}
                        <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </p>
                      <p>
                        <strong>Attempt:</strong> {result.attemptNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Start Time:</strong> {formatDate(result.startTime)}
                    </div>
                    <div>
                      <strong>End Time:</strong> {formatDate(result.endTime)}
                    </div>
                    <div>
                      <strong>Duration Taken:</strong>{' '}
                      {getDuration(result.startTime, result.endTime)}
                    </div>
                    <div>
                      <strong>Created At:</strong> {formatDate(result.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Analytics */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Student Analytics</h2>

                {analyticsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-color"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-medium text-blue-700 mb-1">Total Attempts</h3>
                      <p className="text-3xl font-bold text-blue-800">{analytics.totalAttempts}</p>
                      <p className="text-sm text-blue-600 mt-1">For this exam</p>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h3 className="text-lg font-medium text-amber-700 mb-1">
                        Security Incidents
                      </h3>
                      <p className="text-3xl font-bold text-amber-800">
                        {analytics.totalIncidents}
                      </p>
                      <p className="text-sm text-amber-600 mt-1">During this exam</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h3 className="text-lg font-medium text-red-700 mb-1">Suspensions</h3>
                      <p className="text-3xl font-bold text-red-800">{analytics.suspensions}</p>
                      <p className="text-sm text-red-600 mt-1">For this exam</p>
                    </div>
                  </div>
                )}

                {/* Security Incidents List */}
                {analytics.securityIncidents.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Security Incident History</h3>
                    <div className="overflow-x-auto border rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Type
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Details
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analytics.securityIncidents.map(incident => (
                            <tr key={incident._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {incident.incidentType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {incident.incidentDetails}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(incident.timestamp)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* View All Button */}
                <div className="mt-4 text-right">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/security-incidents/student/${result.student._id}?exam=${result.exam._id}`
                      )
                    }
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View All Security Incidents
                  </button>
                </div>
              </div>

              {/* Answer Details */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Answer Details</h2>

                <div className="space-y-6">
                  {result.answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-lg border ${
                        answer.isCorrect
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <h3 className="text-lg font-medium">Question {index + 1}</h3>
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            answer.isCorrect
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      {/* Question Text */}
                      <div className="mb-6 mt-3">
                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                          <p className="text-gray-800 font-medium">
                            {getQuestionText(answer.question)}
                          </p>
                        </div>
                      </div>

                      {/* All Options */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">All Options:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {answer.question?.options &&
                            (Array.isArray(answer.question.options)
                              ? answer.question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border ${
                                      option.text === answer.selectedOption
                                        ? answer.isCorrect
                                          ? 'border-green-300 bg-green-100'
                                          : 'border-red-300 bg-red-100'
                                        : option.isCorrect
                                          ? 'border-green-300 bg-green-50'
                                          : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">
                                          Option {optIndex + 1}:
                                        </span>
                                        <span>{option.text}</span>
                                      </div>
                                      <div className="flex space-x-2">
                                        {option.text === answer.selectedOption && (
                                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            Selected
                                          </span>
                                        )}
                                        {option.isCorrect && (
                                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                            Correct
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              : Object.entries(answer.question.options).map(
                                  ([key, value], optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`p-3 rounded-lg border ${
                                        key === answer.selectedOption
                                          ? answer.isCorrect
                                            ? 'border-green-300 bg-green-100'
                                            : 'border-red-300 bg-red-100'
                                          : key === answer.question.correctAnswer
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-gray-200 bg-white'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <span className="font-medium mr-2">Option {key}:</span>
                                          <span>
                                            {typeof value === 'object'
                                              ? JSON.stringify(value)
                                              : value}
                                          </span>
                                        </div>
                                        <div className="flex space-x-2">
                                          {key === answer.selectedOption && (
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                              Selected
                                            </span>
                                          )}
                                          {key === answer.question.correctAnswer && (
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                              Correct
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                ))}
                        </div>
                      </div>

                      {/* Marks Display */}
                      <div className="mt-4 text-right border-t pt-3 border-gray-200">
                        <span className="font-medium">
                          Marks:{' '}
                          <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {answer.isCorrect ? answer.question?.marks : 0}
                          </span>{' '}
                          / {answer.question?.marks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4">No result found.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResultDetail;
