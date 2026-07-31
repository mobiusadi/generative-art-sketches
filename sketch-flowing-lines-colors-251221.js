const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true // Enables the 'frame' variable
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
  const cols = 72; 
  const rows = 36
  ; // Increased rows for more vertical density
  const numCells = cols * rows;

  const gw = width  * 0.8;
  const gh = height * 0.8;
  const cw = gw / (cols - 1);
  const ch = gh / (rows - 1);
  const mx = (width  - gw) * 0.5;
  const my = (height - gh) * 0.5;

  const amplitude = 90;
  
  const colors = colormap({
    colormap: 'bone',
    nshades: amplitude,
    format: 'hex'
  });

  // 1. Initial grid setup
  for (let i = 0; i < numCells; i++) {
    const x = (i % cols) * cw;
    const y = Math.floor(i / cols) * ch;
    points.push(new Point({ x, y, ix: x, iy: y }));
  }

  return ({ context, width, height, frame }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // 2. ANIMATION LOOP: Update points every frame
    points.forEach(point => {
      // Adding 'frame' here makes the noise move!
      // '0.002' is the spatial frequency, 'frame * 0.01' is the speed
      const n = random.noise3D(point.ix, point.iy, frame * 2
        , 0.002, amplitude);
      
      point.x = point.ix + n;
      point.y = point.iy + n;

      // Dynamically update color and width based on current noise
      point.lineWidth = math.mapRange(n, -amplitude, amplitude, 2, 20);
      const colorIdx = Math.floor(math.mapRange(n, -amplitude, amplitude, 0, amplitude - 1));
      point.color = colors[colorIdx];
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
        context.lineCap = 'round'; // Makes segments join smoothly

        context.moveTo(curr.x, curr.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }
    context.restore();
  };
};

canvasSketch(sketch, settings);