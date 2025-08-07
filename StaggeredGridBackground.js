// Animated staggered grid background with ripple effect (UMD, no JSX)

(function() {
  function StaggeredGridBackground(props) {
    const cellSize = 20;
    const [dimensions, setDimensions] = React.useState({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Force re-render when theme changes
    const [forceUpdate, setForceUpdate] = React.useState(0);
    
    // Function to get the current theme directly from localStorage
    const getCurrentTheme = () => {
      const stored = localStorage.getItem('theme');
      return (stored === 'light' || stored === 'dark') ? stored : 'dark';
    };
    
    // Color schemes based on theme
    const colorSchemes = {
      light: {
        bgColor: '#dff0fe',
        dotColor: 'rgb(180, 200, 220)', // Metallic light blue
        burstColor: 'rgb(150, 170, 200)' // Darker metallic blue for burst
      },
      dark: {
        bgColor: '#121212',
        dotColor: 'rgb(180, 200, 220)', // Same metallic light blue for consistency
        burstColor: 'rgb(210, 230, 250)' // Lighter metallic blue for dark theme burst
      }
    };
    
    // Get colors dynamically based on current theme (updates with forceUpdate)
    const getColors = () => colorSchemes[getCurrentTheme()];
    const rows = Math.ceil(dimensions.height / cellSize);
    const cols = Math.ceil(dimensions.width / cellSize);
    
    // Translation offset constants for ripple effect
    const MAX_TRANSLATE_X = 20; // Maximum X translation offset
    const MAX_TRANSLATE_Y = 20; // Maximum Y translation offset
    
    const canvasRef = React.useRef(null);
    const gridRef = React.useRef([]);
    const animStateRef = React.useRef([]); // {size, alpha, translateX, translateY} for each dot
    const burstRef = React.useRef(null); // {x, y, active, progress}

    // Sparkle system for mouse hover effects
    const [sparkles, setSparkles] = React.useState([]);
    const sparkleId = React.useRef(0);
    const lastSparkle = React.useRef(0);
    const SPARKLE_THROTTLE = 60;

    // Listen for theme changes
    React.useEffect(() => {
      function updateTheme() {
        const stored = localStorage.getItem('theme');
        console.log('[GRID] updateTheme called - localStorage:', stored);
        if (stored === 'light' || stored === 'dark') {
          console.log('[GRID] Theme detected, forcing re-render');
          setForceUpdate(prev => prev + 1); // Force re-render to update colors
          // Force a re-render by calling draw
          setTimeout(() => {
            if (canvasRef.current) draw();
          }, 0);
        }
      }
      
      // Initial sync check
      updateTheme();
      
      // Listen for localStorage changes from ANY source
      function handleStorageChange(e) {
        if (e.key === 'theme') {
          console.log('[GRID] EXTERNAL localStorage change detected!', e.oldValue, '->', e.newValue);
          setTimeout(updateTheme, 10); // Small delay to ensure DOM updates complete
        }
      }
      
      // Only listen for body class changes (when theme toggle is clicked)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            console.log('[GRID] Body class changed, current classes:', document.body.className);
            console.log('[GRID] Before update - localStorage:', localStorage.getItem('theme'));
            setTimeout(updateTheme, 10); // Small delay to ensure all updates complete
          }
        });
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      
      // Listen for storage events (from other tabs or scripts)
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        observer.disconnect();
        window.removeEventListener('storage', handleStorageChange);
      };
    }, []); // Remove theme dependency to prevent re-running when theme state changes

    // Build grid and handle resize
    React.useEffect(function() {
      function buildGrid() {
        gridRef.current = [];
        animStateRef.current = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            gridRef.current.push({ r, c });
            animStateRef.current.push({ 
              size: cellSize/3, 
              alpha: 1, 
              translateX: 0, 
              translateY: 0 
            });
          }
        }
        draw();
      }
      buildGrid();
      function handleResize() {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [rows, cols, forceUpdate]); // Add forceUpdate dependency instead of theme

    // Draw function
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width = dimensions.width;
      let height = dimensions.height;
      canvas.width = width;
      canvas.height = height;
      
      // Get current colors based on theme
      const colors = getColors();
      
      ctx.fillStyle = colors.bgColor;
      ctx.fillRect(0, 0, width, height);
      let gridW = cols * cellSize;
      let gridH = rows * cellSize;
      let offsetX = (width - gridW) / 2;
      let offsetY = (height - gridH) / 2;
      // Draw dots
      gridRef.current.forEach(function(cell, idx) {
        let baseX = offsetX + cell.c * cellSize + cellSize/2;
        let baseY = offsetY + cell.r * cellSize + cellSize/2;
        let { size, alpha, translateX, translateY } = animStateRef.current[idx] || { 
          size: cellSize/3, 
          alpha: 1, 
          translateX: 0, 
          translateY: 0 
        };
        
        // Apply translation offset
        let x = baseX + translateX;
        let y = baseY + translateY;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = colors.dotColor;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = colors.dotColor;
        ctx.shadowBlur = 8 * alpha;
        ctx.fill();
        ctx.restore();
      });
      // Draw burst if active
      if (burstRef.current && burstRef.current.active) {
        let { x, y, progress } = burstRef.current;
        ctx.save();
        ctx.translate(x, y);
        for (let i = 0; i < 10; i++) {
          ctx.rotate((2 * Math.PI * i) / 10);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -18 * progress);
          ctx.strokeStyle = colors.burstColor;
          ctx.lineWidth = 3 * (1 - progress);
          ctx.globalAlpha = 1 - progress;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Ripple effect
    function triggerRipple(x, y) {
      // Get the current theme (this will sync automatically)
      const actualTheme = getCurrentTheme();
      
      console.log('[GRID] triggerRipple START - theme:', actualTheme, 'localStorage:', localStorage.getItem('theme'), 'body classes:', document.body.className);
      
      // Burst effect
      burstRef.current = { x, y, active: true, progress: 0 };
      anime({
        targets: burstRef.current,
        progress: 1,
        duration: 350,
        easing: 'easeOutCubic',
        update: draw,
        complete: function() {
          burstRef.current.active = false;
          draw();
          console.log('[GRID] triggerRipple COMPLETE - theme:', getCurrentTheme(), 'localStorage:', localStorage.getItem('theme'), 'body classes:', document.body.className);
        }
      });
      // Ripple dots (manual animation, not anime.js)
      const width = dimensions.width;
      const height = dimensions.height;
      let gridW = cols * cellSize;
      let gridH = rows * cellSize;
      let offsetX = (width - gridW) / 2;
      let offsetY = (height - gridH) / 2;
      const dists = gridRef.current.map(cell => {
        let cx = offsetX + cell.c * cellSize + cellSize/2;
        let cy = offsetY + cell.r * cellSize + cellSize/2;
        let distance = Math.sqrt((cx - x) * (cx - x) + (cy - y) * (cy - y));
        // Calculate direction vector (normalized)
        let dirX = distance > 0 ? (cx - x) / distance : 0;
        let dirY = distance > 0 ? (cy - y) / distance : 0;
        return { distance, dirX, dirY };
      });
      const maxDist = Math.max(...dists.map(d => d.distance));
      // Animation parameters
      const normalAlpha = 1;
      const highlightAlpha = 1.5;
      const expandDuration = 20;
      const contractDuration = 1250;
      const frameRate = 1000/60;
      // Store animation state
      let startTime = performance.now();
      function animateFrame() {
        let now = performance.now();
        let allDone = true;
        dists.forEach((distData, idx) => {
          const { distance, dirX, dirY } = distData;
          const delay = (distance / maxDist) * 400;
          let t = now - startTime - delay;
          
          if (t < 0) {
            // Not started yet
            animStateRef.current[idx].translateX = 0;
            animStateRef.current[idx].translateY = 0;
            animStateRef.current[idx].alpha = normalAlpha;
            allDone = false;
            return;
          }
          
          if (t < expandDuration) {
            // Expanding - translate away from click point
            let p = t / expandDuration;
            animStateRef.current[idx].translateX = dirX * MAX_TRANSLATE_X * p;
            animStateRef.current[idx].translateY = dirY * MAX_TRANSLATE_Y * p;
            animStateRef.current[idx].alpha = normalAlpha + (highlightAlpha - normalAlpha) * p;
            allDone = false;
          } else if (t < expandDuration + contractDuration) {
            // Contracting - translate back to original position
            let p = (t - expandDuration) / contractDuration;
            animStateRef.current[idx].translateX = dirX * MAX_TRANSLATE_X * (1 - p);
            animStateRef.current[idx].translateY = dirY * MAX_TRANSLATE_Y * (1 - p);
            animStateRef.current[idx].alpha = highlightAlpha + (normalAlpha - highlightAlpha) * p;
            allDone = false;
          } else {
            // Animation complete
            animStateRef.current[idx].translateX = 0;
            animStateRef.current[idx].translateY = 0;
            animStateRef.current[idx].alpha = normalAlpha;
          }
        });
        draw();
        if (!allDone) {
          requestAnimationFrame(animateFrame);
        }
      }
      requestAnimationFrame(animateFrame);
    }

    // Mouse/touch event listeners
    React.useEffect(function() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Handle mouse move for sparkles
      function handleMouseMove(e) {
        const now = Date.now();
        if (now - lastSparkle.current < SPARKLE_THROTTLE) return;
        lastSparkle.current = now;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + (Math.random() - 0.5) * 64;
        const y = e.clientY - rect.top + (Math.random() - 0.5) * 64;
        const id = sparkleId.current++;
        
        // Theme-responsive sparkle colors that complement the metallic blue dots
        const currentTheme = getCurrentTheme();
        const sparkleColors = currentTheme === 'light' 
          ? ["rgb(210, 230, 250)", "rgb(190, 210, 240)", "rgb(170, 190, 230)", "#ffffff"]  // Light metallic blue variations
          : ["rgb(210, 230, 250)", "rgb(180, 200, 220)", "rgb(150, 170, 200)", "#ffffff"]; // Metallic blue variations for dark theme
        
        const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
        const size = 5 + Math.random() * 15;
        
        setSparkles(sparkles => [
          ...sparkles,
          { id, x, y, color, size }
        ]);
        
        setTimeout(() => {
          setSparkles(sparkles => sparkles.filter(s => s.id !== id));
        }, 700);
      }
      
      function getXY(e) {
        let x, y;
        if (e.touches && e.touches.length > 0) {
          x = e.touches[0].clientX;
          y = e.touches[0].clientY;
        } else if (e.clientX != null) {
          x = e.clientX;
          y = e.clientY;
        } else {
          x = window.innerWidth/2;
          y = window.innerHeight/2;
        }
        return { x, y };
      }
      function handlePointer(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        console.log('[GRID] Handling pointer event:', e.type);
        console.log('[GRID] Current theme before interaction:', getCurrentTheme());
        console.log('[GRID] Current localStorage before interaction:', localStorage.getItem('theme'));
        
        // Stop event propagation to prevent double handling
        e.stopPropagation();
        e.preventDefault();
        
        const { x, y } = getXY(e);
        triggerRipple(x, y);
        console.log('[GRID] Ripple triggered, theme still:', getCurrentTheme());
        console.log('[GRID] localStorage after ripple:', localStorage.getItem('theme'));
      }
      
      // Expose handlers globally for external triggering
      window.StaggeredGridBackgroundHandlers = {
        handlePointer,
        triggerRipple: (x, y) => triggerRipple(x, y),
        handleClick: handlePointer,
        handleTouchStart: handlePointer
      };
      
      canvas.addEventListener('mousedown', handlePointer);
      canvas.addEventListener('touchstart', handlePointer, { passive: true });
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => {
        canvas.removeEventListener('mousedown', handlePointer);
        canvas.removeEventListener('touchstart', handlePointer);
        canvas.removeEventListener('mousemove', handleMouseMove);
        delete window.StaggeredGridBackgroundHandlers;
      };
    }, []);

    // Responsive canvas style with sparkles overlay
    return React.createElement('div', {
      style: {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'auto',
        touchAction: 'none',
      }
    }, [
      // Canvas element
      React.createElement('canvas', {
        key: 'canvas',
        ref: canvasRef,
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          background: getColors().bgColor,
          cursor: 'pointer'
        },
        title: 'Click or tap to ripple the grid'
      }),
      // Sparkles overlay
      ...sparkles.map(sparkle =>
        React.createElement('div', {
          key: sparkle.id,
          style: {
            position: 'absolute',
            left: sparkle.x - sparkle.size / 2,
            top: sparkle.y - sparkle.size / 2,
            width: sparkle.size,
            height: sparkle.size,
            background: sparkle.color,
            borderRadius: '50%',
            pointerEvents: 'none',
            boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.size / 2}px ${sparkle.color}`,
            zIndex: 10,
          }
        })
      )
    ]);
  }
  window.StaggeredGridBackground = StaggeredGridBackground;
})();
