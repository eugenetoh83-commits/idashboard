// Animated staggered grid background with ripple effect (UMD, no JSX)

(function() {
  function StaggeredGridBackground(props) {
    const cellSize = 30;
    const [dimensions, setDimensions] = React.useState({
      width: window.innerWidth,
      height: window.innerHeight
    });
    const rows = Math.ceil(dimensions.height / cellSize);
    const cols = Math.ceil(dimensions.width / cellSize);
    const bgColor = props.bgColor || '#181a20';
    const dotColor = '#145050';
    const burstColor = '#252121ff';
    const canvasRef = React.useRef(null);
    const gridRef = React.useRef([]);
    const animStateRef = React.useRef([]); // {size, alpha} for each dot
    const burstRef = React.useRef(null); // {x, y, active, progress}

    // Build grid and handle resize
    React.useEffect(function() {
      function buildGrid() {
        gridRef.current = [];
        animStateRef.current = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            gridRef.current.push({ r, c });
            animStateRef.current.push({ size: cellSize/3, alpha: 1 });
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
    }, [rows, cols]);

    // Draw function
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width = dimensions.width;
      let height = dimensions.height;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      let gridW = cols * cellSize;
      let gridH = rows * cellSize;
      let offsetX = (width - gridW) / 2;
      let offsetY = (height - gridH) / 2;
      // Draw dots
      gridRef.current.forEach(function(cell, idx) {
        let x = offsetX + cell.c * cellSize + cellSize/2;
        let y = offsetY + cell.r * cellSize + cellSize/2;
        let { size, alpha } = animStateRef.current[idx] || { size: cellSize/3, alpha: 1 };
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = dotColor;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = dotColor;
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
          ctx.strokeStyle = burstColor;
          ctx.lineWidth = 3 * (1 - progress);
          ctx.globalAlpha = 1 - progress;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Ripple effect
    function triggerRipple(x, y) {
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
        return Math.sqrt((cx - x) * (cx - x) + (cy - y) * (cy - y));
      });
      const maxDist = Math.max(...dists);
      // Animation parameters
      const expandSize = cellSize/3 + cellSize/2;
      const normalSize = cellSize/3;
      const expandAlpha = 1.2;
      const normalAlpha = 1;
      const expandDuration = 20;
      const contractDuration = 1250;
      const frameRate = 1000/60;
      // Store animation state
      let startTime = performance.now();
      function animateFrame() {
        let now = performance.now();
        let allDone = true;
        dists.forEach((dist, idx) => {
          const delay = (dist / maxDist) * 400;
          let t = now - startTime - delay;
          if (t < 0) {
            animStateRef.current[idx].size = normalSize;
            animStateRef.current[idx].alpha = normalAlpha;
            allDone = false;
            return;
          }
          if (t < expandDuration) {
            // Expanding
            let p = t / expandDuration;
            animStateRef.current[idx].size = normalSize + (expandSize - normalSize) * p;
            animStateRef.current[idx].alpha = normalAlpha + (expandAlpha - normalAlpha) * p;
            allDone = false;
          } else if (t < expandDuration + contractDuration) {
            // Contracting
            let p = (t - expandDuration) / contractDuration;
            animStateRef.current[idx].size = expandSize + (normalSize - expandSize) * p;
            animStateRef.current[idx].alpha = expandAlpha + (normalAlpha - expandAlpha) * p;
            allDone = false;
          } else {
            animStateRef.current[idx].size = normalSize;
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
        const { x, y } = getXY(e);
        triggerRipple(x, y);
      }
      canvas.addEventListener('mousedown', handlePointer);
      canvas.addEventListener('touchstart', handlePointer, { passive: true });
      return () => {
        canvas.removeEventListener('mousedown', handlePointer);
        canvas.removeEventListener('touchstart', handlePointer);
      };
    }, []);

    // Responsive canvas style
    return React.createElement('canvas', {
      ref: canvasRef,
      style: {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'auto',
        background: bgColor,
        touchAction: 'none',
        cursor: 'pointer'
      },
      title: 'Click or tap to ripple the grid'
    });
  }
  window.StaggeredGridBackground = StaggeredGridBackground;
})();
