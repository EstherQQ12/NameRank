import { analyzeNameAnatomy } from '../engine/nameAlgorithm';

export interface QuizChoice {
  label: string;
  reaction: string;
  pettyScore: number;
  tag: string;
}

export interface RandomQuizQuestion {
  id: string;
  category: string;
  prompt: string;
  type: 'yes-no' | 'choice' | 'choice-or-text';
  placeholder?: string;
  choices: QuizChoice[];
  customTextReaction?: (text: string) => {
    reaction: string;
    pettyScore: number;
    tag: string;
  };
}

export type PersonalityVisualType =
  | 'blue-door'
  | 'red-button'
  | 'three-am'
  | 'empty-bowl'
  | 'rain-window'
  | 'staring-cat'
  | 'missed-call'
  | 'low-battery'
  | 'open-fridge'
  | 'locked-box'
  | 'unread-note'
  | 'last-slice'
  | 'single-shoe'
  | 'foggy-mirror'
  | 'elevator-stop'
  | 'umbrella-wind';

export interface PersonalityPrompt {
  id: string;
  title: string;
  subtitle: string;
  visualType: PersonalityVisualType;
}

export interface PersonalityRemarkResult {
  word: string;
  reaction: string;
  archetypeTag: string;
  chaosPoints: number;
  anatomyNote: string;
}

const AI_REMARK_CACHE_KEY = 'namerank_personality_ai_v1';

