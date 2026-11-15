import { ExternalLink } from 'lucide-react';
import type { AdSlot } from '../types';

interface AdSlotBannerProps {
  slot: AdSlot | undefined;
  onTrackClick: (slotId: string) => void;
  compact?: boolean;
}

export function AdSlotBanner({ slot, onTrackClick, compact = false }: AdSlotBannerProps) {
  if (!slot || !slot.enabled) {
    return null;
  }

  const hasCustomScript = slot.htmlCode.trim().length > 0;

  return (
    <aside
      aria-label={`Sponsored ad placement: ${slot.label}`}
      className={`rounded-xl border border-slate-800 bg-[#121824] ${
        compact ? 'p-4' : 'px-5 py-4'
      }`}
    >
      <div className="flex items-center justify-between gap-4 text-xs text-slate-400 mb-2">
        <span>
          Sponsored <span aria-hidden="true">·</span> {slot.network}
        </span>
        <span className="font-mono tabular-nums text-[11px] text-slate-500">
          {slot.impressions.toLocaleString()} views · {slot.clicks.toLocaleString()} clicks
        </span>
      </div>

      {hasCustomScript ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-[#0B0F17] p-3 text-xs text-slate-300">
          <div className="font-medium text-slate-200 mb-1">
            Active Custom Ad Script ({slot.network})
          </div>
          <p className="text-slate-400 font-mono break-all line-clamp-2">
            {slot.htmlCode.trim()}
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white font-sans truncate">
              {slot.sponsorTitle}
            </h3>
            <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">
              {slot.sponsorDescription}
            </p>
          </div>
          <a
            href={slot.sponsorUrl || 'https://blogger.com'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick(slot.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium whitespace-nowrap shrink-0 transition-colors border border-slate-700"
          >
            <span>{slot.sponsorCta || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </aside>
  );
}
