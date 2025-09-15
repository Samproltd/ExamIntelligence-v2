import React, { ReactNode, useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'SAMFOCUS TECHNOLOGIES  PVT. LTD.',
  description = 'Your trusted platform for Online Examinations',
}) => {
  const router = useRouter();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isExamPage = router.pathname.includes('/student/exams/take/');

  // Check for fullscreen state on mount and when it changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    // Initial check
    setIsFullScreen(!!document.fullscreenElement);

    // Add event listener for changes
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Hide navbar in fullscreen exam mode
  const showNavbar = !(isExamPage && isFullScreen);

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {showNavbar && <Navbar />}

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>

      {showNavbar && <Footer />}
    </div>
  );
};

export default Layout;