function loadRemarkCache(): Record<string, Omit<PersonalityRemarkResult, 'anatomyNote'>> {
  try {
    const raw = localStorage.getItem(AI_REMARK_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore storage read error
  }
  return {};
}

function saveRemarkToCache(
  cacheKey: string,
  value: Omit<PersonalityRemarkResult, 'anatomyNote'>
): void {
  try {
    const current = loadRemarkCache();
    current[cacheKey] = value;
    localStorage.setItem(AI_REMARK_CACHE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage write error
  }
}

function hashText(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFrom<T>(list: T[], key: string): T {
  return list[hashText(key) % list.length];
}

export const RANDOM_QUIZ_QUESTIONS: RandomQuizQuestion[] = [
  {
    id: 'fav-colour',
    category: 'Vibe Check',
    prompt: 'What is your favourite colour?',
    type: 'choice-or-text',
    placeholder: 'Or type another colour...',
    choices: [
      { label: 'Blue', reaction: 'Blue? Bold of you to pick the safest colour on Earth.', pettyScore: 15, tag: 'Too Safe' },
      { label: 'Red', reaction: 'Red? Calm down, you are not the final boss.', pettyScore: 22, tag: 'Main Character' },
      { label: 'Black', reaction: 'Black... okay mysterious, we get it. Try smiling once.', pettyScore: 25, tag: 'Edgy Choice' },
      { label: 'Pink', reaction: 'Pink! Respectable... wait no, still judging you a little.', pettyScore: 12, tag: 'Suspiciously Cute' },
      { label: 'Green', reaction: 'Picking green does not count as touching grass today.', pettyScore: 20, tag: 'Needs Sunlight' },
    ],
    customTextReaction: (text) => {
      const clean = text.trim();
      const lower = clean.toLowerCase();
      if (lower === 'no' || lower === 'none' || lower === 'idk') {
        return {
          reaction: 'I just do not like you saying no to a colour question. Pick a real colour.',
          pettyScore: 35,
          tag: 'Rage Bait Triggered',
        };
      }
      return {
        reaction: `"${clean}"? Bro really typed a custom colour just to feel special.`,
        pettyScore: 24,
        tag: 'Tryhard',
      };
    },
  },
  {
    id: 'fav-animal',
    category: 'Wilderness',
    prompt: 'What is your favourite animal?',
    type: 'choice-or-text',
    placeholder: 'Or type any animal...',
    choices: [
      { label: 'Cat', reaction: 'Cat person. You definitely leave people on read for 6 hours.', pettyScore: 20, tag: 'Unbothered' },
      { label: 'Dog', reaction: 'Dog? Literally everyone likes dogs. Where is the spice?', pettyScore: 16, tag: 'NPC Answer' },
      { label: 'Capybara', reaction: 'Capybara? Just admit TikTok raised you.', pettyScore: 24, tag: 'Online Brain' },
      { label: 'Shark', reaction: 'Ooh scary shark. Bet you still flinch when toast pops up.', pettyScore: 22, tag: 'Fake Tough' },
      { label: 'Duck', reaction: 'Duck. Honestly zero thoughts, just loud quacking.', pettyScore: 18, tag: 'Pure Chaos' },
    ],
    customTextReaction: (text) => {
      const clean = text.trim();
      const lower = clean.toLowerCase();
      if (lower === 'no' || lower === 'none' || lower === 'nothing') {
        return {
          reaction: 'Saying "no" to animals is wild. I just do not like you saying no to this.',
          pettyScore: 34,
          tag: 'Heartless',
        };
      }
      return {
        reaction: `"${clean}"?? Okay zoologist, calm down.`,
        pettyScore: 19,
        tag: 'Oddly Specific',
      };
    },
  },
  {
    id: 'has-pets',
    category: 'Home Life',
    prompt: 'Do you have any pets?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Nice. Your pet probably likes your friend more than you though.', pettyScore: 14, tag: 'Outranked' },
      { label: 'No', reaction: 'I just do not like you saying no to this question. Get a goldfish or something.', pettyScore: 32, tag: 'Petty Penalty' },
    ],
  },
  {
    id: 'what-eat',
    category: 'Fuel Check',
    prompt: 'What did you eat today?',
    type: 'choice-or-text',
    placeholder: 'Type what you ate...',
    choices: [
      { label: 'Rice / Noodles', reaction: 'Classic carb nap incoming in 20 minutes.', pettyScore: 14, tag: 'Sleepy Fuel' },
      { label: 'Fast Food', reaction: 'Zero vitamins, 100% vibes. Your stomach is filing a complaint.', pettyScore: 22, tag: 'Grease Mode' },
      { label: 'Snacks Only', reaction: 'Snacks are not a real meal and you know it.', pettyScore: 26, tag: 'Gremlin Diet' },
      { label: 'Nothing Yet', reaction: 'Nothing yet?! Go eat something instead of clicking quiz buttons.', pettyScore: 30, tag: 'Running On Air' },
    ],
    customTextReaction: (text) => {
      const clean = text.trim();
      const lower = clean.toLowerCase();
      if (lower === 'no' || lower === 'nothing' || lower === 'air') {
        return {
          reaction: 'I do not like that answer at all. Eat real food right now.',
          pettyScore: 32,
          tag: 'Hungry Menace',
        };
      }
      return {
        reaction: `You ate "${clean}" and expected to be productive today? Bold.`,
        pettyScore: 18,
        tag: 'Questionable Fuel',
      };
    },
  },
  {
    id: 'what-time',
    category: 'Clock Check',
    prompt: 'What time is it right now?',
    type: 'choice-or-text',
    placeholder: 'Or type the time (e.g. 4:15)...',
    choices: [
      { label: 'Morning', reaction: 'It is morning and you are already procrastinating. Respect.', pettyScore: 22, tag: 'Early Slacker' },
      { label: 'Afternoon', reaction: 'Prime afternoon slacking hours. You definitely have stuff due.', pettyScore: 20, tag: 'Avoiding Work' },
      { label: 'Evening', reaction: 'Whole day gone and you are taking a quiz. Incredible.', pettyScore: 24, tag: 'Time Blind' },
      { label: 'Late Night', reaction: 'Go to sleep. Nothing good happens after midnight except bad quizzes.', pettyScore: 28, tag: 'Sleep Deprived' },
    ],
    customTextReaction: (text) => ({
      reaction: `"${text.trim()}"?! Look at the clock again, you are wasting prime minutes right here.`,
      pettyScore: 21,
      tag: 'Clock Watcher',
    }),
  },
  {
    id: 'what-day',
    category: 'Calendar Check',
    prompt: 'What day is it today?',
    type: 'choice',
    choices: [
      { label: 'Monday', reaction: 'Monday energy is already awful and you picked it anyway.', pettyScore: 24, tag: 'Painful' },
      { label: 'Tue / Wed / Thu', reaction: 'Midweek fog. Admit it, you had to check the corner of your screen.', pettyScore: 20, tag: 'Lost In Time' },
      { label: 'Friday', reaction: 'Even if it is not Friday, your brain already clocked out.', pettyScore: 18, tag: 'Checked Out' },
      { label: 'Weekend', reaction: 'It is the weekend and you are still on here? Touch some air.', pettyScore: 22, tag: 'Too Comfy' },
    ],
  },
  {
    id: 'drink-water',
    category: 'Health Police',
    prompt: 'Did you drink water in the last 2 hours?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'One tiny sip of iced coffee does not count, nice try.', pettyScore: 15, tag: 'Doubtful' },
      { label: 'No', reaction: 'I just do not like you saying no to this. Go drink water right now.', pettyScore: 34, tag: 'Crispy Dehydrated' },
    ],
  },
  {
    id: 'reply-fast',
    category: 'Social Test',
    prompt: 'Do you reply to messages right away?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Staring at your phone waiting for texts, huh? Embarrassing.', pettyScore: 21, tag: 'Chronically Online' },
      { label: 'No', reaction: 'Stop saying no like it is a flex. Reply to your friends.', pettyScore: 29, tag: 'Ghosting Pro' },
    ],
  },
  {
    id: 'finish-tasks',
    category: 'Reality Check',
    prompt: 'Did you finish what you were supposed to do today?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Cap. Nobody who finished everything is clicking this quiz.', pettyScore: 26, tag: 'Pure Cap' },
      { label: 'No', reaction: 'I hate that you said no so confidently. At least pretend to be busy.', pettyScore: 30, tag: 'Zero Shame' },
    ],
  },
  {
    id: 'browser-tabs',
    category: 'Screen Audit',
    prompt: 'How many browser tabs do you have open right now?',
    type: 'choice',
    choices: [
      { label: '1 to 3 tabs', reaction: 'Clean and tidy? Boring. Where is the digital chaos?', pettyScore: 14, tag: 'Neat Freak' },
      { label: '4 to 12 tabs', reaction: 'You stopped reading half of them 3 hours ago.', pettyScore: 20, tag: 'Tab Hoarder' },
      { label: 'Too many to count', reaction: 'Your laptop fan is begging for mercy right now.', pettyScore: 27, tag: 'RAM Destroyer' },
      { label: 'I refuse to look', reaction: 'Guilty. Definitely 34 tabs of random junk open.', pettyScore: 25, tag: 'In Denial' },
    ],
  },
  {
    id: 'morning-alarms',
    category: 'Sleep Habits',
    prompt: 'Do you set more than 3 alarms in the morning?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'And you still sleep right through all of them, do you not?', pettyScore: 22, tag: 'Snooze Addict' },
      { label: 'No', reaction: 'I do not believe you said no. You definitely wake up late.', pettyScore: 28, tag: 'Suspicious' },
    ],
  },
  {
    id: 'milk-cereal',
    category: 'Food Crime',
    prompt: 'Do you put milk before cereal?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Jail. Immediately. Nobody trusts your life decisions.', pettyScore: 35, tag: 'Menace' },
      { label: 'No', reaction: 'Good. At least you passed the bare minimum human test.', pettyScore: 10, tag: 'Bare Minimum' },
    ],
  },
  {
    id: 'talk-self',
    category: 'Brain Check',
    prompt: 'Do you talk to yourself when nobody is around?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Having full meetings with yourself in the mirror, huh?', pettyScore: 20, tag: 'Solo Podcast' },
      { label: 'No', reaction: 'I just do not like you lying and saying no to this.', pettyScore: 31, tag: 'Biggest Lie' },
    ],
  },
  {
    id: 'pineapple-pizza',
    category: 'Hot Take',
    prompt: 'Does pineapple belong on pizza?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Brave or tasteless. You definitely start arguments for fun.', pettyScore: 24, tag: 'Drama Starter' },
      { label: 'No', reaction: 'Saying no just to fit in with the crowd. Boring.', pettyScore: 22, tag: 'Follower' },
    ],
  },
  {
    id: 'pretend-sleep',
    category: 'Stealth Check',
    prompt: 'Have you ever pretended to be asleep to avoid talking?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'Oscar-winning performance just to dodge a 10-second chat.', pettyScore: 22, tag: 'Fake Napper' },
      { label: 'No', reaction: 'Stop saying no. Everyone has faked sleep at least once.', pettyScore: 30, tag: 'Not Honest' },
    ],
  },
  {
    id: 'pocket-check',
    category: 'Quick Search',
    prompt: 'What is next to you right now?',
    type: 'choice-or-text',
    placeholder: 'Type what is next to you...',
    choices: [
      { label: 'Snack / Drink', reaction: 'Of course there is food within arm reach.', pettyScore: 18, tag: 'Snack Radar' },
      { label: 'Messy Pile', reaction: 'Clean your space instead of taking a quiz. Please.', pettyScore: 26, tag: 'Clutter Boss' },
      { label: 'Another Screen', reaction: 'Two screens at once and zero work getting done.', pettyScore: 24, tag: 'Double Distracted' },
      { label: 'Nothing', reaction: 'Just sitting in an empty room staring at pixels? Scary.', pettyScore: 28, tag: 'NPC Mode' },
    ],
    customTextReaction: (text) => ({
      reaction: `"${text.trim()}"? Weird thing to keep next to you, not gonna lie.`,
      pettyScore: 21,
      tag: 'Odd Setup',
    }),
  },
  {
    id: 'phone-battery',
    category: 'Power Audit',
    prompt: 'What is your battery percentage right now?',
    type: 'choice',
    choices: [
      { label: 'Under 20%', reaction: 'Living on the edge for no reason. Go find a charger.', pettyScore: 28, tag: 'Chaos Battery' },
      { label: '20% to 70%', reaction: 'Medium battery, medium effort. Very predictable.', pettyScore: 16, tag: 'Mid Charge' },
      { label: 'Above 70%', reaction: 'Look at Miss/Mr. Responsible with a charged phone.', pettyScore: 12, tag: 'Teacher Pet' },
      { label: 'On Charger', reaction: 'Glued to the wall outlet. Touch grass later.', pettyScore: 22, tag: 'Wall Hugger' },
    ],
  },
  {
    id: 'goose-fight',
    category: 'Battle IQ',
    prompt: 'Would you fight an angry goose for $50?',
    type: 'yes-no',
    choices: [
      { label: 'Yes', reaction: 'You are losing to that goose in 4 seconds flat.', pettyScore: 25, tag: 'Overconfident' },
      { label: 'No', reaction: 'I just do not like you saying no to easy money. Scared of a bird?', pettyScore: 31, tag: 'Bird Fear' },
    ],
  },
];

