import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, MagnifyingGlassIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';

interface College {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  isActive: boolean;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
}

interface CollegeSelectorProps {
  selectedCollege?: College | null;
  onCollegeSelect: (college: College) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSearch?: boolean;
}

const CollegeSelector: React.FC<CollegeSelectorProps> = ({
  selectedCollege,
  onCollegeSelect,
  placeholder = 'Select a college',
  className = '',
  disabled = false,
  showSearch = true,
}) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      // Only add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/colleges', {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch colleges');
      }

      const data = await response.json();
      setColleges(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollegeSelect = (college: College) => {
    onCollegeSelect(college);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedCollege ? (
              <>
                <div
                  className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: selectedCollege.branding.primaryColor }}
                >
                  {selectedCollege.logo ? (
                    <img
                      src={selectedCollege.logo}
                      alt={selectedCollege.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <BuildingOfficeIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedCollege.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedCollege.code} • {selectedCollege.address}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden"
          >
            {/* Search Input */}
            {showSearch && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search colleges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="p-4 text-center">
                <LoadingSpinner size="md" />
                <p className="text-sm text-gray-500 mt-2">Loading colleges...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={fetchColleges}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Colleges List */}
            {!loading && !error && (
              <div className="max-h-60 overflow-y-auto">
                {filteredColleges.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No colleges found</p>
                  </div>
                ) : (
                  filteredColleges.map((college) => (
                    <motion.button
                      key={college._id}
                      onClick={() => handleCollegeSelect(college)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150"
                      whileHover={{ backgroundColor: '#f9fafb' }}
                    >
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: college.branding.primaryColor }}
                        >
                          {college.logo ? (
                            <img
                              src={college.logo}
                              alt={college.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <BuildingOfficeIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {college.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {college.code} • {college.address}
                          </div>
                        </div>
                        {selectedCollege?._id === college._id && (
                          <div className="ml-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CollegeSelector;
