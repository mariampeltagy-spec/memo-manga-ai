import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { EmptyState } from './components/EmptyState';
import { ChatInput } from './components/ChatInput';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ChatSession, Message, Category, Language, Theme } from './types';
import { UI_TEXT } from './data/translations';

const STORAGE_CHATS_KEY = 'memo_manga_ai_sessions_v1';
const STORAGE_LANG_KEY = 'memo_manga_ai_lang_v1';
const STORAGE_THEME_KEY = 'memo_manga_ai_theme_v1';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark'; // Default to dark for premium manga atmosphere
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
    return navigator.language.startsWith('ar') ? 'ar' : 'en';
  });

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse sessions from localStorage', e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return sessions.length > 0 ? sessions[0].id : null;
  });

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  
  // Responsive sidebar open state (open by default on desktop)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Modal confirm state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    targetId?: string;
  }>({
    isOpen: false,
    type: 'single',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  const t = UI_TEXT[language];

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  // Sync language with document direction & lang attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem(STORAGE_LANG_KEY, language);
  }, [language]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to persist sessions', e);
    }
  }, [sessions]);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeSessionId]);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom('smooth');
    }
  }, [messages, isStreaming, scrollToBottom]);

  // Toggle theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Switch language
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // Create a new chat session
  const handleNewChat = (category: Category = selectedCategory) => {
    if (isStreaming && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }

    const newId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSession: ChatSession = {
      id: newId,
      title: '',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput('');
  };

  // Stop current streaming generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Turn off isStreaming flag on active message
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId) return session;
          const updatedMsgs = session.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...session, messages: updatedMsgs };
        })
      );
    }
  };

  // Send message implementation
  const executeSendMessage = async (userText: string, currentSessionId: string, history: Message[]) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    const assistantMsgId = `asst_${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
      category: selectedCategory,
    };

    // Append empty assistant message to session
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          messages: [...history, initialAssistantMsg],
        };
      })
    );

    // Prepare message history payload for server
    const apiMessages = [...history, { role: 'user', content: userText }].map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));

    let accumulatedText = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
          language,
          category: selectedCategory,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not supported');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.replace(/^data: /, '').trim();
          if (dataStr === '[DONE]') break;

          let data: any = null;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.type === 'status' && data.status === 'searching') {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const updated = s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isSearching: true, searchQuery: data.query || '' }
                    : m
                );
                return { ...s, messages: updated };
              })
            );
          } else if (data.type === 'sources' && Array.isArray(data.sources)) {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const updated = s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isSearching: false, sources: data.sources }
                    : m
                );
                return { ...s, messages: updated };
              })
            );
          } else if (data.text) {
            accumulatedText += data.text;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSessionId) return s;
                const updated = s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isSearching: false, content: accumulatedText }
                    : m
                );
                return { ...s, messages: updated };
              })
            );
          }
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error(language === 'ar' ? 'تعذر استلام الرد من النموذج. يرجى المحاولة مرة أخرى.' : 'No response was generated. Please try again.');
      }

      // Finalize assistant message
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const updated = s.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, isStreaming: false, isSearching: false, content: accumulatedText }
              : m
          );
          return { ...s, messages: updated, updatedAt: Date.now() };
        })
      );
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        console.log('Generation aborted by user');
      } else {
        console.error('Chat error:', err);
        const errMessage = (err as Error).message || 'Failed to generate response.';
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            const updated = s.messages.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    isStreaming: false,
                    isSearching: false,
                    error: true,
                    content: accumulatedText.trim()
                      ? `${accumulatedText}\n\n⚠️ *(${errMessage})*`
                      : `⚠️ **${t.errorTitle}**\n\n${errMessage}\n\n*${t.apiKeyNotice}*`,
                  }
                : m
            );
            return { ...s, messages: updated };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : input).trim();
    if (!text || isStreaming) return;

    let targetSessionId = activeSessionId;
    let targetSession = sessions.find((s) => s.id === targetSessionId);

    // Create session if none exists
    if (!targetSession) {
      const newId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = text.length > 36 ? text.substring(0, 36) + '...' : text;
      const newSession: ChatSession = {
        id: newId,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        category: selectedCategory,
      };
      setSessions((prev) => [newSession, ...prev]);
      targetSessionId = newId;
      targetSession = newSession;
      setActiveSessionId(newId);
    } else if (!targetSession.title) {
      // Auto-set title from first user prompt
      const title = text.length > 36 ? text.substring(0, 36) + '...' : text;
      setSessions((prev) =>
        prev.map((s) => (s.id === targetSessionId ? { ...s, title } : s))
      );
    }

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now(),
      category: selectedCategory,
    };

    const currentHistory = targetSession ? [...targetSession.messages, userMessage] : [userMessage];

    // Optimistically add user message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== targetSessionId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          messages: currentHistory,
        };
      })
    );

    setInput('');
    executeSendMessage(text, targetSessionId, currentHistory);
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeSession || isStreaming) return;
    const msgs = activeSession.messages;
    if (msgs.length === 0) return;

    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const trimmedHistory = msgs.slice(0, lastUserIndex + 1);
    const userText = msgs[lastUserIndex].content;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        return { ...s, messages: trimmedHistory };
      })
    );

    executeSendMessage(userText, activeSession.id, trimmedHistory.slice(0, -1));
  };

  // Edit user message and resubmit
  const handleEditSubmit = (newText: string) => {
    if (!activeSession || isStreaming) return;
    handleSendMessage(newText);
  };

  // Rename a chat
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Pin/unpin a chat
  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  // Delete a single chat session
  const handleDeleteSession = (id: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      targetId: id,
    });
  };

  // Clear all chats
  const handleClearAll = () => {
    setDeleteModal({
      isOpen: true,
      type: 'all',
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === 'single' && deleteModal.targetId) {
      const remaining = sessions.filter((s) => s.id !== deleteModal.targetId);
      setSessions(remaining);
      if (activeSessionId === deleteModal.targetId) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } else if (deleteModal.type === 'all') {
      if (isStreaming && abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsStreaming(false);
      }
      setSessions([]);
      setActiveSessionId(null);
    }
  };

  // Select starter prompt
  const handleSelectStarterPrompt = (promptText: string, category: Category) => {
    setSelectedCategory(category);
    handleSendMessage(promptText);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fdfdfd] dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Collapsible / Drawer Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          if (isStreaming) handleStopGeneration();
          setActiveSessionId(id);
        }}
        onNewChat={() => handleNewChat()}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePinSession={handleTogglePinSession}
        onClearAll={handleClearAll}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        language={language}
      />

      {/* Main Chat Interface */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative min-w-0">
        {/* Top Navbar */}
        <Navbar
          language={language}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNewChat={() => handleNewChat()}
          currentChatTitle={activeSession?.title}
          onRenameChat={
            activeSession
              ? (newTitle) => handleRenameSession(activeSession.id, newTitle)
              : undefined
          }
          isStreaming={isStreaming}
        />

        {/* Scrollable Conversation Viewport */}
        <main className="flex-1 overflow-y-auto w-full relative">
          {messages.length === 0 ? (
            <EmptyState
              language={language}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectPrompt={handleSelectStarterPrompt}
            />
          ) : (
            <div className="max-w-3xl mx-auto w-full pb-6 pt-2">
              {messages.map((message, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    language={language}
                    onRegenerate={handleRegenerate}
                    onEditSubmit={handleEditSubmit}
                    isLastAssistantMessage={isLast && message.role === 'assistant'}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        {/* Docked Chat Input */}
        <footer className="shrink-0 bg-gradient-to-t from-[#fdfdfd] via-[#fdfdfd]/95 dark:from-[#212121] dark:via-[#212121]/95 to-transparent pt-3 pb-1">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            onStop={handleStopGeneration}
            isStreaming={isStreaming}
            language={language}
            selectedCategory={selectedCategory}
            onSelectChip={(chipText) => handleSendMessage(chipText)}
            hasMessages={messages.length > 0}
          />
        </footer>
      </div>

      {/* Delete / Clear History Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'single' ? t.deleteConfirmTitle : t.clearConfirmTitle}
        description={deleteModal.type === 'single' ? t.deleteConfirmDesc : t.clearConfirmDesc}
        confirmLabel={deleteModal.type === 'single' ? t.deleteBtn : t.clearBtn}
        language={language}
      />
    </div>
  );
}
