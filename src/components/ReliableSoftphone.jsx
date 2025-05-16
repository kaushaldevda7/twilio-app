import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Device } from '@twilio/voice-sdk';
import io from 'socket.io-client';
import MessageButton from './MessageButton';
import MessagingPanel from './MessagingPanel';

// Modern Black & White Styled Components
const SoftphoneContainer = ({ children, isVisible }) => (
  <div style={{
    position: 'fixed',
    bottom: '20px', // Always stay at the same position
    left: '20px',
    zIndex: 1000,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' // Only transition opacity, not position
  }}>
    {children}
  </div>
);

const PhonePanel = ({ isOpen, children, callActive }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      width: '320px',
      backgroundColor: callActive ? 'transparent' : '#ffffff',
      color: '#000000',
      borderRadius: '24px',
      boxShadow: callActive ? 'none' : '0 8px 20px rgba(0,0,0,0.15), 0 6px 10px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      marginBottom: '16px',
      border: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none', // Prevent text selection for better mobile experience
      minHeight: callActive ? '0' : 'auto', // Minimize height when call is active
      padding: callActive ? '0' : undefined // Remove padding when call is active
    }}>
      {children}
    </div>
  );
};

// Add keyframes for shake animation
const getShakeAnimation = () => {
  return `
    @keyframes shake {
      0% { transform: translate(0, 0); }
      10% { transform: translate(-5px, 0); }
      20% { transform: translate(5px, 0); }
      30% { transform: translate(-5px, 0); }
      40% { transform: translate(5px, 0); }
      50% { transform: translate(-5px, 0); }
      60% { transform: translate(5px, 0); }
      70% { transform: translate(-5px, 0); }
      80% { transform: translate(5px, 0); }
      90% { transform: translate(-5px, 0); }
      100% { transform: translate(0, 0); }
    }
  `;
};

// We need to inject the keyframes into the document head
const injectShakeAnimation = () => {
  if (!document.getElementById('shake-animation')) {
    const style = document.createElement('style');
    style.id = 'shake-animation';
    style.innerHTML = getShakeAnimation();
    document.head.appendChild(style);
  }
};

const PhoneButton = ({ onClick, isBusy, isIncoming, deviceState }) => {
  // Inject the shake animation CSS when the component is rendered
  React.useEffect(() => {
    injectShakeAnimation();
  }, []);

  // Get status dot color based on device state
  const getStatusColor = () => {
    switch (deviceState) {
      case 'registered': return '#10b981'; // Green
      case 'initializing': return '#f59e0b'; // Yellow
      default: return '#ef4444'; // Red
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: isIncoming ? '#34c759' : '#000000', // Green for incoming calls, otherwise black
          color: '#ffffff', // Always white text/icon
          border: 'none', // Remove border
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          fontSize: '24px',
          outline: 'none', // Remove outline
          animation: isIncoming ? 'shake 1s cubic-bezier(.36,.07,.19,.97) infinite' : 'none' // Apply shake animation for incoming calls
        }}
      >
        {isBusy ? 
          '✕' : 
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
              stroke="#FFFFFF" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none" />
          </svg>
        }
      </button>
      {/* Status indicator dot */}
      <div style={{
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        border: '2px solid white',
        boxShadow: '0 0 4px rgba(0,0,0,0.2)',
        zIndex: 2
      }} />
    </div>
  );
};

const PanelHeader = ({ title, onClose }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    background: 'linear-gradient(to bottom, #222222, #000000)',
    color: '#ffffff',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px'
  }}>
    <h3 style={{ 
      margin: 0, 
      fontSize: '17px', 
      fontWeight: 500,
      letterSpacing: '0.2px'
    }}>{title}</h3>
    <button
      onClick={onClose}
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: '#ffffff',
        padding: '5px 10px',
        borderRadius: '14px',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
    >
      ×
    </button>
  </div>
);

const StatusIndicator = ({ status }) => {
  // Define status colors
  const getStatusColor = () => {
    switch (status) {
      case 'registered': return { bg: '#10b981', text: '#ffffff' }; // Green
      case 'initializing': return { bg: '#f59e0b', text: '#ffffff' }; // Yellow
      default: return { bg: '#ef4444', text: '#ffffff' }; // Red for any other state
    }
  };
  
  const colors = getStatusColor();
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      color: '#374151',
      fontSize: '12px',
      fontWeight: '500',
      marginLeft: '8px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: colors.bg,
        boxShadow: `0 0 0 2px ${colors.bg}33`
      }} />
      {status === 'registered' && 'Ready'}
      {status === 'initializing' && 'Initializing...'}
      {status === 'error' && 'Error'}
      {status === 'unregistered' && 'Offline'}
      {status === 'busy' && 'Busy'}
    </div>
  );
};

const ActionButton = ({ children, onClick, color = 'primary', disabled = false }) => {
  // Define button styles based on color prop
  const getButtonStyles = () => {
    switch (color) {
      case 'primary':
        return { 
          bg: '#000000', 
          text: '#ffffff',
          hoverBg: '#333333',
          activeBg: '#000000',
          disabledBg: '#cccccc'
        };
      case 'secondary':
        return { 
          bg: '#ffffff', 
          text: '#000000',
          border: '1px solid #000000',
          hoverBg: '#f5f5f5',
          activeBg: '#e0e0e0',
          disabledBg: '#f5f5f5'
        };
      case 'danger':
        return { 
          bg: '#d32f2f', 
          text: '#ffffff',
          hoverBg: '#b71c1c',
          activeBg: '#d32f2f',
          disabledBg: '#e57373'
        };
      default:
        return { 
          bg: '#000000', 
          text: '#ffffff',
          hoverBg: '#333333',
          activeBg: '#000000',
          disabledBg: '#cccccc'
        };
    }
  };
  
  const styles = getButtonStyles();
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? styles.disabledBg : styles.bg,
        color: styles.text,
        border: styles.border || 'none',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s ease',
        opacity: disabled ? 0.7 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseOver={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = styles.hoverBg;
      }}
      onMouseOut={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = styles.bg;
      }}
    >
      {children}
    </button>
  );
};

