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
  count: 8,
  minRadius: 80,
  maxRadius: 200,
  gravity: 0.1,
  repulsion: 0.8,
  stiffness: 0.1,
  blobbiness: 1.0,
  background: '#000000',
  palette: 'viridis'
};

class Blob {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    
    this.points = [];
    const numPoints = 32; 
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        this.points.push({ 
            angle, 
            r: radius, 
            baseR: radius 
        });
    }
  }

  update(blobs, width, height) {
    const cx = width / 2;
    const cy = height / 2;

    // 1. Gravity
    this.vx += (cx - this.x) * params.gravity * 0.05;
    this.vy += (cy - this.y) * params.gravity * 0.05;

    // 2. Repulsion
    blobs.forEach(other => {
      if (other === this) return;
      
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const minDist = this.radius + other.radius;

      if (dist < minDist) {
        const force = (minDist - dist) * params.repulsion * 0.05;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;

        if (params.blobbiness > 0) {
            const angleToOther = Math.atan2(other.y - this.y, other.x - this.x);
            this.points.forEach(p => {
                let diff = p.angle - angleToOther;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                
                if (Math.abs(diff) < Math.PI / 2) {
                    const squash = Math.cos(diff) * (minDist - dist) * params.blobbiness * 0.5;
                    p.r = Math.max(p.baseR * 0.4, p.r - squash);
                }
            });
        }
      }
    });

    // 3. Elasticity
    this.points.forEach(p => {
        p.r += (p.baseR - p.r) * params.stiffness;
    });

    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.9; 
    this.vy *= 0.9;
  }

  draw(context) {
    context.fillStyle = this.color;
    context.beginPath();
    this.points.forEach((p, i) => {
        const px = this.x + Math.cos(p.angle) * p.r;
        const py = this.y + Math.sin(p.angle) * p.r;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
    });
    context.closePath();
    context.fill();
  }
}

const sketch = ({ width, height }) => {
  let blobs = [];

  const initBlobs = () => {
    blobs = [];
    let colors = ['#fff']; 

    try {
        // FIX IS HERE: We force nshades to be at least 10.
        // Even if we only have 3 blobs, we generate 10 colors so the library doesn't crash.
        const safeCount = Math.max(params.count, 10);
        
        colors = colormap({
            colormap: params.palette,
            nshades: safeCount,
            format: 'hex'
        });
    } catch (e) {
        console.error("Colormap error:", e);
    }

    for (let i = 0; i < params.count; i++) {
        const x = random.range(width * 0.3, width * 0.7);
        const y = random.range(height * 0.3, height * 0.7);
        const r = random.range(params.minRadius, params.maxRadius);
        
        // We pick colors from the start of the list
        const color = colors[i % colors.length];
        blobs.push(new Blob(x, y, r, color));
    }
  };

  initBlobs();

  return ({ context, width, height }) => {
    context.fillStyle = params.background;
    context.fillRect(0, 0, width, height);

    if (params.needsReset) {
        initBlobs();
        params.needsReset = false;
    }

    blobs.forEach(blob => {
        blob.update(blobs, width, height);
        blob.draw(context);
    });
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Blob Setup' });
  folder.addInput(params, 'count', { min: 2, max: 20, step: 1 });
  folder.addInput(params, 'minRadius', { min: 20, max: 200 });
  folder.addInput(params, 'maxRadius', { min: 50, max: 400 });
  
  const btn = pane.addButton({ title: 'Regenerate Blobs' });
  btn.on('click', () => { params.needsReset = true; });

  folder = pane.addFolder({ title: 'Physics' });
  folder.addInput(params, 'gravity', { min: 0.0, max: 0.5 });
  folder.addInput(params, 'repulsion', { min: 0.1, max: 2.0 });
  folder.addInput(params, 'stiffness', { min: 0.01, max: 0.5 });
  folder.addInput(params, 'blobbiness', { min: 0, max: 2.0 });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'background');
  folder.addInput(params, 'palette', {
    options: { Viridis: 'viridis', Magma: 'magma', Plasma: 'plasma', Jet: 'jet' }
  }).on('change', () => { params.needsReset = true; });

  return pane;
};

createPane();
canvasSketch(sketch, settings);