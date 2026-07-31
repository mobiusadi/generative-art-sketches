const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');
const { Pane } = require('tweakpane');

const settings = {
    dimensions: [ 1080, 1080 ],
    animate: true,
};

// 1. Define params
const params = {
    cols: 72,
    rows: 8,
    frequency: 0.002,
    amplitude: 90,
    speed: 3,
    midpointX: 0.8,
    midpointY: 5.5,
    displacement: 250,
    palette: 'salinity'
};

const sketch = ({ width, height }) => {
    return ({ context, width, height, frame }) => {
        // 2. Destructure inside the render loop so they update live
        const { cols, rows, frequency, amplitude, speed, midpointX, midpointY, displacement, palette } = params;
        
        const numCells = cols * rows;
        const gw = width * 0.8;
        const gh = height * 0.8;
        const cw = gw / cols;
        const ch = gh / rows;
        const mx = (width - gw) * 0.5;
        const my = (height - gh) * 0.5;

        // Generate Palette dynamically based on amplitude
        // Added safety check: amplitude must be > 2 for colormap
        const colors = colormap({ 
            colormap: palette, 
            nshades: Math.max(amplitude, 2) 
        });

        const points = [];
        for (let i = 0; i < numCells; i++) {
            const xGrid = (i % cols);
            const yGrid = Math.floor(i / cols);
            
            const ix = xGrid * cw;
            const iy = yGrid * ch;
            
            const n = random.noise2D(ix + frame * speed, iy, frequency, amplitude);
            const x = ix + n;
            const y = iy + n;
            const lineWidth = math.mapRange(n, -amplitude, amplitude, 0, 5);
            
            // Map noise to color index safely
            const colorIdx = Math.floor(math.mapRange(n, -amplitude, amplitude, 0, colors.length - 1));
            const color = colors[math.clamp(colorIdx, 0, colors.length - 1)];

            points.push({ x, y, ix, iy, lineWidth, color });
        }

        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        context.save();
        context.translate(mx, my);
        context.translate(cw * 0.5, ch * 0.5);

        let lastx, lasty;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const curr = points[r * cols + c];
                const next = points[r * cols + c + 1];

                const midX = curr.x + (next.x - curr.x) * midpointX;
                const midY = curr.y + (next.y - curr.y) * midpointY;

                if (c === 0) {
                    lastx = curr.x;
                    lasty = curr.y;
                }

                context.beginPath();
                context.lineWidth = curr.lineWidth;
                context.strokeStyle = curr.color;

                context.moveTo(lastx, lasty);
                context.quadraticCurveTo(curr.x, curr.y, midX, midY);
                context.stroke();

                lastx = midX - (c / cols) * displacement;
                lasty = midY - (r / rows) * displacement;
            }
        }
        context.restore();
    };
};

// 3. Create the Pane (Tweakpane v3 Compatible)
const createPane = () => {
    // Cleanup logic: Remove old pane if it exists to prevent duplicates on reload
    const oldPane = document.querySelector('.tp-dfwv'); 
    if (oldPane) {
        oldPane.remove();
    }

    const pane = new Pane();
    let folder;

    folder = pane.addFolder({ title: 'Grid' });
    folder.addInput(params, 'frequency', { min: 0.0001, max: 0.01 });
    folder.addInput(params, 'amplitude', { min: 10, max: 200 });
    folder.addInput(params, 'speed', { min: 1, max: 20 });

    folder = pane.addFolder({ title: 'Geometry' });
    folder.addInput(params, 'midpointX', { min: 0.1, max: 2.0 });
    folder.addInput(params, 'midpointY', { min: 0.1, max: 10.0 });
    folder.addInput(params, 'displacement', { min: 0, max: 500 });
    
    folder = pane.addFolder({ title: 'Style' });
    folder.addInput(params, 'palette', {
        options: { Salinity: 'salinity', Magma: 'magma', Inferno: 'inferno' }
    });
    
    return pane;
};

createPane();
canvasSketch(sketch, settings);