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
    const canvasRef = React.useRef(null);
    const animationRef = React.useRef(null);
    const idleTimeoutRef = React.useRef(null);
    const cycleIntervalRef = React.useRef(null);
    const [currentAnimation, setCurrentAnimation] = React.useState('smile');
    const [isIdleMode, setIsIdleMode] = React.useState(false);

    // Dot matrix patterns (8x8 grid)
    const patterns = {
      smile: [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,1,1,0,0,1],
        [0,1,0,0,0,0,1,0],
        [0,0,1,1,1,1,0,0]
      ],
      fishing: [
        [0,0,0,1,0,0,0,0],
        [0,0,1,1,1,0,0,0],
        [0,1,0,1,0,1,0,0],
        [1,0,0,1,0,0,1,0],
        [1,0,0,1,0,0,1,0],
        [1,0,0,0,1,0,1,0],
        [0,1,0,0,0,1,0,0],
        [0,0,1,1,1,0,0,1]
      ],
      reading: [
        [0,1,1,1,1,1,1,0],
        [1,0,1,0,1,0,1,1],
        [1,0,1,0,1,0,1,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,1,1,0,0,1],
        [1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,1],
        [0,1,1,1,1,1,1,0]
      ],
      cycling: [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,0,1,1,0,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,1,1,0,0,1],
        [1,0,1,0,0,1,0,1],
        [0,1,0,1,1,0,1,0],
        [0,0,1,0,0,1,0,0]
      ]
    };

    const drawDotMatrix = (canvas, pattern, animationPhase = 0) => {
      const ctx = canvas.getContext('2d');
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const gridSize = 8;
      const dotSize = Math.min(canvasWidth, canvasHeight) / (gridSize + 2);
      const startX = (canvasWidth - (gridSize * dotSize)) / 2;
      const startY = (canvasHeight - (gridSize * dotSize)) / 2;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Color based on theme
      const activeColor = theme === 'light' ? '#333' : '#fff';
      const inactiveColor = theme === 'light' ? 'rgba(51,51,51,0.2)' : 'rgba(255,255,255,0.2)';

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x = startX + col * dotSize + dotSize * 0.1;
          const y = startY + row * dotSize + dotSize * 0.1;
          const dotRadius = (dotSize * 0.8) / 2;

          ctx.beginPath();
          
          if (pattern[row][col] === 1) {
            // Active dot with enhanced pulsing animation
            let pulseScale = 1;
            if (currentAnimation === 'smile') {
              // Gentle pulse for smile
              pulseScale = 1 + Math.sin(animationPhase * 2 + row + col) * 0.15;
            } else if (currentAnimation === 'fishing') {
              // Bobbing animation for fishing
              pulseScale = 1 + Math.sin(animationPhase * 3 + col * 0.5) * 0.25;
            } else if (currentAnimation === 'reading') {
              // Page-turning flutter effect
              pulseScale = 1 + Math.sin(animationPhase * 1.5 + row * 0.3) * 0.1;
            } else if (currentAnimation === 'cycling') {
              // Fast cycling motion
              pulseScale = 1 + Math.sin(animationPhase * 4 + row + col * 0.8) * 0.3;
            }
            
            ctx.arc(x + dotRadius, y + dotRadius, dotRadius * pulseScale, 0, 2 * Math.PI);
            ctx.fillStyle = activeColor;
          } else {
            // Inactive dot with subtle breathing
            const breatheScale = 0.3 + Math.sin(animationPhase * 0.5) * 0.1;
            ctx.arc(x + dotRadius, y + dotRadius, dotRadius * breatheScale, 0, 2 * Math.PI);
            ctx.fillStyle = inactiveColor;
          }
          
          ctx.fill();
        }
      }
    };

    const animatePatternTransition = (fromPattern, toPattern, callback) => {
      if (!window.anime) {
        callback();
        return;
      }

      // Create transition animation using anime.js
      const transitionData = { progress: 0 };
      
      anime({
        targets: transitionData,
        progress: 1,
        duration: 800,
        easing: 'easeInOutQuad',
        update: () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          // Interpolate between patterns
          const blendedPattern = fromPattern.map((row, rowIndex) =>
            row.map((dot, colIndex) => {
              const from = dot;
              const to = toPattern[rowIndex][colIndex];
              return Math.random() < (from * (1 - transitionData.progress) + to * transitionData.progress) ? 1 : 0;
            })
          );
          
          drawDotMatrix(canvas, blendedPattern, Date.now() * 0.01);
        },
        complete: callback
      });
    };

    const startIdleAnimation = React.useCallback(() => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (cycleIntervalRef.current) {
        clearInterval(cycleIntervalRef.current);
      }
      
      idleTimeoutRef.current = setTimeout(() => {
        setIsIdleMode(true);
        const idleAnimations = ['fishing', 'reading', 'cycling'];
        
        const cycleToNextAnimation = () => {
          const randomAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
          const currentPattern = patterns[currentAnimation];
          const newPattern = patterns[randomAnimation];
          
          animatePatternTransition(currentPattern, newPattern, () => {
            setCurrentAnimation(randomAnimation);
          });
        };
        
        // Start first idle animation
        cycleToNextAnimation();
        
        // Continue cycling every 4 seconds
        cycleIntervalRef.current = setInterval(cycleToNextAnimation, 4000);
      }, 3000);
    }, [currentAnimation]);

    const resetToSmile = React.useCallback(() => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (cycleIntervalRef.current) {
        clearInterval(cycleIntervalRef.current);
      }
      
      setIsIdleMode(false);
      
      if (currentAnimation !== 'smile') {
        // Smooth transition back to smile
        const currentPattern = patterns[currentAnimation];
        const smilePattern = patterns['smile'];
        
        animatePatternTransition(currentPattern, smilePattern, () => {
          setCurrentAnimation('smile');
          startIdleAnimation();
        });
      } else {
        startIdleAnimation();
      }
    }, [currentAnimation, startIdleAnimation]);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let animationPhase = 0;
      const animate = () => {
        animationPhase += 0.1;
        drawDotMatrix(canvas, patterns[currentAnimation], animationPhase);
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [currentAnimation, theme]);

    React.useEffect(() => {
      if (isOpen) {
        setCurrentAnimation('smile');
        setIsIdleMode(false);
        startIdleAnimation();
      } else {
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }

      return () => {
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isOpen, startIdleAnimation]);

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
        
        // Reset to smile and restart idle timer
        resetToSmile();
        
        // Simulate bot response
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: `I received your message: "${inputMessage}". This is a demo response.`,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, botResponse]);
          // Reset idle timer after bot response
          resetToSmile();
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
        React.createElement('div', {
          key: 'title-container',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            cursor: 'pointer'
          },
          onClick: resetToSmile,
          onMouseEnter: resetToSmile,
          onTouchStart: resetToSmile
        }, [
          React.createElement('canvas', {
            key: 'dot-matrix',
            ref: canvasRef,
            width: 64,
            height: 64,
            style: {
              width: '32px',
              height: '32px',
              imageRendering: 'pixelated'
            }
          }),
          React.createElement('h2', {
            key: 'title-text',
            style: {
              margin: 0,
              fontSize: '24px',
              fontWeight: 700,
              color: theme === 'light' ? '#333' : '#fff'
            }
          }, 'System Assistant')
        ]),
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
            onChange: (e) => {
              setInputMessage(e.target.value);
              resetToSmile(); // Reset animation on typing
            },
            onKeyPress: handleKeyPress,
            onFocus: resetToSmile,
            onMouseEnter: resetToSmile,
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
