console.log("!!! I AM THE NEW CODE !!!");

const canvasSketch = require('canvas-sketch');
global.THREE = require('three'); // Make THREE global for ease
const math = require('canvas-sketch-util/math');

const settings = {
  // Turn on the 3D Engine
  context: 'webgl',
  animate: true
};

const sketch = ({ context }) => {
  // 1. SETUP THE SCENE
  // -------------------
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
    antialias: true // Smooth edges
  });
  // Change '#f0f0f0' (White) to '#000000' (Pitch Black)
  renderer.setClearColor('#000000', 1);
  renderer.shadowMap.enabled = true;    // Turn on shadows

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(15, 15, 15);      // Zoom out to see the whole tower
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  // 2. LIGHTING
  // -----------
  // A bright sun light to cast shadows
  const sun = new THREE.DirectionalLight('#ffffff', 1);
  sun.position.set(5, 10, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048; // Sharp shadows
  sun.shadow.mapSize.height = 2048;
  scene.add(sun);
  
  // Soft ambient light so shadows aren't pitch black
  scene.add(new THREE.AmbientLight('#404040'));

  // 3. ARCHITECTURE GENERATOR
  // -------------------------
  const towerGroup = new THREE.Group();
  scene.add(towerGroup);

  // Configuration
  const count = 40;           // How many louvers?
  const radius = 4;           // Building radius
  const height = 1;           // Height of each blade
  const width = 1.5;          // Width of each blade (the "Louver Width")
  
  // The Material (Cyan-ish glass/metal)
  const material = new THREE.MeshPhysicalMaterial({
    color: '#3498db',
    metalness: 0.1,
    roughness: 0.2,
    side: THREE.DoubleSide
  });

  // The Geometry (One single blade)
  // We use BoxGeometry to give it some thickness (0.05)
  const geometry = new THREE.BoxGeometry(width, 0.05, height);

  // --- THE LOOP (Discretization) ---
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // A. Position in a Circle
    const t = i / count;
    const angle = t * Math.PI * 2;
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    mesh.position.set(x, 0, z);

    // B. Rotate to face outward (Normal rotation)
    // We rotate negative angle so they face nicely out from center
    mesh.rotation.y = -angle;

    // C. APPLY SOLAR TWIST (The Magic)
    // This is the EXACT same logic as your 2D script!
    // South (PI) = Flat (0 deg)
    // East (PI/2) = Vertical (90 deg)
    const solarAngle = angle; 
    const twist = Math.abs(Math.sin(solarAngle)) * (Math.PI / 2);
    
    // In Three.js, we rotate the Z axis of the mesh to "tilt" it
    mesh.rotation.z = twist;

    towerGroup.add(mesh);
  }

  // 4. THE RENDER LOOP
  // ------------------
  return ({ time, width, height }) => {
    // Spin the building slowly
    towerGroup.rotation.y = time * 0.2;

    // Resize handling
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Draw
    renderer.render(scene, camera);
  };
};

canvasSketch(sketch, settings);