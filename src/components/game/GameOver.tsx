import { useGame } from '@/contexts/GameContext';
import { Skull } from 'lucide-react';
import dungeonBg from '@/assets/dungeon-mossy.jpg';

export function GameOver() {
  const { state, dispatch } = useGame();
  const { character, dungeonFloor, roomsCleared } = state;

  const handleRestart = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center grayscale"
        style={{ backgroundImage: `url(${dungeonBg})` }}
      />
      <div className="absolute inset-0 bg-background/90" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8">
          <Skull className="h-24 w-24 text-danger" />
        </div>

        <h1 className="game-title mb-4 text-5xl font-bold text-danger">
          You Died
        </h1>
        
        {character && (
          <div className="mb-8 text-center">
            <p className="text-xl text-foreground">
              {character.name} the {character.class}
            </p>
            <p className="text-muted-foreground">
              Reached Floor {dungeonFloor} • Cleared {roomsCleared} rooms
            </p>
            <p className="text-muted-foreground">
              Level {character.stats.level} • {character.stats.gold} gold collected
            </p>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="fantasy-button rounded-lg px-10 py-4 font-cinzel text-lg text-primary-foreground"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
