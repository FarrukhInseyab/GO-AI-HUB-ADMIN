# Email Service for GO AI HUB

This is a standalone email service using Nodemailer to handle email sending for the GO AI HUB application.

## Features

- Sends signup confirmation emails
- Sends password reset emails
- Uses Nodemailer with SMTP
- Provides a simple REST API

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=3000
   APP_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   EMAIL_FROM=alerts@decisions.social
   ```

3. Start the service:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Send Email
`POST /api/send-email`

Request body:
```json
{
  "to": "recipient@example.com",
  "type": "signup_confirmation",
  "name": "Recipient Name",
  "token": "verification-token",
  "appUrl": "https://yourapplication.com"
}
```

Supported email types:
- `signup_confirmation`
- `password_reset`

### Health Check
`GET /health`

Returns the service status and current timestamp.

## Integration with Main Application

Update your frontend application to call this service instead of using Supabase Edge Functions.