import type {
  AlgorithmFactor,
  BuiltInTraitId,
  CustomTraitWeights,
  EvaluatedPerson,
  NameAnatomy,
  PersonInput,
  TraitDefinition,
  TraitId,
  TraitScoreDetail,
} from '../types/ranking';

export const BUILT_IN_TRAITS: TraitDefinition[] = [
  {
    id: 'stinkiness',
    name: 'Stinkiness',
    shortLabel: 'Stinkiness',
    subtitle: 'Smelly combos & double letters',
    accentHex: '#14B8A6',
  },
  {
    id: 'smartness',
    name: 'Smartness',
    shortLabel: 'Smartness',
    subtitle: 'Big syllables & smart endings',
    accentHex: '#2563EB',
  },
  {
    id: 'chaos',
    name: 'Chaotic Energy',
    shortLabel: 'Chaos',
    subtitle: 'Wild letters & uneven sizes',
    accentHex: '#6366F1',
  },
  {
    id: 'hunger',
    name: 'Hunger Level',
    shortLabel: 'Hunger',
    subtitle: 'Snack sounds & round vowels',
    accentHex: '#0EA5E9',
  },
  {
    id: 'logicness',
    name: 'Logicness',
    shortLabel: 'Logicness',
    subtitle: 'Even words & neat endings',
    accentHex: '#4F46E5',
  },
  {
    id: 'sleepiness',
    name: 'Sleepiness',
    shortLabel: 'Sleepiness',
    subtitle: 'Soft sounds & gentle endings',
    accentHex: '#64748B',
  },
];

