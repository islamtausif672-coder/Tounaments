import { Code2, ShieldCheck, Swords, Trophy, Wallet } from 'lucide-react';
import type { UserAccount } from '../types';

export type AppView = 'tournaments' | 'matches' | 'wallet' | 'blogger' | 'admin';

interface TopNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  activeAccount: UserAccount | null;
  onOpenAccountModal: () => void;
}

const NAV_ITEMS: { id: AppView; label: string; mobileLabel: string; icon: typeof Trophy }[] = [
  { id: 'tournaments', label: 'Tournaments', mobileLabel: 'Arena', icon: Trophy },
  { id: 'matches', label: 'My Matches', mobileLabel: 'Matches', icon: Swords },
  { id: 'wallet', label: 'Wallet', mobileLabel: 'Wallet', icon: Wallet },
  { id: 'blogger', label: 'Blogger HTML', mobileLabel: 'Blogger', icon: Code2 },
  { id: 'admin', label: 'Admin', mobileLabel: 'Admin', icon: ShieldCheck },
];

export function TopNav({
  activeView,
  onSelectView,
  activeAccount,
  onOpenAccountModal,
}: TopNavProps) {
  return (
    <>
      <header className="sticky top-0 z-30 h-[52px] md:h-16 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (single text element) */}
          <button
            type="button"
            onClick={() => onSelectView('tournaments')}
            className="font-display text-2xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-orange-400 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 rounded"
          >
            BooyahArena
          </button>

          {/* Zone 2: Primary Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 rounded ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenAccountModal}
              className="px-3.5 py-2 min-h-[40px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            >
              {activeAccount
                ? `${activeAccount.accountCode} · ${activeAccount.coins} Coins`
                : 'Select Account'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Thumb Navigation Bar (56px height -> total mobile sticky <= 12.8%) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#0E131D]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] px-1 transition-colors ${
                isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-medium mt-0.5 whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
