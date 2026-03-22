import { useState, useEffect, useCallback, useRef } from 'react';

export default function useTimer(active: boolean, paused = false) {
  const [seconds, setSeconds] = useState(0);
  const [unlockedSolo, setUnlockedSolo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = (active || unlockedSolo) && !paused;

  useEffect(() => {
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
  }, [isRunning]);

  const unlockSolo = useCallback(() => {
    setUnlockedSolo(true);
  }, []);

  const format = (s: number): string => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return { seconds, formatted: format(seconds), isRunning, unlockedSolo, unlockSolo };
}
