import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`card ${className} ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
    >
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
