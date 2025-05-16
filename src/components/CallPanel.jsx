import React, { useState, useEffect } from 'react';
import { Panel, Header, CloseButton, ErrorMessage, IncomingCall, CallInfo, CallerInfo, CallerName, CallStatus, CallDuration, ActionButtons, ActionButton } from './styles';
import { PhoneInput, Dialpad } from './components';

// IMPORTANT: Create a separate component for the call UI to prevent rendering issues
const ActiveCallUI = ({ phoneNumber, callStatus, callDuration, isMuted, onHangup, onMute }) => {
  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <div>{phoneNumber || 'Unknown'}</div>
        <div>{formatDuration(callDuration)}</div>
      </div>
      
      <div style={{ 
        color: callStatus === 'connecting' ? '#ffc107' : '#28a745',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        {callStatus === 'connecting' ? 'Connecting...' : 'Call in progress'}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around',
        marginTop: '20px'
      }}>
        <button 
          onClick={onMute}
          style={{
            padding: '10px 20px',
            backgroundColor: isMuted ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        
        <button 
          onClick={onHangup}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

const CallPanel = ({ onClose }) => {
  const [isDialpadVisible, setIsDialpadVisible] = useState(true);
  const [callStatus, setCallStatus] = useState('idle');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (callStatus === 'in-progress' || callStatus === 'connecting') {
      setIsDialpadVisible(false);
    } else if (callStatus === 'idle') {
      setIsDialpadVisible(true);
    }
  }, [callStatus]);

  // CRITICAL FIX: Modify the handleCall function to prevent default form submission
  const handleCall = (event) => {
    // Prevent any form submission or navigation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!phoneInput.trim()) return;
    
    try {
      console.log('Making call to:', phoneInput);
      
      // Update UI state first
      setCallStatus('connecting');
      
      // Then make the call
      makeCall(phoneInput);
      
    } catch (error) {
      console.error('Call error:', error);
      setErrorMessage(`Error making call: ${error.message}`);
      setCallStatus('idle');
    }
  };

  const handleHangup = () => {
    // Implement hangup logic
  };

  const handleKeyPress = (e) => {
    // Implement key press handling
  };

  const handleDigitPress = (digit) => {
    // Implement digit press handling
  };

  const makeCall = async (number) => {
    // Implement make call logic
  };

  const clearError = () => {
    // Implement clear error logic
  };

  const formatDuration = (duration) => {
    // Implement duration formatting logic
  };

  // Add debug logging for render cycles
  console.log('CallPanel rendering with status:', callStatus);

  // CRITICAL: Always render something valid
  return (
    <div style={{ 
      width: '300px', 
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden', 
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 15px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>Softphone {isInitializing ? '(Initializing...)' : ''}</div>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >×</button>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          fontSize: '14px'
        }}>
          {errorMessage}
          <button 
            onClick={() => setErrorMessage('')}
            style={{
              marginLeft: '10px',
              padding: '2px 5px',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        </div>
      )}
      
      {/* Active call UI - only shown during active calls */}
      {(callStatus === 'connecting' || callStatus === 'in-progress') && (
        <ActiveCallUI 
          phoneNumber={phoneNumber}
          callStatus={callStatus}
          callDuration={callDuration}
          isMuted={isMuted}
          onHangup={() => {
            if (callRef.current) {
              callRef.current.disconnect();
            } else {
              setCallStatus('idle');
            }
          }}
          onMute={() => {
            setIsMuted(!isMuted);
            if (callRef.current) {
              callRef.current.mute(!isMuted);
            }
          }}
        />
      )}
      
      {/* Dialpad UI - only shown when not in a call */}
      {callStatus !== 'connecting' && callStatus !== 'in-progress' && (
        <div style={{ padding: '15px' }}>
          <input
            type="tel"
            placeholder="Enter phone number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            // IMPORTANT: Prevent form submission on Enter key
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCall();
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              marginBottom: '15px'
            }}
          />
          
          {/* Simplified dialpad */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px', 
            marginBottom: '15px' 
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
              <button
                key={digit}
                onClick={() => setPhoneInput(prev => prev + digit)}
                style={{
                  padding: '15px',
                  fontSize: '18px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {digit}
              </button>
            ))}
          </div>
          
          {/* Call button */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={(e) => handleCall(e)}
              disabled={!phoneInput.trim()}
              className="call-button"
            >
              Call
            </button>
          </div>
        </div>
      )}
      
      {/* Debug state - always show in development */}
      <div style={{ 
        padding: '5px 10px', 
        borderTop: '1px solid #eee',
        fontSize: '10px',
        color: '#999'
      }}>
        Status: {callStatus} | {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default CallPanel; 