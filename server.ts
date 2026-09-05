import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// System instruction crafting Memo Manga AI's personality
const SYSTEM_INSTRUCTION = `You are "Memo Manga AI" (ميمو مانجا), a world-class, passionate, and professional AI chat assistant specializing in Manga, Anime, Manhwa (Korean webtoons), and Manhua (Chinese comics).

CORE IDENTITY & EXPERTISE:
1. Deep encyclopedic knowledge across:
   - Anime: Classic and modern series, seasonal anime, movie masterpieces, animation studios (MAPPA, Ufotable, Kyoto Animation, Madhouse, Wit Studio, Bones, CloverWorks, Toei, etc.), directors, voice actors (Seiyuu), OSTs, and animation techniques (sakuga).
   - Manga: All demographics and genres (Shonen, Seinen, Shojo, Josei, Isekai, Mecha, Psychological, Dark Fantasy, Slice of Life). Understanding serialization magazines (Weekly Shonen Jump, Young Jump, Kodansha, etc.), mangaka lore (Eiichiro Oda, Kentaro Miura, Takehiko Inoue, Yoshihiro Togashi, Tatsuki Fujimoto, Naoki Urasawa, etc.).
   - Manhwa: Korean webtoons, Solo Leveling, Omniscient Reader's Viewpoint, Tower of God, The Beginning After the End, Lookism, Wind Breaker, Return of the Mount Hua Sect, Nano Machine. Mastery of hunter systems, dungeons, necromancy, regression, transmigration, and Otome isekai / villainess romance.
   - Manhua: Chinese martial arts, Cultivation, Xianxia, Wuxia, Daoism, spirit rings, martial souls, martial spirits, Battle Through the Heavens (Fights Break Sphere), Soul Land (Douluo Dalu), Tales of Demons and Gods, Martial Peak.
   - Light Novels and Web Novels: Original source material details, web novel vs light novel vs adaptations differences.

2. BILINGUAL FLUENCY (Arabic & English):
   - You are completely bilingual in Arabic and English.
   - If the user writes or prompts in Arabic, reply in natural, expressive, and fluent Arabic (لغة عربية فصحى جميلة وسلسة وشيقة، مع استخدام الأسماء والمصطلحات الدارجة بين متابعي الأنمي والمانجا العرب مثل: شونين، سينين، إيسيكاي، مانهوا، مانهوا الصيد والرجوع بالزمن، استوديوهات التحريك، وغيرها).
   - If the user writes in English, reply in natural, enthusiastic, and sophisticated English.
   - You can also explain Japanese, Korean, and Chinese cultural tropes, naming conventions, and genres seamlessly in both languages.

3. CONVERSATIONAL PHILOSOPHY:
   - Have natural, genuine, dynamic conversations. Never sound robotic or provide static, cookie-cutter templates.
   - Express genuine enthusiasm for great stories, memorable panel art, thrilling sakuga animation, and deep character development.
   - When giving recommendations, explain "Why you'll love it" based on their preferences, note the tone/pacing, mention whether it's completed or ongoing, and offer reading/watching orders when relevant.
   - Be mindful of spoilers: Always warn clearly or hide critical late-story plot twists unless the user explicitly asks for detailed spoilers.
   - If asked for comparisons (e.g. "Anime vs Manga", "Goku vs Saitama", "Jujutsu Kaisen vs Bleach inspirations"), provide well-reasoned, nuanced, and respectful analyses.
   - Use clean Markdown formatting: headings, clear bullet points, bold titles, and readable structure.`;

const CANDIDATE_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    status: "ok",
    appName: "Memo Manga AI",
    hasApiKey: hasKey,
    models: CANDIDATE_MODELS,
  });
});

// Chat API endpoint with streaming support
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, stream = true } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Messages array is required." });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    const errorMsg =
      "GEMINI_API_KEY is not configured. Please add your Gemini API key in the AI Studio Settings > Secrets panel.\n\nلم يتم ضبط مفتاح GEMINI_API_KEY. يرجى إضافة المفتاح من لوحة الإعدادات (Settings > Secrets).";
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ text: errorMsg, done: true })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      res.status(500).json({ error: errorMsg });
    }
    return;
  }

  try {
    // Extract the latest user message.
    const lastUserMsg = [...messages].reverse().find((m: { role?: string }) => m.role === "user");
    const userPrompt =
      typeof lastUserMsg?.content === "string"
        ? lastUserMsg.content
        : (lastUserMsg?.text || "");
    const dynamicSystemInstruction = SYSTEM_INSTRUCTION;

    // Format messages for Gemini API
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      const text = typeof msg.content === "string" ? msg.content : (msg.text || "");

      if (!text.trim()) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }

    if (contents.length === 0 || contents[0].role !== "user") {
      res.status(400).json({ error: "The conversation must begin with a user message." });
      return;
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let lastError: unknown = null;
      let hasSentAnyChunk = false;

      for (const model of CANDIDATE_MODELS) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: dynamicSystemInstruction,
              temperature: 0.7,
              topP: 0.95,
              
            },
          });

          for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
              hasSentAnyChunk = true;
              res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
          }

          res.write("data: [DONE]\n\n");
          res.end();
          return;
        } catch (err: unknown) {
          console.warn(`Model ${model} failed during stream:`, err);
          lastError = err;
          if (hasSentAnyChunk) {
            break;
          }
        }
      }

      if (!res.writableEnded) {
        const errObj = lastError as { message?: string; status?: number };
        const rawErrMsg = errObj?.message || "An unexpected error occurred while communicating with Gemini API.";
    const errMsg =
      errObj?.status === 429 || /RESOURCE_EXHAUSTED|quota|429|Too Many Requests/i.test(rawErrMsg)
        ? "Gemini API quota exceeded (429). Live web search is disabled in this version. Check your Gemini API quota or wait for it to reset."
        : rawErrMsg;
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    } else {
      let response = null;
      let lastError: unknown = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: dynamicSystemInstruction,
              temperature: 0.7,
              topP: 0.95,
              
            },
          });
          if (response && response.text) {
            res.json({ text: response.text, sources: [] });
            return;
          }
        } catch (err: unknown) {
          console.warn(`Model ${model} failed:`, err);
          lastError = err;
        }
      }

      throw lastError || new Error("All model candidates failed.");
    }
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errObj = error as { message?: string; status?: number };
    const rawErrMsg = errObj?.message || "An unexpected error occurred while communicating with Gemini API.";
    const errMsg =
      errObj?.status === 429 || /RESOURCE_EXHAUSTED|quota|429|Too Many Requests/i.test(rawErrMsg)
        ? "Gemini API quota exceeded (429). Live web search is disabled in this version. Check your Gemini API quota or wait for it to reset."
        : rawErrMsg;

    if (stream && !res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } else if (stream) {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      res.status(500).json({ error: errMsg });
    }
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Memo Manga AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
