import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  Pin,
  Search,
  X,
  BookOpen,
  Tv,
  Smartphone,
  Flame,
  Check,
  RotateCcw,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';
import { ChatSession, Category, Language } from '../types';
import { UI_TEXT, CATEGORIES } from '../data/translations';
import { MemoMangaLogo } from './MemoMangaLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onClearAll: () => void;
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onClearAll,
  selectedCategory,
  onSelectCategory,
  language,
}) => {
  const t = UI_TEXT[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter sessions by category & search query
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [sessions, selectedCategory, searchQuery]);

  // Group sessions by recency
  const groupedSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const last7Days: ChatSession[] = [];
    const older: ChatSession[] = [];
    const pinned: ChatSession[] = [];

    filteredSessions.forEach((s) => {
      if (s.pinned) {
        pinned.push(s);
        return;
      }
      const diff = now - s.updatedAt;
      if (diff < oneDay) {
        today.push(s);
      } else if (diff < 2 * oneDay) {
        yesterday.push(s);
      } else if (diff < 7 * oneDay) {
        last7Days.push(s);
      } else {
        older.push(s);
      }
    });

    return { pinned, today, yesterday, last7Days, older };
  }, [filteredSessions]);

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'anime':
        return <Tv className="h-3.5 w-3.5 text-sky-500/80 shrink-0" />;
      case 'manga':
        return <BookOpen className="h-3.5 w-3.5 text-emerald-500/80 shrink-0" />;
      case 'manhwa':
        return <Smartphone className="h-3.5 w-3.5 text-purple-500/80 shrink-0" />;
      case 'manhua':
        return <Flame className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingId === session.id;

    return (
      <div
        key={session.id}
        id={`chat-item-${session.id}`}
        onClick={() => {
          if (!isEditing) {
            onSelectSession(session.id);
            onClose();
          }
        }}
        className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
          isActive
            ? 'bg-zinc-200/80 dark:bg-[#282828] text-zinc-900 dark:text-zinc-100 font-medium shadow-2xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#202020] hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        {session.pinned ? (
          <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
        ) : (
          getCategoryIcon(session.category)
        )}

        {isEditing ? (
          <div
            className="flex flex-1 items-center gap-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(e, session.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="h-6 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1b1b1b] px-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#800000]"
              autoFocus
            />
            <button
              type="button"
              onClick={(e) => handleSaveRename(e, session.id)}
              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(null);
              }}
              className="p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="truncate flex-1 text-start" title={session.title}>
            {session.title || t.newChat}
          </span>
        )}

        {/* Hover action buttons */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              className="p-1 text-zinc-400 hover:text-amber-500 rounded transition-colors"
              title={session.pinned ? t.unpinChat : t.pinChat}
            >
              <Pin className={`h-3 w-3 ${session.pinned ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(e) => handleStartRename(e, session)}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
              title={t.renameChat}
            >
              <Edit3 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
              title={t.deleteChat}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#f9f9f9] dark:bg-[#171717] border-r border-zinc-200/80 dark:border-zinc-800/80 select-none">
      {/* Top Brand Header */}
      <div className="flex items-center justify-between p-3.5 pb-2.5">
        <MemoMangaLogo size="md" showText={true} subtitle={t.appBadge} />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#252525] transition-colors"
          title="Close sidebar"
        >
          <PanelLeftClose className="h-4.5 w-4.5 hidden md:block" />
          <X className="h-4.5 w-4.5 md:hidden" />
        </button>
      </div>

      {/* New Chat Button (ChatGPT style) */}
      <div className="p-3 pb-2">
        <button
          id="sidebar-new-chat-btn"
          type="button"
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-xl bg-[#800000] hover:bg-[#680000] text-white py-2.5 px-3.5 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{t.newChat}</span>
          </div>
          <Sparkles className="h-3.5 w-3.5 text-white/70" />
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="px-3 py-1">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-2xs'
                    : 'bg-zinc-200/50 dark:bg-[#232323] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                <span>{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <Search className="absolute inset-y-0 start-2.5 my-auto h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchChats}
            className="h-8 w-full rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#202020] ps-8 pe-7 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#800000] focus:outline-none focus:ring-1 focus:ring-[#800000] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 end-2 my-auto flex h-4 w-4 items-center justify-center text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-zinc-400 dark:text-zinc-500">
            <MessageSquare className="h-7 w-7 mb-2 stroke-1 text-zinc-300 dark:text-zinc-600" />
            <p>{searchQuery ? t.noChatsFound : t.emptyHistory}</p>
          </div>
        ) : (
          <>
            {/* Pinned Chats */}
            {groupedSessions.pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <Pin className="h-2.5 w-2.5 fill-current" />
                  <span>{language === 'ar' ? 'المثبتة' : 'Pinned'}</span>
                </div>
                <div className="space-y-0.5">{groupedSessions.pinned.map(renderSessionItem)}</div>
              </div>
            )}

            {/* Today */}
            {groupedSessions.today.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t.historyToday}
                </div>
                <div className="space-y-0.5">{groupedSessions.today.map(renderSessionItem)}</div>
              </div>
            )}

            {/* Yesterday */}
            {groupedSessions.yesterday.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t.historyYesterday}
                </div>
                <div className="space-y-0.5">{groupedSessions.yesterday.map(renderSessionItem)}</div>
              </div>
            )}

            {/* Previous 7 Days */}
            {groupedSessions.last7Days.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t.historyLast7Days}
                </div>
                <div className="space-y-0.5">{groupedSessions.last7Days.map(renderSessionItem)}</div>
              </div>
            )}

            {/* Older */}
            {groupedSessions.older.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t.historyOlder}
                </div>
                <div className="space-y-0.5">{groupedSessions.older.map(renderSessionItem)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar Footer (ChatGPT bottom user tray) */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 p-3 bg-zinc-100/50 dark:bg-[#141414]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClearAll}
            disabled={sessions.length === 0}
            className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 transition-colors"
            title={t.clearAllChats}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.clearAllChats}</span>
          </button>

          <span className="text-[11px] text-zinc-400 font-mono">
            {sessions.length} {language === 'ar' ? 'محادثات' : 'chats'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Controlled by isOpen) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 z-20 transition-[width,opacity] duration-200 overflow-hidden ${
          isOpen ? 'w-68 shrink-0 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div className="w-68 h-full">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className="relative flex w-[85%] max-w-xs flex-col h-full shadow-2xl animate-in slide-in-from-start duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
