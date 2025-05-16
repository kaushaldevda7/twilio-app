const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Create Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Get conversation history for a specific number
router.get('/history/:number', async (req, res) => {
  try {
    const { number } = req.params;
    
    // Format the number for compatibility with Twilio
    const formattedNumber = number.startsWith('+') ? number : `+${number}`;
    
    // Get messages sent to/from this number
    const sentMessages = await client.messages.list({
      to: formattedNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      limit: 100
    });
    
    const receivedMessages = await client.messages.list({
      from: formattedNumber,
      to: process.env.TWILIO_PHONE_NUMBER,
      limit: 100
    });
    
    // Combine and sort messages by date
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated))
      .map(msg => ({
        sid: msg.sid,
        body: msg.body,
        from: msg.from,
        to: msg.to,
        direction: msg.from === process.env.TWILIO_PHONE_NUMBER ? 'outbound' : 'inbound',
        status: msg.status,
        timestamp: msg.dateCreated
      }));
    
    res.json({ success: true, messages: allMessages });
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch message history' 
    });
  }
});

// Get all conversations (list of contacts with last message)
router.get('/conversations', async (req, res) => {
  try {
    // Get recent messages to find unique phone numbers
    const messages = await client.messages.list({
      limit: 100
    });
    
    // Extract unique phone numbers and group by conversation
    const conversations = {};
    const myNumber = process.env.TWILIO_PHONE_NUMBER;
    
    messages.forEach(msg => {
      // Determine the other party in the conversation
      const otherParty = msg.from === myNumber ? msg.to : msg.from;
      
      if (!conversations[otherParty]) {
        conversations[otherParty] = {
          phoneNumber: otherParty,
          lastMessage: {
            body: msg.body,
            timestamp: msg.dateCreated,
            direction: msg.from === myNumber ? 'outbound' : 'inbound',
            status: msg.status
          }
        };
      } else {
        // Update only if this message is newer
        const currentLastDate = new Date(conversations[otherParty].lastMessage.timestamp);
        const thisMessageDate = new Date(msg.dateCreated);
        
        if (thisMessageDate > currentLastDate) {
          conversations[otherParty].lastMessage = {
            body: msg.body,
            timestamp: msg.dateCreated,
            direction: msg.from === myNumber ? 'outbound' : 'inbound',
            status: msg.status
          };
        }
      }
    });
    
    // Convert to array and sort by most recent
    const conversationList = Object.values(conversations)
      .sort((a, b) => 
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      );
    
    res.json({ success: true, conversations: conversationList });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch conversations' 
    });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const { to, body } = req.body;
    
    if (!to || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: to, body' 
      });
    }
    
    // Format the phone number for compatibility with Twilio
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    
    // Send the message via Twilio
    const message = await client.messages.create({
      body,
      to: formattedTo,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    
    // Broadcast the new message to connected clients
    if (global.io) {
      global.io.emit('new-message', {
        sid: message.sid,
        body: message.body,
        from: message.from,
        to: message.to,
        direction: 'outbound',
        status: message.status,
        timestamp: message.dateCreated
      });
    }
    
    res.json({ 
      success: true, 
      message: {
        sid: message.sid,
        body: message.body,
        from: message.from,
        to: message.to,
        direction: 'outbound',
        status: message.status,
        timestamp: message.dateCreated
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send message' 
    });
  }
});

// Webhook for incoming SMS messages
router.post('/webhook', (req, res) => {
  try {
    const { From, To, Body, MessageSid, DateCreated, Status } = req.body;
    
    // Broadcast the incoming message to connected clients
    if (global.io) {
      global.io.emit('new-message', {
        sid: MessageSid,
        body: Body,
        from: From,
        to: To,
        direction: 'inbound',
        status: Status || 'received',
        timestamp: DateCreated || new Date()
      });
    }
    
    // Send an empty response (Twilio doesn't require a response for SMS webhooks)
    const twiml = new twilio.twiml.MessagingResponse();
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } catch (error) {
    console.error('Error handling SMS webhook:', error);
    res.status(500).send('Error handling webhook');
  }
});

module.exports = router; 