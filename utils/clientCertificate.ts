/**
 * Client-side certificate generation utility
 * This module handles generating and downloading certificates directly in the browser
 */

export interface ClientCertificateData {
  studentName: string;
  examName: string;
  certificateId: string;
  score?: number;
  percentage?: number;
}

/**
 * Generates a certificate ID if one is not provided
 */
export const generateClientCertificateId = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const datePart = `${day}${month}${year}`;
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit number
  return `SL${randomDigits}${datePart}`;
};

/**
 * Creates a canvas with the certificate template and text overlay
 */
export const generateCertificateCanvas = async (
  data: ClientCertificateData
): Promise<HTMLCanvasElement> => {
  // Create a canvas and get its context
  const canvas = document.createElement('canvas');
  canvas.width = 1654;
  canvas.height = 1170;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Load the template image
  const templateImage = new Image();

  // Default template path - this is the main path we should use
  const templatePath = '/templates/certificate-template.jpg';

  // Format the date
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Use a promise to load the image
  await new Promise<void>((resolve, reject) => {
    templateImage.onload = () => {
      // Draw the template image on the canvas
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

      // Add student name in the correct position on the template (on the first blank line)
      ctx.font = 'bold 60px Georgia, serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(data.studentName, canvas.width / 2, 365 + 120); // Changed to 90px margin top

      // Add exam name in the correct position on the template (on the second blank line)
      ctx.font = 'bold 40px Poppins, sans-serif';
      ctx.fillText(data.examName, canvas.width / 2, 500 + 140); // Changed to 90px margin top

      // Add certificate ID at the appropriate position (top right)
      ctx.font = '34px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(` ${data.certificateId}`, canvas.width * 0.85 - 74, canvas.height - 750);

      // Add date at the bottom right signature line
      ctx.font = '34px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(formattedDate, canvas.width * 0.85 - 120, canvas.height - 210); // Moved 30px left from center position

      resolve();
    };

    templateImage.onerror = () => {
      console.error('Failed to load the certificate template image');
      reject(new Error('Failed to load certificate template'));
    };

    // Set the source to start loading
    templateImage.src = templatePath;
  });

  return canvas;
};

/**
 * Generates and downloads the certificate as a PDF or image
 */
export const generateAndDownloadCertificate = async (
  data: ClientCertificateData,
  format: 'pdf' | 'image' = 'pdf'
): Promise<void> => {
  try {
    // Generate certificate canvas
    const canvas = await generateCertificateCanvas(data);

    if (format === 'pdf') {
      // Dynamic import jspdf library
      try {
        const jspdf = await import('jspdf');

        // Convert to PDF using appropriate dimensions
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jspdf.default('landscape', 'pt', [canvas.width, canvas.height]);

        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Certificate-${data.certificateId}.pdf`);
      } catch (err) {
        console.error('Error generating PDF:', err);
        // Fallback to image download if PDF generation fails
        downloadAsImage(canvas, data.certificateId);
      }
    } else {
      // Download as image if specifically requested
      downloadAsImage(canvas, data.certificateId);
    }
  } catch (err) {
    console.error('Certificate generation error:', err);
    throw err;
  }
};

/**
 * Helper function to download canvas as JPG image
 */
const downloadAsImage = (canvas: HTMLCanvasElement, certificateId: string): void => {
  try {
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Certificate-${certificateId}.jpg`;
    link.click();
  } catch (imgErr) {
    console.error('Image download failed:', imgErr);
    throw new Error('Certificate image generation failed');
  }
};
