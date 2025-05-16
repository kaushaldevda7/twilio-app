import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Dialpad from './Dialpad';
import { useCall } from '../contexts/CallContext';

const Panel = styled.div`
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 300px;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  z-index: 999;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  background-color: var(--primary-color);
  color: white;
  padding: 15px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IncomingCall = styled.div`
  padding: 20px;
  text-align: center;
  background-color: #fff5f5;
`;

const CallInfo = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${({ isActive }) => isActive ? '#f1f9f1' : 'white'};
`;

const PhoneNumber = styled.div`
  font-size: 18px;
  margin-bottom: 5px;
  font-weight: ${({ isActive }) => isActive ? 'bold' : 'normal'};
`;

const CallStatus = styled.div`
  font-size: 14px;
  color: ${({ isActive }) => isActive ? 'var(--secondary-color)' : '#666'};
  margin-bottom: 10px;
`;

const CallDuration = styled.div`
  font-size: 14px;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #ffe6e6;
  color: var(--danger-color);
  padding: 10px;
  font-size: 14px;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  padding: 15px;
  gap: 15px;
`;

const ActionButton = styled.button`
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ green, red, gray }) => 
    green ? 'var(--secondary-color)' : 
    red ? 'var(--danger-color)' : 
    gray ? '#e0e0e0' : 'var(--primary-color)'};
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const PhoneInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 16px;
  text-align: center;
`;

const CallPanel = ({ onClose }) => {
  const [phoneInput, setPhoneInput] = useState('');
  
  const {
    callStatus,
    phoneNumber,
    formattedDuration,
    isMuted,
    errorMessage,
    makeCall,
    answerCall,
    rejectCall,
    hangupCall,
    toggleMute,
    clearError,
    isInitialized,
    isLoading
  } = useCall();
  
  // Helper function to determine if call is active
  const isCallActive = () => {
    return ['connecting', 'ringing', 'in-progress', 'incoming'].includes(callStatus);
  };
  
  // Handle dialpad input
  const handleDigitPress = (digit) => {
    setPhoneInput(prev => prev + digit);
  };
  
  // Handle making a call
  const handleCall = () => {
    if (phoneInput.trim()) {
      makeCall(phoneInput.trim());
    }
  };
  
  // Allow Enter key to initiate call
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isCallActive()) {
      handleCall();
    }
  };
  
  // Clear phone input on component mount
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearError]);
  
  // Get status text based on call status
  const getStatusText = () => {
    switch(callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'in-progress':
        return 'In call';
      case 'incoming':
        return 'Incoming call';
      case 'completed':
        return 'Call ended';
      default:
        return '';
    }
  };
  
  // Add a useEffect to ensure the panel stays open during active calls
  useEffect(() => {
    const isCallActive = ['connecting', 'ringing', 'in-progress', 'incoming'].includes(callStatus);
    
    // Log the current call status to help debug UI issues
    console.log(`Current call status: ${callStatus}, isCallActive: ${isCallActive}`);
    
    // If there's an active call but the panel is going to close, prevent it
    if (isCallActive && !isPanelOpen) {
      console.log('Call is active but panel was closing - keeping open');
      // You might need to implement a callback to the parent component
      // or use context to ensure the panel stays open
    }
  }, [callStatus]);
  
  // Add better debug info in the UI when in development mode
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div style={{ padding: '8px', backgroundColor: '#f9f9f9', fontSize: '12px', borderTop: '1px solid #ddd' }}>
        <div><strong>Call Status:</strong> {callStatus}</div>
        <div><strong>Number:</strong> {phoneNumber}</div>
        <div><strong>Device Ready:</strong> {isInitialized ? 'Yes' : 'No'}</div>
      </div>
    );
  };
  
  return (
    <Panel>
      <Header>
        <div>Softphone {isLoading && '(Initializing...)'}</div>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      
      {errorMessage && (
        <ErrorMessage>
          {errorMessage}
          <button 
            onClick={clearError} 
            style={{ marginLeft: '8px', padding: '2px 5px', fontSize: '12px' }}
          >
            Clear
          </button>
        </ErrorMessage>
      )}
      
      {callStatus === 'incoming' && (
        <IncomingCall>
          <PhoneNumber isActive={true}>Incoming Call</PhoneNumber>
          <CallStatus isActive={true}>from {phoneNumber || 'Unknown'}</CallStatus>
          <ActionButtons>
            <ActionButton green onClick={answerCall} aria-label="Answer call">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </ActionButton>
            <ActionButton red onClick={rejectCall} aria-label="Reject call">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </ActionButton>
          </ActionButtons>
        </IncomingCall>
      )}
      
      {isCallActive() && callStatus !== 'incoming' && (
        <CallInfo isActive={true}>
          <PhoneNumber isActive={true}>{phoneNumber}</PhoneNumber>
          <CallStatus isActive={true}>{getStatusText()}</CallStatus>
          {callStatus === 'in-progress' && (
            <CallDuration>{formattedDuration}</CallDuration>
          )}
          <ActionButtons>
            <ActionButton 
              gray={!isMuted}
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              )}
            </ActionButton>
            <ActionButton 
              red
              onClick={hangupCall}
              aria-label="End call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </ActionButton>
          </ActionButtons>
        </CallInfo>
      )}
      
      {!isCallActive() && callStatus !== 'incoming' && (
        <div style={{ padding: '15px' }}>
          {isLoading && (
            <div style={{ marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa' }}>
              <p>Initializing phone service... You can make calls anyway.</p>
            </div>
          )}
          
          <PhoneInput
            type="tel"
            placeholder="Enter phone number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <Dialpad onDigitPress={handleDigitPress} />
          
          <ActionButtons>
            <ActionButton 
              green
              onClick={handleCall}
              disabled={!phoneInput.trim()}
              aria-label="Make call"
              style={{ width: '60px', height: '60px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </ActionButton>
          </ActionButtons>
        </div>
      )}
      
      {renderDebugInfo()}
    </Panel>
  );
};

export default CallPanel; 