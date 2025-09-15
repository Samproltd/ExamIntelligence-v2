import React from 'react';
import { CertificateData } from '../utils/certificate';

interface CertificateProps {
  data: CertificateData;
}

const Certificate: React.FC<CertificateProps> = ({ data }) => {
  const formattedDate = new Date(data.examDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      className="certificate-container relative mx-auto bg-white overflow-hidden"
      style={{ width: '840px', height: '595px' }}
    >
      {/* Blue wave backgrounds */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-blue-900 z-0"></div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-blue-900 z-0"></div>

      {/* Gold accent waves */}
      <div className="absolute top-[80px] left-0 right-0 h-8 bg-yellow-600 opacity-70 z-0"></div>
      <div className="absolute bottom-[65px] left-0 right-0 h-8 bg-yellow-600 opacity-70 z-0"></div>

      {/* Corner decorations */}
      <div className="absolute top-3 left-3 w-10 h-10 z-10">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-600">
          <path d="M0,0 L80,0 C80,44.183 44.183,80 0,80 Z"></path>
        </svg>
      </div>
      <div className="absolute top-3 right-3 w-10 h-10 z-10">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-yellow-600"
          style={{ transform: 'rotate(90deg)' }}
        >
          <path d="M0,0 L80,0 C80,44.183 44.183,80 0,80 Z"></path>
        </svg>
      </div>
      <div className="absolute bottom-3 left-3 w-10 h-10 z-10">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-yellow-600"
          style={{ transform: 'rotate(270deg)' }}
        >
          <path d="M0,0 L80,0 C80,44.183 44.183,80 0,80 Z"></path>
        </svg>
      </div>
      <div className="absolute bottom-3 right-3 w-10 h-10 z-10">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-yellow-600"
          style={{ transform: 'rotate(180deg)' }}
        >
          <path d="M0,0 L80,0 C80,44.183 44.183,80 0,80 Z"></path>
        </svg>
      </div>

      {/* Content container */}
      <div className="relative z-1 flex flex-col h-full py-10 px-10">
        {/* Certificate ID in top-right */}
        <div className="absolute top-5 right-10 text-sm font-semibold">{data.certificateId}</div>

        {/* Header with logo, title, and medal */}
        <div className="flex justify-between items-center mt-6">
          {/* Samfocus Logo in circle */}
          <div className="w-24 h-24 rounded-full bg-blue-900 flex items-center justify-center border-2 border-yellow-600">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <div className="text-center text-red-600 font-bold text-xs">
                <div>SAMFOCUS</div>
                <div>TECHNOLOGIES</div>
              </div>
            </div>
          </div>

          {/* Certificate title */}
          <div className="text-center">
            <h1 className="text-4xl text-blue-900 font-bold tracking-wide uppercase m-0">
              Certificate
            </h1>
            <h2 className="text-2xl text-blue-900 uppercase font-semibold mt-1">of Completion</h2>
          </div>

          {/* Medal badge on right */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 flex flex-col items-center justify-center text-blue-900 font-bold text-lg border-2 border-yellow-600 shadow-lg">
            <div>ITAM</div>
            <div>SAM</div>
            <div>HAM</div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-grow flex flex-col items-center justify-center text-center my-5">
          <p className="text-lg mb-3">This is to certify that</p>
          <div className="text-3xl font-bold italic border-b border-gray-800 inline-block px-12 pb-1 mb-4">
            {data.studentName}
          </div>

          <p className="text-lg mb-3">has successfully completed the</p>
          <div className="text-2xl font-semibold border-b border-gray-800 inline-block px-12 pb-1 mb-6">
            {data.examName}
          </div>

          <p className="text-sm max-w-2xl mx-auto my-4 leading-relaxed">
            in recognition of their dedication to enhancing their skills &amp; knowledge in IT Asset
            Management. This certificate is awarded to acknowledge their achievement &amp;
            commitment to excellence.
          </p>
        </div>

        {/* Footer with signatures */}
        <div className="flex justify-between items-end mb-10">
          {/* Company info */}
          <div className="text-center">
            <div className="font-bold text-sm mb-1">SAMFOCUS</div>
            <div className="text-xs">Samfocus Technologies Private Limited</div>
          </div>

          {/* Signature */}
          <div className="text-center">
            <div className="border-t border-gray-800 w-40 pt-1 mx-auto">
              <div className="text-sm font-semibold">Mayur Chaudhari</div>
            </div>
            <div className="text-xs mt-1">Authorized Signature</div>
          </div>

          {/* Date */}
          <div className="text-center">
            <div className="border-t border-gray-800 w-40 pt-1 mx-auto">
              <div className="text-sm font-semibold">{formattedDate}</div>
            </div>
            <div className="text-xs mt-1">Date</div>
          </div>
        </div>
      </div>

      {/* Website and contact at bottom */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white z-10">
        www.samfocus.in
      </div>
      <div className="absolute bottom-2 right-5 text-xs text-white z-10">+91 9028224136</div>
    </div>
  );
};

export default Certificate;
