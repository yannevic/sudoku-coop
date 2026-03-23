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

export default function usePresence(
  roomId: string | null,
  player: Player | null,
  playerName: string,
  onOpponentName?: (name: string) => void
) {
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

  // anuncia o próprio nome para o oponente (usado pelo creator quando joiner entra,
  // e pelo joiner assim que o canal está pronto)
  const broadcastName = useCallback(() => {
    if (!player || !playerName) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'player-name',
      payload: { player, name: playerName } satisfies NamePayload,
    });
  }, [player, playerName]);

  useEffect(() => {
    if (!roomId || !player) return undefined;

    const channel = supabase
      .channel(`room-${roomId}-presence`)
      .on('broadcast', { event: 'presence' }, ({ payload }: { payload: PresencePayload }) => {
        if (payload.player === player) return;
        if (payload.row === null || payload.col === null) {
          setOpponentSelected(null);
        } else {
          setOpponentSelected([payload.row, payload.col]);
        }
      })
      .on('broadcast', { event: 'player-name' }, ({ payload }: { payload: NamePayload }) => {
        if (payload.player === player) return;
        onOpponentName?.(payload.name);
        // responde com o próprio nome para garantir que o outro lado também saiba
        channelRef.current?.send({
          type: 'broadcast',
          event: 'player-name',
          payload: { player, name: playerName } satisfies NamePayload,
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, player, playerName, onOpponentName]);

  return { opponentSelected, broadcastSelection, broadcastName };
}
