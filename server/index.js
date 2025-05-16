const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and socket.io instance
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*', // Allow connections from any origin including ngrok
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true // Allow compatibility with older clients
});

// Store socket.io instance for use in other modules
global.io = io;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Import routes
const tokenRoutes = require('./routes/token');
const callRoutes = require('./routes/call');
const voiceRoutes = require('./routes/voice');
const smsRoutes = require('./routes/sms');

// Use routes
app.use('/api/token', tokenRoutes);
app.use('/api/call', callRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/sms', smsRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Send welcome message
  socket.emit('message', 'Connected to Twilio softphone server');
  
  // Listen for client registering a call
  socket.on('register-call', (callSid) => {
    console.log(`Client ${socket.id} registered for updates on call ${callSid}`);
    // Associate this socket with the callSid
    socket.join(`call:${callSid}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// TwiML for incoming calls from the browser client
app.post('/voice', (req, res) => {
  console.log('Received voice request to /voice endpoint:', req.body);
  
  const twiml = new VoiceResponse();
  
  // Extract parameters
  const to = req.body.To || '';
  
  // Check if it's a conference call
  if (to.startsWith('conference:')) {
    const conferenceName = to.replace('conference:', '');
    console.log(`Voice endpoint: Client joining conference: ${conferenceName}`);
    
    // Add the client to the conference
    const dial = twiml.dial();
    dial.conference({
      startConferenceOnEnter: false, // Conference already started by the other participant
      endConferenceOnExit: true,      // End conference when browser client leaves
      waitUrl: null,                  // No hold music for the browser
      statusCallbackEvent: ['join', 'leave'],
      statusCallback: '/api/call/conference-status'
    }, conferenceName);
  } else {
    // Default response for other call types
    twiml.say('This is a Twilio softphone application.');
  }
  
  console.log('Sending TwiML response:', twiml.toString());
  res.type('text/xml');
  res.send(twiml.toString());
});

// Environment check route
app.get('/api/config', (req, res) => {
  const environment = process.env.NODE_ENV || 'development';
  const domain = environment === 'production' 
    ? 'placeholder.com' 
    : process.env.NGROK_URL || 'http://localhost:5000';
  
  res.json({
    environment,
    domain,
  });
});

// Status update event for incoming webhooks
app.post('/api/call-status-update', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  
  console.log(`Call ${CallSid} status update: ${CallStatus}`);
  
  // Emit this event to clients listening for this particular call
  io.to(`call:${CallSid}`).emit('call-status-update', {
    callSid: CallSid,
    status: CallStatus.toLowerCase()
  });
  
  res.sendStatus(200);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 