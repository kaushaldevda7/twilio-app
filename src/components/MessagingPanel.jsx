import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Utility function to format phone numbers
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a US/Canada number (starts with 1 and has 11 digits)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // Handle US number without country code (10 digits)
  else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  // If it's another format, just add a + if it doesn't have one
  else if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  } else {
    return `+${phoneNumber}`;
  }
};

// Components for the messaging interface
const ConversationList = ({ conversations, activeConversation, setActiveConversation, setConversations, onNewConversation }) => {
  const handleSelectConversation = (conversation) => {
    console.log('Selected conversation:', conversation.phoneNumber);
    
    // Create a deep copy of the selected conversation to avoid reference issues
    const conversationCopy = JSON.parse(JSON.stringify(conversation));
    
    // Reset new messages indicator when selecting a conversation
    conversationCopy.hasNewMessages = false;
    
    // Set the active conversation with the updated copy
    setActiveConversation(conversationCopy);
    
    // Update the conversations list to clear the new message flag for this conversation
    if (conversation.hasNewMessages) {
      setConversations(prevConversations => {
        // Create a deep copy of the previous conversations
        const updatedConversations = JSON.parse(JSON.stringify(prevConversations));
        
        // Find and update the selected conversation
        return updatedConversations.map(conv => {
          if (conv.phoneNumber === conversation.phoneNumber) {
            return {
              ...conv,
              hasNewMessages: false // Clear new message flag
            };
          }
          return conv;
        });
      });
    }
  };
  
  return (
    <div style={{
      width: '250px',
      borderRight: '1px solid #e0e0e0',
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Button to start new conversation */}
      <button 
        onClick={onNewConversation}
        style={{
          padding: '10px',
          backgroundColor: '#007aff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          margin: '10px',
          cursor: 'pointer'
        }}
      >
        New Conversation
      </button>
      
      {conversations.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          margin: 'auto', 
          color: '#8e8e93', 
          padding: '20px' 
        }}>
          No conversations yet
        </div>
      ) : (
        conversations.map((conversation, index) => {
          // Format the phone number for display
          const formattedPhoneNumber = formatPhoneNumber(conversation.phoneNumber);
          
          return (
            <div 
              key={`conversation-${conversation.phoneNumber}-${index}`}
              onClick={() => handleSelectConversation(conversation)}
              style={{
                padding: '12px 15px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                backgroundColor: activeConversation?.phoneNumber === conversation.phoneNumber 
                  ? '#f5f5f5' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {conversation.name !== conversation.phoneNumber ? conversation.name : formattedPhoneNumber}
                {conversation.hasNewMessages && (
                  <span style={{
                    marginLeft: '6px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff3b30',
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                )}
              </div>
              {conversation.lastMessage && (
                <div style={{ 
                  fontSize: '14px', 
                  color: '#8e8e93',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '220px'
                }}>
                  {conversation.lastMessage.content}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

const MessageBubble = ({ message, isOutgoing }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
      marginBottom: '8px'
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '8px 12px',
        borderRadius: '18px',
        backgroundColor: isOutgoing ? '#007aff' : '#e9e9eb',
        color: isOutgoing ? 'white' : 'black',
        wordBreak: 'break-word'
      }}>
        {message.content}
        <div style={{
          fontSize: '10px',
          marginTop: '2px',
          textAlign: 'right',
          opacity: 0.7
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const ConversationView = ({ conversation, sendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages?.length]); 
  
  if (!conversation) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8e8e93'
      }}>
        Select a conversation or start a new one
      </div>
    );
  }
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(conversation.phoneNumber, newMessage.trim());
      setNewMessage('');
    }
  };
  
  // Get messages safely from conversation
  const messages = conversation?.messages || [];
  
  // Format the phone number for display
  const formattedPhoneNumber = formatPhoneNumber(conversation.phoneNumber);
  
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {conversation.name !== conversation.phoneNumber ? conversation.name : formattedPhoneNumber}
      </div>
      
      <div style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageBubble 
              key={`message-${index}-${message.timestamp}`} 
              message={message} 
              isOutgoing={message.direction === 'outbound'} 
            />
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            margin: 'auto', 
            color: '#8e8e93' 
          }}>
            No messages yet
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} style={{
        padding: '12px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #e0e0e0',
            outline: 'none'
          }}
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            marginLeft: '8px',
            padding: '0 15px',
            backgroundColor: '#007aff',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: newMessage.trim() ? 'pointer' : 'default',
            opacity: newMessage.trim() ? 1 : 0.6
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

// New Conversation Modal
const NewConversationModal = ({ isOpen, onClose, onSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      onSubmit(phoneNumber.trim());
      setPhoneNumber('');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1010
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        width: '300px',
        maxWidth: '90%'
      }}>
        <h3 style={{ marginTop: 0 }}>New Message</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number..."
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              outline: 'none'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 15px',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!phoneNumber.trim()}
              style={{
                padding: '8px 15px',
                backgroundColor: '#007aff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: phoneNumber.trim() ? 'pointer' : 'default',
                opacity: phoneNumber.trim() ? 1 : 0.6
              }}
            >
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Messaging Panel Component
const MessagingPanel = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const socketRef = useRef(null);
  const serverUrlRef = useRef(null);
  const activeConversationRef = useRef(null);
  
  // Update the ref whenever activeConversation changes
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);
  
  // When opening the panel, fetch conversations
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      setHasNewMessages(false);
    }
  }, [isOpen]);
  
  // Force component to update every second when there are new messages
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (hasNewMessages) {
        setForceUpdate(prev => prev + 1);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [hasNewMessages]);
  
  // Get the base URL for server connections
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
  
  // Initialize axios base URL
  useEffect(() => {
    serverUrlRef.current = getServerUrl();
    axios.defaults.baseURL = serverUrlRef.current;
    console.log(`API calls will be sent to: ${serverUrlRef.current}`);
  }, []);
  
  // Set up socket connection when component mounts
  useEffect(() => {
    if (isOpen) {
      if (socketRef.current) {
        console.log('Socket already exists, disconnecting before reconnecting');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Save the server URL for reconnection
      const serverUrl = serverUrlRef.current || getServerUrl();
      serverUrlRef.current = serverUrl;
      
      console.log(`Connecting to WebSocket server at ${serverUrl}`);
      socketRef.current = io(serverUrl, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
      });
      
      socketRef.current.on('connect', () => {
        console.log('Socket connected for messaging');
        setSocketConnected(true);
        
        // When connected, fetch the conversations to ensure we have the latest data
        fetchConversations();
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log(`Socket disconnected for messaging: ${reason}`);
        setSocketConnected(false);
      });
      
      socketRef.current.on('new-message', (message) => {
        console.log('New message received via socket:', message);
        // Force the function to run in the next tick to ensure state is updated
        setTimeout(() => {
          handleIncomingMessage(message);
        }, 0);
      });
      
      socketRef.current.on('error', (error) => {
        console.error('Socket connection error:', error);
      });
      
      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt #${attemptNumber}`);
      });
      
      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        setSocketConnected(true);
        
        // When reconnected, fetch conversations to ensure we have latest data
        fetchConversations();
        
        // Also reload active conversation if we have one
        if (activeConversation) {
          fetchMessages(activeConversation.phoneNumber);
        }
      });
      
      // If we have existing conversations, force reload messages for the active conversation
      if (activeConversation) {
        console.log('Reloading active conversation messages');
        fetchMessages(activeConversation.phoneNumber);
      }
    }
    
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting messaging socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen]);
  
  // Function to handle incoming messages from socket
  const handleIncomingMessage = (message) => {
    console.log('Processing incoming message:', message);
    
    // Create formatted message object
    const formattedMessage = {
      content: message.body,
      timestamp: new Date(message.timestamp),
      direction: message.direction
    };
    
    // Determine the other party in the conversation (from or to)
    const otherParty = message.direction === 'inbound' ? message.from : message.to;
    
    console.log(`Received ${message.direction} message from/to ${otherParty}`);
    
    // Only set new messages flag for INCOMING messages
    const shouldMarkAsNew = message.direction === 'inbound';
    
    // Update conversations list
    setConversations(prevConversations => {
      // Find if conversation already exists
      const existingConvIndex = prevConversations.findIndex(conv => 
        conv.phoneNumber === otherParty
      );
      
      // Create a deep copy of the previous conversations array
      const newConversations = JSON.parse(JSON.stringify(prevConversations));
      
      if (existingConvIndex >= 0) {
        // Get the existing messages for this conversation (using deep copy)
        const existingMessages = newConversations[existingConvIndex].messages || [];
        
        // Create a new conversation object with the new message added to existing messages
        newConversations[existingConvIndex] = {
          ...newConversations[existingConvIndex],
          lastMessage: formattedMessage,
          messages: [...existingMessages, formattedMessage],
          hasNewMessages: shouldMarkAsNew // Only mark as new for incoming messages
        };
        
        return newConversations;
      } else {
        // Create new conversation
        return [
          {
            phoneNumber: otherParty,
            lastMessage: formattedMessage,
            messages: [formattedMessage],
            hasNewMessages: shouldMarkAsNew // Only mark as new for incoming messages
          },
          ...newConversations
        ];
      }
    });
    
    // Update the active conversation if it matches this message
    if (activeConversation && activeConversation.phoneNumber === otherParty) {
      console.log('Updating active conversation with new message');
      
      // Make a deep copy of the active conversation
      const activeConversationCopy = JSON.parse(JSON.stringify(activeConversation));
      
      // Get existing messages from activeConversation
      const existingMessages = activeConversationCopy.messages || [];
      
      // Create a new reference to force re-render with messages preserved
      const updatedConversation = {
        ...activeConversationCopy,
        lastMessage: formattedMessage,
        messages: [...existingMessages, formattedMessage],
        hasNewMessages: false // Already viewing this conversation
      };
      
      setActiveConversation(updatedConversation);
    } else {
      // Set hasNewMessages flag for UI notification ONLY for incoming messages
      if (message.direction === 'inbound') {
        setHasNewMessages(true);
      }
      
      // If there's no active conversation, set this one as active
      if (!activeConversation) {
        // Find or create the conversation object
        const newActiveConv = {
          phoneNumber: otherParty,
          lastMessage: formattedMessage,
          messages: [formattedMessage],
          hasNewMessages: false // Set to false since we're making it active
        };
        
        // Set as active conversation
        setActiveConversation(newActiveConv);
      }
    }
  };
  
  // Fetch conversations when panel is opened
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/sms/conversations');
      
      if (response.data.success) {
        // Format the data for our component
        const formattedConversations = response.data.conversations.map(conv => ({
          phoneNumber: conv.phoneNumber,
          name: conv.phoneNumber, // We could add contact lookup here in the future
          lastMessage: {
            content: conv.lastMessage.body,
            timestamp: conv.lastMessage.timestamp,
            direction: conv.lastMessage.direction
          }
        }));
        
        setConversations(formattedConversations);
      } else {
        setError('Failed to load conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Error loading conversations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch messages for a specific conversation
  const fetchMessages = async (phoneNumber) => {
    if (!phoneNumber) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching messages for ${phoneNumber}...`);
      
      // Remove the '+' if present for the API call
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
      
      const response = await axios.get(`/api/sms/history/${formattedNumber}`);
      if (response.data.success) {
        console.log(`Retrieved ${response.data.messages.length} messages for ${phoneNumber}`);
        
        // Format the messages
        const formattedMessages = response.data.messages.map(msg => ({
          content: msg.body,
          timestamp: new Date(msg.timestamp),
          direction: msg.direction
        }));
        
        // Update the conversations list with the messages
        setConversations(prevConversations => {
          const convIndex = prevConversations.findIndex(c => c.phoneNumber === phoneNumber);
          
          if (convIndex >= 0) {
            // Create a copy of the conversations array
            const newConversations = [...prevConversations];
            
            // Update the specific conversation with the messages
            newConversations[convIndex] = {
              ...newConversations[convIndex],
              messages: formattedMessages,
              lastMessage: formattedMessages.length > 0 
                ? formattedMessages[formattedMessages.length - 1] 
                : newConversations[convIndex].lastMessage
            };
            
            return newConversations;
          }
          
          return prevConversations;
        });
        
        // If this is the active conversation, update it directly
        if (activeConversation && activeConversation.phoneNumber === phoneNumber) {
          console.log('Updating active conversation with fetched messages');
          setActiveConversation(prevActive => ({
            ...prevActive,
            messages: formattedMessages,
            lastMessage: formattedMessages.length > 0 
              ? formattedMessages[formattedMessages.length - 1] 
              : prevActive.lastMessage
          }));
        }
      } else {
        console.error('Failed to fetch messages:', response.data.error);
        setError('Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error loading messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // When active conversation changes, fetch its messages
  useEffect(() => {
    if (activeConversation && !activeConversation.messages) {
      fetchMessages(activeConversation.phoneNumber);
    }
  }, [activeConversation]);
  
  // Function to send a new message
  const sendMessage = async (to, content) => {
    try {
      console.log(`Sending message to ${to}: ${content}`);
      setError(null);
      
      // Create new message object for optimistic UI update
      const newMessage = {
        content,
        timestamp: new Date(),
        direction: 'outbound'
      };

      console.log('Current active conversation before update:', activeConversation);
      
      // Store a reference to the current active conversation for later
      const currentActiveConversation = JSON.parse(JSON.stringify(activeConversation));
      
      // Optimistically update UI immediately, before the API call
      setConversations(prevConversations => {
        // Create a deep copy of the previous conversations array
        const newConversations = JSON.parse(JSON.stringify(prevConversations));
        
        const existingConvIndex = newConversations.findIndex(conv => conv.phoneNumber === to);
        
        if (existingConvIndex >= 0) {
          // Make a deep copy of the existing conversation's messages
          const existingMessages = newConversations[existingConvIndex].messages || [];
          const updatedMessages = [...existingMessages, newMessage];
          
          // Update the conversation with the new message added to existing messages
          // Ensure hasNewMessages isn't changed for outgoing messages
          const hasNewMessages = newConversations[existingConvIndex].hasNewMessages || false;
          
          newConversations[existingConvIndex] = {
            ...newConversations[existingConvIndex],
            lastMessage: newMessage,
            messages: updatedMessages,
            hasNewMessages: hasNewMessages // Preserve existing value for outgoing messages
          };
          
          console.log(`Updated conversation ${to} with ${updatedMessages.length} messages`);
          return newConversations;
        } else {
          // Create a new conversation
          console.log(`Creating new conversation for ${to}`);
          return [
            ...newConversations,
            {
              phoneNumber: to,
              lastMessage: newMessage,
              messages: [newMessage],
              hasNewMessages: false // No new messages for ones we send ourselves
            }
          ];
        }
      });
      
      // Update active conversation if this message is for the currently active conversation
      if (currentActiveConversation && currentActiveConversation.phoneNumber === to) {
        console.log(`Updating active conversation ${to} with new message`);
        
        // Make a complete copy of the active conversation
        const existingMessages = currentActiveConversation.messages || [];
        
        const updatedConversation = {
          ...currentActiveConversation,
          lastMessage: newMessage,
          messages: [...existingMessages, newMessage],
          // Don't change hasNewMessages for outgoing messages
          hasNewMessages: currentActiveConversation.hasNewMessages || false
        };
        
        console.log(`Active conversation will have ${updatedConversation.messages.length} messages`);
        setActiveConversation(updatedConversation);
      }
      
      // Make the API call
      const response = await axios.post('/api/sms/send', {
        to,
        body: content
      });
      
      if (!response.data.success) {
        setError('Failed to send message');
      } else {
        console.log('Message sent successfully via API');
      }
      
      // No need to update state again here since we've already done it optimistically
      // Socket connection will handle any further updates from the server
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error sending message. Please try again.');
      // UI already updated optimistically, no need to do it again here
    }
  };
  
  // Function to start a new conversation
  const startNewConversation = (phoneNumber) => {
    // Clean and format the phone number
    let formattedNumber = phoneNumber.trim();
    
    // Add + prefix if not already there and not empty
    if (formattedNumber && !formattedNumber.startsWith('+')) {
      formattedNumber = `+${formattedNumber}`;
    }
    
    console.log(`Starting new conversation with ${formattedNumber}`);
    
    // Check if conversation already exists
    const existingConvIndex = conversations.findIndex(conv => conv.phoneNumber === formattedNumber);
    
    if (existingConvIndex >= 0) {
      // Get a deep copy of the existing conversation
      const existingConversation = JSON.parse(JSON.stringify(conversations[existingConvIndex]));
      
      // Clear any new message flags
      existingConversation.hasNewMessages = false;
      
      // Set as active conversation
      setActiveConversation(existingConversation);
    } else {
      // Create a new conversation object
      const newConversation = {
        phoneNumber: formattedNumber,
        name: formattedNumber, // We could add contact lookup here in the future
        messages: [],
        hasNewMessages: false
      };
      
      // Add to conversations list
      setConversations(prevConversations => {
        const newConversations = JSON.parse(JSON.stringify(prevConversations));
        return [newConversation, ...newConversations];
      });
      
      // Set as active conversation
      setActiveConversation(newConversation);
    }
    
    // Close the modal
    setIsNewConversationModalOpen(false);
  };
  
  // Function to check for new messages (for external components like MessageButton)
  MessagingPanel.hasNewMessages = () => {
    return hasNewMessages;
  };
  
  // Function to reset new messages flag (for external components)
  MessagingPanel.resetNewMessages = () => {
    setHasNewMessages(false);
  };
  
  // Add a useEffect to trigger re-renders when activeConversation changes
  useEffect(() => {
    if (activeConversation) {
      console.log('Active conversation updated:', activeConversation.phoneNumber);
      console.log('Message count:', activeConversation.messages?.length || 0);
    }
  }, [activeConversation]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      width: '750px',
      height: '500px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1001,
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Twilio Messaging</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#8e8e93'
          }}
        >
          ×
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1002
        }}>
          Loading...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{
          padding: '10px',
          margin: '5px 10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <ConversationList 
          conversations={conversations}
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
          setConversations={setConversations}
          onNewConversation={() => setIsNewConversationModalOpen(true)}
        />
        <ConversationView 
          conversation={activeConversation}
          sendMessage={sendMessage}
        />
      </div>
      
      {/* New Conversation Modal */}
      <NewConversationModal 
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onSubmit={startNewConversation}
      />
    </div>
  );
};

export default MessagingPanel; 