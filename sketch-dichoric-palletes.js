const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap'); // Import the library
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
  lineColor: '#1a1a1a',
  gradient: true,
  randomDirection: true,
  fixedDirection: 'vertical',
  animateLight: true,
  speed: 2,
  // New Palette Control
  palette: 'salinity', 
};

const sketch = () => {
  return ({ context, width, height, frame }) => {
    
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.colorSeed);

    // 1. Generate the Color Pool from the Library
    const paletteColors = colormap({
      colormap: params.palette,
      nshades: 20,
      format: 'hex',
      alpha: 1
    });

    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    const rowHeight = height / params.rows;

    for (let r = 0; r < params.rows; r++) {
      const y = r * rowHeight;
      let x = 0; 

      while (x < width) {
        let w = rngGeo.range(params.minWidth, params.maxWidth);
        if (x + w > width) w = width - x;

        // 2. Pick Two Random Colors from the 'Salinity' Pool
        // We pick from the SAME pool, so they always look good together
        const c1 = rngColor.pick(paletteColors);
        const c2 = rngColor.pick(paletteColors);

        if (params.gradient) {
            let grad;
            const rectH = rowHeight - params.gap;
            const rectW = w - params.gap;

            let dir;
            if (params.randomDirection) {
                dir = rngColor.pick(['vertical', 'horizontal', 'diagDown', 'diagUp']);
            } else {
                dir = params.fixedDirection;
            }

            if (dir === 'vertical')      grad = context.createLinearGradient(x, y, x, y + rectH);
            else if (dir === 'horizontal') grad = context.createLinearGradient(x, y, x + rectW, y);
            else if (dir === 'diagDown')   grad = context.createLinearGradient(x, y, x + rectW, y + rectH);
            else if (dir === 'diagUp')     grad = context.createLinearGradient(x, y + rectH, x + rectW, y);

            // Animation Logic
            let stopPoint = 1;
            if (params.animateLight) {
                const wave = Math.sin(frame * params.speed * 0.01 + x * 0.002 + y * 0.002);
                stopPoint = math.mapRange(wave, -1, 1, 0.2, 0.9);
            }

            grad.addColorStop(0, c1);
            grad.addColorStop(stopPoint, c2); 

            context.fillStyle = grad;
        } else {
            // If gradient is off, just use one color
            context.fillStyle = c1;
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
  
  const f2 = pane.addFolder({ title: 'Dichroic Palette' });
  // Dropdown for the Library Palettes
  f2.addInput(params, 'palette', { 
    options: {
      Salinity: 'salinity',
      Magma: 'magma',
      Inferno: 'inferno',
      Plasma: 'plasma',
      Viridis: 'viridis',
      Bone: 'bone',
      Jet: 'jet',
      Spring: 'spring',
      Summer: 'summer',
      Autumn: 'autumn',
      Winter: 'winter'
    }
  });
  f2.addInput(params, 'gradient');
  f2.addInput(params, 'randomDirection');
  f2.addInput(params, 'colorSeed', { min: 0, max: 1000, step: 1, label: 'Shuffle Colors' });
  f2.addInput(params, 'lineColor');
  
  const f3 = pane.addFolder({ title: 'Animation' });
  f3.addInput(params, 'animateLight');
  f3.addInput(params, 'speed', { min: 0, max: 10 });

  f1.addButton({ title: 'New Layout' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
  });
  
  f2.addButton({ title: 'New Colors' }).on('click', () => {
    params.colorSeed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);