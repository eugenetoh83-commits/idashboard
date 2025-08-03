// HexagonBackgroundCanvas.js
// Animated, interactive hexagonal grid background using anime.js and React, rendered on a <canvas>

function HexagonBackgroundCanvas() {
  const DARK_HEX_COLORS = ['#121212', '#6d597a', '#35524a'];
  const DARK_BG_COLORS = ['#1a1a2e'];
  const LIGHT_HEX_COLORS = ['#538ec7', '#dff0fe', '#72a5d6'];
  const LIGHT_BG_COLORS = ['#E7E8D1', '#A7BEAE', '#fff'];

  function randomColor(theme) {
    const colors = theme === 'light' ? LIGHT_HEX_COLORS : DARK_HEX_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const canvasRef = React.useRef();
  const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [hexes, setHexes] = React.useState([]);
  const [bgColor, setBgColor] = React.useState(DARK_BG_COLORS[0]);
  const [theme, setTheme] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.body.classList.contains('light-theme') ? 'light' : 'dark';
    }
    return 'dark';
  });
  // Set hexagon size here (e.g., 70 for large, 30 for small)
  const size = 50;
  const w = size * Math.sqrt(3);
  const h = size * 1.5;

  // Listen for theme changes
  React.useEffect(() => {
    function updateTheme() {
      setTheme(document.body.classList.contains('light-theme') ? 'light' : 'dark');
    }
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Generate grid on mount/resize
  React.useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const cols = Math.ceil(dimensions.width / w) + 2;
    const rows = Math.ceil(dimensions.height / h) + 2;
    const hexArray = [];
    const colorArray = theme === 'light' ? LIGHT_HEX_COLORS : DARK_HEX_COLORS;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * w + ((row % 2) * w) / 2;
        const y = row * h * 0.85;
        hexArray.push({
          id: row + '-' + col,
          cx: x,
          cy: y,
          color: colorArray[(row + col) % colorArray.length],
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }
    setHexes(hexArray);
  }, [dimensions, theme]);

  // Animation loop
  React.useEffect(() => {
    let running = true;
    function draw() {
      if (!canvasRef.current) return; // Add null check
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return; // Add context check
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      // Set background color based on theme
      const bgArr = theme === 'light' ? LIGHT_BG_COLORS : DARK_BG_COLORS;
      ctx.fillStyle = bgArr[0];
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      const now = performance.now();
      for (let i = 0; i < hexes.length; i++) {
        const hex = hexes[i];
        // Pulse animation
        const pulse = 1 + 0.06 * Math.sin(now / 700 + hex.pulse);
        drawHex(ctx, hex.cx, hex.cy, size * pulse, hex.color, 0.85);
      }
      if (running) requestAnimationFrame(draw);
    }
    if (canvasRef.current) draw();
    return () => { running = false; };
  }, [hexes, dimensions, theme]);

  // Draw a single hexagon
  function drawHex(ctx, cx, cy, size, color, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // Handle click/touch for color wave
  function handleCanvasClick(e) {
    console.log('[HEXAGON CANVAS] CLICK EVENT:', {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      clientX: e.clientX,
      clientY: e.clientY,
      pointerType: e.pointerType,
      button: e.button,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      composed: e.composed,
      eventPhase: e.eventPhase,
      isTrusted: e.isTrusted,
      defaultPrevented: e.defaultPrevented,
      timeStamp: e.timeStamp
    });
    
    if (!canvasRef.current) return; // Add null check
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('[HEXAGON CANVAS] Click coordinates:', { x, y, rect });
    
    // Find the closest hex
    let minDist = Infinity, minIdx = -1;
    for (let i = 0; i < hexes.length; i++) {
      const dx = hexes[i].cx - x;
      const dy = hexes[i].cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }
    
    console.log('[HEXAGON CANVAS] Closest hex:', { minIdx, minDist, threshold: size * 1.1 });
    
    if (minIdx !== -1 && minDist < size * 1.1) {
      console.log('[HEXAGON CANVAS] Triggering hex wave effect');
      // Wave color effect
      const newHexes = [...hexes];
      const queue = [[minIdx, 0]];
      const visited = new Set();
      while (queue.length) {
        const [currentIdx, dist] = queue.shift();
        if (visited.has(currentIdx) || dist > 3) continue;
        visited.add(currentIdx);
        newHexes[currentIdx] = {
          ...newHexes[currentIdx],
          color: randomColor(theme),
        };
        // Find neighbors
        const { cx, cy } = newHexes[currentIdx];
        for (let j = 0; j < hexes.length; j++) {
          if (visited.has(j)) continue;
          const dx = hexes[j].cx - cx;
          const dy = hexes[j].cy - cy;
          const distHex = Math.sqrt(dx * dx + dy * dy);
          if (distHex < 75) {
            queue.push([j, dist + 1]);
          }
        }
      }
      setHexes(newHexes);
    } else {
      console.log('[HEXAGON CANVAS] No hex clicked or distance too far');
      // Animate background color
      const bgArr = theme === 'light' ? LIGHT_BG_COLORS : DARK_BG_COLORS;
      const newColor = bgArr[Math.floor(Math.random() * bgArr.length)];
      window.anime({
        targets: {}, // dummy
        duration: 800,
        easing: 'easeInOutQuad',
        update: function(anim) {
          setBgColor(anim.progress < 100 ? bgColor : newColor);
        },
        complete: function() {
          setBgColor(newColor);
        }
      });
    }
  }

  // Additional event handlers for comprehensive logging
  function handleTouchStart(e) {
    console.log('[HEXAGON CANVAS] TOUCH START:', {
      type: e.type,
      touches: e.touches ? Array.from(e.touches).map(t => ({
        clientX: t.clientX,
        clientY: t.clientY,
        identifier: t.identifier,
        pageX: t.pageX,
        pageY: t.pageY,
        radiusX: t.radiusX,
        radiusY: t.radiusY,
        rotationAngle: t.rotationAngle,
        force: t.force
      })) : [],
      changedTouches: e.changedTouches ? Array.from(e.changedTouches).map(t => ({
        clientX: t.clientX,
        clientY: t.clientY,
        identifier: t.identifier
      })) : [],
      timeStamp: e.timeStamp
    });
    handleCanvasClick(e.touches[0]);
  }

  function handleTouchEnd(e) {
    console.log('[HEXAGON CANVAS] TOUCH END:', {
      type: e.type,
      touches: e.touches ? Array.from(e.touches).length : 0,
      changedTouches: e.changedTouches ? Array.from(e.changedTouches).length : 0,
      timeStamp: e.timeStamp
    });
  }

  function handleTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      console.log('[HEXAGON CANVAS] TOUCH MOVE:', {
        type: e.type,
        clientX: touch.clientX,
        clientY: touch.clientY,
        timeStamp: e.timeStamp
      });
    }
  }

  function handleMouseEnter(e) {
    console.log('[HEXAGON CANVAS] MOUSE ENTER:', {
      type: e.type,
      clientX: e.clientX,
      clientY: e.clientY,
      timeStamp: e.timeStamp
    });
  }

  function handleMouseLeave(e) {
    console.log('[HEXAGON CANVAS] MOUSE LEAVE:', {
      type: e.type,
      clientX: e.clientX,
      clientY: e.clientY,
      timeStamp: e.timeStamp
    });
  }

  function handleMouseMove(e) {
    // Only log occasionally to avoid spam
    if (Math.random() < 0.01) {
      console.log('[HEXAGON CANVAS] MOUSE MOVE (sampled):', {
        type: e.type,
        clientX: e.clientX,
        clientY: e.clientY,
        timeStamp: e.timeStamp
      });
    }
  }

  // Expose event handlers globally for external triggering immediately
  window.HexagonBackgroundHandlers = {
    handleCanvasClick,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove
  };

  return React.createElement('canvas', {
    ref: canvasRef,
    width: dimensions.width,
    height: dimensions.height,
    style: {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      display: 'block',
      background: bgColor,
      userSelect: 'none',
      touchAction: 'none',
      cursor: 'pointer',
    },
    onClick: handleCanvasClick,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove,
  });
}

window.HexagonBackground = HexagonBackgroundCanvas;
