import React, { useRef, useState } from 'react';
import axios from 'axios';

const CallContext = React.createContext();

// First, add an error boundary wrapper to catch any rendering errors
class CallErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Call component crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', backgroundColor: '#ffeeee', borderRadius: 5 }}>
          <h3>Something went wrong with the call interface</h3>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload(); // Force full reload as fallback
            }}
            style={{ padding: '8px 16px', marginTop: 10 }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CallProvider = ({ children }) => {
  const callRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const startCallTimer = () => {
    // Implementation of startCallTimer
  };

  const stopCallTimer = () => {
    // Implementation of stopCallTimer
  };

  const makeCall = async (number) => {
    try {
      // Update state immediately
      setPhoneNumber(number);
      setCallStatus('connecting');
      
      console.log('Making call to:', number);
      
      // Make API call in try/catch to prevent navigation on error
      let response;
      try {
        response = await axios.post('/api/call/outgoing', {
          To: number.trim()
        });
      } catch (apiError) {
        console.error('API call error:', apiError);
        setErrorMessage(`Call API error: ${apiError.message}`);
        setCallStatus('idle');
        return null;
      }
      
      const { callSid } = response.data;
      console.log('Call initiated with SID:', callSid);
      
      // Set up call reference
      callRef.current = {
        callSid,
        disconnect: async () => {
          try {
            await axios.post('/api/call/hangup', { callSid });
          } catch (err) {
            console.error('Error hanging up call:', err);
          } finally {
            setCallStatus('completed');
            stopCallTimer();
            setTimeout(() => {
              setCallStatus('idle');
              setCallDuration(0);
            }, 2000);
          }
        },
        mute: (shouldMute) => {
          setIsMuted(shouldMute);
        }
      };
      
      // Update UI to in-progress
      setCallStatus('in-progress');
      startCallTimer();
      
      // Set up status polling
      const statusInterval = setInterval(() => {
        if (!callRef.current) {
          clearInterval(statusInterval);
          return;
        }
        
        axios.get(`/api/call/status/${callSid}`)
          .then(statusResponse => {
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
                }, 2000);
              }
            }
          })
          .catch(e => {
            console.error('Error checking call status:', e);
          });
      }, 2000);
      
      return callRef.current;
      
    } catch (error) {
      console.error('Error in makeCall function:', error);
      setErrorMessage(`Error making call: ${error.message}`);
      setCallStatus('idle');
      return null;
    }
  };

  const clearError = () => {
    setErrorMessage('');
  };

  const contextValue = {
    phoneNumber,
    callStatus,
    isMuted,
    callDuration,
    errorMessage,
    makeCall,
    clearError
  };

  // Wrap the provider with the error boundary
  return (
    <CallErrorBoundary>
      <CallContext.Provider value={contextValue}>
        {children}
      </CallContext.Provider>
    </CallErrorBoundary>
  );
};

export { CallContext, CallProvider }; 