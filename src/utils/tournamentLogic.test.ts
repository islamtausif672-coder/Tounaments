import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_WHATSAPP_NUMBER,
  applyCoinAdjustment,
  buildWhatsAppCoinUrl,
  calculatePrizeSplit,
  canJoinTournament,
  generateUniqueAccountCode,
} from './tournamentLogic';
import { generateBloggerStandaloneHtml, generateBloggerXmlTheme } from './bloggerTemplate';

test('generateUniqueAccountCode creates collision-free FF-XXXXXX codes', () => {
  const existing = new Set(['FF-100001', 'FF-100002']);
  const code = generateUniqueAccountCode(existing, 1);
  assert.match(code, /^FF-\d{6}$/);
  assert.equal(existing.has(code), false);
});

test('buildWhatsAppCoinUrl encodes +8801540097494 and unique account code', () => {
  const url = buildWhatsAppCoinUrl({
    phone: ADMIN_WHATSAPP_NUMBER,
    accountCode: 'FF-849201',
    playerName: 'ShadowKing',
    ffUid: '294810294',
    coins: 250,
  });
  assert.ok(url.startsWith('https://wa.me/8801540097494?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('FF-849201'));
  assert.ok(decoded.includes('250'));
  assert.ok(decoded.includes('ShadowKing'));
});

test('canJoinTournament validates status, duplicate joins, slots, and coins', () => {
  const baseTournament = {
    status: 'open' as const,
    entryCoins: 50,
    maxSlots: 2,
    participants: [
      { accountCode: 'FF-111111', playerName: 'Alpha', ffUid: '101', joinedAt: '2026-11-15T08:00:00Z' },
    ],
  };

  assert.deepEqual(canJoinTournament({ accountCode: 'FF-849201', coins: 100 }, baseTournament), { ok: true });
  assert.equal(canJoinTournament({ accountCode: 'FF-111111', coins: 100 }, baseTournament).ok, false);
  assert.equal(canJoinTournament({ accountCode: 'FF-849201', coins: 20 }, baseTournament).ok, false);
  assert.equal(
    canJoinTournament(
      { accountCode: 'FF-849201', coins: 100 },
      { ...baseTournament, status: 'live' },
    ).ok,
    false,
  );
});

test('applyCoinAdjustment enforces admin-only access and non-negative balances', () => {
  assert.throws(
    () => applyCoinAdjustment({ currentCoins: 100, delta: 50, isAdmin: false }),
    /ADMIN_ONLY/,
  );
  assert.throws(
    () => applyCoinAdjustment({ currentCoins: 40, delta: -60, isAdmin: true }),
    /INSUFFICIENT_BALANCE/,
  );
  assert.equal(applyCoinAdjustment({ currentCoins: 100, delta: 150, isAdmin: true }), 250);
  assert.equal(applyCoinAdjustment({ currentCoins: 250, delta: -50, isAdmin: true }), 200);
});

test('calculatePrizeSplit splits prize pool into exact integer sum', () => {
  const split = calculatePrizeSplit(1000);
  assert.equal(split.first + split.second + split.third, 1000);
  assert.equal(split.first, 600);
});

test('Blogger template generators embed WhatsApp number, ad slots, and XML tags', () => {
  const config = {
    blogTitle: 'TestFF Blog',
    blogUrl: 'https://testff.blogspot.com',
    adminWhatsapp: '+8801540097494',
    apiSyncUrl: '',
    coinFeedLabel: 'coin-ledger',
    customNotice: 'Fair play only',
  };
  const html = generateBloggerStandaloneHtml({
    config,
    tournaments: [],
    adSlots: [
      {
        id: 'ad1',
        placement: 'top_leaderboard',
        label: 'Top Banner',
        network: 'AdSense',
        enabled: true,
        htmlCode: '<div class="adsense-unit">LIVE_ADSENSE_TAG</div>',
        sponsorTitle: '',
        sponsorDescription: '',
        sponsorCta: '',
        sponsorUrl: '',
        impressions: 0,
        clicks: 0,
      },
    ],
  });
  assert.ok(html.includes('8801540097494'));
  assert.ok(html.includes('LIVE_ADSENSE_TAG'));

  const xml = generateBloggerXmlTheme({ config, tournaments: [], adSlots: [] });
  assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8" ?>'));
  assert.ok(xml.includes('<b:skin>'));
  assert.ok(xml.includes('HTML1'));
});
