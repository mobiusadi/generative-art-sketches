const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
};

const params = {
  // Density
  lines: 500,
  segments: 200, // Higher resolution for complex knots
  
  // Geometry (The Knot)
  radius: 350,
  xMult: 3,     // Horizontal Loops (Try 1, 2, 3, 5)
  yMult: 2,     // Vertical Loops (Try 2, 3, 4)
  
  // Noise Physics
  noiseFreq: 0.5,
  noiseAmp: 80,    // Distortion strength
  twist: 2.0,      // How much the noise spirals around the shape
  
  // Flow
  speed: 0.8,
  separation: 0.05,
  
  // Style
  lineWidth: 1.5,
  alpha: 0.4,
  palette: 'magma'
};

const sketch = ({ width, height }) => {
  let colors = [];

  const updateColors = () => {
    colors = colormap({
      colormap: params.palette,
      nshades: Math.max(params.lines, 2),
      format: 'hex',
      alpha: 1
    });
  };

  updateColors();

  return ({ context, width, height, frame }) => {
    const { lines, segments, radius, xMult, yMult, noiseAmp, twist, separation, speed, noiseFreq, lineWidth, alpha } = params;

    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;
    context.globalCompositeOperation = 'lighter'; 

    const cx = width * 0.5;
    const cy = height * 0.5;

    if (colors.length !== lines) updateColors();

    for (let i = 0; i < lines; i++) {
      context.beginPath();
      context.strokeStyle = colors[i % colors.length];

      for (let j = 0; j <= segments; j++) {
        // 't' represents how far we are along the SINGLE line (0 to 1)
        const t = j / segments;
        const angle = t * Math.PI * 2;
        
        // --- 1. Base Geometry (Lissajous Knot) ---
        // Instead of just cos(angle), we multiply the angle by xMult/yMult
        // This creates complex knots instead of circles.
        const xBase = Math.cos(angle * xMult);
        const yBase = Math.sin(angle * yMult);

        // --- 2. Noise Calculation ---
        // We add 'angle * twist' to the Z-coordinate. 
        // This makes the noise spiral around the tube like stripes on a candy cane.
        const n = random.noise4D(
            xBase * noiseFreq, 
            yBase * noiseFreq, 
            (i * separation) + (angle * twist), // The Twist Magic
            frame * speed * 0.005, 
            1, 
            noiseAmp
        );

        // --- 3. Apply Noise to Radius ---
        const r = radius + n;

        // Calculate final position
        const x = cx + xBase * r;
        const y = cy + yBase * r;

        if (j === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      
      context.closePath();
      context.stroke();
    }
    
    context.globalAlpha = 1;
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Knot Geometry' });
  folder.addInput(params, 'radius', { min: 50, max: 500 });
  // Integers work best for knots to make them close perfectly
  folder.addInput(params, 'xMult', { min: 1, max: 10, step: 1, label: 'Horiz Loops' });
  folder.addInput(params, 'yMult', { min: 1, max: 10, step: 1, label: 'Vert Loops' });

  folder = pane.addFolder({ title: 'Distortion' });
  folder.addInput(params, 'noiseFreq', { min: 0.1, max: 3.0 });
  folder.addInput(params, 'noiseAmp', { min: 0, max: 300 });
  folder.addInput(params, 'twist', { min: 0, max: 10, label: 'Spirals' });
  folder.addInput(params, 'separation', { min: 0.001, max: 0.1 });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'speed', { min: 0, max: 2 });
  folder.addInput(params, 'lineWidth', { min: 0.5, max: 10 });
  folder.addInput(params, 'alpha', { min: 0.05, max: 1.0 });
  folder.addInput(params, 'palette', {
    options: { Magma: 'magma', Inferno: 'inferno', Viridis: 'viridis', Cool: 'cool' }
  });

  return pane;
};

createPane();
canvasSketch(sketch, settings);