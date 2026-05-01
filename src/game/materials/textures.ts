import * as THREE from "three";
import { makeTexture } from "./ps1Material";

/** Stone wall texture - dark, mossy. */
export function stoneWallTex(): THREE.Texture {
  return makeTexture(128, (ctx, s) => {
    ctx.fillStyle = "#3a3530";
    ctx.fillRect(0, 0, s, s);
    // brick pattern
    const bh = 16;
    const bw = 32;
    for (let y = 0; y < s; y += bh) {
      const offset = (y / bh) % 2 === 0 ? 0 : bw / 2;
      for (let x = -bw; x < s + bw; x += bw) {
        const px = x + offset;
        const shade = 40 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 10})`;
        ctx.fillRect(px + 1, y + 1, bw - 2, bh - 2);
        // moss spots
        if (Math.random() < 0.15) {
          ctx.fillStyle = `rgba(60,80,40,0.6)`;
          ctx.fillRect(px + Math.random() * bw, y + Math.random() * bh, 3, 3);
        }
      }
    }
    // grime
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  });
}

export function floorTex(): THREE.Texture {
  return makeTexture(128, (ctx, s) => {
    ctx.fillStyle = "#2a2520";
    ctx.fillRect(0, 0, s, s);
    const tile = 32;
    for (let y = 0; y < s; y += tile) {
      for (let x = 0; x < s; x += tile) {
        const shade = 30 + Math.floor(Math.random() * 25);
        ctx.fillStyle = `rgb(${shade},${shade - 3},${shade - 6})`;
        ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
      }
    }
    // cracks
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(0,0,0,0.4)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, Math.random() * s);
      ctx.lineTo(Math.random() * s, Math.random() * s);
      ctx.stroke();
    }
    // grime
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  });
}

export function ceilingTex(): THREE.Texture {
  return makeTexture(128, (ctx, s) => {
    ctx.fillStyle = "#1a1612";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
    // wooden beams
    ctx.fillStyle = "#241a14";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect((i * s) / 4, 0, 4, s);
    }
  });
}

export function woodTex(): THREE.Texture {
  return makeTexture(64, (ctx, s) => {
    ctx.fillStyle = "#3a2818";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 2) {
      const shade = 40 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${shade + 10},${shade - 5},${shade - 15})`;
      ctx.fillRect(0, i, s, 1);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, Math.random() * 4);
    }
  });
}

export function metalTex(): THREE.Texture {
  return makeTexture(64, (ctx, s) => {
    ctx.fillStyle = "#2a2a30";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      const shade = 40 + Math.floor(Math.random() * 60);
      ctx.fillStyle = `rgba(${shade},${shade},${shade + 5},0.6)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
    // rust
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(120,60,30,${Math.random() * 0.5})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  });
}

export function statueTex(): THREE.Texture {
  return makeTexture(64, (ctx, s) => {
    ctx.fillStyle = "#5a5852";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  });
}
