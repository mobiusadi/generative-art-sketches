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
  lines: 400,
  segments: 100, 
  
  // Geometry
  radius: 300,        
  
  // The 'frequency' was the problem! It needs to be around 0.5 - 2.0 to see details
  noiseFrequency: 0.5, 
  noiseAmplitude: 150, // How 'tall' the spikes are
  
  // Shape Spacing
  separation: 0.05,   
  
  // Animation
  speed: 0.5,
  
  // Style
  lineWidth: 2,
  alpha: 0.5,
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
    const { lines, segments, radius, noiseAmplitude, separation, speed, noiseFrequency, lineWidth, alpha } = params;

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
        const angle = (j / segments) * Math.PI * 2;
        
        // 1. Coordinates on the "Noise Circle"
        // We multiply cos/sin by 'noiseFrequency' to scan a larger area of noise
        const xOff = Math.cos(angle) * noiseFrequency; 
        const yOff = Math.sin(angle) * noiseFrequency;
        
        // 2. Generate Noise
        // Z (i * separation) gives each line a unique slice of noise
        const n = random.noise4D(
            xOff, 
            yOff, 
            i * separation, 
            frame * speed * 0.005, 
            1, // Frequency is handled in xOff/yOff above
            noiseAmplitude
        );

        // 3. Apply noise to the actual radius
        const r = radius + n;

        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

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

  folder = pane.addFolder({ title: 'Mesh Shape' });
  folder.addInput(params, 'lines', { min: 10, max: 800, step: 10 });
  folder.addInput(params, 'radius', { min: 50, max: 500 });
  folder.addInput(params, 'separation', { min: 0.001, max: 0.2, label: 'Un-bunch' });

  folder = pane.addFolder({ title: 'Noise & Flow' });
  // Increased max frequency so you can really crumple the lines
  folder.addInput(params, 'noiseFrequency', { min: 0.1, max: 3.0, label: 'Crumple' }); 
  folder.addInput(params, 'noiseAmplitude', { min: 0, max: 400, label: 'Strength' });
  folder.addInput(params, 'speed', { min: 0, max: 5 });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'lineWidth', { min: 0.5, max: 10 });
  folder.addInput(params, 'alpha', { min: 0.05, max: 1.0 });
  folder.addInput(params, 'palette', {
    options: { Magma: 'magma', Inferno: 'inferno', Viridis: 'viridis', Cool: 'cool', Bone: 'bone' }
  });

  return pane;
};

createPane();
canvasSketch(sketch, settings);