export const PERSONALITY_PROMPTS: PersonalityPrompt[] = [
  { id: 'blue-door', title: 'A Half-Open Blue Door', subtitle: 'What is the first word you think of when you see this?', visualType: 'blue-door' },
  { id: 'red-button', title: 'A Giant Glowing Button', subtitle: 'What is the first word you think of when you see this?', visualType: 'red-button' },
  { id: 'three-am', title: '3:00 AM on the Clock', subtitle: 'What is the first word you think of when you see this?', visualType: 'three-am' },
  { id: 'staring-cat', title: 'A Cat Staring Straight at You', subtitle: 'What is the first word you think of when you see this?', visualType: 'staring-cat' },
  { id: 'empty-bowl', title: 'An Empty Ceramic Bowl', subtitle: 'What is the first word you think of when you see this?', visualType: 'empty-bowl' },
  { id: 'rain-window', title: 'Rain on a Cold Window', subtitle: 'What is the first word you think of when you see this?', visualType: 'rain-window' },
  { id: 'missed-call', title: '3 Missed Calls at 1:14 AM', subtitle: 'What is the first word you think of when you see this?', visualType: 'missed-call' },
  { id: 'low-battery', title: '1% Battery Warning', subtitle: 'What is the first word you think of when you see this?', visualType: 'low-battery' },
  { id: 'open-fridge', title: 'An Open Fridge at Midnight', subtitle: 'What is the first word you think of when you see this?', visualType: 'open-fridge' },
  { id: 'locked-box', title: 'A Heavy Locked Metal Box', subtitle: 'What is the first word you think of when you see this?', visualType: 'locked-box' },
  { id: 'unread-note', title: 'A Folded Note on Your Desk', subtitle: 'What is the first word you think of when you see this?', visualType: 'unread-note' },
  { id: 'last-slice', title: 'One Last Slice in the Box', subtitle: 'What is the first word you think of when you see this?', visualType: 'last-slice' },
  { id: 'single-shoe', title: 'One Sneaker Left on the Stairs', subtitle: 'What is the first word you think of when you see this?', visualType: 'single-shoe' },
  { id: 'foggy-mirror', title: 'A Foggy Bathroom Mirror', subtitle: 'What is the first word you think of when you see this?', visualType: 'foggy-mirror' },
  { id: 'elevator-stop', title: 'An Elevator Stuck Between Floors', subtitle: 'What is the first word you think of when you see this?', visualType: 'elevator-stop' },
  { id: 'umbrella-wind', title: 'An Umbrella Flipped Inside Out', subtitle: 'What is the first word you think of when you see this?', visualType: 'umbrella-wind' },
];

