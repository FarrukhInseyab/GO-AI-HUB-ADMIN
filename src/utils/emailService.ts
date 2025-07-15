// Email service for frontend - calls Nodemailer service

const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:3000/api';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin || 'http://localhost:5173';

// Email templates
export const emailTemplates = {
  signupConfirmation: (name: string, confirmationLink: string) => ({
    subject: 'Welcome to GO AI HUB - Confirm Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #ffffff;">
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

  solutionRegistration: (name: string, solutionName: string, solutionLink: string) => ({
    subject: 'GO AI HUB - Solution Registration Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Solution Registration Confirmation</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Thank you for registering your solution <strong>${solutionName}</strong> with GO AI HUB.</p>
        <p>Your solution has been successfully submitted and is now pending review by our evaluation team.</p>
        <p>You can view your solution status by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${solutionLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Solution</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${solutionLink}</p>
        <p>Our team will review your solution and provide feedback as soon as possible.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  technicalApproval: (name: string, solutionName: string, solutionLink: string, feedback: string) => ({
    subject: 'GO AI HUB - Technical Approval for Your Solution',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Technical Approval</h1>
        </div>
        <p>Hello ${name},</p>
        <p>We're pleased to inform you that your solution <strong>${solutionName}</strong> has received technical approval from our evaluation team.</p>
        <p>Technical Feedback:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #00afaf; margin: 20px 0;">
          <p style="margin: 0;">${feedback || 'Your solution meets our technical requirements.'}</p>
        </div>
        <p>You can view your solution status by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${solutionLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Solution</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${solutionLink}</p>
        <p>Your solution is now pending business approval. We'll notify you once the business review is complete.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  businessApproval: (name: string, solutionName: string, solutionLink: string, feedback: string) => ({
    subject: 'GO AI HUB - Business Approval for Your Solution',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Business Approval</h1>
        </div>
        <p>Hello ${name},</p>
        <p>We're pleased to inform you that your solution <strong>${solutionName}</strong> has received business approval from our evaluation team.</p>
        <p>Business Feedback:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #00afaf; margin: 20px 0;">
          <p style="margin: 0;">${feedback || 'Your solution meets our business requirements.'}</p>
        </div>
        <p>You can view your solution status by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${solutionLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Solution</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${solutionLink}</p>
        <p>Congratulations! Your solution is now fully approved and will be visible in the GO AI HUB marketplace.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  solutionCancellation: (name: string, solutionName: string, reason: string) => ({
    subject: 'GO AI HUB - Solution Cancellation Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Solution Cancellation Notice</h1>
        </div>
        <p>Hello ${name},</p>
        <p>We regret to inform you that your solution <strong>${solutionName}</strong> has been cancelled by an administrator.</p>
        <p>Reason for cancellation:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
          <p style="margin: 0;">${reason || 'The solution does not meet our current requirements.'}</p>
        </div>
        <p>If you believe this was done in error or would like to discuss this further, please contact our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  interestSubmission: (name: string, solutionName: string, companyName: string, message: string) => ({
    subject: 'GO AI HUB - New Interest in Your Solution',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">New Interest in Your Solution</h1>
        </div>
        <p>Hello ${name},</p>
        <p>We're excited to inform you that <strong>${companyName}</strong> has expressed interest in your solution <strong>${solutionName}</strong>.</p>
        <p>Their message:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #00afaf; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>
        <p>Our team will review this interest and may contact you for further information.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GO AI HUB. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  contactAssignment: (name: string, solutionName: string, contactName: string, contactEmail: string, comments: string) => ({
    subject: 'GO AI HUB - Contact Person Assigned to Your Interest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00afaf;">Contact Person Assigned</h1>
        </div>
        <p>Hello ${name},</p>
        <p>We're pleased to inform you that a contact person has been assigned to your interest in <strong>${solutionName}</strong>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Contact Person:</strong> ${contactName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${contactEmail}" style="color: #00afaf;">${contactEmail}</a></p>
        </div>
        <p>Additional comments:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #00afaf; margin: 20px 0;">
          <p style="margin: 0;">${comments || 'Your contact person will reach out to you shortly to discuss your interest in more detail.'}</p>
        </div>
        <p>If you have any questions, feel free to reply directly to this email or contact your assigned person.</p>
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
    console.log('Sending email to:', to, 'with type:', type, 'via Email service');
    
    const payload: any = {
      to,
      type,
      name: data.name,
      token: data.token,
      appUrl: APP_URL
    };
    
    // Add subject and html for custom emails
    if (type === 'custom' && data.subject && data.html) {
      payload.subject = data.subject;
      payload.html = data.html;
    }
    
    console.log('Email service URL:', EMAIL_SERVICE_URL);
    console.log('Sending payload with token length:', data.token ? data.token.length : 0);
    
    const response = await fetch(`${EMAIL_SERVICE_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      console.error('Email service error:', response.status, errorData);
      throw new Error(errorData.error || `Failed to send email: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Email service response:', result);
    return result.success;
  } catch (error) {
    console.error('Error sending email through Email service:', error);
    return false;
  }
};

// Wrapper functions for specific email types
export const sendSignupConfirmationEmail = async (
  email: string, 
  name: string, 
  token: string,
  appUrl?: string
): Promise<boolean> => {
  console.log('Sending signup confirmation email to:', email);
  console.log('With token length:', token.length);
  
  const confirmationLink = `${appUrl || APP_URL}/confirm-email?token=${token}`;
  console.log('Confirmation link:', confirmationLink);
  
  return await sendEmail(email, 'signup_confirmation', {
    name,
    token,
    subject: emailTemplates.signupConfirmation(name, confirmationLink).subject,
    html: emailTemplates.signupConfirmation(name, confirmationLink).html
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

export const sendSolutionRegistrationEmail = async (
  email: string,
  name: string,
  solutionName: string,
  solutionId: string
): Promise<boolean> => {
  console.log('Sending solution registration email to:', email);
  
  const solutionLink = `${window.location.origin}/solutions/${solutionId}`;
  
  const emailContent = emailTemplates.solutionRegistration(name, solutionName, solutionLink);
  
  return await sendEmail(email, 'custom', {
    name,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

export const sendTechnicalApprovalEmail = async (
  email: string,
  name: string,
  solutionName: string,
  solutionId: string,
  feedback: string
): Promise<boolean> => {
  console.log('Sending technical approval email to:', email);
  
  const solutionLink = `${window.location.origin}/solutions/${solutionId}`;
  
  const emailContent = emailTemplates.technicalApproval(name, solutionName, solutionLink, feedback);
  
  return await sendEmail(email, 'custom', {
    name,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

export const sendBusinessApprovalEmail = async (
  email: string,
  name: string,
  solutionName: string,
  solutionId: string,
  feedback: string
): Promise<boolean> => {
  console.log('Sending business approval email to:', email);
  
  const solutionLink = `${window.location.origin}/solutions/${solutionId}`;
  
  const emailContent = emailTemplates.businessApproval(name, solutionName, solutionLink, feedback);
  
  return await sendEmail(email, 'custom', {
    name,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

export const sendSolutionCancellationEmail = async (
  email: string,
  name: string,
  solutionName: string,
  reason: string
): Promise<boolean> => {
  console.log('Sending solution cancellation email to:', email);
  
  const emailContent = emailTemplates.solutionCancellation(name, solutionName, reason);
  
  return await sendEmail(email, 'custom', {
    name,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

export const sendInterestSubmissionEmail = async (
  email: string,
  name: string,
  solutionName: string,
  companyName: string,
  message: string
): Promise<boolean> => {
  console.log('Sending interest submission email to:', email);
  
  const emailContent = emailTemplates.interestSubmission(name, solutionName, companyName, message);
  
  return await sendEmail(email, 'custom', {
    name,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

export const sendContactAssignmentEmail = async (
  email: string,
  name: string,
  solutionName: string,
  contactName: string,
  contactEmail: string,
  comments: string
): Promise<boolean> => {
  console.log('Sending contact assignment email to:', email);
  
  const emailContent = emailTemplates.contactAssignment(name, solutionName, contactName, contactEmail, comments);
  
  return await sendEmail(email, 'custom', {
    name,
    subject: emailContent.subject,
    html: emailContent.html
  });
};

export default {
  sendSignupConfirmationEmail,
  sendPasswordResetEmail,
  sendSolutionRegistrationEmail,
  sendTechnicalApprovalEmail,
  sendBusinessApprovalEmail,
  sendSolutionCancellationEmail,
  sendInterestSubmissionEmail,
  sendContactAssignmentEmail
};