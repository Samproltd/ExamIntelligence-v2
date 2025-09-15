import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';
import ExamCard from '../../../components/ExamCard';

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

interface Exam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passPercentage: number;
  course: string;
  createdAt: string;
}

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState<Course | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit course state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Add exam state
  const [showExamForm, setShowExamForm] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState(30); // Default 30 minutes
  const [examTotalMarks, setExamTotalMarks] = useState(100); // Default 100 marks
  const [examPassPercentage, setExamPassPercentage] = useState(40); // Default 40%
  const [examError, setExamError] = useState<string | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);

  // Delete course state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch course and exams
  useEffect(() => {
    if (!id) return;

    const fetchCourseAndExams = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch course details
        const courseResponse = await axios.get(`/api/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCourse(courseResponse.data.course);
        setEditName(courseResponse.data.course.name);
        setEditDescription(courseResponse.data.course.description);

        // Fetch exams for this course
        const examsResponse = await axios.get(`/api/exams?course=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setExams(examsResponse.data.exams);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch course data');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndExams();
  }, [id]);

  // Handle course update
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim() || !editDescription.trim()) {
      setUpdateError('Name and description are required');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      const token = localStorage.getItem('token');

      const response = await axios.put(
        `/api/courses/${id}`,
        {
          name: editName,
          description: editDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCourse({
        ...response.data.course,
        subject: course!.subject, // Keep the subject info
      });
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle exam creation
  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examName.trim() || !examDescription.trim()) {
      setExamError('All fields are required');
      return;
    }

    try {
      setIsAddingExam(true);
      setExamError(null);

      const token = localStorage.getItem('token');

      const response = await axios.post(
        `/api/exams`,
        {
          name: examName,
          description: examDescription,
          duration: examDuration,
          totalMarks: examTotalMarks,
          passPercentage: examPassPercentage,
          course: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExams([...exams, response.data.exam]);
      setExamName('');
      setExamDescription('');
      setExamDuration(30);
      setExamTotalMarks(100);
      setExamPassPercentage(40);
      setShowExamForm(false);
    } catch (err: any) {
      setExamError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setIsAddingExam(false);
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async () => {
    try {
      setIsDeleting(true);

      const token = localStorage.getItem('token');

      await axios.delete(`/api/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push('/admin/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete course');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title={course ? `${course.name} - Admin` : 'Course Details'}>
        <div>
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : course ? (
            <>
              {/* Course Header with Actions */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => router.push('/admin/courses')}
                      className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                      ← Back
                    </button>
                    <h1 className="text-3xl font-bold">{course.name}</h1>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      {isEditing ? 'Cancel' : 'Edit Course'}
                    </Button>

                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(true)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Course Subject */}
                <div className="text-sm text-gray-500 mb-2">Subject: {course.subject.name}</div>

                {/* Course Description */}
                {!isEditing && <p className="text-gray-600 mb-4">{course.description}</p>}

                {/* Edit Course Form */}
                {isEditing && (
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-bold mb-4">Edit Course</h2>

                    {updateError && <div className="alert alert-error mb-4">{updateError}</div>}

                    <form onSubmit={handleUpdateCourse}>
                      <div className="form-group">
                        <label htmlFor="edit-name">Course Name</label>
                        <input
                          type="text"
                          id="edit-name"
                          className="form-control"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-description">Description</label>
                        <textarea
                          id="edit-description"
                          className="form-control"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" variant="primary" disabled={isUpdating}>
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                      <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
                      <p className="mb-6 text-gray-600">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">{course.name}</span>? This will also delete
                        all exams within this course. This action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleDeleteCourse}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Course'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Exams Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Exams</h2>
                  <Button variant="primary" onClick={() => setShowExamForm(!showExamForm)}>
                    {showExamForm ? 'Cancel' : 'Add Exam'}
                  </Button>
                </div>

                {/* Add Exam Form */}
                {showExamForm && (
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-bold mb-4">Add New Exam</h3>

                    {examError && <div className="alert alert-error mb-4">{examError}</div>}

                    <form onSubmit={handleAddExam}>
                      <div className="form-group">
                        <label htmlFor="exam-name">Exam Name</label>
                        <input
                          type="text"
                          id="exam-name"
                          className="form-control"
                          value={examName}
                          onChange={e => setExamName(e.target.value)}
                          placeholder="Enter exam name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="exam-description">Description</label>
                        <textarea
                          id="exam-description"
                          className="form-control"
                          value={examDescription}
                          onChange={e => setExamDescription(e.target.value)}
                          placeholder="Enter exam description"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label htmlFor="exam-duration">Duration (minutes)</label>
                          <input
                            type="number"
                            id="exam-duration"
                            className="form-control"
                            value={examDuration}
                            onChange={e => setExamDuration(parseInt(e.target.value))}
                            min={1}
                            max={240}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="exam-marks">Total Marks</label>
                          <input
                            type="number"
                            id="exam-marks"
                            className="form-control"
                            value={examTotalMarks}
                            onChange={e => setExamTotalMarks(parseInt(e.target.value))}
                            min={1}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="exam-pass">Pass Percentage (%)</label>
                          <input
                            type="number"
                            id="exam-pass"
                            className="form-control"
                            value={examPassPercentage}
                            onChange={e => setExamPassPercentage(parseInt(e.target.value))}
                            min={0}
                            max={100}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button type="submit" variant="primary" disabled={isAddingExam}>
                          {isAddingExam ? 'Adding...' : 'Add Exam'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Exams List */}
                {exams.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500 mb-4">No exams found for this course.</p>
                    <Button variant="primary" onClick={() => setShowExamForm(true)}>
                      Add Your First Exam
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => (
                      <ExamCard
                        key={exam._id}
                        id={exam._id}
                        name={exam.name}
                        description={exam.description}
                        duration={exam.duration}
                        totalMarks={exam.totalMarks}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default CourseDetailPage;
