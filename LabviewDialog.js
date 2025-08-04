// LabviewDialog.js
// Sliding lab view panel with 3D lab visualization

(function() {
  function LabviewDialog({ isOpen, onClose, theme }) {
    const mountRef = React.useRef(null);
    const sceneRef = React.useRef(null);
    const rendererRef = React.useRef(null);
    const cameraRef = React.useRef(null);
    const animationRef = React.useRef(null);
    const mouseRef = React.useRef({ x: 0, y: 0, isDown: false, button: 0 });
    const cameraStateRef = React.useRef({ 
      radius: 10, 
      theta: Math.PI / 4, 
      phi: Math.PI / 4,
      target: { x: 0, y: 0, z: 0 }
    });

    // Camera control functions
    const updateCameraPosition = () => {
      const camera = cameraRef.current;
      const state = cameraStateRef.current;
      if (!camera) return;

      const x = state.target.x + state.radius * Math.sin(state.phi) * Math.cos(state.theta);
      const y = state.target.y + state.radius * Math.cos(state.phi);
      const z = state.target.z + state.radius * Math.sin(state.phi) * Math.sin(state.theta);

      camera.position.set(x, y, z);
      camera.lookAt(state.target.x, state.target.y, state.target.z);
    };

    const setupMouseControls = (canvas) => {
      const handleMouseDown = (event) => {
        mouseRef.current.isDown = true;
        mouseRef.current.button = event.button;
        mouseRef.current.x = event.clientX;
        mouseRef.current.y = event.clientY;
        event.preventDefault();
      };

      const handleMouseMove = (event) => {
        if (!mouseRef.current.isDown) return;

        const deltaX = event.clientX - mouseRef.current.x;
        const deltaY = event.clientY - mouseRef.current.y;
        const state = cameraStateRef.current;

        if (mouseRef.current.button === 0) { // Left click - rotate
          state.theta += deltaX * 0.01;
          state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi + deltaY * 0.01));
        } else if (mouseRef.current.button === 2) { // Right click - pan
          const camera = cameraRef.current;
          const right = new THREE.Vector3();
          const up = new THREE.Vector3();
          
          camera.getWorldDirection(new THREE.Vector3());
          right.setFromMatrixColumn(camera.matrix, 0);
          up.setFromMatrixColumn(camera.matrix, 1);
          
          right.multiplyScalar(-deltaX * 0.01);
          up.multiplyScalar(deltaY * 0.01);
          
          state.target.x += right.x + up.x;
          state.target.y += right.y + up.y;
          state.target.z += right.z + up.z;
        }

        updateCameraPosition();
        mouseRef.current.x = event.clientX;
        mouseRef.current.y = event.clientY;
      };

      const handleMouseUp = () => {
        mouseRef.current.isDown = false;
      };

      const handleWheel = (event) => {
        const state = cameraStateRef.current;
        state.radius += event.deltaY * 0.01;
        state.radius = Math.max(2, Math.min(20, state.radius));
        updateCameraPosition();
        event.preventDefault();
      };

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
      };
    };

    // Model loading functions
    const loadModelsFromConfig = async (scene) => {
      try {
        console.log('🔍 Loading models configuration...');
        const response = await fetch('models.json');
        const modelsConfig = await response.json();
        console.log('📋 Models config loaded:', modelsConfig);
        
        for (const modelConfig of modelsConfig) {
          await loadModel(scene, modelConfig);
        }
      } catch (error) {
        console.error('❌ Error loading models config:', error);
        // Create fallback geometry if models fail to load
        createFallbackGeometry(scene);
      }
    };

    const loadModel = async (scene, config) => {
      return new Promise((resolve, reject) => {
        console.log(`🔄 Loading model: ${config.path}`);
        
        // Enhanced GLTFLoader availability check
        console.log('🔍 Checking Three.js components:');
        console.log('  - THREE available:', !!window.THREE);
        console.log('  - THREE.GLTFLoader available:', !!(window.THREE && window.THREE.GLTFLoader));
        console.log('  - Available THREE components:', window.THREE ? Object.keys(window.THREE).filter(k => k.includes('Loader')) : 'None');
        
        if (!window.THREE) {
          console.error('❌ Three.js not loaded');
          createFallbackGeometry(scene);
          resolve();
          return;
        }
        
        if (!window.THREE.GLTFLoader) {
          console.error('❌ GLTFLoader not available in Three.js');
          console.log('💡 Trying to create GLTFLoader manually...');
          createFallbackGeometry(scene);
          resolve();
          return;
        }

        const loader = new THREE.GLTFLoader();
        
        loader.load(
          config.path,
          (gltf) => {
            console.log('✅ Model loaded successfully:', gltf);
            const model = gltf.scene;
            
            // Apply configuration
            model.position.set(...config.position);
            model.scale.set(...config.scale);
            model.rotation.set(...config.rotation);
            
            // Enhanced debugging - show model structure
            console.log('📦 Model Structure Analysis:');
            console.log('📐 Total children:', model.children.length);
            
            let meshCount = 0;
            let materialCount = 0;
            const materialNames = new Set();
            const meshNames = [];
            
            // Enable shadows and collect debug info
            model.traverse((child) => {
              if (child.isMesh) {
                meshCount++;
                child.castShadow = true;
                child.receiveShadow = true;
                
                const meshName = child.name || `Mesh_${meshCount}`;
                const materialName = child.material?.name || 'unnamed_material';
                const vertexCount = child.geometry?.attributes?.position?.count || 0;
                
                meshNames.push(meshName);
                materialNames.add(materialName);
                
                console.log(`  🏗️ Mesh: "${meshName}" - Material: "${materialName}" - Vertices: ${vertexCount}`);
                
                // Check for door/window keywords
                const name = meshName.toLowerCase();
                if (name.includes('door') || name.includes('window') || name.includes('frame') || name.includes('glass')) {
                  console.log(`    🚪 Found architectural element: ${meshName}`);
                }
              }
            });
            
            console.log(`📊 Summary: ${meshCount} meshes, ${materialNames.size} unique materials`);
            console.log('🎨 Materials:', Array.from(materialNames));
            console.log('🏗️ Mesh names:', meshNames);
            
            scene.add(model);
            console.log('🎯 Model added to scene');
            resolve(model);
          },
          (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            console.log(`📈 Loading progress: ${percent}%`);
          },
          (error) => {
            console.error('❌ Error loading model:', error);
            console.log('🔧 Creating fallback geometry instead');
            createFallbackGeometry(scene);
            resolve();
          }
        );
      });
    };

    const createFallbackGeometry = (scene) => {
      console.log('🏗️ Creating fallback room geometry');
      
      // Simple room
      const roomSize = 8;
      const wallHeight = 4;
      
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
      const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: theme === 'light' ? 0xf5f5f5 : 0x303030 
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      
      // Walls
      const wallMaterial = new THREE.MeshLambertMaterial({ 
        color: theme === 'light' ? 0xe0e0e0 : 0x404040 
      });
      
      // Back wall
      const backWallGeometry = new THREE.PlaneGeometry(roomSize, wallHeight);
      const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
      backWall.position.set(0, wallHeight / 2, -roomSize / 2);
      scene.add(backWall);
      
      console.log('✅ Fallback geometry created');
    };

    // Initialize Three.js scene
    React.useEffect(() => {
      if (!isOpen || !mountRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(theme === 'light' ? 0xf0f0f0 : 0x222222);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      cameraRef.current = camera;
      updateCameraPosition();

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(theme === 'light' ? 0xf0f0f0 : 0x222222);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add mouse controls
      const cleanupMouseControls = setupMouseControls(renderer.domElement);

      // Load 3D models from configuration
      loadModelsFromConfig(scene);

      // Setup lighting
      setupLighting(scene);

      // Animation loop
      const animate = () => {
        renderer.render(scene, camera);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        if (!mountRef.current) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (cleanupMouseControls) {
          cleanupMouseControls();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        if (renderer) {
          renderer.dispose();
        }
      };
    }, [isOpen, theme]);

    // Create lab room function


    // Setup lighting
    const setupLighting = (scene) => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      // Main directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -10;
      directionalLight.shadow.camera.right = 10;
      directionalLight.shadow.camera.top = 10;
      directionalLight.shadow.camera.bottom = -10;
      scene.add(directionalLight);

      // Point light for better illumination
      const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
      pointLight.position.set(0, 3, 0);
      pointLight.castShadow = true;
      scene.add(pointLight);
    };

    const dialogStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '80vw',
      maxWidth: '1200px',
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#1a1a2e',
      color: theme === 'light' ? '#333' : '#fff',
      boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
      overflowY: 'hidden',
      fontFamily: 'Roboto Condensed, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    };

    const headerStyle = {
      padding: '20px',
      borderBottom: `2px solid ${theme === 'light' ? '#e0e0e0' : '#333'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: theme === 'light' ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)' : 'linear-gradient(135deg, #2d3748, #1a1a2e)',
      flexShrink: 0
    };

    const viewerStyle = {
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    };

    const controlsInfoStyle = {
      position: 'absolute',
      top: '10px',
      right: '10px',
      padding: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10
    };

    return React.createElement('div', { 
      style: dialogStyle
    }, [
      // Header
      React.createElement('div', {
        key: 'header',
        style: headerStyle
      }, [
        React.createElement('h2', {
          key: 'title',
          style: {
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: theme === 'light' ? '#333' : '#fff'
          }
        }, '🔬 Lab View - 3D Environment'),
        React.createElement('button', {
          key: 'close',
          onClick: onClose,
          style: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'light' ? '#333' : '#fff',
            padding: '5px 10px',
            borderRadius: '50%',
            transition: 'background-color 0.3s'
          },
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = 'transparent';
          }
        }, '✕')
      ]),

      // 3D Viewer
      React.createElement('div', {
        key: 'viewer',
        style: viewerStyle
      }, [
        React.createElement('div', {
          key: 'controls-info',
          style: controlsInfoStyle
        }, [
          React.createElement('div', { key: 'line1' }, '🖱️ Left click + drag: Rotate'),
          React.createElement('div', { key: 'line2' }, '🖱️ Right click + drag: Pan'),
          React.createElement('div', { key: 'line3' }, '🖱️ Scroll: Zoom in/out')
        ]),
        React.createElement('div', {
          key: 'threejs-mount',
          ref: mountRef,
          style: {
            width: '100%',
            height: '100%'
          }
        })
      ])
    ]);
  }

  window.LabviewDialog = LabviewDialog;
})();
