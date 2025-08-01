// Animated border component using anime.js, no JSX
window.AnimatedBorder = function AnimatedBorder(props) {
  const { isHovered, size } = props;
  const borderRef = React.useRef();
  React.useEffect(() => {
    let anim;
    if (isHovered && borderRef.current && window.anime) {
      // Animate a CSS variable for rotation
      borderRef.current.style.setProperty('--border-rotate', '0deg');
      anim = window.anime({
        targets: borderRef.current,
        update: function(anim) {
          if (borderRef.current) {
            const deg = (anim.progress * 3.6) % 360;
            borderRef.current.style.setProperty('--border-rotate', deg + 'deg');
          }
        },
        duration: 1200,
        easing: 'linear',
        loop: true,
      });
    } else if (borderRef.current) {
      borderRef.current.style.setProperty('--border-rotate', '0deg');
    }
    return () => anim && anim.pause && anim.pause();
  }, [isHovered]);
  // Use a conic-gradient border effect
  return React.createElement('div', {
    ref: borderRef,
    style: {
      position: 'absolute',
      left: -5,
      top: -5,
      width: size + 10,
      height: size + 10,
      borderRadius: '50%',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      zIndex: 4,
      willChange: 'background',
      background: isHovered
        ? 'conic-gradient(from var(--border-rotate, 0deg), #00b4d8 0deg, #4a00e0 90deg, #1a1a2e 180deg, #16213e 270deg, #232946 360deg)'
        : 'none',
      /*border: isHovered ? '4px solid transparent' : '2px solid #fff',*/
      transition: 'border 1.5s',
      // Mask out the center to create a ring effect
      WebkitMaskImage: isHovered
        ? 'radial-gradient(circle, transparent 60%, black 61%)'
        : 'none',
      maskImage: isHovered
        ? 'radial-gradient(circle, transparent 60%, black 61%)'
        : 'none',
    }
  });
};
