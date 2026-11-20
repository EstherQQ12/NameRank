import {
  ArrowLeft,
  Check,
  Copy,
  Dices,
  Home,
  LayoutGrid,
  Plus,
  SlidersHorizontal,
  Swords,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmGuide } from './components/AlgorithmGuide';
import { BulkAddModal } from './components/BulkAddModal';
import { COLOR_SWATCHES, CustomTraitModal } from './components/CustomTraitModal';
import { HeadToHead } from './components/HeadToHead';
import { HousesDashboard } from './components/HousesDashboard';
import { LeaderboardTable } from './components/LeaderboardTable';
import { PersonInspector } from './components/PersonInspector';
import { Podium } from './components/Podium';
import { QuizArcade } from './components/QuizArcade';
import { TraitIcon } from './components/TraitIcon';
import { BUILT_IN_TRAITS, evaluatePerson } from './engine/nameAlgorithm';
import type {
  CustomTraitWeights,
  House,
  PersonInput,
  TraitDefinition,
  TraitId,
} from './types/ranking';

type ActiveView = 'dashboard' | 'house' | 'head-to-head' | 'quiz' | 'algorithm';

const STORAGE_HOUSES_KEY = 'namerank_houses_v3';
const STORAGE_CUSTOM_TRAITS_KEY = 'namerank_custom_traits_v3';

function loadInitialHouses(): House[] {
  try {
    const raw = localStorage.getItem(STORAGE_HOUSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage read errors
  }
  return [];
}

function loadInitialCustomTraits(): TraitDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_TRAITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage read errors
  }
  return [];
}

