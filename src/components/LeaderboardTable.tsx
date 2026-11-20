import { ArrowDown, ArrowDownUp, ArrowUp, Loader2, Search, Trash2 } from 'lucide-react';
import { getTraitInsightKey } from '../engine/traitInsights';
import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';
import { TraitIcon } from './TraitIcon';

interface LeaderboardTableProps {
  people: EvaluatedPerson[];
  activeTrait: TraitDefinition;
  allTraits: TraitDefinition[];
  traitInsights: Record<string, string>;
  loadingInsights: boolean;
  insightError: string | null;
  selectedPersonId: string | null;
  onSelectPerson: (id: string) => void;
  onRemovePerson: (id: string) => void;
  onVotePerson: (personId: string, direction: 'up' | 'down') => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortDescending: boolean;
  onToggleSort: () => void;
}

export function LeaderboardTable({
  people,
  activeTrait,
  allTraits,
  traitInsights,
  loadingInsights,
  insightError,
  selectedPersonId,
  onSelectPerson,
  onRemovePerson,
  onVotePerson,
  searchQuery,
  onSearchChange,
  sortDescending,
  onToggleSort,
}: LeaderboardTableProps) {
  return (
    <section
      aria-label="Full name leaderboard"
      className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-[#D9E4F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#0F172A] inline-flex items-center gap-2">
          <TraitIcon
            traitId={activeTrait.id}
            className="w-4 h-4"
            style={{ color: activeTrait.accentHex }}
          />
          All Rankings ({people.length})
        </h2>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search
              className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter names..."
              aria-label="Filter names in leaderboard"
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <button
            type="button"
            onClick={onToggleSort}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F172A] bg-[#EBF2FA] border border-[#D9E4F2] rounded-lg hover:bg-[#DFEAFA] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Toggle highest vs lowest ranking"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-[#475569]" aria-hidden="true" />
            {sortDescending ? 'Highest First' : 'Lowest First'}
          </button>
        </div>
      </div>

      {people.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-[#0F172A]">No names in this house yet.</p>
          <p className="text-xs text-[#64748B] mt-1">
            Add a full name above or paste a list to start ranking.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EBF2FA]">
          {people.map((person, index) => {
            const detail = person.scores[activeTrait.id];
            const score = detail?.score ?? 0;
            const peerDelta = detail?.peerDelta ?? 0;
            const upVotes = detail?.upVotes ?? 0;
            const downVotes = detail?.downVotes ?? 0;
            const isSelected = person.id === selectedPersonId;
            const bestTrait = allTraits.find((t) => t.id === person.bestTraitId) ?? activeTrait;
            const insightKey = getTraitInsightKey(person);
            const insightText = traitInsights[insightKey];

            return (
              <div
                key={person.id}
                className={`flex items-center justify-between gap-2 sm:gap-3 px-4 py-3 transition-colors ${
                  isSelected ? 'bg-[#EBF2FA]/80' : 'hover:bg-[#F3F7FC]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectPerson(person.id)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded-md"
                >
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#64748B] w-7 shrink-0">
                    #{index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-sm font-semibold text-[#0F172A] truncate">
                        {person.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#475569] mt-0.5 truncate">
                      <span>{person.anatomy.syllableCount} syllables</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{detail?.verdict}</span>
                    </div>

                    {bestTrait && (
                      <div
                        className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] leading-snug max-w-full"
                        style={{
                          backgroundColor: `${bestTrait.accentHex}10`,
                          borderColor: `${bestTrait.accentHex}30`,
                        }}
                      >
                        <TraitIcon
                          traitId={bestTrait.id}
                          className="w-3 h-3 shrink-0"
                          style={{ color: bestTrait.accentHex }}
                        />
                        <span
                          className="font-semibold shrink-0"
                          style={{ color: bestTrait.accentHex }}
                        >
                          Trait Insight · {bestTrait.shortLabel}:
                        </span>
                        {insightText ? (
                          <span className="text-[#0F172A] truncate">{insightText}</span>
                        ) : loadingInsights ? (
                          <span className="inline-flex items-center gap-1 text-[#64748B]">
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            Reading...
                          </span>
                        ) : insightError ? (
                          <span className="text-[#B91C1C] truncate">{insightError}</span>
                        ) : (
                          <span className="text-[#64748B]">Waiting for insight...</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div
                    className="inline-flex items-center gap-0.5 bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg p-0.5"
                    role="group"
                    aria-label={`Peer votes for ${person.fullName}`}
                  >
                    <button
                      type="button"
                      onClick={() => onVotePerson(person.id, 'up')}
                      aria-label={`Agree with ${person.fullName} (+5)`}
                      title="Agree (+5)"
                      className="p-1.5 rounded-md text-[#475569] hover:text-[#2563EB] hover:bg-white transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span
                      className={`font-mono text-[11px] font-semibold tabular-nums min-w-[26px] text-center ${
                        peerDelta > 0
                          ? 'text-[#2563EB]'
                          : peerDelta < 0
                            ? 'text-[#DC2626]'
                            : 'text-[#64748B]'
                      }`}
                      title={`Peer opinion: ${peerDelta > 0 ? `+${peerDelta}` : peerDelta} (${upVotes} up, ${downVotes} down)`}
                    >
                      {peerDelta > 0 ? `+${peerDelta}` : peerDelta}
                    </span>
                    <button
                      type="button"
                      onClick={() => onVotePerson(person.id, 'down')}
                      aria-label={`Disagree with ${person.fullName} (-5)`}
                      title="Disagree (-5)"
                      className="p-1.5 rounded-md text-[#475569] hover:text-[#DC2626] hover:bg-white transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-2.5 w-32">
                    <div className="flex-1 h-1.5 bg-[#EBF2FA] rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          width: `${score}%`,
                          backgroundColor: activeTrait.accentHex,
                        }}
                      />
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#0F172A] w-7 text-right">
                      {score}
                    </span>
                  </div>

                  <span className="sm:hidden font-mono text-sm font-semibold tabular-nums text-[#0F172A] w-6 text-right">
                    {score}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemovePerson(person.id)}
                    aria-label={`Remove ${person.fullName}`}
                    className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#DC2626]/8 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
