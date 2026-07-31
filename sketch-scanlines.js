const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const params = {
  rows: 10,
  speed: 1.0,
  noiseScale: 2.0, // Controls how "cloudy" or "smooth" the gradient is
  noiseSpeed: 0.5, // How fast the pattern evolves internally
  gap: 0,          // Space between rows
};

// Available palettes from the 'colormap' library
const availablePalettes = [
  'magma', 'inferno', 'plasma', 'viridis', 
  'warm', 'cool', 'spring', 'summer', 'autumn', 'winter',
  'bone', 'jet', 'rainbow', 'portland', 'blackbody', 'earth', 
  'electric', 'alpha', 'density'
];

const sketch = ({ width, height }) => {
  // We store data for each row here (which palette it uses, its random seed, etc.)
  let rowData = [];

  // Helper to rebuild the rows when we change the count
  const initRows = () => {
    rowData = [];
    for (let i = 0; i < 200; i++) { // Pre-generate enough data for up to 200 rows
      rowData.push({
        paletteName: random.pick(availablePalettes),
        offset: random.range(0, 1000),     // Random starting position
        direction: random.sign(),          // Some move left, some move right
        speedMod: random.range(0.5, 1.5)   // Some move faster than others
      });
    }
  };

  initRows();

  return ({ context, width, height, frame }) => {
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const { rows, speed, noiseScale, noiseSpeed, gap } = params;
    
    // Calculate height of each strip
    // We subtract the total gap space to fit them perfectly
    const totalGapSpace = gap * (rows - 1);
    const rowHeight = (height - totalGapSpace) / rows;

    for (let r = 0; r < rows; r++) {
      const data = rowData[r];
      const y = r * (rowHeight + gap);

      // Generate the colors for this specific row's palette
      // We generate 50 shades for a smooth look
      const colors = colormap({
        colormap: data.paletteName,
        nshades: 50,
        format: 'hex',
        alpha: 1
      });

      // DRAWING THE GRADIENT
      // Instead of a simple linear gradient, we draw thin vertical lines across the width.
      // This allows us to use Noise to make the gradient "cloudy" or "organic"
      
      // Optimization: Draw in chunks of 2 pixels to keep framerate high
      const chunk = 2; 
      
      for (let x = 0; x < width; x += chunk) {
        // 1. Calculate Noise Value
        // x coordinate mapped to 0-1
        const u = x / width; 
        
        // Noise inputs:
        // x-axis: u * noiseScale
        // y-axis: r (row index) -> keeps rows distinct
        // time: frame * speed
        const n = random.noise3D(
          u * noiseScale + data.offset, 
          r * 10.5, // Arbitrary offset so rows don't look identical
          frame * speed * 0.002 * data.speedMod,
          1 // Frequency
        );

        // 2. Map Noise (-1 to 1) to Color Index (0 to colors.length)
        // We use the noise value to pick which color from the gradient to show
        const colorIdx = Math.floor(math.mapRange(n, -1, 1, 0, colors.length - 1));
        
        // Safety clamp
        const safeIdx = math.clamp(colorIdx, 0, colors.length - 1);
        
        context.fillStyle = colors[safeIdx];
        context.fillRect(x, y, chunk, rowHeight);
      }
    }
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Structure' });
  folder.addInput(params, 'rows', { min: 1, max: 100, step: 1 });
  folder.addInput(params, 'gap', { min: 0, max: 50 });

  folder = pane.addFolder({ title: 'Movement' });
  folder.addInput(params, 'speed', { min: 0, max: 10 });
  folder.addInput(params, 'noiseScale', { min: 0.1, max: 10.0, label: 'Zoom' });
  
  // A button to randomize the palettes again
  const btn = pane.addButton({ title: 'Shuffle Palettes' });
  btn.on('click', () => {
     // We just re-run the sketch logic implicitly by reloading or we could re-init
     window.location.reload(); 
  });

  return pane;
};

createPane();
canvasSketch(sketch, settings);