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
  const nodeRefs = React.useRef([]);
  const [hovered, setHovered] = React.useState(Array(nodesData.length).fill(false));
  const [activeIdx, setActiveIdx] = React.useState(null);
  const [sparkles, setSparkles] = React.useState([]);
  const sparkleId = React.useRef(0);

  // Animate node scale on hover
  const handleMouseEnter = (idx) => {
    setHovered(h => h.map((v, i) => i === idx ? true : v));
    setActiveIdx(idx);
    anime({
      targets: nodeRefs.current[idx],
      scale: 1.2,
      duration: 400,
      easing: 'easeOutElastic(1, .8)'
    });
  };
  const handleMouseLeave = (idx) => {
    setHovered(h => h.map((v, i) => i === idx ? false : v));
    setActiveIdx(null);
    anime({
      targets: nodeRefs.current[idx],
      scale: 1,
      duration: 400,
      easing: 'easeOutElastic(1, .8)'
    });
  };


  // Sparkle effect on mouse move (throttled and with random offset)
  const lastSparkle = React.useRef(0);
  const SPARKLE_THROTTLE = 60; // ms between sparkles
  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastSparkle.current < SPARKLE_THROTTLE) return;
    lastSparkle.current = now;
    const dashboard = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - dashboard.left + (Math.random() - 0.5) * 128;
    const y = e.clientY - dashboard.top + (Math.random() - 0.5) * 128;
    const id = sparkleId.current++;
    const color = ["#fffbe6", "#ffe066", "#ffd700", "#fff"];
    const size = 5 + Math.random() * 15; // random size between 10 and 28px
    setSparkles(sparkles => [
      ...sparkles,
      { id, x, y, color: color[Math.floor(Math.random()*color.length)], size }
    ]);
    setTimeout(() => {
      setSparkles(sparkles => sparkles.filter(s => s.id !== id));
    }, 700);
  };

  React.useEffect(() => {
    // Animate sparkles
    sparkles.forEach(sparkle => {
      anime({
        targets: `#sparkle-${sparkle.id}`,
        scale: [0.7, 1.4],
        opacity: [1, 0],
        rotate: [0, 90 + Math.random()*180],
        duration: 700,
        easing: 'easeOutCubic'
      });
    });
  }, [sparkles]);

  // Calculate SVG lines between node borders
  const r = 40; // node radius
  function getBorderPoint(x1, y1, x2, y2, r) {
    // Returns the point on the border of the circle at (x1, y1) towards (x2, y2)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return {x: x1, y: y1};
    return {
      x: x1 + (dx * r) / len,
      y: y1 + (dy * r) / len
    };
  }

  const lines = connections.map(([fromIdx, toIdx], i) => {
    const from = nodesData[fromIdx];
    const to = nodesData[toIdx];
    // Center points
    const fromCenter = { x: from.x + r, y: from.y + r };
    const toCenter = { x: to.x + r, y: to.y + r };
    // Border points
    const fromBorder = getBorderPoint(fromCenter.x, fromCenter.y, toCenter.x, toCenter.y, r);
    const toBorder = getBorderPoint(toCenter.x, toCenter.y, fromCenter.x, fromCenter.y, r);
    return (
      <line
        key={i}
        x1={fromBorder.x}
        y1={fromBorder.y}
        x2={toBorder.x}
        y2={toBorder.y}
        stroke="#fff"
        strokeWidth="2"
        opacity="0.5"
      />
    );
  });

  return (
    <div>
      <div
        className="dashboard-bg"
        style={{ position: 'relative', width: 700, height: 500, margin: '0 auto' }}
        onMouseMove={handleMouseMove}
      >
        <svg width="700" height="500" style={{position:'absolute', left:0, top:0, pointerEvents:'none', zIndex:1}}>
          {lines}
        </svg>
        {nodesData.map((node, idx) => (
          <div
            key={idx}
            ref={el => nodeRefs.current[idx] = el}
            className="dashboard-node"
            style={{ left: node.x, top: node.y }}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={() => handleMouseLeave(idx)}
          >
            <img
              src={hovered[idx] ? node.gifIcon : node.staticIcon}
              alt={node.label}
              className="dashboard-node-img"
            />
            {hovered[idx] && (
              <div className="dashboard-node-hover-text">
                {`Placeholder for node ${node.label}`}
              </div>
            )}
          </div>
        ))}
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            id={`sparkle-${sparkle.id}`}
            className="dashboard-sparkle"
            style={{
              left: sparkle.x - sparkle.size / 2,
              top: sparkle.y - sparkle.size / 2,
              width: sparkle.size,
              height: sparkle.size,
              background: sparkle.color,
              boxShadow: `0 0 8px 2px ${sparkle.color}`,
            }}
          />
        ))}
      </div>
      {/* Removed bottom placeholder text */}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);

