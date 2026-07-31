const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { math } = require('canvas-sketch-util');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 59.4, 84.1 ],
  units: 'cm',
  pixelsPerInch: 300,
  animate: true 
};

const params = {
  rows: 24,
  minWidth: 4,
  maxWidth: 12,
  gap: 0.1,
  margin: 2.5, // Your 25 mm border
  geoSeed: 10,
  colorSeed: 50,
  magmaMode: true,
  lineColor: '#1a1a1a'
};

const magmaPalette = ['#000004', '#140b35', '#3b0f70', '#63149e', '#8a226a', '#b1314d', '#d6442e', '#f16d13', '#fe990d', '#feba2c', '#fada24', '#fcfdbf'];

const sketch = () => {
  return ({ context, width, height }) => {
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.colorSeed);

    // Background color (the "mortar")
    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    // Calculate the usable area inside the 25mm margin
    const innerWidth = width - (params.margin * 2);
    const innerHeight = height - (params.margin * 2);
    const rowHeight = innerHeight / params.rows;

    for (let r = 0; r < params.rows; r++) {
      const y = params.margin + (r * rowHeight);
      let x = params.margin; 

      while (x < width - params.margin) {
        let w = rngGeo.range(params.minWidth, params.maxWidth);

        // Snap to the right margin
        if (x + w > width - params.margin) {
          w = (width - params.margin) - x;
        }

        if (params.magmaMode) {
           const colorIdx = Math.floor(math.mapRange(r, 0, params.rows, 0, magmaPalette.length - 1));
           context.fillStyle = magmaPalette[colorIdx];
        } else {
           const hue = rngColor.rangeFloor(0, 360);
           const sat = rngColor.rangeFloor(40, 70);
           const light = rngColor.rangeFloor(50, 70);
           context.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        }

        // Draw the block with the gap accounted for
        context.fillRect(x, y, w - params.gap, rowHeight - params.gap);
        x += w; 
      }
    }
  };
};

const createPane = () => {
  const pane = new Pane();
  
  const f1 = pane.addFolder({ title: 'A1 Plot Settings' });
  f1.addInput(params, 'margin', { min: 0, max: 10, label: 'Margin (cm)' });
  f1.addInput(params, 'rows', { min: 1, max: 100, step: 1 });
  f1.addInput(params, 'gap', { min: 0, max: 1, label: 'Mortar Gap' });
  f1.addInput(params, 'geoSeed', { min: 0, max: 1000, step: 1, label: 'Layout Seed' });
  
  const f2 = pane.addFolder({ title: 'Color & Appearance' });
  f2.addInput(params, 'magmaMode');
  f2.addInput(params, 'lineColor', { label: 'Background' });
  f2.addButton({ title: 'Randomize All' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
    params.colorSeed = random.rangeFloor(0, 1000);
  });
  
  pane.addButton({ title: 'SAVE FOR PLOTTER (S)' }).on('click', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
  });
};

createPane();
canvasSketch(sketch, settings);