import { Check, Swords, Users } from 'lucide-react';
import { useState } from 'react';
import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';
import { RadarChart } from './RadarChart';
import { TraitIcon } from './TraitIcon';

interface HeadToHeadProps {
  people: EvaluatedPerson[];
  allTraits: TraitDefinition[];
}

const COMPARE_COLORS = [
  '#2563EB', // Royal Blue
  '#0EA5E9', // Sky Blue
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Rose
];

export function HeadToHead({ people, allTraits }: HeadToHeadProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    people.slice(0, Math.min(3, people.length)).map((p) => p.id)
  );

  if (people.length < 2) {
    return (
      <section
        aria-label="Compare people in house"
        className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-10 text-center"
      >
        <div className="w-11 h-11 rounded-xl bg-[#EBF2FA] border border-[#D9E4F2] flex items-center justify-center mx-auto mb-3">
          <Swords className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
        </div>
        <h2 className="text-base font-bold text-[#0F172A]">
          {people.length === 0 ? 'No names in this house yet' : 'Need one more name to compare'}
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Add at least 2 people above, then select who you want to compare.
        </p>
      </section>
    );
  }

  const validIds = selectedIds.filter((id) => people.some((p) => p.id === id));
  const selectedPeople = validIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is EvaluatedPerson => Boolean(p));

  const togglePerson = (id: string) => {
    setSelectedIds((prev) => {
      const cleaned = prev.filter((item) => people.some((p) => p.id === item));
      if (cleaned.includes(id)) {
        return cleaned.filter((item) => item !== id);
      }
      return [...cleaned, id];
    });
  };

  const selectAllPeople = () => {
    setSelectedIds(people.map((p) => p.id));
  };

  const resetToTwo = () => {
    setSelectedIds(people.slice(0, 2).map((p) => p.id));
  };

  const series = selectedPeople.map((person, index) => ({
    person,
    color: COMPARE_COLORS[index % COMPARE_COLORS.length],
  }));

  const winCounts: Record<string, number> = {};
  for (const person of selectedPeople) {
    winCounts[person.id] = 0;
  }

  if (selectedPeople.length >= 2) {
    for (const trait of allTraits) {
      let bestScore = -1;
      for (const person of selectedPeople) {
        const s = person.scores[trait.id]?.score ?? 0;
        if (s > bestScore) bestScore = s;
      }
      const leaders = selectedPeople.filter(
        (p) => (p.scores[trait.id]?.score ?? 0) === bestScore
      );
      if (leaders.length === 1) {
        winCounts[leaders[0].id] = (winCounts[leaders[0].id] ?? 0) + 1;
      }
    }
  }

  const rankedByWins = [...series].sort(
    (a, b) => (winCounts[b.person.id] ?? 0) - (winCounts[a.person.id] ?? 0)
  );
  const topWinTotal = rankedByWins[0] ? winCounts[rankedByWins[0].person.id] ?? 0 : 0;
  const overallLeaders = rankedByWins.filter(
    (item) => (winCounts[item.person.id] ?? 0) === topWinTotal
  );

  return (
    <section aria-label="Compare people in house" className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Pick people to compare ({selectedPeople.length} selected)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllPeople}
              className="px-3 py-1.5 text-xs font-medium text-[#2563EB] bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] rounded-lg transition-colors cursor-pointer"
            >
              Select All ({people.length})
            </button>
            <button
              type="button"
              onClick={resetToTwo}
              className="px-3 py-1.5 text-xs font-medium text-[#475569] bg-white hover:bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg transition-colors cursor-pointer"
            >
              Top 2
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {people.map((person) => {
            const selectedIdx = selectedPeople.findIndex((p) => p.id === person.id);
            const isSelected = selectedIdx !== -1;
            const color = isSelected
              ? COMPARE_COLORS[selectedIdx % COMPARE_COLORS.length]
              : '#94A3B8';

            return (
              <button
                key={person.id}
                type="button"
                onClick={() => togglePerson(person.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F3F7FC] text-[#0F172A] shadow-2xs'
                    : 'bg-white text-[#64748B] border-[#D9E4F2] hover:text-[#0F172A] hover:border-[#B9CCE6]'
                }`}
                style={
                  isSelected
                    ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}33` }
                    : undefined
                }
              >
                <span
                  className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isSelected ? color : '#EBF2FA',
                  }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                </span>
                <span className="truncate max-w-[180px]">{person.fullName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedPeople.length < 2 ? (
        <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-[#0F172A]">
            Select at least 2 people above to compare.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5 space-y-4">
            <div className="text-center border-b border-[#EBF2FA] pb-4">
              <div className="w-9 h-9 rounded-lg bg-[#EBF2FA] flex items-center justify-center mx-auto mb-2">
                <Swords className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {overallLeaders.length === 1
                  ? `${overallLeaders[0].person.fullName} leads`
                  : 'Tied for the Lead'}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Trait wins across {selectedPeople.length} people
              </p>
            </div>

            <RadarChart series={series} traits={allTraits} />

            <div className="space-y-1.5 pt-2 border-t border-[#EBF2FA]">
              {rankedByWins.map((item) => {
                const wins = winCounts[item.person.id] ?? 0;
                return (
                  <div
                    key={item.person.id}
                    className="flex items-center justify-between gap-2 text-xs px-2 py-1 rounded-md bg-[#F3F7FC]"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-[#0F172A] min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.person.fullName}</span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-[#475569] shrink-0">
                      {wins} won
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl divide-y divide-[#EBF2FA]">
            {allTraits.map((trait) => {
              const sortedForTrait = [...series].sort(
                (a, b) =>
                  (b.person.scores[trait.id]?.score ?? 0) -
                  (a.person.scores[trait.id]?.score ?? 0)
              );
              const topScore = sortedForTrait[0]?.person.scores[trait.id]?.score ?? 0;
              const traitLeaders = sortedForTrait.filter(
                (item) => (item.person.scores[trait.id]?.score ?? 0) === topScore
              );
              const winnerLabel =
                traitLeaders.length === 1
                  ? `${traitLeaders[0].person.anatomy.words[0]} · ${topScore}`
                  : `Tie · ${topScore}`;

              return (
                <div key={trait.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                      <TraitIcon
                        traitId={trait.id}
                        className="w-3.5 h-3.5"
                        style={{ color: trait.accentHex }}
                      />
                      {trait.name}
                    </span>
                    <span className="font-mono text-[#64748B] tabular-nums">{winnerLabel}</span>
                  </div>

                  <div className="space-y-1.5">
                    {sortedForTrait.map((item) => {
                      const score = item.person.scores[trait.id]?.score ?? 0;
                      return (
                        <div key={item.person.id} className="flex items-center gap-2.5">
                          <span className="text-xs font-medium text-[#0F172A] w-28 sm:w-36 truncate shrink-0">
                            {item.person.fullName}
                          </span>
                          <div className="flex-1 h-2 bg-[#EBF2FA] rounded-sm overflow-hidden">
                            <div
                              className="h-full rounded-sm transition-all duration-300"
                              style={{ width: `${score}%`, backgroundColor: item.color }}
                            />
                          </div>
                          <span
                            className="font-mono text-xs font-semibold tabular-nums w-7 text-right shrink-0"
                            style={{ color: item.color }}
                          >
                            {score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
