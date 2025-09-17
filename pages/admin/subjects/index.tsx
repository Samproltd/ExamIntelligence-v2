import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import SubjectCard from "../../../components/SubjectCard";
import Button from "../../../components/Button";

interface Subject {
  _id: string;
  name: string;
  description: string;
  college: {
    _id: string;
    name: string;
    code: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface College {
  _id: string;
  name: string;
  code: string;
}

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch subjects and colleges
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch subjects and colleges simultaneously
        const [subjectsResponse, collegesResponse] = await Promise.all([
          axios.get("/api/subjects", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/colleges", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setSubjects(subjectsResponse.data.subjects);
        setColleges(collegesResponse.data.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle subject creation
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectName.trim() || !subjectDescription.trim() || !selectedCollege) {
      setFormError("Name, description, and college are required");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/api/subjects",
        {
          name: subjectName,
          description: subjectDescription,
          college: selectedCollege,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add new subject to the list
      setSubjects([...subjects, response.data.subject]);

      // Reset form
      setSubjectName("");
      setSubjectDescription("");
      setSelectedCollege("");
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create subject");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Manage Subjects - Online Exam Portal">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Subjects</h1>
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add Subject"}
            </Button>
          </div>

          {/* Add Subject Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">Add New Subject</h2>

              {formError && (
                <div className="alert alert-error mb-4">{formError}</div>
              )}

              <form onSubmit={handleCreateSubject}>
                <div className="form-group">
                  <label htmlFor="college-select">College</label>
                  <select
                    id="college-select"
                    className="form-control"
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    required
                  >
                    <option value="">Select a college</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>
                        {college.name} ({college.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject-name">Subject Name</label>
                  <input
                    type="text"
                    id="subject-name"
                    className="form-control"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Enter subject name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject-description">Description</label>
                  <textarea
                    id="subject-description"
                    className="form-control"
                    value={subjectDescription}
                    onChange={(e) => setSubjectDescription(e.target.value)}
                    placeholder="Enter subject description"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? "Creating..." : "Create Subject"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects List */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : subjects.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">No subjects found.</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Add Your First Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <div key={subject._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{subject.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {subject.college?.name}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{subject.description}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p><strong>College:</strong> {subject.college?.name} ({subject.college?.code})</p>
                    <p><strong>Created by:</strong> {subject.createdBy?.name}</p>
                    <p><strong>Created:</strong> {new Date(subject.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default SubjectsPage;
