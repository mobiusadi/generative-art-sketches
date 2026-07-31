const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
  name: 'architectural-intelligence', // Default filename prefix
};

const params = {
  rows: 4,
  speed: 1.0,
  noiseScale: 2.0, 
  noiseSpeed: 0.5,
  gap: 0,
  seed: 101, // The magic number that defines the "Random" result
};

const availablePalettes = [
  'magma', 'inferno', 'plasma', 'viridis', 
  'warm', 'cool', 'spring', 'summer', 'autumn', 'winter',
  'bone', 'jet', 'rainbow', 'portland', 'blackbody', 'earth', 
  'electric', 'alpha', 'density'
];

const sketch = ({ width, height }) => {
  let rowData = [];

  // Initialize with a specific seed
  const initRows = () => {
    // 1. Force the random generator to use our seed
    random.setSeed(params.seed);
    
    rowData = [];
    for (let i = 0; i < 200; i++) {
      rowData.push({
        // All these "random" choices will now be reproducible
        paletteName: random.pick(availablePalettes),
        offset: random.range(0, 1000),     
        direction: random.sign(),          
        speedMod: random.range(0.5, 1.5)   
      });
    }
    
    // Log the seed to console so you can find it later if you forgot
    console.log('Current Seed:', params.seed);
  };

  initRows();

  return ({ context, width, height, frame }) => {
    // If we need a reset (triggered by button), do it
    if (params.needsReset) {
        initRows();
        params.needsReset = false;
    }

    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const { rows, speed, noiseScale, noiseSpeed, gap } = params;
    const totalGapSpace = gap * (rows - 1);
    const rowHeight = (height - totalGapSpace) / rows;

    for (let r = 0; r < rows; r++) {
      const data = rowData[r];
      const y = r * (rowHeight + gap);

      const colors = colormap({
        colormap: data.paletteName,
        nshades: 50,
        format: 'hex',
        alpha: 1
      });

      const chunk = 2; 
      
      for (let x = 0; x < width; x += chunk) {
        const u = x / width; 
        
        // We use the same random.noise3D, which respects the seed!
        const n = random.noise3D(
          u * noiseScale + data.offset, 
          r * 10.5, 
          frame * speed * 0.002 * data.speedMod,
          1 
        );

        const colorIdx = Math.floor(math.mapRange(n, -1, 1, 0, colors.length - 1));
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

  // --- SAVE & SEED SECTION ---
  folder = pane.addFolder({ title: 'Session' });
  
  // 1. Randomize Button
  const btnRandom = folder.addButton({ title: 'Randomize New Art' });
  btnRandom.on('click', () => {
      // Pick a random number between 0 and 9999
      params.seed = Math.floor(Math.random() * 10000);
      params.needsReset = true;
      pane.refresh(); // Update the UI to show the new number
  });

  // 2. The Manual Seed Input
  folder.addInput(params, 'seed', { min: 0, max: 10000, step: 1 })
        .on('change', () => { params.needsReset = true; });

  // 3. Save Image Button
  const btnSave = folder.addButton({ title: 'Save .PNG' });
  btnSave.on('click', () => {
      const canvas = document.querySelector('canvas');
      const link = document.createElement('a');
      // Format: scanlines-SEED.png
      link.download = `scanlines-${params.seed}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
  });


  folder = pane.addFolder({ title: 'Structure' });
  folder.addInput(params, 'rows', { min: 1, max: 100, step: 1 });
  folder.addInput(params, 'gap', { min: 0, max: 50 });

  folder = pane.addFolder({ title: 'Movement' });
  folder.addInput(params, 'speed', { min: 0, max: 10 });
  folder.addInput(params, 'noiseScale', { min: 0.1, max: 10.0, label: 'Zoom' });

  // Add Home Button Helper
  const btnHome = document.createElement('a');
  btnHome.innerHTML = '← Home';
  btnHome.href = 'index.html';
  btnHome.style.position = 'fixed';
  btnHome.style.top = '20px';
  btnHome.style.left = '20px';
  btnHome.style.color = 'white';
  btnHome.style.textDecoration = 'none';
  btnHome.style.fontFamily = 'monospace';
  btnHome.style.fontSize = '14px';
  btnHome.style.zIndex = '1000';
  btnHome.style.opacity = '0.5';
  document.body.appendChild(btnHome);

  return pane;
};

createPane();
canvasSketch(sketch, settings);