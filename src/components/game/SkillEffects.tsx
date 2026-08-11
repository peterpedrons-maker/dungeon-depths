import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type SkillEffectType = 
  | 'fire' 
  | 'ice' 
  | 'holy' 
  | 'shadow' 
  | 'nature'
  | 'physical' 
  | 'heal' 
  | 'buff' 
  | 'debuff'
  | 'shield'
  | 'lightning'
  | 'blood';

interface SkillEffectProps {
  type: SkillEffectType;
  isActive: boolean;
  onComplete?: () => void;
  targetPosition?: 'player' | 'enemy';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  rotation?: number;
  velocity?: { x: number; y: number };
}

const EFFECT_CONFIGS: Record<SkillEffectType, {
  colors: string[];
  particleCount: number;
  duration: number;
  animation: string;
  glow: string;
  secondaryGlow?: string;
}> = {
  fire: {
    colors: ['#ff6b35', '#ff4500', '#ffa500', '#ffcc00', '#ff3300'],
    particleCount: 30,
    duration: 900,
    animation: 'animate-fire-burst',
    glow: 'rgba(255, 107, 53, 0.7)',
    secondaryGlow: 'rgba(255, 200, 0, 0.5)',
  },
  ice: {
    colors: ['#87ceeb', '#00bfff', '#1e90ff', '#ffffff', '#e0ffff'],
    particleCount: 25,
    duration: 800,
    animation: 'animate-ice-shatter',
    glow: 'rgba(135, 206, 235, 0.7)',
    secondaryGlow: 'rgba(255, 255, 255, 0.5)',
  },
  holy: {
    colors: ['#ffd700', '#fffacd', '#ffffff', '#f0e68c', '#ffef00'],
    particleCount: 35,
    duration: 1000,
    animation: 'animate-holy-light',
    glow: 'rgba(255, 215, 0, 0.8)',
    secondaryGlow: 'rgba(255, 255, 255, 0.6)',
  },
  shadow: {
    colors: ['#4a0080', '#6b238e', '#9400d3', '#2d1b4e', '#8b00ff'],
    particleCount: 28,
    duration: 850,
    animation: 'animate-shadow-pulse',
    glow: 'rgba(74, 0, 128, 0.7)',
    secondaryGlow: 'rgba(139, 0, 255, 0.4)',
  },
  nature: {
    colors: ['#228b22', '#32cd32', '#90ee90', '#00ff7f', '#7cfc00'],
    particleCount: 22,
    duration: 800,
    animation: 'animate-nature-grow',
    glow: 'rgba(34, 139, 34, 0.6)',
    secondaryGlow: 'rgba(0, 255, 127, 0.4)',
  },
  physical: {
    colors: ['#c0c0c0', '#a9a9a9', '#808080', '#ffffff', '#d4d4d4'],
    particleCount: 18,
    duration: 600,
    animation: 'animate-slash',
    glow: 'rgba(192, 192, 192, 0.6)',
  },
  heal: {
    colors: ['#00ff00', '#7fff00', '#adff2f', '#98fb98', '#90ee90'],
    particleCount: 30,
    duration: 1100,
    animation: 'animate-heal-spiral',
    glow: 'rgba(0, 255, 0, 0.6)',
    secondaryGlow: 'rgba(127, 255, 0, 0.4)',
  },
  buff: {
    colors: ['#00d4ff', '#00ffff', '#7fffd4', '#40e0d0', '#00ced1'],
    particleCount: 25,
    duration: 900,
    animation: 'animate-buff-aura',
    glow: 'rgba(0, 212, 255, 0.6)',
    secondaryGlow: 'rgba(64, 224, 208, 0.4)',
  },
  debuff: {
    colors: ['#8b0000', '#dc143c', '#b22222', '#ff0000', '#c41e3a'],
    particleCount: 22,
    duration: 750,
    animation: 'animate-debuff-curse',
    glow: 'rgba(139, 0, 0, 0.7)',
    secondaryGlow: 'rgba(220, 20, 60, 0.4)',
  },
  shield: {
    colors: ['#4169e1', '#6495ed', '#87ceeb', '#b0c4de', '#00bfff'],
    particleCount: 28,
    duration: 950,
    animation: 'animate-shield-form',
    glow: 'rgba(65, 105, 225, 0.7)',
    secondaryGlow: 'rgba(135, 206, 235, 0.5)',
  },
  lightning: {
    colors: ['#ffff00', '#ffd700', '#ffffff', '#f0e68c', '#fffacd'],
    particleCount: 20,
    duration: 500,
    animation: 'animate-lightning',
    glow: 'rgba(255, 255, 0, 0.8)',
    secondaryGlow: 'rgba(255, 255, 255, 0.6)',
  },
  blood: {
    colors: ['#8b0000', '#b22222', '#dc143c', '#800000', '#a52a2a'],
    particleCount: 24,
    duration: 850,
    animation: 'animate-blood-drain',
    glow: 'rgba(139, 0, 0, 0.6)',
    secondaryGlow: 'rgba(178, 34, 34, 0.4)',
  },
};

