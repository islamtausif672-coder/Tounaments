import fs from 'node:fs';
import path from 'node:path';
import type {
  AdSlot,
  AppBootstrapState,
  BloggerConfig,
  CoinTopupRequest,
  CoinTransaction,
  MatchNotification,
  Tournament,
  UserAccount,
} from '../src/types';
import { ADMIN_WHATSAPP_NUMBER } from '../src/utils/tournamentLogic';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export function createSeedState(): AppBootstrapState {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const inFourHours = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const inSixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const accounts: UserAccount[] = [
    {
      id: 'acc_seed_1',
      accountCode: 'FF-849201',
      playerName: 'ShadowHunter',
      ffUid: '2849104721',
      whatsappPhone: '+8801711223344',
      coins: 250,
      matchesPlayed: 4,
      wins: 1,
      createdAt: yesterday,
    },
    {
      id: 'acc_seed_2',
      accountCode: 'FF-530194',
      playerName: 'ViperSquadBD',
      ffUid: '3910482710',
      whatsappPhone: '+8801819001122',
      coins: 120,
      matchesPlayed: 2,
      wins: 0,
      createdAt: yesterday,
    },
    {
      id: 'acc_seed_3',
      accountCode: 'FF-774120',
      playerName: 'CrimsonEagle',
      ffUid: '1940284711',
      whatsappPhone: '+8801912334455',
      coins: 40,
      matchesPlayed: 6,
      wins: 2,
      createdAt: yesterday,
    },
  ];

  const tournaments: Tournament[] = [
    {
      id: 'trn_bermuda_squad',
      title: 'Bermuda Pro Squad Cup',
      mode: 'Squad',
      map: 'Bermuda',
      entryCoins: 50,
      prizePool: 1200,
      perKillCoins: 15,
      maxSlots: 48,
      startTime: inTwoHours,
      status: 'open',
      rules:
        'Mobile players only. No emulators, no teaming, and no grenade spam in final zone. Screen recording required for prize claims.',
      roomId: '',
      roomPassword: '',
      roomPublishedAt: null,
      participants: [
        {
          accountCode: 'FF-530194',
          playerName: 'ViperSquadBD',
          ffUid: '3910482710',
          squadName: 'Viper Four',
          joinedAt: yesterday,
        },
        {
          accountCode: 'FF-774120',
          playerName: 'CrimsonEagle',
          ffUid: '1940284711',
          squadName: 'Crimson Ops',
          joinedAt: yesterday,
        },
      ],
      winnerCode: null,
      bannerKey: 'bermuda',
      createdAt: yesterday,
    },
    {
      id: 'trn_kalahari_solo',
      title: 'Kalahari Solo Headshot Blitz',
      mode: 'Solo',
      map: 'Kalahari',
      entryCoins: 30,
      prizePool: 600,
      perKillCoins: 10,
      maxSlots: 48,
      startTime: inFourHours,
      status: 'open',
      rules:
        'Single elimination custom room. Level 40+ Free Fire accounts only. Room ID & Password unlock 15 minutes before start.',
      roomId: '',
      roomPassword: '',
      roomPublishedAt: null,
      participants: [
        {
          accountCode: 'FF-849201',
          playerName: 'ShadowHunter',
          ffUid: '2849104721',
          joinedAt: yesterday,
        },
      ],
      winnerCode: null,
      bannerKey: 'kalahari',
      createdAt: yesterday,
    },
    {
      id: 'trn_clash_4v4',
      title: 'Purgatory Clash Squad 4v4',
      mode: 'Clash Squad',
      map: 'Purgatory',
      entryCoins: 80,
      prizePool: 1600,
      perKillCoins: 20,
      maxSlots: 16,
      startTime: inSixHours,
      status: 'open',
      rules:
        'Best of 7 rounds, limited ammo ON, character skills ON, gun attributes OFF for fair competitive play.',
      roomId: '',
      roomPassword: '',
      roomPublishedAt: null,
      participants: [],
      winnerCode: null,
      bannerKey: 'hero',
      createdAt: yesterday,
    },
    {
      id: 'trn_evening_duo',
      title: 'Nexterra Duo Showdown',
      mode: 'Duo',
      map: 'Nexterra',
      entryCoins: 40,
      prizePool: 800,
      perKillCoins: 12,
      maxSlots: 24,
      startTime: now.toISOString(),
      status: 'live',
      rules:
        'Duo custom lobby active now. Check My Matches for published Room ID and Password.',
      roomId: '88492017',
      roomPassword: 'BOOYAH99',
      roomPublishedAt: now.toISOString(),
      participants: [
        {
          accountCode: 'FF-849201',
          playerName: 'ShadowHunter',
          ffUid: '2849104721',
          squadName: 'Shadow Duo',
          joinedAt: yesterday,
        },
        {
          accountCode: 'FF-530194',
          playerName: 'ViperSquadBD',
          ffUid: '3910482710',
          squadName: 'Viper Duo',
          joinedAt: yesterday,
        },
      ],
      winnerCode: null,
      bannerKey: 'bermuda',
      createdAt: yesterday,
    },
  ];

  const transactions: CoinTransaction[] = [
    {
      id: 'tx_1',
      accountCode: 'FF-849201',
      amount: 320,
      type: 'admin_credit',
      note: 'WhatsApp Top-up Confirmed (+8801540097494)',
      actor: 'Blogger Admin',
      createdAt: yesterday,
    },
    {
      id: 'tx_2',
      accountCode: 'FF-849201',
      amount: -30,
      type: 'entry_fee',
      note: 'Joined Kalahari Solo Headshot Blitz',
      actor: 'System',
      createdAt: yesterday,
    },
    {
      id: 'tx_3',
      accountCode: 'FF-849201',
      amount: -40,
      type: 'entry_fee',
      note: 'Joined Nexterra Duo Showdown',
      actor: 'System',
      createdAt: yesterday,
    },
  ];

  const topupRequests: CoinTopupRequest[] = [
    {
      id: 'req_1',
      accountCode: 'FF-530194',
      playerName: 'ViperSquadBD',
      ffUid: '3910482710',
      requestedCoins: 500,
      status: 'pending',
      createdAt: now.toISOString(),
    },
  ];

  const adSlots: AdSlot[] = [
    {
      id: 'ad_top',
      placement: 'top_leaderboard',
      label: 'Header Leaderboard (728x90 / Mobile 320x50)',
      network: 'Custom Banner',
      enabled: true,
      htmlCode: '',
      sponsorTitle: 'Pro Gaming Trigger & Finger Sleeve Gear — 30% Off',
      sponsorDescription:
        'Paste your Google AdSense, Adsterra, or custom HTML script here inside Admin to monetize every page view.',
      sponsorCta: 'Visit Sponsor',
      sponsorUrl: 'https://blogger.com',
      impressions: 1420,
      clicks: 84,
    },
    {
      id: 'ad_feed',
      placement: 'in_feed_native',
      label: 'In-Feed Tournament Native Ad',
      network: 'AdSense',
      enabled: true,
      htmlCode: '',
      sponsorTitle: 'Instant Diamond & Gear Store — Partner Offer',
      sponsorDescription:
        'Monetize tournament traffic between match cards with responsive AdSense or Adsterra native units.',
      sponsorCta: 'Explore Offer',
      sponsorUrl: 'https://blogger.com',
      impressions: 980,
      clicks: 51,
    },
    {
      id: 'ad_side',
      placement: 'sidebar_card',
      label: 'Wallet & Blogger Export Rectangle (300x250)',
      network: 'Adsterra',
      enabled: true,
      htmlCode: '',
      sponsorTitle: '120Hz Esports Cooling Fan for Mobile Squads',
      sponsorDescription:
        'Keep frame drops away during final Bermuda circles. Zero-lag magnetic clip.',
      sponsorCta: 'Shop Gear',
      sponsorUrl: 'https://blogger.com',
      impressions: 615,
      clicks: 33,
    },
  ];

  const notifications: MatchNotification[] = [
    {
      id: 'notif_1',
      targetAccountCode: 'FF-849201',
      category: 'room',
      title: 'Room Credentials Live — Nexterra Duo Showdown',
      message: 'Room ID 88492017 and Password BOOYAH99 are now unlocked in My Matches.',
      tournamentId: 'trn_evening_duo',
      createdAt: now.toISOString(),
      readBy: [],
    },
    {
      id: 'notif_2',
      targetAccountCode: 'ALL',
      category: 'match',
      title: 'Bermuda Pro Squad Cup Registration Open',
      message: 'Entry 50 Coins · Prize Pool 1,200 Coins. Join before all 48 slots fill.',
      tournamentId: 'trn_bermuda_squad',
      createdAt: yesterday,
      readBy: [],
    },
  ];

  const bloggerConfig: BloggerConfig = {
    blogTitle: 'BooyahArena — Official Free Fire Tournaments',
    blogUrl: 'https://booyaharena-ff.blogspot.com',
    adminWhatsapp: ADMIN_WHATSAPP_NUMBER,
    apiSyncUrl: '',
    coinFeedLabel: 'coin-ledger',
    customNotice:
      'Coin top-ups are verified exclusively by Admin via WhatsApp +8801540097494 using your Unique Account ID.',
  };

  return {
    tournaments,
    accounts,
    transactions,
    topupRequests,
    adSlots,
    notifications,
    bloggerConfig,
  };
}

export class AppStore {
  private state: AppBootstrapState;

  constructor() {
    this.state = this.load();
  }

  private load(): AppBootstrapState {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as AppBootstrapState;
        if (parsed && Array.isArray(parsed.tournaments) && Array.isArray(parsed.accounts)) {
          return parsed;
        }
      }
    } catch {
      // Fall back to deterministic seed state
    }

    const seed = createSeedState();
    this.save(seed);
    return seed;
  }

  public getState(): AppBootstrapState {
    return this.state;
  }

  public save(next?: AppBootstrapState): void {
    if (next) {
      this.state = next;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
  }
}
