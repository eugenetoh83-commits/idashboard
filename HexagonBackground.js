// HexagonBackground.js
// Animated, interactive hexagonal grid background using anime.js and React
const HEX_COLORS = ['#4a00e0', '#00b4d8', '#e94560', '#f9d923', '#00ffb4', '#ff2e63'];
const DARK_COLORS = ['#1a1a2e', '#16213e', '#232946'];

function randomColor() {
  return HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)];
}

function getHexPoints(size, cx, cy) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    points.push([
      cx + size * Math.cos(angle),
      cy + size * Math.sin(angle)
    ]);
  }
  return points.map(p => p.join(',')).join(' ');
}

function HexagonBackground() {
  const size = 10; // <--- Move size here for global use
  const svgRef = React.useRef();
  const divRef = React.useRef();
  const [hexes, setHexes] = React.useState([]);
  const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [bgColor, setBgColor] = React.useState(DARK_COLORS[0]);

  // Debug: log all clicks on the parent div
  React.useEffect(() => {
    function debugClick(e) {
      console.log('DIV CLICKED', e.target, e.currentTarget);
    }
    const div = divRef.current;
    if (div) {
      div.addEventListener('click', debugClick);
    }
    return () => {
      if (div) div.removeEventListener('click', debugClick);
    };
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
    // Hexagon grid math
    const w = size * Math.sqrt(3);
    const h = size * 1.5;
    const cols = Math.ceil(dimensions.width / w) + 2;
    const rows = Math.ceil(dimensions.height / h) + 2;
    const hexArray = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * w + ((row % 2) * w) / 2;
        const y = row * h * 0.85;
        hexArray.push({
          id: row + '-' + col,
          cx: x,
          cy: y,
          color: DARK_COLORS[(row + col) % DARK_COLORS.length],
          anim: null,
        });
      }
    }
    setHexes(hexArray);
  }, [dimensions]);

  // Subtle pulsing animation
  React.useEffect(() => {
    if (!svgRef.current) return;
    hexes.forEach((hex, i) => {
      const el = svgRef.current.querySelector(`#hex-${hex.id}`);
      if (el) {
        window.anime({
          targets: el,
          scale: [1, 1.08, 1],
          duration: 2200 + (i % 7) * 200,
          easing: 'easeInOutSine',
          loop: true,
          direction: 'alternate',
          delay: (i % 7) * 80,
        });
      }
    });
  }, [hexes]);

  // Handle click/touch for color wave
  function handleHexClick(e, idx) {
    e.stopPropagation();
    const newHexes = [...hexes];
    const queue = [[idx, 0]];
    const visited = new Set();
    while (queue.length) {
      const [currentIdx, dist] = queue.shift();
      if (visited.has(currentIdx) || dist > 3) continue;
      visited.add(currentIdx);
      newHexes[currentIdx] = {
        ...newHexes[currentIdx],
        color: randomColor(),
      };
      // Find neighbors (hex grid math)
      const { cx, cy } = newHexes[currentIdx];
      for (let j = 0; j < hexes.length; j++) {
        if (visited.has(j)) continue;
        const dx = hexes[j].cx - cx;
        const dy = hexes[j].cy - cy;
        const distHex = Math.sqrt(dx * dx + dy * dy);
        // Use a threshold based on hex size for neighbor detection
        if (distHex < size * 2) {
          queue.push([j, dist + 1]);
        }
      }
    }
    setHexes(newHexes);
    // Animate color transition
    newHexes.forEach((hex, i) => {
      const el = svgRef.current.querySelector(`#hex-${hex.id}`);
      if (el) {
        window.anime({
          targets: el,
          fill: hex.color,
          duration: 600 + (i % 7) * 80,
          easing: 'easeInOutQuad',
        });
      }
    });
  }

  // Animate background color on div click
  function handleBackgroundClick(e) {
    // Only trigger if not clicking a polygon
    if (e.target === e.currentTarget) {
      console.log('handleBackgroundClick fired');
      const newColor = DARK_COLORS[Math.floor(Math.random() * DARK_COLORS.length)];
      window.anime({
        targets: e.currentTarget,
        backgroundColor: [bgColor, newColor],
        duration: 800,
        easing: 'easeInOutQuad',
        update: function(anim) {
          e.currentTarget.style.background = anim.animations[0].currentValue;
        },
        complete: function() {
          setBgColor(newColor);
        }
      });
    }
  }

  // Use viewport size for SVG and grid
  const w = size * Math.sqrt(3);
  const h = size * 1.5;
  const cols = Math.ceil(dimensions.width / w) + 2;
  const rows = Math.ceil(dimensions.height / h) + 2;

  return React.createElement('div', {
    ref: divRef,
    style: {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'all',
      background: bgColor,
      userSelect: 'none',
      touchAction: 'none',
      transition: 'background 0.5s',
      border: '4px solid #ff2e63',
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    onClick: handleBackgroundClick
  },
    React.createElement('svg', {
      ref: svgRef,
      width: dimensions.width,
      height: dimensions.height,
      viewBox: `0 0 ${dimensions.width} ${dimensions.height}`,
      style: {
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        display: 'block',
      }
    },
      hexes.map((hex, i) =>
        React.createElement('polygon', {
          key: hex.id,
          id: `hex-${hex.id}`,
          points: getHexPoints(size, hex.cx, hex.cy),
          fill: hex.color,
          style: {
            opacity: 0.85,
            cursor: 'pointer',
            transition: 'fill 0.5s',
            pointerEvents: 'auto',
          },
          onClick: (e) => handleHexClick(e, i),
          onTouchStart: (e) => handleHexClick(e, i),
        })
      )
    )
  );
}

// For Babel/UMD usage
window.HexagonBackground = HexagonBackground;
