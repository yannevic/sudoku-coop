import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../utils/supabase';
import type { Player } from '../utils/sudoku';
import type { ChatMessage } from '../types/chat';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getDisplayName(name: string, player: Player | null): string {
  const base = name || 'Anônimo';
  if (player === 'spectator') return `${base} (Espectador)`;
  return base;
}

export default function useChat(
  roomId: string | null,
  player: Player | null,
  playerName: string,
  onPlayerJoin?: (name: string) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sentIdsRef = useRef<Set<string>>(new Set());

  const playSound = useCallback(() => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.18);
  }, []);

  const addMessage = useCallback(
    (msg: ChatMessage, fromSelf: boolean) => {
      setMessages((prev) => [...prev, msg]);
      if (!fromSelf) {
        playSound();
        if (!isOpenRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    },
    [playSound]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!roomId || !player || !text.trim()) return;
      const msg: ChatMessage = {
        id: generateId(),
        text: text.trim(),
        player,
        playerName: getDisplayName(playerName, player),
        type: 'user',
        timestamp: Date.now(),
      };
      sentIdsRef.current.add(msg.id);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'chat',
        payload: msg,
      });
      addMessage(msg, true);
    },
    [roomId, player, playerName, addMessage]
  );

  const sendSystemMessage = useCallback(
    (text: string) => {
      if (!roomId) return;
      const msg: ChatMessage = {
        id: generateId(),
        text,
        player: 'system',
        playerName: 'Sistema',
        type: 'system',
        timestamp: Date.now(),
      };
      sentIdsRef.current.add(msg.id);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'chat',
        payload: msg,
      });
      addMessage(msg, true);
    },
    [roomId, addMessage]
  );

  const announceJoin = useCallback(() => {
    if (!roomId || !player) return;
    const name = getDisplayName(playerName, player);
    const emoji = player === 'spectator' ? '👁️' : '🎮';
    const msg: ChatMessage = {
      id: generateId(),
      text: `${emoji} ${name} entrou na sala!`,
      player: 'system',
      playerName: 'Sistema',
      type: 'system',
      timestamp: Date.now(),
    };
    sentIdsRef.current.add(msg.id);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'chat',
      payload: msg,
    });
    addMessage(msg, true);
  }, [roomId, player, playerName, addMessage]);

  const setIsOpen = useCallback((open: boolean) => {
    isOpenRef.current = open;
    if (open) setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;

    const channel = supabase
      .channel(`room-${roomId}-chat`)
      .on('broadcast', { event: 'chat' }, ({ payload }: { payload: ChatMessage }) => {
        if (sentIdsRef.current.has(payload.id)) return;
        addMessage(payload, false);
        if (payload.type === 'system' && payload.text.includes('entrou na sala') && onPlayerJoin) {
          const match = payload.text.match(/🎮 (.+) entrou na sala!/);
          if (match) onPlayerJoin(match[1]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, addMessage, onPlayerJoin, player]);

  return {
    messages,
    sendMessage,
    sendSystemMessage,
    announceJoin,
    unreadCount,
    setIsOpen,
  };
}
