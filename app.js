// React + anime.js dashboard with interactive nodes
// Nodes are equally spaced on a circle, fixed order, no randomization
const baseNodes = [
  { label: "A", staticIcon: "img/icons8-alert.png", gifIcon: "img/icons8-alert.gif" },
  { label: "B", staticIcon: "img/icons8-connection.png", gifIcon: "img/icons8-connection.gif" },
  { label: "C", staticIcon: "img/icons8-document.png", gifIcon: "img/icons8-document.gif" },
  { label: "D", staticIcon: "img/icons8-home.png", gifIcon: "img/icons8-home.gif" },
  { label: "E", staticIcon: "img/icons8-lock.png", gifIcon: "img/icons8-lock.gif" },
  { label: "F", staticIcon: "img/icons8-rain-cloud.png", gifIcon: "img/icons8-rain-cloud.gif" },
  { label: "G", staticIcon: "img/icons8-learning.png", gifIcon: "img/icons8-learning.gif" }
];
function getCircleNodes(radius = 200, centerX = 300, centerY = 200) {
  const n = baseNodes.length;
  return baseNodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / n;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
}
const nodesData = getCircleNodes();

// Graph connections (edges)
const connections = [
  [0,1],[2,3],[3,4],[5,0],[1,6],[6,3]
];


// Responsive node size helper
function getResponsiveNodeSize(isHovered) {
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  // Clamp between 48 and 80px
  const base = Math.max(48, Math.min(0.09 * vw, 80));
  return isHovered ? base * 1.35 : base;
}

