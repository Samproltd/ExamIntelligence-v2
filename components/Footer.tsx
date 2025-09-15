import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center ml-10">
              <div>
                {/* <div className="text-xl font-bold text-red-400">SAMFOCUS TECHNOLOGIES PVT. LTD.</div> */}
                <Image
                  src="/images/logo_white_text.png"
                  alt="SAMFOCUS TECHNOLOGIES PVT. LTD."
                  width={213}
                  height={69}
                  className=""
                />
                <div className="text-xs text-teal-300 ml-2">
                  Your trusted platform for Online Examinations
                </div>
                <div className="text-sm text-blue-300 mt-1 italic ml-2">
                  "Empowering Excellence in IT Asset Management"
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="hover:text-primary-color cursor-pointer">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <span className="hover:text-primary-color cursor-pointer">Login</span>
                </Link>
              </li>
              <li>
                <Link href="/register">
                  <span className="hover:text-primary-color cursor-pointer">Register</span>
                </Link>
              </li>
            </ul>
          </div> */}

          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
            <p className="mb-2">
              <span className="font-medium">Email:</span> info@samfocus.in
            </p>
            <p className="mb-2">
              <span className="font-medium">Phone:</span> +91 9359339299
            </p>
            <p>
              <span className="font-medium">Address:</span> 3rd Floor, Office No 310, Crossroads
              <br /> Building, Dange Chowk Road, Bhumkar Das Gugre Rd, <br />
              Wakad, Pune, Maharashtra, 411057
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700 text-center">
          <p className="text-sm">
            &copy; {currentYear} SAMFOCUS TECHNOLOGIES PVT. LTD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
