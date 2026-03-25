import { useState, useEffect, useCallback, useRef } from 'react';

export default function useTimer(active: boolean, paused = false, externalSeconds?: number) {
  const [seconds, setSeconds] = useState(0);
  const [unlockedSolo, setUnlockedSolo] = useState(false);
  const [startedManually, setStartedManually] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Se vier segundos externos (modo espectador), usa eles diretamente
  const isExternal = externalSeconds !== undefined;
  const isRunning = !isExternal && (active || unlockedSolo) && !paused;

  useEffect(() => {
    if (isExternal) return undefined;

    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isExternal]);

  // Atualiza segundos quando vier valor externo
  useEffect(() => {
    if (isExternal && externalSeconds !== undefined) {
      setSeconds(externalSeconds);
    }
  }, [isExternal, externalSeconds]);

  const unlockSolo = useCallback(() => {
    setUnlockedSolo(true);
  }, []);

  const startManually = useCallback(() => {
    if (startedManually) return;
    setStartedManually(true);
    setUnlockedSolo(true);
  }, [startedManually]);

  const format = (s: number): string => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return {
    seconds,
    formatted: format(seconds),
    isRunning: isExternal ? externalSeconds! > 0 : isRunning,
    unlockedSolo,
    unlockSolo,
    startManually,
    startedManually,
  };
}
