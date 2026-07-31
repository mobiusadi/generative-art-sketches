const canvasSketch = require('canvas-sketch');
const { Pane } = require('tweakpane');

const settings = {
  dimensions: [ 800, 800 ],
  animate: true 
};

const params = {
  shatter: 0.8,    // The distance pieces travel
  rotation: 1.5,   // Base rotation
  flutter: 0.5,    // The "origami" wind effect
  subdivisions: 5  
};

const sketch = ({ width, height }) => {
  const fragments = [];
  const pane = new Pane();
  
  pane.addInput(params, 'shatter', { min: 0, max: 3.0 });
  pane.addInput(params, 'rotation', { min: -5, max: 5 });
  pane.addInput(params, 'flutter', { min: 0, max: 2.0 });

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

        const ptsA = [getPt(row, col), getPt(row + 1, col), getPt(row + 1, col + 1)];
        fragments.push({ points: ptsA, color, center: getTriangleCenter(ptsA) });

        if (col < row) {
          const ptsB = [getPt(row, col), getPt(row + 1, col + 1), getPt(row, col + 1)];
          fragments.push({ points: ptsB, color, center: getTriangleCenter(ptsB) });
        }
      }
    }
  };

  const init = () => {
    fragments.length = 0;
    const size = 180; 
    const cx = width / 2;
    const cy = height / 2;

    const pLeft = { x: cx - size * 1.5, y: cy };
    const pRight = { x: cx + size * 1.5, y: cy };
    const leftX = cx - size * 0.5;
    const rightX = cx + size * 0.5;
    const topY = cy - size;
    const botY = cy + size;

    createGridSubdivisions(pLeft, {x: leftX, y: topY}, {x: leftX, y: cy}, '#94ba45', params.subdivisions);
    createGridSubdivisions(pLeft, {x: leftX, y: cy}, {x: leftX, y: botY}, '#1e6331', params.subdivisions);
    createGridSubdivisions({x: rightX, y: cy}, {x: leftX, y: topY}, {x: leftX, y: cy}, '#ffffff', params.subdivisions);
    createGridSubdivisions({x: leftX, y: cy}, {x: rightX, y: cy}, {x: rightX, y: botY}, '#ffffff', params.subdivisions);
    createGridSubdivisions(pRight, {x: rightX, y: topY}, {x: rightX, y: cy}, '#f7941d', params.subdivisions);
    createGridSubdivisions(pRight, {x: rightX, y: cy}, {x: rightX, y: botY}, '#e87c17', params.subdivisions);
  };

  init();

  return ({ context, width, height, time }) => {
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);

    const logoCenter = { x: width / 2, y: height / 2 };

    fragments.forEach((frag, index) => {
      const dx = frag.center.x - logoCenter.x;
      const dy = frag.center.y - logoCenter.y;
      
      const offsetX = dx * params.shatter;
      const offsetY = dy * params.shatter;

      // Unique "flutter" rotation for each piece
      const individualSpin = Math.sin(time + index) * params.flutter;

      context.save();
      context.translate(offsetX, offsetY);
      
      context.translate(frag.center.x, frag.center.y);
      context.rotate((params.shatter * params.rotation) + individualSpin);
      
      // Scale down slightly as they travel away
      const s = 1.0 - (params.shatter * 0.15);
      context.scale(s, s);
      
      context.translate(-frag.center.x, -frag.center.y);

      context.beginPath();
      context.moveTo(frag.points[0].x, frag.points[0].y);
      context.lineTo(frag.points[1].x, frag.points[1].y);
      context.lineTo(frag.points[2].x, frag.points[2].y);
      context.closePath();
      
      context.fillStyle = frag.color;
      context.fill();
      
      // Delicate paper edge
      context.strokeStyle = 'rgba(0,0,0,0.1)';
      context.lineWidth = 0.5;
      context.stroke();
      
      context.restore();
    });
  };
};

canvasSketch(sketch, settings);