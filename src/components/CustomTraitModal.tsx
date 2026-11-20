import { X } from 'lucide-react';
import { useState } from 'react';
import type { CustomTraitWeights } from '../types/ranking';

interface CustomTraitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrait: (name: string, subtitle: string, weights: CustomTraitWeights) => void;
}

const PRESET_IDEAS = [
  { name: 'Susness', subtitle: 'Sneaky letters and mysterious name energy.' },
  { name: 'Cooking Skill', subtitle: 'Warm vowels mixed with crisp letter crunch.' },
  { name: 'Text-Back Speed', subtitle: 'Fast snappy letters vs dreamy slow syllables.' },
];

const COLOR_SWATCHES = ['#2563EB', '#0EA5E9', '#6366F1', '#14B8A6', '#4F46E5'];

export function CustomTraitModal({ isOpen, onClose, onCreateTrait }: CustomTraitModalProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [weights, setWeights] = useState<CustomTraitWeights>({
    crunch: 50,
    flow: 50,
    heft: 50,
    chaos: 50,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreateTrait(
      trimmed,
      subtitle.trim() || `Custom score tuned by you for ${trimmed}.`,
      weights
    );
    setName('');
    setSubtitle('');
    setWeights({ crunch: 50, flow: 50, heft: 50, chaos: 50 });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-trait-title"
    >
      <div className="bg-white border border-[#D9E4F2] rounded-xl max-w-lg w-full p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="custom-trait-title" className="text-lg font-bold text-[#0F172A]">
              Create Custom Ranking Trait
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Make up any custom category and adjust how names are scored.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#EBF2FA] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-medium text-[#64748B] mb-1.5">Quick ideas:</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_IDEAS.map((idea) => (
              <button
                key={idea.name}
                type="button"
                onClick={() => {
                  setName(idea.name);
                  setSubtitle(idea.subtitle);
                }}
                className="px-2.5 py-1 text-xs font-medium bg-[#F3F7FC] border border-[#D9E4F2] rounded-md text-[#0F172A] hover:bg-[#EBF2FA] cursor-pointer whitespace-nowrap"
              >
                {idea.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="trait-name-input" className="block text-xs font-medium text-[#0F172A] mb-1">
              Trait Name
            </label>
            <input
              id="trait-name-input"
              type="text"
              required
              maxLength={28}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Susness, Drama Level, Luck..."
              className="w-full px-3 py-2 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label htmlFor="trait-desc-input" className="block text-xs font-medium text-[#0F172A] mb-1">
              Short Description (optional)
            </label>
            <input
              id="trait-desc-input"
              type="text"
              maxLength={80}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="What gets someone #1 here?"
              className="w-full px-3 py-2 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="pt-2 border-t border-[#EBF2FA] space-y-3">
            <p className="text-xs font-semibold text-[#0F172A]">Score Weights</p>
            {(
              [
                ['crunch', 'Letter Crunch', 'Clusters & double letters'],
                ['flow', 'Smooth Flow', 'Open vowels & matching initials'],
                ['heft', 'Name Size', 'Total length & syllables'],
                ['chaos', 'Wild Letters', 'Rare letters & variety'],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#0F172A]">
                    {label} <span className="font-normal text-[#64748B]">· {hint}</span>
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-[#0F172A]">
                    {weights[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) =>
                    setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBF2FA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] rounded-lg hover:bg-[#EBF2FA] cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Add Trait to Leaderboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { COLOR_SWATCHES };
