import { useState } from 'react';
import {
  BellRing,
  Coins,
  KeyRound,
  Lock,
  LogOut,
  Megaphone,
  Plus,
  ShieldCheck,
  Trash2,
  Trophy,
} from 'lucide-react';
import type {
  AdSlot,
  BloggerConfig,
  CoinTopupRequest,
  Tournament,
  TournamentMap,
  TournamentMode,
  TournamentStatus,
  UserAccount,
} from '../types';

interface AdminPanelProps {
  adminToken: string | null;
  onAdminLogin: (pin: string) => Promise<void>;
  onAdminLogout: () => Promise<void>;
  tournaments: Tournament[];
  accounts: UserAccount[];
  topupRequests: CoinTopupRequest[];
  adSlots: AdSlot[];
  bloggerConfig: BloggerConfig;
  onCreateTournament: (payload: {
    title: string;
    mode: TournamentMode;
    map: TournamentMap;
    entryCoins: number;
    prizePool: number;
    perKillCoins: number;
    maxSlots: number;
    startTime: string;
    rules: string;
  }) => Promise<void>;
  onUpdateTournamentStatus: (id: string, status: TournamentStatus) => Promise<void>;
  onPublishRoom: (id: string, roomId: string, roomPassword: string, setLive: boolean) => Promise<void>;
  onDeclareWinner: (id: string, winnerAccountCode: string, prizeCoins: number) => Promise<void>;
  onDeleteTournament: (id: string) => Promise<void>;
  onAdjustCoins: (payload: {
    accountCode: string;
    delta: number;
    note: string;
    requestId?: string;
  }) => Promise<void>;
  onDismissTopupRequest: (id: string) => Promise<void>;
  onUpdateAdSlot: (id: string, payload: Partial<AdSlot>) => Promise<void>;
  onUpdateBloggerConfig: (payload: Partial<BloggerConfig>) => Promise<void>;
  onSendBroadcast: (payload: {
    title: string;
    message: string;
    targetAccountCode: string;
  }) => Promise<void>;
}

type AdminTab = 'tournaments' | 'coins' | 'ads' | 'blogger';

