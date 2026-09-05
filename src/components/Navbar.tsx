import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Sun,
  Moon,
  Languages,
  Edit2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { UI_TEXT } from '../data/translations';
import { MemoMangaLogo } from './MemoMangaLogo';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  currentChatTitle?: string;
  onRenameChat?: (newTitle: string) => void;
  isStreaming?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  theme,
  onToggleTheme,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  currentChatTitle,
  onRenameChat,
  isStreaming,
}) => {
  const t = UI_TEXT[language];
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(currentChatTitle || '');

  const handleSaveTitle = () => {
    if (titleDraft.trim() && onRenameChat) {
      onRenameChat(titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitleDraft(currentChatTitle || '');
    setIsEditingTitle(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#212121]/90 backdrop-blur-md px-3 sm:px-4 transition-colors">
      {/* Left side: Sidebar toggle & Title / Brand */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Toggle Sidebar Button (Desktop & Mobile) */}
        <button
          id="toggle-sidebar-btn"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800000]"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4.5 w-4.5" />
          ) : (
            <PanelLeft className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Brand or Active Conversation Title */}
        <div className="flex items-center gap-2 min-w-0">
          {!sidebarOpen && (
            <div className="hidden sm:flex items-center">
              <MemoMangaLogo size="sm" showText={!currentChatTitle} subtitle={t.appBadge} />
            </div>
          )}

          {currentChatTitle && !isEditingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 max-w-[140px] sm:max-w-[280px]">
                {currentChatTitle}
              </span>
              {onRenameChat && (
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(currentChatTitle);
                    setIsEditingTitle(true);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                  title={t.renameChat}
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelTitle();
                }}
                className="h-7 w-36 sm:w-48 px-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#2a2a2a] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#800000]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelTitle}
                className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            sidebarOpen && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {t.appName}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right side: Model indicator, New Chat, Language & Theme toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Model pill */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#282828] px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300">
          <Sparkles className="h-3 w-3 text-[#800000] dark:text-rose-400" />
          <span className="font-medium text-[11px]">{t.modelBadge}</span>
        </div>

        {/* Quick New Chat button */}
        <button
          id="nav-new-chat-btn"
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#282828] px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-[#800000]/40 dark:hover:border-[#800000]/60 hover:bg-zinc-50 dark:hover:bg-[#2e2e2e] transition-colors disabled:opacity-50"
          title={t.newChat}
        >
          <Plus className="h-3.5 w-3.5 text-[#800000] dark:text-rose-400" />
          <span className="hidden sm:inline">{t.newChat}</span>
        </button>

        {/* Language switch button */}
        <button
          id="toggle-language-btn"
          type="button"
          onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#282828] px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-[#800000]/30 hover:bg-zinc-50 dark:hover:bg-[#2e2e2e] transition-colors"
          title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
          <Languages className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="font-bold">{language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* Theme switch button */}
        <button
          id="toggle-theme-btn"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#282828] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#2e2e2e] transition-colors"
          title={theme === 'dark' ? t.lightMode : t.darkMode}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-zinc-600 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
};
