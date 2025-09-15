import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Snackbar from '../../../components/Snackbar';
import useToast from '../../../hooks/useToast';
import Script from 'next/script';

interface Exam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  totalQuestions: number;
  questionsToDisplay: number;
  course: {
    _id: string;
    name: string;
    subject: {
      _id: string;
      name: string;
    };
  };
  questionCount: number;
  hasTaken: boolean;
  attemptsMade: number;
  canRetake: boolean;
  result?: {
    _id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
    answers?: {
      isCorrect: boolean;
    }[];
  };
  passingMarks: number;
  instructions: string;
  questions?: {
    _id: string;
    text: string;
    options: string[];
    correctOption: number;
  }[];
  maxAttempts: number;
  attempts?: {
    current: number;
    max: number;
    remaining: number;
  };
}

interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  examName: string;
  key: string;
}

const ExamDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [examSuspended, setExamSuspended] = useState(false);
  const [suspensionData, setSuspensionData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentType, setPaymentType] = useState<'suspended' | 'max_attempts' | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [noAttemptsLeft, setNoAttemptsLeft] = useState(false);

  // Toast notifications
  const { toast, showError, showInfo, showSuccess, hideToast } = useToast();

  useEffect(() => {
    if (!id) return;

    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch exam details and suspension status in parallel
        const [examResponse, suspensionResponse] = await Promise.all([
          axios.get(`/api/student/exams/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`/api/exams/suspension/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setExam(examResponse.data.exam);

        // Check if there are no attempts left
        if (
          examResponse.data.exam.attempts?.remaining <= 0 ||
          examResponse.data.exam.maxAttempts - examResponse.data.exam.attemptsMade <= 0
        ) {
          setNoAttemptsLeft(true);
        }

        if (suspensionResponse.data.suspended) {
          setExamSuspended(true);
          setSuspensionData({
            reason: suspensionResponse.data.suspension.reason,
            incidentCount: suspensionResponse.data.suspension.incidents.length,
            timestamp: suspensionResponse.data.suspension.suspensionTime,
          });
          showError(`Exam suspended: ${suspensionResponse.data.suspension.reason}`);
        } else if (suspensionResponse.data.hadPreviousSuspensions) {
          // The suspension was removed by an admin
          if (suspensionResponse.data.suspensionCount > 1) {
            showInfo('Previous suspensions have been removed. You may start the exam now.');
          } else {
            showInfo('Suspension has been removed. You may start the exam now.');
          }
        }

        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exam details';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStartExam = () => {
    // Show the security notice modal first
    setShowSecurityNotice(true);
  };

  const handleConfirmStartExam = async () => {
    try {
      setStartingExam(true);

      // Before starting, clear any previous exam data from localStorage
      localStorage.removeItem('examAnswers');
      localStorage.removeItem('examStartTime');
      localStorage.removeItem('currentExamId');

      showInfo('Starting exam... Preparing your environment');

      // Navigate to the exam page and clear history
      router.replace(`/student/exams/take/${id}`);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to start exam';
      setError(errorMessage);
      showError(errorMessage);
      setStartingExam(false);
      setShowSecurityNotice(false);
    }
  };

  const handleViewResult = () => {
    if (exam?.result?._id) {
      // Navigate to results page and clear history
      router.replace(`/student/results/${exam.result._id}`);
    } else {
      showError('Result information not found');
    }
  };

  const initiatePayment = async (type: 'suspended' | 'max_attempts') => {
    try {
      setPaymentLoading(true);
      setPaymentType(type);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/payments/create-order',
        {
          examId: id,
          paymentType: type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPaymentData(response.data.data);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Payment order creation failed:', error);
      showError('Failed to create payment order. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (
    razorpay_payment_id: string,
    razorpay_order_id: string,
    razorpay_signature: string
  ) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/payments/verify',
        {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showSuccess('Payment successful! Your account has been updated.');

        // Update UI based on payment type
        if (paymentType === 'suspended') {
          setExamSuspended(false);
          setSuspensionData(null);
        } else if (paymentType === 'max_attempts') {
          setNoAttemptsLeft(false);
        }

        // Refresh exam details
        router.reload();
      } else {
        showError('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      showError('Payment verification failed. Please contact support.');
    } finally {
      setPaymentData(null);
      setShowPaymentModal(false);
      setPaymentType(null);
    }
  };

  const openRazorpay = () => {
    if (!paymentData) return;

    const options = {
      key: paymentData.key,
      amount: paymentData.amount * 100,
      currency: paymentData.currency,
      name: 'Exam Intelligence',
      description: `Payment for ${paymentData.examName} (${paymentType === 'suspended' ? 'Suspension Removal' : 'Attempt Reset'})`,
      order_id: paymentData.orderId,
      handler: function (response: any) {
        handlePaymentSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      },
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
      },
      theme: {
        color: '#3399cc',
      },
    };

    const razorpayWindow = new (window as any).Razorpay(options);
    razorpayWindow.open();
  };

  useEffect(() => {
    if (showPaymentModal && paymentData) {
      openRazorpay();
    }
  }, [showPaymentModal, paymentData]);

  return (
    <ProtectedRoute requiredRole="student">
      {/* Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Layout title={exam ? `${exam.name} - Exam Details` : 'Exam Details'}>
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <Card>
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
                <p className="mb-6">{error}</p>
                <Button variant="primary" onClick={() => router.push('/student/exams')}>
                  Back to Exams
                </Button>
              </div>
            </Card>
          ) : exam ? (
            <>
              {/* Suspension Warning */}
              {examSuspended && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Exam Suspended</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Your access to this exam has been suspended due to security violations.
                        </p>
                        <p className="mt-2">
                          <strong>Reason:</strong> {suspensionData.reason}
                        </p>
                        <p>
                          <strong>Suspension Time:</strong>{' '}
                          {new Date(suspensionData.timestamp).toLocaleString()}
                        </p>
                        <p>
                          <strong>Security Incidents:</strong> {suspensionData.incidentCount}
                        </p>
                        <p className="mt-2 mb-3">
                          You need to pay a fine of ₹300 to remove the suspension and continue with
                          the exam.
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => initiatePayment('suspended')}
                          disabled={paymentLoading}
                          className="w-full"
                        >
                          {paymentLoading ? 'Processing...' : 'Pay ₹300 Fine to Remove Suspension'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Attempts Left Warning */}
              {noAttemptsLeft && !examSuspended && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Maximum Attempts Reached
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>You have used all your allowed attempts for this exam.</p>
                        <p className="mt-2 mb-3">
                          You need to pay a fee of ₹500 to reset your attempts and continue with the
                          exam.
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => initiatePayment('max_attempts')}
                          disabled={paymentLoading}
                          className="w-full"
                        >
                          {paymentLoading ? 'Processing...' : 'Pay ₹500 to Reset Exam Attempts'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Exam Header */}
              <div className="mb-8">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => router.back()}
                    className="mr-4 text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                  <h1 className="text-3xl font-bold">{exam.name}</h1>
                </div>

                {/* Course and Subject */}
                <div className="text-sm text-gray-500 mb-4">
                  Course: {exam.course.name} | Subject: {exam.course.subject.name}
                </div>
              </div>

              {/* Exam Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Exam Details */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Exam Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Course:</span> {exam.course.name}
                      </p>
                      <p>
                        <span className="font-medium">Subject:</span> {exam.course.subject.name}
                      </p>
                      <p>
                        <span className="font-medium">Duration:</span> {exam.duration} minutes
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Pass Percentage:</span> {exam.passPercentage}%
                      </p>
                      <p>
                        <span className="font-medium">Total Questions:</span>{' '}
                        <span className="text-primary-color font-semibold">
                          {exam.questionsToDisplay}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Total Marks:</span> {exam.totalMarks}
                      </p>
                    </div>
                  </div>

                  {/* Attempt Information */}
                  <div className="mt-6">
                    <h3 className="font-medium text-black-500 mb-2">Attempt Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Current Attempt</p>
                        <p className="font-bold">
                          {exam.attempts?.current || exam.attemptsMade || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Max Attempts</p>
                        <p className="font-bold">{exam.attempts?.max || exam.maxAttempts}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Remaining Attempts</p>
                        <p
                          className={`font-bold ${
                            (exam.attempts?.remaining || exam.maxAttempts - exam.attemptsMade) <= 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {exam.attempts?.remaining ||
                            Math.max(0, exam.maxAttempts - exam.attemptsMade)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p
                          className={`font-bold ${
                            exam.attempts?.remaining > 0 || exam.maxAttempts - exam.attemptsMade > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {exam.attempts?.remaining > 0 || exam.maxAttempts - exam.attemptsMade > 0
                            ? 'Can Retake'
                            : 'No Attempts Left'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Start/View Result Button */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    {/* Clear security requirements notice */}
                    <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4">
                      <h3 className="text-lg font-semibold mb-2">Before Starting the Exam</h3>
                      <p className="mb-2">Please ensure you have:</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>A working webcam/camera (required for proctoring)</li>
                        <li>A working microphone</li>
                        <li>A stable internet connection</li>
                        <li>A quiet environment without distractions</li>
                        <li>A desktop, laptop, or tablet (not a mobile phone)</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Note:</strong> You will not be able to proceed without enabling
                        camera and microphone access.
                      </p>
                    </div>

                    {exam.hasTaken ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Exam Already Taken</h3>
                        <p className="mb-4">You have already taken this exam.</p>
                        {!exam.result?.passed &&
                          !examSuspended &&
                          !noAttemptsLeft &&
                          (exam.attempts?.remaining > 0 ||
                            exam.maxAttempts - exam.attemptsMade > 0) && (
                            <div className="mb-4">
                              <p className="text-green-600 font-medium mb-2">
                                You can retake this exam. You have{' '}
                                {exam.attempts?.remaining || exam.maxAttempts - exam.attemptsMade}{' '}
                                attempt(s) remaining.
                              </p>
                              <Button
                                variant="primary"
                                fullWidth
                                onClick={handleStartExam}
                                disabled={examSuspended || startingExam || noAttemptsLeft}
                              >
                                {examSuspended
                                  ? 'Exam Suspended'
                                  : noAttemptsLeft
                                    ? 'No Attempts Left'
                                    : startingExam
                                      ? 'Starting...'
                                      : 'Start Re-exam'}
                              </Button>
                            </div>
                          )}
                        <Button variant="primary" fullWidth onClick={handleViewResult}>
                          View Detailed Results
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Ready to Begin?</h3>
                        <p className="text-gray-600 mb-4">
                          You haven&apos;t started this exam yet. Click the button below to begin.
                        </p>

                        <Button
                          variant="primary"
                          fullWidth
                          onClick={handleStartExam}
                          disabled={examSuspended || startingExam || noAttemptsLeft}
                        >
                          {examSuspended
                            ? 'Exam Suspended'
                            : noAttemptsLeft
                              ? 'No Attempts Left'
                              : startingExam
                                ? 'Starting...'
                                : 'Start Exam'}
                        </Button>

                        {examSuspended && (
                          <p className="text-center text-sm text-red-600 mt-2">
                            This exam has been suspended due to security violations.
                          </p>
                        )}
                        {noAttemptsLeft && !examSuspended && (
                          <p className="text-center text-sm text-yellow-600 mt-2">
                            You have used all your allowed attempts for this exam.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Instructions</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>The exam consists of multiple-choice questions only.</li>
                    <li>The timer will start as soon as you begin the exam.</li>
                    <li>You must complete the exam within {exam.duration} minutes.</li>
                    <li>You can navigate between questions using the navigation buttons.</li>
                    <li>Your answers are automatically saved as you progress.</li>
                    <li>The exam will be automatically submitted when the time expires.</li>
                    <li>You need to score at least {exam.passPercentage}% to pass the exam.</li>
                    <li>You will see your result immediately after submitting.</li>
                    <li className="font-semibold text-red-600">
                      This exam requires full screen mode and will monitor for tab switching.
                    </li>
                    <li className="font-semibold text-red-600">
                      Copying exam content is not allowed and is monitored.
                    </li>
                    <li className="font-semibold text-red-600">
                      If you get suspended due to multiple violations, you will need to pay a fine
                      of ₹300.
                    </li>
                    <li className="font-semibold text-red-600">
                      If you fail all maximum attempts, you will need to pay a fine of ₹500 for
                      re-exam.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Security Notice Modal */}
              {showSecurityNotice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-4">Secure Exam Environment</h3>

                    <div className="mb-4">
                      <div className="rounded-lg bg-yellow-50 p-4 mb-4 border border-yellow-100">
                        <p className="text-yellow-800 font-medium mb-2">
                          Important Security Information
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                          <li>The exam will run in full-screen mode</li>
                          <li>Leaving the exam tab will trigger security warnings</li>
                          <li>Text selection and copying are disabled</li>
                          <li>Attempts to use developer tools will be detected</li>
                          <li>Multiple security violations may result in automatic submission</li>
                        </ul>
                      </div>

                      <p className="text-gray-600 mb-4">
                        By proceeding, you agree to take this exam in the secure environment
                        described above.
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setShowSecurityNotice(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleConfirmStartExam}
                        disabled={startingExam || examSuspended}
                      >
                        {startingExam ? 'Starting...' : 'Proceed to Exam'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Add Snackbar at the end */}
        <Snackbar open={toast.open} message={toast.message} type={toast.type} onClose={hideToast} />
      </Layout>
    </ProtectedRoute>
  );
};

export default ExamDetailsPage;
