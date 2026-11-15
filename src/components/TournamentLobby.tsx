import { useState } from 'react';
import { Search, Shield, Trophy, Users, X } from 'lucide-react';
import type { AdSlot, Tournament, TournamentMode, UserAccount } from '../types';
import { ADMIN_WHATSAPP_NUMBER, canJoinTournament, formatSlotPercent } from '../utils/tournamentLogic';
import { AdSlotBanner } from './AdSlotBanner';

const BANNER_IMAGES: Record<Tournament['bannerKey'], string> = {
  hero: '/src/assets/images/hero_tactical_arena_1794760596852.jpg',
  bermuda: '/src/assets/images/map_bermuda_clash_1794760595958.jpg',
  kalahari: '/src/assets/images/map_kalahari_outpost_1794760596068.jpg',
};

interface TournamentLobbyProps {
  tournaments: Tournament[];
  accounts: UserAccount[];
  activeAccount: UserAccount | null;
  topAd: AdSlot | undefined;
  feedAd: AdSlot | undefined;
  onTrackAdClick: (slotId: string) => void;
  onJoinTournament: (tournamentId: string, squadName?: string) => Promise<void>;
  onGoToWallet: () => void;
  onOpenAccountModal: () => void;
}

export function TournamentLobby({
  tournaments,
  accounts,
  activeAccount,
  topAd,
  feedAd,
  onTrackAdClick,
  onJoinTournament,
  onGoToWallet,
  onOpenAccountModal,
}: TournamentLobbyProps) {
  const [modeFilter, setModeFilter] = useState<'All' | TournamentMode>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'live' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [squadName, setSquadName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const featured = tournaments.find((t) => t.status === 'open') || tournaments[0] || null;
  const totalPrizePool = tournaments.reduce((sum, t) => sum + t.prizePool, 0);
  const openCount = tournaments.filter((t) => t.status === 'open').length;

  const filtered = tournaments.filter((t) => {
    if (modeFilter !== 'All' && t.mode !== modeFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.map.toLowerCase().includes(q) ||
        t.mode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    setJoinError(null);
    setJoining(true);
    try {
      await onJoinTournament(selectedTournament.id, squadName);
      setSquadName('');
      setSelectedTournament(null);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Unable to join tournament.');
    } finally {
      setJoining(false);
    }
  };

  const renderStatusText = (status: Tournament['status']) => {
    if (status === 'live') return <span className="text-red-400 font-semibold">Live Now</span>;
    if (status === 'completed') return <span className="text-slate-400 font-semibold">Completed</span>;
    return <span className="text-emerald-400 font-semibold">Registration Open</span>;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section (Split 12-col with items-stretch) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#121824] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-orange-400 tracking-wide">
              Free Fire Competitive Arena · Blogger.com Ready
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-[1.05] text-balance">
              Compete in Verified Custom Rooms &amp; Win Coin Prizes
            </h1>
            <p className="mt-4 text-base text-slate-300 max-w-2xl leading-relaxed">
              Join Solo, Duo, and Squad tournaments seamlessly with your Unique Account ID. Receive
              real-time notifications the moment Admin publishes Room ID and Password.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs text-slate-400">Active Player ID &amp; Balance</span>
              <span className="font-mono text-sm sm:text-base font-semibold text-white tabular-nums">
                {activeAccount
                  ? `${activeAccount.accountCode} · ${activeAccount.playerName} · ${activeAccount.coins} Coins`
                  : 'No account active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {featured ? (
                <button
                  type="button"
                  onClick={() => {
                    setJoinError(null);
                    setSelectedTournament(featured);
                  }}
                  className="px-5 py-2.5 min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  Join Featured Match
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAccountModal}
                  className="px-5 py-2.5 min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  Create Player ID
                </button>
              )}
              <button
                type="button"
                onClick={onGoToWallet}
                className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-slate-100 text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                Add Coins via WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-2xl border border-slate-800 overflow-hidden min-h-[240px] bg-gradient-to-br from-slate-900 to-slate-950">
          {!brokenImages.hero ? (
            <img
              src="/src/assets/images/hero_tactical_arena_1794760596852.jpg"
              alt="Free Fire squad overlooking coastal tournament arena at dusk"
              referrerPolicy="no-referrer"
              onError={() => setBrokenImages((prev) => ({ ...prev, hero: true }))}
              className="w-full h-full object-cover lg:h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6">
              <Trophy className="w-12 h-12 text-orange-500/50" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/40 to-transparent" />
          {featured && (
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="text-xs text-slate-300">
                Featured Match <span aria-hidden="true">·</span> {featured.mode}{' '}
                <span aria-hidden="true">·</span> {featured.map}
              </div>
              <div className="mt-1 text-2xl font-bold text-white font-display">
                {featured.title}
              </div>
              <div className="mt-1 font-mono text-xs text-orange-300 tabular-nums">
                Entry {featured.entryCoins} Coins · Prize Pool {featured.prizePool} Coins ·{' '}
                {featured.participants.length}/{featured.maxSlots} Slots
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Full-Width 4-Column KPI Strip */}
      <section
        aria-label="Arena statistics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-slate-800 bg-[#121824] p-4">
          <div className="text-xs text-slate-400">Open Matches</div>
          <div className="mt-1 font-display text-3xl font-bold text-white tabular-nums">
            {openCount}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#121824] p-4">
          <div className="text-xs text-slate-400">Active Prize Pool</div>
          <div className="mt-1 font-display text-3xl font-bold text-orange-400 tabular-nums">
            {totalPrizePool.toLocaleString()} Coins
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#121824] p-4">
          <div className="text-xs text-slate-400">Registered Accounts</div>
          <div className="mt-1 font-display text-3xl font-bold text-white tabular-nums">
            {accounts.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#121824] p-4">
          <div className="text-xs text-slate-400">Admin Coin Desk</div>
          <div className="mt-1 font-mono text-base sm:text-lg font-semibold text-white tabular-nums">
            {ADMIN_WHATSAPP_NUMBER}
          </div>
        </div>
      </section>

      {/* Top Leaderboard Ad Slot */}
      <AdSlotBanner slot={topAd} onTrackClick={onTrackAdClick} />

      {/* Filter & Search Toolbar */}
      <section aria-label="Tournament filters" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#121824] border border-slate-800 rounded-xl">
            {(['All', 'Solo', 'Duo', 'Squad', 'Clash Squad'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setModeFilter(mode)}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  modeFilter === mode
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#121824] border border-slate-800 rounded-xl">
              {(['all', 'open', 'live', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium capitalize whitespace-nowrap shrink-0 transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search
                className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tournaments"
                placeholder="Search map or cup..."
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-800 bg-[#121824] text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tournament Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#121824] p-10 text-center">
            <h3 className="text-xl font-bold text-white">No Tournaments Match This Filter</h3>
            <p className="text-sm text-slate-400 mt-1">
              Reset filters or check back after Admin publishes new custom rooms.
            </p>
            <button
              type="button"
              onClick={() => {
                setModeFilter('All');
                setStatusFilter('all');
                setSearch('');
              }}
              className="mt-4 px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => {
              const joined = Boolean(
                activeAccount &&
                  t.participants.some(
                    (p) => p.accountCode.toUpperCase() === activeAccount.accountCode.toUpperCase(),
                  ),
              );
              const pct = formatSlotPercent(t.participants.length, t.maxSlots);
              const imgKey = `${t.id}_${t.bannerKey}`;

              return (
                <article
                  key={t.id}
                  className="rounded-2xl border border-slate-800 bg-[#121824] overflow-hidden flex flex-col"
                >
                  <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-950">
                    {!brokenImages[imgKey] ? (
                      <img
                        src={BANNER_IMAGES[t.bannerKey]}
                        alt={`${t.map} tactical arena`}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImages((prev) => ({ ...prev, [imgKey]: true }))}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shield className="w-10 h-10 text-slate-600" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-transparent to-transparent" />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span>
                          {t.mode} <span aria-hidden="true">·</span> {t.map}
                        </span>
                        {renderStatusText(t.status)}
                      </div>

                      <h2 className="mt-1.5 text-2xl font-bold text-white leading-tight">
                        {t.title}
                      </h2>

                      <div className="mt-3 grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-xs">
                        <div>
                          <div className="text-slate-400">Entry</div>
                          <div className="font-mono font-semibold text-white tabular-nums mt-0.5">
                            {t.entryCoins} Coins
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Prize Pool</div>
                          <div className="font-mono font-semibold text-orange-400 tabular-nums mt-0.5">
                            {t.prizePool} Coins
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Per Kill</div>
                          <div className="font-mono font-semibold text-white tabular-nums mt-0.5">
                            {t.perKillCoins} Coins
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Slots Filled</span>
                          </span>
                          <span className="font-mono tabular-nums text-slate-200">
                            {t.participants.length} / {t.maxSlots}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-orange-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setJoinError(null);
                          setSelectedTournament(t);
                        }}
                        className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                          joined
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                            : t.status === 'open'
                              ? 'bg-orange-600 hover:bg-orange-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {joined
                          ? 'Joined · View Match'
                          : t.status === 'open'
                            ? `Join (${t.entryCoins} Coins)`
                            : 'View Match'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* In-Feed Native Ad Slot */}
      <AdSlotBanner slot={feedAd} onTrackClick={onTrackAdClick} />

      {/* Join & Tournament Detail Modal */}
      {selectedTournament && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Tournament details: ${selectedTournament.title}`}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#111723] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs text-slate-400">
                  {selectedTournament.mode} <span aria-hidden="true">·</span>{' '}
                  {selectedTournament.map} <span aria-hidden="true">·</span>{' '}
                  {new Date(selectedTournament.startTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {selectedTournament.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                aria-label="Close tournament modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5 text-center">
                <div>
                  <div className="text-xs text-slate-400">Entry Fee</div>
                  <div className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                    {selectedTournament.entryCoins} Coins
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Prize Pool</div>
                  <div className="font-mono text-base font-semibold text-orange-400 tabular-nums mt-0.5">
                    {selectedTournament.prizePool} Coins
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Slots</div>
                  <div className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                    {selectedTournament.participants.length}/{selectedTournament.maxSlots}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white font-sans">Match Rules</h3>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  {selectedTournament.rules}
                </p>
              </div>

              {selectedTournament.winnerCode && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200">
                  Winner Announced: <span className="font-mono font-semibold">{selectedTournament.winnerCode}</span>
                </div>
              )}

              {activeAccount ? (
                (() => {
                  const check = canJoinTournament(activeAccount, selectedTournament);
                  const alreadyJoined = selectedTournament.participants.some(
                    (p) => p.accountCode.toUpperCase() === activeAccount.accountCode.toUpperCase(),
                  );

                  if (alreadyJoined) {
                    return (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        You are registered with ID{' '}
                        <span className="font-mono font-semibold">{activeAccount.accountCode}</span>.
                        Open My Matches to view Room ID &amp; Password once published by Admin.
                      </div>
                    );
                  }

                  return (
                    <form onSubmit={handleConfirmJoin} className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Joining as {activeAccount.playerName}</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          Balance: {activeAccount.coins} Coins
                        </span>
                      </div>

                      {selectedTournament.mode !== 'Solo' && (
                        <div>
                          <label
                            htmlFor="join-squad-name"
                            className="block text-xs font-medium text-slate-300 mb-1"
                          >
                            Team / Squad Name (Optional)
                          </label>
                          <input
                            id="join-squad-name"
                            type="text"
                            value={squadName}
                            onChange={(e) => setSquadName(e.target.value)}
                            placeholder="e.g. Dhaka Titans"
                            className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {joinError && (
                        <div
                          role="alert"
                          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
                        >
                          {joinError}
                        </div>
                      )}

                      {!check.ok ? (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                            {check.reason}
                          </div>
                          {activeAccount.coins < selectedTournament.entryCoins && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTournament(null);
                                onGoToWallet();
                              }}
                              className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
                            >
                              Add Coins via WhatsApp ({ADMIN_WHATSAPP_NUMBER})
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={joining}
                          className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                        >
                          {joining
                            ? 'Confirming Slot...'
                            : `Confirm & Pay ${selectedTournament.entryCoins} Coins`}
                        </button>
                      )}
                    </form>
                  );
                })()
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTournament(null);
                    onOpenAccountModal();
                  }}
                  className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
                >
                  Select or Create Account to Join
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
