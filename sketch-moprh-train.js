const canvasSketch = require('canvas-sketch');
const { math } = require('canvas-sketch-util');

const settings = {
  dimensions: [ 800, 800 ],
  animate: true
};

const sketch = ({ canvas, width, height }) => {
  let fragments = [];
  let mouse = { x: 9999, y: 9999 };
  let globalMorph = 0;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (width / rect.width);
    mouse.y = (e.clientY - rect.top) * (height / rect.height);
  });

  const createMorphGrid = (p1, p2, p3, t1, t2, t3, color, count) => {
    for (let r = 0; r < count; r++) {
      for (let c = 0; c <= r; c++) {
        const getPt = (pa, pb, pc, row, col) => ({
          x: pa.x + (pb.x - pa.x) * (row / count) + (pc.x - pb.x) * (col / count),
          y: pa.y + (pb.y - pa.y) * (row / count) + (pc.y - pb.y) * (col / count)
        });

        const addFrag = (lPts, tPts) => {
          fragments.push({ logoPoints: lPts, trainPoints: tPts, color });
        };

        // Upright Triangles
        addFrag(
          [getPt(p1, p2, p3, r, c), getPt(p1, p2, p3, r + 1, c), getPt(p1, p2, p3, r + 1, c + 1)],
          [getPt(t1, t2, t3, r, c), getPt(t1, t2, t3, r + 1, c), getPt(t1, t2, t3, r + 1, c + 1)]
        );

        // Inverted Triangles
        if (c < r) {
          addFrag(
            [getPt(p1, p2, p3, r, c), getPt(p1, p2, p3, r + 1, c + 1), getPt(p1, p2, p3, r, c + 1)],
            [getPt(t1, t2, t3, r, c), getPt(t1, t2, t3, r + 1, c + 1), getPt(t1, t2, t3, r, c + 1)]
          );
        }
      }
    }
  };

  const init = () => {
    fragments = [];
    const unit = 35; // Size of one grid unit
    const cx = width / 2;
    const cy = height / 2;
    const sub = 6;

    // Logo Coordinates
    const l_Center = { x: cx, y: cy };
    const l_TopL = { x: cx - unit * 5, y: cy - unit * 5 };
    const l_BotL = { x: cx - unit * 5, y: cy + unit * 5 };
    const l_TopR = { x: cx + unit * 5, y: cy - unit * 5 };
    const l_BotR = { x: cx + unit * 5, y: cy + unit * 5 };
    const l_FarL = { x: cx - unit * 10, y: cy };
    const l_FarR = { x: cx + unit * 10, y: cy };

    // Train Coordinates (The Rearrangement)
    const t_BaseY = cy + unit * 3; // The track line
    const t_FarL = { x: cx - unit * 10, y: t_BaseY };
    const t_FarR = { x: cx + unit * 10, y: t_BaseY };
    const t_TopL = { x: cx - unit * 5, y: t_BaseY - unit * 5 };
    const t_TopR = { x: cx + unit * 5, y: t_BaseY - unit * 5 };
    const t_MidL = { x: cx - unit * 5, y: t_BaseY };
    const t_MidR = { x: cx + unit * 5, y: t_BaseY };
    const t_CenterTop = { x: cx, y: t_BaseY - unit * 5 };

    // 1. GREEN (Front/Cowcatcher) - Rotated Clockwise
    createMorphGrid(l_FarL, l_TopL, l_Center, t_FarL, t_TopL, t_MidL, '#94ba45', sub);
    createMorphGrid(l_FarL, l_Center, l_BotL, t_FarL, t_MidL, t_FarL, '#1e6331', sub);

    // 2. ORANGE (Back/Cab) - Rotated Counter-Clockwise
    createMorphGrid(l_FarR, l_TopR, l_Center, t_FarR, t_TopR, t_MidR, '#f7941d', sub);
    createMorphGrid(l_FarR, l_Center, l_BotR, t_FarR, t_MidR, t_FarR, '#e87c17', sub);

    // 3. WHITE (Engine/Boiler) - Shifted Upward
    createMorphGrid(l_TopL, l_TopR, l_Center, t_TopL, t_TopR, t_CenterTop, '#ffffff', sub);
    createMorphGrid(l_BotL, l_Center, l_BotR, t_MidL, t_CenterTop, t_MidR, '#ffffff', sub);
  };

  init();

  return ({ context, width, height }) => {
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);

    // Smooth Damped Morph
    const targetMorph = math.clamp(math.mapRange(mouse.y, 200, 600, 0, 1), 0, 1);
    globalMorph = math.lerp(globalMorph, targetMorph, 0.06);

    fragments.forEach(frag => {
      context.beginPath();
      for (let j = 0; j < 3; j++) {
        const x = math.lerp(frag.logoPoints[j].x, frag.trainPoints[j].x, globalMorph);
        const y = math.lerp(frag.logoPoints[j].y, frag.trainPoints[j].y, globalMorph);
        if (j === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fillStyle = frag.color;
      context.fill();
      
      context.strokeStyle = 'rgba(0,0,0,0.05)';
      context.stroke();
    });
  };
};

canvasSketch(sketch, settings);