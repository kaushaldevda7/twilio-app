import React from 'react';
import styled from 'styled-components';

const DialpadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 10px;
  padding: 10px 0;
`;

const DigitButton = styled.button`
  width: 100%;
  height: 50px;
  border-radius: var(--border-radius);
  background-color: #f0f2f5;
  color: var(--text-color);
  font-size: 18px;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  span.subtext {
    font-size: 10px;
    color: #666;
    font-weight: normal;
    margin-top: 2px;
  }
  
  &:hover {
    background-color: #e4e6e9;
  }
  
  &:active {
    background-color: #dcdfe3;
    transform: scale(0.95);
  }
`;

const Dialpad = ({ onDigitPress }) => {
  const handleDigitClick = (digit) => {
    if (onDigitPress) {
      onDigitPress(digit);
    }
  };
  
  const digits = [
    { main: '1', sub: '' },
    { main: '2', sub: 'ABC' },
    { main: '3', sub: 'DEF' },
    { main: '4', sub: 'GHI' },
    { main: '5', sub: 'JKL' },
    { main: '6', sub: 'MNO' },
    { main: '7', sub: 'PQRS' },
    { main: '8', sub: 'TUV' },
    { main: '9', sub: 'WXYZ' },
    { main: '*', sub: '' },
    { main: '0', sub: '+' },
    { main: '#', sub: '' },
  ];
  
  return (
    <DialpadContainer>
      {digits.map((digit, index) => (
        <DigitButton 
          key={index} 
          onClick={() => handleDigitClick(digit.main)} 
          aria-label={`Digit ${digit.main}`}
        >
          {digit.main}
          {digit.sub && <span className="subtext">{digit.sub}</span>}
        </DigitButton>
      ))}
    </DialpadContainer>
  );
};

export default Dialpad; 