function Dashboard() {
  const cyRef = React.useRef(null);
  const [hoveredNode, setHoveredNode] = React.useState(null);
  const [nodeScreenPositions, setNodeScreenPositions] = React.useState([]);
  const [sparkles, setSparkles] = React.useState([]);
  const [viewport, setViewport] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const sparkleId = React.useRef(0);
  const lastSparkle = React.useRef(0);
  const SPARKLE_THROTTLE = 60;

  // Responsive: update viewport on resize
  React.useEffect(() => {
    function handleResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!window.cytoscape) return;
    // Responsive: scale node positions to viewport with 5% padding on all sides
    const w = 600, h = 400; // base design size
    const padX = 0.05 * viewport.width;
    const padY = 0.05 * viewport.height;
    const scaleX = (viewport.width - 2 * padX) / w;
    const scaleY = (viewport.height - 2 * padY) / h;
    const elements = [
      ...nodesData.map((node, idx) => ({
        data: { id: String(idx), label: node.label },
        position: {
          x: padX + node.x * scaleX,
          y: padY + node.y * scaleY
        },
        selectable: true,
      })),
      ...connections.map(([from, to]) => ({
        data: { id: `e${from}-${to}`, source: String(from), target: String(to) }
      }))
    ];
    const cy = window.cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-opacity': 0,
            'width': 20,
            'height': 20,
            'label': '', // Hide label always
            'z-index': 2,
            'transition-property': 'width height',
            'transition-duration': '200ms',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#fff',
            'opacity': 0.5,
            'z-index': 1,
          }
        }
      ],
      layout: { name: 'preset' },
      userZoomingEnabled: false,
      userPanningEnabled: false, // Disable panning/dragging
      boxSelectionEnabled: false,
      autoungrabify: true, // Prevent node dragging
    });
    // Track node positions for overlay (no cy.project)
    function updateNodeScreenPositions() {
      // Convert graph coordinates to pixel coordinates inside cyRef
      const cyRect = cyRef.current.getBoundingClientRect();
      const pan = cy.pan();
      const zoom = cy.zoom();
      setNodeScreenPositions(cy.nodes().map(n => {
        const pos = n.position();
        // Cytoscape graph coordinates to pixel coordinates
        const x = pos.x * zoom + pan.x;
        const y = pos.y * zoom + pan.y;
        return {
          id: n.id(),
          x,
          y,
          label: n.data('label'),
        };
      }));
    }
    cy.on('position', updateNodeScreenPositions);
    cy.on('pan zoom', updateNodeScreenPositions);
    cy.on('render', updateNodeScreenPositions);
    updateNodeScreenPositions();
    // Initial pan/zoom fit with 5% margin
    const fitPadding = Math.floor(Math.min(viewport.width, viewport.height) * 0.20);
    cy.fit(undefined, fitPadding);
    // Clean up
    return () => { cy.destroy(); };
  }, [viewport]);

  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastSparkle.current < SPARKLE_THROTTLE) return;
    lastSparkle.current = now;
    const dashboard = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - dashboard.left + (Math.random() - 0.5) * 64;
    const y = e.clientY - dashboard.top + (Math.random() - 0.5) * 64;
    const id = sparkleId.current++;
    const color = ["#fffbe6", "#ffe066", "#ffd700", "#ffffff"];
    const size = 5 + Math.random() * 15;
    setSparkles(sparkles => [
      ...sparkles,
      { id, x, y, color: color[Math.floor(Math.random()*color.length)], size }
    ]);
    setTimeout(() => {
      setSparkles(sparkles => sparkles.filter(s => s.id !== id));
    }, 700);
  };

  // Animated edge overlay using SVG and anime.js
  const svgRef = React.useRef(null);
  React.useEffect(() => {
    if (!svgRef.current) return;
    let animeInstance;
    const animate = () => {
      const lines = svgRef.current.querySelectorAll('.animated-edge');
      lines.forEach(line => {
        // Animate stroke-dashoffset for moving effect
        const length = line.getTotalLength();
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = parseFloat(line.style.strokeDashoffset || 0);
      });
      animeInstance = window.anime({
        targets: svgRef.current.querySelectorAll('.animated-edge'),
        strokeDashoffset: [0, -200],
        duration: 900,
        easing: 'linear',
        loop: true,
        direction: 'normal',
      });
    };
    animate();
    return () => { if (animeInstance) animeInstance.pause(); };
  }, [nodeScreenPositions]);

  // Calculate edge lines for overlay
  const edgeLines = connections.map(([from, to], i) => {
    const n1 = nodeScreenPositions.find(n => n.id === String(from));
    const n2 = nodeScreenPositions.find(n => n.id === String(to));
    if (!n1 || !n2) return null;
    return (
      <line
        key={i}
        className="animated-edge"
        x1={n1.x}
        y1={n1.y}
        x2={n2.x}
        y2={n2.y}
        stroke="#4a00e0"
        strokeWidth="10"
        strokeDasharray="16 16"
        strokeDashoffset="0"
        opacity="0.7"
        style={{ filter: 'drop-shadow(0 0 8px #4a00e0)' }}
      />
    );
  });

  return (
    <div>
      <div
        className="dashboard-bg"
        style={{ position: 'relative', width: '100vw', height: '100vh', minHeight: 320 }}
        onMouseMove={handleMouseMove}
      >
        {/* Animated SVG edge overlay */}
        <svg
          ref={svgRef}
          width={viewport.width}
          height={viewport.height}
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
        >
          {edgeLines}
        </svg>
        <div ref={cyRef} style={{ width: '100%', height: '100%' }} />
        {/* Overlay animated GIFs on nodes */}
        {nodeScreenPositions.map(node => {
          const nodeData = nodesData[parseInt(node.id)];
          const isHovered = hoveredNode === node.id;
          const size = getResponsiveNodeSize(isHovered);
          const left = node.x - size / 2;
          const top = node.y - size / 2;
          // Use window.AnimatedBorder for UMD/Babel
          const AnimatedBorder = window.AnimatedBorder;
          return (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left,
                top,
                width: size,
                height: size + (isHovered ? 32 : 0),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'auto', // Allow mouse events
                zIndex: 3,
              }}
            >
              {/* Animated border overlay */}
              {AnimatedBorder && <AnimatedBorder isHovered={isHovered} size={size} />}
              <img
                src={isHovered ? nodeData.gifIcon : nodeData.staticIcon}
                alt={node.label}
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  boxShadow: isHovered ? '0 0 40px #2d8cffcc' : '0 0 20px #2d8cff55',
                  transition: 'box-shadow 0.3s, background 0.3s, width 0.2s, height 0.2s',
                }}
              />
              {isHovered && (
                <span
                  style={{
                    marginTop: 4,
                    color: '#00ffe7',
                    fontSize: 22,
                    fontFamily: 'Roboto Condensed, sans-serif',
                    textShadow: '0 0 8px #222, 0 0 2px #00ffe7',
                    letterSpacing: 2,
                    fontWeight: 700,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 8,
                    padding: '2px 12px',
                  }}
                >
                  {node.label}
                </span>
              )}
            </div>
          );
        })}
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="dashboard-sparkle"
            style={{
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
            }}
          />
        ))}
      </div>
    </div>
  );
}

const HexagonBackground = window.HexagonBackground;

function ThemeToggle({ theme, setTheme }) {
  return (
    <div style={{
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 100,
      background: theme === 'dark' ? 'rgba(30,32,40,0.95)' : 'rgba(255,255,255,0.95)',
      color: theme === 'dark' ? '#fff' : '#222',
      borderRadius: 16,
      boxShadow: '0 2px 16px #0002',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'Roboto Condensed, sans-serif',
      fontWeight: 700,
      fontSize: 18,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background 0.3s, color 0.3s',
    }}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
      }}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </div>
  );
}

function App() {
  const [theme, setTheme] = React.useState(() => {
    // Check localStorage for theme
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return 'dark';
  });

  React.useEffect(() => {
    // Set body class for theme
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  return (
    <div>
      <Dashboard />
      {HexagonBackground && <HexagonBackground />}
      <ThemeToggle theme={theme} setTheme={setTheme} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

