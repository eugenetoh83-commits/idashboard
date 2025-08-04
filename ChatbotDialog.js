// ChatbotDialog.js
// Sliding chatbot panel with message interface

(function() {
  function ChatbotDialog({ isOpen, onClose, theme }) {
    const [messages, setMessages] = React.useState([
      {
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m your smart assistant. I can flip coins, roll dice, tell jokes, share quotes, give weather updates, and play games with you! Type "help" to see all my features. 🤖',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    const [inputMessage, setInputMessage] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const canvasRef = React.useRef(null);
    const animationRef = React.useRef(null);
    const idleTimeoutRef = React.useRef(null);
    const cycleIntervalRef = React.useRef(null);
    const debounceTimeoutRef = React.useRef(null);
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
      clock: [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,0,0,1,0,0,1],
        [1,0,0,0,1,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [0,1,0,0,0,0,1,0],
        [0,0,1,1,1,1,0,0]
      ]
    };

    const generateClockPattern = (animationPhase) => {
      // Create a fresh base pattern each time
      const basePattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [0,1,0,0,0,0,1,0],
        [0,0,1,1,1,1,0,0]
      ].map(row => [...row]); // Deep copy to avoid mutation

      // Center of the clock
      const centerX = 3.5;
      const centerY = 3.5;
      
      // Calculate hand positions based on animation phase
      const hourAngle = (animationPhase * 0.05) % (Math.PI * 2); // Slower hour hand
      const minuteAngle = (animationPhase * 0.3) % (Math.PI * 2); // Faster minute hand
      
      // Hour hand (shorter)
      const hourX = Math.round(centerX + Math.cos(hourAngle - Math.PI / 2) * 1.5);
      const hourY = Math.round(centerY + Math.sin(hourAngle - Math.PI / 2) * 1.5);
      
      // Minute hand (longer)
      const minuteX = Math.round(centerX + Math.cos(minuteAngle - Math.PI / 2) * 2.5);
      const minuteY = Math.round(centerY + Math.sin(minuteAngle - Math.PI / 2) * 2.5);
      
      // Add hands to pattern
      if (hourX >= 0 && hourX < 8 && hourY >= 0 && hourY < 8) {
        basePattern[hourY][hourX] = 1;
      }
      if (minuteX >= 0 && minuteX < 8 && minuteY >= 0 && minuteY < 8) {
        basePattern[minuteY][minuteX] = 1;
      }
      
      // Center dot (make it more prominent)
      basePattern[3][3] = 1;
      basePattern[3][4] = 1;
      basePattern[4][3] = 1;
      basePattern[4][4] = 1;
      
      return basePattern;
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
            } else if (currentAnimation === 'clock') {
              // Steady glow for clock
              pulseScale = 1 + Math.sin(animationPhase * 1.5) * 0.1;
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

    const animatePatternTransition = (fromPattern, toAnimationType, callback) => {
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
          
          // Get the target pattern
          let toPattern;
          if (toAnimationType === 'clock') {
            toPattern = generateClockPattern(Date.now() * 0.01);
          } else {
            toPattern = patterns[toAnimationType];
          }
          
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
      console.log('⏰ Starting idle animation timer (from manual reset)');
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (cycleIntervalRef.current) {
        clearInterval(cycleIntervalRef.current);
      }
      
      idleTimeoutRef.current = setTimeout(() => {
        console.log('💤 Idle timeout reached - switching to clock animation (from manual reset)');
        setIsIdleMode(true);
        
        // Get current pattern at the time of timeout
        setCurrentAnimation(prevAnimation => {
          const currentPattern = prevAnimation === 'clock' 
            ? generateClockPattern(Date.now() * 0.01)
            : patterns[prevAnimation];
          
          animatePatternTransition(currentPattern, 'clock', () => {
            console.log('🕐 Clock animation started (from manual reset)');
            setCurrentAnimation('clock');
          });
          
          return prevAnimation; // Don't change animation here, let the transition handle it
        });
      }, 3000);
    }, []); // No dependencies to prevent recreation

    const resetToSmile = React.useCallback(() => {
      // Add logging to track when animation resets
      console.log('🎭 resetToSmile called - Time:', new Date().toLocaleTimeString());
      
      // Debounce the reset to prevent too frequent calls
      if (debounceTimeoutRef.current) {
        console.log('🚫 resetToSmile debounced - already scheduled');
        return; // Already scheduled, don't trigger again
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        console.log('🔄 resetToSmile executing - transitioning to smile');
        
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current);
        }
        
        setIsIdleMode(false);
        
        // Use functional update to get current animation at time of execution
        setCurrentAnimation(prevAnimation => {
          console.log('🎨 Current animation at reset time:', prevAnimation);
          
          if (prevAnimation !== 'smile') {
            console.log('🎨 Animating transition from', prevAnimation, 'to smile');
            // Smooth transition back to smile
            const currentPattern = prevAnimation === 'clock' 
              ? generateClockPattern(Date.now() * 0.01)
              : patterns[prevAnimation];
            
            animatePatternTransition(currentPattern, 'smile', () => {
              console.log('✅ Animation transition to smile completed');
              setCurrentAnimation('smile');
              startIdleAnimation();
            });
            
            return prevAnimation; // Don't change yet, let transition handle it
          } else {
            console.log('😊 Already showing smile, just restarting idle timer');
            startIdleAnimation();
            return 'smile';
          }
        });
        
        debounceTimeoutRef.current = null;
      }, 100); // 100ms debounce
    }, [startIdleAnimation]);

    // Only reset on very deliberate click/touch interactions - NO MOUSE MOVEMENT
    const handleDeliberateReset = React.useCallback(() => {
      console.log('👆 Deliberate click/touch detected - resetting to smile');
      resetToSmile();
    }, [resetToSmile]);

    // API Functions
    const getRandomQuote = async () => {
      try {
        const response = await fetch('https://api.quotable.io/random');
        const data = await response.json();
        return `"${data.content}" - ${data.author}`;
      } catch (error) {
        return "Here's a quote for you: 'The only way to do great work is to love what you do.' - Steve Jobs";
      }
    };

    const getDadJoke = async () => {
      try {
        const response = await fetch('https://icanhazdadjoke.com/', {
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        return data.joke;
      } catch (error) {
        return "Why don't scientists trust atoms? Because they make up everything! 😄";
      }
    };

    const getWeather = async () => {
      try {
        // Using OpenWeatherMap API - you might need to replace with a working API key
        const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Singapore&appid=demo&units=metric');
        if (!response.ok) {
          throw new Error('API not available');
        }
        const data = await response.json();
        return `🌤️ Singapore Weather:\n🌡️ Temperature: ${data.main.temp}°C\n💧 Humidity: ${data.main.humidity}%\n☁️ Condition: ${data.weather[0].description}\n${data.main.humidity > 80 ? '🌧️ High chance of rain' : '☀️ Low chance of rain'}`;
      } catch (error) {
        // Fallback weather data for Singapore
        const conditions = ['sunny', 'partly cloudy', 'cloudy', 'light rain'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 8) + 26; // 26-34°C typical for Singapore
        const humidity = Math.floor(Math.random() * 30) + 60; // 60-90%
        return `🌤️ Singapore Weather:\n🌡️ Temperature: ${temp}°C\n💧 Humidity: ${humidity}%\n☁️ Condition: ${condition}\n${humidity > 80 ? '🌧️ High chance of rain' : '☀️ Low chance of rain'}`;
      }
    };

    const flipCoin = () => {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      return `🪙 Coin flip result: ${result}!`;
    };

    const rollDice = () => {
      const result = Math.floor(Math.random() * 6) + 1;
      return `🎲 Dice roll result: ${result}!`;
    };

    const playRockPaperScissors = () => {
      const choices = ['rock', 'paper', 'scissors'];
      const userChoice = choices[Math.floor(Math.random() * 3)];
      const botChoice = choices[Math.floor(Math.random() * 3)];
      
      let result;
      if (userChoice === botChoice) {
        result = "It's a draw!";
      } else if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'paper' && botChoice === 'rock') ||
        (userChoice === 'scissors' && botChoice === 'paper')
      ) {
        result = "You win! 🎉";
      } else {
        result = "You lose! 😅";
      }
      
      return `🎮 Rock Paper Scissors!\nYour choice: ${userChoice}\nMy choice: ${botChoice}\n${result}`;
    };

    const getHelpMessage = () => {
      return `🤖 I can help you with these features:\n\n` +
             `🪙 Flip a coin - just say "flip coin" or "coin flip"\n` +
             `🎲 Roll a die - say "roll dice" or "dice roll"\n` +
             `🎮 Play a game - say "rock paper scissors" or "play game"\n` +
             `😄 Tell a joke - say "tell me a joke" or just "joke"\n` +
             `💭 Share a quote - say "give me a quote" or just "quote"\n` +
             `🌤️ Get weather - say "weather" or "what's the weather"\n\n` +
             `Just type any of these requests and I'll help you out!`;
    };

    const processUserMessage = async (message) => {
      const lowerMessage = message.toLowerCase().trim();
      
      // Quote requests
      if (lowerMessage.includes('quote') || lowerMessage.includes('inspire') || lowerMessage.includes('wisdom')) {
        setIsLoading(true);
        const quote = await getRandomQuote();
        setIsLoading(false);
        return `💭 ${quote}`;
      }
      
      // Joke requests
      if (lowerMessage.includes('joke') || lowerMessage.includes('funny') || lowerMessage.includes('laugh')) {
        setIsLoading(true);
        const joke = await getDadJoke();
        setIsLoading(false);
        return `😄 ${joke}`;
      }
      
      // Weather requests
      if (lowerMessage.includes('weather') || lowerMessage.includes('temperature') || lowerMessage.includes('rain')) {
        setIsLoading(true);
        const weather = await getWeather();
        setIsLoading(false);
        return weather;
      }
      
      // Coin flip
      if (lowerMessage.includes('coin') || lowerMessage.includes('flip')) {
        return flipCoin();
      }
      
      // Dice roll
      if (lowerMessage.includes('dice') || lowerMessage.includes('roll')) {
        return rollDice();
      }
      
      // Rock Paper Scissors
      if (lowerMessage.includes('rock') || lowerMessage.includes('paper') || lowerMessage.includes('scissors') || 
          lowerMessage.includes('game') || lowerMessage.includes('play')) {
        return playRockPaperScissors();
      }
      
      // Help requests
      if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || 
          lowerMessage.includes('features') || lowerMessage.includes('commands')) {
        return getHelpMessage();
      }
      
      // Default response for unrecognized input
      return `🤔 I'm not sure I understand that. ${getHelpMessage()}`;
    };

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let animationPhase = 0;
      const animate = () => {
        animationPhase += 0.1;
        
        // Get the appropriate pattern based on current animation state
        let currentPattern;
        if (currentAnimation === 'clock') {
          currentPattern = generateClockPattern(animationPhase);
        } else {
          currentPattern = patterns[currentAnimation];
        }
        
        drawDotMatrix(canvas, currentPattern, animationPhase);
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
        console.log('🚪 ChatbotDialog opened - initializing smile animation (ONE TIME ONLY)');
        setCurrentAnimation('smile');
        setIsIdleMode(false);
        
        // Start idle timer directly here to avoid dependency loop
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current);
        }
        
        idleTimeoutRef.current = setTimeout(() => {
          console.log('💤 Idle timeout reached - switching to clock animation');
          setIsIdleMode(true);
          
          // Simple transition to clock animation
          const currentPattern = patterns['smile']; // Always start from smile when opening
          
          animatePatternTransition(currentPattern, 'clock', () => {
            console.log('🕐 Clock animation started');
            setCurrentAnimation('clock');
          });
        }, 3000);
        
      } else {
        console.log('🚪 ChatbotDialog closed - cleaning up animations');
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current);
        }
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
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
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isOpen]); // REMOVED startIdleAnimation dependency to prevent loop

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

    const handleSendMessage = async () => {
      if (inputMessage.trim()) {
        const userMessageContent = inputMessage.trim();
        const newUserMessage = {
          id: Date.now(),
          type: 'user',
          content: userMessageContent,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        
        // Show loading message
        setIsLoading(true);
        const loadingMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '🤔 Thinking...',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        try {
          // Process the user message and get smart response
          const botResponseContent = await processUserMessage(userMessageContent);
          
          // Remove loading message and add real response
          setMessages(prev => {
            const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
            return [...withoutLoading, {
              id: Date.now() + 2,
              type: 'bot',
              content: botResponseContent,
              timestamp: new Date().toLocaleTimeString()
            }];
          });
        } catch (error) {
          // Handle any errors
          setMessages(prev => {
            const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
            return [...withoutLoading, {
              id: Date.now() + 2,
              type: 'bot',
              content: '😅 Sorry, I encountered an issue. Please try again!',
              timestamp: new Date().toLocaleTimeString()
            }];
          });
        }
        
        setIsLoading(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    return React.createElement('div', { 
      style: dialogStyle
    }, [
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
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
            userSelect: 'none'
          },
          onClick: handleDeliberateReset,
          onTouchStart: handleDeliberateReset,
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = 'transparent';
          }
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
          }, 'System Assistant 👆')
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
            disabled: isLoading,
            onChange: (e) => {
              setInputMessage(e.target.value);
            },
            onKeyPress: handleKeyPress,
            placeholder: isLoading ? 'Processing...' : 'Type your message...',
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
            disabled: !inputMessage.trim() || isLoading,
            style: {
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: (inputMessage.trim() && !isLoading)
                ? (theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)')
                : (theme === 'light' ? '#ddd' : '#444'),
              color: (inputMessage.trim() && !isLoading)
                ? (theme === 'light' ? '#fff' : '#1a1a2e')
                : (theme === 'light' ? '#999' : '#666'),
              cursor: (inputMessage.trim() && !isLoading) ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              flexShrink: 0
            }
          }, isLoading ? '⏳' : '📤')
        ])
      ])
    ]);
  }

  window.ChatbotDialog = ChatbotDialog;
})();
