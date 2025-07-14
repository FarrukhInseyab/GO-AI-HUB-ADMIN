import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'signup_confirmation' | 'password_reset';
  name?: string;
  token?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Parse request body
    const { to, subject, html, type, name, token }: EmailRequest = await req.json()

    if (!to || !type) {
      throw new Error('Missing required fields: to and type')
    }

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: "decisions.social",
        port: 465,
        tls: true,
        auth: {
          username: "alerts@decisions.social",
          password: "DuONN7qH?MP&",
        },
      },
    });

    // Generate email content based on type
    let emailSubject = subject;
    let emailHtml = html;

    if (!subject || !html) {
      if (type === 'signup_confirmation') {
        const confirmationLink = `${Deno.env.get('APP_URL') || 'https://localhost:5173'}/confirm-email?token=${token}`;
        emailSubject = 'Welcome to GO AI HUB - Confirm Your Account';
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #00afaf;">Welcome to GO AI HUB!</h1>
            </div>
            <p>Hello ${name || 'there'},</p>
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
        `;
      } else if (type === 'password_reset') {
        const resetLink = `${Deno.env.get('APP_URL') || 'https://localhost:5173'}/reset-password?token=${token}`;
        emailSubject = 'GO AI HUB - Password Reset Request';
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #00afaf;">Password Reset</h1>
            </div>
            <p>Hello ${name || 'there'},</p>
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
        `;
      }
    }

    // Send email
    await client.send({
      from: "GO AI HUB <alerts@decisions.social>",
      to: to,
      subject: emailSubject,
      html: emailHtml,
    });

    await client.close();

    // Log email sending for audit
    await supabaseClient
      .from('email_logs')
      .insert({
        user_id: user.id,
        email_type: type,
        recipient: to,
        sent_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Email Service Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})