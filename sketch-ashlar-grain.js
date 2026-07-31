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
  // Structure
  rows: 2, 
  minWidth: 50,
  maxWidth: 300,
  gap: 4,
  geoSeed: 10,
  
  // Look & Feel
  lineColor: '#1a1a1a',
  palette: 'jet', // Defaults to that vibrant look you found
  gradient: true,
  
  // Interaction
  interactionMode: 'mouse', 
  effectRadius: 400, 
  speed: 2,

  // Post-Processing (New!)
  texture: true,
  noiseAmount: 20
};

const sketch = ({ canvas }) => {
  
  // 1. Mouse Tracker
  let cursor = { x: -9999, y: -9999 };
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    cursor.x = x * scaleX;
    cursor.y = y * scaleY;
  });

  return ({ context, width, height, frame }) => {
    
    // 2. Setup Random Engines
    const rngGeo = random.createRandom(params.geoSeed);
    const rngColor = random.createRandom(params.geoSeed + 100); 

    // 3. Generate Colors
    const paletteColors = colormap({
      colormap: params.palette,
      nshades: 20,
      format: 'hex',
      alpha: 1
    });

    // 4. Draw Background
    context.fillStyle = params.lineColor; 
    context.fillRect(0, 0, width, height);

    const rowHeight = height / params.rows;

    // 5. Draw the Masonry/Barcode
    for (let r = 0; r < params.rows; r++) {
      const y = r * rowHeight;
      let x = 0; 

      while (x < width) {
        let w = rngGeo.range(params.minWidth, params.maxWidth);
        if (x + w > width) w = width - x;

        const c1 = rngColor.pick(paletteColors);
        const c2 = rngColor.pick(paletteColors);

        if (params.gradient) {
            const rectH = rowHeight - params.gap;
            const rectW = w - params.gap;

            // Interaction Logic
            let stopPoint = 0.5;

            if (params.interactionMode === 'automatic') {
                const wave = Math.sin(frame * params.speed * 0.01 + x * 0.002);
                stopPoint = math.mapRange(wave, -1, 1, 0, 1);
            } else {
                // Mouse Logic
                const centerX = x + w/2;
                const centerY = y + rowHeight/2;
                const dx = cursor.x - centerX;
                const dy = cursor.y - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                stopPoint = math.mapRange(dist, 0, params.effectRadius, 1, 0, true);
            }

            // Draw Gradient
            const grad = context.createLinearGradient(x, y, x + rectW, y);
            grad.addColorStop(0, c1);
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

    // 6. FILM GRAIN EFFECT
    if (params.texture) {
        context.save();
        // Get all pixels from the canvas
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Loop through pixels and add random noise
        // NOTE: We step by 4 (R, G, B, A)
        for (let i = 0; i < data.length; i += 4) {
            // Generate grain value (-amount to +amount)
            const grain = (Math.random() - 0.5) * params.noiseAmount;
            
            // Add grain to Red, Green, Blue channels
            data[i] = data[i] + grain;     // R
            data[i+1] = data[i+1] + grain; // G
            data[i+2] = data[i+2] + grain; // B
            // Alpha (i+3) remains unchanged
        }
        
        // Put the modified pixels back
        context.putImageData(imageData, 0, 0);
        context.restore();
    }
  };
};

const createPane = () => {
  const pane = new Pane();
  
  const f1 = pane.addFolder({ title: 'Design' });
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

  // New Folder for Grain
  const f4 = pane.addFolder({ title: 'Texture' });
  f4.addInput(params, 'texture');
  f4.addInput(params, 'noiseAmount', { min: 0, max: 100 });

  f1.addButton({ title: 'New Layout' }).on('click', () => {
    params.geoSeed = random.rangeFloor(0, 1000);
  });
};

createPane();
canvasSketch(sketch, settings);