import React from 'react';
import { useRouter } from 'next/router';
import Card from './Card';
import Button from './Button';

interface ExamCardProps {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  totalQuestions?: number;
  questionsToDisplay?: number;
  courseName?: string;
  isAdmin?: boolean;
  hasTaken?: boolean;
  status?: string;
  canTake?: boolean;
}

const ExamCard: React.FC<ExamCardProps> = ({
  id,
  name,
  description,
  duration,
  totalMarks,
  totalQuestions,
  questionsToDisplay,
  courseName,
  isAdmin,
  hasTaken,
  status,
  canTake,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (isAdmin) {
      router.push(`/admin/exams/${id}`);
    } else {
      router.push(`/student/exams/${id}`);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
      <div onClick={handleClick}>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{duration} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Marks</p>
            <p className="font-medium">{totalMarks}</p>
          </div>
          {totalQuestions && (
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="font-medium">{totalQuestions}</p>
            </div>
          )}
          {questionsToDisplay && (
            <div>
              <p className="text-sm text-gray-500">Questions to Display</p>
              <p className="font-medium">{questionsToDisplay}</p>
            </div>
          )}
        </div>
        {courseName && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Course</p>
            <p className="font-medium">{courseName}</p>
          </div>
        )}
        {status && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Status</p>
            <p
              className={`font-medium ${
                status === 'Passed'
                  ? 'text-green-600'
                  : status === 'All attempts used'
                    ? 'text-red-600'
                    : 'text-blue-600'
              }`}
            >
              {status}
            </p>
          </div>
        )}
        {!isAdmin && (
          <Button
            variant={canTake ? 'primary' : 'outline'}
            disabled={!canTake}
            className="w-full"
            onClick={handleClick}
          >
            {hasTaken ? (canTake ? 'Retake Exam' : 'View Result') : 'Take Exam'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ExamCard;
