const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true // This keeps the engine running so sliders work!
};

const params = {
  rows: 12,
  minWidth: 50,
  maxWidth: 300,
  gap: 4,
  seed: 10,
  greyScale: false,
  lineColor: '#1a1a1a'
};

const sketch = () => {
  return ({ context, width, height }) => {
    // 1. Lock the randomness so it doesn't flicker
    random.setSeed(params.seed);

    // Background
    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    const rowHeight = height / params.rows;

    // 2. Loop through every Row
    for (let r = 0; r < params.rows; r++) {
      const y = r * rowHeight;
      let x = 0; 

      // 3. Walk across the row
      while (x < width) {
        let w = random.range(params.minWidth, params.maxWidth);

        // Cap width if it goes off screen
        if (x + w > width) {
          w = width - x;
        }

        // Color Logic
        if (params.greyScale) {
           const shade = random.rangeFloor(50, 200);
           context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        } else {
           // Random Pastel Colors
           const hue = random.rangeFloor(0, 360);
           context.fillStyle = `hsl(${hue}, 60%, 60%)`;
        }

        // Draw Rect
        context.fillRect(x, y, w - params.gap, rowHeight - params.gap);

        x += w; 
      }
    }
  };
};

const createPane = () => {
  const pane = new Pane();
  
  const f1 = pane.addFolder({ title: 'Masonry Grid' });
  f1.addInput(params, 'rows', { min: 1, max: 50, step: 1 });
  f1.addInput(params, 'minWidth', { min: 10, max: 200 });
  f1.addInput(params, 'maxWidth', { min: 200, max: 800 });
  f1.addInput(params, 'gap', { min: 0, max: 20 });
  
  const f2 = pane.addFolder({ title: 'Style' });
  f2.addInput(params, 'greyScale');
  f2.addInput(params, 'lineColor'); // Change background color live
  
  f2.addButton({ title: 'Randomize Layout' }).on('click', () => {
    // Pick a new random seed to shuffle the blocks
    params.seed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);