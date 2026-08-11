import { useState } from 'react';
import { useGame, loadSavedGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Users } from 'lucide-react';
import { toast } from 'sonner';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import { CharacterSelect } from './CharacterSelect';
import { useMenuMusic } from '@/hooks/useMenuMusic';

export function MainMenu() {
  const { dispatch, hasSavedGame } = useGame();
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  
  // Play menu music
  useMenuMusic(0.4);

  const handleNewGame = () => {
    dispatch({ type: 'SET_SCREEN', screen: 'character-creation' });
  };

  const handleContinue = () => {
    const savedGame = loadSavedGame();
    if (savedGame) {
      dispatch({ type: 'LOAD_GAME', state: savedGame });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      sessionStorage.removeItem('authenticated');
      toast.success('Farewell, adventurer!');
    }
  };

  if (showCharacterSelect) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${dungeonBg})` }}
        />
        <div className="absolute inset-0 dungeon-overlay" />
        
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-card hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center py-12">
          <CharacterSelect 
            onNewGame={handleNewGame} 
            onBack={() => setShowCharacterSelect(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dungeonBg})` }}
      />
      <div className="absolute inset-0 dungeon-overlay" />
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-card hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-12 text-center">
          <h1 className="game-title mb-4 text-5xl font-bold text-primary md:text-7xl">
            Dungeon
          </h1>
          <h2 className="game-title text-3xl font-semibold text-foreground/90 md:text-4xl">
            Crawler
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descend into darkness. Seek fortune.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleNewGame}
            className="fantasy-button min-w-[200px] rounded-lg px-8 py-4 font-cinzel text-lg font-semibold text-primary-foreground"
          >
            New Game
          </button>
          
          {hasSavedGame && (
            <button
              onClick={handleContinue}
              className="rounded-lg border-2 border-primary/50 bg-card/80 px-8 py-4 font-cinzel text-lg font-semibold text-foreground transition-all hover:border-primary hover:bg-card"
            >
              Continue
            </button>
          )}

          <button
            onClick={() => setShowCharacterSelect(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card/80 px-8 py-4 font-cinzel text-lg font-semibold text-foreground transition-all hover:bg-card"
          >
            <Users className="h-5 w-5" />
            Manage Characters
          </button>
        </div>

        <p className="absolute bottom-8 text-sm text-muted-foreground">
          Choose wisely. Every path holds danger.
        </p>
      </div>
    </div>
  );
}