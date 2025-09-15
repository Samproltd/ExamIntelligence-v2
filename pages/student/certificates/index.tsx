import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import Layout from "../../../components/Layout";
import ProtectedRoute from "../../../components/ProtectedRoute";

interface Certificate {
  _id: string;
  examName: string;
  certificateId: string;
  issuedDate: string;
  score: number;
  percentage: number;
}

const CertificatesPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/results/certificates", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setCertificates(response.data.data);
        } else {
          setError("Failed to load certificates");
        }
      } catch (err) {
        console.error("Error fetching certificates:", err);
        setError("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [token]);

  return (
    <ProtectedRoute requiredRole="student">
      <Layout
        title="My Certificates"
        description="View and download your certificates"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Certificates</h1>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {!loading && certificates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                You haven&apos;t earned any certificates yet. Complete your
                exams with passing scores to earn certificates.
              </p>
            </div>
          )}

          {certificates.length > 0 && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Exam
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Certificate ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Issue Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Score
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((certificate) => (
                    <tr key={certificate._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {certificate.examName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {certificate.certificateId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(
                            certificate.issuedDate
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {certificate.score} ({certificate.percentage}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/student/certificates/${certificate._id}`}>
                          <span className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                            View
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default CertificatesPage;
