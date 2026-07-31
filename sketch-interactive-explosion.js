const canvasSketch = require('canvas-sketch');
const { random, math } = require('canvas-sketch-util');

const settings = {
  dimensions: [ 800, 800 ],
  animate: true
};

const sketch = ({ canvas, width, height }) => {
  let fragments = [];
  let mouse = { x: -1000, y: -1000 }; // Start mouse off-screen

  // Track mouse movement
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (width / rect.width);
    mouse.y = (e.clientY - rect.top) * (height / rect.height);
  });

  const getTriangleCenter = (pts) => ({
    x: (pts[0].x + pts[1].x + pts[2].x) / 3,
    y: (pts[0].y + pts[1].y + pts[2].y) / 3
  });

  const createGridSubdivisions = (p1, p2, p3, color, count) => {
    for (let row = 0; row < count; row++) {
      for (let col = 0; col <= row; col++) {
        const getPt = (r, c) => ({
          x: p1.x + (p2.x - p1.x) * (r / count) + (p3.x - p2.x) * (c / count),
          y: p1.y + (p2.y - p1.y) * (r / count) + (p3.y - p2.y) * (c / count)
        });

        const addFrag = (pts) => {
          const center = getTriangleCenter(pts);
          fragments.push({
            points: pts,
            color,
            homeX: center.x,
            homeY: center.y,
            currentX: center.x,
            currentY: center.y,
            angle: 0,
            rotationSpeed: random.range(-0.1, 0.1)
          });
        };

        addFrag([getPt(row, col), getPt(row + 1, col), getPt(row + 1, col + 1)]);
        if (col < row) {
          addFrag([getPt(row, col), getPt(row + 1, col + 1), getPt(row, col + 1)]);
        }
      }
    }
  };

  const init = () => {
    const size = 180;
    const cx = width / 2;
    const cy = height / 2;
    const subdivisions = 6;

    const pLeft = { x: cx - size * 1.5, y: cy };
    const pRight = { x: cx + size * 1.5, y: cy };
    const leftX = cx - size * 0.5, rightX = cx + size * 0.5;
    const topY = cy - size, botY = cy + size;

    createGridSubdivisions(pLeft, {x: leftX, y: topY}, {x: leftX, y: cy}, '#94ba45', subdivisions);
    createGridSubdivisions(pLeft, {x: leftX, y: cy}, {x: leftX, y: botY}, '#1e6331', subdivisions);
    createGridSubdivisions({x: rightX, y: cy}, {x: leftX, y: topY}, {x: leftX, y: cy}, '#ffffff', subdivisions);
    createGridSubdivisions({x: leftX, y: cy}, {x: rightX, y: cy}, {x: rightX, y: botY}, '#ffffff', subdivisions);
    createGridSubdivisions(pRight, {x: rightX, y: topY}, {x: rightX, y: cy}, '#f7941d', subdivisions);
    createGridSubdivisions(pRight, {x: rightX, y: cy}, {x: rightX, y: botY}, '#e87c17', subdivisions);
  };

  init();

  return ({ context, width, height, time }) => {
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);

    fragments.forEach(frag => {
      // 1. Calculate distance from cursor
      const dxMouse = mouse.x - frag.homeX;
      const dyMouse = mouse.y - frag.homeY;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

      // 2. Define Interaction Radius
      const radius = 150;
      let targetX = frag.homeX;
      let targetY = frag.homeY;
      let targetScale = 1.0;
      let targetAngle = 0;

      if (distMouse < radius) {
        // Repulsion logic
        const force = (radius - distMouse) / radius;
        targetX = frag.homeX - dxMouse * force * 2.5;
        targetY = frag.homeY - dyMouse * force * 2.5;
        targetScale = 1.0 + force * 1.5; // Scale up for perspective illusion
        targetAngle = force * Math.PI;
      }

      // 3. Smoothly move toward target (Easing)
      frag.currentX += (targetX - frag.currentX) * 0.1;
      frag.currentY += (targetY - frag.currentY) * 0.1;
      frag.angle += (targetAngle - frag.angle) * 0.1;

      context.save();
      // Move the piece
      context.translate(frag.currentX - frag.homeX, frag.currentY - frag.homeY);
      
      // Transform around center
      context.translate(frag.homeX, frag.homeY);
      context.rotate(frag.angle);
      context.scale(targetScale, targetScale);
      context.translate(-frag.homeX, -frag.homeY);

      context.beginPath();
      context.moveTo(frag.points[0].x, frag.points[0].y);
      context.lineTo(frag.points[1].x, frag.points[1].y);
      context.lineTo(frag.points[2].x, frag.points[2].y);
      context.closePath();

      context.fillStyle = frag.color;
      context.fill();
      
      // Origami edge highlight
      context.strokeStyle = 'rgba(255,255,255,0.4)';
      context.lineWidth = 0.5;
      context.stroke();

      context.restore();
    });
  };
};

canvasSketch(sketch, settings);