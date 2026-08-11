import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { MainMenu } from '@/components/game/MainMenu';
import { CharacterCreation } from '@/components/game/CharacterCreation';
import { DungeonRoom } from '@/components/game/DungeonRoom';
import { Combat } from '@/components/game/Combat';
import { Encounter } from '@/components/game/Encounter';
import { Victory } from '@/components/game/Victory';
import { GameOver } from '@/components/game/GameOver';
import { GameHUD } from '@/components/game/GameHUD';
import { Loader2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

function GameContent() {
  const { state } = useGame();

  const renderScreen = () => {
    switch (state.screen) {
      case 'menu':
        return <MainMenu />;
      case 'character-creation':
        return <CharacterCreation />;
      case 'dungeon':
        return <DungeonRoom />;
      case 'combat':
        return <Combat />;
      case 'encounter':
        return <Encounter />;
      case 'victory':
        return <Victory />;
      case 'game-over':
        return <GameOver />;
      default:
        return <MainMenu />;
    }
  };

  const showHUD = ['dungeon', 'combat', 'encounter', 'victory'].includes(state.screen);

  return (
    <div className="min-h-screen">
      {showHUD && <GameHUD />}
      {renderScreen()}
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if this is a fresh browser session (not already authenticated this session)
    const hasAuthenticatedThisSession = sessionStorage.getItem('authenticated');
    
    const initAuth = async () => {
      if (!hasAuthenticatedThisSession) {
        // Sign out any existing session on fresh browser load
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      
      // Check for existing session if already authenticated this session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          // Mark that user has authenticated in this browser session
          sessionStorage.setItem('authenticated', 'true');
        }
        setLoading(false);
      }
    );

    initAuth();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;
