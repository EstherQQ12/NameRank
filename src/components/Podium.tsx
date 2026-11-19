import { Award, Medal, Trophy } from 'lucide-react';
import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';
import { TraitIcon } from './TraitIcon';

interface PodiumProps {
  rankedPeople: EvaluatedPerson[];
  activeTrait: TraitDefinition;
  selectedPersonId: string | null;
  onSelectPerson: (id: string) => void;
  sortDescending: boolean;
}

export function Podium({
  rankedPeople,
  activeTrait,
  selectedPersonId,
  onSelectPerson,
  sortDescending,
}: PodiumProps) {
  const topThree = rankedPeople.slice(0, 3);
  if (topThree.length === 0) return null;

  return (
    <section aria-label="Top three podium">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#0F172A] inline-flex items-center gap-2">
          <TraitIcon
            traitId={activeTrait.id}
            className="w-4 h-4"
            style={{ color: activeTrait.accentHex }}
          />
          {sortDescending ? `Top 3 · ${activeTrait.name}` : `Lowest 3 · ${activeTrait.name}`}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        {topThree.map((person, index) => {
          const detail = person.scores[activeTrait.id];
          const isSelected = person.id === selectedPersonId;
          const rankNumber = index + 1;

          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelectPerson(person.id)}
              className={`group text-left rounded-xl p-4 transition-all duration-150 border backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] flex flex-col justify-between cursor-pointer ${
                rankNumber === 1 ? 'bg-[#F4F8FF]/95' : 'bg-white/90'
              } ${
                isSelected
                  ? 'border-[#2563EB] ring-1 ring-[#2563EB]/25'
                  : 'border-[#D9E4F2] hover:border-[#B9CCE6]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#475569] inline-flex items-center gap-1.5">
                    {rankNumber === 1 ? (
                      <Trophy className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                    ) : rankNumber === 2 ? (
                      <Medal className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                    ) : (
                      <Award className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
                    )}
                    #{rankNumber}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    {detail && detail.peerDelta !== 0 && (
                      <span
                        className={`font-mono text-[11px] font-semibold tabular-nums ${
                          detail.peerDelta > 0 ? 'text-[#2563EB]' : 'text-[#DC2626]'
                        }`}
                      >
                        {detail.peerDelta > 0 ? `+${detail.peerDelta}` : detail.peerDelta}
                      </span>
                    )}
                    <span className="font-mono text-lg font-bold tabular-nums text-[#0F172A]">
                      {detail?.score ?? 0}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#0F172A] leading-snug truncate">
                  {person.fullName}
                </h3>

                <p className="text-xs text-[#475569] mt-0.5 truncate">
                  {detail?.verdict}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#EBF2FA]">
                <div className="h-1.5 w-full bg-[#EBF2FA] rounded-sm overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      width: `${detail?.score ?? 0}%`,
                      backgroundColor: activeTrait.accentHex,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] truncate">
                  {detail?.summary}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
