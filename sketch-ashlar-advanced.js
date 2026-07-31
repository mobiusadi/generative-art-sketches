const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true 
};

const params = {
  rows: 12,
  minWidth: 50,
  maxWidth: 300,
  gap: 4,
  geoSeed: 10,   // Controls the layout
  colorSeed: 50, // Controls the colors
  greyScale: false,
  lineColor: '#1a1a1a'
};

const sketch = () => {
  return ({ context, width, height }) => {
    
    // 1. Create two separate random engines
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.colorSeed);

    // Background
    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    const rowHeight = height / params.rows;

    for (let r = 0; r < params.rows; r++) {
      const y = r * rowHeight;
      let x = 0; 

      while (x < width) {
        // 2. Use Geometry Engine for width
        let w = rngGeo.range(params.minWidth, params.maxWidth);

        if (x + w > width) {
          w = width - x;
        }

        // 3. Use Color Engine for fill
        if (params.greyScale) {
           const shade = rngColor.rangeFloor(50, 200);
           context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        } else {
           const hue = rngColor.rangeFloor(0, 360);
           const sat = rngColor.rangeFloor(40, 70);
           const light = rngColor.rangeFloor(50, 70);
           context.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        }

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
  f1.addInput(params, 'minWidth', { min: 10, max: 200 });
  f1.addInput(params, 'maxWidth', { min: 200, max: 800 });
  f1.addInput(params, 'gap', { min: 0, max: 20 });
  f1.addInput(params, 'geoSeed', { min: 0, max: 1000, step: 1, label: 'Layout Seed' });
  
  const f2 = pane.addFolder({ title: 'Color' });
  f2.addInput(params, 'greyScale');
  f2.addInput(params, 'lineColor');
  f2.addInput(params, 'colorSeed', { min: 0, max: 1000, step: 1, label: 'Palette Seed' });
  
  // Useful Buttons
  f1.addButton({ title: 'Randomize Layout' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
  });

  f2.addButton({ title: 'Randomize Colors' }).on('click', () => {
    params.colorSeed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);