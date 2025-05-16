import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

const shake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(-10deg); }
  20% { transform: rotate(10deg); }
  30% { transform: rotate(-10deg); }
  40% { transform: rotate(10deg); }
  50% { transform: rotate(0deg); }
`;

const BubbleContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
`;

const Bubble = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${({ isOpen }) => isOpen ? 'var(--danger-color)' : 'var(--primary-color)'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
  transition: background-color 0.3s ease, transform 0.3s ease;
  position: relative;
  z-index: 2;
  
  &:hover {
    transform: scale(1.05);
  }
  
  svg {
    width: 28px;
    height: 28px;
    color: white;
  }
`;

const RippleEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 2px solid ${({ isRinging }) => isRinging ? 'var(--danger-color)' : 'var(--primary-color)'};
  animation: ${ripple} 1.5s infinite;
`;

const PhoneBubble = ({ isOpen, onClick, hasIncomingCall }) => {
  const [showRipple, setShowRipple] = useState(false);
  
  // Show ripple effect when there's an incoming call
  useEffect(() => {
    setShowRipple(hasIncomingCall);
  }, [hasIncomingCall]);
  
  return (
    <BubbleContainer
      style={{ animation: hasIncomingCall ? `${shake} 1.2s infinite` : 'none' }}
    >
      {showRipple && <RippleEffect isRinging={hasIncomingCall} />}
      <Bubble 
        isOpen={isOpen}
        onClick={onClick}
        aria-label={isOpen ? "Close phone" : "Open phone"}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        )}
      </Bubble>
    </BubbleContainer>
  );
};

export default PhoneBubble; 