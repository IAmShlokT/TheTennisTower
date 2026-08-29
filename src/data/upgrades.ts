import { Upgrade } from '../types';

export const ALL_UPGRADES: Upgrade[] = [
  {
    id: 'flaming_serve',
    name: 'Flaming Serve',
    category: 'serve',
    rarity: 'rare',
    description: 'Serves ignite in a blazing fireball (+45% speed) and leave scorching court hazard patches.',
    flavorQuote: '"Warning: strings may vaporize on impact."',
    iconName: 'Flame',
    tags: ['fire', 'serve', 'speed', 'hazard'],
    apply: (stats) => {
      stats.hasFlamingServe = true;
      stats.servePower += 0.45;
    },
  },
  {
    id: 'curve_shot',
    name: 'Banana Slice Curve',
    category: 'shot',
    rarity: 'common',
    description: 'Holding left/right during swing violently curves the ball path mid-air.',
    flavorQuote: '"Defying Isaac Newton since 1984."',
    iconName: 'Sparkles',
    tags: ['curve', 'spin', 'trick'],
    apply: (stats) => {
      stats.hasBananaSlice = true;
      stats.curvePower += 0.8;
    },
  },
  {
    id: 'matrix_focus',
    name: 'Bullet-Time Focus',
    category: 'movement',
    rarity: 'rare',
    description: 'When the ball enters your sweet spot zone, time slows down by 75% for precision returns.',
    flavorQuote: '"There is no spoon. Only the baseline."',
    iconName: 'Hourglass',
    tags: ['slowmo', 'focus', 'matrix'],
    apply: (stats) => {
      stats.hasMatrixFocus = true;
      stats.slowMoMaxMeter += 1500;
    },
  },
  {
    id: 'thunder_dash',
    name: 'Thunder Flash Dash',
    category: 'movement',
    rarity: 'rare',
    description: 'Double-tap or press Shift to instant-teleport across the court with lightning trails.',
    flavorQuote: '"Nothing personnel, kid."',
    iconName: 'Zap',
    tags: ['dash', 'speed', 'lightning'],
    apply: (stats) => {
      stats.hasThunderDash = true;
      stats.dashCooldown = 1200;
      stats.speed += 1.2;
    },
  },
  {
    id: 'mega_sweet_spot',
    name: 'Billboard Sweet Spot',
    category: 'shot',
    rarity: 'common',
    description: 'Racket sweet spot radius +100%. Timing window for "PERFECT" hits is doubled.',
    flavorQuote: '"Even if you close your eyes, you probably won\'t whiff."',
    iconName: 'Target',
    tags: ['sweet_spot', 'timing', 'giant'],
    apply: (stats) => {
      stats.swingRadius += 28;
      stats.sweetSpotWindow += 80;
    },
  },
  {
    id: 'hydra_mitosis',
    name: 'Hydra Mitosis Ball',
    category: 'chaos',
    rarity: 'epic',
    description: 'Any hard smash splits the ball into TWO active balls! Either ball scores a point.',
    flavorQuote: '"Cut off one rally, two more shall take its place."',
    iconName: 'Layers',
    tags: ['multiball', 'chaos', 'hydra'],
    apply: (stats) => {
      stats.mitosisLevel += 1;
    },
  },
  {
    id: 'golden_midas',
    name: 'Golden Midas Touch',
    category: 'shot',
    rarity: 'epic',
    description: 'Perfect timing turns the ball solid gold, gaining +20% speed on every bounce!',
    flavorQuote: '"Heavy, shiny, and lethal."',
    iconName: 'Coins',
    tags: ['gold', 'perfect', 'speed'],
    apply: (stats) => {
      stats.hasGoldenTouch = true;
      stats.smashPower += 0.35;
    },
  },
  {
    id: 'ghost_ball',
    name: 'Phantom Phantom Ball',
    category: 'shot',
    rarity: 'rare',
    description: 'Your high lobs turn completely invisible at the top of their arc for 0.6 seconds.',
    flavorQuote: '"Now you see it... now you\'re scrambling to the baseline."',
    iconName: 'EyeOff',
    tags: ['stealth', 'phantom', 'lob'],
    apply: (stats) => {
      stats.hasGhostBall = true;
    },
  },
  {
    id: 'pinball_bumpers',
    name: 'Neon Pinball Bumpers',
    category: 'court',
    rarity: 'epic',
    description: 'Court sidelines sprout bouncy pinball bumpers that slingshot balls back into play.',
    flavorQuote: '"Tilt! Multi-ball jackpot ready!"',
    iconName: 'Disc',
    tags: ['court', 'pinball', 'bounce'],
    apply: (stats) => {
      stats.hasBouncyBumpers = true;
    },
  },
  {
    id: 'moon_gravity',
    name: 'Lunar Low-Gravity',
    category: 'court',
    rarity: 'rare',
    description: 'Gravity is halved. Lobs soar to the heavens before plunging down like meteors.',
    flavorQuote: '"One small step for man, one giant smash for tennis."',
    iconName: 'Moon',
    tags: ['moon', 'gravity', 'lob'],
    apply: (stats) => {
      stats.hasMoonGravity = true;
    },
  },
  {
    id: 'vampire_ace',
    name: 'Vampiric Ace',
    category: 'passive',
    rarity: 'rare',
    description: 'Scoring an ace instantly fills your slow-mo meter and gives +50% movespeed next point.',
    flavorQuote: '"Blood for the blood god, aces for the court."',
    iconName: 'HeartCrack',
    tags: ['vampire', 'ace', 'adrenaline'],
    apply: (stats) => {
      stats.hasVampireAce = true;
    },
  },
  {
    id: 'heavy_meteor',
    name: 'Lead-Core Meteor Slam',
    category: 'shot',
    rarity: 'epic',
    description: 'Smashes hit with devastating kinetic weight, pushing the opponent back on contact.',
    flavorQuote: '"Physics: 1, Opponent\'s wrists: 0."',
    iconName: 'ShieldAlert',
    tags: ['heavy', 'smash', 'knockback'],
    apply: (stats) => {
      stats.hasHeavyMeteor = true;
      stats.smashPower += 0.5;
    },
  },
  {
    id: 'magneto_arc',
    name: 'Corner-Seeking Magnet',
    category: 'shot',
    rarity: 'rare',
    description: 'Balls slightly home in on the furthest open corner away from your opponent.',
    flavorQuote: '"Why aim when electromagnetism can do it for you?"',
    iconName: 'Compass',
    tags: ['homing', 'angle', 'trick'],
    apply: (stats) => {
      stats.hasMagnetoArc = true;
    },
  },
  {
    id: 'double_serve_chaos',
    name: 'Double Trouble Toss',
    category: 'serve',
    rarity: 'legendary',
    description: 'Every serve tosses and launches TWO balls simultaneously. Maximum panic!',
    flavorQuote: '"Double the balls, double the fun, zero regrets."',
    iconName: 'Split',
    tags: ['serve', 'multiball', 'chaos'],
    apply: (stats) => {
      stats.hasDoubleServe = true;
    },
  },
  {
    id: 'adrenaline_rush',
    name: 'Rally Adrenaline',
    category: 'passive',
    rarity: 'common',
    description: 'When rally hits 4+ hits, you move 40% faster and swing 25% harder.',
    flavorQuote: '"The longer the point, the more untethered from reality you become."',
    iconName: 'Activity',
    tags: ['speed', 'rally', 'passive'],
    apply: (stats) => {
      stats.hasAdrenaline = true;
      stats.speed += 0.6;
    },
  },
  {
    id: 'pocket_tornado',
    name: 'Vortex Backspin',
    category: 'shot',
    rarity: 'rare',
    description: 'Swings spawn a mini tornado vortex that pulls balls toward your racket.',
    flavorQuote: '"A gentle breeze of total baseline dominance."',
    iconName: 'Wind',
    tags: ['wind', 'tornado', 'spin'],
    apply: (stats) => {
      stats.hasPocketTornado = true;
      stats.swingRadius += 18;
    },
  },
  {
    id: 'shockwave_slam',
    name: 'Seismic Shockwave',
    category: 'shot',
    rarity: 'epic',
    description: 'Perfect smashes send a shockwave ripple through the floor, slowing the opponent for 1s.',
    flavorQuote: '"Earthquake warning in effect for Court 3."',
    iconName: 'Radio',
    tags: ['earthquake', 'smash', 'stun'],
    apply: (stats) => {
      stats.hasShockwaveSlam = true;
    },
  },
  {
    id: 'spiked_cleats',
    name: 'Spiked Ice Cleats',
    category: 'movement',
    rarity: 'common',
    description: 'Complete immunity to ice hazards + instant turning speed with zero momentum drift.',
    flavorQuote: '"Traction so sharp you could climb an iceberg."',
    iconName: 'Footprints',
    tags: ['cleats', 'ice', 'agility'],
    apply: (stats) => {
      stats.hasIceImmunity = true;
      stats.speed += 0.8;
      stats.acceleration += 0.5;
    },
  },
  {
    id: 'rocket_boosters',
    name: 'Sneaker Rocket Boosters',
    category: 'movement',
    rarity: 'common',
    description: 'Base running speed +35%. You zoom like a roadrunner along the baseline.',
    flavorQuote: '"BEEP BEEP!"',
    iconName: 'Rocket',
    tags: ['speed', 'movement'],
    apply: (stats) => {
      stats.speed += 1.5;
      stats.maxSpeed += 2.0;
    },
  },
  {
    id: 'titan_string',
    name: 'Vibranium Racket Strings',
    category: 'shot',
    rarity: 'rare',
    description: 'All standard returns travel with the speed and crack of a full smash.',
    flavorQuote: '"Made from recycled alien spaceships."',
    iconName: 'Award',
    tags: ['power', 'smash', 'heavy'],
    apply: (stats) => {
      stats.smashPower += 0.4;
      stats.sweetSpotWindow += 40;
    },
  },
];

export function getRandomUpgrades(count = 3, existingUpgradeIds: string[] = []): Upgrade[] {
  // Filter out upgrades that shouldn't be stacked or allow duplicates if stacking
  const available = ALL_UPGRADES.filter((u) => !existingUpgradeIds.includes(u.id));
  const pool = available.length >= count ? available : ALL_UPGRADES;

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
