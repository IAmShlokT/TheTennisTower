export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'chaos';

export type UpgradeCategory = 'serve' | 'shot' | 'movement' | 'chaos' | 'court' | 'passive';

export interface Upgrade {
  id: string;
  name: string;
  category: UpgradeCategory;
  rarity: Rarity;
  description: string;
  flavorQuote: string;
  iconName: string;
  tags: string[];
  apply?: (stats: PlayerStats) => void;
}

export interface PlayerStats {
  speed: number;
  maxSpeed: number;
  acceleration: number;
  swingRadius: number;
  sweetSpotWindow: number; // in ms
  smashPower: number;
  servePower: number;
  dashCooldown: number; // in ms
  dashSpeed: number;
  slowMoDuration: number; // in ms
  slowMoMaxMeter: number;
  slowMoMeter: number;
  curvePower: number;
  mitosisLevel: number; // chance or count of ball splits
  hasFlamingServe: boolean;
  hasBananaSlice: boolean;
  hasThunderDash: boolean;
  hasMatrixFocus: boolean;
  hasGoldenTouch: boolean;
  hasGhostBall: boolean;
  hasBouncyBumpers: boolean;
  hasMoonGravity: boolean;
  hasPocketTornado: boolean;
  hasVampireAce: boolean;
  hasHeavyMeteor: boolean;
  hasMagnetoArc: boolean;
  hasDoubleServe: boolean;
  hasShockwaveSlam: boolean;
  hasAdrenaline: boolean;
  hasIceImmunity: boolean;
}

export interface BossProfile {
  floor: number;
  name: string;
  title: string;
  avatarColor: string;
  racketColor: string;
  description: string;
  mechanicName: string;
  mechanicDesc: string;
  dialogQuotes: {
    intro: string;
    scorePoint: string;
    losePoint: string;
    defeated: string;
  };
  mechanicType:
    | 'normal'
    | 'laser_umpire'
    | 'giant_racket'
    | 'shadow_clone'
    | 'teleporter'
    | 'ice_court'
    | 'multi_ball'
    | 'moon_gravity'
    | 'anime_overcharge'
    | 'grand_final_boss';
  aiStats: {
    speed: number;
    reactionDelay: number; // ms
    smashChance: number;
    perfectHitChance: number;
    curveChance: number;
    specialCooldown: number; // ms
  };
}

export interface Ball {
  id: string;
  x: number; // court normalized (0 to 800)
  y: number; // court normalized (0 to 1200)
  z: number; // height (0 = ground, >0 in air)
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  speed: number;
  lastHitter: 'player' | 'opponent' | null;
  isFire: boolean;
  isCurve: boolean;
  curveFactor: number;
  isGolden: boolean;
  isInvisible: boolean;
  invisibleTimer: number;
  bounces: number;
  active: boolean;
  trail: { x: number; y: number; z: number; color: string; alpha: number }[];
  splitsLeft: number;
  isSmash: boolean;
  isLob: boolean;
}

export interface CourtHazard {
  id: string;
  type: 'ice' | 'laser' | 'fire_zone' | 'pinball_bumper' | 'black_hole' | 'wind_gust';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  duration?: number;
  maxDuration?: number;
  vx?: number;
  vy?: number;
  color?: string;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'circle' | 'spark' | 'smoke' | 'text' | 'ring' | 'flame' | 'electric' | 'sweat';
  text?: string;
  alpha?: number;
}

export interface ComicPopup {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface GhostFrame {
  time: number;
  playerX: number;
  playerY: number;
  swinging: boolean;
  dash: boolean;
}

export interface RunHistoryItem {
  floor: number;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
  durationSeconds: number;
}

export interface SavedRun {
  id: string;
  date: string;
  playerName: string;
  buildName: string;
  floorsCleared: number;
  wonRun: boolean;
  upgrades: string[];
  maxRally: number;
  totalAces: number;
  perfectHits: number;
  pointsWon: number;
  timeSeconds: number;
}
