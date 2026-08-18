import { CosmeticDef } from '../types/game';

// Loja de Prestígio — puramente cosmético: recolore o avatar/nome do herói
// na TopBar (ver GameShell.tsx/TopBar.tsx), sem nenhum efeito em combate.
// Preço sobe com o quão "especial" a cor é — tons planos são baratos, tons
// metálicos/joia são o topo da lista. Nenhuma arte nova necessária: é só
// uma cor aplicada via CSS sobre o mesmo círculo/moldura que já existe.
export const COSMETICS: CosmeticDef[] = [
  // ── Tons simples ──
  { id: 'carmesim', name: 'Tintura Carmesim', color: '#b8323f', cost: 20 },
  { id: 'cobalto', name: 'Tintura Cobalto', color: '#2f5fa8', cost: 20 },
  { id: 'musgo', name: 'Tintura Musgo', color: '#4f7a3a', cost: 20 },
  { id: 'ambar', name: 'Tintura Âmbar', color: '#c9861f', cost: 20 },
  { id: 'ametista', name: 'Tintura Ametista', color: '#7a4fa8', cost: 20 },
  { id: 'ardosia', name: 'Tintura Ardósia', color: '#5a6a78', cost: 20 },
  { id: 'coral', name: 'Tintura Coral', color: '#d4664f', cost: 20 },
  { id: 'jade', name: 'Tintura Jade', color: '#2f9a6f', cost: 20 },

  // ── Tons intensos ──
  { id: 'sangue', name: 'Tintura Sangue-de-Dragão', color: '#7a1418', cost: 45 },
  { id: 'abissal', name: 'Tintura Abissal', color: '#12233a', cost: 45 },
  { id: 'venenosa', name: 'Tintura Venenosa', color: '#5a9a1f', cost: 45 },
  { id: 'brasa', name: 'Tintura Brasa', color: '#e0611f', cost: 45 },
  { id: 'gelida', name: 'Tintura Gélida', color: '#5fc9d8', cost: 45 },
  { id: 'sombria', name: 'Tintura Sombria', color: '#3a2a4a', cost: 45 },
  { id: 'rosa-espectral', name: 'Tintura Rosa Espectral', color: '#c95fa8', cost: 45 },
  { id: 'lima-fantasma', name: 'Tintura Lima Fantasma', color: '#9ad84f', cost: 45 },

  // ── Metálicos ──
  { id: 'prata', name: 'Acabamento Prateado', color: '#c4c8ce', cost: 80 },
  { id: 'bronze', name: 'Acabamento Bronzeado', color: '#a5732e', cost: 80 },
  { id: 'cobre', name: 'Acabamento Cobreado', color: '#b5622f', cost: 80 },
  { id: 'aco-negro', name: 'Acabamento Aço Negro', color: '#2a2a30', cost: 80 },
  { id: 'ouro-rosa', name: 'Acabamento Ouro-Rosa', color: '#c9848a', cost: 90 },
  { id: 'platina', name: 'Acabamento Platinado', color: '#d8dade', cost: 90 },

  // ── Joias / topo de linha ──
  { id: 'dourada', name: 'Tintura Dourada Real', color: '#d8a531', cost: 150 },
  { id: 'esmeralda', name: 'Tintura Esmeralda Real', color: '#1f9a5a', cost: 150 },
  { id: 'safira', name: 'Tintura Safira Real', color: '#2f5fc9', cost: 150 },
  { id: 'rubi', name: 'Tintura Rubi Real', color: '#c9223a', cost: 150 },
  { id: 'obsidiana', name: 'Tintura Obsidiana Amaldiçoada', color: '#141018', cost: 220 },
  { id: 'arco-iris', name: 'Tintura Prismática', color: '#c94fc9', cost: 220 },
  { id: 'celestial', name: 'Tintura Celestial', color: '#8fd8e8', cost: 220 },
  { id: 'fenix', name: 'Tintura da Fênix', color: '#e8641f', cost: 280 },
  { id: 'lich', name: 'Tintura do Lich', color: '#4fd89a', cost: 280 },
  { id: 'imperial', name: 'Tintura Imperial', color: '#8a1f3a', cost: 350 },
];

export function findCosmetic(id: string | null): CosmeticDef | undefined {
  return id ? COSMETICS.find((c) => c.id === id) : undefined;
}
