import React, { ReactNode, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Admin - SAMFOCUS TECHNOLOGIES PVT. LTD.',
  description = 'Admin dashboard for SAMFOCUS TECHNOLOGIES PVT. LTD.',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Admin Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex justify-between items-center px-4 py-2">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={toggleSidebar}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/admin">
              <div className="flex items-center cursor-pointer">
                <Image
                  src="/images/sq_logo.png"
                  alt="SAMFOCUS TECHNOLOGIES PVT. LTD."
                  width={32}
                  height={32}
                  className="my-1"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-blue-900">
                    SAMFOCUS TECHNOLOGIES PVT. LTD.
                  </span>
                </div>
              </div>
            </Link>

            {/* Admin Profile */}
            <div className="relative">
              <button
                className="flex items-center focus:outline-none"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center mr-2">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                <svg className="ml-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-white p-4 text-center text-sm text-gray-500 border-t">
          &copy; {new Date().getFullYear()} SAMFOCUS TECHNOLOGIES PVT. LTD. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
