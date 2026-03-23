import { useEffect, useCallback, useRef, useState } from 'react';
import supabase from '../utils/supabase';
import type { Player } from '../utils/sudoku';

interface PresencePayload {
  player: Player;
  row: number | null;
  col: number | null;
}

export default function usePresence(roomId: string | null, player: Player | null) {
  const [opponentSelected, setOpponentSelected] = useState<[number, number] | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const broadcastSelection = useCallback(
    (row: number | null, col: number | null) => {
      if (!player) return;
      channelRef.current?.send({
        type: 'broadcast',
        event: 'presence',
        payload: { player, row, col } satisfies PresencePayload,
      });
    },
    [player]
  );

  useEffect(() => {
    if (!roomId || !player) return undefined;

    const channel = supabase
      .channel(`room-${roomId}-presence`)
      .on('broadcast', { event: 'presence' }, ({ payload }: { payload: PresencePayload }) => {
        // ignora eventos do próprio jogador
        if (payload.player === player) return;
        if (payload.row === null || payload.col === null) {
          setOpponentSelected(null);
        } else {
          setOpponentSelected([payload.row, payload.col]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, player]);

  return { opponentSelected, broadcastSelection };
}
