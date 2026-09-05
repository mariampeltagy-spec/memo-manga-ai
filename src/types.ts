export type Language = 'ar' | 'en';

export type Theme = 'light' | 'dark';

export type Category = 'all' | 'anime' | 'manga' | 'manhwa' | 'manhua';

export interface SourceItem {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  category?: Category;
  isStreaming?: boolean;
  isSearching?: boolean;
  searchQuery?: string;
  sources?: SourceItem[];
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  category: Category;
  pinned?: boolean;
}

export interface QuickPrompt {
  id: string;
  category: Category;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  promptEn: string;
  promptAr: string;
  icon: string;
}
