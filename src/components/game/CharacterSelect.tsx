import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGame, setCurrentCharacterId } from '@/contexts/GameContext';
import { GameState, CharacterClass } from '@/types/game';
import { Trash2, Play, Loader2, Sword, Wand, Crosshair, Heart, Axe, Target } from 'lucide-react';
import { toast } from 'sonner';

interface SavedCharacter {
  id: string;
  name: string;
  class: CharacterClass;
  game_state: GameState | null;
  created_at: string;
  updated_at: string;
}

const classIcons: Record<CharacterClass, React.ReactNode> = {
  warrior: <Sword className="h-5 w-5" />,
  rogue: <Crosshair className="h-5 w-5" />,
  mage: <Wand className="h-5 w-5" />,
  cleric: <Heart className="h-5 w-5" />,
  barbarian: <Axe className="h-5 w-5" />,
  archer: <Target className="h-5 w-5" />,
};

export function CharacterSelect({ onNewGame, onBack }: { onNewGame: () => void; onBack: () => void }) {
  const { dispatch } = useGame();
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCharacters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load characters');
      if (import.meta.env.DEV) console.error('Character fetch failed:', error.message);
    } else if (data) {
      // Map the data to properly type the game_state
      const typedCharacters: SavedCharacter[] = data.map(char => ({
        id: char.id,
        name: char.name,
        class: char.class as CharacterClass,
        game_state: char.game_state as unknown as GameState | null,
        created_at: char.created_at,
        updated_at: char.updated_at,
      }));
      setCharacters(typedCharacters);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete character');
      if (import.meta.env.DEV) console.error('Character delete failed:', error.message);
    } else {
      toast.success(`${name} has been deleted`);
      setCharacters(prev => prev.filter(c => c.id !== id));
    }
    setDeleting(null);
  };

  const handleContinue = (character: SavedCharacter) => {
    if (character.game_state) {
      setCurrentCharacterId(character.id);
      dispatch({ type: 'LOAD_GAME', state: character.game_state });
    } else {
      toast.error('No saved progress for this character');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading characters...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <h2 className="font-cinzel text-2xl font-bold text-foreground mb-6 text-center">
        Your Characters
      </h2>

      {characters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-6">No characters yet. Create your first adventurer!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
          {characters.map((char) => (
            <div
              key={char.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card/80 p-4 transition-all hover:bg-card"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  {classIcons[char.class]}
                </div>
                <div>
                  <h3 className="font-cinzel font-semibold text-foreground">{char.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {char.class}
                    {char.game_state?.character?.stats?.level && (
                      <span className="ml-2">• Level {char.game_state.character.stats.level}</span>
                    )}
                    {char.game_state?.dungeonFloor && (
                      <span className="ml-2">• Floor {char.game_state.dungeonFloor}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {char.game_state && (
                  <button
                    onClick={() => handleContinue(char)}
                    className="flex items-center gap-2 rounded-lg bg-primary/20 px-3 py-2 text-sm text-primary transition-all hover:bg-primary/30"
                  >
                    <Play className="h-4 w-4" />
                    Continue
                  </button>
                )}
                <button
                  onClick={() => handleDelete(char.id, char.name)}
                  disabled={deleting === char.id}
                  className="flex items-center gap-2 rounded-lg bg-destructive/20 px-3 py-2 text-sm text-destructive transition-all hover:bg-destructive/30 disabled:opacity-50"
                >
                  {deleting === char.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={onNewGame}
          className="fantasy-button w-full rounded-lg px-6 py-3 font-cinzel font-semibold text-primary-foreground"
        >
          Create New Character
        </button>
        <button
          onClick={onBack}
          className="w-full rounded-lg border border-border bg-card/50 px-6 py-3 font-cinzel text-foreground transition-all hover:bg-card"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}