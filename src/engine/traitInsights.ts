import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';

const TRAIT_INSIGHTS_CACHE_KEY = 'namerank_trait_insights_v1';

export function getTraitInsightKey(person: EvaluatedPerson): string {
  return `${person.anatomy.normalized.toLowerCase()}::${person.bestTraitId}`;
}

export function loadCachedTraitInsights(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TRAIT_INSIGHTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore storage read error
  }
  return {};
}

function saveTraitInsights(merged: Record<string, string>): void {
  try {
    localStorage.setItem(TRAIT_INSIGHTS_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage write error
  }
}

export async function fetchMissingTraitInsights(
  people: EvaluatedPerson[],
  allTraits: TraitDefinition[],
  existing: Record<string, string>
): Promise<Record<string, string>> {
  const seenKeys = new Set<string>();
  const missingItems: Array<{
    key: string;
    fullName: string;
    traitId: string;
    traitName: string;
    score: number;
    verdict: string;
    doubleLetters: string[];
    syllableCount: number;
    letterCount: number;
  }> = [];

  for (const person of people) {
    const key = getTraitInsightKey(person);
    if (existing[key] || seenKeys.has(key)) continue;
    seenKeys.add(key);

    const bestTrait = allTraits.find((t) => t.id === person.bestTraitId);
    const bestDetail = person.scores[person.bestTraitId];
    if (!bestTrait || !bestDetail) continue;

    missingItems.push({
      key,
      fullName: person.fullName,
      traitId: bestTrait.id,
      traitName: bestTrait.name,
      score: bestDetail.baseScore,
      verdict: bestDetail.verdict,
      doubleLetters: person.anatomy.doubleLetters,
      syllableCount: person.anatomy.syllableCount,
      letterCount: person.anatomy.letterCount,
    });
  }

  if (missingItems.length === 0) return existing;

  const response = await fetch('/api/trait-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: missingItems }),
  });

  const data = (await response.json()) as {
    insights?: Record<string, string>;
    error?: string;
  };

  if (!response.ok || !data.insights) {
    throw new Error(data.error || 'Could not generate trait insights.');
  }

  const merged = { ...existing, ...data.insights };
  saveTraitInsights(merged);
  return merged;
}
