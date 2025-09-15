import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/student') : '/'}>
          <div className="flex items-center cursor-pointer">
            <Image
              src="/images/logo.png"
              alt="SAMFOCUS TECHNOLOGIES PVT. LTD."
              width={167}
              height={54}
              className="mr-2"
            />
            {/* <div className="flex flex-col">
              <span className="text-xl font-bold text-red-600">SAMFOCUS TECHNOLOGIES PVT. LTD.</span>
              <span className="text-xs text-teal-500">
                Your trusted platform for Online Examinations
              </span>
            </div> */}
          </div>
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' ? (
                <>
                  {/* Admin sees only their name and logout */}
                  <div className="px-3 py-2 rounded bg-primary-light text-white">{user?.name}</div>
                  <button onClick={handleLogout} className="px-3 py-2 rounded hover:bg-gray-100">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/student">
                    <span className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
                      Dashboard
                    </span>
                  </Link>
                  <Link href="/student/profile">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light text-white hover:bg-primary-color cursor-pointer">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </span>
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">Login</span>
              </Link>
              {/* <Link href="/register">
                <span className="btn btn-primary cursor-pointer">Register</span>
              </Link> */}
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' ? (
                  <>
                    {/* Admin sees only their name and logout in mobile menu too */}
                    <div className="block px-3 py-2 rounded bg-primary-light text-white">
                      {user?.name}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/student">
                      <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
                        Dashboard
                      </span>
                    </Link>
                    <Link href="/student/profile">
                      <div className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-white mr-2">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span>Profile</span>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
                    Login
                  </span>
                </Link>
                {/* <Link href="/register">
                  <span className="block px-3 py-2 rounded bg-primary-color text-white cursor-pointer">
                    Register
                  </span>
                </Link> */}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
