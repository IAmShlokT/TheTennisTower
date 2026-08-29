import React, { useState, useEffect } from 'react';
import { BossProfile, PlayerStats, SavedRun, Upgrade } from './types';
import { TOWER_BOSSES } from './data/bosses';
import { getRandomUpgrades } from './data/upgrades';
import { generateBuildName } from './utils/buildNamer';
import { storage } from './utils/storage';
import { sound } from './services/sound';
import { GameCanvas } from './components/GameCanvas';
import { TowerMap } from './components/TowerMap';
import { UpgradeModal } from './components/UpgradeModal';
import { MatchIntroOverlay } from './components/MatchIntroOverlay';
import { BuildShareCard } from './components/BuildShareCard';
import { HallOfFame } from './components/HallOfFame';

const DEFAULT_STATS: PlayerStats = {
  speed: 6.4,
  maxSpeed: 8.5,
  acceleration: 1.2,
  swingRadius: 56,
  sweetSpotWindow: 180,
  smashPower: 1.0,
  servePower: 1.0,
  dashCooldown: 1800,
  dashSpeed: 11.0,
  slowMoDuration: 2500,
  slowMoMaxMeter: 3000,
  slowMoMeter: 3000,
  curvePower: 1.0,
  mitosisLevel: 0,
  hasFlamingServe: false,
  hasBananaSlice: false,
  hasThunderDash: false,
  hasMatrixFocus: false,
  hasGoldenTouch: false,
  hasGhostBall: false,
  hasBouncyBumpers: false,
  hasMoonGravity: false,
  hasPocketTornado: false,
  hasVampireAce: false,
  hasHeavyMeteor: false,
  hasMagnetoArc: false,
  hasDoubleServe: false,
  hasShockwaveSlam: false,
  hasAdrenaline: false,
  hasIceImmunity: false,
};

