import { ReactNode } from 'react';

export function StatChip({ icon, color, label, value }: { icon: ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="rounded border border-panelborder/60 bg-panel2/40 px-2 py-2 flex flex-col items-center text-center gap-1">
      <span className="w-5 h-5" style={{ color }}>{icon}</span>
      <span className="font-bold text-sm text-parchment tabular-nums leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-wide text-parchment/40 leading-none">{label}</span>
    </div>
  );
}
