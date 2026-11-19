import { ArrowLeftRight, Swords } from 'lucide-react';
import { useState } from 'react';
import { evaluatePerson } from '../engine/nameAlgorithm';
import type { EvaluatedPerson, TraitDefinition } from '../types/ranking';
import { RadarChart } from './RadarChart';
import { TraitIcon } from './TraitIcon';

interface HeadToHeadProps {
  people: EvaluatedPerson[];
  allTraits: TraitDefinition[];
}

export function HeadToHead({ people, allTraits }: HeadToHeadProps) {
  const [leftId, setLeftId] = useState<string>(people[0]?.id ?? '__custom__');
  const [rightId, setRightId] = useState<string>(people[1]?.id ?? '__custom__');
  const [customLeftName, setCustomLeftName] = useState('');
  const [customRightName, setCustomRightName] = useState('');

  const resolveContender = (
    selectedId: string,
    fallbackName: string,
    defaultPlaceholder: string
  ): EvaluatedPerson => {
    const found = people.find((p) => p.id === selectedId);
    if (found) return found;
    return evaluatePerson(
      {
        id: `temp-${fallbackName || defaultPlaceholder}`,
        fullName: fallbackName.trim() || defaultPlaceholder,
        addedAt: Date.now(),
      },
      allTraits
    );
  };

  const leftPerson = resolveContender(leftId, customLeftName, 'Person A');
  const rightPerson = resolveContender(rightId, customRightName, 'Person B');

  let leftWins = 0;
  let rightWins = 0;
  for (const trait of allTraits) {
    const l = leftPerson.scores[trait.id]?.score ?? 0;
    const r = rightPerson.scores[trait.id]?.score ?? 0;
    if (l > r) leftWins++;
    else if (r > l) rightWins++;
  }

  const swapContenders = () => {
    setLeftId(rightId);
    setRightId(leftId);
    setCustomLeftName(customRightName);
    setCustomRightName(customLeftName);
  };

  return (
    <section aria-label="Head-to-head name comparison" className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="left-contender"
              className="block text-xs font-semibold text-[#2563EB] mb-1.5"
            >
              Person A
            </label>
            <select
              id="left-contender"
              value={people.some((p) => p.id === leftId) ? leftId : '__custom__'}
              onChange={(e) => setLeftId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
              <option value="__custom__">Type a custom name...</option>
            </select>
            {!people.some((p) => p.id === leftId) && (
              <input
                type="text"
                value={customLeftName}
                onChange={(e) => setCustomLeftName(e.target.value)}
                placeholder="Type first full name..."
                className="mt-2 w-full px-3 py-2 text-sm bg-white border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
            )}
          </div>

          <button
            type="button"
            onClick={swapContenders}
            aria-label="Swap people"
            className="self-center md:self-end px-3 py-2.5 bg-[#EBF2FA] hover:bg-[#DFEAFA] text-[#0F172A] rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#475569]" aria-hidden="true" />
            Swap
          </button>

          <div className="flex-1 min-w-0">
            <label
              htmlFor="right-contender"
              className="block text-xs font-semibold text-[#0EA5E9] mb-1.5"
            >
              Person B
            </label>
            <select
              id="right-contender"
              value={people.some((p) => p.id === rightId) ? rightId : '__custom__'}
              onChange={(e) => setRightId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0EA5E9]"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
              <option value="__custom__">Type a custom name...</option>
            </select>
            {!people.some((p) => p.id === rightId) && (
              <input
                type="text"
                value={customRightName}
                onChange={(e) => setCustomRightName(e.target.value)}
                placeholder="Type second full name..."
                className="mt-2 w-full px-3 py-2 text-sm bg-white border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5 space-y-4">
          <div className="text-center border-b border-[#EBF2FA] pb-4">
            <div className="w-9 h-9 rounded-lg bg-[#EBF2FA] flex items-center justify-center mx-auto mb-2">
              <Swords className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              {leftWins === rightWins
                ? 'Dead Even Tie'
                : leftWins > rightWins
                  ? `${leftPerson.fullName} leads`
                  : `${rightPerson.fullName} leads`}
            </h3>
            <p className="text-xs font-mono tabular-nums text-[#475569] mt-1">
              {leftWins} won · {rightWins} won
            </p>
          </div>

          <RadarChart
            primary={leftPerson}
            secondary={rightPerson}
            traits={allTraits}
            primaryColor="#2563EB"
            secondaryColor="#0EA5E9"
          />

          <div className="flex items-center justify-center gap-6 text-xs text-[#475569] pt-1">
            <span className="inline-flex items-center gap-2 font-medium text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" aria-hidden="true" />
              {leftPerson.anatomy.words[0]}
            </span>
            <span className="inline-flex items-center gap-2 font-medium text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0EA5E9]" aria-hidden="true" />
              {rightPerson.anatomy.words[0]}
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl divide-y divide-[#EBF2FA]">
          {allTraits.map((trait) => {
            const leftScore = leftPerson.scores[trait.id]?.score ?? 0;
            const rightScore = rightPerson.scores[trait.id]?.score ?? 0;
            const diff = Math.abs(leftScore - rightScore);
            const winner =
              leftScore === rightScore
                ? 'Tie'
                : leftScore > rightScore
                  ? `${leftPerson.anatomy.words[0]} +${diff}`
                  : `${rightPerson.anatomy.words[0]} +${diff}`;

            return (
              <div key={trait.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <TraitIcon
                      traitId={trait.id}
                      className="w-3.5 h-3.5"
                      style={{ color: trait.accentHex }}
                    />
                    {trait.name}
                  </span>
                  <span className="font-mono text-[#64748B] tabular-nums">{winner}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#2563EB] w-6">
                      {leftScore}
                    </span>
                    <div className="flex-1 h-2 bg-[#EBF2FA] rounded-sm overflow-hidden flex justify-end">
                      <div
                        className="h-full bg-[#2563EB] rounded-sm transition-all duration-300"
                        style={{ width: `${leftScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#EBF2FA] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#0EA5E9] rounded-sm transition-all duration-300"
                        style={{ width: `${rightScore}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#0EA5E9] w-6 text-right">
                      {rightScore}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
