const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const params = {
  gridSize: 12,    // How many columns/rows
  scale: 0.7,      // Size of the grid relative to screen
  lineWidth: 4,
  lineLength: 0.6, // Relative to cell size
  speed: 2,
  noiseFreq: 0.2,  // Controls the pattern of rotations
  offset: 0.1      // Chance a cell is empty
};

const sketch = ({ width, height }) => {
  return ({ context, width, height, frame }) => {
    const { gridSize, scale, lineWidth, lineLength, speed, noiseFreq, offset } = params;

    context.fillStyle = '#000'; // Background color (classic Vera style is usually white/black)
    context.fillRect(0, 0, width, height);
    
    context.strokeStyle = '#fff';
    context.lineWidth = lineWidth;
    context.lineCap = 'square';

    // Grid calculations
    const dim = Math.min(width, height) * scale;
    const cellSize = dim / gridSize;
    
    // Center the grid on screen
    const mx = (width - dim) * 0.5;
    const my = (height - dim) * 0.5;
    const halfCell = cellSize * 0.5;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        
        // 1. Generate Pattern
        // Vera Molnar often used randomness, but here we use noise 
        // to create a smooth "wave" of rotation across the grid.
        const n = random.noise3D(x, y, frame * speed * 0.01, noiseFreq);
        
        // 2. Skip some cells (The 'if (!angle) continue' part from your image)
        // If the noise value is too low, we don't draw anything here.
        if (n < -offset) continue;

        // 3. Calculate Position
        const px = mx + x * cellSize + halfCell;
        const py = my + y * cellSize + halfCell;

        // 4. Draw
        context.save();
        context.translate(px, py);
        
        // Rotate based on noise (time + position)
        // '14.8926' from the image is just an arbitrary speed multiplier
        context.rotate(n * Math.PI); 

        // Draw line centered on the point
        // (Similar to 'drawLine(-18... / 2, ...)' in the image)
        const len = cellSize * lineLength;
        context.beginPath();
        context.moveTo(-len / 2, 0);
        context.lineTo(len / 2, 0);
        context.stroke();
        
        context.restore();
      }
    }
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Grid' });
  folder.addInput(params, 'gridSize', { min: 4, max: 50, step: 1 });
  folder.addInput(params, 'scale', { min: 0.1, max: 0.9 });
  folder.addInput(params, 'offset', { min: -1, max: 1, label: 'Density' });

  folder = pane.addFolder({ title: 'Animation' });
  folder.addInput(params, 'speed', { min: 0, max: 10 });
  folder.addInput(params, 'noiseFreq', { min: 0.01, max: 1.0 });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'lineWidth', { min: 1, max: 20 });
  folder.addInput(params, 'lineLength', { min: 0.1, max: 1.5 });
  
  return pane;
};

createPane();
canvasSketch(sketch, settings);