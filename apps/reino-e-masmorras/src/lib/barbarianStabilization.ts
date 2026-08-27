// Regras puras de cadência do Bárbaro. Mantidas separadas das condições
// genéricas para que o harness de alcançabilidade rode diretamente em Node.
export const PAIN_TICKS = 5;
export const PAIN_TICKS_INQUEBRAVEL = 6;

export interface PainPacket {
  amountLeft: number;
  perTick: number;
  ticksLeft: number;
}
export function createPainPacket(amount: number, ticks: number): PainPacket {
  const safeAmount = Math.max(0, amount);
  const safeTicks = Math.max(1, Math.trunc(ticks));
  return { amountLeft: safeAmount, perTick: safeAmount / safeTicks, ticksLeft: safeTicks };
}
export function consumeWildPostureAction(charges: number, directHitLanded: boolean): number {
  return directHitLanded ? Math.max(0, Math.trunc(charges) - 1) : Math.max(0, Math.trunc(charges));
}
export function tickPainPackets(packets: PainPacket[]): { packets: PainPacket[]; paid: number } {
  let paid = 0;
  const next: PainPacket[] = [];
  for (const packet of packets) {
    if (packet.ticksLeft <= 0 || packet.amountLeft <= 0) continue;
    const amount = Math.min(packet.amountLeft, packet.perTick);
    paid += amount;
    const amountLeft = packet.amountLeft - amount;
    const ticksLeft = packet.ticksLeft - 1;
    if (amountLeft > 0.000001 && ticksLeft > 0) next.push({ ...packet, amountLeft, ticksLeft });
  }
  return { packets: next, paid };
}
export function consumePainPackets(packets: PainPacket[], amount: number): { packets: PainPacket[]; consumed: number } {
  let remaining = Math.max(0, amount);
  let consumed = 0;
  const next: PainPacket[] = [];
  for (const packet of packets) {
    if (remaining <= 0) { next.push(packet); continue; }
    const take = Math.min(packet.amountLeft, remaining);
    remaining -= take;
    consumed += take;
    const left = packet.amountLeft - take;
    if (left > 0.000001) next.push({ ...packet, amountLeft: left, perTick: left / Math.max(1, packet.ticksLeft) });
  }
  return { packets: next, consumed };
}
