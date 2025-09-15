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
  createdAt: string;
}

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get("/api/subjects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSubjects(response.data.subjects);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Handle subject creation
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectName.trim() || !subjectDescription.trim()) {
      setFormError("Name and description are required");
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
                <SubjectCard
                  key={subject._id}
                  id={subject._id}
                  name={subject.name}
                  description={subject.description}
                  isAdmin={true}
                />
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default SubjectsPage;
