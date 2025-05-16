const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

/**
 * Generate an Access Token for Twilio Voice
 */
router.get('/', (req, res) => {
  console.log('Token request received');
  
  // Get credentials from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  // Log credentials presence (not values)
  console.log('Credentials check:', {
    hasAccountSid: !!accountSid,
    hasApiKey: !!apiKey, 
    hasApiSecret: !!apiSecret,
    hasTwimlAppSid: !!twimlAppSid
  });

  // Check if we have all the required configuration
  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    console.error('Missing Twilio credentials');
    return res.status(500).json({
      error: 'Missing required Twilio credentials. Please check server configuration.'
    });
  }

  try {
    // Create an access token with a longer TTL (24 hours)
    const accessToken = new AccessToken(
      accountSid,
      apiKey,
      apiSecret,
      { 
        identity: 'browser-user',
        ttl: 86400 // 24 hours in seconds
      }
    );

    // Create a Voice grant with all permissions
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
      pushCredentialSid: null // Not needed for web
    });

    // Add the grant to the token
    accessToken.addGrant(voiceGrant);

    // Generate the token
    const token = accessToken.toJwt();
    
    console.log('Token generated successfully');

    // Return the token
    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: `Failed to generate token: ${error.message}` });
  }
});

module.exports = router; 