export function AdminPanel({
  adminToken,
  onAdminLogin,
  onAdminLogout,
  tournaments,
  accounts,
  topupRequests,
  adSlots,
  bloggerConfig,
  onCreateTournament,
  onUpdateTournamentStatus,
  onPublishRoom,
  onDeclareWinner,
  onDeleteTournament,
  onAdjustCoins,
  onDismissTopupRequest,
  onUpdateAdSlot,
  onUpdateBloggerConfig,
  onSendBroadcast,
}: AdminPanelProps) {
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>('tournaments');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Create tournament form
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<TournamentMode>('Squad');
  const [map, setMap] = useState<TournamentMap>('Bermuda');
  const [entryCoins, setEntryCoins] = useState('50');
  const [prizePool, setPrizePool] = useState('1000');
  const [perKillCoins, setPerKillCoins] = useState('15');
  const [maxSlots, setMaxSlots] = useState('48');
  const [rules, setRules] = useState('');

  // Room publish state per tournament
  const [roomInputs, setRoomInputs] = useState<
    Record<string, { roomId: string; roomPassword: string; setLive: boolean }>
  >({});
  const [winnerInputs, setWinnerInputs] = useState<
    Record<string, { code: string; prize: string }>
  >({});

  // Coin adjustment form
  const [coinSearch, setCoinSearch] = useState('');
  const [targetCode, setTargetCode] = useState('FF-849201');
  const [coinDelta, setCoinDelta] = useState('250');
  const [coinNote, setCoinNote] = useState('WhatsApp +8801540097494 Coin Credit');

  // Ad draft edits
  const [adDrafts, setAdDrafts] = useState<Record<string, AdSlot>>({});

  // Blogger config + alert broadcast
  const [blogDraft, setBlogDraft] = useState<BloggerConfig>(bloggerConfig);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTarget, setAlertTarget] = useState('ALL');

  const showStatus = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  if (!adminToken) {
    const handleUnlock = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      setAuthLoading(true);
      try {
        await onAdminLogin(pin);
        setPin('');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Invalid Admin PIN.');
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto py-8">
        <div className="rounded-2xl border border-slate-800 bg-[#121824] p-6 sm:p-8 space-y-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-orange-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Blogger.com Admin Control</h1>
            <p className="text-sm text-slate-400 mt-1">
              Coin addition, custom room credentials, winner payouts, and ad monetization scripts are
              restricted exclusively to Admin.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label htmlFor="admin-pin-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Security PIN
              </label>
              <input
                id="admin-pin-input"
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter Admin PIN (default: admin123)"
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {authLoading ? 'Verifying...' : 'Unlock Admin Control'}
            </button>
          </form>

          <p className="text-xs text-slate-500">
            Demo Admin PIN: <span className="font-mono text-slate-300">admin123</span> (configurable
            via <span className="font-mono">ADMIN_PIN</span> env variable).
          </p>
        </div>
      </div>
    );
  }

  const pendingRequests = topupRequests.filter((r) => r.status === 'pending');
  const filteredAccounts = accounts.filter((a) => {
    if (!coinSearch.trim()) return true;
    const q = coinSearch.trim().toLowerCase();
    return (
      a.accountCode.toLowerCase().includes(q) ||
      a.playerName.toLowerCase().includes(q) ||
      a.ffUid.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-orange-400 shrink-0" aria-hidden="true" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Admin Control Center
            </h1>
            <p className="text-sm text-slate-400">
              Manage tournaments, publish rooms, credit coins by Unique ID, and configure ads.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdminLogout}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white whitespace-nowrap self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Lock Admin</span>
        </button>
      </div>

      {/* Admin Sub-navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#121824] border border-slate-800 rounded-xl w-fit">
        {(
          [
            { id: 'tournaments', label: 'Tournaments & Rooms', icon: Trophy },
            { id: 'coins', label: `Coin Control (${pendingRequests.length})`, icon: Coins },
            { id: 'ads', label: 'Ads & Earning', icon: Megaphone },
            { id: 'blogger', label: 'Blogger & Alerts', icon: BellRing },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === item.id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
        >
          {feedback}
        </div>
      )}

      {/* TAB 1: TOURNAMENTS & ROOMS */}
      {tab === 'tournaments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onCreateTournament({
                title,
                mode,
                map,
                entryCoins: Number(entryCoins),
                prizePool: Number(prizePool),
                perKillCoins: Number(perKillCoins),
                maxSlots: Number(maxSlots),
                startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
                rules,
              });
              setTitle('');
              setRules('');
              showStatus('Tournament created and real-time alert sent to players.');
            }}
            className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-400" aria-hidden="true" />
              <h2 className="text-xl font-bold text-white">Add New Tournament</h2>
            </div>

            <div>
              <label htmlFor="trn-title" className="block text-xs text-slate-300 mb-1">
                Tournament Title
              </label>
              <input
                id="trn-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bermuda Night Rush Cup"
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="trn-mode" className="block text-xs text-slate-300 mb-1">
                  Mode
                </label>
                <select
                  id="trn-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as TournamentMode)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
                >
                  <option value="Solo">Solo</option>
                  <option value="Duo">Duo</option>
                  <option value="Squad">Squad</option>
                  <option value="Clash Squad">Clash Squad</option>
                </select>
              </div>
              <div>
                <label htmlFor="trn-map" className="block text-xs text-slate-300 mb-1">
                  Map
                </label>
                <select
                  id="trn-map"
                  value={map}
                  onChange={(e) => setMap(e.target.value as TournamentMap)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
                >
                  <option value="Bermuda">Bermuda</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Nexterra">Nexterra</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="trn-entry" className="block text-xs text-slate-300 mb-1">
                  Entry Coins
                </label>
                <input
                  id="trn-entry"
                  type="number"
                  min={0}
                  required
                  value={entryCoins}
                  onChange={(e) => setEntryCoins(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label htmlFor="trn-prize" className="block text-xs text-slate-300 mb-1">
                  Prize Pool (Coins)
                </label>
                <input
                  id="trn-prize"
                  type="number"
                  min={0}
                  required
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="trn-kill" className="block text-xs text-slate-300 mb-1">
                  Per Kill Coins
                </label>
                <input
                  id="trn-kill"
                  type="number"
                  min={0}
                  required
                  value={perKillCoins}
                  onChange={(e) => setPerKillCoins(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label htmlFor="trn-slots" className="block text-xs text-slate-300 mb-1">
                  Max Slots
                </label>
                <input
                  id="trn-slots"
                  type="number"
                  min={2}
                  max={100}
                  required
                  value={maxSlots}
                  onChange={(e) => setMaxSlots(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="trn-rules" className="block text-xs text-slate-300 mb-1">
                Match Rules
              </label>
              <textarea
                id="trn-rules"
                rows={3}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="No emulator, mobile only..."
                className="w-full rounded-lg border border-slate-700 bg-[#0B0F17] p-3 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
            >
              Publish Tournament
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {tournaments.map((t) => {
              const roomState = roomInputs[t.id] || {
                roomId: t.roomId || '',
                roomPassword: t.roomPassword || '',
                setLive: true,
              };
              const winState = winnerInputs[t.id] || {
                code: t.participants[0]?.accountCode || 'FF-849201',
                prize: String(t.prizePool),
              };

              return (
                <article
                  key={t.id}
                  className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-400">
                        {t.mode} · {t.map} · {t.participants.length}/{t.maxSlots} Joined ·{' '}
                        <span className="text-orange-400 uppercase font-semibold">{t.status}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{t.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['open', 'live', 'completed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await onUpdateTournamentStatus(t.id, st);
                            showStatus(`${t.title} marked ${st.toUpperCase()}.`);
                          }}
                          className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold capitalize border ${
                            t.status === st
                              ? 'bg-orange-600 border-orange-500 text-white'
                              : 'bg-[#0B0F17] border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteTournament(t.id);
                          showStatus(`Deleted ${t.title}.`);
                        }}
                        aria-label={`Delete ${t.title}`}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-slate-700 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Room ID & Password Publisher */}
                  <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <KeyRound className="w-4 h-4 text-orange-400" aria-hidden="true" />
                      <span>Publish Custom Room ID &amp; Password (Live Push Alert)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        aria-label={`Room ID for ${t.title}`}
                        placeholder="Room ID (e.g. 94827162)"
                        value={roomState.roomId}
                        onChange={(e) =>
                          setRoomInputs((prev) => ({
                            ...prev,
                            [t.id]: { ...roomState, roomId: e.target.value },
                          }))
                        }
                        className="min-h-[44px] rounded-lg border border-slate-700 bg-[#121824] px-3 text-sm font-mono text-white"
                      />
                      <input
                        type="text"
                        aria-label={`Room Password for ${t.title}`}
                        placeholder="Password (e.g. FF77)"
                        value={roomState.roomPassword}
                        onChange={(e) =>
                          setRoomInputs((prev) => ({
                            ...prev,
                            [t.id]: { ...roomState, roomPassword: e.target.value },
                          }))
                        }
                        className="min-h-[44px] rounded-lg border border-slate-700 bg-[#121824] px-3 text-sm font-mono text-white"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await onPublishRoom(
                            t.id,
                            roomState.roomId,
                            roomState.roomPassword,
                            roomState.setLive,
                          );
                          showStatus(`Room credentials pushed to ${t.title} players.`);
                        }}
                        className="min-h-[44px] px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        Publish Room
                      </button>
                    </div>
                  </div>

                  {/* Winner Payout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
                    <input
                      type="text"
                      aria-label={`Winner Unique ID for ${t.title}`}
                      placeholder="Winner ID (FF-XXXXXX)"
                      value={winState.code}
                      onChange={(e) =>
                        setWinnerInputs((prev) => ({
                          ...prev,
                          [t.id]: { ...winState, code: e.target.value },
                        }))
                      }
                      className="flex-1 min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                    />
                    <input
                      type="number"
                      aria-label={`Prize Coins for ${t.title}`}
                      value={winState.prize}
                      onChange={(e) =>
                        setWinnerInputs((prev) => ({
                          ...prev,
                          [t.id]: { ...winState, prize: e.target.value },
                        }))
                      }
                      className="w-full sm:w-32 min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeclareWinner(t.id, winState.code, Number(winState.prize));
                        showStatus(`Winner ${winState.code} credited ${winState.prize} Coins.`);
                      }}
                      className="min-h-[44px] px-4 rounded-lg border border-orange-500/50 bg-orange-600/20 hover:bg-orange-600/30 text-orange-200 text-xs font-semibold whitespace-nowrap"
                    >
                      Pay Winner Prize
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN-ONLY COIN CONTROL */}
      {tab === 'coins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onAdjustCoins({
                  accountCode: targetCode,
                  delta: Number(coinDelta),
                  note: coinNote,
                });
                showStatus(`Updated ${targetCode} by ${coinDelta} Coins.`);
              }}
              className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4"
            >
              <h2 className="text-xl font-bold text-white">Credit / Deduct Coins by Unique ID</h2>
              <p className="text-xs text-slate-400">
                Enter the player&apos;s Unique Account ID sent on WhatsApp (+8801540097494).
              </p>

              <div>
                <label htmlFor="admin-coin-code" className="block text-xs text-slate-300 mb-1">
                  Player Unique ID Code
                </label>
                <input
                  id="admin-coin-code"
                  type="text"
                  required
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value)}
                  placeholder="FF-849201"
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label htmlFor="admin-coin-delta" className="block text-xs text-slate-300 mb-1">
                  Coin Amount (+ to credit, - to deduct)
                </label>
                <input
                  id="admin-coin-delta"
                  type="number"
                  required
                  value={coinDelta}
                  onChange={(e) => setCoinDelta(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label htmlFor="admin-coin-note" className="block text-xs text-slate-300 mb-1">
                  Audit Note
                </label>
                <input
                  id="admin-coin-note"
                  type="text"
                  value={coinNote}
                  onChange={(e) => setCoinNote(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
              >
                Apply Coin Adjustment
              </button>
            </form>

            {/* Pending WhatsApp Top-up Queue */}
            <div className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-3">
              <h2 className="text-xl font-bold text-white">
                Pending WhatsApp Coin Requests ({pendingRequests.length})
              </h2>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-slate-400">No pending top-up tickets.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-orange-400">
                          {req.accountCode}
                        </span>
                        <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
                          +{req.requestedCoins} Coins
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {req.playerName} · UID {req.ffUid}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onAdjustCoins({
                              accountCode: req.accountCode,
                              delta: req.requestedCoins,
                              note: `WhatsApp Top-up Approved (+${req.requestedCoins})`,
                              requestId: req.id,
                            });
                            showStatus(
                              `Approved +${req.requestedCoins} Coins for ${req.accountCode}.`,
                            );
                          }}
                          className="flex-1 min-h-[40px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Approve &amp; Credit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDismissTopupRequest(req.id);
                            showStatus(`Dismissed request for ${req.accountCode}.`);
                          }}
                          className="px-3 min-h-[40px] rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#121824] overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Player Accounts Directory</h2>
              <input
                type="search"
                value={coinSearch}
                onChange={(e) => setCoinSearch(e.target.value)}
                aria-label="Search player accounts by unique ID or IGN"
                placeholder="Search ID or IGN..."
                className="w-full sm:w-56 min-h-[40px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0B0F17] text-xs text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Unique ID</th>
                    <th className="py-3 px-4 font-medium">Player / UID</th>
                    <th className="py-3 px-4 font-medium text-right">Coins</th>
                    <th className="py-3 px-4 font-medium text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-semibold text-orange-400 whitespace-nowrap">
                        {acc.accountCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{acc.playerName}</div>
                        <div className="text-xs font-mono text-slate-400">UID {acc.ffUid}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums whitespace-nowrap">
                        {acc.coins.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setTargetCode(acc.accountCode)}
                          className="px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white whitespace-nowrap"
                        >
                          Select ID
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADS & MONETIZATION */}
      {tab === 'ads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {adSlots.map((slot) => {
            const draft = adDrafts[slot.id] || slot;
            const updateDraft = (patch: Partial<AdSlot>) =>
              setAdDrafts((prev) => ({
                ...prev,
                [slot.id]: { ...draft, ...patch },
              }));

            return (
              <div
                key={slot.id}
                className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      {slot.impressions} views · {slot.clicks} clicks
                    </div>
                    <h2 className="text-lg font-bold text-white font-sans mt-0.5">{slot.label}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDraft({ enabled: !draft.enabled })}
                    className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap ${
                      draft.enabled
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {draft.enabled ? 'Active' : 'Paused'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Ad Network</label>
                  <select
                    value={draft.network}
                    onChange={(e) =>
                      updateDraft({ network: e.target.value as AdSlot['network'] })
                    }
                    className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
                  >
                    <option value="AdSense">Google AdSense</option>
                    <option value="Adsterra">Adsterra</option>
                    <option value="Custom Banner">Custom Sponsor Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Sponsor Title (Fallback Banner)
                  </label>
                  <input
                    type="text"
                    value={draft.sponsorTitle}
                    onChange={(e) => updateDraft({ sponsorTitle: e.target.value })}
                    className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Sponsor Link URL</label>
                  <input
                    type="url"
                    value={draft.sponsorUrl}
                    onChange={(e) => updateDraft({ sponsorUrl: e.target.value })}
                    className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    AdSense / Adsterra HTML Script (Injected into Blogger Export)
                  </label>
                  <textarea
                    rows={3}
                    value={draft.htmlCode}
                    onChange={(e) => updateDraft({ htmlCode: e.target.value })}
                    placeholder="<ins class='adsbygoogle' ...></ins>"
                    className="w-full rounded-lg border border-slate-700 bg-[#0B0F17] p-3 font-mono text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateAdSlot(slot.id, draft);
                    showStatus(`Saved ad configuration for ${slot.label}.`);
                  }}
                  className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
                >
                  Save Ad Slot
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: BLOGGER CONFIG & REAL-TIME ALERTS */}
      {tab === 'blogger' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onUpdateBloggerConfig(blogDraft);
              showStatus('Saved Blogger.com export configuration.');
            }}
            className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4"
          >
            <h2 className="text-xl font-bold text-white">Blogger.com Sync Settings</h2>

            <div>
              <label htmlFor="cfg-title" className="block text-xs text-slate-300 mb-1">
                Blogger Site Title
              </label>
              <input
                id="cfg-title"
                type="text"
                value={blogDraft.blogTitle}
                onChange={(e) => setBlogDraft({ ...blogDraft, blogTitle: e.target.value })}
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
              />
            </div>

            <div>
              <label htmlFor="cfg-url" className="block text-xs text-slate-300 mb-1">
                Blogger.com URL
              </label>
              <input
                id="cfg-url"
                type="url"
                value={blogDraft.blogUrl}
                onChange={(e) => setBlogDraft({ ...blogDraft, blogUrl: e.target.value })}
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cfg-wa" className="block text-xs text-slate-300 mb-1">
                  Admin WhatsApp Number
                </label>
                <input
                  id="cfg-wa"
                  type="text"
                  value={blogDraft.adminWhatsapp}
                  onChange={(e) => setBlogDraft({ ...blogDraft, adminWhatsapp: e.target.value })}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label htmlFor="cfg-label" className="block text-xs text-slate-300 mb-1">
                  Coin Ledger Post Label
                </label>
                <input
                  id="cfg-label"
                  type="text"
                  value={blogDraft.coinFeedLabel}
                  onChange={(e) => setBlogDraft({ ...blogDraft, coinFeedLabel: e.target.value })}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
            >
              Save Blogger Settings
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onSendBroadcast({
                title: alertTitle,
                message: alertMessage,
                targetAccountCode: alertTarget,
              });
              setAlertTitle('');
              setAlertMessage('');
              showStatus('Real-time match notification pushed.');
            }}
            className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4 h-fit"
          >
            <h2 className="text-xl font-bold text-white">Send Real-Time Match Alert</h2>

            <div>
              <label htmlFor="alert-target" className="block text-xs text-slate-300 mb-1">
                Recipient (ALL or Unique ID like FF-849201)
              </label>
              <input
                id="alert-target"
                type="text"
                value={alertTarget}
                onChange={(e) => setAlertTarget(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white"
              />
            </div>

            <div>
              <label htmlFor="alert-title" className="block text-xs text-slate-300 mb-1">
                Alert Title
              </label>
              <input
                id="alert-title"
                type="text"
                required
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="e.g. Bermuda Cup Starts in 10 Minutes"
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white"
              />
            </div>

            <div>
              <label htmlFor="alert-msg" className="block text-xs text-slate-300 mb-1">
                Message
              </label>
              <textarea
                id="alert-msg"
                rows={3}
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Join custom lobby now. Room credentials live in My Matches."
                className="w-full rounded-lg border border-slate-700 bg-[#0B0F17] p-3 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
            >
              Push Real-Time Notification
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
