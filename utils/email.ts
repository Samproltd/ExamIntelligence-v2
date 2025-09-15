import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

// Define interface for email data
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
}

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid initialized');
}

// Read and encode the logo image as Base64
const logoPath = path.join(process.cwd(), 'public/images/logo_white_text.png');
let logoDataUrl = '';
try {
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  logoDataUrl = `data:image/png;base64,${logoBase64}`;
} catch (err) {
  console.error('Could not read logo_white_text.png:', err);
  // Fallback to empty or a placeholder
  logoDataUrl = '';
}

// Function to send email with certificate
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Use SendGrid if API key is available
    if (process.env.SENDGRID_API_KEY) {
      const msg = {
        to: emailData.to,
        from: process.env.EMAIL_FROM || '',
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments
          ? emailData.attachments.map(attachment => {
              let content;
              if (Buffer.isBuffer(attachment.content)) {
                content = attachment.content.toString('base64');
              } else {
                content = Buffer.from(String(attachment.content)).toString('base64');
              }
              return {
                filename: attachment.filename,
                content: content,
                type: attachment.contentType || 'application/pdf',
                disposition: 'attachment',
              };
            })
          : undefined,
      };

      await sgMail.send(msg);
      console.log('Email sent using SendGrid');
      return true;
    } else {
      // Fallback to nodemailer for development
      const testAccount = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Boolean(process.env.EMAIL_SECURE) || false,
        auth: {
          user: process.env.EMAIL_USER || testAccount.user,
          pass: process.env.EMAIL_PASS || testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Samfocus Technologies PVT. LTD." <${process.env.EMAIL_FROM || 'certificates@samprolicense.com'}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments || [],
      });

      console.log('Email sent via Nodemailer: %s', info.messageId);

      // For development, log preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Function to generate congratulations email content with certificate
export const generateCongratulationsEmail = (data: {
  studentName: string;
  studentEmail: string;
  examName: string;
  score: number;
  percentage: number;
  certificateId: string;
  examDate: Date;
}): EmailData => {
  // First generate the HTML for the congratulations email
  const emailHtml = `
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
          <img src="${logoDataUrl}" alt="SAMFOCUS TECHNOLOGIES PVT. LTD." />
        </div>
        
        <div class="content">
          <h1>Congratulations, ${data.studentName}!</h1>
          
          <p>We are pleased to inform you that you have <span class="highlight">successfully passed</span> the "${data.examName}" exam!</p>
          
          <div class="score-box">
            <p><strong>Your Results:</strong></p>
            <p>Score: <span class="highlight">${data.score}</span></p>
            <p>Percentage: <span class="highlight">${data.percentage}%</span></p>
          </div>
          
          <p>This achievement demonstrates your knowledge and dedication to excellence. A certificate of completion has been attached to this email as recognition of your accomplishment.</p>
          
          <p>You can also access and download your certificate from your student dashboard at any time.</p>
          
          <p>Keep up the good work and continue your journey of learning and growth with SAMFOCUS TECHNOLOGIES PVT. LTD.</p>
          
          <p>Best regards,<br>
          The SAMFOCUS TECHNOLOGIES Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} SAMFOCUS TECHNOLOGIES PVT. LTD. All rights reserved.</p>
          <p>www.samfocus.in | info@samfocus.in | +91 9028224136</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Return email data object (without attaching PDF yet - we'll handle that separately)
  return {
    to: data.studentEmail,
    subject: `Congratulations! You passed the ${data.examName} exam`,
    html: emailHtml,
    // No attachments by default, we'll handle them separately when generating certificates
  };
};
