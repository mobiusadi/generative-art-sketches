const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { Delaunay } = require('d3-delaunay');
const C2S = require('canvas-to-svg');
const Tweakpane = require('tweakpane');

const settings = {
    dimensions: 'A3',
    units: 'cm',
    pixelsPerInch: 300,
    animate: true // We enable animation so the screen updates when you move sliders
};

// 1. PARAMETRIC SETTINGS
// These correspond to your architectural constraints
const params = {
    count: 50,            // Density of cells
    seed: 1,              // Variation "ID"
    lineWidth: 0.1,       // Wall thickness (cm)
    lineColor: '#000000', // Wall color
    showDots: false,      // Show columns/centers?
    dotSize: 0.15         // Column size
};

const sketch = ({ width, height }) => {
    
    // 2. SETUP TWEAKPANE UI
    const pane = new Tweakpane.Pane();
    
    // 'Simulation' folder for geometry generation
    const f1 = pane.addFolder({ title: 'Geometry' });
    f1.addInput(params, 'count', { min: 10, max: 200, step: 1 });
    f1.addInput(params, 'seed', { min: 0, max: 100, step: 1 });
    
    // 'Style' folder for line weights (Architecture)
    const f2 = pane.addFolder({ title: 'Drafting' });
    f2.addInput(params, 'lineWidth', { min: 0.01, max: 0.5, step: 0.01 });
    f2.addInput(params, 'lineColor');
    f2.addInput(params, 'showDots');
    f2.addInput(params, 'dotSize', { min: 0.05, max: 0.5 });


    // 3. THE RENDER LOOP
    return ({ context, width, height }) => {
        
        // A. GENERATE DATA
        // Important: Set the random seed first! 
        // This ensures that if you change line width, the walls don't move.
        random.setSeed(params.seed);

        const agents = [];
        for (let i = 0; i < params.count; i++) {
            const x = random.range(0, width);
            const y = random.range(0, height);
            agents.push({ x, y });
        }

        // Calculate Voronoi
        const points = agents.map(a => [a.x, a.y]);
        const delaunay = new Delaunay(points.flat());
        const voronoi = delaunay.voronoi([0, 0, width, height]);


        // B. DRAW FUNCTION (Used for both Screen and SVG)
        const drawGeometry = (ctx) => {
            // Draw Walls (Voronoi)
            ctx.beginPath();
            voronoi.render(ctx); 
            ctx.lineWidth = params.lineWidth;
            ctx.strokeStyle = params.lineColor;
            ctx.stroke();

            // Draw Columns (Dots)
            if (params.showDots) {
                ctx.fillStyle = 'red';
                agents.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, params.dotSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        };

        
        // C. DRAW TO SCREEN (Visual Feedback)
        context.fillStyle = 'white';
        context.fillRect(0, 0, width, height);
        drawGeometry(context);


        // D. PREPARE EXPORT (The SVG Magic)
        // We create the "fake" context just in time for the export
        const svgContext = new C2S(width, height);
        drawGeometry(svgContext);

        return {
            data: svgContext.getSerializedSvg(true),
            extension: '.svg'
        };
    };
};

canvasSketch(sketch, settings);