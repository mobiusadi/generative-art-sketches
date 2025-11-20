const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const { Delaunay } = require('d3-delaunay');
const Tweakpane = require('tweakpane'); // Import the UI library

const settings = {
    dimensions: [ 1080, 1080 ],
    animate: true
};

// --- 1. PARAMETRIC SETTINGS ---
// These are the variables we will control with the sliders
const params = {
    count: 40,
    speed: 1,
    background: '#000000',
    // Voronoi (Cells)
    showVoronoi: true,
    voronoiColor: '#333333',
    voronoiWidth: 2,
    // Delaunay (Triangles)
    showDelaunay: true,
    delaunayColor: '#00ffff',
    delaunayWidth: 2,
    // Dots
    showDots: true,
    dotColor: '#ffffff',
    dotSize: 4
};

const sketch = ({ width, height }) => {
    // Array to hold our agents
    let agents = [];

    // --- 2. AGENT GENERATOR ---
    // We make this a function so the Slider can call it to reset the simulation
    const createAgents = () => {
        agents = [];
        for (let i = 0; i < params.count; i++) {
            const x = random.range(0, width);
            const y = random.range(0, height);
            agents.push(new Agent(x, y));
        }
    };

    // Initial creation
    createAgents();

    // --- 3. SETUP TWEAKPANE ---
    const pane = new Tweakpane.Pane();
    
    // Organize into folders for cleanliness
    const f1 = pane.addFolder({ title: 'Simulation' });
    f1.addInput(params, 'count', { min: 5, max: 200, step: 1 }).on('change', createAgents); // Regenerate on change
    f1.addInput(params, 'speed', { min: 0, max: 5 });
    f1.addInput(params, 'background');

    const f2 = pane.addFolder({ title: 'Voronoi (Cells)' });
    f2.addInput(params, 'showVoronoi');
    f2.addInput(params, 'voronoiColor');
    f2.addInput(params, 'voronoiWidth', { min: 1, max: 10 });

    const f3 = pane.addFolder({ title: 'Delaunay (Triangles)' });
    f3.addInput(params, 'showDelaunay');
    f3.addInput(params, 'delaunayColor');
    f3.addInput(params, 'delaunayWidth', { min: 1, max: 10 });
    
    const f4 = pane.addFolder({ title: 'Dots' });
    f4.addInput(params, 'showDots');
    f4.addInput(params, 'dotSize', { min: 1, max: 20 });


    return ({ context, width, height }) => {
        // Use param for background color
        context.fillStyle = params.background;
        context.fillRect(0, 0, width, height);

        // Update Positions
        agents.forEach(agent => {
            agent.update();
            agent.bounce(width, height);
        });

        // Prepare data for Delaunay
        const points = [];
        agents.forEach(agent => {
            points.push(agent.pos.x, agent.pos.y);
        });

        // Calculate Geometry
        const delaunay = new Delaunay(points);
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        // --- DRAWING ---

        // A. Draw Voronoi Cells
        if (params.showVoronoi) {
            context.beginPath();
            voronoi.render(context);
            context.strokeStyle = params.voronoiColor;
            context.lineWidth = params.voronoiWidth;
            context.stroke();
        }

        // B. Draw Delaunay Triangles
        if (params.showDelaunay) {
            context.beginPath();
            delaunay.render(context);
            context.strokeStyle = params.delaunayColor;
            context.lineWidth = params.delaunayWidth;
            context.stroke();
        }

        // C. Draw Dots
        if (params.showDots) {
            context.fillStyle = params.dotColor;
            agents.forEach(agent => {
                context.beginPath();
                context.arc(agent.pos.x, agent.pos.y, params.dotSize, 0, Math.PI * 2);
                context.fill();
            });
        }
    };
};

canvasSketch(sketch, settings);

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Agent {
    constructor(x, y) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(random.range(-1, 1), random.range(-1, 1));
    }

    bounce(width, height) {
        if (this.pos.x <= 0 || this.pos.x >= width)  this.vel.x *= -1;
        if (this.pos.y <= 0 || this.pos.y >= height) this.vel.y *= -1;
    }

    update() {
        // Use params.speed to control velocity dynamically
        this.pos.x += this.vel.x * params.speed;
        this.pos.y += this.vel.y * params.speed;
    }
}