import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface WordAnatomyPayload {
  letterCount: number;
  syllableCount: number;
  doubleLetters: string[];
  consonantClusters: string[];
  vowelPct: number;
  wildLetters: number;
}

interface PersonalityRemarkResult {
  word: string;
  reaction: string;
  archetypeTag: string;
  chaosPoints: number;
}

interface TraitInsightRequestItem {
  key: string;
  fullName: string;
  traitId: string;
  traitName: string;
  score: number;
  verdict: string;
  doubleLetters: string[];
  syllableCount: number;
  letterCount: number;
}

const personalityRemarkCache = new Map<string, PersonalityRemarkResult>();
const traitInsightCache = new Map<string, string>();

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetries<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    }
  }
  throw lastErr;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === 'GEMINI_API_KEY_MISSING') {
    return {
      status: 500,
      message: 'Gemini API key is not configured. Please check Settings > Secrets.',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'Gemini API key was rejected. Please verify your key in Settings > Secrets.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Gemini quota limit reached right now. Please try again in a moment.',
    };
  }
  return {
    status: 502,
    message: 'Could not reach Gemini AI right now. Please try again.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '128kb' }));

  app.post('/api/quiz/personality-remark', async (req, res) => {
    try {
      const { promptId, promptTitle, word, anatomy } = req.body as {
        promptId?: string;
        promptTitle?: string;
        word?: string;
        anatomy?: WordAnatomyPayload;
      };

      const cleanPromptId = String(promptId ?? '').trim();
      const cleanTitle = String(promptTitle ?? '').trim();
      const cleanWord = String(word ?? '').trim().replace(/\s+/g, ' ');
      const lowerWord = cleanWord.toLowerCase();

      if (!cleanPromptId || !cleanTitle || !cleanWord) {
        res.status(400).json({ error: 'Prompt and word are required.' });
        return;
      }

      const cacheKey = `${cleanPromptId}::${lowerWord}`;
      const cached = personalityRemarkCache.get(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }

      const ai = getGeminiClient();
      const seed = fnv1aHash(cacheKey) % 2147483647;

      const doubles =
        anatomy?.doubleLetters && anatomy.doubleLetters.length > 0
          ? anatomy.doubleLetters.join(', ')
          : 'none';

      const promptText = `Scene: "${cleanTitle}" | Word: "${cleanWord}" | Letters: ${anatomy?.letterCount ?? cleanWord.length} | Syllables: ${anatomy?.syllableCount ?? 1} | Doubles: ${doubles} | Vowels: ${anatomy?.vowelPct ?? 40}% | Wild: ${anatomy?.wildLetters ?? 0}`;

      const response = await withRetries(() =>
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: promptText,
          config: {
            seed,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            systemInstruction:
              'You are a petty, funny rage-bait quiz judge. Write 1 short sentence (max 18 words, simple everyday English, no emojis) reacting to both the Scene and the Word, mentioning a spelling detail like double letters, short length, wild letters, or vowel flow. If they typed no/nothing/idk, roast them for dodging. Return JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reaction: { type: Type.STRING },
                archetypeTag: { type: Type.STRING },
                chaosPoints: { type: Type.INTEGER },
              },
              required: ['reaction', 'archetypeTag', 'chaosPoints'],
            },
          },
        })
      );

      const rawJson = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawJson) as {
        reaction?: string;
        archetypeTag?: string;
        chaosPoints?: number;
      };

      const result: PersonalityRemarkResult = {
        word: cleanWord,
        reaction:
          parsed.reaction?.trim() ||
          `You saw "${cleanTitle}" and went straight for "${cleanWord}". Suspicious.`,
        archetypeTag: parsed.archetypeTag?.trim() || 'Wildcard Mind',
        chaosPoints: Math.max(14, Math.min(35, Math.round(Number(parsed.chaosPoints) || 22))),
      };

      personalityRemarkCache.set(cacheKey, result);
      res.json(result);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/trait-insights', async (req, res) => {
    try {
      const { items } = req.body as { items?: TraitInsightRequestItem[] };
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items array is required.' });
        return;
      }

      const limited = items.slice(0, 20);
      const insights: Record<string, string> = {};
      const missing: TraitInsightRequestItem[] = [];

      for (const item of limited) {
        const key = String(item.key ?? '').trim();
        if (!key) continue;
        const cached = traitInsightCache.get(key);
        if (cached) {
          insights[key] = cached;
        } else {
          missing.push(item);
        }
      }

      if (missing.length > 0) {
        const ai = getGeminiClient();
        const chunkSize = 5;

        for (let i = 0; i < missing.length; i += chunkSize) {
          const chunk = missing.slice(i, i + chunkSize);
          const results = await Promise.all(
            chunk.map(async (item) => {
              const seed = fnv1aHash(item.key) % 2147483647;
              const doubles =
                Array.isArray(item.doubleLetters) && item.doubleLetters.length > 0
                  ? item.doubleLetters.join(', ')
                  : 'none';
              const prompt = `Name: "${item.fullName}" | Top trait: ${item.traitName} (${item.score}/100, "${item.verdict}") | Syllables: ${item.syllableCount} | Letters: ${item.letterCount} | Doubles: ${doubles}`;

              const response = await withRetries(() =>
                ai.models.generateContent({
                  model: 'gemini-3.1-flash-lite',
                  contents: prompt,
                  config: {
                    seed,
                    thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
                    systemInstruction:
                      'Write one tiny visual badge remark (5 to 9 words max, simple everyday English, no quotes, no emojis) about why this full name fits their highest trait. Mention a fun letter or sound clue like double letters, syllables, or sharp/soft sounds. Return JSON.',
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        insight: { type: Type.STRING },
                      },
                      required: ['insight'],
                    },
                  },
                })
              );

              const parsed = JSON.parse((response.text ?? '{}').trim()) as {
                insight?: string;
              };
              const text =
                parsed.insight?.trim() ||
                `${item.syllableCount} syllables made for ${item.traitName}`;
              return { key: item.key, text };
            })
          );

          for (const entry of results) {
            traitInsightCache.set(entry.key, entry.text);
            insights[entry.key] = entry.text;
          }
        }
      }

      res.json({ insights });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NameRank server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
