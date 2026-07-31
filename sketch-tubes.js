const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
  name: 'chrome-tubes',
};

const params = {
  count: 15,
  speed: 0.5,
  minRadius: 20,
  maxRadius: 80,
  wandering: 1.5, // How much they turn
  color: true,    // Toggle between Chrome and Color
  reset: false,   // Button to clear screen
};

class Tube {
  constructor(width, height) {
    this.init(width, height);
  }

  init(width, height) {
    // Start somewhere in the middle-ish
    this.x = random.range(width * 0.2, width * 0.8);
    this.y = random.range(height * 0.2, height * 0.8);
    
    // Pick a random direction
    this.angle = random.range(0, Math.PI * 2);
    
    // Each tube has a unique noise offset so they don't move identically
    this.noiseOffset = random.range(0, 1000);
    
    // Assign a color (used if 'color' mode is on)
    this.hue = random.range(0, 360);
  }

  update(time, width, height) {
    // 1. Calculate Movement
    // We use noise to slowly change the ANGLE of movement
    const n = random.noise3D(
        this.x * 0.002, 
        this.y * 0.002, 
        time * params.speed, 
        1
    );
    
    // Turn the tube based on noise
    this.angle += n * params.wandering * 0.1;
    
    // Move forward
    const speed = 2 + params.speed * 2;
    this.x += Math.cos(this.angle) * speed;
    this.y += Math.sin(this.angle) * speed;

    // 2. Wrap around screen (optional, keeps them in view)
    if (this.x < -100) this.x = width + 100;
    if (this.x > width + 100) this.x = -100;
    if (this.y < -100) this.y = height + 100;
    if (this.y > height + 100) this.y = -100;

    // 3. Dynamic Size
    // The tube breathes (gets thicker and thinner) over time
    const sizeNoise = random.noise2D(this.noiseOffset, time * 0.5); 
    // Map noise (-1 to 1) to our radius range
    this.radius = math.mapRange(sizeNoise, -1, 1, params.minRadius, params.maxRadius);
  }

  draw(context) {
    // THE 3D TRICK: Radial Gradient
    // We create a gradient that looks like a sphere
    
    // Offset the "light source" to top-left (x - r/3, y - r/3)
    const lightX = this.x - this.radius * 0.3;
    const lightY = this.y - this.radius * 0.3;

    const gradient = context.createRadialGradient(
      lightX, lightY, this.radius * 0.1, // Inner circle (Highlight)
      this.x, this.y, this.radius        // Outer circle (Shadow)
    );

    if (params.color) {
        // Iridescent Mode
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.4, `hsl(${this.hue}, 50%, 50%)`);
        gradient.addColorStop(1, 'black');
    } else {
        // Chrome/Silver Mode (Like the reference)
        gradient.addColorStop(0, 'white');       // Specular highlight
        gradient.addColorStop(0.3, '#cccccc');   // Light silver
        gradient.addColorStop(0.5, '#888888');   // Grey midtone
        gradient.addColorStop(1.0, 'black');     // Deep shadow
    }

    context.fillStyle = gradient;
    
    // Draw the circle
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
  }
}

const sketch = ({ width, height }) => {
  const tubes = [];
  
  // Create the fleet of tubes
  for (let i = 0; i < 50; i++) { // Max pool of 50
    tubes.push(new Tube(width, height));
  }

  return ({ context, width, height, frame }) => {
    // IMPORTANT: We do NOT clear the background (no fillRect)
    // This allows the trails to build up into solid forms.
    
    // Handle manual reset
    if (params.reset) {
       context.fillStyle = 'black';
       context.fillRect(0, 0, width, height);
       // Re-randomize positions
       tubes.forEach(t => t.init(width, height));
       params.reset = false;
    }
    
    // First frame initialization
    if (frame === 0) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);
    }

    const time = frame * 0.01;

    // Only update and draw the active number of tubes
    for (let i = 0; i < params.count; i++) {
        tubes[i].update(time, width, height);
        tubes[i].draw(context);
    }
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Tube Factory' });
  folder.addInput(params, 'count', { min: 1, max: 50, step: 1 });
  folder.addInput(params, 'minRadius', { min: 5, max: 50 });
  folder.addInput(params, 'maxRadius', { min: 30, max: 150 });
  
  folder = pane.addFolder({ title: 'Motion' });
  folder.addInput(params, 'speed', { min: 0.1, max: 2.0 });
  folder.addInput(params, 'wandering', { min: 0, max: 5.0, label: 'Curviness' });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'color', { label: 'Color Mode' });
  
  // A button to clear the canvas and start fresh
  const btn = pane.addButton({ title: 'Clear Canvas' });
  btn.on('click', () => { params.reset = true; });

  const btnSave = pane.addButton({ title: 'Save Image' });
  btnSave.on('click', () => {
      const link = document.createElement('a');
      link.download = `tubes-${Date.now()}.png`;
      link.href = document.querySelector('canvas').toDataURL();
      link.click();
  });

  addHomeButton();
  return pane;
};

const addHomeButton = () => {
  const btn = document.createElement('a');
  btn.innerHTML = '← Home';
  btn.href = 'index.html';
  btn.style.position = 'fixed';
  btn.style.top = '20px';
  btn.style.left = '20px';
  btn.style.color = 'white';
  btn.style.textDecoration = 'none';
  btn.style.fontFamily = 'monospace';
  btn.style.fontSize = '14px';
  btn.style.zIndex = '1000';
  btn.style.opacity = '0.5';
  btn.onmouseenter = () => btn.style.opacity = '1.0';
  btn.onmouseleave = () => btn.style.opacity = '0.5';
  document.body.appendChild(btn);
};

createPane();
canvasSketch(sketch, settings);