export function describeWordAnatomy(wordRaw: string): {
  cleanWord: string;
  anatomyNote: string;
  payload: {
    letterCount: number;
    syllableCount: number;
    doubleLetters: string[];
    consonantClusters: string[];
    vowelPct: number;
    wildLetters: number;
  };
} {
  const cleanWord = wordRaw.trim().replace(/\s+/g, ' ');
  const anatomy = analyzeNameAnatomy(cleanWord || 'x');
  const lower = cleanWord.toLowerCase().replace(/[^a-z]/g, '');
  const vowelPct = anatomy.letterCount
    ? Math.round((anatomy.vowelCount / anatomy.letterCount) * 100)
    : 0;
  const wildLetters = (lower.match(/[jkqvwxz]/g) ?? []).length;

  const parts: string[] = [`${anatomy.letterCount} letters`, `${anatomy.syllableCount} syllable${anatomy.syllableCount === 1 ? '' : 's'}`];
  if (anatomy.doubleLetters.length > 0) {
    parts.push(`double "${anatomy.doubleLetters.join('", "')}"`);
  } else if (wildLetters > 0) {
    parts.push(`${wildLetters} wild letter${wildLetters === 1 ? '' : 's'}`);
  } else {
    parts.push(`${vowelPct}% vowels`);
  }

  return {
    cleanWord,
    anatomyNote: parts.join(' · '),
    payload: {
      letterCount: anatomy.letterCount,
      syllableCount: anatomy.syllableCount,
      doubleLetters: anatomy.doubleLetters,
      consonantClusters: anatomy.consonantClusters,
      vowelPct,
      wildLetters,
    },
  };
}

