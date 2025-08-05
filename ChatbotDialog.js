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
    
    // Initialize voice gender from localStorage
    const [voiceGender, setVoiceGender] = React.useState(() => {
      const stored = localStorage.getItem('voiceGender');
      return stored === 'female' ? 'female' : 'male'; // default to male if not set
    });
    
    // Voice-to-Text (Speech Recognition) states
    const [isListening, setIsListening] = React.useState(false);
    const [recognition, setRecognition] = React.useState(null);
    
    // Set current animation based on voice gender
    const [currentAnimation, setCurrentAnimation] = React.useState(
      () => voiceGender === 'female' ? 'femaleSmile' : 'smile'
    );
    const [isIdleMode, setIsIdleMode] = React.useState(false);

    // Update animation when voice gender changes
    React.useEffect(() => {
      if (!isIdleMode && currentAnimation === 'smile' || currentAnimation === 'femaleSmile') {
        setCurrentAnimation(voiceGender === 'female' ? 'femaleSmile' : 'smile');
      }
    }, [voiceGender, isIdleMode, currentAnimation]);

    // Function to toggle voice gender
    const toggleVoiceGender = () => {
      const newGender = voiceGender === 'female' ? 'male' : 'female';
      setVoiceGender(newGender);
      localStorage.setItem('voiceGender', newGender);
    };

    // Text-to-Speech functionality
    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const speechSynthesis = window.speechSynthesis;
    
    const speakText = (text) => {
      if (!speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      // Clean the text for better speech
      const cleanText = text
        .replace(/🤖|😄|💭|🌤️|🪙|🎲|🎮|🤔/g, '') // Remove emojis
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Configure voice based on gender preference
      const voices = speechSynthesis.getVoices();
      const femaleVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('susan')
      );
      const maleVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('mark')
      );

      if (voiceGender === 'female' && femaleVoices.length > 0) {
        utterance.voice = femaleVoices[0];
      } else if (voiceGender === 'male' && maleVoices.length > 0) {
        utterance.voice = maleVoices[0];
      }

      // Voice settings
      utterance.rate = 0.9;
      utterance.pitch = voiceGender === 'female' ? 1.1 : 0.9;
      utterance.volume = 0.8;

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('🔊 Started speaking:', cleanText.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('🔇 Finished speaking');
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        console.error('Speech synthesis error:', event.error);
      };

      // Speak the text
      speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };

    // Load voices when component mounts
    React.useEffect(() => {
      if (speechSynthesis) {
        // Voices might not be loaded immediately, so we wait for them
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          console.log('Available voices:', voices.map(v => v.name));
        };
        
        // Load voices immediately if available
        loadVoices();
        
        // Also listen for voices changed event
        speechSynthesis.onvoiceschanged = loadVoices;
        
        return () => {
          speechSynthesis.onvoiceschanged = null;
        };
      }
    }, []);

    // Speech Recognition (Voice-to-Text) functionality
    const [collectedTranscript, setCollectedTranscript] = React.useState('');
    
    React.useEffect(() => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true; // Enable continuous listening
        recognitionInstance.interimResults = true; // Show interim results
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          // Collect all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update collected transcript with final results
          if (finalTranscript) {
            setCollectedTranscript(prev => prev + finalTranscript + ' ');
            console.log('🎤 Final transcript:', finalTranscript);
            
            // Show what was heard
            const transcriptMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: `🎤 Heard: "${finalTranscript}"`,
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, transcriptMessage]);
          }
          
          // Show interim results in real-time
          if (interimTranscript) {
            console.log('🎤 Interim:', interimTranscript);
          }
        };
        
        recognitionInstance.onstart = () => {
          console.log('🎤 Voice recognition started');
          setCollectedTranscript(''); // Clear previous transcript
          // Add a message to show recognition has started
          const startMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Listening... Click microphone again to stop and use transcript!',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, startMessage]);
        };
        
        recognitionInstance.onend = () => {
          console.log('🎤 Voice recognition ended');
          if (isListening) {
            // If we're still supposed to be listening, restart recognition
            // This handles automatic restarts for continuous listening
            try {
              recognitionInstance.start();
            } catch (error) {
              console.log('🎤 Recognition restart failed:', error);
              setIsListening(false);
            }
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('🎤 Voice recognition error:', event.error);
          
          // Handle different types of errors
          if (event.error === 'not-allowed') {
            const errorMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: '🎤 Microphone access denied. Please allow microphone permission and try again.',
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            console.log('🎤 No speech detected, continuing to listen...');
            // Don't stop listening for no-speech errors, just continue
          } else {
            const errorMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: `🎤 Error: ${event.error}. Speech recognition may not be supported on this device/browser.`,
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsListening(false);
          }
        };
        
        setRecognition(recognitionInstance);
      } else {
        console.warn('Speech recognition not supported in this browser');
        // Add a message to inform user that speech recognition is not supported
        const unsupportedMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Speech recognition is not supported on this device/browser. Please type your message instead.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, unsupportedMessage]);
      }
    }, [isListening]);

    const toggleListening = () => {
      if (!recognition) {
        // If recognition is not available, show error
        const errorMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Speech recognition not available on this device.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      if (isListening) {
        // Stop listening and use collected transcript
        setIsListening(false);
        recognition.stop();
        console.log('🎤 Stopped listening, collected transcript:', collectedTranscript);
        
        if (collectedTranscript.trim()) {
          setInputMessage(collectedTranscript.trim());
          
          const stopMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: `🎤 Stopped listening. Transcript ready: "${collectedTranscript.trim()}"`,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, stopMessage]);
        } else {
          const noSpeechMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 No speech detected. Try speaking louder or closer to the microphone.',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, noSpeechMessage]);
        }
      } else {
        // Start listening
        setIsListening(true);
        setInputMessage(''); // Clear input field
        setCollectedTranscript(''); // Clear previous transcript
        
        try {
          recognition.start();
          console.log('🎤 Started listening...');
          
          // Add immediate feedback message
          const startMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Starting microphone... Speak now!',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, startMessage]);
        } catch (error) {
          console.error('🎤 Failed to start recognition:', error);
          setIsListening(false);
          
          const errorMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Failed to start microphone. Please try again.',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    };

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
      femaleSmile: [
        [0,0,1,1,1,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,1,1,0,0,1],
        [0,1,1,0,0,1,1,0],
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
      ],
      heart: [
        [0,1,1,0,0,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,0,0,0,0,0]
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

    const generateHeartPattern = (animationPhase) => {
      // Create a base heart pattern
      const basePattern = [
        [0,1,1,0,0,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,0,0,0,0,0]
      ].map(row => [...row]); // Deep copy to avoid mutation

      // Create pulsing effect - make the heart grow and shrink
      const pulseIntensity = Math.sin(animationPhase * 1.5) * 0.5 + 0.5; // 0 to 1
      
      // Add sparkle effect around the heart
      const sparklePositions = [
        [0, 0], [0, 7], [7, 0], [7, 7], // corners
        [1, 0], [0, 1], [6, 0], [7, 1], [1, 7], [0, 6], [6, 7], [7, 6] // edge sparkles
      ];
      
      sparklePositions.forEach(([row, col], index) => {
        // Each sparkle twinkles at different times
        const sparklePhase = animationPhase * 2 + index * 0.8;
        const sparkleChance = (Math.sin(sparklePhase) + 1) * 0.5; // 0 to 1
        
        if (sparkleChance > 0.7) { // Only show sparkle 30% of the time
          basePattern[row][col] = 1;
        }
      });
      
      // Add a gentle glow effect to the heart outline
      if (pulseIntensity > 0.8) {
        // Add extra dots around the heart when pulsing is strong
        const glowPositions = [
          [0, 2], [0, 5], // top glow
          [1, 0], [1, 7], // side glow
          [2, 0], [2, 7], // side glow
          [5, 1], [5, 6], // bottom side glow
        ];
        
        glowPositions.forEach(([row, col]) => {
          if (Math.random() > 0.5) { // 50% chance for each glow dot
            basePattern[row][col] = 1;
          }
        });
      }
      
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
            } else if (currentAnimation === 'heart') {
              // Romantic pulsing for heart with color variation
              pulseScale = 1 + Math.sin(animationPhase * 1.8) * 0.2;
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
          } else if (toAnimationType === 'heart') {
            toPattern = generateHeartPattern(Date.now() * 0.01);
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
        console.log('💤 Idle timeout reached - switching to random idle animation (from manual reset)');
        setIsIdleMode(true);
        
        // Randomly choose between clock and heart animations
        const idleAnimations = ['clock', 'heart'];
        const randomAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        console.log(`🎲 Randomly selected ${randomAnimation} animation`);
        
        // Get current pattern at the time of timeout
        setCurrentAnimation(prevAnimation => {
          const currentPattern = prevAnimation === 'clock' 
            ? generateClockPattern(Date.now() * 0.01)
            : prevAnimation === 'heart'
            ? generateHeartPattern(Date.now() * 0.01)
            : patterns[prevAnimation];
          
          animatePatternTransition(currentPattern, randomAnimation, () => {
            console.log(`🎨 ${randomAnimation === 'clock' ? '🕐' : '💖'} ${randomAnimation} animation started (from manual reset)`);
            setCurrentAnimation(randomAnimation);
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
            : prevAnimation === 'heart'
            ? generateHeartPattern(Date.now() * 0.01)
            : patterns[prevAnimation];            animatePatternTransition(currentPattern, 'smile', () => {
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

    // API Functions with multiple fallbacks
    const getRandomQuote = async () => {
      const fallbackQuotes = [
        "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
        "Innovation distinguishes between a leader and a follower. - Steve Jobs",
        "Life is what happens to you while you're busy making other plans. - John Lennon",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "It is during our darkest moments that we must focus to see the light. - Aristotle",
        "The way to get started is to quit talking and begin doing. - Walt Disney",
        "Don't let yesterday take up too much of today. - Will Rogers",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        "Be yourself; everyone else is already taken. - Oscar Wilde",
        "In the middle of difficulty lies opportunity. - Albert Einstein",
        "The only way to do great work is to love what you do. - Steve Jobs",
        "Believe you can and you're halfway there. - Theodore Roosevelt",
        "It does not matter how slowly you go as long as you do not stop. - Confucius",
        "Everything you've ever wanted is on the other side of fear. - George Addair",
        "Success is not how high you have climbed, but how you make a positive difference to the world. - Roy T. Bennett"
      ];

      // Try multiple APIs in sequence
      const apis = [
        {
          name: 'Quotable',
          fetch: async () => {
            const minLength = 20 + Math.floor(Math.random() * 100);
            const maxLength = minLength + 50 + Math.floor(Math.random() * 100);
            const randomSeed = Date.now() + Math.floor(Math.random() * 1000);
            
            const response = await fetch(`https://api.quotable.io/random?minLength=${minLength}&maxLength=${maxLength}&_=${randomSeed}`, {
              timeout: 5000
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return `"${data.content}" - ${data.author}`;
          }
        },
        {
          name: 'ZenQuotes',
          fetch: async () => {
            const response = await fetch('https://zenquotes.io/api/random', {
              timeout: 5000
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return `"${data[0].q}" - ${data[0].a}`;
          }
        },
        {
          name: 'QuoteGarden',
          fetch: async () => {
            const response = await fetch('https://quotegarden.herokuapp.com/api/v3/quotes/random', {
              timeout: 5000
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return `"${data.data.quoteText}" - ${data.data.quoteAuthor}`;
          }
        }
      ];

      // Try each API in sequence
      for (const api of apis) {
        try {
          console.log(`Trying ${api.name} API...`);
          const quote = await api.fetch();
          console.log(`${api.name} API succeeded`);
          return quote;
        } catch (error) {
          console.warn(`${api.name} API failed:`, error.message);
        }
      }

      // If all APIs fail, use local fallback
      console.log('All APIs failed, using local fallback quotes');
      return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
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
        } else if (currentAnimation === 'heart') {
          currentPattern = generateHeartPattern(animationPhase);
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
          console.log('💤 Idle timeout reached - switching to random idle animation');
          setIsIdleMode(true);
          
          // Randomly choose between clock and heart animations
          const idleAnimations = ['clock', 'heart'];
          const randomAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
          console.log(`🎲 Randomly selected ${randomAnimation} animation`);
          
          // Simple transition to random idle animation
          const currentPattern = patterns['smile']; // Always start from smile when opening
          
          animatePatternTransition(currentPattern, randomAnimation, () => {
            console.log(`🎨 ${randomAnimation === 'clock' ? '🕐' : '💖'} ${randomAnimation} animation started`);
            setCurrentAnimation(randomAnimation);
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

          // Automatically speak the bot response
          setTimeout(() => {
            speakText(botResponseContent);
          }, 100); // Small delay to ensure message is rendered

        } catch (error) {
          // Handle any errors
          const errorMessage = '😅 Sorry, I encountered an issue. Please try again!';
          setMessages(prev => {
            const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
            return [...withoutLoading, {
              id: Date.now() + 2,
              type: 'bot',
              content: errorMessage,
              timestamp: new Date().toLocaleTimeString()
            }];
          });

          // Speak error message too
          setTimeout(() => {
            speakText(errorMessage);
          }, 100);
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
            key: 'voice-toggle',
            onClick: toggleVoiceGender,
            title: voiceGender === 'female' ? 'Switch to male voice' : 'Switch to female voice',
            style: {
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: theme === 'light' ? '#e0e0e0' : '#4a5568',
              color: theme === 'light' ? '#333' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginRight: '8px'
            }
          }, voiceGender === 'female' ? '👩' : '👨'),
          React.createElement('button', {
            key: 'speaker-toggle',
            onClick: isSpeaking ? stopSpeaking : () => {},
            title: isSpeaking ? 'Stop speaking' : 'Text-to-speech enabled',
            style: {
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isSpeaking 
                ? (theme === 'light' ? '#ff6b6b' : '#e74c3c')
                : (theme === 'light' ? '#4ecdc4' : '#2ecc71'),
              color: '#fff',
              cursor: isSpeaking ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              marginRight: '8px',
              transform: isSpeaking ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }
          }, isSpeaking ? '🔇' : '🔊'),
          React.createElement('button', {
            key: 'microphone-toggle',
            onClick: toggleListening,
            title: isListening ? 'Click to stop recording and use transcript' : 'Click to start voice recording',
            style: {
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isListening 
                ? (theme === 'light' ? '#ff6b6b' : '#e74c3c')
                : (theme === 'light' ? '#4ecdc4' : '#3498db'),
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              marginRight: '8px',
              transform: isListening ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease',
              userSelect: 'none'
            }
          }, isListening ? '🔴' : '🎤'),
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
