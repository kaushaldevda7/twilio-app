import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CallProvider } from './contexts/CallContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CallProvider>
      <App />
    </CallProvider>
  </React.StrictMode>
); 