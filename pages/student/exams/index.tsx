import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ExamCard from '../../../components/ExamCard';
import Button from '../../../components/Button';

interface Exam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  course: {
    _id: string;
    name: string;
    subject: {
      _id: string;
      name: string;
    };
  };
  hasTaken: boolean;
  maxAttempts: number;
  currentAttempt?: number;
  canRetake?: boolean;
  result?: {
    _id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
  };
}

const ExamsPage: React.FC = () => {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch only exams allocated to the student's batch
        const examsResponse = await axios.get('/api/student/exams', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Process exams to add attempt information
        const processedExams = examsResponse.data.exams.map((exam: Exam) => {
          if (exam.hasTaken && exam.result) {
            const canRetake = !exam.result.passed && exam.result.attemptNumber < exam.maxAttempts;
            return {
              ...exam,
              currentAttempt: exam.result.attemptNumber,
              canRetake,
            };
          }
          return {
            ...exam,
            currentAttempt: 0,
            canRetake: true,
          };
        });

        setExams(processedExams);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Separate exams into not taken and taken
  const notTakenExams = exams.filter(exam => !exam.hasTaken);
  const takenExams = exams.filter(exam => exam.hasTaken);

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title="My Exams">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Exams</h1>
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
          ) : exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-500 mb-2">No exams found for your batch.</p>
              <p className="text-gray-400 text-sm">Check back later for updates.</p>
            </div>
          ) : (
            <>
              {/* Exams not yet taken */}
              {notTakenExams.length > 0 && (
                <div className="mb-8">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">New Exams</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notTakenExams.map(exam => (
                      <ExamCard
                        key={exam._id}
                        id={exam._id}
                        name={exam.name}
                        description={exam.description}
                        duration={exam.duration}
                        totalMarks={exam.totalMarks}
                        courseName={`${exam.course.subject.name} / ${exam.course.name}`}
                        hasTaken={exam.hasTaken}
                        status={
                          exam.hasTaken
                            ? exam.result?.passed
                              ? 'Passed'
                              : exam.canRetake
                                ? `Attempt ${exam.currentAttempt} of ${exam.maxAttempts}`
                                : 'All attempts used'
                            : 'Not Taken'
                        }
                        canTake={!exam.hasTaken || (exam.canRetake && !exam.result?.passed)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Exams already taken */}
              {takenExams.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold">Completed Exams</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {takenExams.map(exam => (
                      <ExamCard
                        key={exam._id}
                        id={exam._id}
                        name={exam.name}
                        description={exam.description}
                        duration={exam.duration}
                        totalMarks={exam.totalMarks}
                        courseName={`${exam.course.subject.name} / ${exam.course.name}`}
                        hasTaken={exam.hasTaken}
                        status={
                          exam.hasTaken
                            ? exam.result?.passed
                              ? 'Passed'
                              : exam.canRetake
                                ? `Attempt ${exam.currentAttempt} of ${exam.maxAttempts}`
                                : 'All attempts used'
                            : 'Not Taken'
                        }
                        canTake={!exam.hasTaken || (exam.canRetake && !exam.result?.passed)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ExamsPage;
