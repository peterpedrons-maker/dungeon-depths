// Simple geometric silhouettes — no pixel art here, just shapes and color,
// enough to read the fight without competing with the text-heavy rest of the game.
import { ClassId, EnemyShape } from '../types/game';

function humanoid(
  g: CanvasRenderingContext2D, cx: number, cy: number, color: string,
  bob: number, flip: boolean, lean: number, headR: number, bodyW: number, bodyH: number,
): void {
  const dir = flip ? -1 : 1;
  const y = cy + bob;
  g.save();
  g.translate(cx, y);
  g.scale(dir, 1);
  g.rotate(lean * 0.25);
  // legs
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(-bodyW * 0.35, bodyH * 0.15, bodyW * 0.28, bodyH * 0.4);
  g.fillRect(bodyW * 0.07, bodyH * 0.15, bodyW * 0.28, bodyH * 0.4);
  // body
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(-bodyW / 2, -bodyH * 0.1, bodyW, bodyH * 0.35, 6);
  g.fill();
  // head
  g.beginPath();
  g.arc(0, -bodyH * 0.1 - headR * 0.6, headR, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function drawPlayer(g: CanvasRenderingContext2D, cx: number, cy: number, classId: ClassId, color: string, bob: number, lean: number): void {
  humanoid(g, cx, cy, color, bob, false, lean, 11, 26, 46);
  // class trinket
  g.save();
  g.translate(cx, cy + bob);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  if (classId === 'mago' || classId === 'clerigo') {
    g.fillRect(16, -30, 3, 34); // staff
  } else if (classId === 'arqueiro') {
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 2;
    g.beginPath(); g.arc(18, -10, 12, -0.9, 0.9); g.stroke();
  } else {
    g.fillRect(15, -26, 4, 22); // sword
  }
  g.restore();
}

export function drawEnemy(g: CanvasRenderingContext2D, cx: number, cy: number, shape: EnemyShape, color: string, bob: number, lean: number): void {
  switch (shape) {
    case 'goblin':
      humanoid(g, cx, cy, color, bob, true, lean, 8, 20, 34);
      break;
    case 'skeleton':
      humanoid(g, cx, cy, color, bob, true, lean, 9, 18, 40);
      break;
    case 'orc':
      humanoid(g, cx, cy, color, bob, true, lean, 12, 32, 46);
      break;
    case 'troll':
      humanoid(g, cx, cy, color, bob, true, lean, 15, 40, 56);
      break;
    case 'wolf': {
      const y = cy + bob;
      g.save(); g.translate(cx, y); g.rotate(lean * 0.15);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-16, 10, 8, 14); g.fillRect(10, 10, 8, 14);
      g.fillStyle = color;
      g.beginPath(); g.roundRect(-24, -8, 48, 20, 8); g.fill();
      g.beginPath(); g.moveTo(20, -6); g.lineTo(34, -2); g.lineTo(20, 6); g.fill();
      g.beginPath(); g.moveTo(-24, -14); g.lineTo(-18, -22); g.lineTo(-12, -14); g.fill();
      g.restore();
      break;
    }
    case 'dragon': {
      const y = cy + bob;
      g.save(); g.translate(cx, y); g.rotate(lean * 0.15);
      g.fillStyle = color;
      g.beginPath(); g.roundRect(-30, -14, 60, 30, 12); g.fill();
      g.beginPath(); g.moveTo(26, -10); g.lineTo(48, -2); g.lineTo(26, 10); g.fill(); // head/snout
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath(); g.moveTo(-14, -14); g.lineTo(0, -34); g.lineTo(10, -14); g.fill(); // wing
      g.beginPath(); g.moveTo(-30, 4); g.lineTo(-48, 12); g.lineTo(-30, 14); g.fill(); // tail
      g.restore();
      break;
    }
    case 'horror': {
      const y = cy + bob;
      g.save(); g.translate(cx, y); g.rotate(lean * 0.15);
      g.fillStyle = color;
      g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.beginPath();
        g.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
        g.lineTo(Math.cos(a) * 40, Math.sin(a) * 40);
        g.lineWidth = 5; g.strokeStyle = color; g.stroke();
      }
      g.fillStyle = '#ff5050';
      g.beginPath(); g.arc(-7, -4, 3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(7, -4, 3, 0, Math.PI * 2); g.fill();
      g.restore();
      break;
    }
  }
}
