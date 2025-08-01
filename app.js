// Minimal, working React + anime.js dashboard with interactive nodes


// Irregular node positions and labels


const nodesData = [
  { label: "A", x: 100, y: 100, staticIcon: "img/icons8-alert.png", gifIcon: "img/icons8-alert.gif" },
  { label: "B", x: 300, y: 60, staticIcon: "img/icons8-connection.png", gifIcon: "img/icons8-connection.gif" },
  { label: "C", x: 500, y: 120, staticIcon: "img/icons8-document.png", gifIcon: "img/icons8-document.gif" },
  { label: "D", x: 420, y: 320, staticIcon: "img/icons8-home.png", gifIcon: "img/icons8-home.gif" },
  { label: "E", x: 200, y: 350, staticIcon: "img/icons8-lock.png", gifIcon: "img/icons8-lock.gif" },
  { label: "F", x: 80, y: 250, staticIcon: "img/icons8-rain-cloud.png", gifIcon: "img/icons8-rain-cloud.gif" },
  { label: "G", x: 320, y: 220, staticIcon: "img/icons8-learning.png", gifIcon: "img/icons8-learning.gif" }
];

// Irregular connections (edges)
const connections = [
  [0,1],[2,3],[3,4],[5,0],[1,6],[6,3]
];


function Dashboard() {
  const cyRef = React.useRef(null);
  const [hoveredNode, setHoveredNode] = React.useState(null);
  const [nodeScreenPositions, setNodeScreenPositions] = React.useState([]);
  const [sparkles, setSparkles] = React.useState([]);
  const sparkleId = React.useRef(0);
  const lastSparkle = React.useRef(0);
  const SPARKLE_THROTTLE = 60;

  React.useEffect(() => {
    if (!window.cytoscape) return;
    // Prepare Cytoscape elements
    const elements = [
      ...nodesData.map((node, idx) => ({
        data: { id: String(idx), label: node.label },
        position: { x: node.x, y: node.y },
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
      userPanningEnabled: true,
      boxSelectionEnabled: false,
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
    // Hover logic
    cy.on('mouseover', 'node', evt => {
      setHoveredNode(evt.target.id());
    });
    cy.on('mouseout', 'node', evt => {
      setHoveredNode(null);
    });
    // Initial pan/zoom fit
    cy.fit();
    // Clean up
    return () => { cy.destroy(); };
  }, []);

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

  return (
    <div>
      <div
        className="dashboard-bg"
        style={{ position: 'relative', width: '100vw', height: '100vh', minHeight: 320 }}
        onMouseMove={handleMouseMove}
      >
        <div ref={cyRef} style={{ width: '100%', height: '100%' }} />
        {/* Overlay animated GIFs on nodes, positioned using cy.project() */}
        {nodeScreenPositions.map(node => {
          const nodeData = nodesData[parseInt(node.id)];
          const isHovered = hoveredNode === node.id;
          const size = isHovered ? 110 : 80;
          // Use window.AnimatedBorder for UMD/Babel
          const AnimatedBorder = window.AnimatedBorder;
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x - size / 2,
                top: node.y - size / 2,
                width: size,
                height: size + (isHovered ? 32 : 0),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
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
                  border: '2px solid #fff',
                  background: 'rgba(255,255,255,0.08)',
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
              boxShadow: `0 0 8px 2px ${sparkle.color}`,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);