export function SkillEffect({ type, isActive, onComplete, targetPosition = 'enemy' }: SkillEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showEffect, setShowEffect] = useState(false);
  
  const config = EFFECT_CONFIGS[type];
  
  useEffect(() => {
    if (isActive) {
      setShowEffect(true);
      
      // Generate particles with more variety
      const newParticles: Particle[] = Array.from({ length: config.particleCount }, (_, i) => ({
        id: i,
        x: 35 + Math.random() * 30,
        y: targetPosition === 'enemy' ? 15 + Math.random() * 35 : 55 + Math.random() * 25,
        size: 3 + Math.random() * 10,
        delay: Math.random() * 250,
        duration: config.duration * 0.4 + Math.random() * config.duration * 0.6,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4,
        },
      }));
      
      setParticles(newParticles);
      
      // Cleanup after animation
      const timer = setTimeout(() => {
        setShowEffect(false);
        setParticles([]);
        onComplete?.();
      }, config.duration + 300);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, type, config, onComplete, targetPosition]);
  
  if (!showEffect) return null;
  
  const centerY = targetPosition === 'enemy' ? '28%' : '68%';
  
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Main burst effect */}
      <div 
        className={cn(
          'absolute rounded-full opacity-90 transition-all',
          type === 'fire' && 'animate-fire-burst',
          type === 'ice' && 'animate-ice-shatter',
          type === 'holy' && 'animate-holy-light',
          type === 'physical' && 'animate-slash',
          type === 'heal' && 'animate-heal-spiral',
          type === 'buff' && 'animate-buff-aura',
          type === 'shield' && 'animate-shield-form',
          type === 'shadow' && 'animate-shadow-pulse',
          type === 'nature' && 'animate-nature-grow',
          type === 'lightning' && 'animate-lightning',
          type === 'blood' && 'animate-blood-drain',
          type === 'debuff' && 'animate-debuff-curse'
        )}
        style={{
          left: '48%',
          top: centerY,
          width: '140px',
          height: '140px',
          background: `radial-gradient(circle, ${config.colors[0]} 0%, ${config.colors[1]} 40%, transparent 70%)`,
          boxShadow: `0 0 80px 40px ${config.glow}`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Secondary glow ring */}
      {config.secondaryGlow && (
        <div 
          className="absolute rounded-full animate-pulse-ring"
          style={{
            left: '48%',
            top: centerY,
            width: '200px',
            height: '200px',
            border: `3px solid ${config.secondaryGlow}`,
            boxShadow: `inset 0 0 30px ${config.secondaryGlow}, 0 0 30px ${config.secondaryGlow}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-skill-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
      
      {/* Screen flash for impactful skills */}
      {(type === 'fire' || type === 'holy' || type === 'physical' || type === 'lightning') && (
        <div 
          className="absolute inset-0 animate-screen-flash"
          style={{
            background: `radial-gradient(circle at 50% ${targetPosition === 'enemy' ? '30%' : '70%'}, ${config.glow}, transparent 55%)`,
          }}
        />
      )}
      
      {/* Slash lines for physical attacks */}
      {type === 'physical' && (
        <>
          <div 
            className="absolute animate-slash-line"
            style={{
              left: '38%',
              top: targetPosition === 'enemy' ? '18%' : '58%',
              width: '100px',
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${config.colors[3]}, ${config.colors[0]}, transparent)`,
              transform: 'rotate(-45deg)',
              borderRadius: '2px',
            }}
          />
          <div 
            className="absolute animate-slash-line"
            style={{
              left: '42%',
              top: targetPosition === 'enemy' ? '22%' : '62%',
              width: '100px',
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${config.colors[3]}, ${config.colors[0]}, transparent)`,
              transform: 'rotate(45deg)',
              animationDelay: '80ms',
              borderRadius: '2px',
            }}
          />
          <div 
            className="absolute animate-slash-line"
            style={{
              left: '40%',
              top: targetPosition === 'enemy' ? '25%' : '65%',
              width: '100px',
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${config.colors[3]}, ${config.colors[0]}, transparent)`,
              transform: 'rotate(0deg)',
              animationDelay: '160ms',
              borderRadius: '2px',
            }}
          />
        </>
      )}
      
      {/* Lightning bolts */}
      {type === 'lightning' && (
        <>
          <svg 
            className="absolute animate-lightning-bolt"
            style={{
              left: '45%',
              top: targetPosition === 'enemy' ? '5%' : '45%',
              width: '60px',
              height: '100px',
              filter: 'drop-shadow(0 0 10px #ffff00)',
            }}
          >
            <path
              d="M30 0 L20 35 L35 35 L15 100 L25 55 L10 55 L30 0"
              fill="#ffff00"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
          <svg 
            className="absolute animate-lightning-bolt"
            style={{
              left: '52%',
              top: targetPosition === 'enemy' ? '8%' : '48%',
              width: '50px',
              height: '80px',
              filter: 'drop-shadow(0 0 10px #ffff00)',
              animationDelay: '100ms',
            }}
          >
            <path
              d="M25 0 L18 28 L28 28 L12 80 L20 45 L10 45 L25 0"
              fill="#ffd700"
              stroke="#ffffff"
              strokeWidth="1"
            />
          </svg>
        </>
      )}
      
      {/* Healing cross and spiral */}
      {type === 'heal' && (
        <div 
          className="absolute animate-heal-cross"
          style={{
            left: '48%',
            top: centerY,
            width: '70px',
            height: '70px',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div 
            className="absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 rounded-full"
            style={{ background: `linear-gradient(180deg, ${config.colors[0]}, ${config.colors[2]})` }}
          />
          <div 
            className="absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${config.colors[0]}, ${config.colors[2]})` }}
          />
        </div>
      )}
      
      {/* Shield hexagon */}
      {type === 'shield' && (
        <div 
          className="absolute animate-shield-form"
          style={{
            left: '48%',
            top: centerY,
            width: '120px',
            height: '120px',
            transform: 'translate(-50%, -50%)',
            border: `4px solid ${config.colors[0]}`,
            borderRadius: '20%',
            boxShadow: `inset 0 0 40px ${config.glow}, 0 0 30px ${config.glow}`,
            background: `radial-gradient(circle, ${config.colors[2]}40 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Blood drip effect */}
      {type === 'blood' && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-blood-drip"
              style={{
                left: `${42 + i * 4}%`,
                top: targetPosition === 'enemy' ? '20%' : '60%',
                width: '8px',
                height: '20px',
                background: `linear-gradient(180deg, ${config.colors[0]}, ${config.colors[2]})`,
                borderRadius: '0 0 50% 50%',
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </>
      )}
      
      {/* Fire swirl */}
      {type === 'fire' && (
        <div 
          className="absolute animate-fire-swirl"
          style={{
            left: '48%',
            top: centerY,
            width: '100px',
            height: '100px',
            transform: 'translate(-50%, -50%)',
            background: `conic-gradient(from 0deg, transparent, ${config.colors[0]}, ${config.colors[1]}, transparent)`,
            borderRadius: '50%',
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
}

// Hook to manage skill effects
export function useSkillEffect() {
  const [activeEffect, setActiveEffect] = useState<{
    type: SkillEffectType;
    target: 'player' | 'enemy';
  } | null>(null);
  
  const triggerEffect = (type: SkillEffectType, target: 'player' | 'enemy' = 'enemy') => {
    setActiveEffect({ type, target });
  };
  
  const clearEffect = () => {
    setActiveEffect(null);
  };
  
  return { activeEffect, triggerEffect, clearEffect };
}

// Map skill visual effects
export function getSkillVisualType(effectType: string): SkillEffectType {
  switch (effectType) {
    case 'damage':
      return 'physical';
    case 'magic_damage':
      return 'holy';
    case 'fire':
      return 'fire';
    case 'ice':
      return 'ice';
    case 'holy':
      return 'holy';
    case 'shadow':
      return 'shadow';
    case 'nature':
      return 'nature';
    case 'heal':
      return 'heal';
    case 'buff_attack':
    case 'buff_defense':
    case 'buff_crit':
      return 'buff';
    case 'debuff_defense':
      return 'debuff';
    case 'shield':
      return 'shield';
    case 'bleed':
      return 'blood';
    case 'lifesteal_attack':
      return 'blood';
    case 'mana_restore':
      return 'nature';
    case 'stun':
      return 'lightning';
    default:
      return 'physical';
  }
}
