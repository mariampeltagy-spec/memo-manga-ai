import React from 'react';
import {
  Compass,
  Tv,
  BookOpen,
  Smartphone,
  Flame,
  ArrowUpRight,
  ArrowUpLeft,
  Sparkles,
} from 'lucide-react';
import { Category, Language, QuickPrompt } from '../types';
import { UI_TEXT, CATEGORIES, QUICK_PROMPTS } from '../data/translations';
import { MemoMangaLogo } from './MemoMangaLogo';

interface EmptyStateProps {
  language: Language;
  selectedCategory: Category;
  onSelectCategory: (cat: Category) => void;
  onSelectPrompt: (promptText: string, category: Category) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  language,
  selectedCategory,
  onSelectCategory,
  onSelectPrompt,
}) => {
  const t = UI_TEXT[language];
  const isRtl = language === 'ar';

  const filteredPrompts = QUICK_PROMPTS.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  const getPromptIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv':
        return <Tv className="h-4 w-4 text-sky-500" />;
      case 'BookOpen':
      case 'BookMarked':
        return <BookOpen className="h-4 w-4 text-emerald-500" />;
      case 'Smartphone':
      case 'Zap':
        return <Smartphone className="h-4 w-4 text-purple-500" />;
      case 'Flame':
        return <Flame className="h-4 w-4 text-amber-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-[#800000] dark:text-rose-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 max-w-3xl mx-auto text-center w-full select-none">
      {/* Brand Emblem */}
      <div className="mb-4">
        <MemoMangaLogo size="xl" showText={false} />
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {language === 'ar' ? 'ما الذي تود استكشافه اليوم؟' : 'What would you like to explore today?'}
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg font-normal leading-relaxed">
        {t.tagline}
      </p>

      {/* Minimal Category Selector Tabs */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#282828] rounded-xl border border-zinc-200/80 dark:border-zinc-800">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-white dark:bg-[#1a1a1a] text-[#800000] dark:text-rose-300 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {cat.id === 'all' && <Compass className="h-3.5 w-3.5" />}
              {cat.id === 'anime' && <Tv className="h-3.5 w-3.5" />}
              {cat.id === 'manga' && <BookOpen className="h-3.5 w-3.5" />}
              {cat.id === 'manhwa' && <Smartphone className="h-3.5 w-3.5" />}
              {cat.id === 'manhua' && <Flame className="h-3.5 w-3.5" />}
              <span>{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Clean Starter Prompt Cards Grid (ChatGPT style) */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-start">
        {filteredPrompts.slice(0, 4).map((item: QuickPrompt) => (
          <button
            key={item.id}
            id={`starter-card-${item.id}`}
            type="button"
            onClick={() =>
              onSelectPrompt(language === 'ar' ? item.promptAr : item.promptEn, item.category)
            }
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#262626] p-4 hover:border-[#800000]/40 dark:hover:border-[#800000]/60 hover:shadow-sm transition-all duration-150 text-start"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1f1f1f] text-zinc-700 dark:text-zinc-300 group-hover:bg-[#800000]/10 group-hover:text-[#800000] dark:group-hover:text-rose-300 transition-colors">
                {getPromptIcon(item.icon)}
              </div>
              <div className="text-zinc-400 group-hover:text-[#800000] dark:group-hover:text-rose-300 transition-colors">
                {isRtl ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#800000] dark:group-hover:text-rose-300 transition-colors">
                {language === 'ar' ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {language === 'ar' ? item.descAr : item.descEn}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
