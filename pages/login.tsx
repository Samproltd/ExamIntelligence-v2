import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { RootState, AppDispatch } from '../store';
import { KeyIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, loading, error, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearError());

    // Redirect if already authenticated
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    }
  }, [isAuthenticated, dispatch, router, user]);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      await dispatch(login({ email, password }));
    }
  };

  return (
    <Layout title="Login - Online Exam Portal">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Log in to Your Account</h1>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className={`form-control ${validationErrors.email ? 'border-red-500' : ''}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className={`form-control ${validationErrors.password ? 'border-red-500' : ''}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>

          <div className="flex justify-end mt-2">
            <Link
              href="/forgot-password"
              className="flex items-center text-blue-600 hover:underline text-sm"
            >
              <KeyIcon className="w-4 h-4 mr-1" />
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={loading} className="mt-4">
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        {/* Login credentials information */}
        {/* <div className="mt-6 bg-gray-100 p-4 rounded-md border border-gray-300">
          <h3 className="text-sm font-bold mb-2">Demo Credentials:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <p className="font-bold">Admin:</p>
              <p>Email: admin@gmail.com</p>
              <p>Password: admin123</p>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <p className="font-bold">Student:</p>
              <p>Email: john@example.com</p>
              <p>Password: student123</p>
            </div>
          </div>
        </div> */}

        {/* <div className="mt-6 text-center">
          <p className="text-center mt-6 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register">
              <span className="text-primary-color hover:underline cursor-pointer">
                Register here
              </span>
            </Link>
          </p>
        </div> */}
      </div>
    </Layout>
  );
};

export default Login;
