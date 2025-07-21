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
  signupConfirmation: (vendorName, loginUrl) => ({
  subject: 'Welcome to GO AI HUB – Vendor Registration Successful',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">Welcome to GO AI HUB!</h1>
      </div>
      <p>Dear ${vendorName},</p>
      <p>Thank you for registering with GO AI HUB. Your vendor profile has been successfully created. You can now submit your AI solutions and explore collaboration opportunities within our ecosystem.</p>
      <p>To log in, please visit: <a href="${loginUrl}" style="color: #00afaf;">${loginUrl}</a></p>
      <p>If you have any questions, feel free to contact us at <a href="mailto:info@go.com.sa">info@go.com.sa</a>.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">مرحباً بك في GO AI HUB!</h1>
        <p>عزيزي/عزيزتي ${vendorName}،</p>
        <p>شكرًا لتسجيلك في منصة GO AI HUB. تم إنشاء ملفك كمورد بنجاح. يمكنك الآن تقديم حلول الذكاء الاصطناعي الخاصة بك واستكشاف فرص التعاون داخل منظومتنا.</p>
        <p>للدخول، يرجى زيارة: <a href="${loginUrl}" style="color: #00afaf;">${loginUrl}</a></p>
        <p>لأي استفسار، يمكنك التواصل معنا عبر البريد التالي: <a href="mailto:info@goaihub.com">info@goaihub.com</a></p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>مع أطيب التحيات،<br>
          فريق GO AI HUB<br>
          البريد الإلكتروني: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
          الموقع الإلكتروني: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
          ساعات العمل: الأحد–الخميس، 9:00 صباحًا – 5:00 مساءً (بتوقيت السعودية)</p>
        </div>
      </div>
    </div>
  `
}),
  
  passwordReset: (userName, resetLink) => ({
  subject: 'Password Reset – GO AI HUB',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">GO AI HUB - Password Reset</h1>
      </div>
      <p>Dear ${userName},</p>
      <p>We received a request to reset your password for your GO AI HUB account.</p>
      <p>To reset your password, please click the link below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this message or contact our support team.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">إعادة تعيين كلمة المرور - GO AI HUB</h1>
        <p>عزيزي/عزيزتي ${userName}،</p>
        <p>لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك على GO AI HUB.</p>
        <p>لإعادة تعيين كلمة المرور، يرجى الضغط على الرابط التالي:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">إعادة تعيين كلمة المرور</a>
        </div>
        <p>إذا لم تقم بطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة أو التواصل معنا عبر الدعم الفني.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>مع أطيب التحيات،<br>
          فريق GO AI HUB<br>
          البريد الإلكتروني: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
          الموقع الإلكتروني: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
          ساعات العمل: من الأحد إلى الخميس، من الساعة 9:00 صباحاً حتى 5:00 مساءً (بتوقيت السعودية)</p>
        </div>
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