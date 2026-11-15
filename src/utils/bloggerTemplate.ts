import type { AdSlot, BloggerConfig, Tournament } from '../types';
import { ADMIN_WHATSAPP_NUMBER, sanitizeWhatsappDigits } from './tournamentLogic';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAdSnippet(slot: AdSlot | undefined): string {
  if (!slot || !slot.enabled) {
    return '<!-- Ad slot disabled by Blogger Admin -->';
  }
  if (slot.htmlCode.trim()) {
    return slot.htmlCode.trim();
  }
  return `<div class="ba-ad-box">
  <div class="ba-ad-meta">Sponsored · ${escapeHtml(slot.network)}</div>
  <div class="ba-ad-title">${escapeHtml(slot.sponsorTitle)}</div>
  <p class="ba-ad-desc">${escapeHtml(slot.sponsorDescription)}</p>
  <a class="ba-ad-btn" href="${escapeHtml(slot.sponsorUrl || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(slot.sponsorCta || 'Learn More')}</a>
</div>`;
}

export function generateBloggerStandaloneHtml(params: {
  config: BloggerConfig;
  tournaments: Tournament[];
  adSlots: AdSlot[];
}): string {
  const { config, tournaments, adSlots } = params;
  const whatsapp = config.adminWhatsapp || ADMIN_WHATSAPP_NUMBER;
  const whatsappDigits = sanitizeWhatsappDigits(whatsapp);
  const topAd = adSlots.find((s) => s.placement === 'top_leaderboard');
  const feedAd = adSlots.find((s) => s.placement === 'in_feed_native');
  const sideAd = adSlots.find((s) => s.placement === 'sidebar_card');

  const safeTournamentsJson = JSON.stringify(
    tournaments.map((t) => ({
      id: t.id,
      title: t.title,
      mode: t.mode,
      map: t.map,
      entryCoins: t.entryCoins,
      prizePool: t.prizePool,
      maxSlots: t.maxSlots,
      joined: t.participants.length,
      startTime: t.startTime,
      status: t.status,
      rules: t.rules,
      roomId: t.roomPublishedAt ? t.roomId : '',
      roomPassword: t.roomPublishedAt ? t.roomPassword : '',
    })),
  ).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.blogTitle || 'BooyahArena Free Fire Tournaments')}</title>
  <style>
    :root { --bg: #0b0f17; --surface: #141a26; --border: #263042; --text: #f1f5f9; --muted: #94a3b8; --accent: #ea580c; --ok: #16a34a; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
    .ba-wrap { max-width: 1120px; margin: 0 auto; padding: 16px; }
    .ba-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
    .ba-brand { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .ba-nav { display: flex; flex-wrap: wrap; gap: 8px; }
    .ba-tab { background: transparent; color: var(--muted); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; min-height: 44px; }
    .ba-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .ba-account-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin: 16px 0; }
    .ba-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .ba-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; margin-top: 16px; }
    .ba-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .ba-btn { background: var(--accent); color: #fff; border: 0; border-radius: 8px; padding: 10px 16px; font-weight: 600; cursor: pointer; min-height: 44px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .ba-btn-sec { background: #1e293b; color: #f8fafc; border: 1px solid var(--border); }
    .ba-input { width: 100%; background: #0b0f17; color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; min-height: 44px; }
    .ba-ad-slot { margin: 16px 0; }
    .ba-ad-box { background: #111827; border: 1px dashed #334155; border-radius: 10px; padding: 14px; }
    .ba-ad-meta { font-size: 11px; color: var(--muted); }
    .ba-ad-title { font-weight: 700; margin: 4px 0; }
    .ba-ad-desc { font-size: 13px; color: var(--muted); margin: 0 0 10px; }
    .ba-ad-btn { display: inline-block; background: #1e293b; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .ba-toast { position: fixed; bottom: 16px; right: 16px; max-width: 340px; background: #1e293b; border: 1px solid var(--accent); color: #fff; padding: 12px 14px; border-radius: 10px; display: none; z-index: 99; }
    .ba-hidden { display: none; }
  </style>
</head>
<body>
  <div class="ba-wrap">
    <header class="ba-header">
      <div class="ba-brand">${escapeHtml(config.blogTitle || 'BooyahArena')}</div>
      <nav class="ba-nav" aria-label="Primary">
        <button class="ba-tab active" onclick="baSwitchView('tournaments', this)">Tournaments</button>
        <button class="ba-tab" onclick="baSwitchView('wallet', this)">Coins &amp; ID</button>
        <button class="ba-tab" onclick="baSwitchView('matches', this)">My Matches</button>
      </nav>
    </header>

    <div class="ba-ad-slot">${renderAdSnippet(topAd)}</div>

    <section class="ba-account-bar">
      <div>
        <div style="font-size:12px;color:var(--muted);">Unique Account ID Code</div>
        <div class="ba-mono" style="font-size:18px;font-weight:700;" id="baAccountCode">FF-000000</div>
      </div>
      <div>
        <div style="font-size:12px;color:var(--muted);">Wallet Balance</div>
        <div class="ba-mono" style="font-size:18px;font-weight:700;" id="baCoinBalance">0 Coins</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="ba-btn ba-btn-sec" onclick="baSyncBloggerCoins()">Sync Blogger Admin Coins</button>
        <a class="ba-btn" id="baWhatsappLink" href="https://wa.me/${whatsappDigits}" target="_blank" rel="noopener noreferrer">Add Coins (${escapeHtml(whatsapp)})</a>
      </div>
    </section>

    <main id="baViewTournaments">
      <div class="ba-grid" id="baTournamentGrid"></div>
      <div class="ba-ad-slot">${renderAdSnippet(feedAd)}</div>
    </main>

    <section id="baViewWallet" class="ba-hidden">
      <div class="ba-card">
        <h2 style="margin:0;">Account &amp; Coin Top-Up via WhatsApp</h2>
        <p style="color:var(--muted);margin:0;">Every player account receives a permanent Unique ID Code. Only the Blogger.com Admin can credit coins after confirming your payment on WhatsApp <strong>${escapeHtml(whatsapp)}</strong>.</p>
        <label>Player IGN <input class="ba-input" id="baIgnInput" placeholder="Enter Free Fire IGN" /></label>
        <label>Free Fire UID <input class="ba-input" id="baUidInput" placeholder="Enter Free Fire UID" /></label>
        <label>Coins to Request
          <select class="ba-input" id="baCoinsSelect" onchange="baUpdateWhatsapp()">
            <option value="100">100 Coins</option>
            <option value="250" selected>250 Coins</option>
            <option value="500">500 Coins</option>
            <option value="1000">1000 Coins</option>
          </select>
        </label>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="ba-btn ba-btn-sec" onclick="baSaveProfile()">Save Player Profile</button>
          <a class="ba-btn" id="baWhatsappOrderBtn" href="https://wa.me/${whatsappDigits}" target="_blank" rel="noopener noreferrer">Message Admin on WhatsApp</a>
        </div>
      </div>
      <div class="ba-ad-slot">${renderAdSnippet(sideAd)}</div>
    </section>

    <section id="baViewMatches" class="ba-hidden">
      <div class="ba-grid" id="baMyMatchesGrid"></div>
    </section>
  </div>

  <div class="ba-toast" id="baToast"></div>

  <script>
    (function () {
      var STORAGE_KEY = 'booyah_blogger_state_v1';
      var SEED_TOURNAMENTS = ${safeTournamentsJson};
      var BLOGGER_FEED_URL = ${JSON.stringify(
        `${(config.blogUrl || '').replace(/\/$/, '')}/feeds/posts/default/-/${encodeURIComponent(config.coinFeedLabel || 'coin-ledger')}?alt=json`,
      )};
      var API_SYNC_URL = ${JSON.stringify(config.apiSyncUrl || '')};
      var WHATSAPP_DIGITS = ${JSON.stringify(whatsappDigits)};

      function loadState() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        var code = 'FF-' + Math.floor(100000 + Math.random() * 900000);
        var fresh = { accountCode: code, ign: 'Survivor', uid: '', coins: 0, joinedIds: [], appliedLedgerIds: [] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }

      var state = loadState();
      function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      function showToast(msg) {
        var el = document.getElementById('baToast');
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(function () { el.style.display = 'none'; }, 4000);
      }

      window.baUpdateWhatsapp = function () {
        var coins = document.getElementById('baCoinsSelect').value || '250';
        var msg = 'Hello Admin, please add ' + coins + ' Coins.\\nUnique Account ID: ' + state.accountCode + '\\nIGN: ' + (state.ign || 'Player') + '\\nUID: ' + (state.uid || 'N/A');
        var url = 'https://wa.me/' + WHATSAPP_DIGITS + '?text=' + encodeURIComponent(msg);
        document.getElementById('baWhatsappLink').href = url;
        document.getElementById('baWhatsappOrderBtn').href = url;
      };

      window.baSaveProfile = function () {
        state.ign = document.getElementById('baIgnInput').value.trim() || 'Survivor';
        state.uid = document.getElementById('baUidInput').value.trim();
        saveState();
        baUpdateWhatsapp();
        showToast('Profile saved for ' + state.accountCode);
      };

      window.baJoinTournament = function (id) {
        var match = SEED_TOURNAMENTS.find(function (t) { return t.id === id; });
        if (!match) return;
        if (state.joinedIds.indexOf(id) !== -1) { showToast('Already joined.'); return; }
        if (state.coins < match.entryCoins) { showToast('Need ' + (match.entryCoins - state.coins) + ' more coins. Contact WhatsApp ' + ${JSON.stringify(whatsapp)}); return; }
        state.coins -= match.entryCoins;
        state.joinedIds.push(id);
        match.joined += 1;
        saveState();
        renderAll();
        showToast('Joined ' + match.title + '!');
      };

      window.baSyncBloggerCoins = function () {
        var target = API_SYNC_URL ? (API_SYNC_URL.replace(/\\/$/, '') + '/api/bootstrap') : BLOGGER_FEED_URL;
        fetch(target).then(function (r) { return r.json(); }).then(function (data) {
          var entries = (data.feed && data.feed.entry) || [];
          var credited = 0;
          entries.forEach(function (entry) {
            var entryId = (entry.id && entry.id.$t) || '';
            var text = ((entry.title && entry.title.$t) || '') + ' ' + ((entry.content && entry.content.$t) || '');
            if (text.indexOf(state.accountCode) !== -1 && state.appliedLedgerIds.indexOf(entryId) === -1) {
              var m = text.match(/\\+(\\d+)\\s*COINS/i);
              if (m) {
                state.coins += parseInt(m[1], 10);
                state.appliedLedgerIds.push(entryId);
                credited += parseInt(m[1], 10);
              }
            }
          });
          saveState();
          renderAll();
          showToast(credited > 0 ? ('Admin credited +' + credited + ' Coins!') : 'Synced with Blogger Admin ledger.');
        }).catch(function () {
          showToast('Configure your Blogger URL to enable live Blogger JSON feed sync.');
        });
      };

      window.baSwitchView = function (view, btn) {
        document.getElementById('baViewTournaments').classList.toggle('ba-hidden', view !== 'tournaments');
        document.getElementById('baViewWallet').classList.toggle('ba-hidden', view !== 'wallet');
        document.getElementById('baViewMatches').classList.toggle('ba-hidden', view !== 'matches');
        document.querySelectorAll('.ba-tab').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
      };

      function renderAll() {
        document.getElementById('baAccountCode').textContent = state.accountCode;
        document.getElementById('baCoinBalance').textContent = state.coins + ' Coins';
        document.getElementById('baIgnInput').value = state.ign || '';
        document.getElementById('baUidInput').value = state.uid || '';
        baUpdateWhatsapp();

        var grid = document.getElementById('baTournamentGrid');
        grid.innerHTML = SEED_TOURNAMENTS.map(function (t) {
          var joined = state.joinedIds.indexOf(t.id) !== -1;
          return '<article class="ba-card">' +
            '<div style="font-size:12px;color:var(--muted);">' + t.mode + ' · ' + t.map + ' · ' + t.status.toUpperCase() + '</div>' +
            '<h3 style="margin:0;">' + t.title + '</h3>' +
            '<div class="ba-mono" style="font-size:13px;">Entry: ' + t.entryCoins + ' Coins · Prize: ' + t.prizePool + ' Coins · Slots: ' + t.joined + '/' + t.maxSlots + '</div>' +
            '<button class="ba-btn" onclick="baJoinTournament(\\'' + t.id + '\\')">' + (joined ? 'Joined' : 'Join (' + t.entryCoins + ' Coins)') + '</button>' +
          '</article>';
        }).join('');

        var myGrid = document.getElementById('baMyMatchesGrid');
        var mine = SEED_TOURNAMENTS.filter(function (t) { return state.joinedIds.indexOf(t.id) !== -1; });
        myGrid.innerHTML = mine.length ? mine.map(function (t) {
          return '<article class="ba-card"><h3>' + t.title + '</h3><div class="ba-mono">Room ID: ' + (t.roomId || 'Pending Admin Publish') + '</div><div class="ba-mono">Password: ' + (t.roomPassword || 'Pending') + '</div></article>';
        }).join('') : '<div class="ba-card">No tournaments joined yet.</div>';
      }

      renderAll();
      setInterval(baSyncBloggerCoins, 30000);
    })();
  </script>
</body>
</html>`;
}

export function generateBloggerXmlTheme(params: {
  config: BloggerConfig;
  tournaments: Tournament[];
  adSlots: AdSlot[];
}): string {
  const htmlBody = generateBloggerStandaloneHtml(params);
  const bodyMatch = htmlBody.match(/<body>([\s\S]*)<\/body>/i);
  const innerBody = bodyMatch ? bodyMatch[1] : htmlBody;
  const styleMatch = htmlBody.match(/<style>([\s\S]*?)<\/style>/i);
  const cssContent = styleMatch ? styleMatch[1] : '';

  return `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsVersion='3' b:responsive='true' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
  <meta charset='UTF-8'/>
  <meta content='width=device-width, initial-scale=1.0' name='viewport'/>
  <title><data:blog.pageTitle/></title>
  <b:skin><![CDATA[
${cssContent}
  ]]></b:skin>
</head>
<body>
  <b:section id='main-tournaments' maxwidgets='5' showaddelement='yes'>
    <b:widget id='HTML1' locked='false' title='BooyahArena Core' type='HTML' version='2' visible='true'>
      <b:widget-settings>
        <b:widget-setting name='content'><![CDATA[
${innerBody}
        ]]></b:widget-setting>
      </b:widget-settings>
      <b:includable id='main'>
        <data:content/>
      </b:includable>
    </b:widget>
  </b:section>
</body>
</html>`;
}
