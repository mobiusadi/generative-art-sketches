const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const params = {
  cols: 50,
  rows: 50,
  scale: 0.002, // Controls the "zoom" of the noise texture
  speed: 4,
  trailLength: 0.15, // Lower = longer trails (less clearing)
  lineThickness: 3,
  palette: 'magma'
};

class Particle {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    // We store the "previous" position to draw lines
    this.lx = x; 
    this.ly = y;
    this.vx = 0;
    this.vy = 0;
    this.color = '#fff';
  }

  update({ width, height, frame, colors }) {
    // 1. Calculate Flow
    // We use the particle's CURRENT x,y for noise, not the grid base
    // This creates the "Map" that they travel through
    const n = random.noise3D(this.x, this.y, frame * 0.5, params.scale);
    
    // Map noise (-1 to 1) to an Angle (0 to 360 degrees)
    const angle = n * Math.PI * 2;
    
    // 2. Physics: Convert Angle to Velocity (x/y speed)
    this.vx = Math.cos(angle) * params.speed;
    this.vy = Math.sin(angle) * params.speed;

    // 3. Move
    this.lx = this.x;
    this.ly = this.y;
    this.x += this.vx;
    this.y += this.vy;

    // 4. Wrap Around (Teleportation)
    // If it goes off-screen, reset 'last' pos so we don't draw a line across the screen
    if (this.x > width) { this.x = 0; this.lx = 0; }
    if (this.x < 0) { this.x = width; this.lx = width; }
    if (this.y > height) { this.y = 0; this.ly = 0; }
    if (this.y < 0) { this.y = height; this.ly = height; }

    // 5. Update Color based on speed or angle
    // Let's use the noise value 'n' to pick a color from our palette
    const colorIdx = Math.floor(math.mapRange(n, -1, 1, 0, colors.length - 1));
    this.color = colors[math.clamp(colorIdx, 0, colors.length - 1)];
  }

  draw(context) {
    context.beginPath();
    context.moveTo(this.lx, this.ly);
    context.lineTo(this.x, this.y);
    context.strokeStyle = this.color;
    context.lineWidth = params.lineThickness;
    context.lineCap = 'round';
    context.stroke();
  }
}

const sketch = ({ width, height }) => {
  const particles = [];
  const { cols, rows } = params;
  
  // Setup Grid of Particles
  const cw = width / cols;
  const ch = height / rows;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * cw;
      const y = j * ch;
      particles.push(new Particle({ x, y }));
    }
  }

  return ({ context, width, height, frame }) => {
    // 1. Generate Palette
    const colors = colormap({
      colormap: params.palette,
      nshades: 20,
      format: 'hex'
    });

    // 2. Clear Screen with "Trails"
    // Instead of completely clearing (clearRect), we draw a semi-transparent black rect
    // This allows the previous frame to "fade out" slowly
    context.fillStyle = `rgba(0, 0, 0, ${params.trailLength})`;
    context.fillRect(0, 0, width, height);

    // 3. Update & Draw Particles
    particles.forEach(p => {
      p.update({ width, height, frame, colors });
      p.draw(context);
    });
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Flow Physics' });
  folder.addInput(params, 'scale', { min: 0.0001, max: 0.01 }); // Frequency
  folder.addInput(params, 'speed', { min: 1, max: 15 });

  folder = pane.addFolder({ title: 'Visuals' });
  folder.addInput(params, 'trailLength', { min: 0.01, max: 0.99, label: 'Trail Fade' });
  folder.addInput(params, 'lineThickness', { min: 1, max: 20 });
  folder.addInput(params, 'palette', {
    options: { Magma: 'magma', Inferno: 'inferno', Viridis: 'viridis', Jet: 'jet' }
  });

  return pane;
};

createPane();
canvasSketch(sketch, settings);