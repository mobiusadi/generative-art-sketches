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
  geoSeed: 10,
  colorSeed: 50,
  greyScale: false,
  lineColor: '#1a1a1a',
  gradient: true,
  // New Control: Randomize Direction?
  randomDirection: true,
  fixedDirection: 'vertical' 
};

const sketch = () => {
  return ({ context, width, height }) => {
    
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.colorSeed);

    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    const rowHeight = height / params.rows;

    for (let r = 0; r < params.rows; r++) {
      const y = r * rowHeight;
      let x = 0; 

      while (x < width) {
        let w = rngGeo.range(params.minWidth, params.maxWidth);
        if (x + w > width) w = width - x;

        // Color Setup
        let colorString;
        if (params.greyScale) {
           const shade = rngColor.rangeFloor(50, 200);
           colorString = `rgb(${shade}, ${shade}, ${shade})`;
        } else {
           const hue = rngColor.rangeFloor(0, 360);
           const sat = rngColor.rangeFloor(40, 70);
           const light = rngColor.rangeFloor(50, 70);
           colorString = `hsl(${hue}, ${sat}%, ${light}%)`;
        }

        if (params.gradient) {
            let grad;
            const rectH = rowHeight - params.gap;
            const rectW = w - params.gap;

            // DECISION: Which way should the light flow?
            let dir;
            if (params.randomDirection) {
                // Pick one of 4 random directions
                dir = rngColor.pick(['vertical', 'horizontal', 'diagDown', 'diagUp']);
            } else {
                dir = params.fixedDirection;
            }

            // Create Gradient based on direction
            if (dir === 'vertical') {
                grad = context.createLinearGradient(x, y, x, y + rectH);
            } else if (dir === 'horizontal') {
                grad = context.createLinearGradient(x, y, x + rectW, y);
            } else if (dir === 'diagDown') {
                grad = context.createLinearGradient(x, y, x + rectW, y + rectH);
            } else if (dir === 'diagUp') {
                grad = context.createLinearGradient(x, y + rectH, x + rectW, y);
            }

            grad.addColorStop(0, colorString);
            grad.addColorStop(1, 'white'); // The fade target

            context.fillStyle = grad;
        } else {
            context.fillStyle = colorString;
        }

        context.fillRect(x, y, w - params.gap, rowHeight - params.gap);
        x += w; 
      }
    }
  };
};

const createPane = () => {
  const pane = new Pane();
  
  const f1 = pane.addFolder({ title: 'Structure' });
  f1.addInput(params, 'rows', { min: 1, max: 50, step: 1 });
  f1.addInput(params, 'minWidth', { min: 10, max: 200 });
  f1.addInput(params, 'maxWidth', { min: 200, max: 800 });
  f1.addInput(params, 'gap', { min: 0, max: 20 });
  f1.addInput(params, 'geoSeed', { min: 0, max: 1000, step: 1, label: 'Layout Seed' });
  
  const f2 = pane.addFolder({ title: 'Light & Color' });
  f2.addInput(params, 'greyScale');
  f2.addInput(params, 'gradient');
  f2.addInput(params, 'randomDirection', { label: 'Mix Directions?' }); // Toggle mixing
  f2.addInput(params, 'fixedDirection', { 
    options: { Vertical: 'vertical', Horizontal: 'horizontal', DiagDown: 'diagDown', DiagUp: 'diagUp' } 
  });
  f2.addInput(params, 'colorSeed', { min: 0, max: 1000, step: 1, label: 'Palette Seed' });
  f2.addInput(params, 'lineColor');

  f1.addButton({ title: 'New Layout' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
  });

  f2.addButton({ title: 'New Colors' }).on('click', () => {
    params.colorSeed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);