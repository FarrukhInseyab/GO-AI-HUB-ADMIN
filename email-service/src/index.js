require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create transporter
const transporter = nodemailer.createTransport({
  host: "decisions.social",
  port: 465,
  secure: true,
  auth: {
    user: "alerts@decisions.social",
    pass: "3?%-.v7pwsaz"
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Email templates
const emailTemplates = {
  signupConfirmation: (name, confirmationLink) => ({
    subject: 'Welcome to GO AI HUB - Confirm Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Welcome to GO AI HUB!</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Thank you for signing up for GO AI HUB. We're excited to have you join our platform.</p>
        <p>Please confirm your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirm Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${confirmationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  passwordReset: (name, resetLink) => ({
    subject: 'GO AI HUB - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Password Reset</h1>
        </div>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your GO AI HUB account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// API endpoints
app.post('/api/send-email', async (req, res) => {
  try {
    console.log('Received email request:', req.body);
    
    const { to, type, name, token, appUrl, subject, html } = req.body;

    if (!to) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: to is required' 
      });
    }
    
    console.log(`Sending ${type || 'custom'} email to: ${to} with token: ${token?.substring(0, 5)}...`);
    
    let emailContent;
    
    if (type === 'signup_confirmation') {
      const confirmationLink = `${appUrl || process.env.APP_URL}/confirm-email?token=${token}`;
      emailContent = emailTemplates.signupConfirmation(name || to.split('@')[0], confirmationLink);
    } else if (type === 'password_reset') {
      const resetLink = `${appUrl || process.env.APP_URL}/reset-password?token=${token}`;
      emailContent = emailTemplates.passwordReset(name || to.split('@')[0], resetLink);
    } else if (type === 'custom') {
      // For custom emails, use the provided subject and html
      if (!subject || !html) {
        return res.status(400).json({ 
          success: false, 
          error: 'For custom emails, subject and html are required' 
        });
      }
      emailContent = { subject, html };
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email type. Supported types: signup_confirmation, password_reset, custom' 
      });
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'alerts@decisions.social',
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    emailServiceReady: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email service running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Email API: http://localhost:${PORT}/api/send-email`);
  console.log(`Allowed origins: ${process.env.ALLOWED_ORIGINS || '*'}`);
});