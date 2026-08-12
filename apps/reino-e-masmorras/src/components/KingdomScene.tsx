import cena from '../assets/reino-cena.webp';

// Pixel-art night skyline for the kingdom overview, matching the style of
// the combat sprites — replaces the earlier procedural canvas drawing.
export function KingdomScene() {
  return (
    <img
      src={cena}
      alt="O Reino sob a lua"
      className="w-full block rounded border border-black/40"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
