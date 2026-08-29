import { Upgrade } from '../types';

interface BuildIdentity {
  name: string;
  archetype: string;
  tagline: string;
  badgeColor: string;
}

export function generateBuildName(upgrades: Upgrade[], maxRally = 0, floor = 1): BuildIdentity {
  if (upgrades.length === 0) {
    return {
      name: 'The Naked Baseline Rookie',
      archetype: 'Vanilla Beginner',
      tagline: 'Pure raw fundamentals. Zero cheese... for now.',
      badgeColor: 'from-slate-600 to-slate-800',
    };
  }

  const allTags = upgrades.flatMap((u) => u.tags);
  const ids = new Set(upgrades.map((u) => u.id));

  // Check specific iconic combos first
  if (ids.has('flaming_serve') && (ids.has('double_serve_chaos') || ids.has('hydra_mitosis'))) {
    return {
      name: 'The Demon Hellfire Hydra',
      archetype: 'Chaos Pyromancer',
      tagline: 'Ignites multiple flaming meteors simultaneously. Absolute inferno.',
      badgeColor: 'from-red-600 to-amber-600',
    };
  }

  if (ids.has('flaming_serve') && (ids.has('titan_string') || ids.has('heavy_meteor'))) {
    return {
      name: 'The Demon Serve Build',
      archetype: 'Serve Assassin',
      tagline: 'Opponents fear the service toss. 150mph scorched baseline aces.',
      badgeColor: 'from-rose-600 to-orange-600',
    };
  }

  if (ids.has('matrix_focus') && ids.has('curve_shot')) {
    return {
      name: 'The Chrono Spin Doctor',
      archetype: 'Time-Bending Tactician',
      tagline: 'Slows down reality to calculate impossible geometric banana curves.',
      badgeColor: 'from-cyan-600 to-emerald-600',
    };
  }

  if (ids.has('hydra_mitosis') && ids.has('double_serve_chaos')) {
    return {
      name: 'The Infinite Multi-Ball Swarm',
      archetype: 'Swarm Commander',
      tagline: 'There are so many balls on court that the ref gave up counting.',
      badgeColor: 'from-fuchsia-600 to-pink-600',
    };
  }

  if (ids.has('moon_gravity') && ids.has('ghost_ball')) {
    return {
      name: 'The Infinite Moon Lob Build',
      archetype: 'Orbital Phantom',
      tagline: 'Lobs into the stratosphere that disappear and drop like space debris.',
      badgeColor: 'from-purple-600 to-indigo-600',
    };
  }

  if (ids.has('thunder_dash') && (ids.has('adrenaline_rush') || ids.has('rocket_boosters'))) {
    return {
      name: 'The Sonic Flash-Step Build',
      archetype: 'Lightning Speedster',
      tagline: 'Reaches balls before they even leave the opponent\'s racket.',
      badgeColor: 'from-amber-500 to-yellow-600',
    };
  }

  if (ids.has('golden_midas') && (ids.has('mega_sweet_spot') || ids.has('shockwave_slam'))) {
    return {
      name: 'The Heavy Midas Smasher',
      archetype: 'Heavy Gold Striker',
      tagline: 'Turns every rally into a solid gold kinetic battering ram.',
      badgeColor: 'from-yellow-500 to-amber-700',
    };
  }

  if (ids.has('pinball_bumpers') || ids.has('pocket_tornado')) {
    return {
      name: 'The Neon Pinball Wizard',
      archetype: 'Court Geometer',
      tagline: 'Turns the court into a chaotic pachinko machine.',
      badgeColor: 'from-teal-500 to-blue-600',
    };
  }

  if (ids.has('curve_shot')) {
    return {
      name: 'The Banana Spin Doctor',
      archetype: 'Curve Specialist',
      tagline: 'Physics bends to your racket angle.',
      badgeColor: 'from-lime-500 to-emerald-600',
    };
  }

  if (ids.has('flaming_serve')) {
    return {
      name: 'The Scorched Earth Ace',
      archetype: 'Fire Starter',
      tagline: 'Leaves the baseline smoking after every service ace.',
      badgeColor: 'from-red-500 to-orange-600',
    };
  }

  if (ids.has('thunder_dash')) {
    return {
      name: 'The Thunder God Courier',
      archetype: 'Teleport Sprinter',
      tagline: 'Blinks across the baseline with zero delay.',
      badgeColor: 'from-sky-500 to-indigo-600',
    };
  }

  if (ids.has('matrix_focus')) {
    return {
      name: 'The Neo Bullet-Time Ace',
      archetype: 'Chrono Striker',
      tagline: 'Sees the ball in slow-motion 4K 120fps.',
      badgeColor: 'from-cyan-500 to-blue-700',
    };
  }

  if (ids.has('hydra_mitosis')) {
    return {
      name: 'The Hydra Splitter',
      archetype: 'Multi-Ball Menace',
      tagline: 'Why play with one tennis ball when you can overwhelm with many?',
      badgeColor: 'from-pink-500 to-rose-700',
    };
  }

  if (ids.has('heavy_meteor') || ids.has('shockwave_slam')) {
    return {
      name: 'The Seismic Destroyer',
      archetype: 'Earthshaker',
      tagline: 'Cracks the concrete court on every overhead smash.',
      badgeColor: 'from-stone-600 to-zinc-800',
    };
  }

  // Fallback procedural naming based on primary tag count
  const tagCounts: Record<string, number> = {};
  allTags.forEach((t) => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const primaryTag = sortedTags[0]?.[0] || 'speed';

  const titlePrefixes: Record<string, string> = {
    fire: 'The Blazing',
    speed: 'The Hyper-Sonic',
    curve: 'The Impossible',
    slowmo: 'The Matrix',
    multiball: 'The Chaos Hydra',
    moon: 'The Lunar Orbit',
    gold: 'The Gilded',
    heavy: 'The Juggernaut',
    court: 'The Trapmaster',
    serve: 'The Unreturned',
  };

  const titleSuffixes: Record<string, string> = {
    fire: 'Flame Sovereign',
    speed: 'Blitzstriker',
    curve: 'Spin Maestro',
    slowmo: 'Chrono Master',
    multiball: 'Multi-Ball Overlord',
    moon: 'Astronaut',
    gold: 'Golden Grandmaster',
    heavy: 'Crusher',
    court: 'Arena Manipulator',
    serve: 'Ace God',
  };

  const prefix = titlePrefixes[primaryTag] || 'The Unstoppable';
  const suffix = titleSuffixes[primaryTag] || 'Tower Conqueror';

  return {
    name: `${prefix} ${suffix}`,
    archetype: `${primaryTag.toUpperCase()} Hybrid`,
    tagline: `Crafted across ${floor} floors with ${upgrades.length} game-warping modifiers.`,
    badgeColor: 'from-indigo-600 to-violet-800',
  };
}
