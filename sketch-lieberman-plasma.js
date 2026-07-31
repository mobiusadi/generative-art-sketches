const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 512, 512 ], // Smaller dimensions run faster for pixel manipulation
  animate: true,
  scaleToFit: true
};

const params = {
  speed: 2,
  scale: 4,      // Zoom level of the pattern
  twist: 5,      // How much it spirals
  spiral: 1.0,   // Direction and strength of the pinch
  brightness: 1.2,
  contrast: 1.1,
  
  // Color controls (Cosine Gradient coeffs)
  rFreq: 0.5, gFreq: 0.5, bFreq: 0.5,
  rPhase: 0.0, gPhase: 0.33, bPhase: 0.67
};

const sketch = ({ width, height }) => {
  // We create an ImageData object to write pixels directly
  // This is much faster than running fillRect() 260,000 times
  const imgData = new ImageData(width, height);
  const data = imgData.data; // This is a giant array [r, g, b, a, r, g, b, a...]

  return ({ context, width, height, frame }) => {
    const { speed, scale, twist, spiral, brightness, contrast, 
            rFreq, gFreq, bFreq, rPhase, gPhase, bPhase } = params;
    
    const time = frame * speed * 0.01;
    const cx = width * 0.5;
    const cy = height * 0.5;

    // Loop through every single pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        
        // 1. Normalize coordinates (-1 to 1)
        // This puts (0,0) in the center of the screen
        const u = (x - cx) / cx;
        const v = (y - cy) / cy;

        // 2. Convert to Polar Coordinates
        // 'dist' is distance from center, 'angle' is the direction
        const dist = Math.sqrt(u * u + v * v);
        const angle = Math.atan2(v, u);

        // 3. The "Warper" Logic
        // We distort the angle based on the distance (creates the spiral)
        // We distort the distance based on sine waves (creates the ripples)
        const warper = Math.sin(dist * scale - time);
        
        // This is the core formula for that specific image look:
        // We mix the Angle, the Twist, and the Time.
        const val = Math.sin(angle * twist + dist * spiral + warper);
        
        // 4. Color Mapping (Cosine Palette)
        // Instead of simple HSL, we map values to Cosine waves for smooth mixing
        // Formula: color = amp + amp * cos(frequency * value + phase)
        const r = 0.5 + 0.5 * Math.cos(rFreq * val + time + rPhase * Math.PI * 2);
        const g = 0.5 + 0.5 * Math.cos(gFreq * val + time + gPhase * Math.PI * 2);
        const b = 0.5 + 0.5 * Math.cos(bFreq * val + time + bPhase * Math.PI * 2);

        // 5. Write to Pixel Array
        // The array is 1D, so we calculate the index: (y * width + x) * 4 channels
        const index = (y * width + x) * 4;
        
        // Apply brightness/contrast and convert 0-1 range to 0-255
        data[index + 0] = r * 255 * brightness * contrast; // Red
        data[index + 1] = g * 255 * brightness * contrast; // Green
        data[index + 2] = b * 255 * brightness * contrast; // Blue
        data[index + 3] = 255; // Alpha (fully opaque)
      }
    }

    // Put the calculated pixels onto the canvas
    context.putImageData(imgData, 0, 0);
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Fluid Motion' });
  folder.addInput(params, 'speed', { min: 0, max: 10 });
  folder.addInput(params, 'scale', { min: 1, max: 20, label: 'Zoom' });
  folder.addInput(params, 'twist', { min: 1, max: 20, label: 'Rays' });
  folder.addInput(params, 'spiral', { min: -5, max: 5, label: 'Twist' });

  folder = pane.addFolder({ title: 'Color Science' });
  folder.addInput(params, 'brightness', { min: 0, max: 2 });
  // Phase controls shift the specific colors (R vs G vs B)
  folder.addInput(params, 'rPhase', { min: 0, max: 1, label: 'Red Phase' });
  folder.addInput(params, 'gPhase', { min: 0, max: 1, label: 'Green Phase' });
  folder.addInput(params, 'bPhase', { min: 0, max: 1, label: 'Blue Phase' });

  return pane;
};

createPane();
canvasSketch(sketch, settings);