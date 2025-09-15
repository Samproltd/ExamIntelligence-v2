// pages/api/mailervice/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

// type ResponseData = {
//     message:string;
// };

const encodeImageToBase64 = (): string => {
  const filePath = path.join(process.cwd(), 'attached_assets/logo_white_text.png');

  if (!fs.existsSync(filePath)) {
    console.log('Logo file not found: ' + filePath);
    throw new Error('Logo file not found: ' + filePath);
  }

  const file = fs.readFileSync(filePath);
  const base64 = file.toString('base64');

  // Only write debug file in development mode to avoid production filesystem errors
  if (process.env.NODE_ENV === 'development') {
    try {
      const outputPath = path.join(process.cwd(), 'debug_base64.txt');
      fs.writeFileSync(outputPath, `data:image/png;base64,${base64}`);
    } catch (error) {
      console.log('Could not write debug file:', error);
    }
  }

  return `data:image/png;base64,${base64}`;
};

const LogoImg = encodeImageToBase64();

// To capitalize the name
const capitalizeName = (name: string) =>
  name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- Robust CORS Handling ---
  const allowedOrigins = [
    'http://localhost:3000', // Common Next.js dev port
    'http://localhost:5050', // Your specific dev port
    'https://examportal.samprolicense.com', // Production frontend
    'https://samprolicense.com', // Potentially another related domain
    'https://sampro-examportal.vercel.app',
    'https://test-examportal.vercel.app',
  ];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback or block? For development, allowing * might be okay, but stricter is better.
    // If the origin is not in the allowed list, maybe block it?
    // For now, let's keep it relatively open for testing, but ideally restrict further.
    res.setHeader('Access-Control-Allow-Origin', '*'); // Consider removing in strict production
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' // Ensure Authorization is here
  );

  // Specifically handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return; // End execution after handling OPTIONS
  }
  // --- End CORS Handling ---

  // Proceed with POST logic only if not OPTIONS
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, emailType, payload } = req.body;

  if (!email || !emailType) {
    return res.status(400).json({ message: 'Missing required fields (email, emailType)' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL_USER,
      pass: process.env.SMTP_EMAIL_PASS,
    },
  });

  let subject = '';
  let html = '';

  const attachments: any[] = [];

  switch (emailType) {
    case 'welcome':
      subject = 'Welcome to Samfocus Technologies Private Limited,  Your Account is Ready';
      html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">

  <!-- Header -->
  <div style="background-color: #2e6c80; padding: 20px; text-align: center;">
    <img src="${LogoImg}" alt="Samfocus Technologies Logo" style="height: 60px; margin-bottom: 10px;" />
    <h1 style="color: white; margin: 0; font-size: 24px;">Samfocus Technologies Private Limited</h1>
  </div>

  <!-- Content -->
  <div style="padding: 25px; background-color: #f9f9f9;">
    <h2 style="color: #2e6c80; margin-top: 0;">Welcome Aboard,  ${capitalizeName(payload.name)}!</h2>
     <p style="margin-bottom: 5px; font-size: 16px; line-height: 1.2;">
       "Empowering Excellence in IT Asset Management".
      </p>

    <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <p style="margin-bottom: 10px; font-size: 16px; line-height: 1.6;">
        We're excited to have you join <strong>Samfocus Technologies Private Limited</strong>.
      </p>
      <p  style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Your account has been successfully created.</p>

      <div style="background-color: #f5f9ff; border-left: 4px solid #2e6c80; padding: 12px 15px; margin-bottom: 20px;">
        <p style="margin: 0; font-weight: bold; color: #2e6c80;">Your Account Details:</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li><strong>Email:</strong> ${payload.email}</li>
          <li><strong Password:</strong> ${payload.password}</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <p style="font-size: 16px; line-height: 1.6;">
         If you have any questions or need assistance, please contact our Technical Support team.
        </p>
      </div>

      <div style="font-size: 14px; color: #666; line-height: 1.5;">
        <p>Welcome to the SAMFOCUS TECHNOLOGIES community! 🚀</p>
        <p style="margin-top: 5px;">
          <strong>Email:</strong> 
          <a href="mailto:info@samfocus.in" style="color: #2e6c80; text-decoration: none;">
            info@samfocus.in
          </a>
        </p>
        <p  style="margin-bottom: 5px; font-size: 16px; line-height: 1.2;">Best Regards,</p>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Samfocus Technologies Team</p>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0;">© ${new Date().getFullYear()} Samfocus Technologies Private Limited. All rights reserved.</p>
  </div>
</div>

  `;

      break;

    case 'certificate':
      subject = `🏅Congratulations! You passed the ${payload.examName} exam !`;
      html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Congratulations on Passing Your Exam!</title>
      <style>
      
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
        }
        .header {
          background-color: #15395A;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .header img {
          max-width: 200px;
          height: auto;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f7f7f7;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-radius: 0 0 5px 5px;
        }
        h1 {
          color: #15395A;
          margin-bottom: 20px;
        }
        .highlight {
          color: #D4AF37;
          font-weight: bold;
        }
        .button {
          display: inline-block;
          background-color: #15395A;
          color: white !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .score-box {
          background-color: #f7f7f7;
          border-left: 4px solid #D4AF37;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LogoImg}" alt="Samfocus Technologies PVT. LTD" />
        </div>
        
        <div class="content">
          <h1>Congratulations, ${payload.studentName}!</h1>
          
          <p>We are pleased to inform you that you have <span class="highlight">successfully passed</span> the "${payload.examName}" exam!</p>
          
          <div class="score-box">
            <p><strong>Your Results:</strong></p>
            <p>Score: <span class="highlight">${payload.score}</span></p>
            <p>Percentage: <span class="highlight">${payload.percentage}%</span></p>
          </div>
          
          <p>This achievement demonstrates your knowledge and dedication to excellence. A certificate of completion has been attached to this email as recognition of your accomplishment.</p>
          
          <p>You can also access and download your certificate from your student dashboard at any time.</p>
          
          <p>Keep up the good work and continue your journey of learning and growth with SAMFOCUS TECHNOLOGIES PVT. LTD.</p>
          
          <p>Best regards,<br>
          The SAMFOCUS TECHNOLOGIES Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} SAMFOCUS TECHNOLOGIES INDIA PVT. LTD. All rights reserved.</p>
          <p>www.samfocus.in | info@samfocus.in | +91 9028224136</p>
        </div>
      </div>
    </body>
    </html>`;
      // If certificate is stored locally (in public/certificates/)
      const filePath = path.resolve('./certificates_gen', payload.fileName); // e.g. certificate.pdf
      console.log('filepath : ', filePath);
      attachments.push({
        filename: payload.fileName,
        // Use this if we want to send file directly
        content: Buffer.from(payload.pdf_file, 'base64'),
        contentType: 'application/pdf',
        // Use this if we want to send file via path
        // path: filePath,
        // contentType: 'application/pdf',
      });

      // html = `<h2>Hi ${payload.name},</h2><p>Here is your certificate: <a href="${payload.certificateUrl}">Download</a></p>`;
      break;

    case 'suspension-revoke-notification':
      subject = `Option to Revoke Your Suspension`;
      html = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="background-color: rgb(41, 43, 55); padding: 20px; text-align: center;">
          <img src="cid:logo" alt="Samfocus Logo" style="max-height: 80px; margin-bottom: 5px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Samfocus Technologies Private Limited</h1>
          <p style="color: white; margin: 10px 0 0; font-weight: bold; font-size: 16px;">"Empowering Excellence in IT Asset Management"</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 25px; background-color: #f9f9f9;">
          <h2 style="color: #2e6c80; margin-top: 0;">Hi ${payload.name},</h2>
          
           <div style="font-family: sans-serif; background-color: #f9f9f9;">
            <p>Your suspension for ${payload.examName} is currently in effect, but you now have the opportunity to <strong>revoke it</strong> by paying the required fees.</p>
            <p>To proceed, please visit your Exam dashboard, where you will find the option to complete the payment and restore your access.</p>
            <br/>
            <table style="margin: 10px auto; border-collapse: collapse; border-spacing: 0;">
              <tr>
                <td style="background-color: #007BFF; padding: 10px 20px; border-radius: 4px;">
                  <a href="${payload.dashboardLink}" style="color: white; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; display: inline-block;">Go to Dashboard</a>
                </td>
              </tr>
            </table>
            <br/>
          </div>
          
          <div style="font-size: 14px; color: #666; line-height: 1.5;">
            <p>For any questions or assistance, please contact our support team:</p>
            <p style="margin-top: 5px;">
              <strong>Email:</strong> <a href="mailto:info@samfocus.in" style="color: #2e6c80; text-decoration: none;">info@samfocus.in</a><br>
              <strong>Phone:</strong> <a href="tel:+91 90282 24136" style="color: #2e6c80; text-decoration: none;">+91 90282 24136</a>
            </p>
            </br>

            <p style="margin-bottom: 5px; font-size: 16px; line-height: 1.2;">Best Regards,</p>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Samfocus Technologies Team</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Samfocus Technologies Private Limited. All rights reserved.</p>
        </div>
      </div> `;
      try {
        await transporter.sendMail({
          from: `"Samfocus Technologies Pvt Ltd" <${process.env.SMTP_EMAIL_USER}>`,
          to: email,
          subject: subject,
          html,
          attachments: [
            {
              filename: 'logo.png',
              path: path.join(process.cwd(), 'attached_assets/logo_white_text.png'),
              cid: 'logo',
            },
          ],
        });
        return res.status(200).json({ message: 'Suspension email sent successfully!' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to send suspension email.' });
      }
      break;

    case 'attempt-refill-notification':
      subject = `Opportunity to Regain Exam Attempts for ${payload.examName}`;
      html = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Header with logo -->
          <div style="background-color: rgb(41, 43, 55); padding: 20px; text-align: center;">
            <img src="cid:logo" alt="Samfocus Logo" style="max-height: 80px; margin-bottom: 5px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Samfocus Technologies Private Limited</h1>
            <p style="color: white; margin: 10px 0 0; font-weight: bold; font-size: 16px;">"Empowering Excellence in IT Asset Management"</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 25px; background-color: #f9f9f9;">
            <h2 style="color: #2e6c80; margin-top: 0;">Dear ${payload.name},</h2>
            
             <div style="font-family: sans-serif; background-color: #f9f9f9;">
              <p>We hope this message finds you well.</p>
              <p>You have utilized all your maximum attempts for ${payload.examName}. However, we are pleased to inform you that you now have the opportunity to regain additional attempts by completing the required payment.
              To proceed, please visit your Exam dashboard, where you will find the option to make the payment and restore your access to the exam.</p>
              <p>To proceed, please visit your Exam dashboard, where you will find the option to complete the payment and restore your access.</p>
              <br/>
              <table style="margin: 10px auto; border-collapse: collapse; border-spacing: 0;">
                <tr>
                  <td style="background-color: #007BFF; padding: 10px 20px; border-radius: 4px;">
                    <a href="${payload.dashboardLink}" style="color: white; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; display: inline-block;">Go to Dashboard</a>
                  </td>
                </tr>
              </table>
              <br/>
            </div>
            
            <div style="font-size: 14px; color: #666; line-height: 1.5;">
              <p>For any questions or assistance, please contact our support team:</p>
              <p style="margin-top: 5px;">
                <strong>Email:</strong> <a href="mailto:info@samfocus.in" style="color: #2e6c80; text-decoration: none;">info@samfocus.in</a><br>
                <strong>Phone:</strong> <a href="tel:+91 90282 24136" style="color: #2e6c80; text-decoration: none;">+91 90282 24136</a>
              </p>
              </br>
  
              <p style="margin-bottom: 5px; font-size: 16px; line-height: 1.2;">Best Regards,</p>
          <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Samfocus Technologies Team</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Samfocus Technologies Private Limited. All rights reserved.</p>
          </div>
        </div> `;
      try {
        await transporter.sendMail({
          from: `"Samfocus Technologies Pvt Ltd" <${process.env.SMTP_EMAIL_USER}>`,
          to: email,
          subject: subject,
          html,
          attachments: [
            {
              filename: 'logo.png',
              path: path.join(process.cwd(), 'attached_assets/logo_white_text.png'),
              cid: 'logo',
            },
          ],
        });
        return res.status(200).json({ message: 'Reattempt email sent successfully!' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to send Reattempt email.' });
      }
      break;

    case 'announcement':
      subject = `📢 Announcement: ${payload.title}`;
      html = `<h2>${payload.title}</h2><p>${payload.body}</p>`;
      break;

    case 'invite':
      subject = `Your Samfocus Technologies ${payload.examName} exam is ready to take`;
      html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="background-color:rgb(41, 43, 55); padding: 20px; text-align: center;">
          <img src="cid:logo" alt="Samfocus Logo" style="max-height: 80px; margin-bottom: 5px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Samfocus Technologies Private Limited</h1>
          <p style="color: white; margin: 10px 0 0; font-weight: bold; font-size: 16px;">"Empowering Excellence in IT Asset Management"</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 25px; background-color: #f9f9f9;">
          <h2 style="color: #2e6c80; margin-top: 0;">Hi ${payload.name || 'Student'},</h2>
          <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">
              Your Samfocus Technologies ${
                payload.examName || ''
              } exam is now ready for you to take.
            </p>
              <p>Login credentials (Username & Password) have been sent to you in a separate email with a subject as "Welcome to Samfocus Technologies Private Limited. Your Account is Ready".</p>
              <p>If you are unable to find the credentials email, please contact our support team at
              📧 info@samfocus.in or 📞 +91 90282 24136</p>

            <div style="background-color: #fff8f0; border-left: 4px solid #ffa500; padding: 12px 15px; margin-bottom: 20px;">
              <p style="margin: 0; font-weight: bold; color: #2e6c80;">General Exam Instructions:</p>
              <p style="margin: 10px 0 0 0; font-weight: bold;">Before Starting the Exam:</p>
              <p style="margin: 5px 0;">Please ensure you have:</p>
              <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                <li>A working webcam/camera (required for proctoring)</li>
                <li>A working microphone</li>
                <li>A stable internet connection</li>
                <li>A quiet environment without distractions</li>
                <li>A desktop, laptop, or tablet (not a mobile phone)</li>
              </ul>
              <p style="margin: 10px 0 0 0;">
                <strong>Important Notes:</strong>
                <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                  <li>This exam requires full screen mode and will monitor for tab switching</li>
                  <li>Copying exam content is not allowed and is monitored</li>
                  <li>If you get suspended due to multiple violations, you will need to pay a fine of ₹300</li>
                  <li>If you fail all maximum attempts, you will need to pay a fine of ₹500 for re-exam</li>
                  <li>You will not be able to proceed without enabling camera and microphone access</li>
                </ul>
              </p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${payload.loginUrl}" 
                 style="display: inline-block; background-color: #2e6c80; color: white; 
                        text-decoration: none; padding: 12px 25px; border-radius: 4px; 
                        font-weight: bold; font-size: 16px;">
                Start Your Exam Now
              </a>
            </div>
          </div>
          
          <div style="font-size: 14px; color: #666; line-height: 1.5;">
            <p>For any questions or assistance, please contact our support team:</p>
            <p style="margin-top: 5px;">
              <strong>Email:</strong> <a href="mailto:info@samfocus.in" style="color: #2e6c80; text-decoration: none;">info@samfocus.in</a><br>
              <strong>Phone:</strong> <a href="tel:+91 90282 24136" style="color: #2e6c80; text-decoration: none;">+91 90282 24136</a>
            </p>
            </br>

            <p  style="margin-bottom: 5px; font-size: 16px; line-height: 1.2;">Best Regards,</p>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Samfocus Technologies Team</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Samfocus Technologies Private Limited. All rights reserved.</p>
        </div>
      </div>
      `;

      try {
        await transporter.sendMail({
          from: `"Samfocus Technologies Pvt Ltd" <${process.env.SMTP_EMAIL_USER}>`,
          to: email,
          subject: subject,
          html,
          attachments: [
            {
              filename: 'logo.png',
              path: path.join(process.cwd(), 'attached_assets/logo_white_text.png'),
              cid: 'logo',
            },
          ],
        });
        return res.status(200).json({ message: 'Invitation email sent successfully!' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to send invitation email.' });
      }

    case 'onboard':
      subject = 'Welcome to Samfocus Technologies Private Limited. Your Account is Ready';
      html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="background-color:rgb(41, 43, 55); padding: 20px; text-align: center;">
          <img src="cid:logo" alt="Samfocus Technologies Logo" style="max-height: 80px; margin-bottom: 5px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Samfocus Technologies Private Limited</h1>
          <p style="color: white; margin: 10px 0 0; font-weight: bold; font-size: 16px;">"Empowering Excellence in IT Asset Management"</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 25px; background-color: #f9f9f9;">
          <h2 style="color: #2e6c80; margin-top: 0;">Welcome to Samfocus Technologies Private Limited!</h2>
          <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">
              <b>Dear ${payload.name}</b>,
            </p>
            <div style="background-color: #f5f9ff; border-left: 4px solid #2e6c80; padding: 12px 15px; margin-bottom: 20px;">
              <p style="margin: 0; font-weight: bold; color: #2e6c80;">User Credentials:</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li><strong>Username:</strong> ${payload.email}</li>
                <li><strong>Password:</strong> ${payload.password}</li>
              </ul>
            </div>
            
            <div style="background-color: #f5f9ff; border-left: 4px solid #2e6c80; padding: 12px 15px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that your account has been successfully created in our system.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.6;">
                You can log in to the portal at <a href="${payload.loginUrl}">${payload.loginUrl}</a> to access your account.
              </p>
            </div>

            <div style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              <p>If you have any questions or need assistance, please contact our support team:</p>
              <p style="margin-top: 10px;">
                <strong>Email:</strong> <a href="mailto:info@samfocus.in" style="color: #2e6c80; text-decoration: none;">info@samfocus.in</a><br>
                <strong>Phone:</strong> <a href="tel:+91 90282 24136" style="color: #2e6c80; text-decoration: none;">+91 90282 24136</a>
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6;">
             <p  style="margin-bottom: 5px; font-size: 16px; line-height: 1.2;">Best Regards,</p>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.6;">Samfocus Technologies Team</p>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Samfocus Technologies Private Limited. All rights reserved.</p>
        </div>
      </div>
      `;

      try {
        await transporter.sendMail({
          from: `"Samfocus Technologies Pvt Ltd" <${process.env.SMTP_EMAIL_USER}>`,
          to: email,
          subject: subject,
          html,
          attachments: [
            {
              filename: 'logo.png',
              path: path.join(process.cwd(), 'attached_assets/logo_white_text.png'),
              cid: 'logo',
            },
          ],
        });
        return res.status(200).json({ message: 'Onboarding email sent successfully!' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to send onboarding email.' });
      }

    default:
      return res.status(400).json({ message: 'Unknown email type' });
  }

  try {
    await transporter.sendMail({
      from: `"Samfocus Technologies Pvt Ltd" <${process.env.SMTP_EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
      attachments: attachments ? attachments : [],
    });

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ message: `Failed to send email.${error}` });
  }
}
