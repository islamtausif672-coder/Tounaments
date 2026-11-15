import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { AppStore } from './server/store';
import type {
  AdSlot,
  BloggerConfig,
  CoinTopupRequest,
  CoinTransaction,
  MatchNotification,
  Tournament,
  TournamentMap,
  TournamentMode,
  TournamentStatus,
  UserAccount,
} from './src/types';
import {
  applyCoinAdjustment,
  canJoinTournament,
  generateUniqueAccountCode,
} from './src/utils/tournamentLogic';

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || 'admin123';

const store = new AppStore();
const adminTokens = new Set<string>();
const sseClients = new Set<express.Response>();

function broadcastEvent(event: string, payload: unknown): void {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(data);
    } catch {
      sseClients.delete(res);
    }
  }
}

function sanitizeTournamentForViewer(t: Tournament, viewerCode?: string): Tournament {
  const joined =
    Boolean(viewerCode) &&
    t.participants.some((p) => p.accountCode.toUpperCase() === viewerCode!.toUpperCase());
  if (joined || t.status === 'completed') {
    return t;
  }
  return {
    ...t,
    roomId: '',
    roomPassword: '',
  };
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const token = req.header('x-admin-token') || '';
  if (!token || !adminTokens.has(token)) {
    res.status(403).json({
      error: 'Admin access required. Only Blogger.com Admin can perform this action.',
    });
    return;
  }
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Real-time Server-Sent Events stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, time: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Bootstrap state (masks unjoined Room ID/Pass unless admin token is valid)
  app.get('/api/bootstrap', (req, res) => {
    const state = store.getState();
    const viewerCode = typeof req.query.accountCode === 'string' ? req.query.accountCode : '';
    const adminToken = req.header('x-admin-token') || '';
    const isAdmin = Boolean(adminToken && adminTokens.has(adminToken));

    res.json({
      ...state,
      tournaments: isAdmin
        ? state.tournaments
        : state.tournaments.map((t) => sanitizeTournamentForViewer(t, viewerCode)),
    });
  });

  // Create new player account with unique ID code (starts at 0 coins; only Admin can credit coins)
  app.post('/api/accounts', (req, res) => {
    const { playerName, ffUid, whatsappPhone } = req.body as {
      playerName?: string;
      ffUid?: string;
      whatsappPhone?: string;
    };

    const cleanName = (playerName || '').trim();
    const cleanUid = (ffUid || '').trim();
    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Player IGN must be at least 2 characters.' });
      return;
    }
    if (!cleanUid || !/^\d{6,14}$/.test(cleanUid)) {
      res.status(400).json({ error: 'Free Fire UID must be 6 to 14 digits.' });
      return;
    }

    const state = store.getState();
    const accountCode = generateUniqueAccountCode(state.accounts.map((a) => a.accountCode));
    const newAccount: UserAccount = {
      id: `acc_${crypto.randomUUID().slice(0, 8)}`,
      accountCode,
      playerName: cleanName,
      ffUid: cleanUid,
      whatsappPhone: (whatsappPhone || '').trim(),
      coins: 0,
      matchesPlayed: 0,
      wins: 0,
      createdAt: new Date().toISOString(),
    };

    state.accounts.unshift(newAccount);

    const welcomeNotif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: accountCode,
      category: 'system',
      title: `Account Created · ID ${accountCode}`,
      message:
        'Share your Unique Account ID on WhatsApp +8801540097494 with Admin to top up coins.',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(welcomeNotif);
    store.save();

    broadcastEvent('state_updated', { reason: 'account_created', notification: welcomeNotif });
    res.status(201).json(newAccount);
  });

  // Player submits a WhatsApp coin top-up request ticket (does NOT add coins; Admin must approve)
  app.post('/api/topup-requests', (req, res) => {
    const { accountCode, requestedCoins } = req.body as {
      accountCode?: string;
      requestedCoins?: number;
    };
    const state = store.getState();
    const account = state.accounts.find(
      (a) => a.accountCode.toUpperCase() === (accountCode || '').toUpperCase(),
    );
    if (!account) {
      res.status(404).json({ error: 'Account Unique ID not found.' });
      return;
    }
    const coins = Number(requestedCoins);
    if (!Number.isFinite(coins) || coins < 10) {
      res.status(400).json({ error: 'Requested coins must be at least 10.' });
      return;
    }

    const ticket: CoinTopupRequest = {
      id: `req_${crypto.randomUUID().slice(0, 8)}`,
      accountCode: account.accountCode,
      playerName: account.playerName,
      ffUid: account.ffUid,
      requestedCoins: Math.round(coins),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    state.topupRequests.unshift(ticket);
    store.save();
    broadcastEvent('state_updated', { reason: 'topup_requested' });
    res.status(201).json(ticket);
  });

  // Join tournament seamlessly with coin deduction
  app.post('/api/tournaments/:id/join', (req, res) => {
    const { accountCode, squadName } = req.body as {
      accountCode?: string;
      squadName?: string;
    };
    const state = store.getState();
    const tournament = state.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    const account = state.accounts.find(
      (a) => a.accountCode.toUpperCase() === (accountCode || '').toUpperCase(),
    );
    if (!account) {
      res.status(404).json({ error: 'Account Unique ID not found.' });
      return;
    }

    const eligibility = canJoinTournament(account, tournament);
    if (!eligibility.ok) {
      res.status(400).json({ error: eligibility.reason });
      return;
    }

    account.coins = applyCoinAdjustment({
      currentCoins: account.coins,
      delta: -tournament.entryCoins,
      isAdmin: true,
    });
    account.matchesPlayed += 1;

    tournament.participants.push({
      accountCode: account.accountCode,
      playerName: account.playerName,
      ffUid: account.ffUid,
      squadName: (squadName || '').trim() || undefined,
      joinedAt: new Date().toISOString(),
    });

    const tx: CoinTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 8)}`,
      accountCode: account.accountCode,
      amount: -tournament.entryCoins,
      type: 'entry_fee',
      note: `Joined ${tournament.title}`,
      actor: 'System',
      createdAt: new Date().toISOString(),
    };
    state.transactions.unshift(tx);

    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: account.accountCode,
      category: 'match',
      title: `Slot Confirmed — ${tournament.title}`,
      message: `Entry fee ${tournament.entryCoins} Coins deducted. You will receive a real-time alert when Room ID & Password are published.`,
      tournamentId: tournament.id,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();

    broadcastEvent('state_updated', {
      reason: 'tournament_joined',
      notification: notif,
    });
    res.json({
      tournament: sanitizeTournamentForViewer(tournament, account.accountCode),
      account,
      transaction: tx,
    });
  });

  // Mark notifications read
  app.post('/api/notifications/read', (req, res) => {
    const { accountCode } = req.body as { accountCode?: string };
    const code = (accountCode || '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ error: 'accountCode is required.' });
      return;
    }
    const state = store.getState();
    for (const notif of state.notifications) {
      if (
        (notif.targetAccountCode === 'ALL' || notif.targetAccountCode.toUpperCase() === code) &&
        !notif.readBy.includes(code)
      ) {
        notif.readBy.push(code);
      }
    }
    store.save();
    res.json({ ok: true });
  });

  // Track real ad slot click
  app.post('/api/ads/:id/click', (req, res) => {
    const state = store.getState();
    const slot = state.adSlots.find((s) => s.id === req.params.id);
    if (!slot) {
      res.status(404).json({ error: 'Ad slot not found.' });
      return;
    }
    slot.clicks += 1;
    store.save();
    res.json(slot);
  });

  // Blogger Admin Authentication
  app.post('/api/admin/login', (req, res) => {
    const { pin } = req.body as { pin?: string };
    if (!pin || pin !== ADMIN_PIN) {
      res.status(401).json({ error: 'Invalid Blogger Admin PIN.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.add(token);
    res.json({ token, role: 'blogger_admin' });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = req.header('x-admin-token') || '';
    if (token) adminTokens.delete(token);
    res.json({ ok: true });
  });

  // Admin-Only: Credit or deduct coins by Unique Account ID Code
  app.post('/api/admin/coins', requireAdmin, (req, res) => {
    const { accountCode, delta, note, requestId } = req.body as {
      accountCode?: string;
      delta?: number;
      note?: string;
      requestId?: string;
    };

    const state = store.getState();
    const account = state.accounts.find(
      (a) => a.accountCode.toUpperCase() === (accountCode || '').trim().toUpperCase(),
    );
    if (!account) {
      res.status(404).json({ error: 'No player account found with that Unique ID Code.' });
      return;
    }

    const numericDelta = Number(delta);
    try {
      account.coins = applyCoinAdjustment({
        currentCoins: account.coins,
        delta: numericDelta,
        isAdmin: true,
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Coin update failed.' });
      return;
    }

    if (requestId) {
      const reqItem = state.topupRequests.find((r) => r.id === requestId);
      if (reqItem) reqItem.status = 'approved';
    }

    const tx: CoinTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 8)}`,
      accountCode: account.accountCode,
      amount: Math.round(numericDelta),
      type: numericDelta > 0 ? 'admin_credit' : 'admin_debit',
      note:
        (note || '').trim() ||
        (numericDelta > 0
          ? 'Blogger Admin Coin Credit (+8801540097494)'
          : 'Blogger Admin Coin Adjustment'),
      actor: 'Blogger Admin',
      createdAt: new Date().toISOString(),
    };
    state.transactions.unshift(tx);

    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: account.accountCode,
      category: 'coins',
      title:
        numericDelta > 0
          ? `+${Math.round(numericDelta)} Coins Credited`
          : `${Math.round(numericDelta)} Coins Adjusted`,
      message: `${tx.note}. New balance: ${account.coins} Coins.`,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();

    broadcastEvent('state_updated', {
      reason: 'coins_adjusted',
      notification: notif,
    });
    res.json({ account, transaction: tx });
  });

  // Admin-Only: Dismiss topup request
  app.post('/api/admin/topup-requests/:id/dismiss', requireAdmin, (req, res) => {
    const state = store.getState();
    const item = state.topupRequests.find((r) => r.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }
    item.status = 'dismissed';
    store.save();
    broadcastEvent('state_updated', { reason: 'topup_dismissed' });
    res.json(item);
  });

  // Admin-Only: Create Tournament
  app.post('/api/admin/tournaments', requireAdmin, (req, res) => {
    const { title, mode, map, entryCoins, prizePool, perKillCoins, maxSlots, startTime, rules } =
      req.body as {
        title?: string;
        mode?: TournamentMode;
        map?: TournamentMap;
        entryCoins?: number;
        prizePool?: number;
        perKillCoins?: number;
        maxSlots?: number;
        startTime?: string;
        rules?: string;
      };

    if (!title || title.trim().length < 3) {
      res.status(400).json({ error: 'Tournament title must be at least 3 characters.' });
      return;
    }

    const state = store.getState();
    const bannerKey =
      map === 'Kalahari' ? 'kalahari' : map === 'Bermuda' ? 'bermuda' : 'hero';

    const created: Tournament = {
      id: `trn_${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      mode: mode || 'Squad',
      map: map || 'Bermuda',
      entryCoins: Math.max(0, Math.round(Number(entryCoins) || 0)),
      prizePool: Math.max(0, Math.round(Number(prizePool) || 0)),
      perKillCoins: Math.max(0, Math.round(Number(perKillCoins) || 0)),
      maxSlots: Math.max(2, Math.min(100, Math.round(Number(maxSlots) || 48))),
      startTime: startTime || new Date(Date.now() + 3600 * 1000).toISOString(),
      status: 'open',
      rules:
        (rules || '').trim() ||
        'Mobile devices only. Fair play enforced. Screenshots required for prize claims.',
      roomId: '',
      roomPassword: '',
      roomPublishedAt: null,
      participants: [],
      winnerCode: null,
      bannerKey,
      createdAt: new Date().toISOString(),
    };

    state.tournaments.unshift(created);
    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: 'ALL',
      category: 'match',
      title: `New Tournament: ${created.title}`,
      message: `${created.mode} on ${created.map} · Entry ${created.entryCoins} Coins · Prize ${created.prizePool} Coins.`,
      tournamentId: created.id,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();

    broadcastEvent('state_updated', {
      reason: 'tournament_created',
      notification: notif,
    });
    res.status(201).json(created);
  });

  // Admin-Only: Update Tournament status or details
  app.patch('/api/admin/tournaments/:id', requireAdmin, (req, res) => {
    const state = store.getState();
    const tournament = state.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    const { status, title, entryCoins, prizePool } = req.body as {
      status?: TournamentStatus;
      title?: string;
      entryCoins?: number;
      prizePool?: number;
    };

    if (status) tournament.status = status;
    if (title && title.trim()) tournament.title = title.trim();
    if (typeof entryCoins === 'number') tournament.entryCoins = Math.max(0, Math.round(entryCoins));
    if (typeof prizePool === 'number') tournament.prizePool = Math.max(0, Math.round(prizePool));

    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: 'ALL',
      category: 'match',
      title: `Match Status: ${tournament.title}`,
      message: `Tournament status updated to ${tournament.status.toUpperCase()}.`,
      tournamentId: tournament.id,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();

    broadcastEvent('state_updated', {
      reason: 'tournament_updated',
      notification: notif,
    });
    res.json(tournament);
  });

  // Admin-Only: Publish Room ID & Password (pushes instant notification)
  app.post('/api/admin/tournaments/:id/room', requireAdmin, (req, res) => {
    const { roomId, roomPassword, setLive } = req.body as {
      roomId?: string;
      roomPassword?: string;
      setLive?: boolean;
    };
    if (!roomId || !roomId.trim() || !roomPassword || !roomPassword.trim()) {
      res.status(400).json({ error: 'Both Room ID and Room Password are required.' });
      return;
    }

    const state = store.getState();
    const tournament = state.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    tournament.roomId = roomId.trim();
    tournament.roomPassword = roomPassword.trim();
    tournament.roomPublishedAt = new Date().toISOString();
    if (setLive) {
      tournament.status = 'live';
    }

    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: 'ALL',
      category: 'room',
      title: `Room Credentials Published — ${tournament.title}`,
      message: `Joined players can now view Room ID (${tournament.roomId}) and Password in My Matches.`,
      tournamentId: tournament.id,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();

    broadcastEvent('state_updated', {
      reason: 'room_published',
      notification: notif,
    });
    res.json(tournament);
  });

  // Admin-Only: Declare winner and award prize coins
  app.post('/api/admin/tournaments/:id/winner', requireAdmin, (req, res) => {
    const { winnerAccountCode, prizeCoins } = req.body as {
      winnerAccountCode?: string;
      prizeCoins?: number;
    };
    const state = store.getState();
    const tournament = state.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }

    const account = state.accounts.find(
      (a) => a.accountCode.toUpperCase() === (winnerAccountCode || '').trim().toUpperCase(),
    );
    if (!account) {
      res.status(404).json({ error: 'Winner Unique Account ID not found.' });
      return;
    }

    const reward = Math.max(1, Math.round(Number(prizeCoins) || tournament.prizePool));
    account.coins = applyCoinAdjustment({
      currentCoins: account.coins,
      delta: reward,
      isAdmin: true,
    });
    account.wins += 1;

    tournament.winnerCode = account.accountCode;
    tournament.status = 'completed';

    const tx: CoinTransaction = {
      id: `tx_${crypto.randomUUID().slice(0, 8)}`,
      accountCode: account.accountCode,
      amount: reward,
      type: 'prize_payout',
      note: `Booyah Winner Prize — ${tournament.title}`,
      actor: 'Blogger Admin',
      createdAt: new Date().toISOString(),
    };
    state.transactions.unshift(tx);

    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: 'ALL',
      category: 'winner',
      title: `Winner Announced — ${tournament.title}`,
      message: `${account.playerName} (${account.accountCode}) won ${reward} Coins!`,
      tournamentId: tournament.id,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();

    broadcastEvent('state_updated', {
      reason: 'winner_declared',
      notification: notif,
    });
    res.json({ tournament, account, transaction: tx });
  });

  // Admin-Only: Delete Tournament
  app.delete('/api/admin/tournaments/:id', requireAdmin, (req, res) => {
    const state = store.getState();
    const idx = state.tournaments.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Tournament not found.' });
      return;
    }
    state.tournaments.splice(idx, 1);
    store.save();
    broadcastEvent('state_updated', { reason: 'tournament_deleted' });
    res.json({ ok: true });
  });

  // Admin-Only: Update Ad Slot
  app.put('/api/admin/ads/:id', requireAdmin, (req, res) => {
    const state = store.getState();
    const slot = state.adSlots.find((s) => s.id === req.params.id);
    if (!slot) {
      res.status(404).json({ error: 'Ad slot not found.' });
      return;
    }
    const body = req.body as Partial<AdSlot>;
    if (typeof body.enabled === 'boolean') slot.enabled = body.enabled;
    if (body.network) slot.network = body.network;
    if (typeof body.htmlCode === 'string') slot.htmlCode = body.htmlCode;
    if (typeof body.sponsorTitle === 'string') slot.sponsorTitle = body.sponsorTitle;
    if (typeof body.sponsorDescription === 'string')
      slot.sponsorDescription = body.sponsorDescription;
    if (typeof body.sponsorCta === 'string') slot.sponsorCta = body.sponsorCta;
    if (typeof body.sponsorUrl === 'string') slot.sponsorUrl = body.sponsorUrl;

    store.save();
    broadcastEvent('state_updated', { reason: 'ad_updated' });
    res.json(slot);
  });

  // Admin-Only: Update Blogger.com Export Config
  app.put('/api/admin/blogger-config', requireAdmin, (req, res) => {
    const state = store.getState();
    const body = req.body as Partial<BloggerConfig>;
    state.bloggerConfig = {
      ...state.bloggerConfig,
      ...body,
    };
    store.save();
    broadcastEvent('state_updated', { reason: 'blogger_config_updated' });
    res.json(state.bloggerConfig);
  });

  // Admin-Only: Send custom real-time announcement notification
  app.post('/api/admin/notifications', requireAdmin, (req, res) => {
    const { title, message, targetAccountCode } = req.body as {
      title?: string;
      message?: string;
      targetAccountCode?: string;
    };
    if (!title || !title.trim() || !message || !message.trim()) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }
    const state = store.getState();
    const notif: MatchNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      targetAccountCode: (targetAccountCode || 'ALL').trim() || 'ALL',
      category: 'system',
      title: title.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    state.notifications.unshift(notif);
    store.save();
    broadcastEvent('state_updated', {
      reason: 'admin_announcement',
      notification: notif,
    });
    res.status(201).json(notif);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BooyahArena server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
