// Animated border component using anime.js, no JSX
window.AnimatedBorder = function AnimatedBorder(props) {
  const { isHovered, size } = props;
  const borderRef = React.useRef();
  
  // Get theme-responsive border colors
  const getBorderColors = () => {
    const isLightTheme = document.body.classList.contains('light-theme');
    if (isLightTheme) {
      return {
        primary: '#1a73e8', // Google Blue
        secondary: '#4285f4', // Lighter blue
        accent: '#34a853' // Google Green accent
      };
    } else {
      return {
        primary: '#00b4d8', // Cyan blue (original)
        secondary: '#00ffe7', // Bright cyan
        accent: '#dff0fe' // Light blue accent (original)
      };
    }
  };
  
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
  
  // Get current theme colors
  const colors = getBorderColors();
  
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
        ? `conic-gradient(from var(--border-rotate, 0deg), ${colors.primary} 0deg, ${colors.secondary} 120deg, ${colors.accent} 240deg, ${colors.primary} 360deg)`
        : 'none',
      /*border: isHovered ? '4px solid transparent' : '2px solid #fff',*/
      transition: 'border 1.5s, background 0.3s',
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