export async function fetchPersonalityWordRemark(
  wordRaw: string,
  prompt: PersonalityPrompt
): Promise<PersonalityRemarkResult> {
  const { cleanWord, anatomyNote, payload } = describeWordAnatomy(wordRaw);
  const lowerWord = cleanWord.toLowerCase();
  const cacheKey = `${prompt.id}::${lowerWord}`;

  const cache = loadRemarkCache();
  const cached = cache[cacheKey];
  if (cached) {
    return {
      ...cached,
      anatomyNote,
    };
  }

  const response = await fetch('/api/quiz/personality-remark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      promptId: prompt.id,
      promptTitle: prompt.title,
      promptSubtitle: prompt.subtitle,
      word: cleanWord,
      anatomy: payload,
    }),
  });

  const data = (await response.json()) as {
    word?: string;
    reaction?: string;
    archetypeTag?: string;
    chaosPoints?: number;
    error?: string;
  };

  if (!response.ok || !data.reaction) {
    throw new Error(data.error || 'Could not get AI remark right now.');
  }

  const result = {
    word: data.word ?? cleanWord,
    reaction: data.reaction,
    archetypeTag: data.archetypeTag ?? 'Wildcard Mind',
    chaosPoints: data.chaosPoints ?? 22,
  };

  saveRemarkToCache(cacheKey, result);

  return {
    ...result,
    anatomyNote,
  };
}

export function getRandomQuizVerdict(totalPetty: number, seedKey: string): {
  title: string;
  roast: string;
} {
  if (totalPetty >= 125) {
    return {
      title: 'Maximum Rage Bait Victim',
      roast: 'You picked every answer designed to annoy the quiz. Honestly impressive stubbornness.',
    };
  }
  if (totalPetty >= 100) {
    return {
      title: 'Mild Menace',
      roast: 'A few questionable choices and definitely avoiding responsibilities right now.',
    };
  }
  const chillTitles = [
    {
      title: 'Suspiciously Normal',
      roast: 'You played it pretty safe, which is somehow still annoying in its own way.',
    },
    {
      title: 'Low-Key Chaotic',
      roast: 'Acting normal on the surface, total snack-driven chaos underneath.',
    },
  ];
  return pickFrom(chillTitles, seedKey);
}

export function getPersonalityVerdict(
  tags: string[],
  totalChaos: number
): {
  title: string;
  roast: string;
} {
  if (totalChaos >= 110) {
    return {
      title: 'Professional Rage-Baiter',
      roast: 'Your word choices fought every single prompt. Maximum petty energy.',
    };
  }
  const counts: Record<string, number> = {};
  for (const t of tags) {
    counts[t] = (counts[t] ?? 0) + 1;
  }
  const topTag = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Wildcard Mind';

  if (totalChaos >= 92) {
    return {
      title: 'Zero Impulse Control',
      roast: `Strong "${topTag}" instincts. Your brain reacts faster than your filter.`,
    };
  }
  return {
    title: topTag,
    roast: 'Every word you typed exposed a weird mix of chaos and overthinking.',
  };
}
