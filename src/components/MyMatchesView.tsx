import { useState } from 'react';
import { Check, Copy, Lock, Swords } from 'lucide-react';
import type { Tournament, UserAccount } from '../types';

interface MyMatchesViewProps {
  tournaments: Tournament[];
  activeAccount: UserAccount | null;
  onBrowseTournaments: () => void;
}

export function MyMatchesView({
  tournaments,
  activeAccount,
  onBrowseTournaments,
}: MyMatchesViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const joinedMatches = activeAccount
    ? tournaments.filter((t) =>
        t.participants.some(
          (p) => p.accountCode.toUpperCase() === activeAccount.accountCode.toUpperCase(),
        ),
      )
    : [];

  const copyValue = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Joined Matches</h1>
          <p className="text-sm text-slate-400 mt-1">
            Room ID and Password appear automatically here once Blogger Admin publishes them.
          </p>
        </div>
        {activeAccount && (
          <div className="font-mono text-xs text-slate-300 tabular-nums">
            Player ID: <span className="text-orange-400 font-semibold">{activeAccount.accountCode}</span>
          </div>
        )}
      </div>

      {joinedMatches.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#121824] p-10 text-center">
          <Swords className="w-10 h-10 text-slate-500 mx-auto" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold text-white">No Joined Tournaments Yet</h2>
          <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
            Join an open Solo, Duo, or Squad match from the lobby to unlock custom room credentials
            and live updates.
          </p>
          <button
            type="button"
            onClick={onBrowseTournaments}
            className="mt-5 px-5 py-2.5 min-h-[44px] rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
          >
            Browse Open Tournaments
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {joinedMatches.map((match) => {
            const hasRoom = Boolean(match.roomPublishedAt && match.roomId);
            return (
              <article
                key={match.id}
                className="rounded-2xl border border-slate-800 bg-[#121824] p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400">
                      {match.mode} <span aria-hidden="true">·</span> {match.map}{' '}
                      <span aria-hidden="true">·</span>{' '}
                      <span className="capitalize text-orange-400 font-medium">{match.status}</span>
                    </div>
                    <h2 className="mt-1 text-2xl font-bold text-white">{match.title}</h2>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300 tabular-nums shrink-0">
                    Prize {match.prizePool} Coins
                  </div>
                </div>

                {hasRoom ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                    <div className="text-xs font-semibold text-emerald-300">
                      Custom Room Credentials Live
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#0B0F17] border border-slate-800 px-3 py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-slate-400">Room ID</div>
                          <div className="font-mono text-base font-semibold text-white tabular-nums">
                            {match.roomId}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyValue(`${match.id}_id`, match.roomId)}
                          aria-label={`Copy Room ID for ${match.title}`}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          {copiedField === `${match.id}_id` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="rounded-lg bg-[#0B0F17] border border-slate-800 px-3 py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-slate-400">Password</div>
                          <div className="font-mono text-base font-semibold text-white tabular-nums">
                            {match.roomPassword}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyValue(`${match.id}_pw`, match.roomPassword)}
                          aria-label={`Copy Room Password for ${match.title}`}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          {copiedField === `${match.id}_pw` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 flex items-center gap-3 text-sm text-slate-300">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>
                      Room ID &amp; Password will unlock here automatically with a live alert before
                      match start.
                    </span>
                  </div>
                )}

                <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span>
                    Starts:{' '}
                    {new Date(match.startTime).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="font-mono tabular-nums">
                    {match.participants.length}/{match.maxSlots} Players
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
