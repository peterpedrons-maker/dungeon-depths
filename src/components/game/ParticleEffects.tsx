import { useMemo } from 'react';

type RiskLevel = 1 | 2 | 3;

interface ParticleEffectsProps {
  riskLevel?: RiskLevel;
  count?: number;
}

const PARTICLE_CONFIG = {
  1: {
    colors: ['hsl(120, 40%, 60%)', 'hsl(180, 30%, 50%)', 'hsl(160, 35%, 55%)'],
    type: 'dust',
    speed: 'slow',
    glow: 'hsl(120, 40%, 50%)',
  },
  2: {
    colors: ['hsl(35, 70%, 55%)', 'hsl(25, 60%, 50%)', 'hsl(45, 65%, 60%)'],
    type: 'sparks',
    speed: 'medium',
    glow: 'hsl(35, 70%, 50%)',
  },
  3: {
    colors: ['hsl(0, 70%, 50%)', 'hsl(15, 80%, 45%)', 'hsl(0, 60%, 40%)'],
    type: 'embers',
    speed: 'fast',
    glow: 'hsl(0, 70%, 45%)',
  },
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

export function ParticleEffects({ riskLevel = 1, count = 30 }: ParticleEffectsProps) {
  // Ensure riskLevel is valid, default to 1 if not
  const safeRiskLevel = (riskLevel >= 1 && riskLevel <= 3 ? riskLevel : 1) as RiskLevel;
  const config = PARTICLE_CONFIG[safeRiskLevel];
  
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      delay: Math.random() * 5,
      duration: safeRiskLevel === 3 ? 3 + Math.random() * 2 : 
                safeRiskLevel === 2 ? 4 + Math.random() * 3 : 
                6 + Math.random() * 4,
      drift: (Math.random() - 0.5) * 40,
    }));
  }, [safeRiskLevel, count, config.colors]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${
            safeRiskLevel === 3 ? 'animate-ember' : 
            safeRiskLevel === 2 ? 'animate-spark' : 
            'animate-dust'
          }`}
          style={{
            left: `${particle.x}%`,
            bottom: riskLevel === 3 ? '0%' : `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            ['--drift' as string]: `${particle.drift}px`,
          }}
        />
      ))}
      
      {/* Ambient glow overlay based on risk */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          safeRiskLevel === 3 ? 'opacity-20' : 
          safeRiskLevel === 2 ? 'opacity-10' : 
          'opacity-5'
        }`}
        style={{
          background: `radial-gradient(ellipse at bottom, ${config.glow} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
