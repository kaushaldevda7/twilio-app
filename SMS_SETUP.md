# Setting Up Twilio SMS Messaging

This guide will help you set up and configure the SMS messaging functionality in your Twilio application.

## Prerequisites

Before you begin, ensure you have:

1. A Twilio account with a phone number that supports SMS
2. Your Twilio account SID and auth token
3. Ngrok or similar for exposing local development server (if working locally)

## Configuration Steps

### 1. Update Environment Variables

Make sure your `.env` file includes the following variables:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
NGROK_URL=your_ngrok_url_or_server_url
SMS_WEBHOOK_URL=your_server_url/api/sms/webhook
```

### 2. Configure Webhook in Twilio Console

1. Log into your [Twilio Console](https://www.twilio.com/console)
2. Navigate to Phone Numbers > Manage > Active Numbers
3. Click on your Twilio phone number
4. Under "Messaging", set the webhook URL for when "A Message Comes In"
5. Set the URL to: `https://your-domain.com/api/sms/webhook` (replace with your actual domain)
6. Make sure the HTTP method is set to POST
7. Save your changes

### 3. Test the Messaging Feature

1. Start your server: `npm run start` or `node server/index.js`
2. Open your application in a browser
3. Click on the messaging button to open the messaging panel
4. Start a new conversation with a valid phone number
5. Send a test message

## Troubleshooting

If you encounter issues:

1. **Messages not showing up:**
   - Check your browser console for errors
   - Verify your Twilio webhook is correctly configured
   - Check server logs for any errors in receiving or sending messages

2. **Socket.io connection issues:**
   - Make sure your server is running
   - Check for CORS issues in the browser console
   - Verify that socket.io is properly initialized on both the client and server

3. **Error sending messages:**
   - Verify your Twilio credentials are correct
   - Check that your Twilio phone number supports SMS
   - Ensure the recipient phone number is in the correct format (with country code)

## API Endpoints

Your application includes the following API endpoints for SMS functionality:

- `GET /api/sms/conversations` - Get a list of all conversations
- `GET /api/sms/history/:number` - Get message history with a specific number
- `POST /api/sms/send` - Send a new message (requires `to` and `body` parameters)
- `POST /api/sms/webhook` - Webhook for receiving incoming messages (used by Twilio)

## Additional Configuration

For production deployment:

1. Ensure your server has SSL enabled (Twilio requires HTTPS for webhooks)
2. Update the `SMS_WEBHOOK_URL` in your production environment
3. Set appropriate CORS settings for your production domain
4. Consider implementing message encryption for sensitive communications 