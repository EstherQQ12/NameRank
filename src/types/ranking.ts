export type BuiltInTraitId =
  | 'stinkiness'
  | 'smartness'
  | 'chaos'
  | 'hunger'
  | 'logicness'
  | 'sleepiness';

export type TraitId = BuiltInTraitId | `custom_${string}`;

export interface CustomTraitWeights {
  crunch: number; // 0..100: consonant clusters & plosives
  flow: number;   // 0..100: vowels, liquids & alliteration
  heft: number;   // 0..100: length & syllable depth
  chaos: number;  // 0..100: entropy, rare letters & asymmetry
}

export interface TraitDefinition {
  id: TraitId;
  name: string;
  shortLabel: string;
  subtitle: string;
  accentHex: string;
  isCustom?: boolean;
  weights?: CustomTraitWeights;
}

export interface AlgorithmFactor {
  label: string;
  points: number; // positive or negative contribution
  detail: string;
}

export interface TraitScoreDetail {
  traitId: TraitId;
  score: number; // effective score 0..100 (baseScore + peerDelta, clamped)
  baseScore: number; // deterministic name score 4..99
  peerDelta: number; // (upVotes - downVotes) * 5
  upVotes: number;
  downVotes: number;
  verdict: string;
  summary: string;
  factors: AlgorithmFactor[];
}

export interface NameAnatomy {
  normalized: string;
  words: string[];
  letterCount: number;
  syllableCount: number;
  vowelCount: number;
  consonantCount: number;
  uniqueLetters: number;
  consonantClusters: string[];
  doubleLetters: string[];
  hasAlliteration: boolean;
}

export interface PeerVoteTally {
  up: number;
  down: number;
}

export interface PersonInput {
  id: string;
  fullName: string;
  addedAt: number;
  peerVotes?: Record<string, PeerVoteTally>;
}

export interface House {
  id: string;
  name: string;
  createdAt: number;
  people: PersonInput[];
}

export interface EvaluatedPerson extends PersonInput {
  anatomy: NameAnatomy;
  scores: Record<string, TraitScoreDetail>;
  bestTraitId: TraitId;
  overallSignature: string;
}
