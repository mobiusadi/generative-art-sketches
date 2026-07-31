const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

// 1. Define global parameters
// Note: 'cols' and 'rows' are here for easy access, but changing them 
// requires a page reload because the grid is built only once at startup.
const params = {
  cols: 72,
  rows: 36,
  amplitude: 90,
  frequency: 0.002,
  speed: 2,
  minWidth: 2,
  maxWidth: 20,
  palette: 'bone'
};

class Point {
  constructor({ x, y, lineWidth, color, ix, iy }) {
    this.x = x;
    this.y = y;
    this.ix = ix; // Store initial X for noise
    this.iy = iy; // Store initial Y for noise
    this.lineWidth = lineWidth;
    this.color = color;
  }
}

const sketch = ({ width, height }) => {
  const points = [];
  const { cols, rows } = params;
  const numCells = cols * rows;

  const gw = width  * 0.8;
  const gh = height * 0.8;
  const cw = gw / (cols - 1);
  const ch = gh / (rows - 1);
  const mx = (width  - gw) * 0.5;
  const my = (height - gh) * 0.5;

  // Initialize grid setup once
  for (let i = 0; i < numCells; i++) {
    const x = (i % cols) * cw;
    const y = Math.floor(i / cols) * ch;
    points.push(new Point({ x, y, ix: x, iy: y }));
  }

  return ({ context, width, height, frame }) => {
    // 2. Destructure live params inside the loop
    const { amplitude, frequency, speed, minWidth, maxWidth, palette } = params;

    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Regenerate colors every frame so the palette/amplitude slider works instantly
    const colors = colormap({
      colormap: palette,
      nshades: Math.max(amplitude, 10), // Safety check
      format: 'hex'
    });

    // 3. Update points using params
    points.forEach(point => {
      // Use params.frequency and params.speed here
      const n = random.noise3D(point.ix, point.iy, frame * speed, frequency, amplitude);
      
      point.x = point.ix + n;
      point.y = point.iy + n;

      // Use params for linewidth range
      point.lineWidth = math.mapRange(n, -amplitude, amplitude, minWidth, maxWidth);
      
      const colorIdx = Math.floor(math.mapRange(n, -amplitude, amplitude, 0, colors.length - 1));
      point.color = colors[math.clamp(colorIdx, 0, colors.length - 1)];
    });

    context.save();
    context.translate(mx, my);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const curr = points[r * cols + c];
        const next = points[r * cols + c + 1];

        context.beginPath();
        context.strokeStyle = curr.color;
        context.lineWidth = curr.lineWidth;
        context.lineCap = 'round';

        context.moveTo(curr.x, curr.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }
    context.restore();
  };
};

// 4. Create the Pane
const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) {
    oldPane.remove();
  }

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Noise' });
  folder.addInput(params, 'frequency', { min: 0.0001, max: 0.01 });
  folder.addInput(params, 'amplitude', { min: 10, max: 200 });
  folder.addInput(params, 'speed', { min: 0, max: 10 });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'minWidth', { min: 0.1, max: 10 });
  folder.addInput(params, 'maxWidth', { min: 5, max: 50 });
  folder.addInput(params, 'palette', {
    options: { Bone: 'bone', Jet: 'jet', Magma: 'magma', Viridis: 'viridis' }
  });
  
  return pane;
};

createPane();
canvasSketch(sketch, settings);