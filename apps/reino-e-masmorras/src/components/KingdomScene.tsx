import { useEffect, useRef } from 'react';

// A static-feeling night skyline for the kingdom overview: moon, castle
// silhouette, a couple of flickering torches, drifting fog. No external art —
// same drawing approach as the dungeon combat panel, just decorative instead
// of interactive.
export function KingdomScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d')!;
    let raf: number;

    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height;
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#100d0a');
      sky.addColorStop(1, '#2a2013');
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h);

      // moon
      const moonX = w * 0.78, moonY = h * 0.22, moonR = 28;
      g.save();
      g.shadowBlur = 30; g.shadowColor = 'rgba(255,240,210,0.55)';
      g.fillStyle = '#f5ecd8';
      g.beginPath(); g.arc(moonX, moonY, moonR, 0, Math.PI * 2); g.fill();
      g.restore();
      g.fillStyle = 'rgba(180,160,120,0.25)';
      g.beginPath(); g.arc(moonX - 9, moonY - 6, 5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(moonX + 6, moonY + 9, 3.5, 0, Math.PI * 2); g.fill();

      // stars
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 53.7) % w;
        const sy = (i * 91.3) % (h * 0.55);
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + i));
        g.globalAlpha = tw * 0.6;
        g.fillRect(sx, sy, 1.5, 1.5);
      }
      g.globalAlpha = 1;

      // distant hills
      g.fillStyle = '#191207';
      g.beginPath();
      g.moveTo(0, h * 0.62);
      g.quadraticCurveTo(w * 0.25, h * 0.5, w * 0.5, h * 0.6);
      g.quadraticCurveTo(w * 0.75, h * 0.68, w, h * 0.56);
      g.lineTo(w, h); g.lineTo(0, h);
      g.fill();

      // castle silhouette
      const cx = w * 0.42, groundY = h * 0.72;
      g.fillStyle = '#0f0b07';
      // main keep
      g.fillRect(cx - 40, groundY - 70, 80, 70);
      // towers
      g.fillRect(cx - 58, groundY - 95, 22, 95);
      g.fillRect(cx + 36, groundY - 90, 22, 90);
      // battlements
      for (let i = -1; i <= 1; i++) g.fillRect(cx - 6 + i * 20, groundY - 78, 10, 8);
      for (let i = 0; i < 3; i++) g.fillRect(cx - 58 + i * 8, groundY - 103, 5, 8);
      for (let i = 0; i < 3; i++) g.fillRect(cx + 36 + i * 8, groundY - 98, 5, 8);
      // gate
      g.fillStyle = '#231a0f';
      g.beginPath(); g.roundRect(cx - 10, groundY - 24, 20, 24, [6, 6, 0, 0]); g.fill();

      // torches either side of the gate
      const flick = 0.55 + Math.sin(t / 140) * 0.2;
      g.save();
      g.shadowBlur = 14; g.shadowColor = `rgba(255,150,60,${flick})`;
      g.fillStyle = '#ffb347';
      g.beginPath(); g.arc(cx - 16, groundY - 20, 2.5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx + 16, groundY - 20, 2.5, 0, Math.PI * 2); g.fill();
      g.restore();

      // ground
      g.fillStyle = '#120e08';
      g.fillRect(0, groundY, w, h - groundY);

      // drifting fog bands
      g.fillStyle = 'rgba(200,180,140,0.05)';
      for (let i = 0; i < 3; i++) {
        const fx = ((t / 60 + i * 220) % (w + 200)) - 100;
        g.beginPath();
        g.ellipse(fx, groundY + 14 + i * 10, 140, 16, 0, 0, Math.PI * 2);
        g.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={640} height={220} className="w-full block rounded border border-black/40" />;
}
