// Email service for frontend - calls Nodemailer service

const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:3000/api';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin || 'http://localhost:5173';

// Email templates
export const emailTemplates = {
   signupConfirmation: (vendorName:string, loginUrl:string) => ({
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

  solutionRegistration: (name:string, solutionName:string, solutionLink:string) => ({
  subject: 'GO AI HUB – Solution Registration Confirmation',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">Solution Registration Confirmed</h1>
      </div>
      <p>Dear ${name},</p>
      <p>Thank you for registering your AI solution, <strong>${solutionName}</strong>, with GO AI HUB.</p>
      <p>Your solution has been successfully submitted and is now pending review by our evaluation team.</p>
      <p>You can view your solution status by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${solutionLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Solution</a>
      </div>
      <p>If the button doesn’t work, you can also copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${solutionLink}</p>
      <p>Our team will review your solution and provide feedback as soon as possible.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">تأكيد تسجيل الحل</h1>
        <p>عزيزي/عزيزتي ${name}،</p>
        <p>شكرًا لتسجيل حل الذكاء الاصطناعي الخاص بك، <strong>${solutionName}</strong>، على منصة GO AI HUB.</p>
        <p>تم تقديم الحل بنجاح وهو الآن قيد المراجعة من قبل فريق التقييم لدينا.</p>
        <p>يمكنك عرض حالة الحل الخاص بك عبر النقر على الزر أدناه:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${solutionLink}" style="background-color: #00afaf; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">عرض الحل</a>
        </div>
        <p>إذا لم يعمل الزر، يمكنك أيضًا نسخ الرابط التالي ولصقه في متصفحك:</p>
        <p style="word-break: break-all; color: #666;">${solutionLink}</p>
        <p>سيقوم فريقنا بمراجعة الحل الخاص بك وتزويدك بالملاحظات في أقرب وقت ممكن.</p>
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
,

  technicalApproval: (vendorName:string, solutionName:string, solutionLink:string,feedback:string) => ({
  subject: 'Congratulations! Your AI Solution Has Been Accepted',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">GO AI HUB - Solution Accepted</h1>
      </div>
      <p>Dear ${vendorName},</p>
      <p>We are pleased to inform you that your submitted AI solution, <strong>${solutionName}</strong>, has been successfully accepted on GO AI HUB.</p>
      <p>Please visit: <a href="${solutionLink}" style="color: #00afaf;">${solutionLink}</a></p>
      <p>You may now proceed with the next steps for onboarding and enablement. Our team will be in touch with you shortly for any required formalities.</p>
      <p>Thank you for your innovative contribution.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">تهانينا! تم قبول حل الذكاء الاصطناعي الخاص بك</h1>
        <p>عزيزي/عزيزتي ${vendorName}،</p>
        <p>يسعدنا إبلاغك بأنه قد تم قبول الحل المقدم، <strong>${solutionName}</strong>، على منصة GO AI HUB.</p>
        <p>رابط الحل على المنصة: <a href="${solutionLink}" style="color: #00afaf;">${solutionLink}</a></p>
        <p>سيقوم فريقنا بالتواصل معك قريبًا لاستكمال الإجراءات اللازمة.</p>
        <p>شكرًا لمساهمتك المتميزة.</p>
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
}),

  businessApproval: (vendorName: string, solutionName: string, solutionLink: string, feedback: string) => ({
    subject: 'Congratulations! Your AI Solution Has Been Accepted',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">GO AI HUB - Solution Accepted</h1>
      </div>
      <p>Dear ${vendorName},</p>
      <p>We are pleased to inform you that your submitted AI solution, <strong>${solutionName}</strong>, has been successfully accepted on GO AI HUB.</p>
      <p>Please visit: <a href="${solutionLink}" style="color: #00afaf;">${solutionLink}</a></p>
      <p>You may now proceed with the next steps for onboarding and enablement. Our team will be in touch with you shortly for any required formalities.</p>
      <p>Thank you for your innovative contribution.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">تهانينا! تم قبول حل الذكاء الاصطناعي الخاص بك</h1>
        <p>عزيزي/عزيزتي ${vendorName}،</p>
        <p>يسعدنا إبلاغك بأنه قد تم قبول الحل المقدم، <strong>${solutionName}</strong>، على منصة GO AI HUB.</p>
        <p>رابط الحل على المنصة: <a href="${solutionLink}" style="color: #00afaf;">${solutionLink}</a></p>
        <p>سيقوم فريقنا بالتواصل معك قريبًا لاستكمال الإجراءات اللازمة.</p>
        <p>شكرًا لمساهمتك المتميزة.</p>
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
  }),

  solutionCancellation: (name:string, solutionName:string, reason:string) => ({
  subject: 'GO AI HUB – Solution Cancellation Notice',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff6b6b;">Solution Cancellation</h1>
      </div>
      <p>Dear ${name},</p>
      <p>We regret to inform you that your submitted AI solution, <strong>${solutionName}</strong>, has been cancelled by our team.</p>
      <p>Reason for cancellation:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
        <p style="margin: 0;">${reason || 'The solution does not meet our current requirements.'}</p>
      </div>
      <p>If you believe this decision was made in error or would like to discuss it further, please contact our support team.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #ff6b6b;">إشعار إلغاء الحل</h1>
        <p>عزيزي/عزيزتي ${name}،</p>
        <p>نأسف لإبلاغك بأنه قد تم إلغاء حل الذكاء الاصطناعي المقدم، <strong>${solutionName}</strong>، من قبل فريقنا.</p>
        <p>سبب الإلغاء:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-right: 4px solid #ff6b6b; margin: 20px 0;">
          <p style="margin: 0;">${reason || 'الحل لا يتوافق مع متطلباتنا الحالية.'}</p>
        </div>
        <p>إذا كنت تعتقد أن هذا القرار تم عن طريق الخطأ أو ترغب بمناقشة الأمر بشكل أكبر، يرجى التواصل مع فريق الدعم لدينا.</p>
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
}),

  interestSubmission: (name:string, solutionName:string, companyName:string, message:string) => ({
  subject: 'GO AI HUB – New Interest in Your AI Solution',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">New Interest Notification</h1>
      </div>
      <p>Dear ${name},</p>
      <p>We are pleased to inform you that <strong>${companyName}</strong> has expressed interest in your AI solution, <strong>${solutionName}</strong>.</p>
      <p>Their message:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #00afaf; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">"${message || 'No message provided.'}"</p>
      </div>
      <p>Our team will review this interest and may contact you for further details or to facilitate communication.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">إشعار اهتمام جديد بحلك</h1>
        <p>عزيزي/عزيزتي ${name}،</p>
        <p>يسعدنا إبلاغك بأن <strong>${companyName}</strong> قد أبدت اهتمامًا بحل الذكاء الاصطناعي الخاص بك، <strong>${solutionName}</strong>.</p>
        <p>رسالتهم:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-right: 4px solid #00afaf; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message || 'لم يتم تقديم رسالة.'}"</p>
        </div>
        <p>سيقوم فريقنا بمراجعة هذا الاهتمام وقد يتواصل معك لمزيد من التفاصيل أو لتسهيل التواصل.</p>
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
,

  contactAssignment: (name:string, solutionName:string, contactName:string, contactEmail:string, comments:string) => ({
  subject: 'GO AI HUB – Contact Person Assigned to Your Interest',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00afaf;">Contact Person Assigned</h1>
      </div>
      <p>Dear ${name},</p>
      <p>We are pleased to inform you that a contact person has been assigned regarding your interest in the AI solution <strong>${solutionName}</strong>.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Contact Person:</strong> ${contactName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${contactEmail}" style="color: #00afaf;">${contactEmail}</a></p>
      </div>
      <p>Additional comments:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #00afaf; margin: 20px 0;">
        <p style="margin: 0;">${comments || 'Your assigned contact will reach out to you shortly to discuss your interest in more detail.'}</p>
      </div>
      <p>If you have any questions, feel free to reply directly to this email or contact your assigned person.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p>Best regards,<br>
        GO AI HUB Team<br>
        Email: <a href="mailto:ai.support@go.com.sa">ai.support@go.com.sa</a><br>
        Website: <a href="https://www.goaihub.ai" target="_blank">www.goaihub.ai</a><br>
        Working Hours: Sunday–Thursday, 9:00 AM – 5:00 PM (KSA Time)</p>
      </div>
      <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">
      <div dir="rtl" style="text-align: right; font-family: Arial, sans-serif;">
        <h1 style="color: #00afaf;">تم تعيين شخص للتواصل معك</h1>
        <p>عزيزي/عزيزتي ${name}،</p>
        <p>يسعدنا إبلاغك بأنه قد تم تعيين شخص للتواصل معك بخصوص اهتمامك بحل الذكاء الاصطناعي <strong>${solutionName}</strong>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>الشخص المعين:</strong> ${contactName}</p>
          <p style="margin: 0 0 10px 0;"><strong>البريد الإلكتروني:</strong> <a href="mailto:${contactEmail}" style="color: #00afaf;">${contactEmail}</a></p>
        </div>
        <p>تعليقات إضافية:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-right: 4px solid #00afaf; margin: 20px 0;">
          <p style="margin: 0;">${comments || 'سيقوم الشخص المعين بالتواصل معك قريبًا لمناقشة اهتمامك بمزيد من التفاصيل.'}</p>
        </div>
        <p>إذا كان لديك أي استفسار، لا تتردد في الرد مباشرةً على هذا البريد الإلكتروني أو التواصل مع الشخص المعين.</p>
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
,
  
  passwordReset: (userName:string, resetLink:string) => ({
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