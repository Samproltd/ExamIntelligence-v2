import React from 'react';
import { useRouter } from 'next/router';
import Card from './Card';

interface CourseCardProps {
  id: string;
  name: string;
  description: string;
  subjectName?: string;
  isAdmin?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  id, 
  name, 
  description, 
  subjectName,
  isAdmin = false 
}) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (isAdmin) {
      router.push(`/admin/courses/${id}`);
    } else {
      router.push(`/student/courses/${id}`);
    }
  };
  
  return (
    <Card className="h-full" onClick={handleClick}>
      <div className="p-2">
        {subjectName && (
          <div className="text-sm text-gray-500 mb-1">{subjectName}</div>
        )}
        <h3 className="text-xl font-bold text-primary-color mb-2">{name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{description}</p>
        <div className="flex justify-end">
          <button 
            className="text-primary-color hover:underline"
            onClick={handleClick}
          >
            {isAdmin ? 'Manage' : 'View Exams'} →
          </button>
        </div>
      </div>
    </Card>
  );
};

export default CourseCard;
