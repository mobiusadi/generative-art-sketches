const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
const { Delaunay } = require('d3-delaunay');
const Tweakpane = require('tweakpane');

const settings = {
    dimensions: 'A3', // Keep it high res
    animate: true,    // The engine is ON
    units: 'cm',
    pixelsPerInch: 300
};

// --- PARAMETERS ---
const params = {
    count: 50,
    speed: 0.1,        // How fast the glass morphs
    lineWidth: 0.1,
    lineColor: '#111111',
    // Palette Controls
    mode: 'Manual',    // 'Manual' or 'Monochrome'
    baseColor: '#264653',
    c1: '#264653',
    c2: '#2a9d8f',
    c3: '#e9c46a',
    c4: '#e76f51'
};

const sketch = ({ width, height }) => {
    
    // 1. SETUP AGENTS (The Moving Shards)
    const agents = [];
    
    // We create a function to reset/refill the agents
    const initAgents = () => {
        agents.length = 0; // Clear old ones
        
        for (let i = 0; i < params.count; i++) {
            agents.push({
                x: random.range(0, width),
                y: random.range(0, height),
                vx: random.range(-1, 1), // Velocity X
                vy: random.range(-1, 1), // Velocity Y
                // We assign a "Tag" to remember which color group this agent belongs to (0, 1, 2, or 3)
                colorTag: random.rangeFloor(0, 4) 
            });
        }
    };

    // Initialize first time
    initAgents();


    // 2. TWEAKPANE UI
    const pane = new Tweakpane.Pane();
    const f1 = pane.addFolder({ title: 'Motion' });
    f1.addInput(params, 'count', { min: 10, max: 200, step: 1 }).on('change', initAgents);
    f1.addInput(params, 'speed', { min: 0, max: 1 });
    
    const f2 = pane.addFolder({ title: 'Style' });
    f2.addInput(params, 'lineWidth', { min: 0.01, max: 0.5 });
    f2.addInput(params, 'lineColor');
    
    const f3 = pane.addFolder({ title: 'Colors' });
    f3.addInput(params, 'mode', { options: { Manual: 'Manual', Monochrome: 'Monochrome' } });
    f3.addInput(params, 'baseColor');
    f3.addInput(params, 'c1');
    f3.addInput(params, 'c2');
    f3.addInput(params, 'c3');
    f3.addInput(params, 'c4');


    // 3. THE ANIMATION LOOP
    return ({ context, width, height }) => {
        
        // A. Update Color Palette (Dynamic!)
        let palette = [];
        if (params.mode === 'Manual') {
            palette = [ params.c1, params.c2, params.c3, params.c4 ];
        } else {
            const base = params.baseColor;
            palette = [
                base,
                Color.offsetHSL(base, 0, 0, 20).hex,
                Color.offsetHSL(base, 0, 0, 40).hex,
                Color.offsetHSL(base, 0, 0, 60).hex
            ];
        }

        // B. Update Physics (Move the glass shards)
        agents.forEach(agent => {
            // Move
            agent.x += agent.vx * params.speed;
            agent.y += agent.vy * params.speed;

            // Bounce off walls
            if (agent.x <= 0 || agent.x >= width) agent.vx *= -1;
            if (agent.y <= 0 || agent.y >= height) agent.vy *= -1;
        });

        // C. Calculate Geometry (Every Frame!)
        const points = agents.map(a => [a.x, a.y]);
        const delaunay = new Delaunay(points.flat());
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        // D. Draw
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);

        context.lineWidth = params.lineWidth;
        context.strokeStyle = params.lineColor;

        for (let i = 0; i < agents.length; i++) {
            context.beginPath();
            voronoi.renderCell(i, context);
            
            // Fill with the agent's persistent color tag
            // This ensures the red cell STAYS red as it moves
            context.fillStyle = palette[agents[i].colorTag];
            context.fill();
            context.stroke();
        }
    };
};

canvasSketch(sketch, settings);