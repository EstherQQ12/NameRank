import { ArrowRight, Brain, Dices, Home, Plus, Trash2, Users, Wind } from 'lucide-react';
import { useState } from 'react';
import { evaluatePerson } from '../engine/nameAlgorithm';
import type { House, TraitDefinition } from '../types/ranking';

interface HousesDashboardProps {
  houses: House[];
  allTraits: TraitDefinition[];
  onCreateHouse: (name: string) => void;
  onOpenHouse: (houseId: string) => void;
  onDeleteHouse: (houseId: string) => void;
  onOpenQuiz: () => void;
}

export function HousesDashboard({
  houses,
  allTraits,
  onCreateHouse,
  onOpenHouse,
  onDeleteHouse,
  onOpenQuiz,
}: HousesDashboardProps) {
  const [houseName, setHouseName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = houseName.trim().replace(/\s+/g, ' ');
    if (!cleaned) return;

    const duplicate = houses.some(
      (h) => h.name.toLowerCase() === cleaned.toLowerCase()
    );
    if (duplicate) {
      setFeedback(`"${cleaned}" already exists.`);
      return;
    }

    onCreateHouse(cleaned);
    setHouseName('');
    setFeedback(null);
  };

  return (
    <div className="space-y-6">
      <section
        aria-label="Create a new house"
        className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2FA] border border-[#D9E4F2] flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                Houses
              </h1>
              <p className="text-xs text-[#64748B]">
                Create a house and rank any group of names.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenQuiz}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2563EB] bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Dices className="w-4 h-4" aria-hidden="true" />
            Take a Random Quiz
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <input
            type="text"
            value={houseName}
            onChange={(e) => {
              setHouseName(e.target.value);
              if (feedback) setFeedback(null);
            }}
            placeholder="House name (e.g. Room 302, The Smiths)..."
            aria-label="New house name"
            maxLength={48}
            className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create House
          </button>
        </form>

        {feedback && (
          <p className="text-xs text-[#2563EB] font-medium mt-2" role="status">
            {feedback}
          </p>
        )}
      </section>

      <section aria-label="Your houses">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
            Your Houses ({houses.length})
          </h2>
        </div>

        {houses.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-10 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#EBF2FA] border border-[#D9E4F2] flex items-center justify-center mx-auto mb-3">
              <Home className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">No houses yet</p>
            <p className="text-xs text-[#64748B] mt-1">
              Type a name above to create your first board.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((house) => {
              const evaluated = house.people.map((p) => evaluatePerson(p, allTraits));
              const topStinky = [...evaluated].sort(
                (a, b) => (b.scores.stinkiness?.score ?? 0) - (a.scores.stinkiness?.score ?? 0)
              )[0];
              const topSmart = [...evaluated].sort(
                (a, b) => (b.scores.smartness?.score ?? 0) - (a.scores.smartness?.score ?? 0)
              )[0];

              return (
                <article
                  key={house.id}
                  className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] hover:border-[#B9CCE6] rounded-xl p-5 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EBF2FA] flex items-center justify-center shrink-0">
                          <Home className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-[#0F172A] truncate">
                            {house.name}
                          </h3>
                          <p className="text-xs text-[#64748B] tabular-nums">
                            {house.people.length}{' '}
                            {house.people.length === 1 ? 'person' : 'people'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteHouse(house.id)}
                        aria-label={`Delete house ${house.name}`}
                        className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#DC2626]/8 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EBF2FA] space-y-2 text-xs">
                      {house.people.length === 0 ? (
                        <p className="text-[#64748B]">Empty · open to add names</p>
                      ) : (
                        <>
                          {topStinky && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-[#475569] truncate">
                                <Wind className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" aria-hidden="true" />
                                <strong className="font-medium text-[#0F172A] truncate">
                                  {topStinky.fullName}
                                </strong>
                              </span>
                              <span className="font-mono font-semibold tabular-nums text-[#14B8A6] shrink-0">
                                {topStinky.scores.stinkiness?.score ?? 0}
                              </span>
                            </div>
                          )}
                          {topSmart && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-[#475569] truncate">
                                <Brain className="w-3.5 h-3.5 text-[#2563EB] shrink-0" aria-hidden="true" />
                                <strong className="font-medium text-[#0F172A] truncate">
                                  {topSmart.fullName}
                                </strong>
                              </span>
                              <span className="font-mono font-semibold tabular-nums text-[#2563EB] shrink-0">
                                {topSmart.scores.smartness?.score ?? 0}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EBF2FA]">
                    <button
                      type="button"
                      onClick={() => onOpenHouse(house.id)}
                      className="w-full inline-flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Open House</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