export default function App() {
  const [view, setView] = useState<ActiveView>('dashboard');
  const [houses, setHouses] = useState<House[]>(loadInitialHouses);
  const [activeHouseId, setActiveHouseId] = useState<string | null>(
    () => loadInitialHouses()[0]?.id ?? null
  );
  const [customTraits, setCustomTraits] = useState<TraitDefinition[]>(loadInitialCustomTraits);
  const [activeTraitId, setActiveTraitId] = useState<TraitId>('stinkiness');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [inputFeedback, setInputFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortDescending, setSortDescending] = useState(true);
  const [copiedRanking, setCopiedRanking] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCustomTraitOpen, setIsCustomTraitOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HOUSES_KEY, JSON.stringify(houses));
    } catch {
      // ignore storage write errors
    }
  }, [houses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_TRAITS_KEY, JSON.stringify(customTraits));
    } catch {
      // ignore storage write errors
    }
  }, [customTraits]);

  const allTraits = useMemo(
    () => [...BUILT_IN_TRAITS, ...customTraits],
    [customTraits]
  );

  const activeTrait = useMemo(
    () => allTraits.find((t) => t.id === activeTraitId) ?? allTraits[0],
    [allTraits, activeTraitId]
  );

  const activeHouse = useMemo(
    () => houses.find((h) => h.id === activeHouseId) ?? houses[0] ?? null,
    [houses, activeHouseId]
  );

  const activeHousePeople = activeHouse?.people ?? [];

  const evaluatedPeople = useMemo(
    () => activeHousePeople.map((p) => evaluatePerson(p, allTraits)),
    [activeHousePeople, allTraits]
  );

  const allEvaluatedAcrossHouses = useMemo(() => {
    const seen = new Set<string>();
    const combined: PersonInput[] = [];
    const source = activeHouse ? activeHouse.people : houses.flatMap((h) => h.people);
    for (const p of source) {
      const key = p.fullName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(p);
      }
    }
    return combined.map((p) => evaluatePerson(p, allTraits));
  }, [activeHouse, houses, allTraits]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = evaluatedPeople.filter((person) => {
      if (q && !person.fullName.toLowerCase().includes(q)) return false;
      return true;
    });

    return list.sort((a, b) => {
      const scoreA = a.scores[activeTrait.id]?.score ?? 0;
      const scoreB = b.scores[activeTrait.id]?.score ?? 0;
      if (scoreA !== scoreB) {
        return sortDescending ? scoreB - scoreA : scoreA - scoreB;
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [evaluatedPeople, searchQuery, activeTrait.id, sortDescending]);

  const inspectedPerson = useMemo(() => {
    if (selectedPersonId) {
      const match = evaluatedPeople.find((p) => p.id === selectedPersonId);
      if (match) return match;
    }
    return filteredAndSorted[0] ?? evaluatedPeople[0] ?? null;
  }, [selectedPersonId, evaluatedPeople, filteredAndSorted]);

  const handleCreateHouse = (name: string) => {
    const id = `house-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newHouse: House = {
      id,
      name,
      createdAt: Date.now(),
      people: [],
    };
    setHouses((prev) => [newHouse, ...prev]);
    setActiveHouseId(id);
    setSelectedPersonId(null);
    setSearchQuery('');
    setInputFeedback(null);
    setView('house');
  };

  const handleOpenHouse = (houseId: string) => {
    setActiveHouseId(houseId);
    setSelectedPersonId(null);
    setSearchQuery('');
    setInputFeedback(null);
    setView('house');
  };

  const handleDeleteHouse = (houseId: string) => {
    setHouses((prev) => prev.filter((h) => h.id !== houseId));
    if (activeHouseId === houseId) {
      setActiveHouseId(null);
      setSelectedPersonId(null);
      if (view === 'house') setView('dashboard');
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouse) return;

    const cleaned = newName.trim().replace(/\s+/g, ' ');
    if (!cleaned) return;

    const alreadyExists = activeHouse.people.some(
      (p) => p.fullName.toLowerCase() === cleaned.toLowerCase()
    );
    if (alreadyExists) {
      setInputFeedback(`${cleaned} is already in ${activeHouse.name}.`);
      return;
    }

    const id = `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: PersonInput = {
      id,
      fullName: cleaned,
      addedAt: Date.now(),
    };

    setHouses((prev) =>
      prev.map((h) =>
        h.id === activeHouse.id ? { ...h, people: [entry, ...h.people] } : h
      )
    );
    setSelectedPersonId(id);
    setNewName('');
    setInputFeedback(null);
    nameInputRef.current?.focus();
  };

  const handleBulkAdd = (names: string[]) => {
    if (!activeHouse) return;

    const existingLower = new Set(
      activeHouse.people.map((p) => p.fullName.toLowerCase())
    );
    const added: PersonInput[] = [];

    for (const raw of names) {
      const cleaned = raw.trim().replace(/\s+/g, ' ');
      if (!cleaned || existingLower.has(cleaned.toLowerCase())) continue;
      existingLower.add(cleaned.toLowerCase());
      added.push({
        id: `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fullName: cleaned,
        addedAt: Date.now(),
      });
    }

    if (added.length > 0) {
      setHouses((prev) =>
        prev.map((h) =>
          h.id === activeHouse.id ? { ...h, people: [...added, ...h.people] } : h
        )
      );
      setSelectedPersonId(added[0].id);
      setInputFeedback(null);
    }
  };

  const handleRemovePerson = (personId: string) => {
    if (!activeHouse) return;
    setHouses((prev) =>
      prev.map((h) =>
        h.id === activeHouse.id
          ? { ...h, people: h.people.filter((p) => p.id !== personId) }
          : h
      )
    );
    if (selectedPersonId === personId) {
      setSelectedPersonId(null);
    }
  };

  const handleClearHouse = () => {
    if (!activeHouse) return;
    setHouses((prev) =>
      prev.map((h) => (h.id === activeHouse.id ? { ...h, people: [] } : h))
    );
    setSelectedPersonId(null);
  };

  const handleVotePerson = (personId: string, direction: 'up' | 'down') => {
    if (!activeHouse) return;
    const traitId = activeTrait.id;
    setHouses((prev) =>
      prev.map((h) => {
        if (h.id !== activeHouse.id) return h;
        return {
          ...h,
          people: h.people.map((p) => {
            if (p.id !== personId) return p;
            const current = p.peerVotes?.[traitId] ?? { up: 0, down: 0 };
            const nextTally =
              direction === 'up'
                ? { up: current.up + 1, down: current.down }
                : { up: current.up, down: current.down + 1 };
            return {
              ...p,
              peerVotes: {
                ...(p.peerVotes ?? {}),
                [traitId]: nextTally,
              },
            };
          }),
        };
      })
    );
  };

  const handleResetPersonVotes = (personId: string) => {
    if (!activeHouse) return;
    const traitId = activeTrait.id;
    setHouses((prev) =>
      prev.map((h) => {
        if (h.id !== activeHouse.id) return h;
        return {
          ...h,
          people: h.people.map((p) => {
            if (p.id !== personId || !p.peerVotes) return p;
            const nextVotes = { ...p.peerVotes };
            delete nextVotes[traitId];
            return { ...p, peerVotes: nextVotes };
          }),
        };
      })
    );
  };

  const handleCreateCustomTrait = (
    name: string,
    subtitle: string,
    weights: CustomTraitWeights
  ) => {
    const id: TraitId = `custom_${Date.now()}`;
    const accentHex = COLOR_SWATCHES[customTraits.length % COLOR_SWATCHES.length];
    const trait: TraitDefinition = {
      id,
      name,
      shortLabel: name,
      subtitle,
      accentHex,
      isCustom: true,
      weights,
    };
    setCustomTraits((prev) => [...prev, trait]);
    setActiveTraitId(id);
    if (view === 'dashboard' && activeHouse) {
      setView('house');
    }
  };

  const handleDeleteCustomTrait = (id: TraitId) => {
    setCustomTraits((prev) => prev.filter((t) => t.id !== id));
    if (activeTraitId === id) {
      setActiveTraitId('stinkiness');
    }
  };

  const handleCopyLeaderboard = async () => {
    if (filteredAndSorted.length === 0 || !activeHouse) return;
    const header = `${activeHouse.name} · ${activeTrait.name} (${sortDescending ? 'Highest' : 'Lowest'} First)`;
    const lines = filteredAndSorted.map((p, idx) => {
      const detail = p.scores[activeTrait.id];
      const peerTag =
        detail && detail.peerDelta !== 0
          ? `, peer ${detail.peerDelta > 0 ? `+${detail.peerDelta}` : detail.peerDelta}`
          : '';
      return `${idx + 1}. ${p.fullName} — ${detail?.score ?? 0}/100 (${detail?.verdict ?? ''}${peerTag})`;
    });
    const payload = `${header}\n${lines.join('\n')}`;

    try {
      await navigator.clipboard.writeText(payload);
      setCopiedRanking(true);
      setTimeout(() => setCopiedRanking(false), 2000);
    } catch {
      // clipboard fallback ignored cleanly
    }
  };

  return (
    <div className="relative min-h-screen text-[#0F172A] flex flex-col overflow-x-hidden">
      {/* Soft fading cool-blue ambient backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="ambient-orb-a absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(147, 197, 253, 0.52) 0%, rgba(191, 219, 254, 0.18) 55%, rgba(238, 245, 253, 0) 75%)',
          }}
        />
        <div
          className="ambient-orb-b absolute top-1/3 -right-32 w-[620px] h-[620px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(125, 211, 252, 0.45) 0%, rgba(165, 243, 252, 0.18) 50%, rgba(238, 245, 253, 0) 75%)',
          }}
        />
        <div
          className="ambient-orb-a absolute -bottom-40 left-1/4 w-[520px] h-[520px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(165, 180, 252, 0.34) 0%, rgba(199, 210, 254, 0.12) 55%, rgba(238, 245, 253, 0) 75%)',
          }}
        />
      </div>

      <header className="bg-white/85 backdrop-blur-md border-b border-[#D9E4F2] sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setView('dashboard');
            }}
            className="font-display text-xl font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
          >
            NameRank
          </a>

          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium"
            aria-label="Primary navigation"
          >
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className={`py-1 border-b-2 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'dashboard'
                  ? 'border-[#2563EB] text-[#0F172A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              Dashboard
            </button>
            {activeHouse && (
              <button
                type="button"
                onClick={() => setView('house')}
                className={`py-1 border-b-2 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[180px] ${
                  view === 'house'
                    ? 'border-[#2563EB] text-[#0F172A]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{activeHouse.name}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setView('head-to-head')}
              className={`py-1 border-b-2 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'head-to-head'
                  ? 'border-[#2563EB] text-[#0F172A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" aria-hidden="true" />
              Compare
            </button>
            <button
              type="button"
              onClick={() => setView('quiz')}
              className={`py-1 border-b-2 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'quiz'
                  ? 'border-[#2563EB] text-[#0F172A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Dices className="w-3.5 h-3.5" aria-hidden="true" />
              Random Quiz
            </button>
            <button
              type="button"
              onClick={() => setView('algorithm')}
              className={`py-1 border-b-2 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'algorithm'
                  ? 'border-[#2563EB] text-[#0F172A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              How It Works
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCustomTraitOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New Trait
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-7 space-y-6">
        <div className="md:hidden flex items-center gap-1 p-1 bg-[#EBF2FA]/90 backdrop-blur-sm rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'dashboard' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            Dashboard
          </button>
          {activeHouse && (
            <button
              type="button"
              onClick={() => setView('house')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'house' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
              }`}
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              {activeHouse.name}
            </button>
          )}
          <button
            type="button"
            onClick={() => setView('head-to-head')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'head-to-head' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" aria-hidden="true" />
            Compare
          </button>
          <button
            type="button"
            onClick={() => setView('quiz')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'quiz' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
            }`}
          >
            <Dices className="w-3.5 h-3.5" aria-hidden="true" />
            Random Quiz
          </button>
          <button
            type="button"
            onClick={() => setView('algorithm')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'algorithm' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            How It Works
          </button>
        </div>

        {view === 'dashboard' && (
          <HousesDashboard
            houses={houses}
            allTraits={allTraits}
            onCreateHouse={handleCreateHouse}
            onOpenHouse={handleOpenHouse}
            onDeleteHouse={handleDeleteHouse}
            onOpenQuiz={() => setView('quiz')}
          />
        )}

        {view === 'house' && activeHouse && (
          <>
            <section
              aria-label="House header and add person"
              className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setView('dashboard')}
                    aria-label="Back to Houses"
                    className="w-9 h-9 rounded-lg bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] flex items-center justify-center text-[#0F172A] transition-colors shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] truncate">
                      {activeHouse.name}
                    </h1>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs text-[#64748B] shrink-0">
                  <Users className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                  <span className="font-mono tabular-nums font-semibold text-[#0F172A]">
                    {activeHouse.people.length}
                  </span>
                  <span>ranked</span>
                </div>
              </div>

              <form onSubmit={handleAddPerson} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (inputFeedback) setInputFeedback(null);
                  }}
                  placeholder="Enter full name..."
                  aria-label="Full name"
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
                />

                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2.5 text-sm font-medium text-[#0F172A] bg-[#EBF2FA] hover:bg-[#DFEAFA] border border-[#D9E4F2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Paste List
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Rank Name
                </button>
              </form>

              {inputFeedback && (
                <p className="text-xs text-[#2563EB] mt-2 font-medium" role="status">
                  {inputFeedback}
                </p>
              )}
            </section>

            <section aria-label="Ranking category selector" className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {allTraits.map((trait) => {
                    const isActive = trait.id === activeTrait.id;
                    return (
                      <div key={trait.id} className="inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => setActiveTraitId(trait.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-[#0F172A] text-white border-[#0F172A]'
                              : 'bg-white/90 text-[#475569] border-[#D9E4F2] hover:text-[#0F172A] hover:border-[#B9CCE6]'
                          }`}
                        >
                          <TraitIcon
                            traitId={trait.id}
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: isActive ? '#FFFFFF' : trait.accentHex }}
                          />
                          {trait.name}
                        </button>
                        {trait.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomTrait(trait.id)}
                            aria-label={`Delete custom trait ${trait.name}`}
                            className="ml-0.5 p-1.5 text-[#64748B] hover:text-[#DC2626] rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setIsCustomTraitOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#2563EB] bg-white/90 border border-dashed border-[#2563EB]/45 hover:border-[#2563EB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    New Trait
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLeaderboard}
                    disabled={filteredAndSorted.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F172A] bg-white/90 border border-[#D9E4F2] hover:bg-[#EBF2FA] disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedRanking ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#14B8A6]" aria-hidden="true" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#475569]" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </button>

                  {activeHouse.people.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHouse}
                      className="px-3 py-2 text-xs font-medium text-[#64748B] hover:text-[#DC2626] bg-white/90 border border-[#D9E4F2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <Podium
                  rankedPeople={filteredAndSorted}
                  activeTrait={activeTrait}
                  selectedPersonId={inspectedPerson?.id ?? null}
                  onSelectPerson={(id) => setSelectedPersonId(id)}
                  sortDescending={sortDescending}
                />

                <LeaderboardTable
                  people={filteredAndSorted}
                  activeTrait={activeTrait}
                  selectedPersonId={inspectedPerson?.id ?? null}
                  onSelectPerson={(id) => setSelectedPersonId(id)}
                  onRemovePerson={handleRemovePerson}
                  onVotePerson={handleVotePerson}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortDescending={sortDescending}
                  onToggleSort={() => setSortDescending((prev) => !prev)}
                />
              </div>

              <div className="lg:col-span-4">
                <PersonInspector
                  person={inspectedPerson}
                  activeTrait={activeTrait}
                  allTraits={allTraits}
                  onSelectTrait={(traitId) => setActiveTraitId(traitId)}
                  onVotePerson={handleVotePerson}
                  onResetVotes={handleResetPersonVotes}
                />
              </div>
            </div>
          </>
        )}

        {view === 'head-to-head' && (
          <HeadToHead people={allEvaluatedAcrossHouses} allTraits={allTraits} />
        )}

        {view === 'quiz' && <QuizArcade />}

        {view === 'algorithm' && <AlgorithmGuide allTraits={allTraits} />}
      </main>

      <footer className="border-t border-[#D9E4F2] bg-white/80 backdrop-blur-sm mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
          <span>NameRank</span>
          <span>Saved locally in your browser</span>
        </div>
      </footer>

      <BulkAddModal
        isOpen={isBulkModalOpen}
        houseName={activeHouse?.name}
        onClose={() => setIsBulkModalOpen(false)}
        onAddBatch={handleBulkAdd}
      />

      <CustomTraitModal
        isOpen={isCustomTraitOpen}
        onClose={() => setIsCustomTraitOpen(false)}
        onCreateTrait={handleCreateCustomTrait}
      />
    </div>
  );
}
