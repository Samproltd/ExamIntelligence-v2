import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

// BLOB UPLOADING
import { uploadFile } from '@/lib/azure-storage';

// Define interface for certificate data
export interface CertificateData {
  studentName: string;
  examName: string;
  examDate: Date;
  certificateId: string;
  score: number;
  percentage: number;
}

// Function to generate a unique certificate ID
// OLD
// export const generateCertificateId = (): string => {
//   const prefix = "SAMFOCUS_TECHNOLOGIES";
//   const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit number
//   return `${prefix}_${randomDigits}`;
// };

// UPDATED
export const generateCertificateId = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = now.getFullYear();
  const datePart = `${day}${month}${year}`;
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit number
  return `${randomDigits}${datePart}`;
};

// Function to generate certificate HTML
export const generateCertificateHtml = (data: CertificateData): string => {
  // Test data
  // data = {
  //   studentName: "John Doe",
  //   examName: "Math Final Exam",
  //   examDate: new Date("2025-04-01"),
  //   certificateId: "CERT123456",
  //   score: 92,
  //   percentage: 92.0
  // };
  const formattedDate = new Date(data.examDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const encodeImageToBase64 = (): string => {
    const filePath = path.join(process.cwd(), 'attached_assets/template.jpg');
    const file = fs.readFileSync(filePath);

    const base64 = file.toString('base64');
    // Save to file (optional, for verification)
    const outputPath = path.join(process.cwd(), 'debug_base64.txt');
    fs.writeFileSync(outputPath, `data:image/jpeg;base64,${base64}`);

    return `data:image/jpeg;base64,${file.toString('base64')}`;
  };

  const bgImage = encodeImageToBase64();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Certificate</title>

      <!-- Google Fonts -->
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Playfair+Display:wght@600&display=swap" rel="stylesheet">

      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background-color: #f5f5f5;
        }

        .certificate-container {
          width: 1123px;
          height: 794px;
          /*background-image: url('template.jpg');  Replace with your image path */
          background-image: url('${bgImage}');
           /*background-image: url('file://${process.cwd()}/attatched_assets/template.jpg');*/
          background-size: cover;
          background-position: center;
          position: relative;
          margin: 0;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        }

    .name {
      position: absolute;
      top: 290px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 40px;
      font-family: 'Georgia', serif;
      color: #2c2c2c;
      font-weight: 600;
    }

    .course {
      position: absolute;
      top: 405px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 24px;
      font-family: 'Poppins', sans-serif;
      color: #444;
      text-align: center;
      width: 80%;
      font-weight: 600;
    }


    .date {
      position: absolute;
      top: 625px;
      left: 820px;
      font-size: 20px;
      font-family: 'Poppins', sans-serif;
      color: #444;
      font-weight: 400;
    }
    .cert-id {
      position: absolute;
      top: 265px;
      left: 835px;
      font-size: 18px;
      font-family: 'Poppins', sans-serif;
      color: #555;
      font-weight: 400;
    }
      </style>
    </head>
    <body>

      <div class="certificate-container">
        <div class="name">${data.studentName}</div>
        <div class="course">${data.examName}</div>
        <div class="date">${formattedDate}</div>
        <div class="cert-id">${data.certificateId}</div>
      </div>
    </body>
    </html>

  `;
};

// Function to convert HTML to PDF using puppeteer
export const generateCertificatePdf = async (data: CertificateData): Promise<Buffer> => {
  const puppeteer = await import('puppeteer');
  const html = generateCertificateHtml(data);

  // Create a browser instance with more flexible configuration
  const browser = await puppeteer.default.launch({
    headless: true, // Use true instead of 'new' for TypeScript compatibility
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // Don't use a specific executablePath to increase compatibility
    ignoreDefaultArgs: ['--disable-extensions'],
  });

  try {
    // Create a new page
    const page = await browser.newPage();

    // Set content to our certificate HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Set viewport to match A4 landscape format (better for certificates)
    // await page.setViewport({
    //   width: 842, // A4 width in pixels at 96 DPI
    //   height: 595, // A4 height in pixels at 96 DPI
    //   deviceScaleFactor: 2, // Higher quality
    // });
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });

    // debug line========================================================
    // await page.screenshot({ path: 'debug_preview.png', fullPage: false });

    // Generate PDF with no margins to maximize the certificate size
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: '1123px',
      height: '794',
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      pageRanges: '1',
    });

    // debug line
    // await page.screenshot({
    //   path: 'rendered_preview.png',
    //   fullPage: false,
    // });

    // ========================================================OLD CODE SAVING ON LOCAL MACHINE STRT===================

    // Define your output path
    //  const outputPath = path.join(process.cwd(), "certificates_gen", `${data.certificateId}.pdf`);

    // Save the buffer to the file
    //  await writeFile(outputPath, pdfBuffer);

    // ========================================================OLD CODE SAVING ON LOCAL MACHINE END===================
    // Filename
    const fileName = `${data.certificateId}.pdf`;
    // Upload to Azure Blob Storage
    const blobUrl = await uploadFile(Buffer.from(pdfBuffer), fileName);

    console.log('Certificate uploaded to:', blobUrl);

    // return blobUrl;

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    // Make sure to close the browser
    await browser.close();
  }
};
