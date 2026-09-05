export interface SearchSource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface SearchResult {
  performed: boolean;
  query: string;
  sources: SearchSource[];
  summaryContext?: string;
}

// Arabic to English anime/manga terms for cross-lingual searching
const ARABIC_TO_ENGLISH_TERMS: Record<string, string> = {
  'سولو ليفلينج': 'Solo Leveling',
  'سولو ليفلينغ': 'Solo Leveling',
  'ون بيس': 'One Piece',
  'هجوم العمالقة': 'Attack on Titan',
  'قاتل الشياطين': 'Demon Slayer',
  'جوجوتسو كايسن': 'Jujutsu Kaisen',
  'بليتش': 'Bleach',
  'ناروتو': 'Naruto',
  'ديث نوت': 'Death Note',
  'هانتر': 'Hunter x Hunter',
  'القناص': 'Hunter x Hunter',
  'تشينسو مان': 'Chainsaw Man',
  'رجل المنشار': 'Chainsaw Man',
  'كايجو': 'Kaiju No. 8',
  'برج الإله': 'Tower of God',
  'وجهة نظر القارئ': 'Omniscient Reader',
  'وجهة نظر القارئ العليم': 'Omniscient Reader',
  'ري زيرو': 'Re:Zero',
  'صعود بطل الدرع': 'The Rising of the Shield Hero',
  'دراغون بول': 'Dragon Ball',
  'فيري تيل': 'Fairy Tail',
  'طوكيو غول': 'Tokyo Ghoul',
  'دكتور ستون': 'Dr. Stone',
  'فول ميتال': 'Fullmetal Alchemist',
  'لوكيسم': 'Lookism',
  'ويند بريكر': 'Wind Breaker',
  'سول لاند': 'Soul Land',
  'مارتيال بيك': 'Martial Peak',
  'بيرسيرك': 'Berserk',
  'فينلاند ساجا': 'Vinland Saga',
  'فايلوت إيفرجاردن': 'Violet Evergarden',
  'بوكو نو هيرو': 'My Hero Academia',
  'أكاديمية بطلي': 'My Hero Academia',
  'رجل اللكمة الواحدة': 'One Punch Man',
  'ون بنش مان': 'One Punch Man',
  'عودة جبل هوا': 'Return of the Mount Hua Sect',
  'نانو ماشين': 'Nano Machine',
  'الابن الأصغر لسيد السيف': "Swordmaster's Youngest Son",
  'هايكيو': 'Haikyuu',
  'سلام دانك': 'Slam Dunk',
  'مونستر': 'Monster',
  'مذكرة الموت': 'Death Note',
};

/**
 * Determines whether a user message requires external or current web search.
 * Returns false for greetings and small talk (e.g. "عامل إيه؟", "Hi").
 */
