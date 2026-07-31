const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
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
  randomDirection: true,
  fixedDirection: 'vertical',
  animateLight: true,
  speed: 2
};

const sketch = () => {
  return ({ context, width, height, frame }) => {
    
    // Create deterministic random engines
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.colorSeed);

    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    const rowHeight = height / params.rows;

    for (let r = 0; r < params.rows; r++) {
      const y = r * rowHeight;
      let x = 0; 

      while (x < width) {
        // 1. Geometry
        let w = rngGeo.range(params.minWidth, params.maxWidth);
        if (x + w > width) w = width - x;

        // 2. Generate TWO Colors (Start & End)
        let colorStart, colorEnd;
        
        if (params.greyScale) {
           // Pick two different grey levels
           const shade1 = rngColor.rangeFloor(20, 150);
           const shade2 = rngColor.rangeFloor(100, 255);
           colorStart = `rgb(${shade1}, ${shade1}, ${shade1})`;
           colorEnd   = `rgb(${shade2}, ${shade2}, ${shade2})`;
        } else {
           // Pick two completely different HSL colors
           const h1 = rngColor.rangeFloor(0, 360);
           const h2 = rngColor.rangeFloor(0, 360);
           
           // Keep saturation/lightness somewhat consistent so they look nice together
           const s = rngColor.rangeFloor(50, 80); 
           const l = rngColor.rangeFloor(40, 70);
           
           colorStart = `hsl(${h1}, ${s}%, ${l}%)`;
           colorEnd   = `hsl(${h2}, ${s}%, ${l}%)`;
        }

        // 3. Gradient Logic
        if (params.gradient) {
            let grad;
            const rectH = rowHeight - params.gap;
            const rectW = w - params.gap;

            // Direction Logic
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
                // Wave moves the transition point
                const wave = Math.sin(frame * params.speed * 0.01 + x * 0.002 + y * 0.002);
                stopPoint = math.mapRange(wave, -1, 1, 0.2, 0.9);
            }

            // Stop 0: The Base Color
            grad.addColorStop(0, colorStart);
            // Stop 1: The Target Color (Instead of White)
            grad.addColorStop(stopPoint, colorEnd); 

            context.fillStyle = grad;
        } else {
            context.fillStyle = colorStart;
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
  
  const f2 = pane.addFolder({ title: 'Dichroic Color' });
  f2.addInput(params, 'greyScale');
  f2.addInput(params, 'gradient');
  f2.addInput(params, 'randomDirection');
  f2.addInput(params, 'colorSeed', { min: 0, max: 1000, step: 1, label: 'Palette Seed' });
  f2.addInput(params, 'lineColor');
  
  const f3 = pane.addFolder({ title: 'Animation' });
  f3.addInput(params, 'animateLight');
  f3.addInput(params, 'speed', { min: 0, max: 10 });

  f1.addButton({ title: 'New Layout' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
  });
  
  f2.addButton({ title: 'New Palette' }).on('click', () => {
    params.colorSeed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);