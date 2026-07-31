const canvasSketch = require('canvas-sketch');
const { random, math } = require('canvas-sketch-util');

const settings = {
  dimensions: [ 800, 800 ],
  animate: true
};

// 1. CLASS DEFINITION: Encapsulating Logic and Drawing
class Fragment {
  constructor(pts, color) {
    this.pts = pts;
    this.color = color;
    
    // Compute Home Position (Center of the triangle)
    this.homeX = (pts[0].x + pts[1].x + pts[2].x) / 3;
    this.homeY = (pts[0].y + pts[1].y + pts[2].y) / 3;
    
    // Current State
    this.x = this.homeX;
    this.y = this.homeY;
    this.vX = 0;
    this.vY = 0;
    
    this.angle = 0;
    this.scale = 1;
    
    // Physics Constants
    this.friction = 0.90; // Damping factor (Lesson from Bruno)
    this.spring = 0.05;   // Pull back to home
  }

  update(mouse) {
    // Distance from mouse
    const dx = mouse.x - this.homeX;
    const dy = mouse.y - this.homeY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const radius = 120;
    
    if (dist < radius) {
      // Repulsion Force
      const force = (radius - dist) / radius;
      this.vX -= dx * force * 0.5;
      this.vY -= dy * force * 0.5;
      this.scale = 1 + force * 2;
      this.angle = force * Math.PI * 0.5;
    } else {
      // Return to Home Force
      this.vX += (this.homeX - this.x) * this.spring;
      this.vY += (this.homeY - this.y) * this.spring;
      this.scale += (1 - this.scale) * this.spring;
      this.angle += (0 - this.angle) * this.spring;
    }

    // Apply Velocity and Friction
    this.x += this.vX;
    this.y += this.vY;
    this.vX *= this.friction;
    this.vY *= this.friction;
  }

  draw(context) {
    context.save();
    
    // Move the whole context to the fragment's current position
    context.translate(this.x - this.homeX, this.y - this.homeY);
    
    // Rotate and Scale around the local center
    context.translate(this.homeX, this.homeY);
    context.rotate(this.angle);
    context.scale(this.scale, this.scale);
    context.translate(-this.homeX, -this.homeY);

    context.beginPath();
    context.moveTo(this.pts[0].x, this.pts[0].y);
    context.lineTo(this.pts[1].x, this.pts[1].y);
    context.lineTo(this.pts[2].x, this.pts[2].y);
    context.closePath();

    context.fillStyle = this.color;
    context.fill();
    
    // Subtle paper edge
    context.strokeStyle = 'rgba(255,255,255,0.2)';
    context.lineWidth = 0.5;
    context.stroke();

    context.restore();
  }
}

const sketch = ({ canvas, width, height }) => {
  let fragments = [];
  // Initialize mouse off-screen (Lesson from Bruno)
  let mouse = { x: 9999, y: 9999 };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (width / rect.width);
    mouse.y = (e.clientY - rect.top) * (height / rect.height);
  });

  // helper to subdivide
  const createGrid = (p1, p2, p3, color, count) => {
    for (let r = 0; r < count; r++) {
      for (let c = 0; c <= r; c++) {
        const getPt = (row, col) => ({
          x: p1.x + (p2.x - p1.x) * (row / count) + (p3.x - p2.x) * (col / count),
          y: p1.y + (p2.y - p1.y) * (row / count) + (p3.y - p2.y) * (col / count)
        });
        fragments.push(new Fragment([getPt(r, c), getPt(r + 1, c), getPt(r + 1, c + 1)], color));
        if (c < r) {
          fragments.push(new Fragment([getPt(r, c), getPt(r + 1, c + 1), getPt(r, c + 1)], color));
        }
      }
    }
  };

  const size = 180;
  const cx = width / 2, cy = height / 2;
  const sub = 6;
  
  // Build Logo
  createGrid({x: cx - size * 1.5, y: cy}, {x: cx - size * 0.5, y: cy - size}, {x: cx - size * 0.5, y: cy}, '#94ba45', sub);
  createGrid({x: cx - size * 1.5, y: cy}, {x: cx - size * 0.5, y: cy}, {x: cx - size * 0.5, y: cy + size}, '#1e6331', sub);
  createGrid({x: cx + size * 0.5, y: cy}, {x: cx - size * 0.5, y: cy - size}, {x: cx - size * 0.5, y: cy}, '#ffffff', sub);
  createGrid({x: cx - size * 0.5, y: cy}, {x: cx + size * 0.5, y: cy}, {x: cx + size * 0.5, y: cy + size}, '#ffffff', sub);
  createGrid({x: cx + size * 1.5, y: cy}, {x: cx + size * 0.5, y: cy - size}, {x: cx + size * 0.5, y: cy}, '#f7941d', sub);
  createGrid({x: cx + size * 1.5, y: cy}, {x: cx + size * 0.5, y: cy}, {x: cx + size * 0.5, y: cy + size}, '#e87c17', sub);

  return ({ context, width, height }) => {
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);

    fragments.forEach(frag => {
      frag.update(mouse);
      frag.draw(context);
    });
  };
};

canvasSketch(sketch, settings);