import React from 'react';
import styled from 'styled-components';
import ReliableSoftphone from '../../src/components/ReliableSoftphone';

const AppContainer = styled.div`
  min-height: 100vh;
  position: relative;
  background-color: #f9f9f9;
  color: #333;
`;

const ContentArea = styled.div`
  padding: 20px;
  text-align: center;
  margin-top: 60px;
`;

const Heading = styled.h1`
  color: #000;
  margin-bottom: 20px;
`;

const Description = styled.p`
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  color: #333;
`;

function App() {
  return (
    <AppContainer>
      <ContentArea>
        <Heading>Modern Twilio Softphone</Heading>
        <Description>
          This is a web-based softphone powered by Twilio Programmable Voice. 
          Click the phone bubble in the corner to make or receive calls.
        </Description>
      </ContentArea>
      
      {/* New Modern Black & White Softphone */}
      <ReliableSoftphone />
    </AppContainer>
  );
}

export default App; 