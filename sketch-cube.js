const canvasSketch = require('canvas-sketch');
global.THREE = require('three');

const settings = {
  context: 'webgl',
  animate: true
};

const sketch = ({ context }) => {
  console.log("🚀 STARTING RED CUBE TEST..."); // Look for this in the console!

  // 1. Basic Renderer
  // 1. Basic Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
    context: context // <--- ADD THIS LINE!  
  });
  renderer.setClearColor('black', 1);

  // 2. Camera looking at center
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, 4);
  camera.lookAt(new THREE.Vector3());

  // 3. Scene + Red Cube
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 'red', wireframe: true })
  );
  scene.add(mesh);

  // 4. Render Loop
  return ({ time, width, height }) => {
    mesh.rotation.y = time;
    mesh.rotation.x = time * 0.5;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
};

canvasSketch(sketch, settings);