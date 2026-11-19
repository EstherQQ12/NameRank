import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { BUILT_IN_TRAITS, evaluatePerson } from '../engine/nameAlgorithm';
import type { TraitDefinition } from '../types/ranking';
import { TraitIcon } from './TraitIcon';

interface AlgorithmGuideProps {
  allTraits: TraitDefinition[];
}

export function AlgorithmGuide({ allTraits }: AlgorithmGuideProps) {
  const [sandboxName, setSandboxName] = useState('');
  const preview = evaluatePerson(
    {
      id: 'sandbox-preview',
      fullName: sandboxName.trim() || 'Alex Mercer',
      addedAt: 0,
    },
    allTraits
  );

  return (
    <section aria-label="How the ranking works" className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF2FA] border border-[#D9E4F2] flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">How Scoring Works</h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Same full name always gets the exact same score and remark.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#EBF2FA]">
          <label
            htmlFor="algorithm-sandbox-input"
            className="block text-xs font-semibold text-[#0F172A] mb-2"
          >
            Quick Name Test
          </label>
          <input
            id="algorithm-sandbox-input"
            type="text"
            value={sandboxName}
            onChange={(e) => setSandboxName(e.target.value)}
            placeholder="Type any full name (e.g. Alex Mercer)..."
            className="w-full max-w-md px-3.5 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#EBF2FA]">
            <div>
              <p className="text-xs text-[#64748B]">Syllables</p>
              <p className="font-mono text-lg font-bold tabular-nums text-[#0F172A] mt-0.5">
                {preview.anatomy.syllableCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Clusters</p>
              <p className="font-mono text-lg font-bold tabular-nums text-[#0F172A] mt-0.5">
                {preview.anatomy.consonantClusters.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Doubles</p>
              <p className="font-mono text-lg font-bold tabular-nums text-[#0F172A] mt-0.5">
                {preview.anatomy.doubleLetters.length > 0
                  ? preview.anatomy.doubleLetters.join(', ')
                  : 'None'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Top Trait</p>
              <p className="text-sm font-semibold text-[#0F172A] mt-1 truncate">
                {preview.overallSignature}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUILT_IN_TRAITS.map((trait) => {
          const detail = preview.scores[trait.id];
          return (
            <div
              key={trait.id}
              className="bg-white/90 backdrop-blur-sm border border-[#D9E4F2] rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-[#0F172A] inline-flex items-center gap-2">
                    <TraitIcon
                      traitId={trait.id}
                      className="w-4 h-4"
                      style={{ color: trait.accentHex }}
                    />
                    {trait.name}
                  </h3>
                  <span
                    className="font-mono text-sm font-bold tabular-nums"
                    style={{ color: trait.accentHex }}
                  >
                    {detail?.score ?? 0}
                  </span>
                </div>
                <p className="text-xs text-[#475569]">{trait.subtitle}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#EBF2FA] text-xs text-[#64748B]">
                <strong className="font-medium text-[#0F172A]">{detail?.verdict}</strong> ·{' '}
                {detail?.summary}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
