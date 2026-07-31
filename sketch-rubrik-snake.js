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

        addFrag(
          [getPt(p1, p2, p3, r, c), getPt(p1, p2, p3, r + 1, c), getPt(p1, p2, p3, r + 1, c + 1)],
          [getPt(t1, t2, t3, r, c), getPt(t1, t2, t3, r + 1, c), getPt(t1, t2, t3, r + 1, c + 1)]
        );

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
    const unit = 32; // Defined grid unit
    const cx = width / 2;
    const cy = height / 2;
    const sub = 6;

    // --- LOGO COORDINATES (State A) ---
    const l_Center = { x: cx, y: cy };
    const l_TopL = { x: cx - unit * 5, y: cy - unit * 5 };
    const l_BotL = { x: cx - unit * 5, y: cy + unit * 5 };
    const l_TopR = { x: cx + unit * 5, y: cy - unit * 5 };
    const l_BotR = { x: cx + unit * 5, y: cy + unit * 5 };
    const l_FarL = { x: cx - unit * 10, y: cy };
    const l_FarR = { x: cx + unit * 10, y: cy };

    // --- TRAIN COORDINATES (State B: Rearranged) ---
    // The base level where the train sits
    const t_Floor = cy + unit * 4; 
    
    // Front Section (Green) - Unfolded down and out
    const t_G1 = { x: cx - unit * 10, y: t_Floor };
    const t_G2 = { x: cx - unit * 5, y: t_Floor - unit * 5 };
    const t_G3 = { x: cx - unit * 5, y: t_Floor };

    // Back Section (Orange) - Rotated CCW and shifted 5 units left
    const t_O1 = { x: cx + unit * 5, y: t_Floor - unit * 5 };
    const t_O2 = { x: cx + unit * 10, y: t_Floor };
    const t_O3 = { x: cx + unit * 5, y: t_Floor };

    // Middle Engine (White) - Rotated and shifted up 5 units
    const t_W_Top_L = { x: cx - unit * 5, y: t_Floor - unit * 5 };
    const t_W_Top_R = { x: cx + unit * 5, y: t_Floor - unit * 5 };
    const t_W_Mid = { x: cx, y: t_Floor - unit * 5 };
    const t_W_Bot_L = { x: cx - unit * 5, y: t_Floor };
    const t_W_Bot_R = { x: cx + unit * 5, y: t_Floor };

    // 1. Green Section (Pivot: Logo TopL)
    createMorphGrid(l_FarL, l_TopL, l_Center, t_G1, t_G2, {x: cx, y: t_Floor - unit * 5}, '#94ba45', sub);
    createMorphGrid(l_FarL, l_Center, l_BotL, t_G1, {x: cx, y: t_Floor - unit * 5}, t_G3, '#1e6331', sub);

    // 2. Orange Section (Pivot: Logo TopR + 5 Left)
    createMorphGrid(l_FarR, l_TopR, l_Center, t_O2, t_O1, {x: cx, y: t_Floor - unit * 5}, '#f7941d', sub);
    createMorphGrid(l_FarR, l_Center, l_BotR, t_O2, {x: cx, y: t_Floor - unit * 5}, t_O3, '#e87c17', sub);

    // 3. White Section (Engine Lock)
    createMorphGrid(l_TopL, l_TopR, l_Center, t_W_Top_L, t_W_Top_R, t_W_Mid, '#ffffff', sub);
    createMorphGrid(l_BotL, l_Center, l_BotR, t_W_Bot_L, t_W_Mid, t_W_Bot_R, '#ffffff', sub);
  };

  init();

  return ({ context, width, height }) => {
    context.fillStyle = '#eeeeee';
    context.fillRect(0, 0, width, height);

    // Interpolation (Mechanical Damping)
    const targetMorph = math.clamp(math.mapRange(mouse.y, 100, 700, 0, 1), 0, 1);
    globalMorph = math.lerp(globalMorph, targetMorph, 0.07);

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
      
      context.strokeStyle = 'rgba(0,0,0,0.08)';
      context.stroke();
    });
  };
};

canvasSketch(sketch, settings);