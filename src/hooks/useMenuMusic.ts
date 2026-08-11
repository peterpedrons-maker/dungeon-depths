import { useEffect, useRef } from 'react';

const MENU_MUSIC_PATH = '/audio/menu-music.wav';

// Singleton audio instance to persist across component mounts
let audioInstance: HTMLAudioElement | null = null;
let activeListeners = 0;

export function useMenuMusic(volume: number = 0.5) {
  const hasStarted = useRef(false);

  useEffect(() => {
    activeListeners++;

    // Create audio instance if it doesn't exist
    if (!audioInstance) {
      audioInstance = new Audio(MENU_MUSIC_PATH);
      audioInstance.loop = true;
      audioInstance.volume = volume;
    }

    // Update volume if changed
    audioInstance.volume = volume;

    // Start playing if not already
    if (!hasStarted.current && audioInstance.paused) {
      hasStarted.current = true;
      audioInstance.play().catch((err) => {
        // Autoplay might be blocked, that's okay
        console.log('Audio autoplay blocked, waiting for user interaction');
      });
    }

    return () => {
      activeListeners--;
      
      // Only stop music if no components are using it
      if (activeListeners === 0 && audioInstance) {
        audioInstance.pause();
        audioInstance.currentTime = 0;
        audioInstance = null;
      }
    };
  }, [volume]);

  const play = () => {
    if (audioInstance && audioInstance.paused) {
      audioInstance.play().catch(console.error);
    }
  };

  const pause = () => {
    if (audioInstance) {
      audioInstance.pause();
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioInstance) {
      audioInstance.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return { play, pause, setVolume };
}
