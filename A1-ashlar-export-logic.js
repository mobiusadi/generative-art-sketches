const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { Pane } = require('tweakpane');

// Settings updated for A1 (59.4 x 84.1 cm) at high resolution
const settings = {
  dimensions: [ 59.4, 84.1 ],
  units: 'cm',
  pixelsPerInch: 300,
  animate: true 
};

const params = {
  rows: 12,
  minWidth: 2,  // Adjusted for cm units
  maxWidth: 10, // Adjusted for cm units
  gap: 0.1,     // Adjusted for cm units
  margin: 2.5,  // Your 25 mm white border
  geoSeed: 10,
  colorSeed: 50,
  greyScale: false,
  lineColor: '#1a1a1a'
};

const sketch = () => {
  return ({ context, width, height }) => {
    // 1. Logic: Create two separate random engines
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.colorSeed);

    // Background - White for the 25mm border
    context.fillStyle = 'white'; 
    context.fillRect(0, 0, width, height);

    // Inner Area Background (The "lineColor" or mortar)
    const innerWidth = width - (params.margin * 2);
    const innerHeight = height - (params.margin * 2);
    
    context.fillStyle = params.lineColor;
    context.fillRect(params.margin, params.margin, innerWidth, innerHeight);

    const rowHeight = innerHeight / params.rows;

    for (let r = 0; r < params.rows; r++) {
      const y = params.margin + (r * rowHeight);
      let x = params.margin; 

      while (x < width - params.margin) {
        // 2. Logic: Use Geometry Engine for width
        let w = rngGeo.range(params.minWidth, params.maxWidth);

        if (x + w > width - params.margin) {
          w = (width - params.margin) - x;
        }

        // 3. Logic: Use Color Engine for fill
        if (params.greyScale) {
           const shade = rngColor.rangeFloor(50, 200);
           context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        } else {
           const hue = rngColor.rangeFloor(0, 360);
           const sat = rngColor.rangeFloor(40, 70);
           const light = rngColor.rangeFloor(50, 70);
           context.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        }

        // Apply gap only to the drawn blocks
        context.fillRect(x, y, w - params.gap, rowHeight - params.gap);

        x += w; 
      }
    }
  };
};

const createPane = () => {
  const pane = new Pane();
  
  const f1 = pane.addFolder({ title: 'Geometry' });
  f1.addInput(params, 'rows', { min: 1, max: 50, step: 1 });
  f1.addInput(params, 'minWidth', { min: 0.5, max: 10 });
  f1.addInput(params, 'maxWidth', { min: 5, max: 30 });
  f1.addInput(params, 'gap', { min: 0, max: 1 });
  f1.addInput(params, 'geoSeed', { min: 0, max: 1000, step: 1, label: 'Layout Seed' });
  
  const f2 = pane.addFolder({ title: 'Color' });
  f2.addInput(params, 'greyScale');
  f2.addInput(params, 'lineColor');
  f2.addInput(params, 'colorSeed', { min: 0, max: 1000, step: 1, label: 'Palette Seed' });
  
  const f3 = pane.addFolder({ title: 'Export Options' });
  
  // PNG Export Button
  f3.addButton({ title: 'Export PNG (High-Res)' }).on('click', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
  });

  // SVG Export Instructions
  f3.addButton({ title: 'Export SVG' }).on('click', () => {
    // Note: To export SVG, canvas-sketch needs a different context
    alert('To export SVG, add "--suffix .svg" to your terminal command and press Cmd+S.');
  });
};

createPane();
canvasSketch(sketch, settings);