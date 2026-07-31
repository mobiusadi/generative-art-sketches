const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const Tweakpane = require('tweakpane');

const settings = {
    dimensions: 'A3',
    animate: true,
    units: 'cm',
    pixelsPerInch: 300
};

const params = {
    // Grid
    gridType: 'Square', // Change this to 'Square' for Marrakech style!
    cellSize: 2,
    
    // Pattern Logic
    showGrid: false,
    showStar: true,
    starRadius: 0.5, // Slide this to "morph" the pattern
    
    // Style
    lineWidth: 0.1,
    lineColor: '#ffffff', // White lines (mortar)
    fillColor: '#b33939', // Clay Red background
    starColor: '#2c3e50'  // Blue Star
};

const sketch = ({ width, height }) => {
    
    const pane = new Tweakpane.Pane();
    
    const f1 = pane.addFolder({ title: 'Grid Architecture' });
    f1.addInput(params, 'gridType', { options: { Square: 'Square', Hexagonal: 'Hexagonal' } });
    f1.addInput(params, 'cellSize', { min: 0.5, max: 5 });
    
    const f2 = pane.addFolder({ title: 'Pattern Geometry' });
    f2.addInput(params, 'showGrid');
    f2.addInput(params, 'showStar');
    f2.addInput(params, 'starRadius', { min: 0, max: 1.5, label: 'Star Angle' });
    
    const f3 = pane.addFolder({ title: 'Zellij Style' });
    f3.addInput(params, 'lineWidth', { min: 0.01, max: 0.5 });
    f3.addInput(params, 'lineColor');
    f3.addInput(params, 'fillColor');
    f3.addInput(params, 'starColor');

    return ({ context, width, height }) => {
        // 1. Draw Background
        context.fillStyle = params.fillColor;
        context.fillRect(0, 0, width, height);

        const size = params.cellSize;
        // Determine sides based on grid type
        const sides = (params.gridType === 'Square') ? 4 : 6;
        // Adjust radius calculation for different shapes
        const radius = (params.gridType === 'Square') ? size * 0.7 : size * 0.5;

        // --- THE UNIVERSAL TILE DRAWER ---
        const drawTile = (x, y, r, sideCount) => {
            
            // A. Draw Skeleton (The grid shape)
            if (params.showGrid) {
                context.beginPath();
                for (let i = 0; i < sideCount; i++) {
                    // Rotate squares by 45 degrees (PI/4) to align like diamond tiles
                    const offset = (params.gridType === 'Square') ? Math.PI / 4 : Math.PI / 6;
                    const angle = (Math.PI * 2 * i) / sideCount + offset;
                    
                    const px = x + Math.cos(angle) * r;
                    const py = y + Math.sin(angle) * r;
                    if (i === 0) context.moveTo(px, py);
                    else context.lineTo(px, py);
                }
                context.closePath();
                context.strokeStyle = 'rgba(255,255,255,0.3)';
                context.lineWidth = 0.02;
                context.stroke();
            }

            // B. Draw The Pattern (The Star/Rosette)
            if (params.showStar) {
                context.beginPath();
                for (let i = 0; i < sideCount; i++) {
                    const offset = (params.gridType === 'Square') ? Math.PI / 4 : Math.PI / 6;
                    
                    const angle = (Math.PI * 2 * i) / sideCount + offset;
                    const nextAngle = (Math.PI * 2 * (i + 1)) / sideCount + offset;
                    
                    // 1. Find edge midpoint
                    const mx = x + (Math.cos(angle) * r + Math.cos(nextAngle) * r) / 2;
                    const my = y + (Math.sin(angle) * r + Math.sin(nextAngle) * r) / 2;
                    
                    // 2. Find inner "Star Point"
                    // We interpolate based on the radius
                    const midAngle = (angle + nextAngle) / 2;
                    // Magic: We push the point IN or OUT based on the slider
                    const ix = x + Math.cos(midAngle) * (r * params.starRadius);
                    const iy = y + Math.sin(midAngle) * (r * params.starRadius);

                    // Draw the "V" from edge -> center -> edge
                    context.moveTo(mx, my);
                    context.lineTo(ix, iy);
                }
                context.strokeStyle = params.lineColor;
                context.lineWidth = params.lineWidth;
                context.stroke();
                
                // Optional: Fill the center star?
                // This requires a separate complex loop, let's keep it line-based for now 
                // to match the "Pattern Construction" vibe.
            }
        };


        // --- GRID LOOP ---
        const cols = Math.ceil(width / size) + 2;
        const rows = Math.ceil(height / size) + 2;

        if (params.gridType === 'Hexagonal') {
            // HEXAGONAL PACKING
            const hexHeight = size * 0.866; 
            for (let row = -1; row < rows; row++) {
                for (let col = -1; col < cols; col++) {
                    const xOffset = (row % 2 === 0) ? 0 : size * 0.5;
                    const x = (col * size) + xOffset;
                    const y = row * hexHeight;
                    drawTile(x, y, radius, 6);
                }
            }
        } else {
            // SQUARE PACKING
            for (let row = -1; row < rows; row++) {
                for (let col = -1; col < cols; col++) {
                    const x = col * size;
                    const y = row * size;
                    drawTile(x, y, radius, 4);
                }
            }
        }
    };
};

canvasSketch(sketch, settings);