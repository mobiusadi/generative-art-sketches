const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { Delaunay } = require('d3-delaunay');
const C2S = require('canvas-to-svg');
const Tweakpane = require('tweakpane');

const settings = {
    dimensions: 'A3',
    units: 'cm',
    pixelsPerInch: 300,
    animate: true
};

// 1. THE PALETTE (Just 4-5 Colors needed now!)
// We add a few more just to give the algorithm options, 
// but it will try to use as few as possible.
const palette = [
    '#264653', // Dark Green
    '#2a9d8f', // Teal
    '#e9c46a', // Yellow
    '#f4a261', // Orange
    '#e76f51', // Red
    
];

const params = {
    count: 50,
    seed: 1,
    lineWidth: 0.1,
    lineColor: '#111111',
    fillCells: true 
};

const sketch = ({ width, height }) => {
    
    const pane = new Tweakpane.Pane();
    pane.addInput(params, 'count', { min: 10, max: 200, step: 1 });
    pane.addInput(params, 'seed', { min: 0, max: 100, step: 1 });
    pane.addInput(params, 'lineWidth', { min: 0.01, max: 0.5 });
    pane.addInput(params, 'lineColor');
    pane.addInput(params, 'fillCells');

    return ({ context, width, height }) => {
        
        // A. GENERATE GEOMETRY
        random.setSeed(params.seed);

        const points = [];
        for (let i = 0; i < params.count; i++) {
            points.push([
                random.range(0, width),
                random.range(0, height)
            ]);
        }

        const delaunay = new Delaunay(points.flat());
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        // B. THE "SMART" COLORING ALGORITHM
        // We can't just pick random colors anymore.
        // We have to calculate them based on neighbors.
        const cellColors = [];

        for (let i = 0; i < points.length; i++) {
            // 1. Find all neighbors of the current cell 'i'
            const neighbors = Array.from(voronoi.neighbors(i));
            
            // 2. See what colors neighbors have already picked
            const neighborColors = new Set();
            neighbors.forEach(nIndex => {
                // If neighbor 'nIndex' has a color already, add it to our "banned" list
                if (cellColors[nIndex]) {
                    neighborColors.add(cellColors[nIndex]);
                }
            });

            // 3. Pick the first color from our palette that ISN'T banned
            // This is called a "Greedy Algorithm"
            let chosenColor = palette.find(c => !neighborColors.has(c));

            // (Fallback: If all colors are taken, just pick a random one)
            if (!chosenColor) chosenColor = random.pick(palette);

            cellColors[i] = chosenColor;
        }


        // C. DRAW FUNCTION
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

        // D. OUTPUT
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