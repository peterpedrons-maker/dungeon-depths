// Geleca ships as plain static HTML/CSS/JS (no framework, no bundler) — the
// game references its own assets (images/audio) by flat relative filenames
// (e.g. "ceu.png", "music-vale.mp3"), so the build just has to reproduce
// that same flat layout verbatim under dist/ for the deploy workflow to pick
// up (it only requires `npm run build` to produce a dist/ folder).
const fs = require('fs');
const path = require('path');

const SKIP = new Set(['node_modules', 'dist', 'package.json', 'package-lock.json', 'build.js', '.gitignore']);

const root = __dirname;
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const name of fs.readdirSync(root)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(root, name), path.join(dist, name), { recursive: true });
}
