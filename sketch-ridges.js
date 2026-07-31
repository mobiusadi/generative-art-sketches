const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
  name: 'ridge-landscape',
};

const params = {
  lines: 80,
  speed: 0.2,
  
  // Geometry
  amplitude: 150,    
  frequency: 1.5,    
  waterLevel: 0,     
  
  // The "Look"
  lineWidth: 2.0,
  // FIXED: Added quotes around keys with spaces
  'peak brightness': 100, 
  'valley brightness': 20, 
  
  // Color Injection
  colorAmount: 0.0,  
  colorTint: 200,    
  
  seed: 123,
};

const sketch = ({ width, height }) => {
  return ({ context, width, height, frame }) => {
    random.setSeed(params.seed);
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const { lines, speed, amplitude, frequency, waterLevel, lineWidth } = params;
    
    const margin = height * 0.1;
    const drawHeight = height - margin * 2;
    const gap = drawHeight / lines;

    for (let i = 0; i < lines; i++) {
      const yBase = margin + i * gap;
      
      context.beginPath();
      context.moveTo(0, height); 
      context.lineTo(0, yBase);  

      const points = 150; 
      let pointsArray = []; 

      for (let j = 0; j <= points; j++) {
        const x = (j / points) * width;
        const u = j / points; 
        const v = i / lines;  

        let n = random.noise3D(
          u * frequency, 
          v * frequency * 0.5, 
          frame * speed * 0.01,
          1, 
          amplitude
        );

        if (n < waterLevel) n = waterLevel;

        const y = yBase - n; 
        
        context.lineTo(x, y);
        pointsArray.push({ x, y, n });
      }

      context.lineTo(width, yBase); 
      context.lineTo(width, height);
      context.closePath();

      context.fillStyle = '#000'; 
      context.fill();

      context.beginPath();
      let first = true;
      
      pointsArray.forEach(p => {
        if (first) { context.moveTo(p.x, p.y); first = false; }
        else { context.lineTo(p.x, p.y); }
      });

      const normalizedHeight = math.mapRange(pointsArray[Math.floor(points/2)].n, -amplitude, amplitude, 0, 1, true);
      
      // Accessing the properties with quotes requires bracket notation
      const gray = math.lerp(params['valley brightness'], params['peak brightness'], normalizedHeight);
      
      let saturation = 0;
      if (normalizedHeight > 0.6) { 
          saturation = params.colorAmount * 80; 
      }

      context.strokeStyle = `hsl(${params.colorTint}, ${saturation}%, ${gray}%)`;
      context.lineWidth = lineWidth;
      context.stroke();
    }
  };
};

const createPane = () => {
  const oldPane = document.querySelector('.tp-dfwv'); 
  if (oldPane) oldPane.remove();

  const pane = new Pane();
  let folder;

  folder = pane.addFolder({ title: 'Session' });
  folder.addInput(params, 'seed', { min: 0, max: 1000, step: 1 });
  const btnSave = folder.addButton({ title: 'Save Image' });
  btnSave.on('click', () => {
      const link = document.createElement('a');
      link.download = `ridges-${params.seed}.png`;
      link.href = document.querySelector('canvas').toDataURL();
      link.click();
  });

  folder = pane.addFolder({ title: 'Landscape' });
  folder.addInput(params, 'lines', { min: 10, max: 200 });
  folder.addInput(params, 'amplitude', { min: 0, max: 400, label: 'Height' });
  folder.addInput(params, 'frequency', { min: 0.1, max: 5.0, label: 'Zoom' });
  folder.addInput(params, 'waterLevel', { min: -100, max: 100, label: 'Flatten' });
  folder.addInput(params, 'speed', { min: 0, max: 2 });

  folder = pane.addFolder({ title: 'Look & Feel' });
  folder.addInput(params, 'lineWidth', { min: 0.5, max: 5.0 });
  // Make sure we reference the keys exactly as defined above
  folder.addInput(params, 'peak brightness', { min: 0, max: 100 });
  folder.addInput(params, 'valley brightness', { min: 0, max: 100 });
  
  folder = pane.addFolder({ title: 'Color Tint' });
  folder.addInput(params, 'colorAmount', { min: 0, max: 1, label: 'Intensity' });
  folder.addInput(params, 'colorTint', { min: 0, max: 360, label: 'Hue' });

  addHomeButton();
  return pane;
};

const addHomeButton = () => {
  const btn = document.createElement('a');
  btn.innerHTML = '← Home';
  btn.href = 'index.html';
  btn.style.position = 'fixed';
  btn.style.top = '20px';
  btn.style.left = '20px';
  btn.style.color = 'white';
  btn.style.textDecoration = 'none';
  btn.style.fontFamily = 'monospace';
  btn.style.fontSize = '14px';
  btn.style.zIndex = '1000';
  btn.style.opacity = '0.5';
  btn.onmouseenter = () => btn.style.opacity = '1.0';
  btn.onmouseleave = () => btn.style.opacity = '0.5';
  document.body.appendChild(btn);
};

createPane();
canvasSketch(sketch, settings);