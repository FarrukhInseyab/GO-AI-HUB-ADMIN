// Email service for frontend - calls Nodemailer service

const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:3000';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

// Email templates
export const emailTemplates = {
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

// Function to call the Supabase Edge Function for sending emails
export const sendEmail = async (
  to: string,
  type: string,
  data: {
    name?: string;
    token?: string;
  }
): Promise<boolean> => {
  try {
    console.log('Sending email to:', to, 'with type:', type, 'via Nodemailer service');
    
    const response = await fetch(`${EMAIL_SERVICE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        type,
        name: data.name,
        token: data.token,
        appUrl: APP_URL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      console.error('Nodemailer service error:', response.status, errorData);
      throw new Error(errorData.error || `Failed to send email: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Nodemailer service response:', result);
    return result.success;
  } catch (error) {
    console.error('Error sending email through Nodemailer service:', error);
    return false;
  }
};

// Wrapper functions for specific email types
export const sendSignupConfirmationEmail = async (
  email: string, 
  name: string, 
  token: string
): Promise<boolean> => {
  console.log('Sending signup confirmation email to:', email);
  console.log('With token:', token.substring(0, 5) + '...');
  
  return await sendEmail(email, 'signup_confirmation', {
    name,
    token
  });
};

export const sendPasswordResetEmail = async (
  email: string, 
  name: string,
  token: string
): Promise<boolean> => {
  console.log('Sending password reset email to:', email);
  console.log('With token:', token.substring(0, 5) + '...');
  
  return await sendEmail(email, 'password_reset', {
    name,
    token
  });
};

export default {
  sendSignupConfirmationEmail,
  sendPasswordResetEmail
};