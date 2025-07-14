import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Create a transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'decisions.social',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'alerts@decisions.social',
    pass: 'DuONN7qH?MP&'
  }
});

// Email templates
const emailTemplates = {
  signupConfirmation: (name: string, confirmationLink: string) => ({
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
  
  passwordReset: (name: string, resetLink: string) => ({
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

// Email service functions
export const sendSignupConfirmationEmail = async (
  email: string, 
  name: string, 
  confirmationToken: string
): Promise<boolean> => {
  try {
    const confirmationLink = `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/confirm-email?token=${confirmationToken}`;
    
    const template = emailTemplates.signupConfirmation(name, confirmationLink);
    
    const mailOptions = {
      from: '"GO AI HUB" <alerts@decisions.social>',
      to: email,
      subject: template.subject,
      html: template.html
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending signup confirmation email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string, 
  name: string, 
  resetToken: string
): Promise<boolean> => {
  try {
    const resetLink = `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const template = emailTemplates.passwordReset(name, resetLink);
    
    const mailOptions = {
      from: '"GO AI HUB" <alerts@decisions.social>',
      to: email,
      subject: template.subject,
      html: template.html
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Verify SMTP connection
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('SMTP server connection successful');
    return true;
  } catch (error) {
    console.error('SMTP server connection failed:', error);
    return false;
  }
};

export default {
  sendSignupConfirmationEmail,
  sendPasswordResetEmail,
  verifyEmailConnection
};