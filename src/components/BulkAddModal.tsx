import { X } from 'lucide-react';
import { useState } from 'react';

interface BulkAddModalProps {
  isOpen: boolean;
  houseName?: string;
  onClose: () => void;
  onAddBatch: (names: string[]) => void;
}

export function BulkAddModal({ isOpen, houseName, onClose, onAddBatch }: BulkAddModalProps) {
  const [rawText, setRawText] = useState('');

  if (!isOpen) return null;

  const parsedNames = rawText
    .split(/[\n,]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedNames.length === 0) return;
    onAddBatch(parsedNames);
    setRawText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-add-title"
    >
      <div className="bg-white border border-[#D9E4F2] rounded-xl max-w-lg w-full p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="bulk-add-title" className="text-lg font-bold text-[#0F172A]">
              Paste Names{houseName ? ` into ${houseName}` : ''}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter one full name per line or separate with commas.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bulk-textarea" className="block text-xs font-medium text-[#0F172A] mb-1">
              Full Names
            </label>
            <textarea
              id="bulk-textarea"
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'Jordan Patel\nUncle Gary Pickles\nChloe Van Der Berg\nSamir Gupta'}
              className="w-full px-3 py-2.5 text-sm bg-[#F3F7FC] border border-[#D9E4F2] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#EBF2FA]">
            <span className="text-xs text-[#64748B] tabular-nums">
              {parsedNames.length} {parsedNames.length === 1 ? 'person' : 'people'} ready
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#475569] hover:text-[#0F172A] rounded-lg hover:bg-[#EBF2FA] cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={parsedNames.length === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Rank {parsedNames.length > 0 ? parsedNames.length : ''} Names
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
