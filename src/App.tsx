import { useCallback, useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { AccountModal } from './components/AccountModal';
import { AdminPanel } from './components/AdminPanel';
import { BloggerExportView } from './components/BloggerExportView';
import { MyMatchesView } from './components/MyMatchesView';
import { NotificationsPanel } from './components/NotificationsPanel';
import { TopNav, type AppView } from './components/TopNav';
import { TournamentLobby } from './components/TournamentLobby';
import { WalletView } from './components/WalletView';
import type {
  AdSlot,
  AppBootstrapState,
  BloggerConfig,
  MatchNotification,
  TournamentMap,
  TournamentMode,
  TournamentStatus,
  UserAccount,
} from './types';

const ACCOUNT_STORAGE_KEY = 'booyah_active_account_code';
const ADMIN_TOKEN_KEY = 'booyah_admin_token';

export default function App() {
  const [state, setState] = useState<AppBootstrapState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>('tournaments');
  const [activeAccountCode, setActiveAccountCode] = useState<string>(
    () => localStorage.getItem(ACCOUNT_STORAGE_KEY) || 'FF-849201',
  );
  const [adminToken, setAdminToken] = useState<string | null>(
    () => sessionStorage.getItem(ADMIN_TOKEN_KEY),
  );
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<MatchNotification | null>(null);
  const [browserAlertsEnabled, setBrowserAlertsEnabled] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted',
  );

  const fetchBootstrap = useCallback(async (codeOverride?: string, tokenOverride?: string | null) => {
    const code = codeOverride ?? activeAccountCode;
    const token = tokenOverride !== undefined ? tokenOverride : adminToken;
    const headers: Record<string, string> = {};
    if (token) headers['x-admin-token'] = token;

    const res = await fetch(`/api/bootstrap?accountCode=${encodeURIComponent(code)}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to load arena state.');
    }
    const data = (await res.json()) as AppBootstrapState;
    setState(data);
    return data;
  }, [activeAccountCode, adminToken]);

  useEffect(() => {
    fetchBootstrap()
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to connect to server.'))
      .finally(() => setLoading(false));
  }, [fetchBootstrap]);

  // Real-time Server-Sent Events subscription
  useEffect(() => {
    const evtSource = new EventSource('/api/events');
    evtSource.addEventListener('state_updated', (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as {
          reason?: string;
          notification?: MatchNotification;
        };
        if (parsed.notification) {
          const notif = parsed.notification;
          if (
            notif.targetAccountCode === 'ALL' ||
            notif.targetAccountCode.toUpperCase() === activeAccountCode.toUpperCase()
          ) {
            setLiveToast(notif);
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(notif.title, { body: notif.message });
              } catch {
                // Ignore Notification constructor errors in headless environments
              }
            }
          }
        }
      } catch {
        // Ignore parse error
      }
      fetchBootstrap().catch(() => {});
    });

    return () => {
      evtSource.close();
    };
  }, [activeAccountCode, fetchBootstrap]);

  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => setLiveToast(null), 5000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  const selectAccountCode = (code: string) => {
    setActiveAccountCode(code);
    localStorage.setItem(ACCOUNT_STORAGE_KEY, code);
  };

  const activeAccount: UserAccount | null =
    state?.accounts.find(
      (a) => a.accountCode.toUpperCase() === activeAccountCode.toUpperCase(),
    ) ||
    state?.accounts[0] ||
    null;

  const currentCode = activeAccount?.accountCode || activeAccountCode;

  const unreadCount =
    state?.notifications.filter(
      (n) =>
        (n.targetAccountCode === 'ALL' ||
          n.targetAccountCode.toUpperCase() === currentCode.toUpperCase()) &&
        !n.readBy.includes(currentCode.toUpperCase()),
    ).length || 0;

  const apiJson = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403) {
        setAdminToken(null);
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      }
      throw new Error((data && data.error) || 'Request failed.');
    }
    return data as T;
  };

  const handleEnableBrowserAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setBrowserAlertsEnabled(perm === 'granted');
  };

  const handleMarkAllRead = async () => {
    await apiJson('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ accountCode: currentCode }),
    });
    await fetchBootstrap();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="font-display text-3xl font-bold text-white">BooyahArena</div>
          <p className="text-sm text-slate-400">Loading tournament lobby...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">Connection Unavailable</h1>
          <p className="text-sm text-red-200">{error || 'Unable to load application data.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 min-h-[44px] rounded-lg bg-orange-600 text-white text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const topAd = state.adSlots.find((s) => s.placement === 'top_leaderboard');
  const feedAd = state.adSlots.find((s) => s.placement === 'in_feed_native');
  const sideAd = state.adSlots.find((s) => s.placement === 'sidebar_card');

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-20 md:pb-12">
      <TopNav
        activeView={activeView}
        onSelectView={setActiveView}
        activeAccount={activeAccount}
        onOpenAccountModal={() => setAccountModalOpen(true)}
      />

      {/* Workspace Sub-bar (Notifications & Live Stream Status) */}
      <div className="border-b border-slate-800/80 bg-[#0E131D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 min-w-0 truncate">
            <span className="hidden sm:inline text-emerald-400 font-medium shrink-0">
              Real-Time Alerts Active
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-600">
              ·
            </span>
            <span className="truncate">
              <span className="hidden sm:inline">Add Coins via Admin WhatsApp </span>
              <span className="sm:hidden text-slate-400">Add Coins: </span>
              <span className="font-mono text-white">{state.bloggerConfig.adminWhatsapp}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-700 bg-[#121824] hover:bg-slate-800 text-slate-100 font-medium whitespace-nowrap shrink-0 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="font-mono tabular-nums text-orange-400 font-semibold">
                ({unreadCount})
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {activeView === 'tournaments' && (
          <TournamentLobby
            tournaments={state.tournaments}
            accounts={state.accounts}
            activeAccount={activeAccount}
            topAd={topAd}
            feedAd={feedAd}
            onTrackAdClick={async (slotId) => {
              await fetch(`/api/ads/${slotId}/click`, { method: 'POST' });
              await fetchBootstrap();
            }}
            onJoinTournament={async (tournamentId, squadName) => {
              await apiJson(`/api/tournaments/${tournamentId}/join`, {
                method: 'POST',
                body: JSON.stringify({ accountCode: currentCode, squadName }),
              });
              await fetchBootstrap();
            }}
            onGoToWallet={() => setActiveView('wallet')}
            onOpenAccountModal={() => setAccountModalOpen(true)}
          />
        )}

        {activeView === 'matches' && (
          <MyMatchesView
            tournaments={state.tournaments}
            activeAccount={activeAccount}
            onBrowseTournaments={() => setActiveView('tournaments')}
          />
        )}

        {activeView === 'wallet' && (
          <WalletView
            activeAccount={activeAccount}
            transactions={state.transactions}
            sidebarAd={sideAd}
            adminWhatsapp={state.bloggerConfig.adminWhatsapp}
            onTrackAdClick={async (slotId) => {
              await fetch(`/api/ads/${slotId}/click`, { method: 'POST' });
              await fetchBootstrap();
            }}
            onSubmitTopupRequest={async (requestedCoins) => {
              await apiJson('/api/topup-requests', {
                method: 'POST',
                body: JSON.stringify({ accountCode: currentCode, requestedCoins }),
              });
              await fetchBootstrap();
            }}
            onOpenAccountModal={() => setAccountModalOpen(true)}
          />
        )}

        {activeView === 'blogger' && (
          <BloggerExportView
            config={state.bloggerConfig}
            tournaments={state.tournaments}
            adSlots={state.adSlots}
            onGoToAdmin={() => setActiveView('admin')}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanel
            adminToken={adminToken}
            onAdminLogin={async (pin) => {
              const res = await apiJson<{ token: string }>('/api/admin/login', {
                method: 'POST',
                body: JSON.stringify({ pin }),
              });
              setAdminToken(res.token);
              sessionStorage.setItem(ADMIN_TOKEN_KEY, res.token);
              await fetchBootstrap(undefined, res.token);
            }}
            onAdminLogout={async () => {
              await fetch('/api/admin/logout', {
                method: 'POST',
                headers: adminToken ? { 'x-admin-token': adminToken } : {},
              });
              setAdminToken(null);
              sessionStorage.removeItem(ADMIN_TOKEN_KEY);
              await fetchBootstrap(undefined, null);
            }}
            tournaments={state.tournaments}
            accounts={state.accounts}
            topupRequests={state.topupRequests}
            adSlots={state.adSlots}
            bloggerConfig={state.bloggerConfig}
            onCreateTournament={async (payload: {
              title: string;
              mode: TournamentMode;
              map: TournamentMap;
              entryCoins: number;
              prizePool: number;
              perKillCoins: number;
              maxSlots: number;
              startTime: string;
              rules: string;
            }) => {
              await apiJson('/api/admin/tournaments', {
                method: 'POST',
                body: JSON.stringify(payload),
              });
              await fetchBootstrap();
            }}
            onUpdateTournamentStatus={async (id: string, status: TournamentStatus) => {
              await apiJson(`/api/admin/tournaments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
              });
              await fetchBootstrap();
            }}
            onPublishRoom={async (id, roomId, roomPassword, setLive) => {
              await apiJson(`/api/admin/tournaments/${id}/room`, {
                method: 'POST',
                body: JSON.stringify({ roomId, roomPassword, setLive }),
              });
              await fetchBootstrap();
            }}
            onDeclareWinner={async (id, winnerAccountCode, prizeCoins) => {
              await apiJson(`/api/admin/tournaments/${id}/winner`, {
                method: 'POST',
                body: JSON.stringify({ winnerAccountCode, prizeCoins }),
              });
              await fetchBootstrap();
            }}
            onDeleteTournament={async (id) => {
              await apiJson(`/api/admin/tournaments/${id}`, { method: 'DELETE' });
              await fetchBootstrap();
            }}
            onAdjustCoins={async (payload) => {
              await apiJson('/api/admin/coins', {
                method: 'POST',
                body: JSON.stringify(payload),
              });
              await fetchBootstrap();
            }}
            onDismissTopupRequest={async (id) => {
              await apiJson(`/api/admin/topup-requests/${id}/dismiss`, { method: 'POST' });
              await fetchBootstrap();
            }}
            onUpdateAdSlot={async (id: string, payload: Partial<AdSlot>) => {
              await apiJson(`/api/admin/ads/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
              });
              await fetchBootstrap();
            }}
            onUpdateBloggerConfig={async (payload: Partial<BloggerConfig>) => {
              await apiJson('/api/admin/blogger-config', {
                method: 'PUT',
                body: JSON.stringify(payload),
              });
              await fetchBootstrap();
            }}
            onSendBroadcast={async (payload) => {
              await apiJson('/api/admin/notifications', {
                method: 'POST',
                body: JSON.stringify(payload),
              });
              await fetchBootstrap();
            }}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <span>BooyahArena · Free Fire Tournament &amp; Blogger.com Platform</span>
        <span>
          Coin Support WhatsApp:{' '}
          <span className="font-mono text-slate-300">{state.bloggerConfig.adminWhatsapp}</span>
        </span>
      </footer>

      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        accounts={state.accounts}
        activeAccount={activeAccount}
        onSelectAccount={selectAccountCode}
        onCreateAccount={async (payload) => {
          const created = await apiJson<UserAccount>('/api/accounts', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          selectAccountCode(created.accountCode);
          await fetchBootstrap(created.accountCode);
          setAccountModalOpen(false);
        }}
      />

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={state.notifications}
        accountCode={currentCode}
        onMarkAllRead={handleMarkAllRead}
        browserAlertsEnabled={browserAlertsEnabled}
        onEnableBrowserAlerts={handleEnableBrowserAlerts}
      />

      {/* Live SSE Notification Toast */}
      {liveToast && (
        <div
          role="status"
          className="fixed bottom-16 md:bottom-5 right-4 left-4 sm:left-auto sm:w-96 z-50 rounded-xl border border-orange-500/60 bg-[#141C2B] p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-orange-400">Live Match Update</div>
              <div className="text-sm font-semibold text-white mt-0.5">{liveToast.title}</div>
              <p className="text-xs text-slate-300 mt-1">{liveToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setLiveToast(null)}
              aria-label="Dismiss notification"
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