export function shouldPerformWebSearch(messageText: string): boolean {
  if (!messageText) return false;
  const clean = messageText.trim().toLowerCase();

  // Very short query
  if (clean.length < 3) return false;

  // Exact small-talk patterns that must NOT search
  const smallTalkPatterns = [
    /^(hi|hello|hey|yo|hiya|hola|howdy|sup|wassup)[\s!.,?]*$/i,
    /^(how are you|how're you|how do you do|how is it going|how's it going|what's up)[\s!.,?]*$/i,
    /^(who are you|what are you|what can you do|what is your name|tell me about yourself)[\s!.,?]*$/i,
    /^(thanks|thank you|thx|ty|great|awesome|cool|nice|okay|ok|good)[\s!.,?]*$/i,
    /^(good morning|good afternoon|good evening|good night|bye|goodbye|see you)[\s!.,?]*$/i,
    // Arabic greetings and chit-chat
    /^(مرحبا|مرحباً|أهلا|اهلا|أهلاً|اهلاً|هلا|هاي|سلام|السلام عليكم|تحياتي)[\s!.,؟]*$/i,
    /^(عامل إيه|عامل ايه|شخبارك|كيف حالك|كيفك|شلونك|شو أخبارك|شو اخبارك|أخبارك|اخبارك)[\s!.,؟]*$/i,
    /^(من أنت|مين أنت|مين انت|من انت|عرفني بنفسك|شو بتعرف تعمل|ماذا تستطيع أن تفعل)[\s!.,؟]*$/i,
    /^(شكرا|شكراً|تسلم|يعطيك العافية|مشكور|تمام|اوكي|أوكي|حلو|ماشي|ممتاز|رائع)[\s!.,؟]*$/i,
    /^(صباح الخير|مساء الخير|تصبح على خير|مع السلامة|باي)[\s!.,؟]*$/i,
  ];

  for (const pattern of smallTalkPatterns) {
    if (pattern.test(clean)) {
      return false;
    }
  }

  // Common keywords that strongly signal a search is needed
  const searchTriggers = [
    // English triggers
    'when', 'release', 'date', 'air', 'season', 'latest', 'news', 'update',
    'chapter', 'episode', 'manga', 'anime', 'manhwa', 'manhua', 'author',
    'studio', 'voice actor', 'seiyuu', 'ending', 'status', 'ongoing',
    'finished', 'hiatus', 'rating', 'review', 'recommend', 'ranked',
    'who is', 'what is', 'tell me about', 'summary', 'plot', 'versus', 'vs',
    'difference', 'adaptation', 'announced', 'upcoming', 'premiered',
    'schedule', 'premiere', 'ova', 'movie', 'film',
    // Arabic triggers
    'موعد', 'تاريخ', 'نزول', 'عرض', 'صدور', 'موسم', 'جزء', 'حلقة', 'فصل',
    'مانجا', 'مانغا', 'أنمي', 'انمي', 'مانهوا', 'مانهو',
    'مؤلف', 'استوديو', 'أخبار', 'اخبار', 'جديد', 'آخر', 'اخر', 'هل', 'متى',
    'من هو', 'ما هو', 'ما هي', 'قصة', 'أفضل', 'افضل', 'ترتيب', 'تقييم', 'أحداث', 'احداث',
    'نهاية', 'مقارنة', 'معلومات', 'تفاصيل', 'توقف', 'مستمر', 'منتهي', 'متى يعود'
  ];

  for (const trigger of searchTriggers) {
    if (clean.includes(trigger)) {
      return true;
    }
  }

  // Any message with a question mark or substantive query length
  if (clean.includes('?') || clean.includes('؟') || clean.length > 25) {
    return true;
  }

  return false;
}

/**
 * Normalizes query and translates key Arabic anime names to English for better cross-engine results.
 */
export function extractSearchQueries(userMessage: string): {
  rawQuery: string;
  cleanKeywords: string;
  englishTarget: string;
  arabicTarget: string;
} {
  const rawQuery = userMessage.trim();

  // Detect mapped title
  let detectedEnglish = '';
  let detectedArabic = '';
  for (const [ar, en] of Object.entries(ARABIC_TO_ENGLISH_TERMS)) {
    if (rawQuery.includes(ar)) {
      detectedArabic = ar;
      detectedEnglish = en;
      break;
    }
  }

  // Clean conversational filler words
  const cleanKeywords = rawQuery
    .replace(/[؟?؟!.,;:"'()[\]{}]/g, ' ')
    .replace(/\b(what|is|the|when|does|will|release|date|of|about|tell|me|how|many|episodes|chapters|in|who|author)\b/gi, ' ')
    .replace(/(ما هو|ما هي|ما|متى|موعد|نزول|عرض|صدور|كم عدد|حلقات|فصول|قصة|معلومات عن|أخبار|اخبار)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If we detected a specific anime/manga term, use it as the English target
  let englishTarget = detectedEnglish;
  if (!englishTarget) {
    // If user typed in English or mixed, extract Latin characters
    const latinMatch = rawQuery.match(/[a-zA-Z0-9\s'-]{3,}/g);
    if (latinMatch) {
      englishTarget = latinMatch.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      englishTarget = cleanKeywords;
    }
  }

  const arabicTarget = detectedArabic || cleanKeywords;

  return {
    rawQuery,
    cleanKeywords,
    englishTarget,
    arabicTarget,
  };
}

/**
 * Searches AniList GraphQL API for verified Anime/Manga information.
 */
async function searchAniList(query: string): Promise<SearchSource[]> {
  if (!query || query.length < 2) return [];
  try {
    const gql = `
      query ($search: String) {
        Page(page: 1, perPage: 2) {
          media(search: $search) {
            id
            type
            title { romaji english native }
            status
            episodes
            chapters
            format
            description(asHtml: false)
            siteUrl
            startDate { year month day }
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search: query } }),
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: {
        Page?: {
          media?: Array<{
            id: number;
            type: string;
            title: { romaji?: string; english?: string; native?: string };
            status?: string;
            episodes?: number;
            chapters?: number;
            format?: string;
            description?: string;
            siteUrl?: string;
            startDate?: { year?: number; month?: number; day?: number };
          }>;
        };
      };
    };

    const mediaList = data?.data?.Page?.media || [];
    const results: SearchSource[] = [];

    for (const m of mediaList) {
      const displayTitle = m.title.english || m.title.romaji || m.title.native;
      if (!displayTitle || !m.siteUrl) continue;

      const details = [
        m.status ? `Status: ${m.status}` : '',
        m.episodes ? `Episodes: ${m.episodes}` : m.chapters ? `Chapters: ${m.chapters}` : '',
        m.startDate?.year ? `Year: ${m.startDate.year}` : '',
        m.description ? m.description.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : '',
      ].filter(Boolean).join(' | ');

      results.push({
        title: `${displayTitle} (${m.type}) - AniList`,
        url: m.siteUrl,
        domain: 'anilist.co',
        snippet: details,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Searches Wikipedia (Arabic or English) for verified encyclopedic information.
 */
async function searchWikipedia(query: string, lang: 'ar' | 'en'): Promise<SearchSource[]> {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MemoMangaAI/1.0 (https://ais.run.app)' },
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: {
        search?: Array<{
          title: string;
          snippet: string;
        }>;
      };
    };

    const items = data.query?.search?.slice(0, 2) || [];
    const results: SearchSource[] = [];

    for (const item of items) {
      const pageTitle = item.title;
      const cleanSnippet = item.snippet
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();

      const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;

      results.push({
        title: `${pageTitle} - ${lang === 'ar' ? 'ويكيبيديا' : 'Wikipedia'}`,
        url: pageUrl,
        domain: `${lang}.wikipedia.org`,
        snippet: cleanSnippet,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Searches DuckDuckGo HTML for broader external web results (Crunchyroll, AnimeNewsNetwork, MyAnimeList, etc.).
 */
async function searchDuckDuckGo(query: string): Promise<SearchSource[]> {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const results: SearchSource[] = [];

    const blocks = html.split(/class="[^"]*result\s+results_links/);
    for (let i = 1; i < blocks.length && results.length < 5; i++) {
      const block = blocks[i];
      const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i);

      if (titleMatch) {
        const rawHref = titleMatch[1];
        let finalUrl = rawHref;

        const uddgMatch = rawHref.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          finalUrl = decodeURIComponent(uddgMatch[1]);
        }

        // Filter out ads and non-http URLs
        if (
          finalUrl.includes('duckduckgo.com/y.js') ||
          finalUrl.includes('bing.com/aclick') ||
          !finalUrl.startsWith('http')
        ) {
          continue;
        }

        let domain = '';
        try {
          domain = new URL(finalUrl).hostname.replace('www.', '');
        } catch {
          domain = 'web';
        }

        const title = titleMatch[2]
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();

        const snippet = snippetMatch
          ? snippetMatch[1]
              .replace(/<[^>]+>/g, '')
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' ')
              .trim()
          : '';

        results.push({
          title,
          url: finalUrl,
          domain,
          snippet,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Unified server-side web search aggregator for Anime, Manga, Manhwa, and Manhua queries.
 */
export async function executeMangaWebSearch(userMessage: string): Promise<SearchResult> {
  const shouldSearch = shouldPerformWebSearch(userMessage);
  if (!shouldSearch) {
    return { performed: false, query: userMessage, sources: [] };
  }

  const { rawQuery, cleanKeywords, englishTarget, arabicTarget } = extractSearchQueries(userMessage);
  const isArabic = /[\u0600-\u06FF]/.test(userMessage);

  // Run search queries in parallel across reliable sources
  const searchPromises: Array<Promise<SearchSource[]>> = [];

  // 1. AniList (best for title, status, episode count, release dates)
  if (englishTarget) {
    searchPromises.push(searchAniList(englishTarget));
  }

  // 2. Wikipedia (in user's language + english)
  if (isArabic) {
    if (arabicTarget) {
      searchPromises.push(searchWikipedia(arabicTarget, 'ar'));
    }
    if (englishTarget) {
      searchPromises.push(searchWikipedia(englishTarget, 'en'));
    }
  } else {
    searchPromises.push(searchWikipedia(englishTarget || cleanKeywords || rawQuery, 'en'));
  }

  // 3. DuckDuckGo for broader web results (reviews, discussions, news)
  const ddgQuery = englishTarget ? `${englishTarget} anime manga` : cleanKeywords;
  if (ddgQuery) {
    searchPromises.push(searchDuckDuckGo(ddgQuery));
  }

  const settleResults = await Promise.allSettled(searchPromises);
  const rawSources: SearchSource[] = [];

  for (const outcome of settleResults) {
    if (outcome.status === 'fulfilled') {
      rawSources.push(...outcome.value);
    }
  }

  // Deduplicate sources by URL
  const seenUrls = new Set<string>();
  const uniqueSources: SearchSource[] = [];

  for (const src of rawSources) {
    if (!src.url || seenUrls.has(src.url)) continue;
    seenUrls.add(src.url);
    uniqueSources.push(src);
    if (uniqueSources.length >= 5) break;
  }

  // Format concise summary context for Gemini model grounding
  let summaryContext = '';
  if (uniqueSources.length > 0) {
    summaryContext = uniqueSources
      .map((s, idx) => `[Source ${idx + 1}: ${s.title} (${s.domain})]\nURL: ${s.url}\nInformation: ${s.snippet}`)
      .join('\n\n');
  }

  return {
    performed: true,
    query: isArabic ? (arabicTarget || rawQuery) : (englishTarget || rawQuery),
    sources: uniqueSources,
    summaryContext,
  };
}
