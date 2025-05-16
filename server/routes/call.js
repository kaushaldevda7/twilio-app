const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;

// Helper to determine the correct base URL for webhooks
const getBaseUrl = (req) => {
  const environment = process.env.NODE_ENV || 'development';
  if (environment === 'production') {
    return 'https://placeholder.com';
  } else {
    return process.env.NGROK_URL || `http://${req.headers.host}`;
  }
};

// Import the twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Cache for call statuses to ensure faster response and consistency
// between webhook updates and API polling
const callStatusCache = new Map();

/**
 * Get the status of a specific call
 */
router.get('/status/:callSid', async (req, res) => {
  const { callSid } = req.params;
  
  if (!callSid) {
    return res.status(400).json({ error: 'Call SID is required' });
  }
  
  try {
    // First check our local cache for the most up-to-date status
    const cachedCall = callStatusCache.get(callSid);
    
    if (cachedCall) {
      console.log(`Returning cached status for call ${callSid}: ${cachedCall.status}`);
      
      // Also emit this status via WebSocket for real-time update
      if (global.io) {
        global.io.to(`call:${callSid}`).emit('call-status-update', {
          callSid: callSid,
          status: cachedCall.status
        });
      }
      
      return res.json(cachedCall);
    }
    
    // If not in cache, fetch from Twilio API
    const call = await client.calls(callSid).fetch();
    
    console.log(`Status check for call ${callSid}: ${call.status}`);
    
    // Update our cache
    const callData = { 
      callSid: call.sid,
      status: call.status,
      direction: call.direction,
      duration: call.duration
    };
    
    callStatusCache.set(callSid, callData);
    
    // Also emit this status via WebSocket for real-time update
    if (global.io) {
      global.io.to(`call:${callSid}`).emit('call-status-update', {
        callSid: callSid,
        status: call.status
      });
    }
    
    res.json(callData);
  } catch (error) {
    console.error('Error fetching call status:', error);
    res.status(500).json({ error: `Failed to get call status: ${error.message}` });
  }
});

/**
 * Handle outgoing calls from the browser using REST API with Conference
 */
router.post('/outgoing', async (req, res) => {
  console.log('Received outgoing call request:', req.body);
  
  const { To: phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Please provide a phone number to call.' });
  }

  try {
    // Format the phone number if needed
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('client:')) {
      formattedNumber = '+1' + phoneNumber.replace(/\D/g, '');
    }
    
    console.log(`Making conference call to ${formattedNumber}`);
    
    // Generate a unique conference name
    const conferenceName = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`Generated conference name: ${conferenceName}`);
    
    // Create TwiML for a conference call
    const twiml = new VoiceResponse();
    twiml.say('Your call is being connected. Please wait.');
    const dial = twiml.dial({
      timeout: 30,
      callerId: process.env.TWILIO_PHONE_NUMBER,
      record: 'record-from-answer',
    });
    
    // Add the recipient to a conference
    dial.conference({
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      statusCallback: `${getBaseUrl(req)}/api/call/conference-status`,
      statusCallbackEvent: ['start', 'end', 'join', 'leave'],
      waitUrl: 'https://demo.twilio.com/docs/voice.xml',
      waitMethod: 'GET'
    }, conferenceName);
    
    // Make the outgoing call
    const call = await client.calls.create({
      to: formattedNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: twiml.toString(),
      statusCallback: `${getBaseUrl(req)}/api/call/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });
    
    console.log(`Call initiated with SID: ${call.sid} to ${formattedNumber}`);
    console.log(`Conference name: ${conferenceName}`);
    
    // Return the call information
    const responseData = { 
      callSid: call.sid, 
      status: 'initiated',
      conferenceName: conferenceName
    };
    
    // Emit initial status via WebSocket
    if (global.io) {
      global.io.emit('call-initiated', responseData);
    }
    
    return res.json(responseData);
    
  } catch (error) {
    console.error('Error making call:', error);
    return res.status(500).json({ 
      error: `Failed to initiate call: ${error.message}`
    });
  }
});

/**
 * Handle conference status events
 */
router.post('/conference-status', (req, res) => {
  const { 
    ConferenceSid, 
    StatusCallbackEvent, 
    ConferenceName,
    FriendlyName
  } = req.body;
  
  console.log(`Conference event: ${StatusCallbackEvent} for ${FriendlyName || ConferenceName}`);
  console.log('Conference status payload:', req.body);
  
  res.sendStatus(200);
});

/**
 * Handle incoming calls to the Twilio number
 */
router.post('/incoming', (req, res) => {
  const twiml = new VoiceResponse();
  
  // Get caller information
  const from = req.body.From || 'an unknown number';
  
  // Answer with a message and connect to the browser client
  twiml.say(`Incoming call from ${from.replace('+', '')}`);
  
  const dial = twiml.dial();
  dial.client('browser-user');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * Handle call status changes (for analytics or other functionality)
 */
router.post('/status', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  
  console.log(`Call ${CallSid} status changed to: ${CallStatus}`);
  
  // Update our cache with the new status information from webhook
  if (CallSid) {
    const cachedCall = callStatusCache.get(CallSid) || {};
    const status = CallStatus.toLowerCase(); // Ensure consistent casing with API responses
    
    callStatusCache.set(CallSid, {
      ...cachedCall,
      callSid: CallSid,
      status: status
    });
    console.log(`Updated status cache for ${CallSid}: ${status}`);
    
    // Emit the status update to connected clients
    if (global.io) {
      global.io.to(`call:${CallSid}`).emit('call-status-update', {
        callSid: CallSid,
        status: status
      });
      console.log(`Emitted status update via WebSocket: ${CallSid} - ${status}`);
    }
  }
  
  // Here you could store call information in a database
  // or trigger other actions based on call status
  
  res.sendStatus(200);
});

/**
 * Handle hanging up a call in progress
 */
router.post('/hangup', async (req, res) => {
  const { callSid, conferenceName } = req.body;
  
  if (!callSid && !conferenceName) {
    return res.status(400).json({ error: 'Call SID or Conference name is required' });
  }
  
  try {
    // If we have a call SID, update it to completed
    if (callSid) {
      await client.calls(callSid).update({ status: 'completed' });
      console.log(`Call ${callSid} hung up via REST API`);
    }
    
    // If we have a conference name, we could update all participants
    // but typically the conference will end automatically since we set
    // endConferenceOnExit to true
    
    res.json({ success: true, status: 'completed' });
  } catch (error) {
    console.error('Error hanging up call:', error);
    res.status(500).json({ error: `Failed to hang up call: ${error.message}` });
  }
});

module.exports = router; 