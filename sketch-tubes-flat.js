const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
  name: 'flat-traces',
};

const params = {
  count: 10,
  speed: 0.6,
  minRadius: 10,
  maxRadius: 60,
  wandering: 2.0,
  outlineWidth: 1.0, // Controls definition between steps
  reset: false,
};

class Tube {
  constructor(width, height) {
    this.init(width, height);
  }

  init(width, height) {
    this.x = width / 2;
    this.y = height / 2;
    this.angle = random.range(0, Math.PI * 2);
    this.noiseOffset = random.range(0, 1000);
  }

  update(time, width, height) {
    // 1. Calculate Movement (Same natural wandering as before)
    const n = random.noise3D(
        this.x * 0.002, 
        this.y * 0.002, 
        time * params.speed * 0.5, 
        1
    );
    
    this.angle += n * params.wandering * 0.1;
    
    const speed = 3 + params.speed * 2;
    this.x += Math.cos(this.angle) * speed;
    this.y += Math.sin(this.angle) * speed;

    // Wrap around
    const margin = params.maxRadius;
    if (this.x < -margin) this.x = width + margin;
    if (this.x > width + margin) this.x = -margin;
    if (this.y < -margin) this.y = height + margin;
    if (this.y > height + margin) this.y = -margin;

    // Dynamic Size
    const sizeNoise = random.noise2D(this.noiseOffset, time * 0.5); 
    this.radius = math.mapRange(sizeNoise, -1, 1, params.minRadius, params.maxRadius);
  }

  draw(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    
    // 1. Solid White Fill (The "Trace")
    context.fillStyle = '#ffffff';
    context.fill();

    // 2. Thin Outline (Makes the path obvious)
    // We use a subtle gray so it doesn't look like a cartoon cartoon
    if (params.outlineWidth > 0) {
        context.lineWidth = params.outlineWidth;
        context.strokeStyle = '#444444'; 
        context.stroke();
    }
  }
}

const sketch = ({ width, height }) => {
  const tubes = [];
  for (let i = 0; i < 50; i++) {
    tubes.push(new Tube(width, height));
  }

  return ({ context, width, height, frame }) => {
    // No background clear!

    if (params.reset || frame === 0) {
       context.fillStyle = '#111'; // Dark gray background
       context.fillRect(0, 0, width, height);
       tubes.forEach(t => t.init(width, height));
       params.reset = false;
    }

    const time = frame * 0.01;

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

  folder = pane.addFolder({ title: 'Trace Elements' });
  folder.addInput(params, 'count', { min: 1, max: 30, step: 1 });
  folder.addInput(params, 'minRadius', { min: 5, max: 50 });
  folder.addInput(params, 'maxRadius', { min: 20, max: 150 });
  folder.addInput(params, 'outlineWidth', { min: 0, max: 5.0, label: 'Definition' });
  
  folder = pane.addFolder({ title: 'Motion' });
  folder.addInput(params, 'speed', { min: 0.1, max: 2.0 });
  folder.addInput(params, 'wandering', { min: 0, max: 5.0, label: 'Curviness' });

  const btn = pane.addButton({ title: 'Clear Canvas' });
  btn.on('click', () => { params.reset = true; });

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