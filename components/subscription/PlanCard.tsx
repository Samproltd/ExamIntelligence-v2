import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  college: {
    _id: string;
    name: string;
    code: string;
  };
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  onSelect?: () => void;
  showComparison?: boolean;
  className?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected = false,
  onSelect,
  showComparison = false,
  className = '',
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDurationText = (duration: number) => {
    if (duration >= 12) {
      const years = Math.floor(duration / 12);
      const months = duration % 12;
      if (months === 0) {
        return `${years} year${years > 1 ? 's' : ''}`;
      }
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
    }
    return `${duration} month${duration > 1 ? 's' : ''}`;
  };

  const getPopularityBadge = () => {
    if (plan.isDefault) {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
            <StarIconSolid className="h-4 w-4 mr-1" />
            Most Popular
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      {getPopularityBadge()}
      
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
          
          {/* Price */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(plan.price)}
            </div>
            <div className="text-sm text-gray-500">
              for {getDurationText(plan.duration)}
            </div>
            {plan.duration > 1 && (
              <div className="text-xs text-green-600 mt-1">
                ₹{Math.round(plan.price / plan.duration)}/month
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Features included:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        {onSelect && (
          <motion.button
            onClick={onSelect}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSelected ? 'Selected' : 'Select Plan'}
          </motion.button>
        )}

        {/* College Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            For {plan.college.name} ({plan.college.code})
          </div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4"
        >
          <div className="bg-blue-500 text-white rounded-full p-1">
            <CheckIcon className="h-4 w-4" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlanCard;
