// React + anime.js dashboard with interactive nodes
// Nodes are equally spaced on a circle, fixed order, no randomization
const baseNodes = [
  { label: "NETWORK", staticIcon: "img/cloud-network-whitebg.png", gifIcon: "img/cloud-network.gif" },
  { label: "KEY", staticIcon: "img/encryption-whitebg.png", gifIcon: "img/encryption.gif" },
  { label: "STATUS", staticIcon: "img/heartbeat-whitebg.png", gifIcon: "img/heartbeat.gif" },
  { label: "HOME", staticIcon: "img/home-whitebg.png", gifIcon: "img/home.gif" },
  { label: "SYSTEM", staticIcon: "img/line-chart-whitebg.png", gifIcon: "img/line-chart.gif" },
  { label: "SETTINGS", staticIcon: "img/settings-whitebg.png", gifIcon: "img/settings.gif" },
  { label: "SHARE", staticIcon: "img/share-whitebg.png", gifIcon: "img/share.gif" }
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

function Dashboard({ backgroundType, onSystemClick, onStatusClick }) {
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
            'width': 1,
            'line-color': 'transparent',
            'opacity': 0,
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


  // Animated traversing line overlay
  const svgRef = React.useRef(null);
  const [traverseT, setTraverseT] = React.useState(0);

  // Animate traversing line
  React.useEffect(() => {
    let frame;
    let t = 0;
    function animate() {
      t += 0.008; // speed
      if (t > 1) t = 0;
      setTraverseT(t);
      frame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  // Single animated indicator line with branching logic
  // Graph: 0:A, 1:B, 2:C, 3:D, 4:E, 5:F, 6:G
  // Edges: 0->1 (A->B), 0->5 (A->F), 1->6 (B->G), 2->3 (C->D), 3->4 (D->E), 6->3 (G->D)
  // At each branch, randomly choose next path as per user rules
  const labelToId = {A:0,B:1,C:2,D:3,E:4,F:5,G:6};
  const idToLabel = ['A','B','C','D','E','F','G'];
  // Adjacency list for directed edges
  const adj = {
    0: [1,5], // A: B or F
    1: [6],   // B: G
    2: [],   // C: End
    3: [2,4],   // D: E (but also can go to C or E from D via G)
    4: [],    // E: end
    5: [],    // F: end
    6: [3],   // G: D
  };
  // Endpoints: F(5), C(2), E(4)
  const ENDPOINTS = [5,2,4];

  // State for the current path (array of node ids)
  const [indicatorPath, setIndicatorPath] = React.useState([0]);
  // State for progress along the current path (0=start, 1=end)
  const [indicatorT, setIndicatorT] = React.useState(0);

  // Helper to get node screen position by id
  function posById(id) {
    const n = nodeScreenPositions.find(n => n.id === String(id));
    return n ? [n.x, n.y] : null;
  }

  // On mount or when node positions change, reset path to start at A
  React.useEffect(() => {
    setIndicatorPath([0]);
    setIndicatorT(0);
  }, [nodeScreenPositions.length]);

  // Animation loop for indicator line
  React.useEffect(() => {
    let frame;
    let t = indicatorT;
    function animate() {
      // If path is too short, wait for node positions
      if (indicatorPath.length < 2) {
        // Pick next node from current
        const current = indicatorPath[indicatorPath.length-1];
        const nexts = adj[current] || [];
        if (nexts.length === 0) {
          // At endpoint, restart at A
          setIndicatorPath([0]);
          setIndicatorT(0);
          t = 0;
        } else {
          // Pick randomly if multiple
          const next = nexts.length === 1 ? nexts[0] : nexts[Math.floor(Math.random()*nexts.length)];
          setIndicatorPath([...indicatorPath, next]);
        }
        frame = requestAnimationFrame(animate);
        return;
      }
      t += 0.05; // speed
      if (t >= 1) {
        // Arrived at next node, advance path
        const current = indicatorPath[indicatorPath.length-1];
        if (ENDPOINTS.includes(current)) {
          // At endpoint, restart
          setIndicatorPath([0]);
          setIndicatorT(0);
          t = 0;
        } else {
          // Continue to next
          const nexts = adj[current] || [];
          if (nexts.length === 0) {
            setIndicatorPath([0]);
            setIndicatorT(0);
            t = 0;
          } else {
            const next = nexts.length === 1 ? nexts[0] : nexts[Math.floor(Math.random()*nexts.length)];
            setIndicatorPath([...indicatorPath.slice(-1), next]);
            setIndicatorT(0);
            t = 0;
          }
        }
      } else {
        setIndicatorT(t);
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [indicatorPath, indicatorT, nodeScreenPositions.length]);

  // Get the current segment (from last node to next)
  let indicatorSegment = [];
  if (indicatorPath.length >= 2) {
    const from = posById(indicatorPath[indicatorPath.length-2]);
    const to = posById(indicatorPath[indicatorPath.length-1]);
    if (from && to) indicatorSegment = [from, to];
  }

  // Helper to interpolate along the segment
  function getIndicatorPathD(segment, t) {
    if (segment.length < 2) return '';
    const [x1, y1] = segment[0];
    const [x2, y2] = segment[1];
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    return `M${x1},${y1} L${x},${y}`;
  }

  const traverseColor = document.body.classList.contains('light-theme') ? '#43c3d4ff' : '#f15bb5';
  const staticEdgeColor = document.body.classList.contains('light-theme') ? '#333333' : '#cccccc'; // Dark grey for light theme, light grey for dark theme


  return (
    <div>
      <div
        className="dashboard-bg"
        style={{ position: 'relative', width: '100vw', height: '100vh', minHeight: 320 }}
        onMouseMove={handleMouseMove}
      >
        {/* Animated traversing line overlay */}
        <svg
          ref={svgRef}
          width={viewport.width}
          height={viewport.height}
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
        >
          {/* Static edges (thin) */}
          {connections.map(([from, to], i) => {
            const n1 = nodeScreenPositions.find(n => n.id === String(from));
            const n2 = nodeScreenPositions.find(n => n.id === String(to));
            if (!n1 || !n2) return null;
            return (
              <line
                key={i}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke={staticEdgeColor}
                strokeWidth="8"
                opacity="0.8"
              />
            );
          })}
          {/* Single animated indicator line (data flow) */}
          {indicatorSegment.length === 2 && (
            <path
              d={getIndicatorPathD(indicatorSegment, indicatorT)}
              fill="none"
              stroke={traverseColor}
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              style={{ filter: `drop-shadow(0 0 16px ${traverseColor})` }}
            />
          )}
        </svg>
        <div 
          ref={cyRef} 
          style={{ width: '100%', height: '100%', pointerEvents: backgroundType === 'grid' ? 'none' : 'auto' }}
          onMouseDown={(e) => {
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleCanvasClick) {
              console.log('[CYTOSCAPE] Calling hexagon background click handler directly');
              window.HexagonBackgroundHandlers.handleCanvasClick(e);
            }
            // Skip grid handling entirely to prevent conflicts
          }}
          onClick={(e) => {
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleCanvasClick) {
              console.log('[CYTOSCAPE] Calling hexagon background click handler directly');
              window.HexagonBackgroundHandlers.handleCanvasClick(e);
            }
            // Skip grid handling entirely to prevent conflicts
          }}
          onTouchStart={(e) => {
            console.log('[CYTOSCAPE] Touch start event intercepted:', e.type, e.touches.length);
            // Call appropriate background handlers based on current background type
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleTouchStart) {
              console.log('[CYTOSCAPE] Calling hexagon background touch handler directly');
              window.HexagonBackgroundHandlers.handleTouchStart(e);
            } else if (backgroundType === 'grid' && window.StaggeredGridBackgroundHandlers && window.StaggeredGridBackgroundHandlers.handleTouchStart) {
              console.log('[CYTOSCAPE] Calling grid background touch handler directly');
              window.StaggeredGridBackgroundHandlers.handleTouchStart(e);
            } else {
              console.log('[CYTOSCAPE] Background handlers not available yet');
            }
          }}
          onTouchEnd={(e) => {
            console.log('[CYTOSCAPE] Touch end event intercepted:', e.type);
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleTouchEnd) {
              window.HexagonBackgroundHandlers.handleTouchEnd(e);
            }
          }}
          onTouchMove={(e) => {
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleTouchMove) {
              window.HexagonBackgroundHandlers.handleTouchMove(e);
            }
          }}
          onMouseMove={(e) => {
            // Only call occasionally to avoid spam
            if (Math.random() < 0.005 && backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleMouseMove) {
              window.HexagonBackgroundHandlers.handleMouseMove(e);
            }
          }}
          onMouseEnter={(e) => {
            console.log('[CYTOSCAPE] Mouse enter event intercepted:', e.type);
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleMouseEnter) {
              window.HexagonBackgroundHandlers.handleMouseEnter(e);
            }
          }}
          onMouseLeave={(e) => {
            console.log('[CYTOSCAPE] Mouse leave event intercepted:', e.type);
            if (backgroundType === 'hexagon' && window.HexagonBackgroundHandlers && window.HexagonBackgroundHandlers.handleMouseLeave) {
              window.HexagonBackgroundHandlers.handleMouseLeave(e);
            }
          }}
        />
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
              onClick={() => {
                // Handle SYSTEM node click - toggle InfoDialog
                if (node.label === 'SYSTEM') {
                  onSystemClick();
                }
                // Handle STATUS node click - toggle ChatbotDialog
                if (node.label === 'STATUS') {
                  onStatusClick();
                }
              }}
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
                cursor: (node.label === 'SYSTEM' || node.label === 'STATUS') ? 'pointer' : 'default',
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
                    color: document.body.classList.contains('light-theme') ? 'black' : 'white',
                    fontSize: 22,
                    fontFamily: 'Roboto Condensed, sans-serif',
                    textShadow: document.body.classList.contains('light-theme') 
                      ? '0 0 8px rgba(255,255,255,0.8), 0 0 2px #1a73e8' 
                      : '0 0 8px #222, 0 0 2px #00ffe7',
                    letterSpacing: 2,
                    fontWeight: 700,
                    background: document.body.classList.contains('light-theme') 
                      ? 'rgba(255,255,255,0.9)' 
                      : 'rgba(0,0,0,0.5)',
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
const StaggeredGridBackground = window.StaggeredGridBackground;

function BackgroundToggle({ backgroundType, setBackgroundType, theme }) {
  return (
    <div style={{
      position: 'fixed',
      right: 24,
      bottom: 80, // Position above theme toggle
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
        const next = backgroundType === 'hexagon' ? 'grid' : 'hexagon';
        setBackgroundType(next);
        localStorage.setItem('backgroundType', next);
      }}
      title={backgroundType === 'hexagon' ? 'Switch to grid background' : 'Switch to hexagon background'}
    >
      {backgroundType === 'hexagon' ? '⬡ Hexagon' : '⊞ Grid'}
    </div>
  );
}

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
        console.log('[THEME TOGGLE] Changing theme from', theme, 'to', next);
        setTheme(next);
        localStorage.setItem('theme', next);
        console.log('[THEME TOGGLE] localStorage set to:', next);
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

  const [backgroundType, setBackgroundType] = React.useState(() => {
    // Check localStorage for background type
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('backgroundType');
      if (stored === 'hexagon' || stored === 'grid') return stored;
    }
    return 'hexagon'; // Default to hexagon background
  });

  // Add InfoDialog state
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false);
  
  // Add ChatbotDialog state
  const [isChatbotDialogOpen, setIsChatbotDialogOpen] = React.useState(false);

  React.useEffect(() => {
    // Set body class for theme
    console.log('[APP] Setting body classes for theme:', theme);
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  // Render the appropriate background component
  const renderBackground = () => {
    if (backgroundType === 'hexagon' && HexagonBackground) {
      return React.createElement(HexagonBackground);
    } else if (backgroundType === 'grid' && StaggeredGridBackground) {
      return React.createElement(StaggeredGridBackground);
    }
    return null;
  };

  return (
    <div>
      <Dashboard 
        backgroundType={backgroundType} 
        onSystemClick={() => {
          // Close chatbot dialog if open, then toggle info dialog
          if (isChatbotDialogOpen) {
            setIsChatbotDialogOpen(false);
            setTimeout(() => setIsInfoDialogOpen(!isInfoDialogOpen), 400);
          } else {
            setIsInfoDialogOpen(!isInfoDialogOpen);
          }
        }}
        onStatusClick={() => {
          // Close info dialog if open, then toggle chatbot dialog
          if (isInfoDialogOpen) {
            setIsInfoDialogOpen(false);
            setTimeout(() => setIsChatbotDialogOpen(!isChatbotDialogOpen), 400);
          } else {
            setIsChatbotDialogOpen(!isChatbotDialogOpen);
          }
        }}
      />
      {renderBackground()}
      <BackgroundToggle 
        backgroundType={backgroundType} 
        setBackgroundType={setBackgroundType} 
        theme={theme} 
      />
      <ThemeToggle theme={theme} setTheme={setTheme} />
      {window.InfoDialog && React.createElement(window.InfoDialog, {
        isOpen: isInfoDialogOpen,
        onClose: () => setIsInfoDialogOpen(false),
        theme: theme
      })}
      {window.ChatbotDialog && React.createElement(window.ChatbotDialog, {
        isOpen: isChatbotDialogOpen,
        onClose: () => setIsChatbotDialogOpen(false),
        theme: theme
      })}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

