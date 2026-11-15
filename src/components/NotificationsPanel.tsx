import { Bell, CheckCheck, X } from 'lucide-react';
import type { MatchNotification } from '../types';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: MatchNotification[];
  accountCode: string;
  onMarkAllRead: () => void;
  browserAlertsEnabled: boolean;
  onEnableBrowserAlerts: () => void;
}

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  accountCode,
  onMarkAllRead,
  browserAlertsEnabled,
  onEnableBrowserAlerts,
}: NotificationsPanelProps) {
  if (!open) return null;

  const relevant = notifications.filter(
    (n) =>
      n.targetAccountCode === 'ALL' ||
      n.targetAccountCode.toUpperCase() === accountCode.toUpperCase(),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Real-time match notifications"
    >
      <div className="w-full max-w-md h-full bg-[#111723] border-l border-slate-800 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-orange-400" aria-hidden="true" />
            <h2 className="text-xl font-bold text-white">Live Match Alerts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-[#0E131D]">
          <button
            type="button"
            onClick={onEnableBrowserAlerts}
            className="px-3 py-2 min-h-[40px] rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 whitespace-nowrap transition-colors"
          >
            {browserAlertsEnabled ? 'Desktop Alerts Active' : 'Enable Browser Push Alerts'}
          </button>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/10 whitespace-nowrap transition-colors"
          >
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {relevant.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No notifications yet. Join a tournament or request coins to see live updates here.
            </div>
          ) : (
            relevant.map((item) => {
              const isRead = item.readBy.includes(accountCode.toUpperCase());
              return (
                <article
                  key={item.id}
                  className={`px-5 py-4 transition-colors ${
                    isRead ? 'bg-transparent' : 'bg-orange-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-1">
                    <span className="font-medium text-orange-400 capitalize">
                      {item.category} {item.targetAccountCode !== 'ALL' ? `· ${item.targetAccountCode}` : '· Broadcast'}
                    </span>
                    <time className="font-mono tabular-nums">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <h3 className="text-sm font-semibold text-white font-sans">{item.title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{item.message}</p>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
