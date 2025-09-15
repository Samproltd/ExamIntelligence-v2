import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import CourseCard from "../../../components/CourseCard";
import Button from "../../../components/Button";
import Snackbar from "../../../components/Snackbar";
import useToast from "../../../hooks/useToast";

interface Course {
  _id: string;
  name: string;
  description: string;
  subject: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Subject {
  _id: string;
  name: string;
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast notifications
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Fetch courses and subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch courses
        const coursesResponse = await axios.get("/api/courses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch subjects for dropdown
        const subjectsResponse = await axios.get("/api/subjects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCourses(coursesResponse.data.courses);
        setSubjects(subjectsResponse.data.subjects);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
        showError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle course creation
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseName.trim() || !courseDescription.trim() || !selectedSubject) {
      setFormError("All fields are required");
      showError("All fields are required");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/api/courses",
        {
          name: courseName,
          description: courseDescription,
          subject: selectedSubject,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add new course to the list with subject info
      const newCourse = {
        ...response.data.course,
        subject: {
          _id: selectedSubject,
          name: subjects.find((s) => s._id === selectedSubject)?.name || "",
        },
      };

      setCourses([...courses, newCourse]);

      // Reset form
      setCourseName("");
      setCourseDescription("");
      setSelectedSubject("");
      setShowForm(false);

      // Show success message
      showSuccess("Course created successfully");
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create course");
      showError(err.response?.data?.message || "Failed to create course");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Manage Courses - Online Exam Portal">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Courses</h1>
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
              disabled={subjects.length === 0}
            >
              {showForm ? "Cancel" : "Add Course"}
            </Button>
          </div>

          {/* Add Course Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">Add New Course</h2>

              {formError && (
                <div className="alert alert-error mb-4">{formError}</div>
              )}

              <form onSubmit={handleCreateCourse}>
                <div className="form-group">
                  <label htmlFor="course-name">Course Name</label>
                  <input
                    type="text"
                    id="course-name"
                    className="form-control"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Enter course name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="course-description">Description</label>
                  <textarea
                    id="course-description"
                    className="form-control"
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject-select">Subject</label>
                  <select
                    id="subject-select"
                    className="form-control"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* No Subjects Warning */}
          {subjects.length === 0 && !loading && (
            <div className="alert alert-error mb-6">
              You need to create at least one subject before you can add
              courses.
            </div>
          )}

          {/* Courses List */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : courses.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">No courses found.</p>
              {subjects.length > 0 && (
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  Add Your First Course
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  id={course._id}
                  name={course.name}
                  description={course.description}
                  subjectName={course.subject.name}
                  isAdmin={true}
                />
              ))}
            </div>
          )}

          {/* Add Snackbar component for toast notifications */}
          <Snackbar
            open={toast.open}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default CoursesPage;
