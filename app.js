
// Minimal, working React + anime.js dashboard with interactive nodes


// Irregular node positions and labels
const nodesData = [
  { label: "A", x: 100, y: 100, icon: "🔆" },
  { label: "B", x: 300, y: 60, icon: "☁️" },
  { label: "C", x: 500, y: 120, icon: "💾" },
  { label: "D", x: 420, y: 320, icon: "📊" },
  { label: "E", x: 200, y: 350, icon: "📄" },
  { label: "F", x: 80, y: 250, icon: "🏦" },
  { label: "G", x: 320, y: 220, icon: "🔒" }
];

// Irregular connections (edges)
const connections = [
  [0,1],[2,3],[3,4],[5,0],[1,6],[6,3]
];


function Dashboard() {
  const nodeRefs = React.useRef([]);

  // Animate node scale on hover
  const handleMouseEnter = (idx) => {
    anime({
      targets: nodeRefs.current[idx],
      scale: 1.2,
      duration: 400,
      easing: 'easeOutElastic(1, .8)'
    });
  };
  const handleMouseLeave = (idx) => {
    anime({
      targets: nodeRefs.current[idx],
      scale: 1,
      duration: 400,
      easing: 'easeOutElastic(1, .8)'
    });
  };

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
    <div className="dashboard-bg">
      <svg width="700" height="500" style={{position:'absolute', left:0, top:0, pointerEvents:'none', zIndex:1}}>
        {lines}
      </svg>
      {nodesData.map((node, idx) => (
        <div
          key={idx}
          ref={el => nodeRefs.current[idx] = el}
          className="dashboard-node"
          style={{
            left: node.x,
            top: node.y,
            position: "absolute",
            zIndex:2
          }}
          onMouseEnter={() => handleMouseEnter(idx)}
          onMouseLeave={() => handleMouseLeave(idx)}
        >
          <span style={{fontSize:'2em'}}>{node.icon}</span>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);