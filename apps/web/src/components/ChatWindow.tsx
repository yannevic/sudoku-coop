import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageCircle, X, Minus, Send } from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import type { Player } from '../utils/sudoku';

const EMOJIS = ['😄', '😍', '🎉', '👏', '🔥', '💡', '😱', '🤔', '💪', '🌸'];

interface ChatWindowProps {
  messages: ChatMessage[];
  unreadCount: number;
  player: Player;
  onSend: (text: string) => void;
  onOpenChange: (open: boolean) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getMessageAlign(msg: ChatMessage, self: Player): string {
  if (msg.type === 'system') return 'items-center';
  if (msg.player === self) return 'items-end';
  return 'items-start';
}

function getBubbleStyle(msg: ChatMessage, self: Player): string {
  if (msg.type === 'system') {
    return 'bg-[#f3e8ff] text-[#7a4a84] text-xs px-3 py-1 rounded-full italic';
  }
  if (msg.player === self) {
    return 'bg-[#f37eb9] text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[75%] text-sm break-words';
  }
  if (msg.player === 'creator') {
    return 'bg-white border border-[#e9b8d9] text-[#9b5fa5] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[75%] text-sm break-words';
  }
  return 'bg-white border border-[#bae6fd] text-[#22a5e0] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[75%] text-sm break-words';
}

export default function ChatWindow({
  messages,
  unreadCount,
  player,
  onSend,
  onOpenChange,
}: ChatWindowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 344,
    y: window.innerHeight - 420,
  }));

  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange(open);
    },
    [onOpenChange]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      dragOffset.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        setPos({
          x: Math.max(0, ev.clientX - dragOffset.current.x),
          y: Math.max(0, ev.clientY - dragOffset.current.y),
        });
      };

      const handleUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [pos]
  );

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    setShowEmojis(false);
  }, [input, onSend]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSend();
    },
    [handleSend]
  );

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSend(emoji);
      setShowEmojis(false);
    },
    [onSend]
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => handleOpen(true)}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}
        className="relative bg-[#9b5fa5] hover:bg-[#7a4a84] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        title="Abrir chat"
      >
        <MessageCircle size={26} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#f37eb9] text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 50, width: 320 }}
      className="flex flex-col rounded-2xl shadow-2xl border border-[#e9b8d9] overflow-hidden bg-white"
    >
      {/* Header arrastável */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-4 py-3 bg-[#9b5fa5] cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-white opacity-80" />
          <span className="text-white font-semibold text-sm">Chat da sala</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="text-white opacity-70 hover:opacity-100 transition-opacity p-1 rounded"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleOpen(false)}
            className="text-white opacity-70 hover:opacity-100 transition-opacity p-1 rounded"
            title="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mensagens */}
          <div className="flex flex-col gap-2 p-3 h-64 overflow-y-auto bg-[#fdf6fb]">
            {messages.length === 0 && (
              <p className="text-center text-[#c9a0d0] text-xs mt-8">Nenhuma mensagem ainda 🌸</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${getMessageAlign(msg, player)}`}>
                {msg.type === 'system' ? (
                  <span className={getBubbleStyle(msg, player)}>{msg.text}</span>
                ) : (
                  <>
                    <span className="text-[10px] text-gray-400 px-1">
                      {msg.playerName} · {formatTime(msg.timestamp)}
                    </span>
                    <span className={getBubbleStyle(msg, player)}>{msg.text}</span>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Picker de emojis */}
          {showEmojis && (
            <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-[#f0d6eb] bg-white">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-[#f0d6eb] bg-white">
            <button
              type="button"
              onClick={() => setShowEmojis((prev) => !prev)}
              className={`text-xl transition-transform hover:scale-110 ${showEmojis ? 'opacity-100' : 'opacity-60'}`}
              title="Emojis"
            >
              😄
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Mensagem..."
              maxLength={200}
              className="flex-1 text-sm bg-[#fdf6fb] border border-[#e9b8d9] rounded-xl px-3 py-1.5 outline-none focus:border-[#9b5fa5] transition-colors placeholder-[#d4a8c7]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-[#9b5fa5] hover:bg-[#7a4a84] disabled:opacity-40 text-white rounded-xl p-1.5 transition-colors"
              title="Enviar"
            >
              <Send size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
