import { useEffect, useCallback, useRef, useState } from 'react';
import supabase from '../utils/supabase';
import type { Player } from '../utils/sudoku';

interface PresencePayload {
  player: Player;
  row: number | null;
  col: number | null;
}

interface NamePayload {
  player: Player;
  name: string;
}

interface SpectatorPayload {
  name: string;
  action: 'join' | 'leave';
}

interface TimerPayload {
  seconds: number;
}

export default function usePresence(
  roomId: string | null,
  player: Player | null,
  playerName: string,
  onOpponentName?: (name: string) => void,
  onTimerSync?: (seconds: number) => void
) {
  const [opponentSelected, setOpponentSelected] = useState<[number, number] | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const broadcastSelection = useCallback(
    (row: number | null, col: number | null) => {
      if (!player || player === 'spectator') return;
      channelRef.current?.send({
        type: 'broadcast',
        event: 'presence',
        payload: { player, row, col } satisfies PresencePayload,
      });
    },
    [player]
  );

  const broadcastName = useCallback(() => {
    if (!player || !playerNameRef.current) return;
    if (player === 'spectator') return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'player-name',
      payload: { player, name: playerNameRef.current } satisfies NamePayload,
    });
  }, [player]);

  const broadcastTimer = useCallback(
    (seconds: number) => {
      if (!player || player === 'spectator') return;
      channelRef.current?.send({
        type: 'broadcast',
        event: 'timer-sync',
        payload: { seconds } satisfies TimerPayload,
      });
    },
    [player]
  );

  const announceSpectatorJoin = useCallback(() => {
    if (player !== 'spectator' || !playerNameRef.current) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'spectator',
      payload: { name: playerNameRef.current, action: 'join' } satisfies SpectatorPayload,
    });
  }, [player]);

  const announceSpectatorLeave = useCallback(() => {
    if (player !== 'spectator' || !playerNameRef.current) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'spectator',
      payload: { name: playerNameRef.current, action: 'leave' } satisfies SpectatorPayload,
    });
  }, [player]);

  useEffect(() => {
    if (!roomId || !player) return undefined;

    const channel = supabase
      .channel(`room-${roomId}-presence`)
      .on('broadcast', { event: 'presence' }, ({ payload }: { payload: PresencePayload }) => {
        if (payload.player === player && player !== 'spectator') return;
        if (payload.row === null || payload.col === null) {
          setOpponentSelected(null);
        } else {
          setOpponentSelected([payload.row, payload.col]);
        }
      })
      .on('broadcast', { event: 'player-name' }, ({ payload }: { payload: NamePayload }) => {
        if (payload.player === player) return;
        onOpponentName?.(payload.name);
        if (player !== 'spectator') {
          channel.send({
            type: 'broadcast',
            event: 'player-name',
            payload: { player, name: playerNameRef.current } satisfies NamePayload,
          });
        }
      })
      .on('broadcast', { event: 'timer-sync' }, ({ payload }: { payload: TimerPayload }) => {
        if (player !== 'spectator') return;
        onTimerSync?.(payload.seconds);
      })
      .on('broadcast', { event: 'spectator' }, ({ payload }: { payload: SpectatorPayload }) => {
        if (payload.action === 'join') {
          setSpectators((prev) => (prev.includes(payload.name) ? prev : [...prev, payload.name]));
          // Se sou espectador e outro espectador entrou, reenvio meu join
          // para que o recém-chegado saiba que eu existo
          if (player === 'spectator' && payload.name !== playerNameRef.current) {
            channel.send({
              type: 'broadcast',
              event: 'spectator',
              payload: { name: playerNameRef.current, action: 'join' } satisfies SpectatorPayload,
            });
          }
        } else {
          setSpectators((prev) => prev.filter((n) => n !== payload.name));
        }
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        if (player === 'spectator') {
          channel.send({
            type: 'broadcast',
            event: 'spectator',
            payload: { name: playerNameRef.current, action: 'join' } satisfies SpectatorPayload,
          });
        } else {
          channel.send({
            type: 'broadcast',
            event: 'player-name',
            payload: { player, name: playerNameRef.current } satisfies NamePayload,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, player, onOpponentName, onTimerSync]);

  return {
    opponentSelected,
    spectators,
    broadcastSelection,
    broadcastName,
    broadcastTimer,
    announceSpectatorJoin,
    announceSpectatorLeave,
  };
}
