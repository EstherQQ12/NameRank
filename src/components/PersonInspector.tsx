import { ArrowDown, ArrowUp, BarChart3, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';
import { RadarChart } from './RadarChart';
import { TraitIcon } from './TraitIcon';

interface PersonInspectorProps {
  person: EvaluatedPerson | null;
  activeTrait: TraitDefinition;
  allTraits: TraitDefinition[];
  onSelectTrait: (traitId: TraitDefinition['id']) => void;
  onVotePerson: (personId: string, direction: 'up' | 'down') => void;
  onResetVotes: (personId: string) => void;
}

export function PersonInspector({
  person,
  activeTrait,
  allTraits,
  onSelectTrait,
  onVotePerson,
  onResetVotes,
}: PersonInspectorProps) {
  if (!person) {
    return (
      <aside className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6 text-center">
        <div className="w-9 h-9 rounded-lg bg-[#EBF2FA] flex items-center justify-center mx-auto mb-2.5">
          <BarChart3 className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-[#0F172A]">Select a name</p>
        <p className="text-xs text-[#64748B] mt-1">
          Click anyone to view their chart and points.
        </p>
      </aside>
    );
  }

  const activeDetail = person.scores[activeTrait.id];
  const peerDelta = activeDetail?.peerDelta ?? 0;
  const upVotes = activeDetail?.upVotes ?? 0;
  const downVotes = activeDetail?.downVotes ?? 0;
  const totalVotes = upVotes + downVotes;

  const sortedTraits = [...allTraits].sort(
    (a, b) => (person.scores[b.id]?.score ?? 0) - (person.scores[a.id]?.score ?? 0)
  );

  return (
    <aside
      aria-label="Person scorecard"
      className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5 space-y-5 lg:sticky lg:top-6"
    >
      <div className="border-b border-[#EBF2FA] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#64748B]">
              {person.anatomy.letterCount} letters · {person.anatomy.syllableCount} syllables
            </p>
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A] mt-0.5 break-words">
              {person.fullName}
            </h2>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-2xl font-bold tabular-nums text-[#0F172A]">
              {activeDetail?.score ?? 0}
            </span>
            <p className="text-[11px] font-medium text-[#64748B] whitespace-nowrap">
              {activeTrait.shortLabel}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#475569] mt-2">
          Top trait: <strong className="font-semibold text-[#0F172A]">{person.overallSignature}</strong>
        </p>

        <div className="mt-3 p-3 rounded-lg bg-[#F3F7FC] border border-[#D9E4F2] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A]">Peer Opinion</p>
              <p className="text-[11px] text-[#64748B]">
                Name score {activeDetail?.baseScore ?? 0}
                {totalVotes > 0 ? ` · ${totalVotes} vote${totalVotes === 1 ? '' : 's'}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onVotePerson(person.id, 'up')}
                aria-label="Agree (+5)"
                title="Agree (+5)"
                className="p-1.5 rounded-md bg-white border border-[#D9E4F2] text-[#475569] hover:text-[#2563EB] hover:border-[#2563EB]/40 transition-colors cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span
                className={`font-mono text-xs font-semibold tabular-nums min-w-[30px] text-center ${
                  peerDelta > 0
                    ? 'text-[#2563EB]'
                    : peerDelta < 0
                      ? 'text-[#DC2626]'
                      : 'text-[#64748B]'
                }`}
              >
                {peerDelta > 0 ? `+${peerDelta}` : peerDelta}
              </span>
              <button
                type="button"
                onClick={() => onVotePerson(person.id, 'down')}
                aria-label="Disagree (-5)"
                title="Disagree (-5)"
                className="p-1.5 rounded-md bg-white border border-[#D9E4F2] text-[#475569] hover:text-[#DC2626] hover:border-[#DC2626]/40 transition-colors cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {totalVotes > 0 && (
                <button
                  type="button"
                  onClick={() => onResetVotes(person.id)}
                  aria-label="Reset peer votes"
                  title="Reset votes"
                  className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Each vote shifts +/-5. Name remarks stay the same.
          </p>
        </div>
      </div>

      <div className="py-1">
        <RadarChart primary={person} traits={allTraits} primaryColor={activeTrait.accentHex} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-[#0F172A]">All Traits</h3>
        </div>

        <div className="space-y-1.5">
          {sortedTraits.map((trait) => {
            const detail = person.scores[trait.id];
            const score = detail?.score ?? 0;
            const isCurrent = trait.id === activeTrait.id;

            return (
              <button
                key={trait.id}
                type="button"
                onClick={() => onSelectTrait(trait.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                  isCurrent ? 'bg-[#EBF2FA]' : 'hover:bg-[#F3F7FC]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#0F172A] truncate">
                    <TraitIcon
                      traitId={trait.id}
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: trait.accentHex }}
                    />
                    {trait.name}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-[#0F172A]">
                    {score}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#EBF2FA] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{ width: `${score}%`, backgroundColor: trait.accentHex }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeDetail && (
        <div className="pt-4 border-t border-[#EBF2FA]">
          <div className="flex items-center gap-1.5 mb-2.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
            <h3 className="text-xs font-semibold text-[#0F172A]">
              Score Breakdown
            </h3>
          </div>

          <div className="space-y-2">
            {activeDetail.factors.map((factor) => (
              <div key={factor.label} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-[#0F172A]">{factor.label}</p>
                  <p className="text-[#64748B] leading-snug">{factor.detail}</p>
                </div>
                <span
                  className={`font-mono font-semibold tabular-nums shrink-0 ${
                    factor.points >= 0 ? 'text-[#0F172A]' : 'text-[#DC2626]'
                  }`}
                >
                  {factor.points >= 0 ? `+${factor.points}` : factor.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
