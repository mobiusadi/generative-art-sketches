const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color'); // <--- New tool for color math
const { Delaunay } = require('d3-delaunay');
const C2S = require('canvas-to-svg');
const Tweakpane = require('tweakpane');

const settings = {
    dimensions: 'A3',
    units: 'cm',
    pixelsPerInch: 300,
    animate: true
};

const params = {
    count: 50,
    seed: 1,
    lineWidth: 0.1,
    lineColor: '#111111',
    fillCells: true,
    
    // COLOR SETTINGS
    mode: 'Manual', // Can be 'Manual' or 'Monochrome'
    baseColor: '#264653', // Used for Monochrome
    // The 4 Manual Colors
    c1: '#264653',
    c2: '#2a9d8f',
    c3: '#e9c46a',
    c4: '#e76f51'
};

const sketch = ({ width, height }) => {
    
    const pane = new Tweakpane.Pane();
    
    const f1 = pane.addFolder({ title: 'Geometry' });
    f1.addInput(params, 'count', { min: 10, max: 200, step: 1 });
    f1.addInput(params, 'seed', { min: 0, max: 100, step: 1 });
    f1.addInput(params, 'lineWidth', { min: 0.01, max: 0.5 });
    
    // THE NEW COLOR DASHBOARD
    const f2 = pane.addFolder({ title: 'Color Palette' });
    f2.addInput(params, 'fillCells');
    f2.addInput(params, 'lineColor');
    
    // Dropdown to pick mode
    f2.addInput(params, 'mode', { options: { Manual: 'Manual', Monochrome: 'Monochrome' } });
    
    // Manual Colors
    f2.addInput(params, 'c1', { label: 'Color A' });
    f2.addInput(params, 'c2', { label: 'Color B' });
    f2.addInput(params, 'c3', { label: 'Color C' });
    f2.addInput(params, 'c4', { label: 'Color D' });
    
    // Monochrome Master
    f2.addInput(params, 'baseColor', { label: 'Mono Base' });


    return ({ context, width, height }) => {
        
        random.setSeed(params.seed);

        // --- 1. BUILD THE PALETTE ---
        let palette = [];

        if (params.mode === 'Manual') {
            // Use the 4 pickers exactly as they are
            palette = [ params.c1, params.c2, params.c3, params.c4 ];
        } else {
            // MONOCHROME MAGIC
            // We take the 'baseColor' and automatically create lighter versions
            const base = params.baseColor;
            palette = [
                base,                                      // 1. Original
                Color.offsetHSL(base, 0, 0, 20).hex,       // 2. Lighter (+20% Lightness)
                Color.offsetHSL(base, 0, 0, 40).hex,       // 3. Much Lighter (+40%)
                Color.offsetHSL(base, 0, 0, 60).hex        // 4. Very Light (+60%)
            ];
            // Note: offsetHSL arguments are (hex, h, s, l)
            // You could change the 2nd number to fade saturation instead!
        }

        // --- 2. GENERATE GEOMETRY ---
        const points = [];
        for (let i = 0; i < params.count; i++) {
            points.push([
                random.range(0, width),
                random.range(0, height)
            ]);
        }

        const delaunay = new Delaunay(points.flat());
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        // --- 3. APPLY 4-COLOR THEOREM LOGIC ---
        const cellColors = [];
        for (let i = 0; i < points.length; i++) {
            const neighbors = Array.from(voronoi.neighbors(i));
            const neighborColors = new Set();
            neighbors.forEach(nIndex => {
                if (cellColors[nIndex]) {
                    neighborColors.add(cellColors[nIndex]);
                }
            });

            // Pick the first valid color from our DYNAMIC palette
            let chosenColor = palette.find(c => !neighborColors.has(c));
            if (!chosenColor) chosenColor = random.pick(palette);

            cellColors[i] = chosenColor;
        }

        // --- 4. DRAW ---
        const drawGeometry = (ctx) => {
            for (let i = 0; i < points.length; i++) {
                ctx.beginPath();
                voronoi.renderCell(i, ctx);
                
                if (params.fillCells) {
                    ctx.fillStyle = cellColors[i];
                    ctx.fill();
                }

                ctx.lineWidth = params.lineWidth;
                ctx.strokeStyle = params.lineColor;
                ctx.stroke();
            }
        };

        context.fillStyle = 'white';
        context.fillRect(0, 0, width, height);
        drawGeometry(context);

        const svgContext = new C2S(width, height);
        drawGeometry(svgContext);

        return {
            data: svgContext.getSerializedSvg(true),
            extension: '.svg'
        };
    };
};

canvasSketch(sketch, settings);