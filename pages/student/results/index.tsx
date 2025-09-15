import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../../../components/Layout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Button from "../../../components/Button";
import Card from "../../../components/Card";

interface Result {
  _id: string;
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
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  createdAt: string;
}

const ResultsPage: React.FC = () => {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalExams: 0,
    passed: 0,
    averageScore: 0,
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get("/api/results", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setResults(response.data.results);

        // Calculate statistics
        const totalExams = response.data.results.length;
        const passed = response.data.results.filter(
          (result: Result) => result.passed
        ).length;
        const totalPercentage = response.data.results.reduce(
          (sum: number, result: Result) => sum + result.percentage,
          0
        );
        const averageScore = totalExams > 0 ? totalPercentage / totalExams : 0;

        setStats({
          totalExams,
          passed,
          averageScore,
        });

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleViewResult = (resultId: string) => {
    router.push(`/student/results/${resultId}`);
  };

  return (
    <ProtectedRoute requiredRole="student">
      <Layout title="Your Exam Results">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Your Exam Results</h1>
            <Button variant="outline" onClick={() => router.push("/student")}>
              Back to Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="text-center">
                  <div className="text-4xl font-bold text-primary-color mb-2">
                    {stats.totalExams}
                  </div>
                  <div className="text-gray-600">Total Exams Taken</div>
                </Card>

                <Card className="text-center">
                  <div className="text-4xl font-bold text-primary-color mb-2">
                    {stats.totalExams > 0
                      ? `${Math.round(
                          (stats.passed / stats.totalExams) * 100
                        )}%`
                      : "0%"}
                  </div>
                  <div className="text-gray-600">Pass Rate</div>
                </Card>

                <Card className="text-center">
                  <div className="text-4xl font-bold text-primary-color mb-2">
                    {stats.averageScore.toFixed(1)}%
                  </div>
                  <div className="text-gray-600">Average Score</div>
                </Card>
              </div>

              {/* Results List */}
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    You haven&apos;t taken any exams yet. Once you complete
                    exams, your results will appear here.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => router.push("/student/exams")}
                  >
                    View Available Exams
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject & Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((result) => (
                        <tr key={result._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.exam.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {result.exam.course.subject.name} /{" "}
                              {result.exam.course.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {result.score} / {result.totalQuestions} (
                              {result.percentage.toFixed(1)}%)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {result.passed ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Passed
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              className="text-primary-color hover:underline"
                              onClick={() => handleViewResult(result._id)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ResultsPage;
