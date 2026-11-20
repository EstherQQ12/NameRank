import {
  AlertCircle,
  ArrowRight,
  Brain,
  Dices,
  Eye,
  Flame,
  HelpCircle,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import {
  fetchPersonalityWordRemark,
  getPersonalityVerdict,
  getRandomQuizVerdict,
  PERSONALITY_PROMPTS,
  RANDOM_QUIZ_QUESTIONS,
  type PersonalityPrompt,
  type PersonalityVisualType,
  type RandomQuizQuestion,
} from '../data/quizData';

type QuizMode = 'random' | 'personality';

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickFreshQuestions(count: number, excludeIds: Set<string>): RandomQuizQuestion[] {
  const unseen = shuffleArray(RANDOM_QUIZ_QUESTIONS.filter((q) => !excludeIds.has(q.id)));
  if (unseen.length >= count) {
    return unseen.slice(0, count);
  }
  const rest = shuffleArray(RANDOM_QUIZ_QUESTIONS.filter((q) => excludeIds.has(q.id)));
  return [...unseen, ...rest].slice(0, count);
}

function pickFreshPrompts(count: number, excludeIds: Set<string>): PersonalityPrompt[] {
  const unseen = shuffleArray(PERSONALITY_PROMPTS.filter((p) => !excludeIds.has(p.id)));
  if (unseen.length >= count) {
    return unseen.slice(0, count);
  }
  const rest = shuffleArray(PERSONALITY_PROMPTS.filter((p) => excludeIds.has(p.id)));
  return [...unseen, ...rest].slice(0, count);
}

function PromptIllustration({ type }: { type: PersonalityVisualType }) {
  switch (type) {
    case 'blue-door':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="12" width="140" height="96" rx="12" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <rect x="64" y="22" width="52" height="86" rx="4" fill="#1E3A8A" />
          <polygon points="64,22 104,28 104,102 64,108" fill="#2563EB" />
          <circle cx="96" cy="66" r="3.5" fill="#93C5FD" />
        </svg>
      );
    case 'red-button':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="24" y="18" width="132" height="84" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <ellipse cx="90" cy="68" rx="42" ry="18" fill="#CBD5E1" />
          <ellipse cx="90" cy="56" rx="34" ry="16" fill="#EF4444" />
          <ellipse cx="90" cy="52" rx="28" ry="11" fill="#F87171" />
        </svg>
      );
    case 'three-am':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="22" y="20" width="136" height="80" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <text x="90" y="69" textAnchor="middle" fill="#60A5FA" fontSize="28" fontWeight="700" fontFamily="monospace">
            03:00
          </text>
        </svg>
      );
    case 'staring-cat':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <polygon points="60,52 68,26 84,44" fill="#0F172A" />
          <polygon points="120,52 112,26 96,44" fill="#0F172A" />
          <circle cx="90" cy="66" r="30" fill="#0F172A" />
          <circle cx="79" cy="62" r="5.5" fill="#F8FAFC" />
          <circle cx="101" cy="62" r="5.5" fill="#F8FAFC" />
          <circle cx="79" cy="62" r="2.5" fill="#2563EB" />
          <circle cx="101" cy="62" r="2.5" fill="#2563EB" />
          <polygon points="87,71 93,71 90,75" fill="#93C5FD" />
        </svg>
      );
    case 'empty-bowl':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <path d="M46 58 Q90 98 134 58 Z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
          <ellipse cx="90" cy="58" rx="44" ry="10" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2.5" />
        </svg>
      );
    case 'rain-window':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <line x1="90" y1="14" x2="90" y2="106" stroke="#334155" strokeWidth="2" />
          <line x1="20" y1="60" x2="160" y2="60" stroke="#334155" strokeWidth="2" />
          <circle cx="52" cy="36" r="3" fill="#60A5FA" />
          <circle cx="68" cy="48" r="2.5" fill="#93C5FD" />
          <circle cx="122" cy="38" r="3" fill="#60A5FA" />
          <circle cx="136" cy="78" r="3" fill="#60A5FA" />
          <circle cx="56" cy="82" r="2.5" fill="#93C5FD" />
          <circle cx="114" cy="88" r="2" fill="#93C5FD" />
        </svg>
      );
    case 'missed-call':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="56" y="12" width="68" height="96" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="64" y="24" width="52" height="70" rx="6" fill="#1E293B" />
          <circle cx="90" cy="48" r="11" fill="#EF4444" />
          <text x="90" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="700">
            3
          </text>
          <rect x="74" y="68" width="32" height="5" rx="2.5" fill="#60A5FA" />
          <rect x="78" y="78" width="24" height="4" rx="2" fill="#64748B" />
        </svg>
      );
    case 'low-battery':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <rect x="44" y="40" width="84" height="40" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
          <rect x="128" y="51" width="8" height="18" rx="3" fill="#0F172A" />
          <rect x="50" y="46" width="10" height="28" rx="3" fill="#EF4444" />
          <text x="92" y="65" textAnchor="middle" fill="#EF4444" fontSize="14" fontWeight="700" fontFamily="monospace">
            1%
          </text>
        </svg>
      );
    case 'open-fridge':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="12" width="140" height="96" rx="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="58" y="20" width="64" height="80" rx="6" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="2" />
          <line x1="62" y1="48" x2="118" y2="48" stroke="#93C5FD" strokeWidth="2" />
          <line x1="62" y1="74" x2="118" y2="74" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="78" cy="40" r="5" fill="#2563EB" />
          <rect x="96" y="56" width="12" height="14" rx="2" fill="#0EA5E9" />
        </svg>
      );
    case 'locked-box':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <rect x="50" y="42" width="80" height="48" rx="8" fill="#334155" />
          <path d="M74 42 V32 A16 16 0 0 1 106 32 V42" fill="none" stroke="#0F172A" strokeWidth="5" />
          <circle cx="90" cy="64" r="7" fill="#93C5FD" />
          <rect x="87" y="67" width="6" height="11" rx="2" fill="#93C5FD" />
        </svg>
      );
    case 'unread-note':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <polygon points="48,30 132,30 132,90 48,90" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
          <polyline points="48,30 90,64 132,30" fill="none" stroke="#2563EB" strokeWidth="2.5" />
          <circle cx="126" cy="34" r="7" fill="#EF4444" />
        </svg>
      );
    case 'last-slice':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="24" y="16" width="132" height="88" rx="10" fill="#F8FAFC" stroke="#B9CCE6" strokeWidth="2" />
          <polygon points="90,26 128,88 52,88" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          <rect x="50" y="84" width="80" height="9" rx="4" fill="#B45309" />
          <circle cx="88" cy="58" r="6" fill="#EF4444" />
          <circle cx="101" cy="73" r="5" fill="#EF4444" />
          <circle cx="77" cy="74" r="5" fill="#EF4444" />
        </svg>
      );
    case 'single-shoe':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <line x1="36" y1="88" x2="144" y2="88" stroke="#94A3B8" strokeWidth="3" />
          <path d="M56 76 L64 46 L86 52 L104 68 L124 70 L124 84 L56 84 Z" fill="#2563EB" />
          <rect x="56" y="80" width="68" height="6" rx="3" fill="#FFFFFF" />
        </svg>
      );
    case 'foggy-mirror':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="12" width="140" height="96" rx="14" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
          <ellipse cx="90" cy="60" rx="44" ry="38" fill="#E2E8F0" stroke="#64748B" strokeWidth="3" />
          <circle cx="82" cy="54" r="14" fill="#F8FAFC" opacity="0.7" />
          <circle cx="100" cy="65" r="12" fill="#F8FAFC" opacity="0.7" />
        </svg>
      );
    case 'elevator-stop':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="24" y="12" width="132" height="96" rx="12" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="46" y="28" width="42" height="72" fill="#334155" />
          <rect x="92" y="28" width="42" height="72" fill="#475569" />
          <text x="90" y="23" textAnchor="middle" fill="#F87171" fontSize="11" fontWeight="700" fontFamily="monospace">
            -- / --
          </text>
        </svg>
      );
    case 'umbrella-wind':
      return (
        <svg viewBox="0 0 180 120" className="w-40 h-28 mx-auto" aria-hidden="true">
          <rect x="20" y="14" width="140" height="92" rx="14" fill="#EBF2FA" stroke="#B9CCE6" strokeWidth="2" />
          <path d="M46 44 Q90 88 134 44" fill="none" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" />
          <line x1="90" y1="36" x2="90" y2="86" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <path d="M90 86 Q90 96 98 94" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}

