import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Edit2,
  Sparkles,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Message, Language } from '../types';
import { UI_TEXT } from '../data/translations';
import { MemoMangaLogo } from './MemoMangaLogo';

interface ChatMessageProps {
  message: Message;
  language: Language;
  onRegenerate?: () => void;
  onEditSubmit?: (newText: string) => void;
  isLastAssistantMessage?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  language,
  onRegenerate,
  onEditSubmit,
  isLastAssistantMessage,
}) => {
  const t = UI_TEXT[language];
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);

    // Pick appropriate voice based on content
    const voices = window.speechSynthesis.getVoices();
    const hasArabic = /[\u0600-\u06FF]/.test(message.content);
    if (hasArabic) {
      utterance.lang = 'ar-SA';
      const arVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arVoice) utterance.voice = arVoice;
    } else {
      utterance.lang = 'en-US';
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditSubmit) {
      onEditSubmit(editContent.trim());
    }
    setIsEditing(false);
  };

  // USER MESSAGE LAYOUT (Modern ChatGPT Style: elegant pill aligned to end)
  if (!isAssistant) {
    return (
      <div
        id={`message-${message.id}`}
        className="group relative flex w-full flex-col items-end py-3 px-3 sm:px-6"
      >
        <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%]">
          {isEditing ? (
            <div className="w-full min-w-[280px] sm:min-w-[400px] space-y-2 rounded-2xl bg-zinc-100 dark:bg-[#2f2f2f] p-3 border border-zinc-300 dark:border-zinc-700">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-y min-h-[70px] bg-transparent p-1 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none leading-relaxed"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-[#800000] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#680000] transition-colors shadow-2xs"
                >
                  {t.saveAndSubmit}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl rounded-br-lg rtl:rounded-bl-lg rtl:rounded-br-3xl px-4.5 py-2.5 bg-zinc-100 dark:bg-[#2f2f2f] text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed shadow-2xs">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* User message hover actions */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEditSubmit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(true);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                  title={t.editPrompt}
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                title={t.copy}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ASSISTANT MESSAGE LAYOUT (Modern ChatGPT Style: full width aligned with avatar header)
  return (
    <div
      id={`message-${message.id}`}
      className="group relative flex w-full gap-3 sm:gap-4 py-4 sm:py-5 px-3 sm:px-6 transition-colors"
    >
      {/* Assistant Logo Avatar */}
      <div className="shrink-0 pt-0.5">
        <MemoMangaLogo size="sm" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Assistant Header Info */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t.appName}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[#800000]/8 dark:bg-[#800000]/25 px-1.5 py-0.5 text-[10px] font-medium text-[#800000] dark:text-rose-300 border border-[#800000]/15 dark:border-[#800000]/30">
            <Sparkles className="h-2.5 w-2.5" />
            <span>{t.modelBadge}</span>
          </span>
          <span className="text-[10px] text-zinc-400">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Searching Web Indicator */}
        {message.isSearching && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#800000]/10 text-[#800000] dark:bg-[#800000]/25 dark:text-rose-300 border border-[#800000]/20 animate-pulse my-1">
            <Globe className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span className="truncate max-w-[320px]">
              {t.searchingWeb}
              {message.searchQuery ? ` (${message.searchQuery})` : ''}
            </span>
          </div>
        )}

        {/* Message Body */}
        <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
          <div className="markdown-content overflow-hidden">
            <Markdown>{message.content}</Markdown>
            {message.isStreaming && (
              <span className="inline-block h-3.5 w-1.5 ms-1 bg-[#800000] dark:bg-rose-400 animate-pulse align-middle" />
            )}
          </div>

          {/* Real Web Sources Section */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                <Globe className="h-3.5 w-3.5 text-[#800000] dark:text-rose-400 shrink-0" />
                <span>{t.sourcesHeading}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-zinc-100/90 dark:bg-[#282828] hover:bg-[#800000]/10 dark:hover:bg-[#800000]/25 border border-zinc-200 dark:border-zinc-700/80 hover:border-[#800000]/40 transition-all text-zinc-700 dark:text-zinc-300 hover:text-[#800000] dark:hover:text-rose-300 shadow-2xs"
                    title={src.snippet || src.title}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#800000] dark:bg-rose-400 shrink-0" />
                    <span className="font-medium max-w-[210px] truncate">{src.title}</span>
                    {src.domain && (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                        {src.domain}
                      </span>
                    )}
                    <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 shrink-0 ms-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assistant Action Toolbar (ChatGPT style) */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-1 pt-2 text-zinc-400 select-none">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-[#282828] hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              title={copied ? t.copied : t.copy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {t.copied}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="text-[11px]">{t.copy}</span>
                </>
              )}
            </button>

            {/* Read Aloud Button */}
            {'speechSynthesis' in window && (
              <button
                type="button"
                onClick={handleSpeech}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-[#282828] transition-colors ${
                  isSpeaking
                    ? 'text-[#800000] dark:text-rose-400 font-semibold'
                    : 'hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
                title={isSpeaking ? t.stopReading : t.readAloud}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                    <span className="text-[11px]">{t.stopReading}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="text-[11px]">{t.readAloud}</span>
                  </>
                )}
              </button>
            )}

            {/* Regenerate (if last message) */}
            {isLastAssistantMessage && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-[#282828] hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title={t.regenerate}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-[11px]">{t.regenerate}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
