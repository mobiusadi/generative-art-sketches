const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

class Point {
  constructor({ x, y, ix, iy }) {
    this.x = x;
    this.y = y;
    this.ix = ix; // Initial x
    this.iy = iy; // Initial y
    this.lineWidth = 0;
    this.color = '';
  }
}

const sketch = ({ width, height }) => {
  const points = [];
  const cols = 72; 
  const rows = 12;
  const numCells = cols * rows;

  const gw = width  * 0.8;
  const gh = height * 0.8;
  const cw = gw / (cols - 1);
  const ch = gh / (rows - 1);
  const mx = (width  - gw) * 0.5;
  const my = (height - gh) * 0.5;

  const frequency = 0.002;
  const amplitude = 90;

  // palette setup from image_0d4209.jpg
  const colors = colormap({
    colormap: 'magma',
    nshades: amplitude,
    format: 'hex'
  });

  for (let i = 0; i < numCells; i++) {
    const x = (i % cols) * cw;
    const y = Math.floor(i / cols) * ch;
    points.push(new Point({ x, y, ix: x, iy: y }));
  }

  return ({ context, width, height, frame }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Update point positions and properties with Noise
    points.forEach(point => {
      // 3D Noise for animation (frame * 10 controls speed)
      const n = random.noise3D(point.ix, point.iy, frame * 10, frequency, amplitude);
      
      point.x = point.ix + n;
      point.y = point.iy + n;

      // Variable width and color mapping from image_0d4209.jpg
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
        context.lineCap = 'round'; // Smooths segment joins

        context.moveTo(curr.x, curr.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }
    context.restore();
  };
};

canvasSketch(sketch, settings);