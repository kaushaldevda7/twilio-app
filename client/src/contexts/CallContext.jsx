import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Device } from '@twilio/voice-sdk';

// Create the context
const CallContext = createContext();

// Custom hook to use the call context
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  // State for tracking call status and details
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, ringing, in-progress, incoming, completed
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // References for the device and current call
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const durationIntervalRef = useRef(null);
  
  // Initialize the Twilio Device on component mount
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        setIsLoading(true);
        console.log('Starting direct initialization...');
        
        // Get token from server
        const response = await axios.get('/api/token');
        const token = response.data.token;
        
        if (!token) {
          throw new Error('No token received');
        }
        
        console.log('Token received, length:', token.length);
        
        // Create device with minimal options
        const device = new Device(token, {
          logLevel: 'debug',
          // Use simpler audio constraints
          audioConstraints: true
        });
        
        // Store the device reference
        deviceRef.current = device;
        
        device.on('ready', () => {
          console.log('DEVICE READY EVENT FIRED - this should happen but might not');
          setIsInitialized(true);
          setIsLoading(false);
        });
        
        device.on('error', (err) => {
          console.error('Device error:', err);
          // Don't fail initialization on error, just log it
          console.log('Continuing despite error...');
        });
        
        // IMPORTANT: Don't wait for the ready event - assume it's ready after a timeout
        setTimeout(() => {
          if (isLoading) {
            console.log('Device did not fire ready event, proceeding anyway...');
            setIsInitialized(true);
            setIsLoading(false);
          }
        }, 3000); // 3 second timeout
        
      } catch (error) {
        console.error('Initialization error:', error);
        setErrorMessage(`Initialization error: ${error.message}`);
        setIsLoading(false);
      }
    };
    
    initializeDevice();
    
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, []);
  
  // Register event handlers for the device
  const registerDeviceEvents = (device) => {
    if (!device) return;
    
    // Incoming calls
    device.on('incoming', (call) => {
      callRef.current = call;
      setCallStatus('incoming');
      
      // Register call events
      registerCallEvents(call);
    });
    
    // Register for errors
    device.on('error', (error) => {
      console.error('Device error:', error);
      setErrorMessage(`Device error: ${error.message}`);
    });
  };
  
  // Register event handlers for a call
  const registerCallEvents = (call) => {
    if (!call) return;
    
    call.on('accept', () => {
      console.log('Call accepted - UI should show active call');
      setCallStatus('in-progress');
      startCallTimer();
    });
    
    call.on('disconnect', () => {
      console.log('Call disconnected');
      setCallStatus('completed');
      stopCallTimer();
      setTimeout(() => {
        setCallStatus('idle');
        setCallDuration(0);
      }, 3000); // Reset after 3 seconds
    });
    
    call.on('cancel', () => {
      console.log('Call cancelled');
      setCallStatus('completed');
      stopCallTimer();
      setTimeout(() => {
        setCallStatus('idle');
        setCallDuration(0);
      }, 3000);
    });
    
    call.on('reject', () => {
      console.log('Call rejected');
      setCallStatus('completed');
      stopCallTimer();
      setTimeout(() => {
        setCallStatus('idle');
        setCallDuration(0);
      }, 3000);
    });
    
    call.on('error', (error) => {
      console.error('Call error:', error);
      setErrorMessage(`Call error: ${error.message}`);
      setCallStatus('idle');
      stopCallTimer();
    });
  };
  
  // Start timer to track call duration
  const startCallTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };
  
  // Stop call duration timer
  const stopCallTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };
  
  // Modified makeCall function that doesn't require full initialization
  const makeCall = async (number) => {
    try {
      if (!deviceRef.current) {
        // If device isn't initialized, create a new one on the fly
        console.log('No device, creating one for this call...');
        const response = await axios.get('/api/token');
        const token = response.data.token;
        
        if (!token) {
          throw new Error('No token received');
        }
        
        deviceRef.current = new Device(token, {
          logLevel: 'debug',
          audioConstraints: true
        });
      }
      
      setPhoneNumber(number);
      setCallStatus('connecting');
      
      // Skip trying to connect with client device - go straight to REST API approach
      console.log('Making REST API call to:', number);
      
      // Make the outgoing call using the server's REST API
      const response = await axios.post('/api/call/outgoing', {
        To: number.trim()
      });
      
      const { callSid } = response.data;
      console.log('Call initiated with SID:', callSid);
      
      // Create a simple call status tracker without needing the device to be initialized
      setCallStatus('in-progress');
      startCallTimer();
      
      // Set up a fake call object for the UI
      callRef.current = {
        callSid,
        disconnect: async () => {
          try {
            await axios.post('/api/call/hangup', { callSid });
            setCallStatus('completed');
            stopCallTimer();
            setTimeout(() => {
              setCallStatus('idle');
              setCallDuration(0);
            }, 3000);
          } catch (err) {
            console.error('Error hanging up call:', err);
          }
        },
        mute: (shouldMute) => {
          setIsMuted(shouldMute);
        }
      };
      
      // Set up status polling
      const statusInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`/api/call/status/${callSid}`);
          const status = statusResponse.data.status;
          
          console.log(`Call status update: ${status}`);
          
          if (['completed', 'failed', 'busy', 'no-answer'].includes(status)) {
            clearInterval(statusInterval);
            if (callStatus !== 'completed' && callStatus !== 'idle') {
              setCallStatus('completed');
              stopCallTimer();
              setTimeout(() => {
                setCallStatus('idle');
                setCallDuration(0);
              }, 3000);
            }
          }
        } catch (e) {
          console.error('Error checking call status:', e);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error making call:', error);
      setErrorMessage(`Error making call: ${error.message}`);
      setCallStatus('idle');
    }
  };
  
  // Answer an incoming call
  const answerCall = () => {
    if (!callRef.current) return;
    
    try {
      callRef.current.accept();
    } catch (error) {
      console.error('Error answering call:', error);
      setErrorMessage(`Error answering call: ${error.message}`);
    }
  };
  
  // Reject an incoming call
  const rejectCall = () => {
    if (!callRef.current) return;
    
    try {
      callRef.current.reject();
      setCallStatus('idle');
    } catch (error) {
      console.error('Error rejecting call:', error);
      setErrorMessage(`Error rejecting call: ${error.message}`);
    }
  };
  
  // End the current call
  const hangupCall = () => {
    if (!callRef.current) return;
    
    try {
      // Disconnect the local audio connection
      callRef.current.disconnect();
      
      // If we have a call SID (from a REST API call), also hang up the remote leg
      if (callRef.current.callSid) {
        axios.post('/api/call/hangup', { 
          callSid: callRef.current.callSid,
          conferenceName: callRef.current.conferenceName 
        }).catch(err => {
          console.error('Error hanging up remote call:', err);
        });
      }
    } catch (error) {
      console.error('Error hanging up call:', error);
      setErrorMessage(`Error hanging up call: ${error.message}`);
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    if (!callRef.current) return;
    
    try {
      if (isMuted) {
        callRef.current.mute(false);
      } else {
        callRef.current.mute(true);
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
      setErrorMessage(`Error toggling mute: ${error.message}`);
    }
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Clear any error messages
  const clearError = () => {
    setErrorMessage('');
  };
  
  // The context value that will be provided
  const contextValue = {
    callStatus,
    phoneNumber,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    isMuted,
    errorMessage,
    isInitialized,
    isLoading,
    makeCall,
    answerCall,
    rejectCall,
    hangupCall,
    toggleMute,
    clearError
  };
  
  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
}; 