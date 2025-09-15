import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import {
  generateAndDownloadCertificate,
  generateClientCertificateId,
} from '../../../utils/clientCertificate';

interface Result {
  _id: string;
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
      subject: {
        _id: string;
        name: string;
      };
    };
  };
  answers: Array<{
    question: {
      _id: string;
      text: string;
      options: Array<{
        text: string;
        isCorrect: boolean;
      }>;
    };
    selectedOption: string;
    isCorrect: boolean;
  }>;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  startTime: string;
  endTime: string;
  createdAt: string;
  certificate?: {
    certificateId: string;
    issuedDate: string;
    emailSent: boolean;
  };
  student?: {
    name: string;
    email: string;
  };
}

const ResultPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [generatingLocalCertificate, setGeneratingLocalCertificate] = useState(false);
  const [certificateFormat, setCertificateFormat] = useState<'pdf' | 'image'>('pdf');

  useEffect(() => {
    if (!id) return;

    const fetchResult = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get(`/api/results/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setResult(response.data.result);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching result:', err);
        if (err.response?.status === 404) {
          setError(
            'The result you&apos;re looking for could not be found. It may have been deleted or you may not have permission to view it.'
          );
        } else {
          setError('Failed to load the result. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  // Calculate the time taken (in minutes)
  const calculateTimeTaken = () => {
    if (!result) return '';

    const startTime = new Date(result.startTime).getTime();
    const endTime = new Date(result.endTime).getTime();
    const diffInMs = endTime - startTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInSeconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

    return `${diffInMinutes} minutes ${diffInSeconds} seconds`;
  };

  // Automatically generate certificate if passed and no certificate
  useEffect(() => {
    console.log('useffect run ');
    if (result && result.passed && !result.certificate) {
      handleGenerateCertificate();
      console.log('certificate function generating ended');
    }
  }, [result]);

  // Handle certificate generation on button press if not generated
  const handleGenerateCertificate = async () => {
    if (!result || !result.passed) return;

    try {
      setGeneratingCertificate(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `/api/results/${result._id}/certificate`,
        { sendEmail: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update the result with certificate data
        setResult({
          ...result,
          certificate: {
            certificateId: response.data.data.certificateId,
            issuedDate: response.data.data.issuedDate,
            emailSent: response.data.data.emailSent,
          },
        });

        // Navigate to certificate view
        // router.push(`/student/certificates/${result._id}`);
      } else {
        setError('Failed to generate certificate');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Generate certificate in browser and download as PDF or image
  const handleGenerateClientCertificate = async () => {
    if (!result || !result.passed) return;

    try {
      setGeneratingLocalCertificate(true);

      // Use the certificate ID from the server if available, otherwise generate one
      const certificateId = result.certificate?.certificateId || generateClientCertificateId();

      // Get student name
      const studentName = result.student?.name || 'Student';

      // Generate the certificate using our utility
      await generateAndDownloadCertificate(
        {
          studentName,
          examName: result.exam.name,
          certificateId,
          score: result.score,
          percentage: result.percentage,
        },
        certificateFormat
      );
    } catch (err) {
      console.error('Error in certificate generation:', err);
      setError('Failed to generate certificate');
    } finally {
      setGeneratingLocalCertificate(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title={result ? `Result: ${result.exam.name}` : 'Exam Result'}>
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <Card>
              <div className="text-center py-8">
                <div className="text-red-500 text-5xl mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">Result Not Available</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => router.push('/student')}>
                    Return to Dashboard
                  </Button>
                  <Button variant="primary" onClick={() => router.push('/student/exams')}>
                    View Available Exams
                  </Button>
                </div>
              </div>
            </Card>
          ) : result ? (
            <>
              {/* Result Header */}
              <div className="mb-8">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => router.push('/student')}
                    className="mr-4 text-gray-600 hover:text-gray-800"
                  >
                    ← Back to Dashboard
                  </button>
                  <h1 className="text-3xl font-bold">Exam Result</h1>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Exam: {result.exam.name} | Course: {result.exam.course.name} | Subject:{' '}
                  {result.exam.course.subject.name}
                </div>
              </div>

              {/* Result Summary */}
              <div
                className={`bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 ${
                  result.passed ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <h2 className="text-2xl font-bold mb-4">Result Summary</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-500">Final Score</h3>
                    <p className="text-2xl font-bold">
                      {result.answers.filter(answer => answer.isCorrect).length} /{' '}
                      {result.totalQuestions}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500">Percentage</h3>
                    <p className="text-2xl font-bold">{result.percentage.toFixed(1)}%</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500">Status</h3>
                    <p
                      className={`text-lg font-bold ${
                        result.passed ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </p>
                    <p className="text-sm text-gray-500">
                      (Pass mark: {result.exam.passPercentage}%)
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500">Date Taken</h3>
                    <p className="text-lg">{new Date(result.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500">Time Taken</h3>
                    <p className="text-lg">{calculateTimeTaken()}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500">Time Allowed</h3>
                    <p className="text-lg">{result.exam.duration} minutes</p>
                  </div>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4">Performance Breakdown</h2>

                <div className="flex mb-6">
                  <div className="w-1/2 pr-2">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Correct Answers</h3>
                      <p className="text-3xl font-bold text-green-600">
                        {result.answers.filter(answer => answer.isCorrect).length}
                      </p>
                    </div>
                  </div>
                  <div className="w-1/2 pl-2">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Wrong Answers</h3>
                      <p className="text-3xl font-bold text-red-600">
                        {result.totalQuestions -
                          result.answers.filter(answer => answer.isCorrect).length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual representation */}
                <div className="mb-4">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-color"
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>0%</span>
                    <span>{result.exam.passPercentage}% (Pass mark)</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Question Review */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-6">Question Review</h2>

                {result.answers && Array.isArray(result.answers) && result.answers.length > 0 ? (
                  <div className="space-y-6">
                    {result.answers
                      .filter(answer => !answer.isCorrect)
                      .map((answer, index) => {
                        // Skip if answer or answer.question is undefined
                        if (!answer || !answer.question || !answer.question.options) {
                          return null;
                        }

                        return (
                          <div
                            key={`answer-${index}`}
                            className={`p-4 rounded-md border ${
                              answer.isCorrect
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold">Question {index + 1}</h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  answer.isCorrect
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-red-200 text-red-800'
                                }`}
                              >
                                {answer.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>

                            <p className="mb-4">{answer.question.text}</p>

                            <div className="space-y-2">
                              {answer.question.options.map((option, optIndex) => (
                                <div
                                  key={`option-${optIndex}`}
                                  className={`p-3 rounded-md ${
                                    option.text === answer.selectedOption
                                      ? 'bg-red-200 border border-red-300' // Selected incorrect answer
                                      : 'bg-gray-50 border border-gray-200' // All other options, including correct
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span className="mr-2">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    <span>{option.text}</span>

                                    {option.text === answer.selectedOption && (
                                      <span className="ml-auto text-sm">Your answer</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md text-center">
                    <p className="text-gray-500">No answer details available.</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 mb-8">
                <Button variant="outline" onClick={() => router.push('/student')}>
                  Back to Dashboard
                </Button>

                <Button
                  variant="primary"
                  onClick={() => router.push(`/student/exams/${result.exam._id}`)}
                >
                  View Exam Details
                </Button>

                {result.passed && (
                  <div className="relative inline-block">
                    <Button
                      variant="secondary"
                      onClick={handleGenerateClientCertificate}
                      disabled={generatingLocalCertificate}
                    >
                      {generatingLocalCertificate ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        `Download Certificate (${certificateFormat.toUpperCase()})`
                      )}
                    </Button>
                    <div className="absolute right-0 mt-1 w-28 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <button
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          certificateFormat === 'pdf' ? 'bg-blue-50 font-medium' : ''
                        }`}
                        onClick={() => setCertificateFormat('pdf')}
                      >
                        PDF Format
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          certificateFormat === 'image' ? 'bg-blue-50 font-medium' : ''
                        }`}
                        onClick={() => setCertificateFormat('image')}
                      >
                        JPG Format
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Certificate note for passed exams */}
              {result.passed && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Congratulations on passing your exam! You can download your certificate by
                        clicking the "Download Certificate" button above. Choose your preferred
                        format (PDF or JPG). The certificate will be generated using the official
                        template with your name and exam details.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ResultPage;
