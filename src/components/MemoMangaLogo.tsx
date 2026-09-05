import React from 'react';

interface MemoMangaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const MemoMangaLogo: React.FC<MemoMangaLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  subtitle,
}) => {
  const sizeMap = {
    sm: { box: 'h-7 w-7', icon: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'h-8 w-8', icon: 32, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'h-10 w-10', icon: 40, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'h-14 w-14', icon: 56, text: 'text-2xl', sub: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-xl shadow-xs transition-transform duration-200 hover:scale-105 ${current.box}`}
        style={{
          backgroundColor: '#800000',
          boxShadow: '0 2px 8px rgba(128, 0, 0, 0.25)',
        }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[75%] w-[75%]"
          aria-hidden="true"
        >
          {/* Subtle Manga Speedlines / Panel frame hint */}
          <path
            d="M5 8C5 6.34315 6.34315 5 8 5H24C25.6569 5 27 6.34315 27 8V24C27 25.6569 25.6569 27 24 27H8C6.34315 27 5 25.6569 5 24V8Z"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          {/* Dynamic Manga "M" Monogram with Katana Ink Stroke Aesthetic */}
          <path
            d="M8.5 23.5V11L14.2 18.2C15.1 19.3 16.9 19.3 17.8 18.2L23.5 11V23.5"
            stroke="#FFFFFF"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Shonen / AI Core Sparkle */}
          <path
            d="M16 6.5L16.8 9.2L19.5 10L16.8 10.8L16 13.5L15.2 10.8L12.5 10L15.2 9.2L16 6.5Z"
            fill="#FFE873"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-tight">
            <span
              className={`font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 ${current.text}`}
            >
              Memo Manga{' '}
              <span
                className="font-black px-1.5 py-0.2 rounded-md text-white text-[0.7em] align-middle tracking-wider"
                style={{ backgroundColor: '#800000' }}
              >
                AI
              </span>
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-zinc-500 dark:text-zinc-400 font-medium truncate ${current.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