const CircleButton = ({ children, onClick, color = 'primary', size = 'medium', disabled = false }) => {
  // Define size dimensions
  const getSize = () => {
    switch (size) {
      case 'small': return { width: '40px', height: '40px', fontSize: '18px' };
      case 'medium': return { width: '50px', height: '50px', fontSize: '22px' };
      case 'large': return { width: '60px', height: '60px', fontSize: '26px' };
      default: return { width: '50px', height: '50px', fontSize: '22px' };
    }
  };
  
  // Define colors
  const getColors = () => {
    switch (color) {
      case 'primary': return { bg: '#000000', text: '#ffffff' };
      case 'secondary': return { bg: '#ffffff', text: '#000000', border: '1px solid #000000' };
      case 'success': return { bg: '#2e7d32', text: '#ffffff' };
      case 'danger': return { bg: '#d32f2f', text: '#ffffff' };
      case 'muted': return { bg: '#757575', text: '#ffffff' };
      default: return { bg: '#000000', text: '#ffffff' };
    }
  };
  
  const dimensions = getSize();
  const colors = getColors();
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '50%',
        backgroundColor: colors.bg,
        color: colors.text,
        border: colors.border || 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dimensions.fontSize,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}
      onMouseOver={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
};

// Add debug panel component
const DebugPanel = ({ deviceState, error, conferenceRef, callStatus, isVisible, callRef, socketConnected, socketId }) => {
  if (!isVisible) return null;
  
  // Determine if we likely have a two-way connection
  const isTwoWayConnected = callStatus === 'in-progress' && deviceState === 'registered' && conferenceRef?.current;
  
  // Check if the callRef is a valid call object (still needed internally but won't show warning)
  const hasValidCallObject = callRef?.current && 
    (typeof callRef.current.disconnect === 'function' || typeof callRef.current.mute === 'function');
    
  return (
    <div style={{
      padding: '8px 12px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#f5f5f5',
      fontSize: '11px',
      color: '#555',
      fontFamily: 'monospace'
    }}>
      <div>
        <strong>Device state:</strong> <span style={{ 
          color: deviceState === 'registered' ? 'green' : deviceState === 'error' ? 'red' : 'orange'
        }}>{deviceState}</span>
      </div>
      
      <div style={{ marginTop: '4px' }}>
        <strong>Call status:</strong> <span style={{
          color: callStatus === 'in-progress' ? 'green' : 
                 callStatus === 'connecting' ? 'orange' : 
                 callStatus === 'ringing' ? '#ff9800' : 'gray'
        }}>{callStatus}</span>
      </div>
      
      <div style={{ marginTop: '4px' }}>
        <strong>WebSocket:</strong> <span style={{
          color: socketConnected ? 'green' : 'red'
        }}>{socketConnected ? `Connected (${socketId || 'no ID'})` : 'Disconnected'}</span>
      </div>
      
      {conferenceRef && (
        <div style={{ marginTop: '4px' }}>
          <strong>Conference:</strong> {conferenceRef.current || 'none'}
        </div>
      )}
      
      <div style={{ 
        marginTop: '4px', 
        color: isTwoWayConnected ? 'green' : 'gray',
        fontWeight: isTwoWayConnected ? 'bold' : 'normal'
      }}>
        <strong>Connection:</strong> {isTwoWayConnected ? 'Two-way audio ✅' : 'Waiting for connection...'}
      </div>
      
      <div style={{ marginTop: '4px', fontSize: '10px', color: '#888' }}>
        <strong>SDK:</strong> Twilio Voice SDK
      </div>
      
      {error && (
        <div style={{ color: 'red', marginTop: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

// Main component
const ReliableSoftphone = () => {
  // WebSocket and connection states
  const [socketId, setSocketId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [deviceState, setDeviceState] = useState('initializing'); // initializing, ready, busy, unregistered
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showIncomingCallUI, setShowIncomingCallUI] = useState(false);
  const [showActiveCallUI, setShowActiveCallUI] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isIncoming, setIsIncoming] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, ringing, in-progress, completed
  const [error, setError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimerInterval, setCallTimerInterval] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Add debug panel toggle state
  
  // Messaging feature states
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  // References
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const timerRef = useRef(null);
  const conferenceNameRef = useRef(null);
  const socketRef = useRef(null);
  const activeCallSidRef = useRef(null);
  
  // Add new state for caller information
  const [incomingCallerInfo, setIncomingCallerInfo] = useState('');
  
  // Initialize socket connection
  useEffect(() => {
    // Get the base URL from window location
    const getServerUrl = () => {
      // Check if we're running in production or development
      if (process.env.NODE_ENV === 'production') {
        // For production, use the same domain the app is running on
        return window.location.origin;
      } else if (window.location.hostname === 'localhost') {
        // For local development
        return 'http://localhost:5000';
      } else {
        // For cases like ngrok domains
        const host = window.location.hostname;
        // Return a modified URL that points to the backend
        return `https://${host}`;
      }
    };

    try {
      // Connect to the socket server
      const serverUrl = getServerUrl();
      console.log(`Connecting to WebSocket server at ${serverUrl}`);
      const socket = io(serverUrl, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
      });
      
      socketRef.current = socket;
      
      // Helper function to register active call with the socket
      const registerActiveCall = () => {
        const callSid = activeCallSidRef.current;
        if (callSid) {
          socket.emit('register-call', callSid);
          console.log(`Registered for WebSocket updates on call ${callSid} after reconnect`);
        }
      };
      
      socket.on('connect', () => {
        console.log('Connected to WebSocket server!', socket.id);
        setSocketConnected(true);
        setSocketId(socket.id);
        
        // Register for existing call if reconnecting during an active call
        registerActiveCall();
      });
      
      socket.on('reconnect', (attemptNumber) => {
        console.log(`Successfully reconnected to WebSocket server after ${attemptNumber} attempts`);
        setSocketConnected(true);
        setSocketId(socket.id);
        
        // Re-register for active call updates
        registerActiveCall();
      });
      
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Attempting to reconnect to WebSocket server (attempt ${attemptNumber})`);
      });
      
      socket.on('reconnect_error', (err) => {
        console.error('WebSocket reconnection error:', err);
      });
      
      socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed after all attempts');
        setError('WebSocket reconnection failed. Using polling fallback.');
      });
      
      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        // If we fail to connect, continue with polling as fallback
        setError(`WebSocket connection error: ${err.message}. Using polling fallback.`);
        setSocketConnected(false);
        setSocketId(null);
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
        setSocketConnected(false);
        setSocketId(null);
        
        // If this is not a clean disconnect, show an error
        if (reason !== 'io client disconnect') {
          setError(`WebSocket disconnected: ${reason}. Attempting to reconnect...`);
        }
      });
      
      socket.on('message', (message) => {
        console.log('WebSocket message:', message);
      });
      
      // Listen for call status updates
      socket.on('call-status-update', (data) => {
        console.log('WebSocket call status update received:', data);
        
        // Check if this is for our active call
        if (activeCallSidRef.current === data.callSid) {
          console.log(`Updating status for call ${data.callSid} from "${callStatus}" to "${data.status}"`);
          handleCallStatusUpdate(data.status);
        } else {
          console.log(`Ignoring status update for non-active call: ${data.callSid}`);
        }
      });
      
      // Clean up on unmount
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      // Fallback is polling, which is already implemented
      setSocketConnected(false);
      setSocketId(null);
    }
  }, []);
  
  // Handle call status updates from WebSocket
  const handleCallStatusUpdate = (status) => {
    console.log(`Handling WebSocket status update: ${status} (current status: ${callStatus})`);
    
    // Always update the status to reflect the latest from server
    if (status === 'ringing') {
      console.log('Setting call status to ringing based on WebSocket event');
      setCallStatus('ringing');
    } else if (status === 'in-progress') {
      console.log('Setting call status to in-progress based on WebSocket event');
      setCallStatus('in-progress');
      // Hide incoming call UI if it was showing (for incoming calls that were answered)
      setShowIncomingCallUI(false);
      // Only show active call UI for outgoing calls
      if (!isIncoming) {
        setShowActiveCallUI(true);
      }
      // Start the timer when the call first becomes in-progress
      if (!timerRef.current) {
        console.log('Starting call timer as call is now in-progress');
        startCallTimer();
      }
    } else if (['completed', 'failed', 'busy', 'no-answer'].includes(status)) {
      console.log(`Setting call status to ${status} based on WebSocket event`);
      
      // Force hang up whether or not we think the call is already completed
      // This ensures we don't miss hanging up due to race conditions
      console.log('Call completed on server side - force hanging up client call');
      
      // First, try to disconnect the Twilio Device call directly
      if (callRef.current && typeof callRef.current.disconnect === 'function') {
        try {
          console.log('Disconnecting Twilio Device call object directly');
          callRef.current.disconnect();
        } catch (err) {
          console.warn('Error disconnecting client call directly:', err);
        }
      }
      
      // Hide any call UIs
      setShowIncomingCallUI(false);
      setShowActiveCallUI(false);
      
      // Also call our hangup function to handle server-side cleanup and UI updates
      const callSid = activeCallSidRef.current;
      if (callSid) {
        console.log(`Calling hangUpCall with SID: ${callSid}`);
        // Use setTimeout to ensure this happens after state updates
        setTimeout(() => hangUpCall(callSid), 100);
      } else {
        console.warn('No active call SID found when trying to hang up completed call');
        // Still update UI even if we don't have a SID
        setCallStatus('completed');
        stopCallTimer();
        setTimeout(() => {
          setCallStatus('idle');
          setCallDuration(0);
          callRef.current = null;
        }, 3000);
      }
    }
  };
  
  // Format phone numbers
  const formatPhoneNumber = (phoneNum) => {
    if (!phoneNum) return '';
    
    // Remove any non-digit characters
    const cleaned = ('' + phoneNum).replace(/\D/g, '');
    
    // Check if it's a valid phone number
    const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    
    // Try another format
    const match2 = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match2) {
      return `(${match2[1]}) ${match2[2]}-${match2[3]}`;
    }
    
    // Return whatever we have if no format matches
    return phoneNum;
  };
  
  // Format call duration
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Timer functions
  const startCallTimer = () => {
    setCallDuration(0);
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    setCallTimerInterval(interval);
  };
  
  const stopCallTimer = () => {
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      setCallTimerInterval(null);
    }
  };
  
  // Initialize Twilio device only when needed
  const initializeDevice = async () => {
    if (isInitializing || hasInitialized) return;
    
    try {
      setIsInitializing(true);
      setError(null);
      console.log('Initializing Twilio device...');
      
      // Get token for Twilio Device
      const response = await axios.get('/api/token');
      if (!response.data || !response.data.token) {
        throw new Error('Failed to get token');
      }
      
      const token = response.data.token;
      console.log('Token received, setting up Twilio device');
      
      // First check if we can access the microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted for device initialization');
        // Close the stream as we only needed to check permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error('Microphone permission denied during initialization:', micError);
        // Continue anyway but with a warning - we'll try again when making a call
        setError('Microphone permission denied. Please allow microphone access.');
      }
      
      // Create new Twilio Device
      if (deviceRef.current) {
        console.log('Destroying existing device');
        await deviceRef.current.destroy();
      }
      
      const device = new Device(token, {
        logLevel: 'debug',
        closeProtection: true,
        codecPreferences: ['opus', 'pcmu'],
        audioConstraints: true, // Request audio permissions
        edge: 'ashburn' // Specify a Twilio edge location (optional)
      });
      
      // Register event handlers
      device.on('registered', () => {
        console.log('✅ Device registered successfully with Twilio');
        setDeviceState('registered');
      });
      
      device.on('error', (error) => {
        console.error('❌ Device error:', error);
        setError(`Device error: ${error.message}`);
        setDeviceState('error');
      });
      
      device.on('incoming', (call) => {
        console.log('📞 Incoming call received', call);
        callRef.current = call;
        setCallStatus('incoming');
        setIsIncoming(true);
        
        // Extract and set caller info if available
        const callerInfo = call.parameters.From || call.parameters.from;
        setIncomingCallerInfo(callerInfo ? formatPhoneNumber(callerInfo) : 'Unknown Caller');
        
        // Show the incoming call sliding UI
        setShowIncomingCallUI(true);
        
        // Setup event handlers for the call
        call.on('cancel', () => {
          console.log('Incoming call canceled');
          setCallStatus('idle');
          setShowIncomingCallUI(false);
          setIsIncoming(false);
        });
        
        call.on('disconnect', () => {
          console.log('Call disconnected');
          setCallStatus('completed');
          setIsIncoming(false);
          setShowIncomingCallUI(false);
          setShowActiveCallUI(false);
          stopCallTimer();
        });
        
        call.on('accept', () => {
          console.log('Call accepted');
          setCallStatus('in-progress');
          setShowIncomingCallUI(false);
          setShowActiveCallUI(true);
        });
        
        // Setup for auto reject after 30 seconds if not answered
        setTimeout(() => {
          if (callRef.current && callStatus === 'incoming') {
            console.log('Call auto-rejected after timeout');
            rejectIncomingCall();
          }
        }, 30000);
      });
      
      device.on('unregistered', () => {
        console.log('Device unregistered');
        setDeviceState('unregistered');
        setShowActiveCallUI(false);
        setShowIncomingCallUI(false);
        setIsIncoming(false);
      });
      
      device.on('registering', () => {
        console.log('Device registering with Twilio...');
        setDeviceState('registering');
      });
      
      device.on('connect', (conn) => {
        console.log('Device connected to Twilio voice service', conn);
      });
      
      device.on('disconnect', (conn) => {
        console.log('Device disconnected from Twilio voice service', conn);
      });
      
      // Set the device reference
      deviceRef.current = device;
      
      // Register the device
      await device.register();
      
      setHasInitialized(true);
      console.log('Twilio device initialized successfully');
      
    } catch (err) {
      console.error('Device initialization error:', err);
      setError(`Initialization error: ${err.message}`);
      setDeviceState('error');
    } finally {
      setIsInitializing(false);
    }
  };
  
  // Toggle phone panel
  const togglePhone = () => {
    // When there's an incoming call and the user clicks the bubble,
    // don't open the panel but toggle the sliding UI instead
    if (callStatus === 'incoming') {
      setShowIncomingCallUI(prev => !prev);
    } else {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      
      // Initialize when opening
      if (newIsOpen && !hasInitialized && !isInitializing) {
        initializeDevice();
      }
    }
  };
  
  // Function to toggle the messaging panel
  const toggleMessaging = () => {
    setIsMessagingOpen(prev => !prev);
    
    // Reset new message flag when opening the panel
    if (!isMessagingOpen) {
      setHasNewMessages(false);
    }
  };
  
  // Make a call
  const makeCall = async (e) => {
    if (e) e.preventDefault();
    
    if (!phoneNumber.trim()) return;
    
    try {
      // Update UI first to prevent blank screen
      setCallStatus('connecting');
      setError(null);
      
      const formattedNumber = formatPhoneNumber(phoneNumber);
      console.log('Making call to:', formattedNumber);
      
      // Make server-side call to establish the conference
      const response = await axios.post('/api/call/outgoing', {
        To: formattedNumber
      });
      
      console.log('Call API response:', response.data);
      
      // Store conference name and call SID
      const { callSid, conferenceName } = response.data;
      conferenceNameRef.current = conferenceName;
      activeCallSidRef.current = callSid;
      
      // Register with socket for updates on this call
      if (socketRef.current) {
        socketRef.current.emit('register-call', callSid);
        console.log(`Registered for WebSocket updates on call ${callSid}`);
      }
      
      // Don't start timer yet - wait for in-progress status
      
      // IMPORTANT: Now connect the browser client to the same conference
      if (deviceRef.current && deviceRef.current.state === "registered") {
        console.log('Connecting browser client to conference:', conferenceName);
        console.log('Current device state:', deviceRef.current.state);
        
        // Try to verify microphone access, but don't block the call if it fails
        let microphoneAccessConfirmed = false;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone access confirmed', stream.getAudioTracks());
          
          // Close the stream since we just needed to check permission
          stream.getTracks().forEach(track => track.stop());
          microphoneAccessConfirmed = true;
        } catch (micError) {
          console.warn('Microphone permission may be pending or denied:', micError);
          // Continue anyway - the Device might still work with previously granted permissions
        }
        
        // The 'To' parameter is crucial - must use the 'conference:' prefix
        const params = {
          To: 'conference:' + conferenceName
        };
        
        console.log('Connecting with params:', params);
        
        // Connect the browser to the conference
        let clientCall;
        try {
          clientCall = deviceRef.current.connect({ params });
          console.log('Device connect initiated, call object:', clientCall);
          
          // Clear any misleading microphone errors since the call was initiated
          if (!microphoneAccessConfirmed) {
            console.log('Call connecting despite microphone permission uncertainty');
          }
          
          // SAFETY CHECK: Make sure the call object has the expected methods
          // before attaching event listeners
          if (clientCall && typeof clientCall.on === 'function') {
            // Set up event listeners for the browser client call
            clientCall.on('accept', () => {
              console.log('Browser client connected to conference successfully');
              // Only update to in-progress if we're not already there
              // This ensures we don't override a completed state
              if (callStatus === 'connecting' || callStatus === 'ringing') {
                setCallStatus('in-progress');
                // Start the timer when call is in-progress
                if (!timerRef.current) {
                  console.log('Starting call timer as call is now in-progress (from client)');
                  startCallTimer();
                }
              }
              // Clear any lingering errors since the call is working
              setError(null);
            });
            
            clientCall.on('disconnect', () => {
              console.log('Browser client disconnected from conference');
              setCallStatus('completed');
              stopCallTimer();
              setTimeout(() => {
                setCallStatus('idle');
                setCallDuration(0);
              }, 3000);
            });
            
            clientCall.on('error', (err) => {
              console.error('Call error:', err);
              // Only show errors that matter to the user
              if (err.message && !err.message.includes('permission')) {
                setError(`Call error: ${err.message}`);
              }
              // Don't automatically set to in-progress on error
              // We'll let the poll status handle the correct state
              // This ensures accurate status display based on the actual call state
            });
          } else {
            // The call object doesn't have the expected structure but the call might still work
            console.warn('The call object is missing the expected event methods, but the call may still work');
            console.log('Call object structure:', Object.keys(clientCall || {}));
            
            // Don't force in-progress state here, let the server polling handle the state properly
            // This ensures we get the ringing state before in-progress
          }
          
          // Store the call reference for controls (mute/hangup)
          callRef.current = clientCall;
        } catch (connectError) {
          console.error('Error connecting to conference:', connectError);
          setError(`Connection error: ${connectError.message}`);
          // Don't force in-progress status here, let the polling handle it
          // Keep showing 'connecting' until the polling updates the status
          // Start polling now and let it determine the correct state
          return;
        }
      } else {
        console.warn('Device not ready to connect to conference:', deviceRef.current?.state);
        setError(`Device not ready (state: ${deviceRef.current?.state || 'none'}). Call may be one-way.`);
        // Don't force in-progress status here either, let the polling handle it
        // We'll rely on the server-side status to give accurate state information
      }
      
      // Continue using the polling as a fallback
      // But it will mostly be WebSockets doing the updates now
      pollCallStatus(callSid);
      
    } catch (err) {
      console.error('Error making call:', err);
      setError(`Call failed: ${err.message}`);
      setCallStatus('idle');
    }
  };
  
  // Poll for call status (fallback method)
  const pollCallStatus = (callSid) => {
    if (!callSid) return;
    
    // Use a more frequent polling interval initially to catch status changes faster
    // Start with 2000ms interval as a fallback to WebSockets
    
    const interval = setInterval(async () => {
      try {
        // Don't poll if call is already completed
        if (callStatus === 'idle' || callStatus === 'completed') {
          clearInterval(interval);
          return;
        }
        
        const response = await axios.get(`/api/call/status/${callSid}`);
        const status = response.data.status;
        
        console.log(`Polling call status update: ${status}`);
        
        // Only update status if WebSocket hasn't already handled it
        if (status === 'ringing' && callStatus === 'connecting') {
          console.log('Setting call status to ringing based on polling');
          setCallStatus('ringing');
        } else if (status === 'in-progress' && (callStatus === 'connecting' || callStatus === 'ringing')) {
          console.log('Setting call status to in-progress based on polling');
          setCallStatus('in-progress');
          // Start the timer when the call first becomes in-progress
          if (!timerRef.current) {
            console.log('Starting call timer as call is now in-progress (from polling)');
            startCallTimer();
          }
        } else if (['completed', 'failed', 'busy', 'no-answer'].includes(status)) {
          clearInterval(interval);
          
          console.log(`Call status via polling is ${status} - hanging up client-side call`);
          
          // First, try to disconnect the Twilio Device call directly
          if (callRef.current && typeof callRef.current.disconnect === 'function') {
            try {
              console.log('Disconnecting Twilio Device call object directly (from polling)');
              callRef.current.disconnect();
            } catch (err) {
              console.warn('Error disconnecting client call directly (from polling):', err);
            }
          }
          
          // Also call our hangup function to handle server-side cleanup and UI updates
          if (callSid) {
            console.log(`Calling hangUpCall with SID from polling: ${callSid}`);
            // Use setTimeout to ensure this happens after state updates
            setTimeout(() => hangUpCall(callSid), 100);
          } else {
            console.warn('No call SID available in polling when trying to hang up completed call');
            // Still update UI even if we don't have a SID
            setCallStatus('completed');
            stopCallTimer();
            setTimeout(() => {
              setCallStatus('idle');
              setCallDuration(0);
              callRef.current = null;
              activeCallSidRef.current = null;
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Error polling call status:', err);
      }
    }, 2000); // Fallback polling every 2 seconds
    
    // Store interval ID for cleanup
    return interval;
  };
  
  // Hang up call
  const hangUpCall = async (sid) => {
    try {
      console.log(`Hanging up call with SID: ${sid || 'unknown'}`);
      
      // If we don't have a specific sid, try to use any available identifier
      const callSidToUse = sid || 
                          (callRef.current && callRef.current.parameters && callRef.current.parameters.CallSid) || 
                          activeCallSidRef.current ||
                          null;
      
      if (callSidToUse) {
        console.log(`Sending hangup request to server for call: ${callSidToUse}`);
        
        try {
          const response = await axios.post('/api/call/hangup', { 
            callSid: callSidToUse,
            conferenceName: conferenceNameRef.current
          });
          
          console.log('Hangup response from server:', response.data);
        } catch (apiErr) {
          console.error('Error in server-side hangup API call:', apiErr);
          // Continue with client-side cleanup even if server-side fails
        }
      } else {
        console.warn('No call SID available for server-side hangup');
      }
      
      // Always try to disconnect the client call object regardless of server response
      if (callRef.current) {
        console.log('Disconnecting client call object:', callRef.current);
        if (typeof callRef.current.disconnect === 'function') {
          try {
            callRef.current.disconnect();
            console.log('Successfully disconnected client call object');
          } catch (clientErr) {
            console.warn('Error disconnecting client call:', clientErr);
          }
        } else {
          console.warn('Client call object does not have disconnect method');
        }
      } else {
        console.log('No client call object available to disconnect');
      }
      
      // Always update UI state
      console.log('Setting UI to completed state');
      setCallStatus('completed');
      stopCallTimer();
      
      // Clear references and reset UI after a delay
      setTimeout(() => {
        console.log('Resetting UI to idle state');
        setCallStatus('idle');
        setCallDuration(0);
        callRef.current = null;
        conferenceNameRef.current = null;
        activeCallSidRef.current = null;
      }, 3000);
      
    } catch (err) {
      console.error('Unexpected error in hangUpCall:', err);
      // Ensure UI is still reset even if everything else fails
      setCallStatus('completed');
      stopCallTimer();
      
      setTimeout(() => {
        setCallStatus('idle');
        setCallDuration(0);
        callRef.current = null;
        conferenceNameRef.current = null;
        activeCallSidRef.current = null;
      }, 3000);
    }
  };
  
  // Handle dialpad input
  const handleDigitPress = (digit) => {
    setPhoneNumber(prev => prev + digit);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCallTimer();
      
      // Clean up device
      if (deviceRef.current) {
        deviceRef.current.destroy().catch(err => {
          console.error('Error destroying device:', err);
        });
      }
    };
  }, []);
  
  // Render the dialpad
  const renderDialpad = () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px', 
      margin: '20px 0',
      padding: '0 10px',
      backgroundColor: '#ffffff' // Ensure white background
    }}>
      {[
        { digit: '1', subtext: '' },
        { digit: '2', subtext: 'ABC' },
        { digit: '3', subtext: 'DEF' },
        { digit: '4', subtext: 'GHI' },
        { digit: '5', subtext: 'JKL' },
        { digit: '6', subtext: 'MNO' },
        { digit: '7', subtext: 'PQRS' },
        { digit: '8', subtext: 'TUV' },
        { digit: '9', subtext: 'WXYZ' },
        { digit: '*', subtext: '' },
        { digit: '0', subtext: '+' },
        { digit: '#', subtext: '' }
      ].map(({ digit, subtext }) => (
        <button
          key={digit}
          type="button"
          onClick={() => handleDigitPress(digit)}
          style={{
            width: '65px',
            height: '65px',
            borderRadius: '50%', // Make buttons circular
            fontSize: '28px',
            fontWeight: '400',
            background: '#ebebf0', // Light iOS gray
            color: '#000000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            padding: '0',
            transition: 'background-color 0.15s ease',
            WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
            userSelect: 'none' // Prevent text selection
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#d1d1d6'; // Darker on hover
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ebebf0'; // Back to original
          }}
        >
          <div>{digit}</div>
          {subtext && (
            <div style={{
              fontSize: '10px',
              marginTop: '-2px',
              color: '#8e8e93', // Subtle gray for subtext
              fontWeight: 'normal',
              letterSpacing: '1px'
            }}>
              {subtext}
            </div>
          )}
        </button>
      ))}
    </div>
  );
  
  // Update for the phone number input section with backspace button
  const renderPhoneInput = () => (
    <div style={{ position: 'relative', marginBottom: '15px' }}>
      <input
        type="tel"
        placeholder=""
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          paddingRight: '40px', // Make room for the backspace button
          fontSize: '28px',
          border: 'none', // Remove border
          borderRadius: '0', // Remove border radius
          boxSizing: 'border-box',
          backgroundColor: 'transparent', // Remove background
          color: '#000000',
          textAlign: 'center',
          fontWeight: '300', // Lighter font weight like iPhone
          letterSpacing: '1px',
          outline: 'none' // Remove outline
        }}
      />
      {phoneNumber && (
        <button
          type="button"
          onClick={() => setPhoneNumber(prev => prev.slice(0, -1))}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#8e8e93',
            padding: '5px',
            outline: 'none' // Remove outline
          }}
        >
          ⌫
        </button>
      )}
    </div>
  );
  
  // Call button for the dialpad (centered, iPhone-style)
  const renderCallButton = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      marginTop: '10px',
      marginBottom: '15px'
    }}>
      <button
        type="submit"
        onClick={makeCall}
        disabled={!phoneNumber.trim() || isInitializing}
        style={{
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          backgroundColor: phoneNumber.trim() ? '#34c759' : '#ebebf0', // iOS green when active
          color: phoneNumber.trim() ? '#ffffff' : '#8e8e93',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: phoneNumber.trim() ? 'pointer' : 'not-allowed',
          outline: 'none' // Remove outline
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" 
            stroke={phoneNumber.trim() ? "#FFFFFF" : "#8e8e93"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none" />
        </svg>
      </button>
    </div>
  );
  
  // Modify the idle state container (when showing the dialpad)
  const IdleStateContainer = ({ children }) => (
    <div style={{ 
      padding: '15px',
      backgroundColor: '#ffffff' // Clean white background
    }}>
      {children}
    </div>
  );
  
  // Add functions to handle answering and rejecting calls
  const answerIncomingCall = () => {
    if (callRef.current) {
      try {
        console.log('Accepting incoming call');
        callRef.current.accept();
        setCallStatus('in-progress');
        // Hide incoming call UI and show proper in-progress UI
        setShowIncomingCallUI(false);
        setShowActiveCallUI(true); // Show active call UI for incoming calls too
        startCallTimer();
      } catch (err) {
        console.error('Error accepting call:', err);
      }
    }
  };
  
  const rejectIncomingCall = () => {
    if (callRef.current) {
      try {
        console.log('Rejecting incoming call');
        callRef.current.reject();
        setCallStatus('idle');
        setShowIncomingCallUI(false);
        setIsIncoming(false);
      } catch (err) {
        console.error('Error rejecting call:', err);
      }
    }
  };
  
  const muteAudioTracks = (shouldMute) => {
    console.log('Attempting to mute audio tracks:', shouldMute);
    
    try {
      // First try the Twilio way if available
      if (callRef.current && typeof callRef.current.mute === 'function') {
        console.log('Using Twilio call.mute method');
        callRef.current.mute(shouldMute);
        return true;
      }
      
      // Get the local stream from the call object if available
      if (callRef.current && typeof callRef.current.getLocalStream === 'function') {
        console.log('Using call.getLocalStream method');
        const localStream = callRef.current.getLocalStream();
        if (localStream) {
          const audioTracks = localStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = !shouldMute;
          });
          console.log(`Set ${audioTracks.length} audio tracks to enabled=${!shouldMute}`);
          return true;
        }
      }
      
      // If the device has a stream property, try that
      if (deviceRef.current && deviceRef.current.stream) {
        console.log('Using device.stream property');
        const audioTracks = deviceRef.current.stream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !shouldMute;
        });
        console.log(`Set ${audioTracks.length} audio tracks to enabled=${!shouldMute}`);
        return true;
      }
      
      // Last resort: try to get all media streams
      const streams = [];
      try {
        // Try to access any active media streams 
        if (typeof navigator.mediaDevices !== 'undefined' && 
            typeof navigator.mediaDevices.getUserMedia === 'function') {
          console.log('Using navigator.mediaDevices.getUserMedia as fallback');
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              const audioTracks = stream.getAudioTracks();
              audioTracks.forEach(track => {
                track.enabled = !shouldMute;
              });
              console.log(`Set ${audioTracks.length} fallback audio tracks to enabled=${!shouldMute}`);
            })
            .catch(err => {
              console.error('Could not get user media in fallback:', err);
            });
        }
      } catch (e) {
        console.error('Error accessing media streams:', e);
      }
      
      // If we made it here but couldn't mute anything, return false
      return false;
    } catch (err) {
      console.error('Error in muteAudioTracks:', err);
      return false;
    }
  };
  
  // Check for new messages periodically
  useEffect(() => {
    // Check if MessagingPanel has reported new messages
    const checkForNewMessages = () => {
      if (MessagingPanel.hasNewMessages && typeof MessagingPanel.hasNewMessages === 'function') {
        const newMessageStatus = MessagingPanel.hasNewMessages();
        if (newMessageStatus !== hasNewMessages) {
          setHasNewMessages(newMessageStatus);
        }
      }
    };
    
    // Set up interval to check for new messages
    const intervalId = setInterval(checkForNewMessages, 1000);
    
    return () => clearInterval(intervalId);
  }, [hasNewMessages]);
  
  return (
    <SoftphoneContainer isVisible={isOpen || isMessagingOpen}>
      {/* Phone Panel */}
      <PhonePanel 
        isOpen={isOpen} 
        callActive={callStatus !== 'idle'}
      >
        {/* Only show header and error when in idle state */}
        {callStatus === 'idle' && (
          <>
            <PanelHeader 
              title="Phone"
              onClose={() => setIsOpen(false)} 
            />
            
            {/* Error Messages */}
            {error && (
              <div style={{
                padding: '10px 15px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                fontSize: '14px',
                margin: '5px 10px',
                borderRadius: '4px'
              }}>
                {error}
                <button 
                  onClick={() => setError(null)}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 5px',
                    fontSize: '12px',
                    border: 'none',
                    backgroundColor: '#c62828',
                    color: 'white',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Main Content Areas based on call status */}
        {callStatus === 'idle' ? (
          <IdleStateContainer>
            <form onSubmit={makeCall}>
              {renderPhoneInput()}
              {renderDialpad()}
              {renderCallButton()}
            </form>
          </IdleStateContainer>
        ) : (
          // Empty container that doesn't take up visual space
          <div style={{ display: 'block', height: '1px', overflow: 'hidden', opacity: 0 }}></div>
        )}
      </PhonePanel>
      
      {/* Messaging Panel */}
      <MessagingPanel 
        isOpen={isMessagingOpen} 
        onClose={() => setIsMessagingOpen(false)}
      />
      
      {/* Phone Bubble */}
      <div style={{ 
        position: 'relative',
        display: 'flex',
        gap: '15px'
      }}>
        {/* Message Button - positioned to the left of the phone button */}
        <div style={{ position: 'relative', marginRight: '5px' }}>
          <MessageButton 
            onClick={toggleMessaging} 
            hasNewMessages={hasNewMessages}
          />
        </div>
        
        {/* Phone Button */}
        <PhoneButton 
          onClick={togglePhone} 
          isBusy={isOpen || callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'in-progress'} 
          isIncoming={callStatus === 'incoming'} 
          deviceState={deviceState}
        />
        
        {/* Debug Panel Toggle Button */}
        <button
          onClick={() => setShowDebugPanel(prev => !prev)}
          style={{
            position: 'absolute',
            bottom: '-25px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '3px 10px',
            fontSize: '11px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            color: '#64748b',
            opacity: 0.9,
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            lineHeight: '1',
            fontWeight: '500'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = 1;
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = 0.9;
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
        >
          {showDebugPanel ? 'Hide Debug' : 'Debug'}
        </button>
        
        {/* Show sliding UI for incoming calls only */}
        {callStatus === 'incoming' && showIncomingCallUI && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '30px',
            padding: '12px 15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            position: 'absolute',
            bottom: '0px',
            left: '70px',
            height: '60px',
            minWidth: '320px',
            maxWidth: '380px',
            transform: 'translateY(0)',
            animation: 'slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            zIndex: 1001
          }}>
            <style>
              {`
                @keyframes slideInRight {
                  from { transform: translateX(-30px); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>
            <div style={{
              flex: 1,
              marginLeft: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#000000',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Incoming Call
              </div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '400'
              }}>
                {incomingCallerInfo || 'Unknown Caller'}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  rejectIncomingCall();
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  answerIncomingCall();
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#34c759',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Show sliding UI for connecting and ringing states */}
        {(callStatus === 'connecting' || callStatus === 'ringing') && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '30px',
            padding: '12px 15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            position: 'absolute',
            bottom: '0px',
            left: '70px',
            height: '60px',
            minWidth: '320px',
            maxWidth: '380px',
            transform: 'translateY(0)',
            animation: 'slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            zIndex: 1001
          }}>
            <style>
              {`
                @keyframes slideInRight {
                  from { transform: translateX(-30px); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>
            <div style={{
              flex: 1,
              marginLeft: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#000000',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {callStatus === 'connecting' ? 'Connecting to' : 'Calling'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '400'
              }}>
                {formatPhoneNumber(phoneNumber)}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  hangUpCall();
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Show sliding UI for in-progress calls */}
        {callStatus === 'in-progress' && showActiveCallUI && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '30px',
            padding: '12px 15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            position: 'absolute',
            bottom: '0px',
            left: '70px',
            height: '60px',
            minWidth: '320px',
            maxWidth: '380px',
            transform: 'translateY(0)',
            animation: 'slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            zIndex: 1001
          }}>
            <style>
              {`
                @keyframes slideInRight {
                  from { transform: translateX(-30px); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>
            <div style={{
              flex: 1,
              marginLeft: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#000000',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {isIncoming ? 
                  (incomingCallerInfo || 'Unknown Caller') : 
                  formatPhoneNumber(phoneNumber)
                }
              </div>
              <div style={{
                fontSize: '14px',
                color: '#34c759',
                fontWeight: '500'
              }}>
                {formatDuration(callDuration)}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    const muted = !isMuted;
                    const success = muteAudioTracks(muted);
                    
                    // Always update UI state, even if actual muting failed
                    setIsMuted(muted);
                    
                    if (!success) {
                      console.warn('Could not mute audio tracks directly. UI will show muted state but audio may still be transmitted.');
                    }
                  } catch (err) {
                    console.error('Error toggling mute state:', err);
                    // Still update UI state for better UX
                    setIsMuted(!isMuted);
                  }
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: isMuted ? '#ff3b30' : '#e2e2e2',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" 
                    stroke={isMuted ? "#ffffff" : "#000000"}
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                  />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" 
                    stroke={isMuted ? "#ffffff" : "#000000"}
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                  />
                  {isMuted && (
                    <path d="M3 3L21 21" 
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  hangUpCall();
                  setShowActiveCallUI(false);
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Show sliding UI for call ended state */}
        {callStatus === 'completed' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '30px',
            padding: '12px 15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            position: 'absolute',
            bottom: '0px',
            left: '70px',
            height: '60px',
            minWidth: '320px',
            maxWidth: '380px',
            transform: 'translateY(0)',
            animation: 'slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            zIndex: 1001
          }}>
            <style>
              {`
                @keyframes slideInRight {
                  from { transform: translateX(-30px); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>
            <div style={{
              flex: 1,
              marginLeft: '10px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#000000',
                marginBottom: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Call Ended
              </div>
              <div style={{
                fontSize: '14px',
                color: '#8e8e93',
                fontWeight: '400'
              }}>
                {formatPhoneNumber(phoneNumber)} • {formatDuration(callDuration)}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCallStatus('idle');
                }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#007aff',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Debug Panel */}
      <DebugPanel 
        deviceState={deviceState}
        error={error}
        conferenceRef={conferenceNameRef}
        callStatus={callStatus}
        callRef={callRef}
        socketConnected={socketConnected}
        socketId={socketId}
        isVisible={showDebugPanel} // Use the toggle state here
      />
    </SoftphoneContainer>
  );
};

export default ReliableSoftphone; 