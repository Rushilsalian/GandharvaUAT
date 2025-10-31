import nodemailer from 'nodemailer';

// Initialize SMTP transporter
let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn('SMTP configuration not found - email notifications disabled');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!transporter) {
    console.log('Email service not configured - skipping email to:', params.to);
    return false;
  }

  try {
    console.log('Sending email to:', params.to);
    const result = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('SMTP email error:', error);
    return false;
  }
}

// Generate secure random password
export function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Send welcome email with temporary password
export async function sendWelcomeEmail(userEmail: string, userName: string, temporaryPassword: string): Promise<boolean> {
  const emailParams: EmailParams = {
    to: userEmail,
    from: process.env.SMTP_USER || 'noreply@company.com',
    subject: 'Welcome - Your Account Has Been Created',
    text: `Dear ${userName},

Your account has been successfully created!

Login Details:
Email: ${userEmail}
Temporary Password: ${temporaryPassword}

Please log in and change your password immediately for security.

Thank you!`,
    html: `
      <h2>Welcome ${userName}!</h2>
      <p>Your account has been successfully created.</p>
      
      <h3>Login Details:</h3>
      <ul>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></li>
      </ul>
      
      <p><strong>Important:</strong> Please log in and change your password immediately for security.</p>
      
      <p>Thank you!</p>
    `
  };

  return await sendEmail(emailParams);
}

// Send password reset email
export async function sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const emailParams: EmailParams = {
    to: userEmail,
    from: process.env.SMTP_USER || 'noreply@company.com',
    subject: 'Password Reset Request',
    text: `Dear ${userName},

You have requested to reset your password. Please click the link below to reset your password:

${resetUrl}

This link will expire in 15 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Thank you!`,
    html: `
      <h2>Password Reset Request</h2>
      <p>Dear ${userName},</p>
      
      <p>You have requested to reset your password. Please click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      
      <p><strong>Important:</strong> This link will expire in 15 minutes for security reasons.</p>
      
      <p>If you did not request this password reset, please ignore this email.</p>
      
      <p>Thank you!</p>
    `
  };

  return await sendEmail(emailParams);
}

// Send investment receipt email
export async function sendInvestmentReceipt(
  userEmail: string, 
  userName: string, 
  amount: number, 
  investmentRemark: string, 
  transactionNo: string
): Promise<boolean> {
  const receiptDate = new Date().toLocaleDateString('en-IN');
  
  const emailParams: EmailParams = {
    to: userEmail,
    from: process.env.SMTP_USER || 'noreply@company.com',
    subject: `Investment Receipt - ${transactionNo}`,
    text: `Dear ${userName},

Thank you for your investment! Here are the details:

Transaction Number: ${transactionNo}
Amount: ₹${amount.toLocaleString('en-IN')}
Remark: ${investmentRemark}
Date: ${receiptDate}

This is a temporary receipt. Your official receipt will be processed shortly.

Thank you for choosing us!`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">Investment Receipt</h2>
        <p>Dear ${userName},</p>
        
        <p>Thank you for your investment! Here are the details:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Transaction Number:</td>
              <td style="padding: 8px 0;">${transactionNo}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Remark:</td>
              <td style="padding: 8px 0;">${investmentRemark}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Date:</td>
              <td style="padding: 8px 0;">${receiptDate}</td>
            </tr>
          </table>
        </div>
        
        <p><em>This is a temporary receipt. Your official receipt will be processed shortly.</em></p>
        
        <p>Thank you for choosing us!</p>
      </div>
    `
  };

  return await sendEmail(emailParams);
}