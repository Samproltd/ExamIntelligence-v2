import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ExamCard from '../../../components/ExamCard';
import Button from '../../../components/Button';

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
      college: {
        _id: string;
        name: string;
        code: string;
      };
    };
  };
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

interface Course {
  _id: string;
  name: string;
  subject: {
    _id: string;
    name: string;
    college: {
      _id: string;
      name: string;
      code: string;
    };
  };
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState(30); // Default 30 minutes
  const [examTotalMarks, setExamTotalMarks] = useState(100); // Default 100 marks
  const [examPassPercentage, setExamPassPercentage] = useState(40); // Default 40%
  const [examTotalQuestions, setExamTotalQuestions] = useState(10); // Default 10 questions
  const [examQuestionsToDisplay, setExamQuestionsToDisplay] = useState(5); // Default 5 questions
  const [selectedCourse, setSelectedCourse] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch exams and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch exams
        const examsResponse = await axios.get('/api/exams', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch courses for dropdown
        const coursesResponse = await axios.get('/api/courses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setExams(examsResponse.data.exams);
        setCourses(coursesResponse.data.courses);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle exam creation
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examName.trim() || !examDescription.trim() || !selectedCourse) {
      setFormError('All fields are required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/api/exams',
        {
          name: examName,
          description: examDescription,
          duration: examDuration,
          totalMarks: examTotalMarks,
          passPercentage: examPassPercentage,
          totalQuestions: examTotalQuestions,
          questionsToDisplay: examQuestionsToDisplay,
          course: selectedCourse,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add new exam to the list with course info
      const selectedCourseObj = courses.find(c => c._id === selectedCourse);
      const newExam = {
        ...response.data.exam,
        course: {
          _id: selectedCourse,
          name: selectedCourseObj?.name || '',
          subject: {
            _id: selectedCourseObj?.subject._id || '',
            name: selectedCourseObj?.subject.name || '',
          },
        },
      };

      setExams([...exams, newExam]);

      // Reset form
      setExamName('');
      setExamDescription('');
      setExamDuration(30);
      setExamTotalMarks(100);
      setExamPassPercentage(40);
      setExamTotalQuestions(10);
      setExamQuestionsToDisplay(5);
      setSelectedCourse('');
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Manage Exams - Online Exam Portal">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Exams</h1>
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
              disabled={courses.length === 0}
            >
              {showForm ? 'Cancel' : 'Add Exam'}
            </Button>
          </div>

          {/* Add Exam Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">Add New Exam</h2>

              {formError && <div className="alert alert-error mb-4">{formError}</div>}

              <form onSubmit={handleCreateExam}>
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

                <div className="form-group">
                  <label htmlFor="course-select">Course</label>
                  <select
                    id="course-select"
                    className="form-control"
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.name} - {course.subject.name} ({course.college?.name})
                      </option>
                    ))}
                  </select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="form-group">
                    <label htmlFor="exam-total-questions">Total Questions</label>
                    <input
                      type="number"
                      id="exam-total-questions"
                      className="form-control"
                      value={examTotalQuestions}
                      onChange={e => setExamTotalQuestions(parseInt(e.target.value))}
                      min={1}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="exam-questions-to-display">Questions to Display</label>
                    <input
                      type="number"
                      id="exam-questions-to-display"
                      className="form-control"
                      value={examQuestionsToDisplay}
                      onChange={e => setExamQuestionsToDisplay(parseInt(e.target.value))}
                      min={1}
                      max={examTotalQuestions}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="submit" variant="primary" disabled={formSubmitting}>
                    {formSubmitting ? 'Creating...' : 'Create Exam'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* No Courses Warning */}
          {courses.length === 0 && !loading && (
            <div className="alert alert-error mb-6">
              You need to create at least one course before you can add exams.
            </div>
          )}

          {/* Exams List */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : exams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">No exams found.</p>
              {courses.length > 0 && (
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  Add Your First Exam
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(exam => (
                <div key={exam._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{exam.name}</h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {exam.college?.name}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{exam.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Duration:</span>
                      <span className="ml-1 text-gray-600">{exam.duration} min</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Total Marks:</span>
                      <span className="ml-1 text-gray-600">{exam.totalMarks}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Pass %:</span>
                      <span className="ml-1 text-gray-600">{exam.passPercentage}%</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Questions:</span>
                      <span className="ml-1 text-gray-600">{exam.questionsToDisplay}/{exam.totalQuestions}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1 mb-4">
                    <p><strong>Course:</strong> {exam.course?.name}</p>
                    <p><strong>Subject:</strong> {exam.course?.subject?.name}</p>
                    <p><strong>College:</strong> {exam.college?.name} ({exam.college?.code})</p>
                    <p><strong>Created by:</strong> {exam.createdBy?.name}</p>
                    <p><strong>Created:</strong> {new Date(exam.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      Questions
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

export default ExamsPage;
