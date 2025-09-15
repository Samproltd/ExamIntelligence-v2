import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import CourseCard from '../../../components/CourseCard';

interface Subject {
  _id: string;
  name: string;
  description: string;
}

interface Course {
  _id: string;
  name: string;
  description: string;
  subject: string;
}

const StudentSubjectPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  
  return (
    <ProtectedRoute requiredRole="student">
      <Layout title={subject ? `${subject.name} - Subject` : 'Subject Details'}>
        <div>
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : subject ? (
            <>
              {/* Subject Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => router.push('/student')}
                    className="mr-4 text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                  <h1 className="text-3xl font-bold">{subject.name}</h1>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h2 className="text-xl font-bold mb-2">Subject Description</h2>
                  <p className="text-gray-600">{subject.description}</p>
                </div>
              </div>
              
              {/* Courses Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Available Courses</h2>
                
                {courses.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500">No courses are available for this subject yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <CourseCard
                        key={course._id}
                        id={course._id}
                        name={course.name}
                        description={course.description}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default StudentSubjectPage;
