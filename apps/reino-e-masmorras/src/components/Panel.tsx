import { ReactNode } from 'react';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded border-2 border-panelborder bg-panel shadow-lg overflow-hidden">
      <div className="bg-gradient-to-b from-panel2 to-panel border-b border-panelborder px-4 py-2">
        <h2 className="text-gold font-bold tracking-wide text-sm uppercase">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
