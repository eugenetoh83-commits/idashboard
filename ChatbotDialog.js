// ChatbotDialog.js
// Sliding chatbot panel with message interface

(function() {
  function ChatbotDialog({ isOpen, onClose, theme }) {
    const [messages, setMessages] = React.useState([
      {
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m your system assistant. How can I help you today?',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    const [inputMessage, setInputMessage] = React.useState('');

    const dialogStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '400px',
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#1a1a2e',
      color: theme === 'light' ? '#333' : '#fff',
      boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
      overflowY: 'auto',
      fontFamily: 'Roboto Condensed, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    };

    const handleSendMessage = () => {
      if (inputMessage.trim()) {
        const newUserMessage = {
          id: Date.now(),
          type: 'user',
          content: inputMessage,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        
        // Simulate bot response
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: `I received your message: "${inputMessage}". This is a demo response.`,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, botResponse]);
        }, 1000);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    return React.createElement('div', { style: dialogStyle }, [
      // Header
      React.createElement('div', {
        key: 'header',
        style: {
          padding: '20px',
          borderBottom: `2px solid ${theme === 'light' ? '#e0e0e0' : '#333'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme === 'light' ? 'linear-gradient(135deg, rgb(210, 230, 250), rgb(180, 200, 220))' : 'linear-gradient(135deg, #2d3748, #1a1a2e)',
          flexShrink: 0
        }
      }, [
        React.createElement('h2', {
          key: 'title',
          style: {
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: theme === 'light' ? '#333' : '#fff'
          }
        }, '🤖 System Assistant'),
        React.createElement('button', {
          key: 'close',
          onClick: onClose,
          style: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'light' ? '#333' : '#fff',
            padding: '5px 10px',
            borderRadius: '50%',
            transition: 'background-color 0.3s'
          },
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = 'transparent';
          }
        }, '✕')
      ]),

      // Messages Container
      React.createElement('div', {
        key: 'messages',
        style: {
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }
      }, messages.map(message => 
        React.createElement('div', {
          key: message.id,
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
          }
        }, [
          React.createElement('div', {
            key: 'bubble',
            style: {
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: message.type === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
              backgroundColor: message.type === 'user' 
                ? (theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)')
                : (theme === 'light' ? '#fff' : '#2d3748'),
              color: message.type === 'user' 
                ? (theme === 'light' ? '#fff' : '#1a1a2e')
                : (theme === 'light' ? '#333' : '#fff'),
              boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)',
              fontSize: '14px',
              lineHeight: '1.4'
            }
          }, message.content),
          React.createElement('div', {
            key: 'timestamp',
            style: {
              fontSize: '11px',
              color: theme === 'light' ? '#666' : '#aaa',
              marginTop: '4px',
              marginLeft: message.type === 'user' ? '0' : '16px',
              marginRight: message.type === 'user' ? '16px' : '0'
            }
          }, message.timestamp)
        ])
      )),

      // Input Container
      React.createElement('div', {
        key: 'input-container',
        style: {
          padding: '20px',
          borderTop: `1px solid ${theme === 'light' ? '#e0e0e0' : '#333'}`,
          flexShrink: 0
        }
      }, [
        React.createElement('div', {
          key: 'input-wrapper',
          style: {
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end'
          }
        }, [
          React.createElement('textarea', {
            key: 'input',
            value: inputMessage,
            onChange: (e) => setInputMessage(e.target.value),
            onKeyPress: handleKeyPress,
            placeholder: 'Type your message...',
            style: {
              flex: 1,
              padding: '12px',
              borderRadius: '20px',
              border: `2px solid ${theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)'}`,
              backgroundColor: theme === 'light' ? '#fff' : '#2d3748',
              color: theme === 'light' ? '#333' : '#fff',
              fontFamily: 'Roboto Condensed, sans-serif',
              fontSize: '14px',
              resize: 'none',
              maxHeight: '100px',
              minHeight: '44px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }
          }),
          React.createElement('button', {
            key: 'send',
            onClick: handleSendMessage,
            disabled: !inputMessage.trim(),
            style: {
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: inputMessage.trim() 
                ? (theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)')
                : (theme === 'light' ? '#ddd' : '#444'),
              color: inputMessage.trim() 
                ? (theme === 'light' ? '#fff' : '#1a1a2e')
                : (theme === 'light' ? '#999' : '#666'),
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              flexShrink: 0
            }
          }, '📤')
        ])
      ])
    ]);
  }

  window.ChatbotDialog = ChatbotDialog;
})();
