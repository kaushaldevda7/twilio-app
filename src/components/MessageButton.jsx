import React, { useState, useEffect } from 'react';

const MessageButton = ({ onClick, hasNewMessages = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when new messages arrive
  useEffect(() => {
    if (hasNewMessages) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasNewMessages]);

  const handleClick = () => {
    setIsAnimating(false);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={isAnimating ? 'shake' : ''}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '130px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: 'black',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        fontSize: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      {/* iMessage-style chat bubble icon */}
      <div style={{ 
        width: '60%', 
        height: '60%', 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.486 2 2 5.589 2 10C2 14.411 6.486 18 12 18C12.498 18 12.988 17.967 13.47 17.904L19 22V16.891C21.255 15.42 22 12.794 22 10C22 5.589 17.514 2 12 2Z" fill="white"/>
        </svg>
        
        {hasNewMessages && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '12px',
            height: '12px',
            backgroundColor: 'red',
            borderRadius: '50%',
            border: '2px solid black'
          }} />
        )}
      </div>
      
      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            10% { transform: translateX(-3px) rotate(-1deg); }
            20% { transform: translateX(3px) rotate(1deg); }
            30% { transform: translateX(-3px) rotate(-1deg); }
            40% { transform: translateX(3px) rotate(1deg); }
            50% { transform: translateX(-2px) rotate(-1deg); }
            60% { transform: translateX(2px) rotate(1deg); }
            70% { transform: translateX(-1px) rotate(-1deg); }
            80% { transform: translateX(1px) rotate(1deg); }
            90% { transform: translateX(-1px) rotate(-1deg); }
            100% { transform: translateX(0); }
          }
          
          .shake {
            animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}
      </style>
    </button>
  );
};

export default MessageButton; 