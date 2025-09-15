import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ExamCard from '../../../components/ExamCard';

interface Course {
  _id: string;
  name: string;
  description: string;
  subject: {
    _id: string;
    name: string;
  };
}

interface Exam {
  _id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  hasTaken: boolean;
}

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        
        // Fetch exams for this course
        const examsResponse = await axios.get(`/api/student/courses/${id}/exams`, {
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
  
  return (
    <ProtectedRoute requiredRole="student">
      <Layout title={course ? `${course.name} - Course Details` : 'Course Details'}>
        <div>
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
          ) : error ? (
            <div className="alert alert-error mb-4">{error}</div>
          ) : course ? (
            <>
              {/* Course Header */}
              <div className="mb-8">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => router.push('/student')}
                    className="mr-4 text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                  <h1 className="text-3xl font-bold">{course.name}</h1>
                </div>
                
                {/* Course Subject */}
                <div className="text-sm text-gray-500 mb-4">
                  Subject: {course.subject.name}
                </div>
                
                {/* Course Description */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h2 className="text-xl font-bold mb-2">Course Description</h2>
                  <p className="text-gray-600">{course.description}</p>
                </div>
              </div>
              
              {/* Exams Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Available Exams</h2>
                
                {exams.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500">No exams are available for this course yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam) => (
                      <ExamCard
                        key={exam._id}
                        id={exam._id}
                        name={exam.name}
                        description={exam.description}
                        duration={exam.duration}
                        totalMarks={exam.totalMarks}
                        hasTaken={exam.hasTaken}
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

export default CourseDetailPage;
