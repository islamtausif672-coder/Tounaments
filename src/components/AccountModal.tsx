import { useState } from 'react';
import { Check, Copy, UserPlus, X } from 'lucide-react';
import type { UserAccount } from '../types';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  activeAccount: UserAccount | null;
  onSelectAccount: (accountCode: string) => void;
  onCreateAccount: (payload: {
    playerName: string;
    ffUid: string;
    whatsappPhone: string;
  }) => Promise<void>;
}

export function AccountModal({
  open,
  onClose,
  accounts,
  activeAccount,
  onSelectAccount,
  onCreateAccount,
}: AccountModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!open) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreateAccount({ playerName, ffUid, whatsappPhone });
      setPlayerName('');
      setFfUid('');
      setWhatsappPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Player account and unique ID manager"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#111723] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Player Account &amp; Unique ID</h2>
            <p className="text-sm text-slate-400">
              Every account receives a permanent Unique ID Code for Admin coin credits.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Accounts Switcher */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-300 font-sans mb-3">
            Switch Active Player Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const selected = activeAccount?.accountCode === acc.accountCode;
              return (
                <div
                  key={acc.id}
                  className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    selected
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-800 bg-[#0B0F17] hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAccount(acc.accountCode);
                      onClose();
                    }}
                    className="text-left min-w-0 flex-1 min-h-[44px]"
                  >
                    <div className="text-sm font-semibold text-white truncate">
                      {acc.playerName}
                    </div>
                    <div className="font-mono text-xs text-orange-400 tabular-nums mt-0.5">
                      {acc.accountCode} · {acc.coins} Coins
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">
                      UID: {acc.ffUid}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.accountCode)}
                    aria-label={`Copy ID ${acc.accountCode}`}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                  >
                    {copiedCode === acc.accountCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Register New Unique ID Account */}
        <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-orange-400" aria-hidden="true" />
            <h3 className="text-base font-semibold text-white font-sans">
              Create New Free Fire Account
            </h3>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="new-ign" className="block text-xs font-medium text-slate-300 mb-1.5">
                Free Fire IGN
              </label>
              <input
                id="new-ign"
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. DhakaRusher"
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="new-uid" className="block text-xs font-medium text-slate-300 mb-1.5">
                Free Fire UID (6–14 digits)
              </label>
              <input
                id="new-uid"
                type="text"
                required
                value={ffUid}
                onChange={(e) => setFfUid(e.target.value)}
                placeholder="e.g. 294810294"
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm font-mono text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="new-wa" className="block text-xs font-medium text-slate-300 mb-1.5">
                WhatsApp (Optional)
              </label>
              <input
                id="new-wa"
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+8801..."
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-[#0B0F17] px-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-400">
              New accounts start with 0 Coins. Contact Admin (+8801540097494) to add coins.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap transition-colors"
            >
              {submitting ? 'Generating ID...' : 'Generate Unique ID Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