export default function App() {
  // Game Flow State
  const [viewState, setViewState] = useState<
    'tower_map' | 'match_intro' | 'playing' | 'upgrade_select' | 'run_summary' | 'hall_of_fame'
  >('tower_map');

  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [stats, setStats] = useState<PlayerStats>({ ...DEFAULT_STATS });
  const [availableUpgradeChoices, setAvailableUpgradeChoices] = useState<Upgrade[]>([]);

  // Run Performance Tracking
  const [runStartTime, setRunStartTime] = useState<number>(Date.now());
  const [runMaxRally, setRunMaxRally] = useState<number>(0);
  const [runAces, setRunAces] = useState<number>(0);
  const [runPerfectHits, setRunPerfectHits] = useState<number>(0);
  const [runPointsWon, setRunPointsWon] = useState<number>(0);
  const [lastFinishedRun, setLastFinishedRun] = useState<SavedRun | null>(null);
  const [isVictoryRun, setIsVictoryRun] = useState<boolean>(false);

  // Current Boss for active floor
  const currentBoss: BossProfile =
    TOWER_BOSSES.find((b) => b.floor === currentFloor) || TOWER_BOSSES[0];

  const buildIdentity = generateBuildName(upgrades, runMaxRally, currentFloor);

  // Start a New Run
  const handleResetRun = () => {
    setCurrentFloor(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setUpgrades([]);
    setStats({ ...DEFAULT_STATS });
    setRunStartTime(Date.now());
    setRunMaxRally(0);
    setRunAces(0);
    setRunPerfectHits(0);
    setRunPointsWon(0);
    setViewState('tower_map');
  };

  // Start Match Intro
  const handleEnterFloor = () => {
    setPlayerScore(0);
    setOpponentScore(0);
    setViewState('match_intro');
  };

  // Begin Match from Intro
  const handleBeginMatch = () => {
    sound.unlock();
    setViewState('playing');
  };

  // Point Finished
  const handlePointEnd = (
    winner: 'player' | 'opponent',
    rally: number,
    isAce: boolean,
    isPerfect: boolean
  ) => {
    setRunMaxRally((prev) => Math.max(prev, rally));
    if (isAce) setRunAces((prev) => prev + 1);
    if (isPerfect) setRunPerfectHits((prev) => prev + 1);

    if (winner === 'player') {
      setPlayerScore((prev) => prev + 1);
      setRunPointsWon((prev) => prev + 1);
    } else {
      setOpponentScore((prev) => prev + 1);
    }
  };

  // Match Finished
  const handleMatchEnd = (
    winner: 'player' | 'opponent',
    matchStats: { rallyMax: number; aces: number; perfectHits: number }
  ) => {
    setRunMaxRally((prev) => Math.max(prev, matchStats.rallyMax));
    setRunAces((prev) => prev + matchStats.aces);
    setRunPerfectHits((prev) => prev + matchStats.perfectHits);

    if (winner === 'player') {
      // Check if beat final Floor 10
      if (currentFloor >= 10) {
        finishRun(true);
      } else {
        // Roll next upgrades
        const choices = getRandomUpgrades(
          3,
          upgrades.map((u) => u.id)
        );
        setAvailableUpgradeChoices(choices);
        setViewState('upgrade_select');
      }
    } else {
      // Player lost match -> Run Ends
      finishRun(false);
    }
  };

  // Upgrade Picked
  const handleSelectUpgrade = (upgrade: Upgrade) => {
    const updatedUpgrades = [...upgrades, upgrade];
    setUpgrades(updatedUpgrades);

    // Apply upgrade mutation to stats
    const newStats = { ...stats };
    if (upgrade.apply) {
      upgrade.apply(newStats);
    }
    setStats(newStats);

    storage.markUpgradeSeen(upgrade.id);

    // Advance to next floor
    setCurrentFloor((prev) => Math.min(10, prev + 1));
    setPlayerScore(0);
    setOpponentScore(0);
    setViewState('tower_map');
  };

  // Finish Run (Won or Lost)
  const finishRun = (isWon: boolean) => {
    const timeSec = (Date.now() - runStartTime) / 1000;
    const finalBuild = generateBuildName(upgrades, runMaxRally, currentFloor);

    const saved: SavedRun = {
      id: `run_${Date.now()}`,
      date: new Date().toLocaleDateString(),
      playerName: 'Ace Rookie',
      buildName: finalBuild.name,
      floorsCleared: isWon ? 10 : currentFloor - 1,
      wonRun: isWon,
      upgrades: upgrades.map((u) => u.name),
      maxRally: runMaxRally,
      totalAces: runAces,
      perfectHits: runPerfectHits,
      pointsWon: runPointsWon,
      timeSeconds: timeSec,
    };

    storage.saveRun(saved);
    storage.updateCareerStats({
      runsAttempted: 1,
      towersCleared: isWon ? 1 : 0,
      totalAces: runAces,
      totalPerfectHits: runPerfectHits,
      highestRally: runMaxRally,
      totalPointsWon: runPointsWon,
      fastestWinSeconds: isWon ? timeSec : undefined,
    });

    setLastFinishedRun(saved);
    setIsVictoryRun(isWon);
    setViewState('run_summary');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center font-sans overflow-x-hidden p-2 sm:p-4 relative" style={{ backgroundColor: '#020617' }}>
      {/* Background Dot Grid */}
      <div className="fixed inset-0 w-full h-full bg-dot-grid opacity-5 pointer-events-none -z-10" />

      {/* 1. TOWER PROGRESSION LADDER */}
      {viewState === 'tower_map' && (
        <TowerMap
          currentFloor={currentFloor}
          upgrades={upgrades}
          onStartMatch={handleEnterFloor}
          onViewHallOfFame={() => setViewState('hall_of_fame')}
          onResetRun={handleResetRun}
        />
      )}

      {/* 2. MATCH INTRO OVERLAY */}
      {viewState === 'match_intro' && (
        <MatchIntroOverlay
          boss={currentBoss}
          floor={currentFloor}
          buildName={buildIdentity.name}
          onBeginMatch={handleBeginMatch}
        />
      )}

      {/* 3. ACTIVE GAME CANVAS */}
      {viewState === 'playing' && (
        <GameCanvas
          boss={currentBoss}
          stats={stats}
          onPointEnd={handlePointEnd}
          onMatchEnd={handleMatchEnd}
          playerScore={playerScore}
          opponentScore={opponentScore}
          currentFloor={currentFloor}
          buildName={buildIdentity.name}
        />
      )}

      {/* 4. UPGRADE SELECTION MODAL */}
      {viewState === 'upgrade_select' && (
        <UpgradeModal
          upgrades={availableUpgradeChoices}
          currentPickedUpgrades={upgrades}
          onSelectUpgrade={handleSelectUpgrade}
          floor={currentFloor}
        />
      )}

      {/* 5. RUN SUMMARY & VIRAL BUILD CARD */}
      {viewState === 'run_summary' && lastFinishedRun && (
        <BuildShareCard
          run={lastFinishedRun}
          upgrades={upgrades}
          isVictory={isVictoryRun}
          onPlayAgain={handleResetRun}
          onViewHallOfFame={() => setViewState('hall_of_fame')}
        />
      )}

      {/* 6. HALL OF FAME & MODIFIERS COMPENDIUM */}
      {viewState === 'hall_of_fame' && (
        <HallOfFame onBack={() => setViewState('tower_map')} />
      )}
    </div>
  );
}
