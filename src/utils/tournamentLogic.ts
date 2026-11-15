import type { Tournament, UserAccount } from '../types';

export const ADMIN_WHATSAPP_NUMBER = '+8801540097494';

export function generateUniqueAccountCode(existingCodes: Iterable<string>, seed?: number): string {
  const taken = new Set(Array.from(existingCodes).map((c) => c.toUpperCase()));
  let counter = 0;

  while (counter < 1000) {
    const num =
      typeof seed === 'number'
        ? ((Math.abs(Math.floor(seed)) + counter * 7919) % 900000) + 100000
        : Math.floor(100000 + Math.random() * 900000);
    const candidate = `FF-${num}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
    counter += 1;
  }

  return `FF-${Date.now().toString().slice(-6)}`;
}

export function sanitizeWhatsappDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function buildWhatsAppCoinMessage(params: {
  accountCode: string;
  playerName: string;
  ffUid: string;
  coins: number;
}): string {
  return [
    'Hello Admin, I want to add Coins to my BooyahArena account.',
    `Account Unique ID: ${params.accountCode}`,
    `Player IGN: ${params.playerName}`,
    `Free Fire UID: ${params.ffUid}`,
    `Requested Coins: ${params.coins}`,
  ].join('\n');
}

export function buildWhatsAppCoinUrl(params: {
  phone?: string;
  accountCode: string;
  playerName: string;
  ffUid: string;
  coins: number;
}): string {
  const digits = sanitizeWhatsappDigits(params.phone || ADMIN_WHATSAPP_NUMBER);
  const message = buildWhatsAppCoinMessage(params);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function canJoinTournament(
  account: Pick<UserAccount, 'accountCode' | 'coins'>,
  tournament: Pick<Tournament, 'status' | 'entryCoins' | 'maxSlots' | 'participants'>,
): { ok: boolean; reason?: string } {
  if (tournament.status !== 'open') {
    return { ok: false, reason: 'Registration is closed for this match.' };
  }

  const alreadyJoined = tournament.participants.some(
    (p) => p.accountCode.toUpperCase() === account.accountCode.toUpperCase(),
  );
  if (alreadyJoined) {
    return { ok: false, reason: 'You have already joined this tournament.' };
  }

  if (tournament.participants.length >= tournament.maxSlots) {
    return { ok: false, reason: 'All tournament slots are filled.' };
  }

  if (account.coins < tournament.entryCoins) {
    const needed = tournament.entryCoins - account.coins;
    return {
      ok: false,
      reason: `Insufficient coins. Need ${needed} more coins (contact WhatsApp ${ADMIN_WHATSAPP_NUMBER}).`,
    };
  }

  return { ok: true };
}

export function applyCoinAdjustment(params: {
  currentCoins: number;
  delta: number;
  isAdmin: boolean;
}): number {
  if (!params.isAdmin) {
    throw new Error('ADMIN_ONLY: Coin balance changes require Blogger Admin authorization.');
  }

  if (!Number.isFinite(params.delta) || params.delta === 0) {
    throw new Error('INVALID_AMOUNT: Coin delta must be a non-zero number.');
  }

  const next = Math.round(params.currentCoins + params.delta);
  if (next < 0) {
    throw new Error('INSUFFICIENT_BALANCE: Resulting coin balance cannot be negative.');
  }

  return next;
}

export function calculatePrizeSplit(prizePool: number): {
  first: number;
  second: number;
  third: number;
} {
  const safePool = Math.max(0, Math.round(prizePool));
  const first = Math.round(safePool * 0.6);
  const second = Math.round(safePool * 0.25);
  const third = safePool - first - second;
  return { first, second, third };
}

export function formatSlotPercent(joined: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((joined / max) * 100));
}
