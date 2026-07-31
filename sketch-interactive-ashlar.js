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
  rows: 8, 
  minWidth: 50,
  maxWidth: 300,
  gap: 4,
  geoSeed: 10,
  lineColor: '#1a1a1a',
  palette: 'salinity',
  gradient: true,
  interactionMode: 'mouse', // 'mouse' or 'automatic'
  effectRadius: 400, 
  speed: 2
};

const sketch = ({ canvas }) => {
  
  // 1. Mouse Tracker Setup
  let cursor = { x: -9999, y: -9999 }; // Start off-screen
  
  // We attach the listener to the canvas so it knows where you are pointing
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Account for canvas scaling (retina screens etc)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    cursor.x = x * scaleX;
    cursor.y = y * scaleY;
  });

  return ({ context, width, height, frame }) => {
    
    const rngGeo = random.createRandom(params.geoSeed);
    // Separate RNG for color so layout stays stable when you change palettes
    const rngColor = random.createRandom(params.geoSeed + 100); 

    // Generate Palette from Library
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

        // Pick Two Colors from the Palette
        const c1 = rngColor.pick(paletteColors);
        const c2 = rngColor.pick(paletteColors);

        if (params.gradient) {
            const rectH = rowHeight - params.gap;
            const rectW = w - params.gap;

            // --- INTERACTION LOGIC ---
            let stopPoint = 0.5;

            if (params.interactionMode === 'automatic') {
                // Auto Wave
                const wave = Math.sin(frame * params.speed * 0.01 + x * 0.002);
                stopPoint = math.mapRange(wave, -1, 1, 0, 1);
            } else {
                // MOUSE MODE
                // Calculate distance from center of this brick to the mouse
                const centerX = x + w/2;
                const centerY = y + rowHeight/2;
                const dx = cursor.x - centerX;
                const dy = cursor.y - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Map distance to the gradient shift (Close = 1, Far = 0)
                stopPoint = math.mapRange(dist, 0, params.effectRadius, 1, 0, true);
            }

            // Draw Gradient (Horizontal wipe works best for this effect)
            const grad = context.createLinearGradient(x, y, x + rectW, y);
            grad.addColorStop(0, c1);
            
            // Clamp value to prevent errors
            const safeStop = Math.max(0.01, Math.min(0.99, stopPoint));
            grad.addColorStop(safeStop, c2);

            context.fillStyle = grad;
        } else {
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
  
  const f1 = pane.addFolder({ title: 'Design' });
  // FIXED: Changed 'addBinding' to 'addInput' for compatibility
  f1.addInput(params, 'rows', { min: 1, max: 20, step: 1 });
  f1.addInput(params, 'minWidth', { min: 10, max: 200 });
  f1.addInput(params, 'maxWidth', { min: 200, max: 800 });
  f1.addInput(params, 'gap', { min: 0, max: 20 });
  
  const f2 = pane.addFolder({ title: 'Palette' });
  f2.addInput(params, 'palette', { 
    options: { Salinity: 'salinity', Magma: 'magma', Inferno: 'inferno', Bone: 'bone', Jet: 'jet' }
  });
  f2.addInput(params, 'lineColor');

  const f3 = pane.addFolder({ title: 'Interaction' });
  f3.addInput(params, 'interactionMode', { options: { Mouse: 'mouse', Auto: 'automatic' } });
  f3.addInput(params, 'effectRadius', { min: 100, max: 1000 });
  f3.addInput(params, 'speed', { min: 0, max: 10 });

  f1.addButton({ title: 'New Layout' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);