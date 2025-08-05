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
    const messagesContainerRef = React.useRef(null); // Add ref for messages container
    
    // Initialize voice gender from localStorage
    const [voiceGender, setVoiceGender] = React.useState(() => {
      const stored = localStorage.getItem('voiceGender');
      return stored === 'female' ? 'female' : 'male'; // default to male if not set
    });
    
    // Voice-to-Text (Speech Recognition) states
    const [isListening, setIsListening] = React.useState(false);
    const [recognition, setRecognition] = React.useState(null);
    
    // Lab Reservation Form Dialog states
    const [showReservationForm, setShowReservationForm] = React.useState(false);
    const [formData, setFormData] = React.useState({
      name: '',
      employeeId: '',
      contactNumber: '',
      startTime: '',
      duration: ''
    });
    
    // Refs for datetime pickers
    const startTimeInputRef = React.useRef(null);
    const startTimeFlatpickrRef = React.useRef(null);
    
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
        const errorMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🔊 Text-to-speech is not supported on this device/browser.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      // Clean the text for better speech - remove all emojis and special characters
      const cleanText = text// Remove all emoji characters (comprehensive Unicode ranges)
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional Indicator Symbols
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
        .replace(/[\u{200D}]/gu, '')            // Zero Width Joiner (used in compound emojis)
        // Remove any remaining emoji-like patterns
        .replace(/[🤖😄💭🌤️🪙🎲🎮🤔📅📋❌🔬👤🆔🕐⏱️✅🔊📡🔉🎤🔴📤⏳👩👨🔇]/g, '')
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      if (!cleanText) {
        console.warn('No text to speak after cleaning');
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Configure voice based on gender preference
        const voices = speechSynthesis.getVoices();
        console.log('🔊 Available voices:', voices.length);
        
        if (voices.length === 0) {
          console.warn('No voices available, speech may not work');
          const errorMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🔊 No speech voices available. Try refreshing the page or check your device audio settings.',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        
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
          console.log('🔊 Using female voice:', femaleVoices[0].name);
        } else if (voiceGender === 'male' && maleVoices.length > 0) {
          utterance.voice = maleVoices[0];
          console.log('🔊 Using male voice:', maleVoices[0].name);
        } else {
          // Use default voice
          utterance.voice = voices[0];
          console.log('🔊 Using default voice:', voices[0].name);
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
          console.error('🔊 Speech synthesis error:', event.error);
          
          let errorMsg = '';
          switch(event.error) {
            case 'network':
              errorMsg = '🔊 Network error during speech. Check your internet connection.';
              break;
            case 'synthesis-unavailable':
              errorMsg = '🔊 Speech synthesis unavailable. Try refreshing the page.';
              break;
            case 'synthesis-failed':
              errorMsg = '🔊 Speech synthesis failed. The text may be too long or contain unsupported characters.';
              break;
            case 'audio-hardware':
              errorMsg = '🔊 Audio hardware error. Check your speakers/headphones.';
              break;
            case 'audio-busy':
              errorMsg = '🔊 Audio is busy. Close other apps using audio and try again.';
              break;
            case 'not-allowed':
              errorMsg = '🔊 Speech not allowed. Check browser audio permissions.';
              break;
            case 'interrupted':
              errorMsg = '🔊 Speech was interrupted.';
              break;
            default:
              errorMsg = `🔊 Speech error: ${event.error}. Try refreshing the page.`;
          }
          
          const errorMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: errorMsg,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorMessage]);
        };

        // Add timeout to detect if speech doesn't start
        const speechTimeout = setTimeout(() => {
          if (!isSpeaking) {
            console.warn('🔊 Speech timeout - speech may not have started');
            const timeoutMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: '🔊 Speech timed out. Audio may be disabled or unavailable. Check your device volume and audio settings.',
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, timeoutMessage]);
            setIsSpeaking(false);
          }
        }, 3000); // 3 second timeout

        // Clear timeout when speech starts or ends
        const originalOnStart = utterance.onstart;
        const originalOnEnd = utterance.onend;
        
        utterance.onstart = () => {
          clearTimeout(speechTimeout);
          if (originalOnStart) originalOnStart();
        };
        
        utterance.onend = () => {
          clearTimeout(speechTimeout);
          if (originalOnEnd) originalOnEnd();
        };

        // Speak the text
        console.log('🔊 Attempting to speak:', cleanText.substring(0, 100) + '...');
        speechSynthesis.speak(utterance);
        
        // Additional check for common issues
        setTimeout(() => {
          if (speechSynthesis.speaking) {
            console.log('🔊 Speech synthesis is active');
          } else {
            console.warn('🔊 Speech synthesis is not active after speak() call');
          }
        }, 100);
        
      } catch (error) {
        console.error('🔊 Error setting up speech synthesis:', error);
        setIsSpeaking(false);
        
        const errorMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: `🔊 Failed to initialize speech: ${error.message}. Try refreshing the page.`,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
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
          console.log('🔊 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
          
          if (voices.length === 0) {
            console.warn('🔊 No voices loaded yet, will retry...');
            // Try to trigger voice loading
            setTimeout(() => {
              const testVoices = speechSynthesis.getVoices();
              if (testVoices.length === 0) {
                console.error('🔊 Still no voices available after retry');
                const errorMessage = {
                  id: Date.now() + Math.random(),
                  type: 'bot',
                  content: '🔊 Warning: No speech voices detected. Text-to-speech may not work. Try refreshing the page or check your device audio settings.',
                  timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, errorMessage]);
              } else {
                console.log('🔊 Voices loaded after retry:', testVoices.length);
              }
            }, 2000);
          } else {
            console.log('🔊 Speech synthesis ready with', voices.length, 'voices');
          }
        };
        
        // Load voices immediately if available
        loadVoices();
        
        // Also listen for voices changed event
        speechSynthesis.onvoiceschanged = loadVoices;
        
        // Add a timeout to check if voices are still not loaded
        const voiceCheckTimeout = setTimeout(() => {
          const voices = speechSynthesis.getVoices();
          if (voices.length === 0) {
            console.warn('🔊 No voices loaded after 5 seconds');
            const warningMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: '🔊 Speech voices are taking longer than expected to load. Text-to-speech may be limited.',
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, warningMessage]);
          }
        }, 5000);
        
        return () => {
          speechSynthesis.onvoiceschanged = null;
          clearTimeout(voiceCheckTimeout);
        };
      } else {
        // Speech synthesis not supported
        const errorMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🔊 Text-to-speech is not supported on this browser/device.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }, []);

    // Auto-scroll to bottom when new messages are added
    React.useEffect(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, [messages]); // Trigger whenever messages array changes

    // Speech Recognition (Voice-to-Text) functionality
    const [collectedTranscript, setCollectedTranscript] = React.useState('');
    const recognitionRef = React.useRef(null);
    const isRecognitionActiveRef = React.useRef(false);
    const collectedTranscriptRef = React.useRef(''); // Add ref to track current transcript
    
    // Create a fresh recognition instance
    const createRecognitionInstance = React.useCallback(() => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        return null;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      // Mobile-optimized settings for better speech detection
      recognitionInstance.continuous = false; // Better for mobile
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      // Android-specific optimizations
      if (navigator.userAgent.includes('Android')) {
        recognitionInstance.continuous = false; // Ensure false on Android
        // Try to set service type for better recognition (Chrome Android specific)
        try {
          recognitionInstance.serviceURI = 'ws://localhost/recognition'; // This might help with local processing
        } catch (e) {
          // Ignore if not supported
        }
      }
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        console.log('onresult triggered, results length:', event.results.length);
        
        // Collect all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`Result ${i}: "${transcript}" (confidence: ${confidence}, final: ${event.results[i].isFinal})`);
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update collected transcript with final results
        if (finalTranscript) {
          setCollectedTranscript(prev => {
            const newTranscript = prev + finalTranscript + ' ';
            collectedTranscriptRef.current = newTranscript; // Keep ref in sync
            console.log('Final transcript added:', finalTranscript);
            console.log('Total collected:', newTranscript);
            return newTranscript;
          });
          
          // Show what was heard with confidence info
          const transcriptMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: `🎤 Heard: "${finalTranscript}" ✅`,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, transcriptMessage]);
        }
        
        // Show interim results in real-time for immediate feedback
        if (interimTranscript) {
          console.log('🎤 Interim:', interimTranscript);
          
          // Show interim feedback for mobile users
          const interimMessage = {
            id: 'interim-' + Date.now(),
            type: 'bot',
            content: `🎤 Hearing: "${interimTranscript}..." 👂`,
            timestamp: new Date().toLocaleTimeString()
          };
          // Replace any existing interim message
          setMessages(prev => {
            const filtered = prev.filter(msg => !msg.id.toString().startsWith('interim-'));
            return [...filtered, interimMessage];
          });
        }
      };
      
      recognitionInstance.onstart = () => {
        console.log('🎤 Voice recognition started');
        isRecognitionActiveRef.current = true;
        
        // Clear any interim messages and add start message
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.id.toString().startsWith('interim-'));
          const startMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Microphone is LISTENING! Speak clearly now... 🔊',
            timestamp: new Date().toLocaleTimeString()
          };
          return [...filtered, startMessage];
        });
      };
      
      recognitionInstance.onspeechstart = () => {
        console.log('🎤 Speech detected!');
        const speechDetectedMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Speech detected! Keep talking... 🗣️',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, speechDetectedMessage]);
      };
      
      recognitionInstance.onspeechend = () => {
        console.log('🎤 Speech ended');
        const speechEndedMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Speech ended. Processing... ⏳',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, speechEndedMessage]);
        
        // Automatically stop listening and process transcript after speech ends
        setTimeout(() => {
          console.log('🎤 Auto-stopping recognition after speech ended');
          console.log('🎤 Current transcript from ref:', collectedTranscriptRef.current);
          
          // Stop listening
          setIsListening(false);
          
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch (error) {
              console.log('Error stopping recognition:', error);
            }
          }
          
          // Check if we have transcript to submit
          const currentTranscript = collectedTranscriptRef.current.trim();
          if (currentTranscript) {
            console.log('🎤 Auto-submitting collected transcript:', currentTranscript);
            
            const processingMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: `🎤 Transcript ready: "${currentTranscript}" - Auto-submitting... 🚀`,
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, processingMessage]);
            
            // Auto-send the message
            setTimeout(async () => {
              const userMessage = {
                id: Date.now() + Math.random(),
                type: 'user',
                content: currentTranscript,
                timestamp: new Date().toLocaleTimeString()
              };
              
              setMessages(prev => [...prev, userMessage]);
              
              // Clear the transcript
              setCollectedTranscript('');
              collectedTranscriptRef.current = '';
              
              // Process the message and get bot response
              setIsLoading(true);
              try {
                const botResponse = await processUserMessage(currentTranscript);
                
                const botMessage = {
                  id: Date.now() + Math.random(),
                  type: 'bot',
                  content: botResponse,
                  timestamp: new Date().toLocaleTimeString()
                };
                
                setMessages(prev => [...prev, botMessage]);
                
                // Auto-speak the response if not currently speaking
                setIsSpeaking(currentIsSpeaking => {
                  if (!currentIsSpeaking) {
                    try {
                      speakText(botResponse);
                    } catch (error) {
                      console.error('🔊 Error in auto-speak:', error);
                      const speechErrorMessage = {
                        id: Date.now() + Math.random(),
                        type: 'bot',
                        content: '🔊 Could not speak the response automatically. You can try saying "test speech" to check your audio.',
                        timestamp: new Date().toLocaleTimeString()
                      };
                      setMessages(prev => [...prev, speechErrorMessage]);
                    }
                  }
                  return currentIsSpeaking;
                });
                
                // Trigger animation reset
                resetToSmile();
              } catch (error) {
                console.error('Error processing message:', error);
                const errorMessage = {
                  id: Date.now() + Math.random(),
                  type: 'bot',
                  content: 'Sorry, I encountered an error processing your message. Please try again.',
                  timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, errorMessage]);
              }
              setIsLoading(false);
            }, 500); // Small delay for better UX
          } else {
            const noSpeechMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: '🎤 No speech was detected. Please try the microphone button again and speak clearly.',
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, noSpeechMessage]);
          }
        }, 1000); // Wait 1 second after speech ends before auto-processing
      };
      
      recognitionInstance.onaudiostart = () => {
        console.log('🎤 Audio input started');
        const audioStartMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Audio input detected! Microphone is working 📡',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, audioStartMessage]);
      };
      
      recognitionInstance.onaudioend = () => {
        console.log('🎤 Audio input ended');
      };
      
      recognitionInstance.onsoundstart = () => {
        console.log('🎤 Sound detected');
        const soundDetectedMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Sound detected! 🔉',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, soundDetectedMessage]);
      };
      
      recognitionInstance.onsoundend = () => {
        console.log('🎤 Sound ended');
      };
      
      recognitionInstance.onend = () => {
        console.log('🎤 Voice recognition ended');
        isRecognitionActiveRef.current = false;
        
        // Clear any interim messages
        setMessages(prev => prev.filter(msg => !msg.id.toString().startsWith('interim-')));
        
        // Use functional updates to check current state
        setIsListening(currentIsListening => {
          // Only attempt restart if we're still supposed to be listening AND we haven't collected any transcript
          // If we have transcript, the onspeechend handler will take care of auto-submission
          if (currentIsListening && !collectedTranscriptRef.current.trim()) {
            console.log('🎤 Attempting to restart recognition (no transcript collected yet)...');
            setTimeout(() => {
              // Double-check the states again before restart
              setIsListening(stillListening => {
                if (stillListening && recognitionRef.current && !collectedTranscriptRef.current.trim()) {
                  try {
                    recognitionRef.current.start();
                    console.log('🎤 Recognition restarted successfully');
                  } catch (error) {
                    console.log('🎤 Recognition restart failed:', error.message);
                    if (error.name === 'InvalidStateError') {
                      // Recognition is already running, ignore
                      console.log('🎤 Recognition already running, continuing...');
                    } else {
                      // Real error, stop listening
                      const errorMessage = {
                        id: Date.now() + Math.random(),
                        type: 'bot',
                        content: '🎤 Failed to continue listening. Please try again.',
                        timestamp: new Date().toLocaleTimeString()
                      };
                      setMessages(prev => [...prev, errorMessage]);
                      return false; // Stop listening
                    }
                  }
                }
                return stillListening;
              });
            }, 100); // Small delay before restart
          }
          return currentIsListening;
        });
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('🎤 Voice recognition error:', event.error);
        isRecognitionActiveRef.current = false;
        
        // Clear any interim messages
        setMessages(prev => prev.filter(msg => !msg.id.toString().startsWith('interim-')));
        
        // Handle different types of errors with detailed explanations
        if (event.error === 'not-allowed') {
          const errorMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Microphone access DENIED!\n\n🔧 Fix steps:\n1. Look for 🎤 or 🔒 icon in address bar\n2. Click it and allow microphone\n3. Refresh page and try again\n\nOn Chrome Android: Settings > Site Settings > Microphone',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          console.log('🎤 No speech detected');
          const noSpeechMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 No speech detected!\n\n💡 Try:\n• Speaking LOUDER\n• Getting closer to microphone\n• Saying "Hello test" clearly\n• Checking if microphone works in other apps',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, noSpeechMessage]);
          // Don't stop listening for no-speech, just continue
        } else if (event.error === 'aborted') {
          console.log('🎤 Recognition aborted');
          // Don't show error for aborted, it's expected when user stops
        } else if (event.error === 'network') {
          const networkMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Network error!\n\n📡 Check:\n• WiFi/Mobile data connection\n• Try switching between WiFi and mobile data\n• Restart browser if problem persists',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, networkMessage]);
          setIsListening(false);
        } else if (event.error === 'audio-capture') {
          const captureMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: '🎤 Microphone capture failed!\n\n🔧 Possible fixes:\n• Close other apps using microphone\n• Restart browser\n• Check phone microphone hardware\n• Try headphone microphone',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, captureMessage]);
          setIsListening(false);
        } else {
          const errorMessage = {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: `🎤 Error: ${event.error}\n\n🔄 Try:\n• Refresh page\n• Use Chrome browser\n• Check device microphone\n• Try in incognito mode`,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorMessage]);
          // Don't automatically stop for other errors, let user decide
        }
      };
      
      return recognitionInstance;
    }, []); // Remove dependencies to prevent stale closures

    // Initialize recognition when component mounts
    React.useEffect(() => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const newRecognition = createRecognitionInstance();
        recognitionRef.current = newRecognition;
        setRecognition(newRecognition);
      } else {
        console.warn('Speech recognition not supported in this browser');
        const unsupportedMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Speech recognition is not supported on this device/browser. Please type your message instead.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, unsupportedMessage]);
      }

      // Cleanup function
      return () => {
        if (recognitionRef.current && isRecognitionActiveRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (error) {
            console.log('Cleanup recognition error:', error);
          }
        }
      };
    }, []); // Only run once on mount

    const toggleListening = () => {
      // Always create fresh recognition instance for reliability
      const currentRecognition = createRecognitionInstance();
      if (!currentRecognition) {
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
        // Stop listening - transcript will be auto-processed if available
        setIsListening(false);
        
        // Stop current recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (error) {
            console.log('Error stopping recognition:', error);
          }
        }
        
        console.log('🎤 Manually stopped listening');
        
        // Clear any interim messages
        setMessages(prev => prev.filter(msg => !msg.id.toString().startsWith('interim-')));
        
        const stopMessage = {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: '🎤 Stopped listening manually.',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, stopMessage]);
      } else {
        // Start listening with fresh recognition instance
        setIsListening(true);
        setInputMessage(''); // Clear input field
        setCollectedTranscript(''); // Clear previous transcript
        collectedTranscriptRef.current = ''; // Clear transcript ref
        
        // First, test microphone access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              console.log('🎤 Microphone access granted');
              
              // Stop the test stream
              stream.getTracks().forEach(track => track.stop());
              
              // Show diagnostic info
              const diagnosticMessage = {
                id: Date.now() + Math.random(),
                type: 'bot',
                content: '✅ Microphone access OK. Starting speech recognition...\n\n📱 Android Tips:\n• Speak clearly and loudly\n• Hold phone 6-12 inches from mouth\n• Avoid background noise\n• Ensure stable WiFi/data connection\n• Speech will auto-submit when you finish talking!',
                timestamp: new Date().toLocaleTimeString()
              };
              setMessages(prev => [...prev, diagnosticMessage]);
              
              // Update the recognition reference
              recognitionRef.current = currentRecognition;
              setRecognition(currentRecognition);
              
              try {
                currentRecognition.start();
                console.log('🎤 Started listening with fresh recognition instance');
                
                // Add immediate feedback message
                const startMessage = {
                  id: Date.now() + Math.random(),
                  type: 'bot',
                  content: '🎤 Microphone is ACTIVE! Say something now... (Will auto-submit when you finish speaking)',
                  timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, startMessage]);
                
                // Add a timeout to provide feedback if no speech is detected after 10 seconds
                setTimeout(() => {
                  if (isListening && collectedTranscript.trim() === '') {
                    const timeoutMessage = {
                      id: Date.now() + Math.random(),
                      type: 'bot',
                      content: '🎤 Still listening... If you\'re speaking but no text appears, try:\n• Speaking louder\n• Moving closer to microphone\n• Checking browser microphone permissions',
                      timestamp: new Date().toLocaleTimeString()
                    };
                    setMessages(prev => [...prev, timeoutMessage]);
                  }
                }, 10000); // 10 second timeout
                
              } catch (error) {
                console.error('🎤 Failed to start recognition:', error);
                setIsListening(false);
                
                const errorMessage = {
                  id: Date.now() + Math.random(),
                  type: 'bot',
                  content: `🎤 Failed to start microphone: ${error.message}.\n\nPossible solutions:\n• Refresh the page and try again\n• Check browser permissions\n• Try in Chrome Incognito mode`,
                  timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, errorMessage]);
              }
            })
            .catch(error => {
              console.error('🎤 Microphone access denied:', error);
              setIsListening(false);
              
              const permissionMessage = {
                id: Date.now() + Math.random(),
                type: 'bot',
                content: `🎤 Microphone access denied!\n\n🔧 To fix this:\n1. Tap the 🔒 or 🎤 icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page\n4. Try the microphone button again\n\nError: ${error.message}`,
                timestamp: new Date().toLocaleTimeString()
              };
              setMessages(prev => [...prev, permissionMessage]);
            });
        } else {
          // Fallback for older browsers
          console.warn('🎤 getUserMedia not supported, trying direct recognition start');
          
          // Update the recognition reference
          recognitionRef.current = currentRecognition;
          setRecognition(currentRecognition);
          
          try {
            currentRecognition.start();
            console.log('🎤 Started listening with fresh recognition instance (fallback)');
            
            // Add immediate feedback message
            const startMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: '🎤 Starting microphone (compatibility mode)... Speak now! (Will auto-submit when finished)',
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, startMessage]);
          } catch (error) {
            console.error('🎤 Failed to start recognition:', error);
            setIsListening(false);
            
            const errorMessage = {
              id: Date.now() + Math.random(),
              type: 'bot',
              content: `🎤 Failed to start microphone: ${error.message}. Please try again.`,
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
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
      console.log('Starting idle animation timer (from manual reset)');
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (cycleIntervalRef.current) {
        clearInterval(cycleIntervalRef.current);
      }
      
      idleTimeoutRef.current = setTimeout(() => {
        console.log('Idle timeout reached - switching to random idle animation (from manual reset)');
        setIsIdleMode(true);
        
        // Randomly choose between clock and heart animations
        const idleAnimations = ['clock', 'heart'];
        const randomAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        console.log(`Randomly selected ${randomAnimation} animation`);
        
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
      console.log('resetToSmile called - Time:', new Date().toLocaleTimeString());
      
      // Debounce the reset to prevent too frequent calls
      if (debounceTimeoutRef.current) {
        console.log('resetToSmile debounced - already scheduled');
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
          console.log('Current animation at reset time:', prevAnimation);
          
          if (prevAnimation !== 'smile') {
            console.log('Animating transition from', prevAnimation, 'to smile');
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
            console.log('Already showing smile, just restarting idle timer');
            startIdleAnimation();
            return 'smile';
          }
        });
        
        debounceTimeoutRef.current = null;
      }, 100); // 100ms debounce
    }, [startIdleAnimation]);

    // Only reset on very deliberate click/touch interactions - NO MOUSE MOVEMENT
    const handleDeliberateReset = React.useCallback(() => {
      console.log('Deliberate click/touch detected - resetting to smile');
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
        const temp = Math.floor(Math.random() * 8) + 26; // 26-34Â°C typical for Singapore
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
             `💭­ Share a quote - say "give me a quote" or just "quote"\n` +
             `🌤️ Get weather - say "weather" or "what's the weather"\n` +
             `🔊 Test speech - say "test speech" to check if audio is working\n` +
             `📋 Reserve lab - say "reserve lab" or "book lab" (opens easy form dialog)\n` +
             `📋 View reservations - say "show my reservations" or "list reservations"\n` +
             `📋 Cancel reservation - say "cancel reservation [name]"\n\n` +
             `💡 Lab reservations now use a simple form dialog - no more typing complex formats!\n\n` +
             `Just type any of these requests and I'll help you out!`;
    };

    // Calendar/Lab Reservation functions
    const getStoredReservations = () => {
      const saved = localStorage.getItem('reservations');
      return saved ? JSON.parse(saved) : [];
    };

    const saveReservations = (reservations) => {
      localStorage.setItem('reservations', JSON.stringify(reservations));
    };

    const parseDateTime = (input) => {
      const now = new Date();
      const lowerInput = input.toLowerCase();
      
      // Handle relative dates
      if (lowerInput.includes('today')) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      if (lowerInput.includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      }
      if (lowerInput.includes('next week')) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
      }
      
      // Try to parse specific dates
      const dateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/;
      const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
      
      const dateMatch = input.match(dateRegex);
      const timeMatch = input.match(timeRegex);
      
      let date = new Date(now);
      
      if (dateMatch) {
        const month = parseInt(dateMatch[1]) - 1; // JavaScript months are 0-indexed
        const day = parseInt(dateMatch[2]);
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
        date = new Date(year, month, day);
      }
      
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3];
        
        if (ampm && ampm.toLowerCase() === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm && ampm.toLowerCase() === 'am' && hours === 12) {
          hours = 0;
        }
        
        date.setHours(hours, minutes, 0, 0);
      }
      
      return date;
    };

    // Helper function to parse structured reservation input
    const parseStructuredReservation = (message) => {
      const lines = message.split('\n');
      let userName = '';
      let employeeId = '';
      let date = '';
      let time = '';
      
      // Parse each line
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('name:')) {
          userName = trimmedLine.substring(5).trim();
        } else if (trimmedLine.toLowerCase().startsWith('id:')) {
          employeeId = trimmedLine.substring(3).trim().toUpperCase();
        } else if (trimmedLine.toLowerCase().startsWith('date:')) {
          date = trimmedLine.substring(5).trim();
        } else if (trimmedLine.toLowerCase().startsWith('time:')) {
          time = trimmedLine.substring(5).trim();
        }
      });
      
      // Validate required fields
      if (!userName) {
        return `📋 **Missing Name**\n\nPlease include your name like: \`Name: John Smith\``;
      }
      if (!employeeId) {
        return `📋 **Missing Employee ID**\n\nPlease include your ID like: \`ID: EMP123\``;
      }
      if (!date) {
        return `📋 **Missing Date**\n\nPlease include the date like: \`Date: tomorrow\` or \`Date: 12/25\``;
      }
      if (!time) {
        return `📋 **Missing Time**\n\nPlease include the time like: \`Time: 2 PM\` or \`Time: 14:30\``;
      }
      
      return createReservation(userName, employeeId, date, time);
    };
    
    // Helper function to create the actual reservation
    const createReservation = (userName, employeeId, dateStr, timeStr) => {
      const reservations = getStoredReservations();
      
      // Parse date and time
      let reservationDate;
      try {
        reservationDate = parseDateTime(`${dateStr} ${timeStr}`);
        if (!reservationDate || isNaN(reservationDate.getTime())) {
          return `📋 **Invalid Date/Time**\n\nPlease use formats like:\n• Date: tomorrow, today, 12/25/2024\n• Time: 2 PM, 14:30, 9:00 AM`;
        }
      } catch (error) {
        return `📋 **Date/Time Error**\n\nPlease check your date and time format.\nExample: \`Date: tomorrow\` and \`Time: 2 PM\``;
      }
      
      // Check for conflicts
      const existingReservation = reservations.find(res => {
        const existingStart = new Date(res.start);
        const existingEnd = new Date(res.end);
        const newStart = reservationDate;
        const newEnd = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
        
        return (newStart < existingEnd && newEnd > existingStart);
      });
      
      if (existingReservation) {
        const conflictDate = new Date(existingReservation.start);
        return `📋 **Lab Reservation Conflict!**\n\n` +
               `📋 The lab is already reserved by ${existingReservation.userName} (${existingReservation.employeeId})\n` +
               `📅 Time: ${conflictDate.toLocaleDateString()} at ${conflictDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\n` +
               `Please choose a different time slot.`;
      }
      
      // Create new reservation
      const newReservation = {
        id: Date.now(),
        title: `Lab Reserved - ${userName}`,
        userName: userName,
        employeeId: employeeId,
        start: reservationDate.toISOString(),
        end: new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours duration
        allDay: false
      };
      
      // Save to localStorage (keeping appointments key for calendar compatibility)
      const updatedReservations = [...reservations, newReservation];
      saveReservations(updatedReservations);
      // Also save to appointments for calendar display
      localStorage.setItem('appointments', JSON.stringify(updatedReservations));
      
      const formattedDate = reservationDate.toLocaleDateString();
      const formattedTime = reservationDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const endTime = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return `📋 **Lab Reservation Confirmed!**\n\n` +
             `👤 **Name:** ${userName}\n` +
             `🆔 **Employee ID:** ${employeeId}\n` +
             `📅 **Date:** ${formattedDate}\n` +
             `⏱️ **Time:** ${formattedTime} - ${endTime}\n` +
             `🕐 **Duration:** 2 hours\n\n` +
             `✅ Your lab reservation has been added to the calendar. You can view all reservations by saying "show my reservations".`;
    };

    // Helper function to create reservation from form data (with contact number and specific start/end times)
    const createReservationFromForm = (userName, employeeId, contactNumber, startDateTime, endDateTime) => {
      const reservations = getStoredReservations();
      
      // Check for conflicts
      const existingReservation = reservations.find(res => {
        const existingStart = new Date(res.start);
        const existingEnd = new Date(res.end);
        const newStart = startDateTime;
        const newEnd = endDateTime;
        
        return (newStart < existingEnd && newEnd > existingStart);
      });
      
      if (existingReservation) {
        const conflictDate = new Date(existingReservation.start);
        const conflictEndDate = new Date(existingReservation.end);
        return `📋 **Lab Reservation Conflict!**\n\n` +
               `📋 The lab is already reserved by ${existingReservation.userName} (${existingReservation.employeeId})\n` +
               `📅 Time: ${conflictDate.toLocaleDateString()}\n` +
               `⏱️ ${conflictDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${conflictEndDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\n` +
               `Please choose a different time slot.`;
      }
      
      // Create new reservation
      const newReservation = {
        id: Date.now(),
        title: `Lab Reserved - ${userName}`,
        userName: userName,
        employeeId: employeeId,
        contactNumber: contactNumber,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        allDay: false
      };
      
      // Save to localStorage (keeping appointments key for calendar compatibility)
      const updatedReservations = [...reservations, newReservation];
      saveReservations(updatedReservations);
      // Also save to appointments for calendar display
      localStorage.setItem('appointments', JSON.stringify(updatedReservations));
      
      const formattedDate = startDateTime.toLocaleDateString();
      const formattedStartTime = startDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const formattedEndTime = endDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const duration = Math.round((endDateTime - startDateTime) / (1000 * 60 * 60 * 100)) / 10; // Duration in hours
      
      return `📋 **Lab Reservation Confirmed!**\n\n` +
             `👤 **Name:** ${userName}\n` +
             `🆔 **Employee ID:** ${employeeId}\n` +
             `📞 **Contact:** ${contactNumber}\n` +
             `📅 **Date:** ${formattedDate}\n` +
             `⏱️ **Time:** ${formattedStartTime} - ${formattedEndTime}\n` +
             `🕐 **Duration:** ${duration} hours\n\n` +
             `✅ Your lab reservation has been added to the calendar. You can view all reservations by saying "show my reservations".`;
    };

    // Lab Reservation Form Functions
    const showLabReservationForm = () => {
      setFormData({ name: '', employeeId: '', contactNumber: '', startTime: '', endTime: '' });
      setShowReservationForm(true);
    };

    const closeReservationForm = () => {
      setShowReservationForm(false);
      setFormData({ name: '', employeeId: '', contactNumber: '', startTime: '', duration: '' });
      
      // Cleanup Flatpickr instances
      if (startTimeFlatpickrRef.current) {
        startTimeFlatpickrRef.current.destroy();
        startTimeFlatpickrRef.current = null;
      }
    };

    const handleFormInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Initialize Flatpickr when form is shown
    React.useEffect(() => {
      if (showReservationForm && window.flatpickr) {
        // Cleanup existing instances
        if (startTimeFlatpickrRef.current) {
          startTimeFlatpickrRef.current.destroy();
        }
        
        // Initialize Start Time picker
        if (startTimeInputRef.current) {
          startTimeFlatpickrRef.current = window.flatpickr(startTimeInputRef.current, {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            minDate: "today",
            time_24hr: false,
            minuteIncrement: 15,
            defaultHour: 9,
            defaultMinute: 0,
            onChange: function(selectedDates, dateStr) {
              handleFormInputChange('startTime', dateStr);
            }
          });
        }
      }
      
      // Cleanup function
      return () => {
        if (startTimeFlatpickrRef.current) {
          startTimeFlatpickrRef.current.destroy();
          startTimeFlatpickrRef.current = null;
        }
      };
    }, [showReservationForm]);

    const submitReservationForm = async () => {
      // Validate form data
      if (!formData.name.trim()) {
        alert('Please enter your name');
        return;
      }
      if (!formData.employeeId.trim()) {
        alert('Please enter your employee ID');
        return;
      }
      if (!formData.contactNumber.trim()) {
        alert('Please enter your contact number');
        return;
      }
      if (!formData.startTime.trim()) {
        alert('Please select a start time');
        return;
      }
      if (!formData.duration) {
        alert('Please select a duration');
        return;
      }

      try {
        // Parse the datetime values and calculate end time
        const startDateTime = new Date(formData.startTime);
        const durationHours = parseFloat(formData.duration);
        
        if (isNaN(startDateTime.getTime())) {
          alert('Please select a valid start time');
          return;
        }
        if (isNaN(durationHours) || durationHours <= 0) {
          alert('Please select a valid duration');
          return;
        }

        // Calculate end time based on start time and duration
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + durationHours);

        // Create reservation using existing function with start and end times
        const result = createReservationFromForm(
          formData.name.trim(),
          formData.employeeId.trim().toUpperCase(),
          formData.contactNumber.trim(),
          startDateTime,
          endDateTime
        );

        // Add bot message with result
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: result,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);

        // Close form and speak the result
        closeReservationForm();
        speakText(result);
      } catch (error) {
        alert('Error creating reservation: ' + error.message);
      }
    };

    const handleLabReservationRequest = (message) => {
      const lowerMessage = message.toLowerCase();
      
      // Check if this is a reservation request
      if (lowerMessage.includes('reserve') || lowerMessage.includes('book') || lowerMessage.includes('lab')) {
        // Show the reservation form dialog
        showLabReservationForm();
        return `📋 **Lab Reservation Form Opening...**\n\nA form dialog will appear to collect your reservation details. Please fill in:\n• Your full name\n• Employee ID\n• Contact number\n• Start time\n• Duration\n\n💡 This makes it easier than typing everything manually!`;
      }
      
      // Handle structured input (fallback for when form is not used)
      if (message.includes('Name:') || message.includes('ID:') || message.includes('Date:')) {
        return parseStructuredReservation(message);
      }
      
      // If no structured format detected, give friendly guidance
      return `📋 To reserve the lab, say something like:\n• "Reserve lab" or "Book lab" (opens form dialog)\n• Or use format: "Reserve lab Name: John Smith\\nID: EMP123\\nDate: tomorrow\\nTime: 2 PM"`;
    };

    const handleViewReservations = () => {
      const reservations = getStoredReservations();
      
      if (reservations.length === 0) {
        return `📋 No lab reservations found.\n\nTo reserve the lab, say something like:\n "Reserve lab Name: John Smith\nID: EMP123\nDate: tomorrow\nTime: 2 PM"`;
      }
      
      // Sort reservations by date
      const sortedReservations = reservations.sort((a, b) => new Date(a.start) - new Date(b.start));
      
      let response = `📋 Lab reservations:\n\n`;
      
      sortedReservations.forEach((reservation, index) => {
        const startDate = new Date(reservation.start);
        const endDate = new Date(reservation.end);
        const formattedDate = startDate.toLocaleDateString();
        const formattedStartTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const formattedEndTime = endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        response += `${index + 1}. 👤 ${reservation.userName}\n`;
        response += `   🆔 Employee ID: ${reservation.employeeId}\n`;
        response += `   📱 Contact: ${reservation.contactNumber || 'N/A'}\n`;
        response += `   📅… ${formattedDate}\n`;
        response += `   ⏱️ ${formattedStartTime} - ${formattedEndTime}\n\n`;
      });
      
      response += `To cancel a reservation, say "cancel reservation [name]" or click on it in the calendar.`;
      
      return response;
    };

    const handleCancelReservation = (message) => {
      const reservations = getStoredReservations();
      
      if (reservations.length === 0) {
        return `❌ No lab reservations to cancel.`;
      }
      
      // Try to extract name from message
      const cancelMatch = message.match(/cancel\s+reservation\s+(.+)/i);
      
      if (!cancelMatch || !cancelMatch[1]) {
        // Show list of reservations to cancel
        let response = `❓ Which lab reservation would you like to cancel?\n\n`;
        reservations.forEach((reservation, index) => {
          const startDate = new Date(reservation.start);
          const formattedDate = startDate.toLocaleDateString();
          const formattedTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          response += `${index + 1}. ${reservation.userName} (${reservation.employeeId}) - ${formattedDate} at ${formattedTime}\n`;
        });
        response += `\nSay "cancel reservation [name]" to cancel a specific reservation.`;
        return response;
      }
      
      const nameToCancel = cancelMatch[1].trim().toLowerCase();
      
      // Find matching reservation by name or employee ID
      const reservationIndex = reservations.findIndex(res => 
        res.userName.toLowerCase().includes(nameToCancel) || 
        res.employeeId.toLowerCase().includes(nameToCancel)
      );
      
      if (reservationIndex === -1) {
        return `❌ Could not find a lab reservation for "${cancelMatch[1]}". Please check the name or employee ID and try again.`;
      }
      
      // Remove the reservation
      const cancelledReservation = reservations[reservationIndex];
      const updatedReservations = reservations.filter((_, index) => index !== reservationIndex);
      saveReservations(updatedReservations);
      // Also update appointments for calendar compatibility
      localStorage.setItem('appointments', JSON.stringify(updatedReservations));
      
      const startDate = new Date(cancelledReservation.start);
      const endDate = new Date(cancelledReservation.end);
      const formattedDate = startDate.toLocaleDateString();
      const formattedStartTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const formattedEndTime = endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return `❌ Lab reservation cancelled successfully!\n\n` +
             `✅ Cancelled: ${cancelledReservation.userName}\n` +
             `🆔 Employee ID: ${cancelledReservation.employeeId}\n` +
             `📱 Contact: ${cancelledReservation.contactNumber || 'N/A'}\n` +
             `📅 Was scheduled for: ${formattedDate}\n` +
             `🕐 Time: ${formattedStartTime} - ${formattedEndTime}\n\n` +
             `The reservation has been removed from the calendar.`;
    };

    const processUserMessage = async (message) => {
      const lowerMessage = message.toLowerCase().trim();
      
      // Test speech functionality
      if (lowerMessage.includes('test speech') || lowerMessage.includes('test voice') || lowerMessage.includes('speech test')) {
        const testMessage = 'This is a speech test. If you can hear this, text to speech is working correctly.';
        speakText(testMessage);
        return `🔊 Speech test initiated. You should hear: "${testMessage}"`;
      }
      
      // View lab reservations
      if (lowerMessage.includes('show reservations') || lowerMessage.includes('list reservations') || lowerMessage.includes('my reservations') || lowerMessage.includes('view reservations')) {
        return handleViewReservations();
      }
      
      // Cancel/delete reservations
      if (lowerMessage.includes('cancel reservation') || lowerMessage.includes('delete reservation') || lowerMessage.includes('remove reservation')) {
        return handleCancelReservation(message);
      }

      // Lab reservation requests
      if (lowerMessage.includes('reserve') || lowerMessage.includes('reservation') || lowerMessage.includes('lab') || lowerMessage.includes('laboratory') || lowerMessage.includes('book lab')) {
        return handleLabReservationRequest(message);
      }
      
      // Quote requests
      if (lowerMessage.includes('quote') || lowerMessage.includes('inspire') || lowerMessage.includes('wisdom')) {
        setIsLoading(true);
        const quote = await getRandomQuote();
        setIsLoading(false);
        return `💭­ ${quote}`;
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
        console.log('ChatbotDialog opened - initializing smile animation (ONE TIME ONLY)');
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
          console.log('💭¤ Idle timeout reached - switching to random idle animation');
          setIsIdleMode(true);
          
          // Randomly choose between clock and heart animations
          const idleAnimations = ['clock', 'heart'];
          const randomAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
          console.log(`🎲 Randomly selected ${randomAnimation} animation`);
          
          // Simple transition to random idle animation
          const currentPattern = patterns['smile']; // Always start from smile when opening
          
          animatePatternTransition(currentPattern, randomAnimation, () => {
            console.log(`🎨 ${randomAnimation === 'clock' ? '⏱️' : '💭–'} ${randomAnimation} animation started`);
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
        ref: messagesContainerRef,
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
    ].concat(showReservationForm ? [
      // Lab Reservation Form Dialog Overlay
      React.createElement('div', {
        key: 'form-overlay',
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        },
        onClick: (e) => {
          if (e.target === e.currentTarget) closeReservationForm();
        }
      }, [
        // Form Dialog
        React.createElement('div', {
          key: 'form-dialog',
          style: {
            backgroundColor: theme === 'light' ? '#fff' : '#2d3748',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            color: theme === 'light' ? '#333' : '#fff',
            fontFamily: 'Roboto Condensed, sans-serif'
          }
        }, [
          // Form Header
          React.createElement('div', {
            key: 'form-header',
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: `1px solid ${theme === 'light' ? '#e0e0e0' : '#4a5568'}`
            }
          }, [
            React.createElement('h3', {
              key: 'form-title',
              style: {
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold'
              }
            }, '📋 Lab Reservation Form'),
            React.createElement('button', {
              key: 'form-close',
              onClick: closeReservationForm,
              style: {
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: theme === 'light' ? '#666' : '#ccc',
                padding: '4px'
              }
            }, '✕')
          ]),
          
          // Form Fields
          React.createElement('div', {
            key: 'form-fields',
            style: { marginBottom: '20px' }
          }, [
            // Name Field
            React.createElement('div', {
              key: 'name-field',
              style: { marginBottom: '16px' }
            }, [
              React.createElement('label', {
                key: 'name-label',
                style: {
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }
              }, '👤 Full Name *'),
              React.createElement('input', {
                key: 'name-input',
                type: 'text',
                value: formData.name,
                onChange: (e) => handleFormInputChange('name', e.target.value),
                placeholder: 'Enter your full name',
                style: {
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#4a5568'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#fff' : '#1a1a2e',
                  color: theme === 'light' ? '#333' : '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }
              })
            ]),
            
            // Employee ID Field
            React.createElement('div', {
              key: 'id-field',
              style: { marginBottom: '16px' }
            }, [
              React.createElement('label', {
                key: 'id-label',
                style: {
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }
              }, '🆔 Employee ID *'),
              React.createElement('input', {
                key: 'id-input',
                type: 'text',
                value: formData.employeeId,
                onChange: (e) => handleFormInputChange('employeeId', e.target.value),
                placeholder: 'e.g., EMP123',
                style: {
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#4a5568'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#fff' : '#1a1a2e',
                  color: theme === 'light' ? '#333' : '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }
              })
            ]),
            
            // Contact Number Field
            React.createElement('div', {
              key: 'contact-field',
              style: { marginBottom: '16px' }
            }, [
              React.createElement('label', {
                key: 'contact-label',
                style: {
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }
              }, '📱 Contact Number *'),
              React.createElement('input', {
                key: 'contact-input',
                type: 'text',
                value: formData.contactNumber,
                onChange: (e) => handleFormInputChange('contactNumber', e.target.value),
                placeholder: 'e.g., +65 9123 4567',
                style: {
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#4a5568'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#fff' : '#1a1a2e',
                  color: theme === 'light' ? '#333' : '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }
              })
            ]),
            
            // DateTime Field
            React.createElement('div', {
              key: 'starttime-field',
              style: { marginBottom: '16px' }
            }, [
              React.createElement('label', {
                key: 'starttime-label',
                style: {
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }
              }, '🕐 Start Time *'),
              React.createElement('input', {
                key: 'starttime-input',
                type: 'text',
                value: formData.startTime,
                onChange: (e) => handleFormInputChange('startTime', e.target.value),
                placeholder: 'Select start date and time',
                ref: startTimeInputRef,
                readOnly: true,
                style: {
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#4a5568'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#fff' : '#1a1a2e',
                  color: theme === 'light' ? '#333' : '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }
              })
            ]),
            
            // Duration Field
            React.createElement('div', {
              key: 'duration-field',
              style: { marginBottom: '16px' }
            }, [
              React.createElement('label', {
                key: 'duration-label',
                style: {
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }
              }, '⏱️ Duration (hours) *'),
              React.createElement('select', {
                key: 'duration-input',
                value: formData.duration,
                onChange: (e) => handleFormInputChange('duration', e.target.value),
                style: {
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#4a5568'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#fff' : '#1a1a2e',
                  color: theme === 'light' ? '#333' : '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }
              }, [
                React.createElement('option', {
                  key: 'duration-placeholder',
                  value: '',
                  disabled: true
                }, 'Select duration'),
                React.createElement('option', {
                  key: 'duration-0.5',
                  value: '0.5'
                }, '30 minutes'),
                React.createElement('option', {
                  key: 'duration-1',
                  value: '1'
                }, '1 hour'),
                React.createElement('option', {
                  key: 'duration-1.5',
                  value: '1.5'
                }, '1.5 hours'),
                React.createElement('option', {
                  key: 'duration-2',
                  value: '2'
                }, '2 hours'),
                React.createElement('option', {
                  key: 'duration-2.5',
                  value: '2.5'
                }, '2.5 hours'),
                React.createElement('option', {
                  key: 'duration-3',
                  value: '3'
                }, '3 hours'),
                React.createElement('option', {
                  key: 'duration-4',
                  value: '4'
                }, '4 hours'),
                React.createElement('option', {
                  key: 'duration-6',
                  value: '6'
                }, '6 hours'),
                React.createElement('option', {
                  key: 'duration-8',
                  value: '8'
                }, '8 hours')
              ])
            ])
          ]),
          
          // Form Buttons
          React.createElement('div', {
            key: 'form-buttons',
            style: {
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }
          }, [
            React.createElement('button', {
              key: 'cancel-btn',
              onClick: closeReservationForm,
              style: {
                padding: '10px 20px',
                border: `1px solid ${theme === 'light' ? '#ddd' : '#4a5568'}`,
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: theme === 'light' ? '#666' : '#ccc',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }
            }, 'Cancel'),
            React.createElement('button', {
              key: 'submit-btn',
              onClick: submitReservationForm,
              style: {
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)',
                color: theme === 'light' ? '#fff' : '#1a1a2e',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }
            }, '📋 Reserve Lab')
          ])
        ])
      ])
    ] : []));
  }

  window.ChatbotDialog = ChatbotDialog;
})();

