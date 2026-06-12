import { useMemo } from 'react';
import shlokas from '../data/shlokas.json';

export function useDailyVerse() {
  return useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const idx = dayOfYear % shlokas.length;
    return shlokas[idx];
  }, []);
}

export function useDailyArjunaKrishna() {
  return useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const shlokaWithDialogue = shlokas.filter((s) => s.arjuna_struggle && s.krishna_answer);
    const idx = dayOfYear % shlokaWithDialogue.length;
    return shlokaWithDialogue[idx];
  }, []);
}
