const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
  name: 'signal-flow',
};

const params = {
  lines: 300,
  points: 100, // Resolution of each line
  
  // Flow Physics
  noiseScale: 1.5,
  noiseSpeed: 0.2,
  amplitude: 150, // How much the lines wiggle vertically
  
  // The "Clamped" Grayscale Range (Lightness 0-100)
  lightStart: 80, // Top of screen
  lightEnd: 20,   // Bottom of screen
  
  // The "Color Noise" Signal
  colorFreq: 2.0,     // How "patchy" the color injections are
  colorThreshold: 0.6, // Higher = fewer color patches
  saturationBoost: 40, // How intense the color is when it appears
  baseHue: 220,        // General color tint (e.g., 220 is Blueish)
  
  lineWidth: 2,
  opacity: 0.5,
  seed: 500,
};

const sketch = ({ width, height }) => {
  return ({ context, width, height, frame }) => {
    random.setSeed(params.seed);

    context.fillStyle = '#050505'; // Almost black background
    context.fillRect(0, 0, width, height);

    // 'lighter' blends the semi-transparent lines to create glowing overlaps
    context.globalCompositeOperation = 'lighter';
    context.lineWidth = params.lineWidth;

    const { lines, points, noiseScale, noiseSpeed, amplitude, 
            lightStart, lightEnd, colorFreq, colorThreshold, 
            saturationBoost, baseHue, opacity } = params;

    const marginY = height * 0.1;
    const actualHeight = height - marginY * 2;

    for (let i = 0; i < lines; i++) {
      // t goes from 0 (top) to 1 (bottom)
      const t = i / (lines - 1);

      // --- COLOR CALCULATION (The core of your request) ---
      
      // 1. Base Lightness Gradient (Clamped Gray)
      const lightness = math.lerp(lightStart, lightEnd, t);
      
      // 2. Generate the "Color Signal" Noise
      // We use a different noise frequency here so color doesn't perfectly align with shape
      const colorSignal = random.noise3D(
        0, // X doesn't matter much here
        t * colorFreq, // Y position determines patchiness
        frame * noiseSpeed * 0.5, // drift slowly
        1 // frequency override
      );

      // 3. Determine Saturation based on signal
      let saturation = 2; // Start with almost pure gray (2%)
      let hue = baseHue;

      // If the signal spikes above the threshold, inject color
      if (colorSignal > colorThreshold) {
          // Map the signal intensity to saturation amount
          saturation = math.mapRange(colorSignal, colorThreshold, 1.0, 2, saturationBoost);
          // Slight hue shift based on signal for variation
          hue = baseHue + colorSignal * 50; 
      }

      // Build the HSL color string
      context.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
      
      // --- DRAWING THE LINE ---
      context.beginPath();
      
      const baseY = marginY + t * actualHeight;

      for (let j = 0; j < points; j++) {
        // u goes from 0 (left) to 1 (right)
        const u = j / (points - 1);
        const x = width * u;

        // Calculate flow noise
        // We use 't' (vertical index) heavily here so lines stay relatively parallel
        const n = random.noise3D(
            u * noiseScale, 
            t * noiseScale * 0.5, // Y impact on noise shape
            frame * noiseSpeed * 0.01, 
            1, // freq
            amplitude // amplitude
        );

        const y = baseY + n;

        if (j === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.globalCompositeOperation = 'source-over'; // Reset
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  // Seed & Save
  folder = pane.addFolder({ title: 'Session' });
  folder.addInput(params, 'seed', { min: 0, max: 10000, step: 1 });
  const btnSave = folder.addButton({ title: 'Save .PNG' });
  btnSave.on('click', () => {
      const canvas = document.querySelector('canvas');
      const link = document.createElement('a');
      link.download = `signal-flow-${params.seed}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
  });

  folder = pane.addFolder({ title: 'Flow Geometry' });
  folder.addInput(params, 'lines', { min: 50, max: 600 });
  folder.addInput(params, 'noiseScale', { min: 0.1, max: 5.0, label: 'Zoom' });
  folder.addInput(params, 'noiseSpeed', { min: 0.0, max: 1.0 });
  folder.addInput(params, 'amplitude', { min: 0, max: 400, label: 'Wavy-ness' });

  folder = pane.addFolder({ title: 'Clamped Grayscale' });
  folder.addInput(params, 'lightStart', { min: 0, max: 100, label: 'Bright (Top)' });
  folder.addInput(params, 'lightEnd', { min: 0, max: 100, label: 'Dark (Btm)' });

  folder = pane.addFolder({ title: 'Color Signal Noise' });
  folder.addInput(params, 'colorThreshold', { min: -1, max: 1, label: 'Rarity' });
  folder.addInput(params, 'saturationBoost', { min: 0, max: 100, label: 'Intensity' });
  folder.addInput(params, 'baseHue', { min: 0, max: 360, label: 'Tint' });
  folder.addInput(params, 'colorFreq', { min: 0.1, max: 10.0, label: 'Patch Size' });

  folder = pane.addFolder({ title: 'Style' });
  folder.addInput(params, 'lineWidth', { min: 0.5, max: 5 });
  folder.addInput(params, 'opacity', { min: 0.05, max: 1.0 });

  addHomeButton();
  return pane;
};

// Helper function to add the Home button
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
  btn.style.transition = 'opacity 0.3s';
  btn.onmouseenter = () => btn.style.opacity = '1.0';
  btn.onmouseleave = () => btn.style.opacity = '0.5';
  document.body.appendChild(btn);
};

createPane();
canvasSketch(sketch, settings);