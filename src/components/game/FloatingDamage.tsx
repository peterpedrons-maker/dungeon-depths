import { useEffect, useState } from 'react';

export interface DamageNumber {
  id: number;
  amount: number;
  isCritical: boolean;
  isHeal: boolean;
  x: number;
  y: number;
  isMana?: boolean;
}

interface FloatingDamageProps {
  damages: DamageNumber[];
  onComplete: (id: number) => void;
}

function DamagePopup({ damage, onComplete }: { damage: DamageNumber; onComplete: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const getStyles = () => {
    if (damage.isMana) {
      return {
        className: 'text-blue-400 text-2xl',
        shadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 2px 4px black',
        prefix: '+',
        suffix: ' MP',
      };
    }
    if (damage.isHeal) {
      return {
        className: 'text-safe text-2xl',
        shadow: '0 0 10px hsl(var(--safe)), 0 2px 4px black',
        prefix: '+',
        suffix: '',
      };
    }
    if (damage.isCritical) {
      return {
        className: 'text-4xl md:text-5xl text-primary scale-125',
        shadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary)), 0 2px 4px black',
        prefix: '-',
        suffix: '',
      };
    }
    return {
      className: 'text-2xl md:text-3xl text-danger',
      shadow: '0 0 10px hsl(var(--danger)), 0 2px 4px black',
      prefix: '-',
      suffix: '',
    };
  };

  const styles = getStyles();

  return (
    <div
      className={`pointer-events-none absolute animate-damage-float font-cinzel-decorative font-bold ${styles.className}`}
      style={{
        left: `${damage.x}%`,
        top: `${damage.y}%`,
        textShadow: styles.shadow,
      }}
    >
      {styles.prefix}{damage.amount}{styles.suffix}
      {damage.isCritical && (
        <span className="ml-1 text-lg text-primary animate-pulse">CRIT!</span>
      )}
    </div>
  );
}

export function FloatingDamage({ damages, onComplete }: FloatingDamageProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {damages.map((damage) => (
        <DamagePopup 
          key={damage.id} 
          damage={damage} 
          onComplete={() => onComplete(damage.id)} 
        />
      ))}
    </div>
  );
}
