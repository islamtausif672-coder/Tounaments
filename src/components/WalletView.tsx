import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, ShieldAlert } from 'lucide-react';
import type { AdSlot, CoinTransaction, UserAccount } from '../types';
import {
  ADMIN_WHATSAPP_NUMBER,
  buildWhatsAppCoinMessage,
  buildWhatsAppCoinUrl,
} from '../utils/tournamentLogic';
import { AdSlotBanner } from './AdSlotBanner';

interface WalletViewProps {
  activeAccount: UserAccount | null;
  transactions: CoinTransaction[];
  sidebarAd: AdSlot | undefined;
  adminWhatsapp: string;
  onTrackAdClick: (slotId: string) => void;
  onSubmitTopupRequest: (requestedCoins: number) => Promise<void>;
  onOpenAccountModal: () => void;
}

const COIN_PACKAGES = [100, 250, 500, 1000, 2500];

export function WalletView({
  activeAccount,
  transactions,
  sidebarAd,
  adminWhatsapp,
  onTrackAdClick,
  onSubmitTopupRequest,
  onOpenAccountModal,
}: WalletViewProps) {
  const [selectedCoins, setSelectedCoins] = useState<number>(250);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const whatsappNumber = adminWhatsapp || ADMIN_WHATSAPP_NUMBER;

  if (!activeAccount) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#121824] p-10 text-center">
        <h1 className="text-3xl font-bold text-white">Player Wallet &amp; Unique ID</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create or select a Free Fire account to generate your Unique Account ID Code.
        </p>
        <button
          type="button"
          onClick={onOpenAccountModal}
          className="mt-4 px-5 py-2.5 min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
        >
          Open Account Manager
        </button>
      </div>
    );
  }

  const accountTransactions = transactions.filter(
    (t) => t.accountCode.toUpperCase() === activeAccount.accountCode.toUpperCase(),
  );

  const whatsappMessage = buildWhatsAppCoinMessage({
    accountCode: activeAccount.accountCode,
    playerName: activeAccount.playerName,
    ffUid: activeAccount.ffUid,
    coins: selectedCoins,
  });

  const whatsappUrl = buildWhatsAppCoinUrl({
    phone: whatsappNumber,
    accountCode: activeAccount.accountCode,
    playerName: activeAccount.playerName,
    ffUid: activeAccount.ffUid,
    coins: selectedCoins,
  });

  const handleCopyId = () => {
    navigator.clipboard?.writeText(activeAccount.accountCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard?.writeText(whatsappMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleRequestTicket = async () => {
    setSubmitting(true);
    setRequestNotice(null);
    try {
      await onSubmitTopupRequest(selectedCoins);
      setRequestNotice(
        `Top-up ticket logged for ${selectedCoins} Coins. Message WhatsApp ${whatsappNumber} with your Unique ID ${activeAccount.accountCode} for Admin approval.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Coin Wallet &amp; Unique ID
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Coins can only be added by Blogger.com Admin after WhatsApp verification.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAccountModal}
          className="px-4 py-2 min-h-[44px] rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-sm font-medium text-white whitespace-nowrap self-start sm:self-auto"
        >
          Switch / New Account
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Unique ID + WhatsApp Coin Request */}
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-[#121824] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-slate-400">Unique Account ID Code</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold text-orange-400 tabular-nums">
                    {activeAccount.accountCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    aria-label="Copy Unique Account ID Code"
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    {copiedId ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  IGN: {activeAccount.playerName} · UID: {activeAccount.ffUid}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Available Coin Balance</div>
                <div className="mt-1 font-display text-4xl font-bold text-white tabular-nums">
                  {activeAccount.coins.toLocaleString()} Coins
                </div>
                <div className="text-xs text-slate-400 mt-1">Ready for tournament entry</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Career Record</div>
                <div className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
                  {activeAccount.matchesPlayed} Played · {activeAccount.wins} Wins
                </div>
                <div className="text-xs text-slate-400 mt-1">Verified custom lobbies</div>
              </div>
            </div>
          </section>

          {/* Add Coins via WhatsApp */}
          <section className="rounded-2xl border border-slate-800 bg-[#121824] p-6 space-y-5">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-emerald-400 mt-1 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Add Coins via Admin WhatsApp ({whatsappNumber})
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Select how many coins you need, send your Unique ID{' '}
                  <span className="font-mono text-orange-400">{activeAccount.accountCode}</span> to
                  our WhatsApp desk, and Admin will credit your balance from Blogger.com.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Security rule: Players cannot self-credit coins. Only verified Blogger Admin
                accounts can add coins to your Unique ID Code.
              </span>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-300 mb-2">Select Coin Package</div>
              <div className="flex flex-wrap gap-2">
                {COIN_PACKAGES.map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => setSelectedCoins(pkg)}
                    className={`px-4 py-2.5 min-h-[44px] rounded-lg font-mono text-sm font-semibold tabular-nums whitespace-nowrap transition-colors border ${
                      selectedCoins === pkg
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-[#0B0F17] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    +{pkg} Coins
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-slate-400">Pre-filled WhatsApp Order Message</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 min-h-[32px]"
                >
                  {copiedMsg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMsg ? 'Copied' : 'Copy text'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
                {whatsappMessage}
              </pre>
            </div>

            {requestNotice && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200">
                {requestNotice}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleRequestTicket}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold whitespace-nowrap transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Contact WhatsApp {whatsappNumber}</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                disabled={submitting}
                onClick={handleRequestTicket}
                className="px-5 py-3 min-h-[48px] rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold whitespace-nowrap transition-colors"
              >
                {submitting ? 'Logging...' : 'Log Request for Admin'}
              </button>
            </div>
          </section>

          {/* Transaction Ledger */}
          <section className="rounded-2xl border border-slate-800 bg-[#121824] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Coin Transaction Ledger</h2>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {accountTransactions.length} entries
              </span>
            </div>

            {accountTransactions.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">No transactions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0B0F17] text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-medium">Description</th>
                      <th className="py-3 px-4 font-medium">Approved By</th>
                      <th className="py-3 px-4 font-medium">Time</th>
                      <th className="py-3 px-4 font-medium text-right">Coins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {accountTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-200">{tx.note}</td>
                        <td className="py-3 px-4 text-slate-400">{tx.actor}</td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-400 tabular-nums whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                            tx.amount >= 0 ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right: Sidebar Ad & Quick Summary */}
        <div className="lg:col-span-4 space-y-6">
          <AdSlotBanner slot={sidebarAd} onTrackClick={onTrackAdClick} compact />

          <div className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-3">
            <img
              src="/src/assets/images/emblem_tournament_cup_1794760595461.jpg"
              alt="BooyahArena championship crest"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-700"
            />
            <h3 className="text-xl font-bold text-white">How Coin Top-Ups Work</h3>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Copy your Unique Account ID ({activeAccount.accountCode}).</li>
              <li>Message Admin on WhatsApp {whatsappNumber}.</li>
              <li>Admin credits coins from Blogger.com Admin Console.</li>
              <li>Your balance updates in real time with a live alert.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