function fnv1aHash(input: string, salt = ''): number {
  const str = `${salt}:${input}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRange(seed: number, min: number, max: number): number {
  const normalized = (seed % 10000) / 10000;
  return Math.round(min + normalized * (max - min));
}

function pickDeterministic<T>(items: T[], lowerName: string, salt: string): T {
  const idx = fnv1aHash(lowerName, salt) % items.length;
  return items[idx];
}

function clampScore(value: number): number {
  return Math.max(4, Math.min(99, Math.round(value)));
}

function countWordSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;
  const trimmed = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  const adjusted = trimmed.replace(/^y/, '');
  const matches = adjusted.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

export function analyzeNameAnatomy(fullName: string): NameAnatomy {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  const words = normalized.split(/[\s-]+/).filter(Boolean);
  const lowerLetters = normalized.toLowerCase().replace(/[^a-z]/g, '');
  const vowels = lowerLetters.match(/[aeiouy]/g) ?? [];
  const consonants = lowerLetters.match(/[bcdfghjklmnpqrstvwxz]/g) ?? [];

  const clusterMatches = lowerLetters.match(/[bcdfghjklmnpqrstvwxz]{2,}/g) ?? [];
  const doubleMatches: string[] = [];
  for (let i = 0; i < lowerLetters.length - 1; i++) {
    if (lowerLetters[i] === lowerLetters[i + 1]) {
      doubleMatches.push(lowerLetters[i] + lowerLetters[i + 1]);
    }
  }

  const syllableCount = words.reduce((sum, w) => sum + countWordSyllables(w), 0);
  const firstInitial = words[0]?.[0]?.toLowerCase() ?? '';
  const lastInitial = words.length > 1 ? words[words.length - 1]?.[0]?.toLowerCase() ?? '' : '';
  const hasAlliteration = Boolean(words.length > 1 && firstInitial && firstInitial === lastInitial);

  return {
    normalized,
    words,
    letterCount: lowerLetters.length,
    syllableCount: Math.max(1, syllableCount),
    vowelCount: vowels.length,
    consonantCount: consonants.length,
    uniqueLetters: new Set(lowerLetters.split('')).size,
    consonantClusters: clusterMatches,
    doubleLetters: doubleMatches,
    hasAlliteration,
  };
}

type RawTraitScoreDetail = Omit<
  TraitScoreDetail,
  'baseScore' | 'peerDelta' | 'upVotes' | 'downVotes'
>;

function pickTierPool(
  score: number,
  tiers: [number, string[]][],
  lowerName: string,
  salt: string
): string {
  for (const [threshold, pool] of tiers) {
    if (score >= threshold) {
      return pickDeterministic(pool, lowerName, salt);
    }
  }
  return pickDeterministic(tiers[tiers.length - 1][1], lowerName, salt);
}

function scoreStinkiness(anatomy: NameAnatomy): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const funkyPairs = ['sn', 'st', 'sk', 'sm', 'ck', 'gr', 'bl', 'mp', 'nk', 'oo', 'zz', 'ch', 'ug', 'og', 'ph', 'tz', 'ow', 'zh', 'ea'];
  const foundFunky = funkyPairs.filter((p) => lower.includes(p));
  const plosives = (lower.match(/[bgkpdt]/g) ?? []).length;
  const vowelRatio = anatomy.letterCount ? anatomy.vowelCount / anatomy.letterCount : 0.35;
  const vowelPct = Math.round(vowelRatio * 100);

  const base = 24;
  const funkyPts = Math.min(39, foundFunky.length * 13);
  const doublePts = Math.min(18, anatomy.doubleLetters.length * 9);
  const plosivePts = Math.min(16, Math.round(plosives * 3.2));
  const crunchPts = vowelRatio < 0.36 ? 11 : vowelRatio < 0.45 ? 5 : -4;
  const hashJitter = seededRange(fnv1aHash(lower, 'stink'), -7, 11);

  const score = clampScore(base + funkyPts + doublePts + plosivePts + crunchPts + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: 'Base score',
      points: base,
      detail: 'Starting smell points',
    },
    {
      label: 'Smelly combos',
      points: funkyPts,
      detail:
        foundFunky.length > 0
          ? `Matched: "${foundFunky.slice(0, 4).join('", "')}"`
          : 'No smelly letter pairs',
    },
    {
      label: 'Double letters',
      points: doublePts,
      detail:
        anatomy.doubleLetters.length > 0
          ? `Repeated: ${anatomy.doubleLetters.join(', ')}`
          : 'No double letters',
    },
    {
      label: 'Heavy letters',
      points: plosivePts + crunchPts,
      detail: `${plosives} heavy sound${plosives === 1 ? '' : 's'} · ${vowelPct}% vowels`,
    },
    {
      label: 'Sound tweak',
      points: hashJitter,
      detail: 'Exact letter mix',
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, ['Super Stinky', 'Cheese Boss', 'Sock King', 'Stink Bomb']],
      [72, ['Old Gym Bag', 'Leftover Tuna', 'Sock Rebel', 'Extra Smelly']],
      [54, ['Kind of Stinky', 'Damp Sneaker', 'Weird Odor', 'Bit Funky']],
      [35, ['Barely Smelly', 'Slightly Stale', 'Mostly Clean', 'Faint Funk']],
      [0, ['Fresh Laundry', 'Pure Soap', 'Super Clean', 'Zero Stink']],
    ],
    lower,
    'stink-verdict'
  );

  const clusterNote =
    foundFunky.length > 0
      ? `"${foundFunky.slice(0, 2).join('", "')}"`
      : `${plosives} heavy letter${plosives === 1 ? '' : 's'}`;

  const doubleNote =
    anatomy.doubleLetters.length > 0
      ? `+ "${anatomy.doubleLetters[0]}"`
      : `· ${vowelPct}% vowels`;

  const summary = pickTierPool(
    score,
    [
      [88, [`${clusterNote} ${doubleNote}`, `Max funk · ${plosives} heavy hits`, `Pure cheese · ${clusterNote}`]],
      [72, [`${clusterNote} ${doubleNote}`, `${anatomy.syllableCount} chunky syllables`, `Gym-bag punch · ${clusterNote}`]],
      [54, [`${clusterNote} · ${anatomy.syllableCount} syllables`, `Mid funk · ${vowelPct}% vowels`, `Sniff test: ${clusterNote}`]],
      [35, [`Light · ${plosives} heavy sound${plosives === 1 ? '' : 's'}`, `Mostly fresh · ${vowelPct}% vowels`, `${anatomy.letterCount} clean letters`]],
      [0, [`Spotless · ${vowelPct}% vowels`, `Zero smelly combos`, `Fresh soap · ${anatomy.syllableCount} syllables`]],
    ],
    lower,
    'stink-summary'
  );

  return { traitId: 'stinkiness', score, verdict, summary, factors };
}

function scoreSmartness(anatomy: NameAnatomy): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const scholarlyEndings = ['us', 'is', 'on', 'ia', 'elle', 'ue', 'el', 'en', 'th', 'ph', 'es', 'or', 'um', 'an'];
  const wordEndHits = anatomy.words.filter((w) => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    return scholarlyEndings.some((end) => clean.endsWith(end));
  });
  const distinguishedInitials = ['a', 'c', 'e', 'h', 'i', 'p', 'q', 's', 'v'];
  const initialHits = anatomy.words.filter((w) =>
    distinguishedInitials.includes(w[0]?.toLowerCase() ?? '')
  ).length;

  const vowelRatio = anatomy.letterCount ? anatomy.vowelCount / anatomy.letterCount : 0.4;
  const vowelPct = Math.round(vowelRatio * 100);
  const goldenDelta = Math.abs(vowelRatio - 0.42);
  const ratioPts = Math.round(Math.max(0, 20 - goldenDelta * 65));
  const syllablePts = Math.min(28, anatomy.syllableCount * 4 + Math.max(0, anatomy.uniqueLetters - 10) * 2);
  const endingPts = Math.min(24, wordEndHits.length * 11);
  const initialPts = Math.min(10, initialHits * 4);
  const base = 16;
  const hashJitter = seededRange(fnv1aHash(lower, 'smart'), -6, 10);

  const score = clampScore(base + syllablePts + ratioPts + endingPts + initialPts + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: 'Syllables',
      points: base + syllablePts,
      detail: `${anatomy.syllableCount} syllable${anatomy.syllableCount === 1 ? '' : 's'} · ${anatomy.words.length} words`,
    },
    {
      label: 'Vowel balance',
      points: ratioPts,
      detail: `${vowelPct}% vowels (40% ideal)`,
    },
    {
      label: 'Smart endings',
      points: endingPts,
      detail:
        wordEndHits.length > 0
          ? `Matched: ${wordEndHits.join(', ')}`
          : 'Casual endings',
    },
    {
      label: 'Starter letters',
      points: initialPts,
      detail: `${initialHits} classic initial${initialHits === 1 ? '' : 's'}`,
    },
    {
      label: 'Sound tweak',
      points: hashJitter,
      detail: 'Letter spacing bonus',
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, ['Mega Genius', 'Dictionary Boss', 'Top of Class', 'Brainiac']],
      [72, ['Honor Roll', 'Front-Row Kid', 'Trivia Champ', 'Study Pro']],
      [54, ['Pretty Smart', 'Solid B+', 'Quick Thinker', 'Street Smart']],
      [35, ['Lucky Guesser', 'Vibes Only', 'Winged It', 'Chill Brain']],
      [0, ['Head Empty', 'Zero Homework', 'Just Vibing', 'No Thoughts']],
    ],
    lower,
    'smart-verdict'
  );

  const suffixNote =
    wordEndHits.length > 0
      ? `smart endings (${wordEndHits.join(', ')})`
      : `${anatomy.words.length}-word flow`;

  const summary = pickTierPool(
    score,
    [
      [88, [`${anatomy.syllableCount} big syllables · ${suffixNote}`, `Classic ${vowelPct}% vowel poise`, `Genius pace · ${initialHits} smart initials`]],
      [72, [`${anatomy.syllableCount} syllables · ${suffixNote}`, `Sharp ${vowelPct}% vowel balance`, `Honor roll · ${anatomy.letterCount} letters`]],
      [54, [`Steady ${anatomy.syllableCount} syllables`, `${vowelPct}% vowels · ${anatomy.words.length} words`, `Clean everyday pacing`]],
      [35, [`Short ${anatomy.syllableCount} syllables`, `Quick ${anatomy.letterCount}-letter style`, `Vibes over textbooks`]],
      [0, [`Ultra simple · ${anatomy.syllableCount} syllables`, `Zero overthinking`, `Short & stress-free`]],
    ],
    lower,
    'smart-summary'
  );

  return { traitId: 'smartness', score, verdict, summary, factors };
}

function scoreChaos(anatomy: NameAnatomy): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const wildLetters = (lower.match(/[jkqvwxz]/g) ?? []).length;

  let jumpTotal = 0;
  for (let i = 0; i < lower.length - 1; i++) {
    jumpTotal += Math.abs(lower.charCodeAt(i + 1) - lower.charCodeAt(i));
  }
  const avgJump = lower.length > 1 ? jumpTotal / (lower.length - 1) : 6;
  const jumpPts = Math.min(24, Math.round(avgJump * 2.1));

  const lengths = anatomy.words.map((w) => w.length);
  const spread = lengths.length > 1 ? Math.max(...lengths) - Math.min(...lengths) : 0;
  const asymmetryPts = Math.min(18, spread * 3);
  const wildPts = Math.min(26, wildLetters * 10);
  const punctuationBonus = /[-']/.test(anatomy.normalized) ? 10 : 0;
  const base = 16;
  const hashJitter = seededRange(fnv1aHash(lower, 'chaos'), -6, 12);

  const score = clampScore(base + wildPts + jumpPts + asymmetryPts + punctuationBonus + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: 'Wild letters',
      points: base + wildPts,
      detail:
        wildLetters > 0
          ? `${wildLetters} wild letter${wildLetters === 1 ? '' : 's'} (J/K/Q/V/W/X/Z)`
          : 'No wild J/K/Q/V/W/X/Z letters',
    },
    {
      label: 'Letter jumps',
      points: jumpPts,
      detail: `${avgJump.toFixed(1)} avg alphabet jump`,
    },
    {
      label: 'Word size gap',
      points: asymmetryPts + punctuationBonus,
      detail: `${spread}-letter word spread`,
    },
    {
      label: 'Chaos luck',
      points: hashJitter,
      detail: 'Letter order twist',
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, ['Total Menace', 'Pure Chaos', 'Drama Starter', 'Wildcard Boss']],
      [72, ['Trouble Magnet', 'Impulse Pick', 'Plot Twist', 'Wild Spark']],
      [54, ['Little Gremlin', 'Cheeky Card', 'Sneaky Move', 'Bit Wild']],
      [35, ['Mostly Chill', 'Tame Trouble', 'Calm Secrets', 'Rarely Wild']],
      [0, ['Super Calm', 'Follows Rules', 'Always Ready', 'Zero Drama']],
    ],
    lower,
    'chaos-verdict'
  );

  const summary = pickTierPool(
    score,
    [
      [88, [`${wildLetters} wild letters · ${avgJump.toFixed(1)} jumps`, `Big ${spread}-letter word gap`, `Total wildcard spelling`]],
      [72, [`${avgJump.toFixed(1)} letter jumps · ${spread}-char gap`, `Spicy ${wildLetters}-wild-letter mix`, `Expect plot twists`]],
      [54, [`Playful ${avgJump.toFixed(1)}-step jumps`, `${anatomy.uniqueLetters} unique letters`, `Mild mischief energy`]],
      [35, [`Smooth ${avgJump.toFixed(1)}-step flow`, `Few sharp turns`, `Easygoing spelling`]],
      [0, [`Zero wild letters`, `Neat ${spread}-letter gap`, `Pure calm order`]],
    ],
    lower,
    'chaos-summary'
  );

  return { traitId: 'chaos', score, verdict, summary, factors };
}

function scoreHunger(anatomy: NameAnatomy): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const roundVowels = (lower.match(/[oua]/g) ?? []).length;
  const munchLetters = (lower.match(/[mnbpchk]/g) ?? []).length;
  const snackPairs = ['ch', 'oo', 'um', 'am', 'an', 'ee', 'ea', 'at', 'om', 'on', 'cr', 'ck'];
  const foundSnacks = snackPairs.filter((p) => lower.includes(p));

  const base = 18;
  const roundPts = Math.min(22, roundVowels * 4);
  const munchPts = Math.min(24, munchLetters * 4);
  const snackPts = Math.min(24, foundSnacks.length * 8);
  const allitPts = anatomy.hasAlliteration ? 6 : 0;
  const hashJitter = seededRange(fnv1aHash(lower, 'hunger'), -6, 10);

  const score = clampScore(base + roundPts + munchPts + snackPts + allitPts + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: 'Round vowels',
      points: base + roundPts,
      detail: `${roundVowels} open O/U/A vowel${roundVowels === 1 ? '' : 's'}`,
    },
    {
      label: 'Munch sounds',
      points: munchPts,
      detail: `${munchLetters} chewy M/N/B/P/C/H/K`,
    },
    {
      label: 'Snack combos',
      points: snackPts + allitPts,
      detail:
        foundSnacks.length > 0
          ? `Matched: "${foundSnacks.slice(0, 4).join('", "')}"`
          : 'No snack letter pairs',
    },
    {
      label: 'Snack tweak',
      points: hashJitter,
      detail: 'Appetite timing score',
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, ['Always Hungry', 'Snack Monster', 'Bottomless Pit', 'Second Dinner']],
      [72, ['Snack Lover', 'Extra Fries', 'Needs Snacks', 'Lunch First']],
      [54, ['Ready To Eat', 'Sweet Tooth', 'Peckish', 'Snack Ready']],
      [35, ['Light Eater', 'Small Bite', 'Half Portion', 'Saves Leftovers']],
      [0, ['Already Full', 'Tiny Appetite', 'Skips Dessert', 'Just Water']],
    ],
    lower,
    'hunger-verdict'
  );

  const snackNote =
    foundSnacks.length > 0
      ? `"${foundSnacks[0]}" combo`
      : `${anatomy.syllableCount} syllables`;

  const summary = pickTierPool(
    score,
    [
      [88, [`${roundVowels} round vowels · ${snackNote}`, `${munchLetters} chewy letters · zero leftovers`, `Built for extra fries`]],
      [72, [`${munchLetters} munch sounds · ${roundVowels} O/U/A`, `Tasty ${snackNote} · loves snacks`, `Always checks the fridge`]],
      [54, [`${roundVowels} round vowels · steady bite`, `${munchLetters} snack sounds · balanced`, `Down for a quick bite`]],
      [35, [`Only ${roundVowels} round vowel${roundVowels === 1 ? '' : 's'}`, `Light ${anatomy.letterCount}-letter meal`, `Takes small portions`]],
      [0, [`Only ${munchLetters} munch letter${munchLetters === 1 ? '' : 's'}`, `Light ${anatomy.syllableCount}-syllable bite`, `Full after two bites`]],
    ],
    lower,
    'hunger-summary'
  );

  return { traitId: 'hunger', score, verdict, summary, factors };
}

function scoreLogicness(anatomy: NameAnatomy): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const analyticalStops = (lower.match(/[cdklmnpt]/g) ?? []).length;
  const structuredEndings = ['er', 'on', 'ic', 'al', 'en', 'is', 'an', 'ed', 'nt', 'st'];
  const endingHits = anatomy.words.filter((w) => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    return structuredEndings.some((end) => clean.endsWith(end));
  }).length;

  const lengths = anatomy.words.map((w) => w.length);
  const spread = lengths.length > 1 ? Math.max(...lengths) - Math.min(...lengths) : 0;
  const parityPts = Math.max(0, 20 - spread * 3);
  const stopPts = Math.min(24, analyticalStops * 4);
  const endingPts = Math.min(16, endingHits * 8);
  const evenLetterBonus = anatomy.letterCount % 2 === 0 ? 10 : 4;
  const base = 18;
  const hashJitter = seededRange(fnv1aHash(lower, 'logic'), -6, 10);

  const score = clampScore(base + parityPts + stopPts + endingPts + evenLetterBonus + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: 'Crisp letters',
      points: base + stopPts,
      detail: `${analyticalStops} crisp C/D/K/L/M/N/P/T`,
    },
    {
      label: 'Word balance',
      points: parityPts + evenLetterBonus,
      detail: `${spread}-letter gap · ${anatomy.letterCount} total`,
    },
    {
      label: 'Neat endings',
      points: endingPts,
      detail: `${endingHits} neat ending${endingHits === 1 ? '' : 's'}`,
    },
    {
      label: 'Order tweak',
      points: hashJitter,
      detail: 'Letter layout score',
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, ['Human Calculator', 'Plan Maker', 'Super Logical', 'Color-Coded']],
      [72, ['Good Planner', 'Checklist Boss', 'Reads Rules', 'Clear Thinker']],
      [54, ['Makes Sense', 'Organized', 'Double Checks', 'Practical']],
      [35, ['Goes With Vibes', 'Wings It', 'Loose Plan', 'Follows Gut']],
      [0, ['Zero Math', 'Pure Gut', 'Skips Rules', 'All Vibes']],
    ],
    lower,
    'logic-verdict'
  );

  const summary = pickTierPool(
    score,
    [
      [88, [`${analyticalStops} crisp letters · ${spread}-char gap`, `Super neat ${anatomy.letterCount}-letter setup`, `Calculator-grade order`]],
      [72, [`${analyticalStops} crisp letters · ${endingHits} neat ends`, `Tidy ${spread}-letter word balance`, `Clean ${anatomy.syllableCount}-syllable pacing`]],
      [54, [`${analyticalStops} crisp letters · steady`, `Tidy ${anatomy.letterCount}-letter mix`, `Practical everyday balance`]],
      [35, [`Wide ${spread}-letter word gap`, `Loose ${anatomy.letterCount}-letter feel`, `More gut than math`]],
      [0, [`Uneven ${spread}-letter sizes`, `100% go-with-the-flow`, `Zero spreadsheet vibes`]],
    ],
    lower,
    'logic-summary'
  );

  return { traitId: 'logicness', score, verdict, summary, factors };
}

function scoreSleepiness(anatomy: NameAnatomy): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const cozyLetters = (lower.match(/[smnwuoz]/g) ?? []).length;
  const harshStops = (lower.match(/[kptx]/g) ?? []).length;
  const endsWithVowel = /[aeiouy]$/.test(lower);

  const base = 22;
  const cozyPts = Math.min(30, cozyLetters * 5);
  const softEndingPts = endsWithVowel ? 14 : 4;
  const antiWakePenalty = Math.max(-12, -harshStops * 4);
  const drowsyPairs = (lower.match(/(oo|ee|aa|sh|zz|mm)/g) ?? []).length * 9;
  const hashJitter = seededRange(fnv1aHash(lower, 'sleep'), -5, 11);

  const score = clampScore(base + cozyPts + softEndingPts + antiWakePenalty + drowsyPairs + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: 'Sleepy letters',
      points: base + cozyPts,
      detail: `${cozyLetters} soft S/M/N/W/U/O/Z`,
    },
    {
      label: 'Soft ending',
      points: softEndingPts + drowsyPairs,
      detail: endsWithVowel ? 'Soft vowel fade' : 'Consonant stop',
    },
    {
      label: 'Wake-up letters',
      points: antiWakePenalty,
      detail:
        harshStops > 0
          ? `${harshStops} sharp K/P/T/X`
          : 'No wake-up letters',
    },
    {
      label: 'Nap tweak',
      points: hashJitter,
      detail: 'Letter flow score',
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, ['Always Napping', 'Pro Napper', '5 More Mins', 'Blanket Boss']],
      [72, ['Snooze Button', 'Sleepyhead', 'Cozy Hoodie', 'Loves Bedtime']],
      [54, ['Afternoon Nap', 'Lunch Dozer', 'Comfy Vibes', 'Soft Pillow']],
      [35, ['Light Sleeper', 'Quick Catnap', 'Mostly Awake', 'Hard To Nap']],
      [0, ['Wide Awake', 'Never Sleeps', 'Night Owl', 'Triple Coffee']],
    ],
    lower,
    'sleep-verdict'
  );

  const summary = pickTierPool(
    score,
    [
      [88, [`${cozyLetters} cozy letters${endsWithVowel ? ' + soft fade' : ''}`, `Peak blanket energy`, `${anatomy.syllableCount} plush syllables`]],
      [72, [`${cozyLetters} soft letters · big nap energy`, `Warm humming sounds`, `Built for comfy couches`]],
      [54, [`${cozyLetters} cozy vs ${harshStops} sharp`, `Medium nap rating`, `Comfy but stays awake`]],
      [35, [`${harshStops} sharp wake-up hits`, `Light sleeper sound`, `Crisp ${anatomy.letterCount} letters`]],
      [0, [`${harshStops} sharp K/P/T/X hits`, `Only ${cozyLetters} sleepy letter${cozyLetters === 1 ? '' : 's'}`, `Wide awake past midnight`]],
    ],
    lower,
    'sleep-summary'
  );

  return { traitId: 'sleepiness', score, verdict, summary, factors };
}

function scoreCustomTrait(
  anatomy: NameAnatomy,
  traitId: TraitId,
  traitName: string,
  weights: CustomTraitWeights
): RawTraitScoreDetail {
  const lower = anatomy.normalized.toLowerCase().replace(/[^a-z]/g, '');
  const totalWeight = Math.max(1, weights.crunch + weights.flow + weights.heft + weights.chaos);

  const crunchRaw = Math.min(100, anatomy.consonantClusters.length * 22 + anatomy.doubleLetters.length * 18 + 20);
  const flowRaw = Math.min(
    100,
    (lower.match(/[aeiouylmnr]/g) ?? []).length * 8 + (anatomy.hasAlliteration ? 24 : 8)
  );
  const heftRaw = Math.min(100, anatomy.syllableCount * 14 + anatomy.letterCount * 2.5);
  const chaosRaw = Math.min(
    100,
    (lower.match(/[jkqvwxz]/g) ?? []).length * 24 + anatomy.uniqueLetters * 4.5
  );

  const weighted =
    (crunchRaw * weights.crunch +
      flowRaw * weights.flow +
      heftRaw * weights.heft +
      chaosRaw * weights.chaos) /
    totalWeight;

  const hashJitter = seededRange(fnv1aHash(lower, traitName.toLowerCase()), -9, 10);
  const score = clampScore(weighted + hashJitter);

  const factors: AlgorithmFactor[] = [
    {
      label: `Letter crunch (${weights.crunch}%)`,
      points: Math.round((crunchRaw * weights.crunch) / totalWeight),
      detail: `${anatomy.consonantClusters.length} clusters · ${anatomy.doubleLetters.length} doubles`,
    },
    {
      label: `Smooth flow (${weights.flow}%)`,
      points: Math.round((flowRaw * weights.flow) / totalWeight),
      detail: `Vowels${anatomy.hasAlliteration ? ' + matching initials' : ' & liquids'}`,
    },
    {
      label: `Name size (${weights.heft}%)`,
      points: Math.round((heftRaw * weights.heft) / totalWeight),
      detail: `${anatomy.syllableCount} syllables · ${anatomy.letterCount} letters`,
    },
    {
      label: `Wild letters (${weights.chaos}%)`,
      points: Math.round((chaosRaw * weights.chaos) / totalWeight),
      detail: `${anatomy.uniqueLetters} unique letters`,
    },
    {
      label: 'Custom tweak',
      points: hashJitter,
      detail: `Tuned for ${traitName}`,
    },
  ];

  const verdict = pickTierPool(
    score,
    [
      [88, [`Max ${traitName}`, `Top ${traitName}`, `Total ${traitName}`]],
      [72, [`High ${traitName}`, `Strong ${traitName}`, `Big ${traitName}`]],
      [54, [`Solid ${traitName}`, `Good ${traitName}`, `Medium ${traitName}`]],
      [35, [`A Little ${traitName}`, `Mild ${traitName}`, `Light ${traitName}`]],
      [0, [`Zero ${traitName}`, `No ${traitName}`, `Tiny ${traitName}`]],
    ],
    lower,
    `custom-${traitName.toLowerCase()}`
  );

  const summary = pickDeterministic(
    [
      `${anatomy.syllableCount} syllables · ${anatomy.consonantClusters.length} clusters`,
      `${anatomy.letterCount} letters · ${anatomy.uniqueLetters} unique`,
      `${anatomy.doubleLetters.length > 0 ? `Double "${anatomy.doubleLetters[0]}"` : `${anatomy.vowelCount} vowels`} · ${traitName}`,
    ],
    lower,
    `custom-sum-${traitName.toLowerCase()}`
  );

  return {
    traitId,
    score,
    verdict,
    summary,
    factors,
  };
}

export function evaluatePerson(
  person: PersonInput,
  allTraits: TraitDefinition[]
): EvaluatedPerson {
  const anatomy = analyzeNameAnatomy(person.fullName);
  const scores: Record<string, TraitScoreDetail> = {};

  for (const trait of allTraits) {
    let raw: RawTraitScoreDetail;
    if (trait.isCustom && trait.weights) {
      raw = scoreCustomTrait(anatomy, trait.id, trait.name, trait.weights);
    } else {
      switch (trait.id as BuiltInTraitId) {
        case 'stinkiness':
          raw = scoreStinkiness(anatomy);
          break;
        case 'smartness':
          raw = scoreSmartness(anatomy);
          break;
        case 'chaos':
          raw = scoreChaos(anatomy);
          break;
        case 'hunger':
          raw = scoreHunger(anatomy);
          break;
        case 'logicness':
          raw = scoreLogicness(anatomy);
          break;
        case 'sleepiness':
          raw = scoreSleepiness(anatomy);
          break;
      }
    }

    const tally = person.peerVotes?.[trait.id];
    const upVotes = tally?.up ?? 0;
    const downVotes = tally?.down ?? 0;
    const peerDelta = (upVotes - downVotes) * 5;
    const baseScore = raw.score;
    const effectiveScore = Math.max(0, Math.min(100, baseScore + peerDelta));

    scores[trait.id] = {
      ...raw,
      score: effectiveScore,
      baseScore,
      peerDelta,
      upVotes,
      downVotes,
    };
  }

  let bestTraitId: TraitId = allTraits[0]?.id ?? 'stinkiness';
  let highest = -1;
  for (const trait of allTraits) {
    const s = scores[trait.id]?.baseScore ?? 0;
    if (s > highest) {
      highest = s;
      bestTraitId = trait.id;
    }
  }

  const bestTrait = allTraits.find((t) => t.id === bestTraitId);
  const bestDetail = scores[bestTraitId];
  const overallSignature = bestTrait && bestDetail
    ? `${bestDetail.verdict} (${bestTrait.shortLabel} ${bestDetail.baseScore})`
    : 'Balanced';

  return {
    ...person,
    anatomy,
    scores,
    bestTraitId,
    overallSignature,
  };
}
