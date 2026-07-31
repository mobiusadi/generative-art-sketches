const canvasSketch = require('canvas-sketch');
const { random } = require('canvas-sketch-util');

const settings = {
  dimensions: [ 800, 800 ],
  animate: true
};

class Fragment {
  constructor(pts, color) {
    this.pts = pts;
    this.color = color;
    
    // Calculate the geometric center (home) of the triangle
    this.homeX = (pts[0].x + pts[1].x + pts[2].x) / 3;
    this.homeY = (pts[0].y + pts[1].y + pts[2].y) / 3;
    
    this.x = this.homeX;
    this.y = this.homeY;
    this.vX = 0;
    this.vY = 0;
    
    // Calm Physics Constants (Lessons from Imbrizi)
    this.friction = 0.85; // Lower values create a "thick air" effect
    this.spring = 0.02;   // Lower values result in a slower, more graceful return
    this.scale = 1;
  }

  update(cursor) {
    const dx = cursor.x - this.x;
    const dy = cursor.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const radius = 100; // Smaller radius for more intentional interaction
    
    if (dist < radius) {
      // Repulsion force: pushed away from cursor
      const force = (radius - dist) / radius;
      this.vX -= dx * force * 0.15; // Reduced multiplier for smoother movement
      this.vY -= dy * force * 0.15;
      this.scale = 1 + force * 1.2; // Subtler perspective scale
    } else {
      // Spring force: pull back to home coordinates
      this.vX += (this.homeX - this.x) * this.spring;
      this.vY += (this.homeY - this.y) * this.spring;
      this.scale += (1 - this.scale) * this.spring;
    }

    // Apply Velocity, Friction, and Damping
    this.x += this.vX;
    this.y += this.vY;
    this.vX *= this.friction;
    this.vY *= this.friction;
  }

  draw(context) {
    context.save();
    
    // Translation to current physics position
    context.translate(this.x - this.homeX, this.y - this.homeY);
    
    // Transform around the fragment center
    context.translate(this.homeX, this.homeY);
    context.scale(this.scale, this.scale);
    context.translate(-this.homeX, -this.homeY);

    context.beginPath();
    context.moveTo(this.pts[0].x, this.pts[0].y);
    context.lineTo(this.pts[1].x, this.pts[1].y);
    context.lineTo(this.pts[2].x, this.pts[2].y);
    context.closePath();

    context.fillStyle = this.color;
    context.fill();
    
    // Light stroke to highlight "origami" edges
    context.strokeStyle = 'rgba(255,255,255,0.2)';
    context.lineWidth = 0.5;
    context.stroke();

    context.restore();
  }
}

const sketch = ({ canvas, width, height }) => {
  let fragments = [];
  // Initialize mouse off-screen to prevent immediate explosion
  let cursor = { x: 9999, y: 9999 };

  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    cursor.x = (e.clientX - rect.left) * (width / rect.width);
    cursor.y = (e.clientY - rect.top) * (height / rect.height);
  };

  canvas.addEventListener('mousemove', onMouseMove);

  // Helper to build the logo fragments
  const createGrid = (p1, p2, p3, color, count) => {
    for (let r = 0; r < count; r++) {
      for (let c = 0; c <= r; c++) {
        const getPt = (row, col) => ({
          x: p1.x + (p2.x - p1.x) * (row / count) + (p3.x - p2.x) * (col / count),
          y: p1.y + (p2.y - p1.y) * (row / count) + (p3.y - p2.y) * (col / count)
        });
        
        // Push instances of the Fragment class
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
  
  // Initialize Logo Sections
  createGrid({x: cx - size * 1.5, y: cy}, {x: cx - size * 0.5, y: cy - size}, {x: cx - size * 0.5, y: cy}, '#94ba45', sub);
  createGrid({x: cx - size * 1.5, y: cy}, {x: cx - size * 0.5, y: cy}, {x: cx - size * 0.5, y: cy + size}, '#1e6331', sub);
  createGrid({x: cx + size * 0.5, y: cy}, {x: cx - size * 0.5, y: cy - size}, {x: cx - size * 0.5, y: cy}, '#ffffff', sub);
  createGrid({x: cx - size * 0.5, y: cy}, {x: cx + size * 0.5, y: cy}, {x: cx + size * 0.5, y: cy + size}, '#ffffff', sub);
  createGrid({x: cx + size * 1.5, y: cy}, {x: cx + size * 0.5, y: cy - size}, {x: cx + size * 0.5, y: cy}, '#f7941d', sub);
  createGrid({x: cx + size * 1.5, y: cy}, {x: cx + size * 0.5, y: cy}, {x: cx + size * 0.5, y: cy + size}, '#e87c17', sub);

  return ({ context }) => {
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);

    // Update and draw loop for particles
    fragments.forEach(frag => {
      frag.update(cursor);
      frag.draw(context);
    });
  };
};

canvasSketch(sketch, settings);