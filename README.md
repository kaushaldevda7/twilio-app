# Twilio Softphone Application

A web-based softphone application built with Node.js (Express), React, and Twilio Programmable Voice. It enables making and receiving calls between a web browser and regular phone numbers.

## Features

- 📱 Phone bubble UI that expands to show a dialpad
- 📞 Make outbound calls to real phone numbers
- 📲 Receive incoming calls from real phone numbers
- 🔊 Call controls (mute, hang up)
- ⏱️ Call duration tracking
- 🔄 Support for both production and development environments

## Prerequisites

Before setting up this application, you'll need:

1. A Twilio account ([Sign up here](https://www.twilio.com/try-twilio))
2. A Twilio phone number with voice capabilities
3. A TwiML App configured in your Twilio console
4. API credentials (Account SID, Auth Token, API Key, API Secret)
5. Node.js and npm installed on your machine
6. For local development: [ngrok](https://ngrok.com/) for exposing your local server to the internet

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd twilio-softphone
```

### 2. Set up environment variables

Copy the example environment file and update it with your Twilio credentials:

```bash
cp server/.env.example server/.env
```

Then edit the `.env` file with your Twilio details:

```
# Server configuration
PORT=5000
NODE_ENV=development

# Twilio configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Development with ngrok
NGROK_URL=https://your-ngrok-url.ngrok.io
```

### 3. Install dependencies

Install server dependencies:

```bash
cd server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
```

### 4. Start ngrok (for development)

To receive incoming calls during development, you need to expose your local server to the internet using ngrok:

```bash
ngrok http 5000
```

Copy the HTTPS URL provided by ngrok (e.g., `https://your-subdomain.ngrok.io`) and update your `.env` file:

```
NGROK_URL=https://your-subdomain.ngrok.io
```

### 5. Configure Twilio

In your Twilio console:

1. Go to your TwiML App and set the Voice Request URL to:
   - For development: `https://your-ngrok-url.ngrok.io/api/call/incoming`
   - For production: `https://placeholder.com/api/call/incoming`

2. Go to your Twilio phone number and set the webhook for incoming calls to:
   - For development: `https://your-ngrok-url.ngrok.io/api/call/incoming`
   - For production: `https://placeholder.com/api/call/incoming`

### 6. Start the application

Start the server:

```bash
cd ../server
npm run dev
```

In a new terminal, start the client:

```bash
cd ../client
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click the phone bubble in the bottom right corner to open the dialpad
3. Enter a phone number and click the call button to make an outbound call
4. When someone calls your Twilio number, you'll receive an incoming call notification

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your .env file
2. Update the domain in your config to your actual domain
3. Build the client:

```bash
cd client
npm run build
```

4. Deploy both the server and client build to your production environment.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Twilio](https://www.twilio.com/) for the Programmable Voice API
- [React](https://reactjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend framework 