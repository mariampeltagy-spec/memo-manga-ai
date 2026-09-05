import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles } from 'lucide-react';
import { Language, Category } from '../types';
import { UI_TEXT, QUICK_CHIPS } from '../data/translations';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  language: Language;
  selectedCategory: Category;
  onSelectChip: (text: string) => void;
  hasMessages: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  language,
  onSelectChip,
  hasMessages,
}) => {
  const t = UI_TEXT[language];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5 pt-1">
      {/* Quick Suggestion Chips */}
      {hasMessages && (
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 shrink-0 me-1">
            <Sparkles className="h-3 w-3 text-[#800000] dark:text-rose-400" />
            <span className="font-medium">
              {language === 'ar' ? 'اقتراحات سريعة:' : 'Quick Prompts:'}
            </span>
          </div>
          {QUICK_CHIPS.slice(0, 5).map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectChip(language === 'ar' ? chip.ar : chip.en)}
              className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#252525] px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-300 hover:border-[#800000]/40 dark:hover:border-[#800000]/50 hover:text-[#800000] dark:hover:text-rose-300 transition-colors shadow-2xs"
            >
              {language === 'ar' ? chip.ar : chip.en}
            </button>
          ))}
        </div>
      )}

      {/* Floating ChatGPT Input Box */}
      <div className="relative flex flex-col rounded-3xl border border-zinc-300/80 dark:border-zinc-700/80 bg-white dark:bg-[#2f2f2f] shadow-sm focus-within:border-[#800000] focus-within:ring-2 focus-within:ring-[#800000]/15 transition-all">
        <textarea
          ref={textareaRef}
          id="chat-input-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.inputPlaceholder}
          rows={1}
          className="w-full resize-none bg-transparent px-4.5 pt-3.5 pb-11 sm:pb-3.5 pe-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none min-h-[48px] max-h-[180px] leading-relaxed"
        />

        {/* Action Button (Send / Stop) */}
        <div className="absolute bottom-2 end-2.5 flex items-center gap-1.5">
          {isStreaming ? (
            <button
              id="stop-generation-btn"
              type="button"
              onClick={onStop}
              aria-label={t.stop}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-85 transition-all shadow-xs"
              title={t.stop}
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              id="send-message-btn"
              type="button"
              onClick={onSend}
              disabled={!input.trim()}
              aria-label={t.send}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-all shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: input.trim() ? '#800000' : '#800000',
              }}
              title={t.send}
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Subtext Disclaimer */}
      <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        {t.inputNote}
      </p>
    </div>
  );
};
