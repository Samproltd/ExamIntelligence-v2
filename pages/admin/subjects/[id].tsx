import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Button from '../../../components/Button';
import CourseCard from '../../../components/CourseCard';

interface Subject {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Course {
  _id: string;
  name: string;
  description: string;
  subject: string;
  createdAt: string;
}

const SubjectDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit subject state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add course state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseError, setCourseError] = useState<string | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  
  // Delete subject state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch subject and courses
  useEffect(() => {
    if (!id) return;
    
    const fetchSubjectAndCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch subject details
        const subjectResponse = await axios.get(`/api/subjects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setSubject(subjectResponse.data.subject);
        setEditName(subjectResponse.data.subject.name);
        setEditDescription(subjectResponse.data.subject.description);
        
        // Fetch courses for this subject
        const coursesResponse = await axios.get(`/api/courses?subject=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setCourses(coursesResponse.data.courses);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch subject data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjectAndCourses();
  }, [id]);
  
  // Handle subject update
  const handleUpdateSubject = async (e: React.FormEvent) => {
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
        `/api/subjects/${id}`,
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
      
      setSubject(response.data.subject);
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to update subject');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle course creation
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseName.trim() || !courseDescription.trim()) {
      setCourseError('Name and description are required');
      return;
    }
    
    try {
      setIsAddingCourse(true);
      setCourseError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `/api/courses`,
        {
          name: courseName,
          description: courseDescription,
          subject: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setCourses([...courses, response.data.course]);
      setCourseName('');
      setCourseDescription('');
      setShowCourseForm(false);
    } catch (err: any) {
      setCourseError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setIsAddingCourse(false);
    }
  };
  
  // Handle subject deletion
  const handleDeleteSubject = async () => {
    try {
      setIsDeleting(true);
      
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/subjects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      router.push('/admin/subjects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete subject');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title={subject ? `${subject.name} - Admin` : 'Subject Details'}>
        <div>
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : subject ? (
            <>
              {/* Subject Header with Actions */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => router.push('/admin/subjects')}
                      className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                      ← Back
                    </button>
                    <h1 className="text-3xl font-bold">{subject.name}</h1>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit Subject'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                
                {/* Subject Description */}
                {!isEditing && (
                  <p className="text-gray-600 mb-4">{subject.description}</p>
                )}
                
                {/* Edit Subject Form */}
                {isEditing && (
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
                    
                    {updateError && (
                      <div className="alert alert-error mb-4">
                        {updateError}
                      </div>
                    )}
                    
                    <form onSubmit={handleUpdateSubject}>
                      <div className="form-group">
                        <label htmlFor="edit-name">Subject Name</label>
                        <input
                          type="text"
                          id="edit-name"
                          className="form-control"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="edit-description">Description</label>
                        <textarea
                          id="edit-description"
                          className="form-control"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isUpdating}
                        >
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
                        Are you sure you want to delete <span className="font-semibold">{subject.name}</span>? 
                        This will also delete all courses and exams within this subject. 
                        This action cannot be undone.
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
                          onClick={handleDeleteSubject}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Subject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Courses Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Courses</h2>
                  <Button
                    variant="primary"
                    onClick={() => setShowCourseForm(!showCourseForm)}
                  >
                    {showCourseForm ? 'Cancel' : 'Add Course'}
                  </Button>
                </div>
                
                {/* Add Course Form */}
                {showCourseForm && (
                  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-bold mb-4">Add New Course</h3>
                    
                    {courseError && (
                      <div className="alert alert-error mb-4">
                        {courseError}
                      </div>
                    )}
                    
                    <form onSubmit={handleAddCourse}>
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
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isAddingCourse}
                        >
                          {isAddingCourse ? 'Adding...' : 'Add Course'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Courses List */}
                {courses.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500 mb-4">No courses found for this subject.</p>
                    <Button
                      variant="primary"
                      onClick={() => setShowCourseForm(true)}
                    >
                      Add Your First Course
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <CourseCard
                        key={course._id}
                        id={course._id}
                        name={course.name}
                        description={course.description}
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

export default SubjectDetailPage;
