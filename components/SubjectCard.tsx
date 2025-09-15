import React from 'react';
import { useRouter } from 'next/router';
import Card from './Card';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string;
  isAdmin?: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ 
  id, 
  name, 
  description, 
  isAdmin = false 
}) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (isAdmin) {
      router.push(`/admin/subjects/${id}`);
    } else {
      router.push(`/student/subjects/${id}`);
    }
  };
  
  return (
    <Card className="h-full" onClick={handleClick}>
      <div className="p-2">
        <h3 className="text-xl font-bold text-primary-color mb-2">{name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{description}</p>
        <div className="flex justify-end">
          <button 
            className="text-primary-color hover:underline"
            onClick={handleClick}
          >
            {isAdmin ? 'Manage' : 'View Courses'} →
          </button>
        </div>
      </div>
    </Card>
  );
};

export default SubjectCard;
