import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon,
  BookOpenIcon,
  CogIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { 
  AcademicCapIcon as AcademicCapSolid,
  UserGroupIcon as UserGroupSolid,
  ChartBarIcon as ChartBarSolid,
  ShieldCheckIcon as ShieldCheckSolid
} from '@heroicons/react/24/solid';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: AcademicCapSolid,
      title: "Comprehensive Aptitude Tests",
      description: "Access a vast library of aptitude tests covering quantitative, verbal, logical reasoning, and technical skills.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: ShieldCheckSolid,
      title: "Advanced Proctoring",
      description: "AI-powered proctoring system with real-time monitoring, face detection, and anti-cheating measures.",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: ChartBarSolid,
      title: "Detailed Analytics",
      description: "Get comprehensive performance analytics, detailed reports, and insights to track progress.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: UserGroupSolid,
      title: "Multi-College Support",
      description: "Seamlessly manage multiple colleges, departments, and student batches with role-based access.",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const userTypes = [
    {
      role: "Super Admin",
      icon: CogIcon,
      description: "Complete system control and management",
      features: ["Manage all colleges", "Create subscription plans", "Assign batches to plans", "Monitor system analytics"],
      color: "from-red-500 to-pink-600",
      path: "/admin"
    },
    {
      role: "College Admin",
      icon: BuildingOfficeIcon,
      description: "College-level administration and oversight",
      features: ["Manage college students", "View college analytics", "Monitor exam sessions", "Handle student queries"],
      color: "from-blue-500 to-indigo-600",
      path: "/college-admin"
    },
    {
      role: "College Staff",
      icon: UsersIcon,
      description: "Support and assistance for students",
      features: ["View student progress", "Assist with technical issues", "Monitor exam sessions", "Generate reports"],
      color: "from-green-500 to-emerald-600",
      path: "/college-staff"
    },
    {
      role: "Student",
      icon: AcademicCapIcon,
      description: "Take aptitude tests and track progress",
      features: ["Subscribe to test plans", "Take practice tests", "View detailed results", "Track improvement"],
      color: "from-purple-500 to-violet-600",
      path: "/student"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Dean, ABC Engineering College",
      content: "ExamIntelligence has revolutionized our aptitude testing process. The AI proctoring and detailed analytics help us identify top talent effectively.",
      avatar: "👩‍🎓"
    },
    {
      name: "Rajesh Kumar",
      role: "Student, XYZ University",
      content: "The practice tests and detailed feedback helped me improve my aptitude scores by 40%. The interface is intuitive and user-friendly.",
      avatar: "👨‍💼"
    },
    {
      name: "Prof. Michael Chen",
      role: "Head of Department, DEF College",
      content: "Managing multiple batches and subscription plans is now effortless. The system scales beautifully with our growing student base.",
      avatar: "👨‍🏫"
    }
  ];

  const stats = [
    { number: "50K+", label: "Students Served", icon: UsersIcon },
    { number: "100+", label: "Colleges", icon: BuildingOfficeIcon },
    { number: "1M+", label: "Tests Conducted", icon: ChartBarIcon },
    { number: "99.9%", label: "Uptime", icon: ShieldCheckIcon }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ExamIntelligence
              </span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link href="/login">
                <button className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                  Get Started
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-800 mb-8"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Next-Generation Aptitude Testing Platform
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Master Your
              </span>
              <br />
              <span className="text-gray-900">Aptitude Tests</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The most advanced aptitude testing platform with AI-powered proctoring, 
              comprehensive analytics, and multi-college support. Prepare, practice, and excel.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/register">
                <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Start Your Journey
                  <ArrowRightIcon className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                  Sign In
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose ExamIntelligence?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of aptitude testing with cutting-edge technology and comprehensive features.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Designed for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a student, educator, or administrator, ExamIntelligence has the perfect solution for you.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {userTypes.map((userType, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 h-full">
                  <div className={`w-16 h-16 bg-gradient-to-r ${userType.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <userType.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{userType.role}</h3>
                  <p className="text-gray-600 mb-6">{userType.description}</p>
                  <ul className="space-y-2 mb-6">
                    {userType.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={userType.path}>
                    <button className={`w-full py-3 bg-gradient-to-r ${userType.color} text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105`}>
                      Access Dashboard
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied users who have transformed their aptitude testing experience.
            </p>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                  <blockquote className="text-xl text-gray-700 mb-6 italic">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                    <div className="text-gray-600">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Aptitude Testing?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of students and educators who are already using ExamIntelligence to achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <button className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Get Started
                  <RocketLaunchIcon className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
                  Sign In
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ExamIntelligence</span>
              </div>
              <p className="text-gray-400 mb-4">
                The future of aptitude testing with AI-powered proctoring and comprehensive analytics.
              </p>
              <div className="flex space-x-4">
                <GlobeAltIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <HeartIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Students</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register" className="hover:text-white">Get Started</Link></li>
                <li><Link href="/student" className="hover:text-white">Student Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white">Practice Tests</Link></li>
                <li><Link href="#" className="hover:text-white">Results & Analytics</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Educators</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin" className="hover:text-white">Admin Dashboard</Link></li>
                <li><Link href="/college-admin" className="hover:text-white">College Admin</Link></li>
                <li><Link href="/college-staff" className="hover:text-white">College Staff</Link></li>
                <li><Link href="#" className="hover:text-white">Analytics & Reports</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ExamIntelligence. All rights reserved. Built with ❤️ for the future of education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;