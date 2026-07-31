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
  // Structure
  lines: 600,
  radius: 300,
  
  // The "Organic" Feel
  // Low frequency + High Amplitude = Liquid
  // High frequency + Low Amplitude = Fuzzy/Electric
  noiseFreq: 0.15, 
  noiseAmp: 180,
  
  // Geometry (Floats allow for drifting phases)
  xMult: 3.0,
  yMult: 2.0,
  
  // Animation
  speed: 0.4,
  offset: 0.02, // Separation between lines
  
  // Style
  lineWidth: 1,
  alpha: 0.3,   // Lower alpha = softer, "cloud-like" overlaps
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
    const { lines, radius, xMult, yMult, noiseFreq, noiseAmp, speed, offset, lineWidth, alpha } = params;

    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Using 'screen' or 'lighter' is key for that "glowing mesh" look
    context.globalCompositeOperation = 'lighter'; 
    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;

    const cx = width * 0.5;
    const cy = height * 0.5;

    if (colors.length !== lines) updateColors();

    for (let i = 0; i < lines; i++) {
      context.beginPath();
      context.strokeStyle = colors[i % colors.length];

      // We draw fewer segments to keep it performing well with many lines
      // But we use curveTo (implicit in high segment count) logic
      const segments = 120; 

      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const angle = t * Math.PI * 2;

        // --- ORGANIC CORE ---
        
        // 1. Base Geometry
        // We use the loop index 'i' to offset the noise (z-axis)
        // This means every line sees a slightly different version of the distorted world
        const noiseZ = i * offset;
        const time = frame * speed * 0.01;

        // 2. Domain Warping (The Secret Sauce)
        // Instead of just adding noise to the radius, we calculate noise for X and Y separately.
        // This breaks the symmetry.
        const nx = random.noise4D(Math.cos(angle), Math.sin(angle), noiseZ, time, noiseFreq, noiseAmp);
        const ny = random.noise4D(Math.cos(angle) + 100, Math.sin(angle) + 100, noiseZ, time, noiseFreq, noiseAmp);

        // 3. Apply to Lissajous
        // We add the noise to the POSITION, not just the radius.
        const xRaw = Math.cos(angle * xMult);
        const yRaw = Math.sin(angle * yMult);

        // We multiply the raw geometric shape by the radius, THEN add the fluid distortion
        const x = cx + (xRaw * radius) + nx;
        const y = cy + (yRaw * radius) + ny;

        if (j === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
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

  folder = pane.addFolder({ title: 'Liquid Form' });
  folder.addInput(params, 'noiseFreq', { min: 0.01, max: 1.0, label: 'Smoothness' }); 
  folder.addInput(params, 'noiseAmp', { min: 0, max: 400, label: 'Distortion' });
  folder.addInput(params, 'offset', { min: 0.001, max: 0.1, label: 'Separation' });

  folder = pane.addFolder({ title: 'Shape' });
  folder.addInput(params, 'radius', { min: 50, max: 500 });
  folder.addInput(params, 'xMult', { min: 0, max: 10 });
  folder.addInput(params, 'yMult', { min: 0, max: 10 });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'lines', { min: 100, max: 1000, step: 10 });
  folder.addInput(params, 'lineWidth', { min: 0.5, max: 5 });
  folder.addInput(params, 'alpha', { min: 0.05, max: 1.0 });
  folder.addInput(params, 'speed', { min: 0, max: 2 });
  folder.addInput(params, 'palette', {
    options: { Magma: 'magma', Inferno: 'inferno', Viridis: 'viridis', Cool: 'cool' }
  });

  return pane;
};

createPane();
canvasSketch(sketch, settings);