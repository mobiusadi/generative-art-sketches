const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const Tweakpane = require('tweakpane');

const settings = {
    dimensions: 'A3',
    animate: true, // We need this to spin the building
    units: 'cm',
    pixelsPerInch: 300
};

const params = {
    // 1. Building Dimensions
    radius: 6,
    height: 14,
    louverWidth: 1.5,
    count: 40,        // How many panels?
    
    // 2. Solar Physics
    maxTilt: 90,      // Maximum twist (Vertical)
    phaseShift: 0,    // Rotate the "Sun" position
    
    // 3. Camera / View
    rotationSpeed: 0.2,
    viewAngle: 30,    // Tilt the camera down
    
    // 4. Style
    lineColor: '#000000',
    fillColor: '#81ecec' // Cyan glass
};

const sketch = ({ width, height }) => {
    
    // Setup Dashboard
    const pane = new Tweakpane.Pane();
    pane.addInput(params, 'radius', { min: 1, max: 10 });
    pane.addInput(params, 'louverWidth', { min: 0.5, max: 5 });
    pane.addInput(params, 'count', { min: 10, max: 100, step: 1 });
    
    const fSolar = pane.addFolder({ title: 'Solar Logic' });
    fSolar.addInput(params, 'maxTilt', { min: 0, max: 90 });
    fSolar.addInput(params, 'phaseShift', { min: -180, max: 180 });
    
    const fView = pane.addFolder({ title: 'View' });
    fView.addInput(params, 'viewAngle', { min: 0, max: 90 });

    // State for animation
    let currentRotation = 0;

    return ({ context, width, height }) => {
        
        // A. CLEAR SCREEN
        context.fillStyle = '#f7f1e3';
        context.fillRect(0, 0, width, height);
        
        const cx = width / 2;
        const cy = height / 2;

        // Update Spin
        currentRotation += params.rotationSpeed * 0.05;

        // --- B. THE "FAKE 3D" ENGINE ---
        // This function takes a 3D point and returns a 2D pixel location
        const project = (x, y, z) => {
            const scale = 1; // Zoom factor
            
            // 1. Rotate around Y axis (Turntable spin)
            const rot = currentRotation;
            const rx = x * Math.cos(rot) - z * Math.sin(rot);
            const rz = x * Math.sin(rot) + z * Math.cos(rot);
            
            // 2. Apply Camera Tilt (Isometric-ish)
            const tilt = math.degToRad(params.viewAngle);
            const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
            
            // 3. Center it on paper
            return {
                x: cx + rx * scale,
                y: cy + ry * scale 
            };
        };

        // --- C. GENERATE GEOMETRY ---
        const points = [];

        for (let i = 0; i <= params.count; i++) {
            // Normalize step (0 to 1)
            const t = i / params.count; 
            const angle = t * Math.PI * 2; // Angle around cylinder

            // 1. CALCULATE TWIST
            // This is the "Solar Logic". 
            // We map the compass angle (plus phase shift) to a tilt angle.
            // Using Math.abs(Math.sin(...)) creates the symmetrical "Hourglass" twist.
            const solarAngle = angle + math.degToRad(params.phaseShift);
            const twistDeg = Math.abs(Math.sin(solarAngle)) * params.maxTilt;
            const twistRad = math.degToRad(twistDeg);

            // 2. INNER POINT (On the Cylinder Wall)
            // x = cos, z = sin (Circle math)
            const ix = Math.cos(angle) * params.radius;
            const iz = Math.sin(angle) * params.radius;
            const iy = 0; // Center height

            // 3. OUTER POINT (Tip of the Louver)
            // We stick out by 'louverWidth', then rotate that stick up/down by 'twistRad'
            const w = params.louverWidth;
            
            // Horizontal extension shrinks as we tilt up
            const wH = w * Math.cos(twistRad); 
            // Vertical lift (z-height relative to louver)
            const wV = w * Math.sin(twistRad);

            const ox = Math.cos(angle) * (params.radius + wH);
            const oz = Math.sin(angle) * (params.radius + wH);
            const oy = wV; 

            points.push({ inner: {x:ix, y:iy, z:iz}, outer: {x:ox, y:oy, z:oz} });
        }

        // --- D. DRAW LOOP ---
        context.lineWidth = 0.05;
        context.strokeStyle = params.lineColor;
        context.lineJoin = 'round';

        // Connect every point to its neighbor to form Quads
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];

            // Project the 4 corners of the panel
            const v1 = project(p1.inner.x, p1.inner.y, p1.inner.z);
            const v2 = project(p2.inner.x, p2.inner.y, p2.inner.z);
            const v3 = project(p2.outer.x, p2.outer.y, p2.outer.z); // Note: twisted up/down
            const v4 = project(p1.outer.x, p1.outer.y, p1.outer.z);

            // Fake "Lighting"
            // If the outer tip is high (vertical louver), make it darker
            const twistHeight = Math.abs(p1.outer.y);
            const shade = 1 - (twistHeight / params.louverWidth) * 0.6; // 0.0 to 1.0
            
            context.fillStyle = `rgba(129, 236, 236, ${shade})`;
            
            context.beginPath();
            context.moveTo(v1.x, v1.y);
            context.lineTo(v2.x, v2.y);
            context.lineTo(v3.x, v3.y);
            context.lineTo(v4.x, v4.y);
            context.closePath();
            context.fill();
            context.stroke();
        }
    };
};

canvasSketch(sketch, settings);