// Email service for frontend - calls Supabase Edge Function

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    subject?: string;
    html?: string;
  }
): Promise<boolean> => {
  try {
    if (!SUPABASE_URL) {
      console.error('Missing Supabase URL configuration');
      return false;
    }
    
    // Get current session token or use anon key as fallback
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token || SUPABASE_ANON_KEY;
    
    if (!accessToken) {
      console.error('No access token available for edge function call');
      return false;
    }
    
    console.log('Calling edge function with token type:', sessionData.session ? 'Session token' : 'Anon key');
    console.log('Sending email to:', to, 'with type:', type);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to,
        type,
        ...data
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
      console.error('Email service error:', response.status, errorData, response.headers);
      throw new Error(errorData.error || `Failed to send email: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Email service response:', result);
    return result.success;
  } catch (error) {
    console.error('Error sending email through edge function:', error);
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
  console.log('With token:', token);
  const template = emailTemplates.signupConfirmation(
    name, 
    `${window.location.origin}/confirm-email?token=${token}`
  );
  
  return sendEmail(email, 'signup_confirmation', {
    name,
    token,
    subject: template.subject,
    html: template.html
  });
};

export const sendPasswordResetEmail = async (
  email: string, 
  name: string,
  token: string
): Promise<boolean> => {
  console.log('Sending password reset email to:', email);
  console.log('With token:', token);
  const template = emailTemplates.passwordReset(
    name, 
    `${window.location.origin}/reset-password?token=${token}`
  );
  
  return sendEmail(email, 'password_reset', {
    name,
    token,
    subject: template.subject,
    html: template.html
  });
};

// Import supabase client
import { supabase } from '../lib/supabase';


export default {
  sendSignupConfirmationEmail,
  sendPasswordResetEmail
};