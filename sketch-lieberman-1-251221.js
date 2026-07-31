const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  scaleToFit: true,
};

const params = {
  numLines: 600,
  numSegments: 100,
  noiseScale: 0.0015,
  timeScale: 0.2,
  amplitude: 300,
  lineWidth: 1,
  opacity: 0.8,
  palette: 'cool',
  baseRadius: 400,
};

const sketch = ({ width, height }) => {
  // Generate colors once or when palette changes
  let colors = colormap({
    colormap: params.palette,
    nshades: params.numLines,
    format: 'rgbaString',
    alpha: params.opacity,
  });

  return ({ context, width, height, frame }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Use 'lighter' composite operation for a glowing effect
    context.globalCompositeOperation = 'lighter';
    context.lineWidth = params.lineWidth;

    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < params.numLines; i++) {
      // Get color for this line from the pre-calculated palette
      context.strokeStyle = colors[i % colors.length];
      context.beginPath();

      // The base angle for the line's starting position on a circle
      const baseAngle = math.mapRange(i, 0, params.numLines, 0, Math.PI * 2);
      
      let x, y;

      for (let j = 0; j < params.numSegments; j++) {
        // A parameter that goes from 0 to 1 along the line
        const t = j / (params.numSegments - 1);
        
        // Base circle position
        const angle = baseAngle + t * Math.PI * 4; // Adding t makes it spiral
        const radius = params.baseRadius;

        // Base position
        let bx = cx + radius * Math.cos(angle);
        let by = cy + radius * Math.sin(angle);

        // Calculate noise based on the base position and time
        // Using 4D noise for smoother transitions over time
        const n1 = random.noise4D(bx, by, i * 0.01, frame * params.timeScale, params.noiseScale, params.amplitude);
        const n2 = random.noise4D(bx + 1000, by + 1000, i * 0.01, frame * params.timeScale, params.noiseScale, params.amplitude);

        // Apply noise to distort the position
        x = bx + n1;
        y = by + n2;

        // Draw the line
        if (j === 0) {
          context.moveTo(x, y);
        } else {
          // For simpler smooth curves, lineTo with many segments works well here
          context.lineTo(x, y);
        }
      }
      context.stroke();
    }
  };
};

// Create Tweakpane
const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv');
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  const folder = pane.addFolder({ title: 'Settings' });

  folder.addInput(params, 'numLines', { min: 100, max: 2000, step: 10 });
  folder.addInput(params, 'numSegments', { min: 50, max: 500, step: 10 });
  folder.addInput(params, 'noiseScale', { min: 0.0001, max: 0.01 });
  folder.addInput(params, 'timeScale', { min: 0.01, max: 2 });
  folder.addInput(params, 'amplitude', { min: 50, max: 800 });
  folder.addInput(params, 'lineWidth', { min: 0.1, max: 5 });
  folder.addInput(params, 'opacity', { min: 0.1, max: 1 });
  folder.addInput(params, 'baseRadius', { min: 100, max: 800 });
  
  folder.addInput(params, 'palette', {
    options: {
      Cool: 'cool',
      Warm: 'warm',
      Plasma: 'plasma',
      Magma: 'magma',
      Inferno: 'inferno',
      Viridis: 'viridis',
      Rainbow: 'rainbow-soft'
    },
  }).on('change', () => {
    // Regenerate colors when palette changes
    colors = colormap({
      colormap: params.palette,
      nshades: params.numLines,
      format: 'rgbaString',
      alpha: params.opacity,
    });
  });

  return pane;
};

createPane();
canvasSketch(sketch, settings);