import { useEffect, useState, useMemo } from 'react';

interface LightningBolt {
  id: number;
  x: number;
  delay: number;
  duration: number;
  width: number;
  opacity: number;
  path: string;
}

interface EncounterTransitionProps {
  isActive: boolean;
  onComplete: () => void;
  encounterType?: 'battle' | 'merchant' | 'treasure';
}

function generateLightningPath(startX: number, startY: number, endY: number): string {
  const segments = 12 + Math.floor(Math.random() * 8);
  const segmentHeight = (endY - startY) / segments;
  let path = `M ${startX} ${startY}`;
  let currentX = startX;
  let currentY = startY;
  
  for (let i = 0; i < segments; i++) {
    const offsetX = (Math.random() - 0.5) * 60;
    const jitter = (Math.random() - 0.5) * 15;
    currentX += offsetX;
    currentY += segmentHeight + jitter;
    path += ` L ${currentX} ${currentY}`;
  }
  
  return path;
}

export function EncounterTransition({ isActive, onComplete, encounterType = 'battle' }: EncounterTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'lightning' | 'fade'>('idle');
  const [lightningBolts, setLightningBolts] = useState<LightningBolt[]>([]);
  
  // Generate lightning bolts
  const generateBolts = () => {
    const bolts: LightningBolt[] = [];
    const numBolts = encounterType === 'battle' ? 5 : 3;
    
    for (let i = 0; i < numBolts; i++) {
      bolts.push({
        id: i,
        x: 10 + Math.random() * 80,
        delay: Math.random() * 200,
        duration: 150 + Math.random() * 100,
        width: 2 + Math.random() * 2,
        opacity: 0.7 + Math.random() * 0.3,
        path: generateLightningPath(50 + (Math.random() - 0.5) * 30, 0, 100),
      });
    }
    
    return bolts;
  };
  
  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }
    
    // Start transition sequence
    setPhase('flash');
    setLightningBolts(generateBolts());
    
    // Phase timing
    const flashTimer = setTimeout(() => {
      setPhase('lightning');
    }, 100);
    
    const lightningTimer = setTimeout(() => {
      setPhase('fade');
    }, 600);
    
    const completeTimer = setTimeout(() => {
      setPhase('idle');
      onComplete();
    }, 1000);
    
    return () => {
      clearTimeout(flashTimer);
      clearTimeout(lightningTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, onComplete]);
  
  if (phase === 'idle') return null;
  
  // Color based on encounter type
  const glowColor = encounterType === 'battle' 
    ? 'rgb(139, 92, 246)' // purple for battle
    : encounterType === 'treasure'
    ? 'rgb(234, 179, 8)' // gold for treasure
    : 'rgb(34, 197, 94)'; // green for merchant
    
  const bgColor = encounterType === 'battle'
    ? 'from-purple-900/90 via-black to-purple-900/90'
    : encounterType === 'treasure'
    ? 'from-yellow-900/90 via-black to-yellow-900/90'
    : 'from-green-900/90 via-black to-green-900/90';
  
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Screen flash */}
      <div 
        className={`absolute inset-0 transition-opacity duration-100 ${
          phase === 'flash' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: glowColor }}
      />
      
      {/* Dark overlay with radial gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-radial ${bgColor} transition-opacity duration-300 ${
          phase === 'lightning' || phase === 'fade' ? 'opacity-95' : 'opacity-0'
        }`}
      />
      
      {/* Lightning bolts */}
      {(phase === 'lightning' || phase === 'flash') && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {lightningBolts.map((bolt) => (
            <g key={bolt.id}>
              {/* Main bolt */}
              <path
                d={bolt.path}
                fill="none"
                stroke={glowColor}
                strokeWidth={bolt.width}
                strokeLinecap="round"
                filter="url(#lightning-glow)"
                className="animate-lightning"
                style={{
                  animationDelay: `${bolt.delay}ms`,
                  animationDuration: `${bolt.duration}ms`,
                  opacity: bolt.opacity,
                }}
              />
              {/* Core bright line */}
              <path
                d={bolt.path}
                fill="none"
                stroke="white"
                strokeWidth={bolt.width * 0.4}
                strokeLinecap="round"
                className="animate-lightning"
                style={{
                  animationDelay: `${bolt.delay}ms`,
                  animationDuration: `${bolt.duration}ms`,
                  opacity: bolt.opacity * 0.9,
                }}
              />
            </g>
          ))}
        </svg>
      )}
      
      {/* Encounter text */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          phase === 'lightning' ? 'opacity-100 scale-100' : phase === 'fade' ? 'opacity-0 scale-110' : 'opacity-0 scale-90'
        }`}
      >
        <div className="text-center">
          <h2 
            className="font-cinzel-decorative text-4xl md:text-6xl font-bold tracking-wider animate-pulse"
            style={{ 
              color: 'white',
              textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`,
            }}
          >
            {encounterType === 'battle' ? 'BATTLE!' : encounterType === 'treasure' ? 'TREASURE!' : 'MERCHANT'}
          </h2>
        </div>
      </div>
      
      {/* Fade out overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-400 ${
          phase === 'fade' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