interface RandomAnswerRecord {
  question: string;
  answer: string;
  reaction: string;
  tag: string;
  pettyScore: number;
}

interface PersonalityAnswerRecord {
  promptTitle: string;
  word: string;
  reaction: string;
  archetypeTag: string;
  chaosPoints: number;
  anatomyNote: string;
}

export function QuizArcade() {
  const [mode, setMode] = useState<QuizMode>('random');

  // Random Quiz state
  const [seenQuestionIds, setSeenQuestionIds] = useState<Set<string>>(() => new Set());
  const [randomQuestions, setRandomQuestions] = useState<RandomQuizQuestion[]>(() =>
    pickFreshQuestions(5, new Set())
  );
  const [randomIndex, setRandomIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [latestReaction, setLatestReaction] = useState<RandomAnswerRecord | null>(null);
  const [randomHistory, setRandomHistory] = useState<RandomAnswerRecord[]>([]);

  // Personality Test state
  const [seenPromptIds, setSeenPromptIds] = useState<Set<string>>(() => new Set());
  const [personalityPrompts, setPersonalityPrompts] = useState<PersonalityPrompt[]>(() =>
    pickFreshPrompts(4, new Set())
  );
  const [personalityIndex, setPersonalityIndex] = useState(0);
  const [wordInput, setWordInput] = useState('');
  const [latestWordRead, setLatestWordRead] = useState<PersonalityAnswerRecord | null>(null);
  const [personalityHistory, setPersonalityHistory] = useState<PersonalityAnswerRecord[]>([]);
  const [loadingRemark, setLoadingRemark] = useState(false);
  const [personalityError, setPersonalityError] = useState<string | null>(null);

  const startFreshRandomQuiz = () => {
    const nextSeen = new Set([...seenQuestionIds, ...randomQuestions.map((q) => q.id)]);
    const picked = pickFreshQuestions(5, nextSeen);
    const wrappedSeen =
      nextSeen.size >= RANDOM_QUIZ_QUESTIONS.length - 4
        ? new Set(picked.map((q) => q.id))
        : nextSeen;

    setMode('random');
    setSeenQuestionIds(wrappedSeen);
    setRandomQuestions(picked);
    setRandomIndex(0);
    setCustomInput('');
    setLatestReaction(null);
    setRandomHistory([]);
  };

  const startFreshPersonalityTest = () => {
    const nextSeen = new Set([...seenPromptIds, ...personalityPrompts.map((p) => p.id)]);
    const picked = pickFreshPrompts(4, nextSeen);
    const wrappedSeen =
      nextSeen.size >= PERSONALITY_PROMPTS.length - 3
        ? new Set(picked.map((p) => p.id))
        : nextSeen;

    setMode('personality');
    setSeenPromptIds(wrappedSeen);
    setPersonalityPrompts(picked);
    setPersonalityIndex(0);
    setWordInput('');
    setLatestWordRead(null);
    setPersonalityHistory([]);
    setPersonalityError(null);
  };

  const currentRandomQ = randomQuestions[randomIndex];
  const isRandomDone = randomHistory.length >= randomQuestions.length && !latestReaction;

  const submitRandomChoice = (label: string, reaction: string, tag: string, pettyScore: number) => {
    if (latestReaction || !currentRandomQ) return;
    const record: RandomAnswerRecord = {
      question: currentRandomQ.prompt,
      answer: label,
      reaction,
      tag,
      pettyScore,
    };
    setLatestReaction(record);
    setRandomHistory((prev) => [...prev, record]);
  };

  const submitRandomCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || !currentRandomQ?.customTextReaction || latestReaction) return;
    const res = currentRandomQ.customTextReaction(customInput);
    submitRandomChoice(customInput.trim(), res.reaction, res.tag, res.pettyScore);
    setCustomInput('');
  };

  const advanceRandomQuestion = () => {
    setLatestReaction(null);
    setCustomInput('');
    setRandomIndex((prev) => prev + 1);
  };

  const currentPersonalityPrompt = personalityPrompts[personalityIndex];
  const isPersonalityDone =
    personalityHistory.length >= personalityPrompts.length && !latestWordRead;

  const submitFirstWord = async (rawWord: string) => {
    const trimmed = rawWord.trim();
    if (!currentPersonalityPrompt || latestWordRead || loadingRemark || !trimmed) return;

    setLoadingRemark(true);
    setPersonalityError(null);
    try {
      const result = await fetchPersonalityWordRemark(trimmed, currentPersonalityPrompt);
      const record: PersonalityAnswerRecord = {
        promptTitle: currentPersonalityPrompt.title,
        word: result.word,
        reaction: result.reaction,
        archetypeTag: result.archetypeTag,
        chaosPoints: result.chaosPoints,
        anatomyNote: result.anatomyNote,
      };
      setLatestWordRead(record);
      setPersonalityHistory((prev) => [...prev, record]);
      setWordInput('');
    } catch (err) {
      setPersonalityError(err instanceof Error ? err.message : 'Could not get remark.');
    } finally {
      setLoadingRemark(false);
    }
  };

  const advancePersonalityPrompt = () => {
    setLatestWordRead(null);
    setWordInput('');
    setPersonalityError(null);
    setPersonalityIndex((prev) => prev + 1);
  };

  const totalPetty = randomHistory.reduce((sum, r) => sum + r.pettyScore, 0);
  const randomVerdict = getRandomQuizVerdict(
    totalPetty,
    randomHistory.map((h) => h.answer).join('|')
  );

  const totalPersonalityChaos = personalityHistory.reduce((sum, r) => sum + r.chaosPoints, 0);
  const personalityVerdict = getPersonalityVerdict(
    personalityHistory.map((p) => p.archetypeTag),
    totalPersonalityChaos
  );

  return (
    <section aria-label="Quizzes and Personality Tests" className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF2FA] border border-[#D9E4F2] flex items-center justify-center shrink-0">
            <Dices className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
              Quiz Corner
            </h1>
            <p className="text-xs text-[#64748B]">
              Pick a random quiz or test your first-word instincts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startFreshRandomQuiz}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'random'
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-[#EBF2FA] text-[#0F172A] border-[#D9E4F2] hover:bg-[#DFEAFA]'
            }`}
          >
            <Dices className="w-3.5 h-3.5" aria-hidden="true" />
            Take a Random Quiz
          </button>

          <button
            type="button"
            onClick={() => setMode('personality')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'personality'
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#0F172A] border-[#D9E4F2] hover:bg-[#F3F7FC]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Personality: First Word
          </button>
        </div>
      </div>

      {mode === 'random' && (
        <div className="max-w-2xl mx-auto">
          {!isRandomDone && currentRandomQ ? (
            <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {currentRandomQ.category}
                </span>
                <span className="font-mono text-xs text-[#64748B] tabular-nums">
                  {Math.min(randomIndex + 1, randomQuestions.length)} / {randomQuestions.length}
                </span>
              </div>

              <div className="h-1.5 w-full bg-[#EBF2FA] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all duration-300"
                  style={{
                    width: `${((randomIndex + (latestReaction ? 1 : 0)) / randomQuestions.length) * 100}%`,
                  }}
                />
              </div>

              <h2 className="text-xl font-bold text-[#0F172A] leading-snug">
                {currentRandomQ.prompt}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentRandomQ.choices.map((choice) => {
                  const isPicked = latestReaction?.answer === choice.label;
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      disabled={Boolean(latestReaction)}
                      onClick={() =>
                        submitRandomChoice(
                          choice.label,
                          choice.reaction,
                          choice.tag,
                          choice.pettyScore
                        )
                      }
                      className={`text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer disabled:cursor-default ${
                        isPicked
                          ? 'bg-[#EBF2FA] border-[#2563EB] text-[#0F172A]'
                          : latestReaction
                            ? 'bg-[#F8FBFF] border-[#EBF2FA] text-[#94A3B8]'
                            : 'bg-[#F3F7FC] border-[#D9E4F2] text-[#0F172A] hover:border-[#2563EB] hover:bg-[#EBF2FA]'
                      }`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>

              {currentRandomQ.type === 'choice-or-text' && !latestReaction && (
                <form onSubmit={submitRandomCustomText} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={currentRandomQ.placeholder ?? 'Type your answer...'}
                    aria-label="Custom quiz answer"
                    className="flex-1 min-w-0 px-3.5 py-2 text-sm bg-white border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Submit
                  </button>
                </form>
              )}

              {latestReaction && (
                <div className="bg-[#EEF5FD] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB]">
                      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                      {latestReaction.tag}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#64748B]">
                      +{latestReaction.pettyScore} rage
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {latestReaction.reaction}
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={advanceRandomQuestion}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                    >
                      {randomIndex + 1 >= randomQuestions.length ? 'See Verdict' : 'Next Question'}
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-[#EBF2FA] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Quiz Verdict
                  </span>
                  <h2 className="text-2xl font-bold text-[#0F172A] mt-1">
                    {randomVerdict.title}
                  </h2>
                  <p className="text-sm text-[#475569] mt-1">{randomVerdict.roast}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-2xl font-bold tabular-nums text-[#2563EB]">
                    {totalPetty}
                  </span>
                  <p className="text-[11px] text-[#64748B]">Rage Score</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {randomHistory.map((item, idx) => (
                  <div
                    key={`${item.question}-${idx}`}
                    className="p-3 rounded-lg bg-[#F3F7FC] border border-[#EBF2FA] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#0F172A]">{item.question}</span>
                      <span className="font-mono font-semibold text-[#2563EB] shrink-0">
                        {item.answer}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569]">{item.reaction}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={startFreshRandomQuiz}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Take Another Random Quiz
                </button>
                <button
                  type="button"
                  onClick={startFreshPersonalityTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                  Try Personality Test
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'personality' && (
        <div className="max-w-2xl mx-auto">
          {!isPersonalityDone && currentPersonalityPrompt ? (
            <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <Brain className="w-3.5 h-3.5" aria-hidden="true" />
                  First Word Personality Test
                </span>
                <span className="font-mono text-xs text-[#64748B] tabular-nums">
                  {Math.min(personalityIndex + 1, personalityPrompts.length)} /{' '}
                  {personalityPrompts.length}
                </span>
              </div>

              <div className="bg-[#F3F7FC] border border-[#D9E4F2] rounded-xl p-5 text-center space-y-3">
                <PromptIllustration type={currentPersonalityPrompt.visualType} />
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    {currentPersonalityPrompt.title}
                  </h2>
                  <p className="text-xs text-[#475569] mt-0.5">
                    {currentPersonalityPrompt.subtitle}
                  </p>
                </div>
              </div>

              {!latestWordRead && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitFirstWord(wordInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    disabled={loadingRemark}
                    placeholder="Type the first word you think of..."
                    aria-label="First word you think of"
                    className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={loadingRemark || !wordInput.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {loadingRemark ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Reading...
                      </>
                    ) : (
                      'Lock In Word'
                    )}
                  </button>
                </form>
              )}

              {personalityError && (
                <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{personalityError}</span>
                </div>
              )}

              {latestWordRead && (
                <div className="bg-[#EEF5FD] border border-[#BFDBFE] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB]">
                      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                      {latestWordRead.archetypeTag}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#0F172A]">
                      "{latestWordRead.word}"
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {latestWordRead.reaction}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {latestWordRead.anatomyNote}
                    </span>
                    <button
                      type="button"
                      onClick={advancePersonalityPrompt}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                    >
                      {personalityIndex + 1 >= personalityPrompts.length
                        ? 'Reveal Personality'
                        : 'Next Image'}
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6 space-y-5">
              <div className="border-b border-[#EBF2FA] pb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                  <Brain className="w-3.5 h-3.5" aria-hidden="true" />
                  Personality Read
                </span>
                <h2 className="text-2xl font-bold text-[#0F172A] mt-1">
                  {personalityVerdict.title}
                </h2>
                <p className="text-sm text-[#475569] mt-1">{personalityVerdict.roast}</p>
              </div>

              <div className="space-y-2.5">
                {personalityHistory.map((item, idx) => (
                  <div
                    key={`${item.promptTitle}-${idx}`}
                    className="p-3 rounded-lg bg-[#F3F7FC] border border-[#EBF2FA] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#0F172A]">{item.promptTitle}</span>
                      <span className="font-mono font-semibold text-[#2563EB] shrink-0">
                        "{item.word}"
                      </span>
                    </div>
                    <p className="text-xs text-[#475569]">{item.reaction}</p>
                    <p className="font-mono text-[11px] text-[#64748B]">{item.anatomyNote}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={startFreshPersonalityTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Retake Personality Test
                </button>
                <button
                  type="button"
                  onClick={startFreshRandomQuiz}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0F172A] bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] rounded-lg transition-colors cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                  Take a Random Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
