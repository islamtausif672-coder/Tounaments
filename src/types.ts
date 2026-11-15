export type TournamentMode = 'Solo' | 'Duo' | 'Squad' | 'Clash Squad';
export type TournamentMap = 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Nexterra';
export type TournamentStatus = 'open' | 'live' | 'completed';

export interface TournamentParticipant {
  accountCode: string;
  playerName: string;
  ffUid: string;
  squadName?: string;
  joinedAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  mode: TournamentMode;
  map: TournamentMap;
  entryCoins: number;
  prizePool: number;
  perKillCoins: number;
  maxSlots: number;
  startTime: string;
  status: TournamentStatus;
  rules: string;
  roomId: string;
  roomPassword: string;
  roomPublishedAt: string | null;
  participants: TournamentParticipant[];
  winnerCode: string | null;
  bannerKey: 'hero' | 'bermuda' | 'kalahari';
  createdAt: string;
}

export interface UserAccount {
  id: string;
  accountCode: string;
  playerName: string;
  ffUid: string;
  whatsappPhone: string;
  coins: number;
  matchesPlayed: number;
  wins: number;
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  accountCode: string;
  amount: number;
  type: 'admin_credit' | 'admin_debit' | 'entry_fee' | 'prize_payout' | 'refund';
  note: string;
  actor: string;
  createdAt: string;
}

export interface CoinTopupRequest {
  id: string;
  accountCode: string;
  playerName: string;
  ffUid: string;
  requestedCoins: number;
  status: 'pending' | 'approved' | 'dismissed';
  createdAt: string;
}

export type AdSlotPlacement = 'top_leaderboard' | 'in_feed_native' | 'sidebar_card';

export interface AdSlot {
  id: string;
  placement: AdSlotPlacement;
  label: string;
  network: 'AdSense' | 'Adsterra' | 'Custom Banner';
  enabled: boolean;
  htmlCode: string;
  sponsorTitle: string;
  sponsorDescription: string;
  sponsorCta: string;
  sponsorUrl: string;
  impressions: number;
  clicks: number;
}

export interface MatchNotification {
  id: string;
  targetAccountCode: string | 'ALL';
  category: 'room' | 'coins' | 'match' | 'winner' | 'system';
  title: string;
  message: string;
  tournamentId?: string;
  createdAt: string;
  readBy: string[];
}

export interface BloggerConfig {
  blogTitle: string;
  blogUrl: string;
  adminWhatsapp: string;
  apiSyncUrl: string;
  coinFeedLabel: string;
  customNotice: string;
}

export interface AppBootstrapState {
  tournaments: Tournament[];
  accounts: UserAccount[];
  transactions: CoinTransaction[];
  topupRequests: CoinTopupRequest[];
  adSlots: AdSlot[];
  notifications: MatchNotification[];
  bloggerConfig: BloggerConfig;
}
