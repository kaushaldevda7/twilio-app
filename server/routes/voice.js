const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Handle browser client connections to conferences
 */
router.post('/client', (req, res) => {
  console.log('Client voice connection request:', req.body);
  
  const twiml = new VoiceResponse();
  
  // Extract parameters
  const to = req.body.To || '';
  
  // If the call is to join a conference
  if (to.startsWith('conference:')) {
    const conferenceName = to.replace('conference:', '');
    console.log(`Browser client joining conference: ${conferenceName}`);
    
    // Add the browser client to the conference
    const dial = twiml.dial();
    dial.conference({
      startConferenceOnEnter: false, // Conference already started by the other participant
      endConferenceOnExit: true,     // End conference when browser hangs up
      waitUrl: null,                 // No hold music for the browser
      statusCallbackEvent: ['join', 'leave'],
      statusCallback: '/api/call/conference-status'
    }, conferenceName);
  } else {
    // Default response for other call types
    twiml.say('Invalid connection request');
  }
  
  console.log('Sending TwiML response for client:', twiml.toString());
  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router; 