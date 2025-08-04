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

    // Smart model loading - try lab.glb first, then fallback to procedural generation
    const loadModelsFromConfig = async (scene) => {
      try {
        console.log('🔍 Checking for lab.glb file...');
        
        // First try to load lab.glb
        const labModelExists = await checkIfLabModelExists();
        
        if (labModelExists) {
          console.log('✅ Found lab.glb - loading 3D model');
          await loadLabModel(scene);
        } else {
          console.log('📋 No lab.glb found - generating procedural room from JSON config');
          await generateProceduralRoom(scene);
        }
      } catch (error) {
        console.error('❌ Error in model loading system:', error);
        // Ultimate fallback - simple room
        createBasicRoom(scene);
      }
    };

    // Check if lab.glb exists
    const checkIfLabModelExists = async () => {
      try {
        const labPath = 'https://raw.githubusercontent.com/eugenetoh83-commits/idashboard/main/model/lab.glb';
        const response = await fetch(labPath, { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        console.log('🔍 lab.glb not found, will use procedural generation');
        return false;
      }
    };

    // Load the lab.glb model
    const loadLabModel = async (scene) => {
      const config = {
        path: 'https://raw.githubusercontent.com/eugenetoh83-commits/idashboard/main/model/lab.glb',
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0]
      };
      return await loadModel(scene, config);
    };

    // Generate procedural room based on room-config.json
    const generateProceduralRoom = async (scene) => {
      try {
        console.log('📐 Loading room configuration...');
        const response = await fetch('room-config.json');
        const roomConfig = await response.json();
        console.log('🏗️ Room config loaded:', roomConfig);
        
        // Create the room structure
        createProceduralRoom(scene, roomConfig);
        
        // Add objects from config
        addObjectsFromConfig(scene, roomConfig.objects || []);
        
      } catch (error) {
        console.error('❌ Error loading room config:', error);
        console.log('🔧 Using default room configuration');
        
        // Default room config if JSON fails
        const defaultConfig = {
          room: {
            width: 8,
            height: 4,
            depth: 8,
            wallColor: 0xe0e0e0,
            floorColor: 0xf5f5f5,
            ceilingColor: 0xe0e0e0
          },
          objects: [
            {
              type: "monitor",
              position: [0, 1, -2],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              properties: { screenColor: 0x001133 }
            }
          ]
        };
        
        createProceduralRoom(scene, defaultConfig);
        addObjectsFromConfig(scene, defaultConfig.objects);
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

                // Enhance material brightness
                if (child.material) {
                  // Make materials brighter and more reflective
                  if (child.material.color) {
                    // Brighten the base color
                    child.material.color.multiplyScalar(1.5);
                  }
                  
                  // Increase emissive for self-illumination
                  if (child.material.emissive) {
                    child.material.emissive.setScalar(0.1);
                  }
                  
                  // Adjust roughness for better reflection
                  if (child.material.roughness !== undefined) {
                    child.material.roughness = Math.max(0.2, child.material.roughness * 0.7);
                  }
                  
                  console.log(`    🎨 Enhanced brightness for material: ${materialName}`);
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

    // Helper function to parse color values from JSON
    const parseColor = (colorValue, defaultColor = 0x888888) => {
      if (typeof colorValue === 'string') {
        // Remove quotes and convert hex string to number
        const cleanColor = colorValue.replace(/['"]/g, '');
        if (cleanColor.startsWith('0x')) {
          return parseInt(cleanColor, 16);
        } else if (cleanColor.startsWith('#')) {
          return parseInt(cleanColor.substring(1), 16);
        } else {
          // Try parsing as regular hex
          return parseInt(cleanColor, 16);
        }
      } else if (typeof colorValue === 'number') {
        return colorValue;
      }
      return defaultColor;
    };

    // Advanced material creation with texture support
    const createMaterial = (materialConfig = {}) => {
      const color = parseColor(materialConfig.color, 0x888888);
      const materialType = materialConfig.type || 'lambert';
      
      let material;
      
      switch (materialType.toLowerCase()) {
        case 'phong':
          material = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: materialConfig.shininess || 30,
            specular: parseColor(materialConfig.specular, 0x111111)
          });
          break;
        case 'standard':
          material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: materialConfig.roughness || 0.5,
            metalness: materialConfig.metalness || 0.0
          });
          break;
        case 'basic':
          material = new THREE.MeshBasicMaterial({ color: color });
          break;
        default: // 'lambert'
          material = new THREE.MeshLambertMaterial({ color: color });
      }
      
      // Add texture if specified
      if (materialConfig.texture && materialConfig.texture !== 'none') {
        const textureLoader = new THREE.TextureLoader();
        try {
          material.map = textureLoader.load(materialConfig.texture);
          if (materialConfig.textureRepeat) {
            material.map.wrapS = THREE.RepeatWrapping;
            material.map.wrapT = THREE.RepeatWrapping;
            material.map.repeat.set(materialConfig.textureRepeat[0] || 1, materialConfig.textureRepeat[1] || 1);
          }
        } catch (error) {
          console.warn('⚠️ Failed to load texture:', materialConfig.texture);
        }
      }
      
      // Add emissive properties if specified
      if (materialConfig.emissive) {
        material.emissive = new THREE.Color(parseColor(materialConfig.emissive, 0x000000));
        material.emissiveIntensity = materialConfig.emissiveIntensity || 0.1;
      }
      
      return material;
    };

    // Create procedural room based on JSON configuration
    const createProceduralRoom = (scene, config) => {
      console.log('🏗️ Creating procedural room with config:', config.room);
      
      const room = config.room;
      const width = room.width || 8;
      const height = room.height || 4;
      const depth = room.depth || 8;
      
      // Parse colors properly from JSON strings
      const wallColor = parseColor(room.wallColor, 0xe0e0e0);
      const floorColor = parseColor(room.floorColor, 0xf5f5f5);
      const ceilingColor = parseColor(room.ceilingColor, 0xe0e0e0);
      
      console.log('🎨 Parsed colors:');
      console.log(`  Wall: ${wallColor.toString(16)} (from ${room.wallColor})`);
      console.log(`  Floor: ${floorColor.toString(16)} (from ${room.floorColor})`);
      console.log(`  Ceiling: ${ceilingColor.toString(16)} (from ${room.ceilingColor})`);
      
      // Enhanced materials with texture support
      const wallMaterial = createMaterial({
        color: wallColor,
        type: room.wallMaterial?.type || 'lambert',
        texture: room.wallMaterial?.texture,
        textureRepeat: room.wallMaterial?.textureRepeat,
        roughness: room.wallMaterial?.roughness,
        metalness: room.wallMaterial?.metalness
      });
      
      const floorMaterial = createMaterial({
        color: floorColor,
        type: room.floorMaterial?.type || 'lambert',
        texture: room.floorMaterial?.texture,
        textureRepeat: room.floorMaterial?.textureRepeat,
        roughness: room.floorMaterial?.roughness,
        metalness: room.floorMaterial?.metalness
      });
      
      const ceilingMaterial = createMaterial({
        color: ceilingColor,
        type: room.ceilingMaterial?.type || 'lambert',
        texture: room.ceilingMaterial?.texture,
        textureRepeat: room.ceilingMaterial?.textureRepeat,
        roughness: room.ceilingMaterial?.roughness,
        metalness: room.ceilingMaterial?.metalness
      });
      
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(width, depth);
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      
      // Ceiling
      const ceilingGeometry = new THREE.PlaneGeometry(width, depth);
      const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
      ceiling.position.y = height;
      ceiling.rotation.x = Math.PI / 2;
      ceiling.receiveShadow = true;
      scene.add(ceiling);
      
      // Walls
      // Back wall
      const backWallGeometry = new THREE.PlaneGeometry(width, height);
      const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
      backWall.position.set(0, height / 2, -depth / 2);
      backWall.receiveShadow = true;
      scene.add(backWall);
      
      // Front wall (with optional door opening)
      if (room.hasDoor) {
        createWallWithDoor(scene, width, height, depth / 2, wallMaterial, room);
      } else {
        const frontWallGeometry = new THREE.PlaneGeometry(width, height);
        const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
        frontWall.position.set(0, height / 2, depth / 2);
        frontWall.rotation.y = Math.PI;
        frontWall.receiveShadow = true;
        scene.add(frontWall);
      }
      
      // Left wall
      const leftWallGeometry = new THREE.PlaneGeometry(depth, height);
      const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
      leftWall.position.set(-width / 2, height / 2, 0);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.receiveShadow = true;
      scene.add(leftWall);
      
      // Right wall
      const rightWallGeometry = new THREE.PlaneGeometry(depth, height);
      const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
      rightWall.position.set(width / 2, height / 2, 0);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.receiveShadow = true;
      scene.add(rightWall);
      
      console.log(`✅ Procedural room created: ${width}x${depth}x${height}`);
    };

    // Create wall with door opening
    const createWallWithDoor = (scene, wallWidth, wallHeight, wallZ, wallMaterial, room) => {
      const doorWidth = room.doorWidth || 1.5;
      const doorHeight = room.doorHeight || 2.5;
      const doorPosition = room.doorPosition || "center"; // center, left, right
      const showDoorFrame = room.showDoorFrame !== false;
      const showDoor = room.showDoor !== false;
      const doorFrameColor = parseColor(room.doorFrameColor, 0x8B4513);
      const doorColor = parseColor(room.doorColor, 0x654321);
      
      console.log(`🚪 Creating door: ${doorWidth}x${doorHeight}, position: ${doorPosition}, frame: ${showDoorFrame}, door: ${showDoor}`);
      
      // Calculate door position offset
      let doorOffsetX = 0;
      if (doorPosition === "left") {
        doorOffsetX = -wallWidth / 2 + doorWidth / 2 + 0.5; // 0.5 units from left edge
      } else if (doorPosition === "right") {
        doorOffsetX = wallWidth / 2 - doorWidth / 2 - 0.5; // 0.5 units from right edge
      }
      // center position uses doorOffsetX = 0
      
      // Calculate wall segments around door
      const leftSegmentWidth = doorOffsetX - doorWidth / 2 + wallWidth / 2;
      const rightSegmentWidth = wallWidth / 2 - doorOffsetX - doorWidth / 2;
      
      // Left wall segment (if needed)
      if (leftSegmentWidth > 0.1) {
        const leftGeometry = new THREE.PlaneGeometry(leftSegmentWidth, wallHeight);
        const leftWall = new THREE.Mesh(leftGeometry, wallMaterial);
        leftWall.position.set(-wallWidth / 2 + leftSegmentWidth / 2, wallHeight / 2, wallZ);
        leftWall.rotation.y = Math.PI;
        leftWall.receiveShadow = true;
        scene.add(leftWall);
      }
      
      // Right wall segment (if needed)
      if (rightSegmentWidth > 0.1) {
        const rightGeometry = new THREE.PlaneGeometry(rightSegmentWidth, wallHeight);
        const rightWall = new THREE.Mesh(rightGeometry, wallMaterial);
        rightWall.position.set(wallWidth / 2 - rightSegmentWidth / 2, wallHeight / 2, wallZ);
        rightWall.rotation.y = Math.PI;
        rightWall.receiveShadow = true;
        scene.add(rightWall);
      }
      
      // Top segment above door
      const topHeight = wallHeight - doorHeight;
      if (topHeight > 0.1) {
        const topGeometry = new THREE.PlaneGeometry(doorWidth, topHeight);
        const topWall = new THREE.Mesh(topGeometry, wallMaterial);
        topWall.position.set(doorOffsetX, wallHeight - topHeight / 2, wallZ);
        topWall.rotation.y = Math.PI;
        topWall.receiveShadow = true;
        scene.add(topWall);
      }
      
      // Door frame (if enabled)
      if (showDoorFrame) {
        const frameThickness = 0.1;
        const frameDepth = 0.2;
        const frameMaterial = new THREE.MeshLambertMaterial({ color: doorFrameColor });
        
        // Left door frame
        const leftFrameGeometry = new THREE.BoxGeometry(frameThickness, doorHeight, frameDepth);
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        leftFrame.position.set(doorOffsetX - doorWidth / 2 - frameThickness / 2, doorHeight / 2, wallZ + frameDepth / 2);
        leftFrame.castShadow = true;
        scene.add(leftFrame);
        
        // Right door frame
        const rightFrameGeometry = new THREE.BoxGeometry(frameThickness, doorHeight, frameDepth);
        const rightFrame = new THREE.Mesh(rightFrameGeometry, frameMaterial);
        rightFrame.position.set(doorOffsetX + doorWidth / 2 + frameThickness / 2, doorHeight / 2, wallZ + frameDepth / 2);
        rightFrame.castShadow = true;
        scene.add(rightFrame);
        
        // Top door frame
        const topFrameGeometry = new THREE.BoxGeometry(doorWidth + frameThickness * 2, frameThickness, frameDepth);
        const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
        topFrame.position.set(doorOffsetX, doorHeight + frameThickness / 2, wallZ + frameDepth / 2);
        topFrame.castShadow = true;
        scene.add(topFrame);
      }
      
      // Actual door (if enabled)
      if (showDoor) {
        const doorMaterial = new THREE.MeshLambertMaterial({ color: doorColor });
        const doorGeometry = new THREE.BoxGeometry(doorWidth - 0.05, doorHeight - 0.05, 0.1);
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(doorOffsetX, doorHeight / 2, wallZ + 0.05);
        door.castShadow = true;
        door.receiveShadow = true;
        scene.add(door);
        
        // Door handle
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(doorOffsetX + doorWidth / 2 - 0.2, doorHeight / 2, wallZ + 0.1);
        handle.rotation.z = Math.PI / 2;
        handle.castShadow = true;
        scene.add(handle);
      }
    };

    // Add objects from configuration
    const addObjectsFromConfig = (scene, objects) => {
      console.log('🎯 Adding objects from configuration:', objects.length, 'items');
      
      objects.forEach((obj, index) => {
        try {
          let object3D = null;
          
          switch (obj.type.toLowerCase()) {
            case 'monitor':
              object3D = createMonitor(obj.properties || {});
              break;
            case 'desk':
              object3D = createDesk(obj.properties || {});
              break;
            case 'chair':
              object3D = createChair(obj.properties || {});
              break;
            case 'cabinet':
              object3D = createCabinet(obj.properties || {});
              break;
            case 'light':
              object3D = createLight(obj.properties || {});
              break;
            case 'box':
              object3D = createBox(obj.properties || {});
              break;
            default:
              console.warn(`⚠️ Unknown object type: ${obj.type}`);
              object3D = createBox({ color: 0xff0000 }); // Red box as fallback
          }
          
          if (object3D) {
            object3D.position.set(...(obj.position || [0, 0, 0]));
            object3D.rotation.set(...(obj.rotation || [0, 0, 0]));
            object3D.scale.set(...(obj.scale || [1, 1, 1]));
            scene.add(object3D);
            console.log(`  ✅ Added ${obj.type} at [${obj.position?.join(', ') || '0,0,0'}]`);
          }
        } catch (error) {
          console.error(`❌ Error creating object ${index}:`, error);
        }
      });
    };

    // Object creation functions
    const createDesk = (props) => {
      const group = new THREE.Group();
      const color = parseColor(props.color, 0x8B4513);
      const material = new THREE.MeshLambertMaterial({ color });
      
      console.log(`🪑 Creating desk with color: ${color.toString(16)} (from ${props.color})`);
      
      // Desktop
      const topGeometry = new THREE.BoxGeometry(props.width || 1.5, 0.05, props.depth || 0.8);
      const desktop = new THREE.Mesh(topGeometry, material);
      desktop.position.y = 0.75;
      desktop.castShadow = true;
      desktop.receiveShadow = true;
      group.add(desktop);
      
      // Legs
      const legGeometry = new THREE.BoxGeometry(0.05, 0.75, 0.05);
      const positions = [
        [-(props.width || 1.5)/2 + 0.1, 0.375, -(props.depth || 0.8)/2 + 0.1],
        [(props.width || 1.5)/2 - 0.1, 0.375, -(props.depth || 0.8)/2 + 0.1],
        [-(props.width || 1.5)/2 + 0.1, 0.375, (props.depth || 0.8)/2 - 0.1],
        [(props.width || 1.5)/2 - 0.1, 0.375, (props.depth || 0.8)/2 - 0.1]
      ];
      
      positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, material);
        leg.position.set(...pos);
        leg.castShadow = true;
        group.add(leg);
      });
      
      return group;
    };

    const createChair = (props) => {
      const group = new THREE.Group();
      const color = parseColor(props.color, 0x444444);
      const material = new THREE.MeshLambertMaterial({ color });
      
      console.log(`🪑 Creating chair with color: ${color.toString(16)} (from ${props.color})`);
      
      // Seat
      const seatGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5);
      const seat = new THREE.Mesh(seatGeometry, material);
      seat.position.y = 0.45;
      seat.castShadow = true;
      group.add(seat);
      
      // Backrest
      const backGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.05);
      const back = new THREE.Mesh(backGeometry, material);
      back.position.set(0, 0.7, -0.225);
      back.castShadow = true;
      group.add(back);
      
      // Legs
      const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
      const legPositions = [[-0.2, 0.225, -0.2], [0.2, 0.225, -0.2], [-0.2, 0.225, 0.2], [0.2, 0.225, 0.2]];
      
      legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, material);
        leg.position.set(...pos);
        leg.castShadow = true;
        group.add(leg);
      });
      
      return group;
    };

    const createCabinet = (props) => {
      const group = new THREE.Group();
      const color = parseColor(props.color, 0x654321);
      const material = new THREE.MeshLambertMaterial({ color });
      
      console.log(`🗄️ Creating cabinet with color: ${color.toString(16)} (from ${props.color})`);
      
      const width = props.width || 0.6;
      const height = props.height || 1.2;
      const depth = props.depth || 0.4;
      
      const cabinetGeometry = new THREE.BoxGeometry(width, height, depth);
      const cabinet = new THREE.Mesh(cabinetGeometry, material);
      cabinet.position.y = height / 2;
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      group.add(cabinet);
      
      return group;
    };

    const createLight = (props) => {
      const color = parseColor(props.color, 0xffffff);
      const intensity = props.intensity || 0.5;
      const distance = props.distance || 50;
      
      console.log(`💡 Creating light with color: ${color.toString(16)} (from ${props.color})`);
      
      const light = new THREE.PointLight(color, intensity, distance);
      light.castShadow = true;
      
      // Add visual indicator
      const lightGeometry = new THREE.SphereGeometry(0.1, 8, 6);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: color, 
        emissive: color,
        emissiveIntensity: 0.5 
      });
      const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      light.add(lightMesh);
      
      return light;
    };

    const createBox = (props) => {
      const color = parseColor(props.color, 0x888888);
      const width = props.width || 0.5;
      const height = props.height || 0.5;
      const depth = props.depth || 0.5;
      
      console.log(`📦 Creating box with color: ${color.toString(16)} (from ${props.color})`);
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshLambertMaterial({ color });
      const box = new THREE.Mesh(geometry, material);
      
      box.castShadow = true;
      box.receiveShadow = true;
      
      return box;
    };

    // Rename the old function to avoid conflicts
    const createBasicRoom = (scene) => {
      console.log('🏗️ Creating basic fallback room');
      
      const defaultConfig = {
        room: {
          width: 6,
          height: 3,
          depth: 6,
          wallColor: 0xe0e0e0,
          floorColor: 0xf5f5f5,
          ceilingColor: 0xe0e0e0
        },
        objects: []
      };
      
      createProceduralRoom(scene, defaultConfig);
    };

    // Add monitors/displays to the scene
    const addMonitorsToScene = (scene) => {
      console.log('🖥️ Adding monitors to the scene...');
      
      // Monitor configurations - position, rotation, screen content
      const monitorConfigs = [
        {
          position: [-2, 1, -2.8], // Left wall
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          screenColor: 0x001133,
          label: "Monitor 1"
        },
        {
          position: [2, 1, -2.8], // Right side of back wall
          rotation: [0, 0, 0],
          scale: [0.8, 0.8, 0.8],
          screenColor: 0x003311,
          label: "Monitor 2"
        },
        {
          position: [0, 1.2, 1.5], // Center, facing back wall
          rotation: [0, Math.PI, 0],
          scale: [1.2, 1.2, 1.2],
          screenColor: 0x330011,
          label: "Main Display"
        }
      ];

      monitorConfigs.forEach((config, index) => {
        const monitor = createMonitor(config);
        monitor.position.set(...config.position);
        monitor.rotation.set(...config.rotation);
        monitor.scale.set(...config.scale);
        scene.add(monitor);
        console.log(`  ✅ Added ${config.label} at position [${config.position.join(', ')}]`);
      });
      
      console.log('🖥️ All monitors added successfully!');
    };

    // Create a professional video wall monitor (like the reference image)
    const createVideoWallMonitor = (configOrProps) => {
      const monitorGroup = new THREE.Group();
      const mapSegment = configOrProps.mapSegment;
      
      console.log(`📺 Creating professional video wall monitor [${mapSegment.row},${mapSegment.col}]`);
      
      // Larger, more substantial monitor housing
      const housingGeometry = new THREE.BoxGeometry(1.0, 0.6, 0.06); // Bigger and slightly thicker
      const housingMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Dark gray/black
      const housing = new THREE.Mesh(housingGeometry, housingMaterial);
      housing.position.z = -0.03;
      housing.castShadow = true;
      housing.receiveShadow = true;
      monitorGroup.add(housing);
      
      // Prominent bezel around screen
      const bezelGeometry = new THREE.BoxGeometry(0.96, 0.56, 0.02);
      const bezelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
      bezel.position.z = 0.005;
      bezel.castShadow = true;
      monitorGroup.add(bezel);
      
      // Screen area (slightly smaller than bezel for realistic look)
      const screenGeometry = new THREE.PlaneGeometry(0.88, 0.50);
      const screenMaterial = createMapSegmentMaterial(mapSegment);
      const screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.z = 0.015; // In front of bezel
      monitorGroup.add(screen);
      
      // Video wall mounting bracket (visible support structure)
      const bracketGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.08);
      const bracketMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
      bracket.position.z = -0.08; // Behind housing
      bracket.castShadow = true;
      monitorGroup.add(bracket);
      
      // Corner mounting points (4 corners)
      const mountGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);
      const mountMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
      
      const corners = [
        [-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]
      ];
      
      corners.forEach(([x, y]) => {
        const mount = new THREE.Mesh(mountGeometry, mountMaterial);
        mount.position.set(x, y, -0.01);
        mount.rotation.x = Math.PI / 2;
        mount.castShadow = true;
        monitorGroup.add(mount);
      });
      
      return monitorGroup;
    };

    // Create a single monitor object
    const createMonitor = (configOrProps) => {
      const monitorGroup = new THREE.Group();
      
      // Handle both old config format and new props format
      const screenColor = parseColor(configOrProps.screenColor, 0x001133);
      const isWallMounted = configOrProps.wallMounted || false;
      const mapSegment = configOrProps.mapSegment;
      const isVideoWall = mapSegment !== undefined;
      
      console.log(`🖥️ Creating ${isWallMounted ? 'wall-mounted' : 'desk'} monitor${isVideoWall ? ' (video wall)' : ''} with screen color: ${screenColor.toString(16)} (from ${configOrProps.screenColor})`);
      
      // Video wall monitors get special treatment
      if (isVideoWall) {
        return createVideoWallMonitor(configOrProps);
      }
      
      // Only add base and stand if not wall-mounted
      if (!isWallMounted) {
        // Monitor base/stand
        const baseGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.05, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.45;
        base.castShadow = true;
        monitorGroup.add(base);
        
        // Monitor stand/neck
        const neckGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
        const neckMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const neck = new THREE.Mesh(neckGeometry, neckMaterial);
        neck.position.y = -0.25;
        neck.castShadow = true;
        monitorGroup.add(neck);
      }
      
      // Monitor back/housing (thinner for wall-mounted)
      const housingDepth = isWallMounted ? 0.03 : 0.08;
      const housingGeometry = new THREE.BoxGeometry(0.8, 0.5, housingDepth);
      const housingMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const housing = new THREE.Mesh(housingGeometry, housingMaterial);
      housing.position.z = isWallMounted ? -housingDepth/2 : -0.04;
      housing.castShadow = true;
      housing.receiveShadow = true;
      monitorGroup.add(housing);
      
      // Monitor screen (the main display) - full size for rimless effect
      const screenGeometry = new THREE.PlaneGeometry(0.8, 0.5);
      
      // Check if this monitor should display a map segment
      let screenMaterial;
      
      if (mapSegment) {
        // Create simple dark monitor screens for video wall base
        console.log(`�️ Monitor creating base screen for video wall: row ${mapSegment.row}, col ${mapSegment.col} of ${mapSegment.totalRows}x${mapSegment.totalCols}`);
        screenMaterial = createMapSegmentMaterial(mapSegment);

      } else {
        // Default colored screen
        console.log(`🖥️ Monitor using solid color: ${screenColor.toString(16)}`);
        screenMaterial = new THREE.MeshLambertMaterial({ 
          color: screenColor,
          emissive: screenColor,
          emissiveIntensity: 0.3
        });
      }
      
      const screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.z = 0.001; // Slightly in front of housing
      monitorGroup.add(screen);
      
      // Only add screen content simulation for monitors without map segments
      if (!mapSegment) {
        const contentGeometry = new THREE.PlaneGeometry(0.6, 0.3);
        const contentMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x004488,
          emissive: 0x001122,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.8
        });
        const content = new THREE.Mesh(contentGeometry, contentMaterial);
        content.position.z = 0.002;
        monitorGroup.add(content);
      }
      
      return monitorGroup;
    };

    // Create material for map segment
    const createMapSegmentMaterial = (mapSegment) => {
      const { row, col, totalRows, totalCols } = mapSegment;
      
      console.log(`�️ Creating BLACK DEBUG screen for monitor [${row},${col}] out of ${totalRows}x${totalCols} grid`);
      
      // SIMPLIFIED BLACK SCREEN VERSION FOR DEBUGGING
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const segmentWidth = 256;
      const segmentHeight = 256;
      
      canvas.width = segmentWidth;
      canvas.height = segmentHeight;
      
      // Create black screen with white text showing position
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, segmentWidth, segmentHeight);
      
      // Add white text to identify monitor position
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Monitor`, segmentWidth/2, segmentHeight/2 - 20);
      ctx.fillText(`[${row},${col}]`, segmentWidth/2, segmentHeight/2 + 10);
      
      // Add thin white border for visibility
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, segmentWidth-2, segmentHeight-2);
      
      const canvasTexture = new THREE.CanvasTexture(canvas);
      canvasTexture.needsUpdate = true;
      canvasTexture.minFilter = THREE.LinearFilter;
      canvasTexture.magFilter = THREE.LinearFilter;
      
      const material = new THREE.MeshLambertMaterial({ 
        map: canvasTexture,
        transparent: false,
        side: THREE.FrontSide,
        color: 0xffffff
      });
      
      console.log(`🖥️ Created BLACK DEBUG screen for monitor [${row},${col}]`);
      return material;
    };

    const createFallbackGeometry = (scene) => {
      
      img.onload = function() {
        console.log(`✅ Image loaded successfully: ${img.width}x${img.height}`);
        
        // Calculate source coordinates from the original image
        const sourceWidth = img.width / totalCols;
        const sourceHeight = img.height / totalRows;
        const sourceX = col * sourceWidth;
        const sourceY = row * sourceHeight;
        
        console.log(`📐 Extracting segment [${row},${col}]: source (${sourceX}, ${sourceY}, ${sourceWidth}, ${sourceHeight})`);
        
        // Clear canvas with white background first
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, segmentWidth, segmentHeight);
        
        // Draw the specific segment of the image
        try {
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
            0, 0, segmentWidth, segmentHeight // Destination rectangle
          );
          
          // Light enhancement only (remove heavy contrast/brightness changes)
          const imageData = ctx.getImageData(0, 0, segmentWidth, segmentHeight);
          const data = imageData.data;
          
          // Apply very light brightness enhancement only
          const brightness = 15; // Much lighter brightness boost
          
          for (let i = 0; i < data.length; i += 4) {
            // Light brightness boost only, no contrast adjustment
            data[i] = Math.min(255, data[i] + brightness);     // Red
            data[i + 1] = Math.min(255, data[i + 1] + brightness); // Green
            data[i + 2] = Math.min(255, data[i + 2] + brightness); // Blue
            // Alpha channel (i + 3) remains unchanged
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          console.log(`🎯 Successfully drew and enhanced segment [${row},${col}]`);
        } catch (error) {
          console.error(`❌ Error drawing segment [${row},${col}]:`, error);
          
          // Fallback: create a clearly visible test pattern
          ctx.fillStyle = `hsl(${(row * 60 + col * 30) % 360}, 80%, 60%)`;
          ctx.fillRect(0, 0, segmentWidth, segmentHeight);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`[${row},${col}]`, segmentWidth/2, segmentHeight/2);
        }
        
        // Create texture from canvas
        const canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.needsUpdate = true;
        canvasTexture.minFilter = THREE.LinearFilter;
        canvasTexture.magFilter = THREE.LinearFilter;
        
        // Update the material with the new texture
        if (window.mapSegmentMaterials && window.mapSegmentMaterials[`${row}-${col}`]) {
          window.mapSegmentMaterials[`${row}-${col}`].map = canvasTexture;
          window.mapSegmentMaterials[`${row}-${col}`].needsUpdate = true;
          console.log(`� Updated material for segment [${row},${col}]`);
        }
      };
      
      img.onerror = function(error) {
        console.error(`❌ Failed to load image:`, error);
        console.error(`📁 Attempted path: img/OSMSingaporeMapJan2010.jpeg`);
        console.log(`🔄 Trying alternative path: ./img/OSMSingaporeMapJan2010.jpeg`);
        
        // Fallback: create a clearly visible test pattern
        ctx.fillStyle = `hsl(${(row * 60 + col * 30) % 360}, 80%, 60%)`;
        ctx.fillRect(0, 0, segmentWidth, segmentHeight);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Map Error`, segmentWidth/2, segmentHeight/2 - 10);
        ctx.fillText(`[${row},${col}]`, segmentWidth/2, segmentHeight/2 + 15);
        
        const canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.needsUpdate = true;
        
        if (window.mapSegmentMaterials && window.mapSegmentMaterials[`${row}-${col}`]) {
          window.mapSegmentMaterials[`${row}-${col}`].map = canvasTexture;
          window.mapSegmentMaterials[`${row}-${col}`].needsUpdate = true;
        }
      };
      
      // Start loading the image with better path handling
      console.log(`🔄 Loading image: img/OSMSingaporeMapJan2010.jpeg`);
      img.src = 'img/OSMSingaporeMapJan2010.jpeg';
      
      // Create initial material with brighter loading screen
      ctx.fillStyle = `hsl(${(row * 60 + col * 30) % 360}, 70%, 70%)`;
      ctx.fillRect(0, 0, segmentWidth, segmentHeight);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Loading...`, segmentWidth/2, segmentHeight/2 - 10);
      ctx.fillText(`[${row},${col}]`, segmentWidth/2, segmentHeight/2 + 10);
      
      const initialTexture = new THREE.CanvasTexture(canvas);
      initialTexture.needsUpdate = true;
      initialTexture.minFilter = THREE.LinearFilter;
      initialTexture.magFilter = THREE.LinearFilter;
      
      const material = new THREE.MeshLambertMaterial({ 
        map: initialTexture,
        transparent: false,
        side: THREE.FrontSide,
        emissive: 0x111111,
        emissiveIntensity: 0.1,
        color: 0xffffff
      });
      
      // Store material reference for later updates
      if (!window.mapSegmentMaterials) {
        window.mapSegmentMaterials = {};
      }
      window.mapSegmentMaterials[`${row}-${col}`] = material;
      
      console.log(`📦 Created initial material for segment [${row},${col}]`);
      return material;
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
      // Much brighter ambient light for overall illumination
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased from 0.4 to 0.8
      scene.add(ambientLight);

      // Main directional light - brighter and warmer
      const directionalLight = new THREE.DirectionalLight(0xffffee, 1.2); // Increased from 0.8 to 1.2
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

      // Additional directional light from opposite side
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight2.position.set(-5, 8, -3);
      scene.add(directionalLight2);

      // Brighter point light for better illumination
      const pointLight = new THREE.PointLight(0xffffcc, 0.8, 100); // Increased from 0.5 to 0.8
      pointLight.position.set(0, 3, 0);
      pointLight.castShadow = true;
      scene.add(pointLight);

      // Additional fill lights for even coverage
      const fillLight1 = new THREE.PointLight(0xffffff, 0.4, 50);
      fillLight1.position.set(3, 2, 3);
      scene.add(fillLight1);

      const fillLight2 = new THREE.PointLight(0xffffff, 0.4, 50);
      fillLight2.position.set(-3, 2, -3);
      scene.add(fillLight2);

      console.log('💡 Enhanced lighting setup complete - much brighter!');
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
