import { SavedRun } from '../types';

const STORAGE_KEY_RUNS = 'super_tennis_saved_runs';
const STORAGE_KEY_UNLOCKED = 'super_tennis_unlocked_upgrades';
const STORAGE_KEY_STATS = 'super_tennis_career_stats';

export interface CareerStats {
  runsAttempted: number;
  towersCleared: number;
  totalAces: number;
  totalPerfectHits: number;
  highestRally: number;
  totalPointsWon: number;
  fastestWinSeconds: number;
}

const DEFAULT_STATS: CareerStats = {
  runsAttempted: 0,
  towersCleared: 0,
  totalAces: 0,
  totalPerfectHits: 0,
  highestRally: 0,
  totalPointsWon: 0,
  fastestWinSeconds: 9999,
};

export const storage = {
  getRuns(): SavedRun[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RUNS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRun(run: SavedRun) {
    try {
      const runs = this.getRuns();
      runs.unshift(run);
      // Keep up to 25 latest/best runs
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runs.slice(0, 25)));
    } catch (e) {
      console.warn('Failed to save run to localStorage', e);
    }
  },

  getUnlockedUpgrades(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  markUpgradeSeen(upgradeId: string) {
    try {
      const current = new Set(this.getUnlockedUpgrades());
      current.add(upgradeId);
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(Array.from(current)));
    } catch (e) {
      console.warn('Failed to mark upgrade seen', e);
    }
  },

  getCareerStats(): CareerStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  },

  updateCareerStats(partial: Partial<CareerStats>) {
    try {
      const current = this.getCareerStats();
      const updated: CareerStats = {
        runsAttempted: current.runsAttempted + (partial.runsAttempted || 0),
        towersCleared: current.towersCleared + (partial.towersCleared || 0),
        totalAces: current.totalAces + (partial.totalAces || 0),
        totalPerfectHits: current.totalPerfectHits + (partial.totalPerfectHits || 0),
        highestRally: Math.max(current.highestRally, partial.highestRally || 0),
        totalPointsWon: current.totalPointsWon + (partial.totalPointsWon || 0),
        fastestWinSeconds: Math.min(
          current.fastestWinSeconds,
          partial.fastestWinSeconds && partial.fastestWinSeconds > 0 ? partial.fastestWinSeconds : 9999
        ),
      };
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update stats', e);
    }
  },
};
