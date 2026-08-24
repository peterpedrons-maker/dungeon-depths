// The Reino's 3 static locations — no levels, no gold-funded upgrades (that
// whole meta-progression was removed: it didn't add much and complicated
// balancing 3 unrelated systems around it). Each is just a marker on the
// Construções map that opens its own scene — see KingdomBuildings.tsx.
export interface BuildingDef {
  id: string;
  name: string;
  desc: string;
}

export const BUILDINGS: BuildingDef[] = [
  { id: 'forja', name: 'Forja', desc: 'Aprimore seus itens com o Ferreiro, gastando ouro pra empurrar um item além do que ele rolou.' },
  { id: 'bau', name: 'Baú de Armazém', desc: 'Guarde itens compartilhados entre todos os seus personagens desta conta — sem limite de espaço.' },
  { id: 'mercador', name: 'Mercador', desc: 'Compre poções e equipamentos — o estoque se renova sozinho a cada hora.' },
];
