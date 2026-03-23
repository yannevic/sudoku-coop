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
  const playerNameRef = useRef(playerName);

  // mantém ref atualizada sem recriar o canal
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

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

  const broadcastName = useCallback(() => {
    if (!player || !playerNameRef.current) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'player-name',
      payload: { player, name: playerNameRef.current } satisfies NamePayload,
    });
  }, [player]);

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
        // responde com o próprio nome para garantir troca bidirecional
        channel.send({
          type: 'broadcast',
          event: 'player-name',
          payload: { player, name: playerNameRef.current } satisfies NamePayload,
        });
      })
      .subscribe((status) => {
        // assim que o canal estiver pronto, anuncia o próprio nome
        if (status === 'SUBSCRIBED') {
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
  }, [roomId, player, onOpponentName]);

  return { opponentSelected, broadcastSelection, broadcastName };
}
