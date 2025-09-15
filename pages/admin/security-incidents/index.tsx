import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useRouter } from "next/router";
import Card from "../../../components/Card";
import Button from "../../../components/Button";

interface SecurityIncidentSummary {
  totalIncidents: number;
  studentsWithIncidents: number;
  examsWithIncidents: number;
  incidentsByType: {
    _id: string;
    count: number;
  }[];
  studentsWithMostIncidents: {
    _id: string;
    count: number;
    student: {
      _id: string;
      name: string;
      email: string;
    };
  }[];
  recentIncidents: SecurityIncident[];
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

const SecurityIncidentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SecurityIncidentSummary | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get("/api/security-incidents/summary");
        setSummary(response.data.summary);
      } catch (error) {
        console.error("Failed to fetch security incidents summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const navigateToStudentIncidents = (studentId: string) => {
    router.push(`/admin/security-incidents/student/${studentId}`);
  };

  const getIncidentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "window-blur": "Window Blur",
      "tab-change": "Tab Change",
      "full-screen-exit": "Full Screen Exit",
      "paste-attempt": "Paste Attempt",
      "multiple-windows": "Multiple Windows",
      "face-not-visible": "Face Not Visible",
      "multiple-faces": "Multiple Faces",
      "unauthorized-person": "Unauthorized Person",
      "speaking-detected": "Speaking Detected",
    };

    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Security Incidents Overview - Admin">
        <div className="pb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Security Incidents Overview</h1>
            <Button
              onClick={() => router.push("/admin/security-incidents/all")}
            >
              View All Incidents
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <h2 className="text-xl font-semibold mb-2">
                    Total Incidents
                  </h2>
                  <p className="text-4xl font-bold text-primary-color">
                    {summary.totalIncidents || 0}
                  </p>
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold mb-2">
                    Students with Incidents
                  </h2>
                  <p className="text-4xl font-bold text-primary-color">
                    {summary.studentsWithIncidents || 0}
                  </p>
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold mb-2">
                    Exams with Incidents
                  </h2>
                  <p className="text-4xl font-bold text-primary-color">
                    {summary.examsWithIncidents || 0}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Incidents by Type */}
                <Card className="md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">
                    Incidents by Type
                  </h2>
                  <div className="space-y-3">
                    {summary.incidentsByType &&
                    summary.incidentsByType.length > 0 ? (
                      summary.incidentsByType.map((item) => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center"
                        >
                          <span className="font-medium">
                            {getIncidentTypeLabel(item._id)}
                          </span>
                          <div className="flex items-center">
                            <span className="font-bold text-lg">
                              {item.count}
                            </span>
                            <div className="ml-3 h-3 w-24 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-color"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (item.count /
                                      (summary.totalIncidents || 1)) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center">
                        No incident data available
                      </p>
                    )}
                  </div>
                </Card>

                {/* Students with Most Incidents */}
                <Card>
                  <h2 className="text-xl font-semibold mb-4">
                    Top Students with Incidents
                  </h2>
                  <ul className="space-y-3">
                    {summary.studentsWithMostIncidents &&
                    summary.studentsWithMostIncidents.length > 0 ? (
                      summary.studentsWithMostIncidents.map((student) => (
                        <li
                          key={student._id}
                          className="flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {student.student?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {student.student?.email || "No email"}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              {student.count} incidents
                            </span>
                            <button
                              onClick={() =>
                                navigateToStudentIncidents(student.student?._id)
                              }
                              className="ml-2 text-blue-600 hover:underline"
                            >
                              View
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center">
                        No student incident data available
                      </p>
                    )}
                  </ul>
                </Card>

                {/* Recent Incidents Table */}
                <Card className="col-span-1 md:col-span-3">
                  <h2 className="text-xl font-semibold mb-4">
                    Recent Incidents
                  </h2>
                  <div className="overflow-x-auto">
                    {summary.recentIncidents &&
                    summary.recentIncidents.length > 0 ? (
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
                          {summary.recentIncidents.map((incident) => (
                            <tr key={incident._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {incident.student?.name || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {incident.student?.email || "No email"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {incident.student?.batch?.name || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {incident.exam?.name || "Unknown Exam"}
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
                                  {formatDate(
                                    incident.timestamp || incident.createdAt
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      navigateToStudentIncidents(
                                        incident.student?._id
                                      )
                                    }
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    View Student
                                  </button>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        "/admin/security-incidents/all"
                                      )
                                    }
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    View All Incidents
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No recent incidents available
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500">
                No security incident data available.
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default SecurityIncidentsPage;
