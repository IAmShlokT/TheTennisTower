import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ball, BossProfile, ComicPopup, CourtHazard, Particle, PlayerStats } from '../types';
import { sound } from '../services/sound';
import { Zap, Play, RotateCcw, Volume2, VolumeX, Shield, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame, Sparkles, Target, Compass, Send, Bot, User, Clock, Trophy, ShieldAlert } from 'lucide-react';

export type PlayerShotType = 'normal' | 'smash' | 'lob' | 'serve';

interface GameCanvasProps {
  boss: BossProfile;
  stats: PlayerStats;
  onPointEnd: (winner: 'player' | 'opponent', rally: number, isAce: boolean, isPerfect: boolean) => void;
  onMatchEnd: (winner: 'player' | 'opponent', stats: { rallyMax: number; aces: number; perfectHits: number }) => void;
  playerScore: number;
  opponentScore: number;
  currentFloor: number;
  buildName: string;
}

const COURT_WIDTH = 540;
const COURT_HEIGHT = 760;
const NET_Y = COURT_HEIGHT / 2;
const GRAVITY = 0.36;
const TARGET_POINTS = 10; // First to 10 points wins the match

// Court Boundary Constants (Matches white line markings exactly)
const COURT_MIN_X = 50;
const COURT_MAX_X = 490;
const COURT_TOP_BASELINE = 45;
const COURT_BOTTOM_BASELINE = 715;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  boss,
  stats,
  onPointEnd,
  onMatchEnd,
  playerScore,
  opponentScore,
  currentFloor,
  buildName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match Tracking State
  const [isPaused, setIsPaused] = useState(false);
  const [matchOver, setMatchOver] = useState<'player' | 'opponent' | null>(null);
  const [matchEndData, setMatchEndData] = useState<{
    winner: 'player' | 'opponent';
    stats: { rallyMax: number; aces: number; perfectHits: number };
    playerFinalScore: number;
    oppFinalScore: number;
  } | null>(null);
  const [currentRally, setCurrentRally] = useState(0);
  const [servePrompt, setServePrompt] = useState(true);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [autoAssist, setAutoAssist] = useState(false);
  const [matchTimeSec, setMatchTimeSec] = useState(0);

  const handleProceedAfterMatchOver = useCallback(() => {
    if (matchEndData) {
      onMatchEnd(matchEndData.winner, matchEndData.stats);
    } else if (matchOver) {
      onMatchEnd(matchOver, {
        rallyMax: engineRef.current.maxRally,
        aces: engineRef.current.matchAces,
        perfectHits: engineRef.current.matchPerfects,
      });
    }
  }, [matchEndData, matchOver, onMatchEnd]);

  // Game Engine Mutable Refs
  const engineRef = useRef({
    // Player
    player: {
      x: COURT_WIDTH / 2,
      y: COURT_HEIGHT - 100,
      vx: 0,
      vy: 0,
      radius: 18,
      swinging: false,
      swingProgress: 0,
      swingCooldown: 0,
      facing: 'up' as const,
      isDashing: false,
      dashCooldownTimer: 0,
      dashDurationTimer: 0,
      color: '#38bdf8',
      skidVx: 0,
      skidVy: 0,
    },
    // Opponent AI
    opponent: {
      x: COURT_WIDTH / 2,
      y: 90,
      vx: 0,
      vy: 0,
      radius: 18,
      swinging: false,
      swingProgress: 0,
      facing: 'down' as const,
      specialTimer: 0,
      teleportTimer: 0,
      auraAlpha: 0,
    },
    // Multi-ball Array
    balls: [] as Ball[],
    // Hazards
    hazards: [] as CourtHazard[],
    // Particles & FX
    particles: [] as Particle[],
    popups: [] as ComicPopup[],
    // Camera Juice
    screenShake: 0,
    hitStopFrames: 0,
    timeScale: 1.0,
    slowMoActive: false,
    // Game Flow
    server: 'player' as 'player' | 'opponent',
    pointInProgress: false,
    playerReadyToReceive: false,
    opponentWindupTimer: 0,
    rallyCount: 0,
    maxRally: 0,
    matchAces: 0,
    matchPerfects: 0,
    pointOutcomeTimer: 0,
    pointWinner: null as 'player' | 'opponent' | null,
    // Input Keys
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      swing: false,
      dash: false,
      focus: false,
    },
    // Virtual touch joystick
    touch: {
      active: false,
      dx: 0,
      dy: 0,
    },
  });

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Helper to spawn a new ball for serve & reset player/cpu baseline positions
  const spawnServeBall = useCallback(
    (server: 'player' | 'opponent') => {
      // 1. Reset Player to Middle of Baseline
      engineRef.current.player.x = COURT_WIDTH / 2;
      engineRef.current.player.y = COURT_HEIGHT - 80;
      engineRef.current.player.vx = 0;
      engineRef.current.player.vy = 0;
      engineRef.current.player.skidVx = 0;
      engineRef.current.player.skidVy = 0;
      engineRef.current.player.isDashing = false;
      engineRef.current.player.swinging = false;
      engineRef.current.player.facing = 'up';

      // 2. Reset Opponent/CPU to Middle of Baseline
      engineRef.current.opponent.x = COURT_WIDTH / 2;
      engineRef.current.opponent.y = 80;
      engineRef.current.opponent.vx = 0;
      engineRef.current.opponent.vy = 0;
      engineRef.current.opponent.swinging = false;
      engineRef.current.opponent.facing = 'down';

      // 3. Clear Key Inputs to prevent drift
      engineRef.current.keys.left = false;
      engineRef.current.keys.right = false;
      engineRef.current.keys.up = false;
      engineRef.current.keys.down = false;
      engineRef.current.keys.dash = false;
      engineRef.current.keys.swing = false;
      engineRef.current.touch.active = false;
      engineRef.current.touch.dx = 0;
      engineRef.current.touch.dy = 0;

      const isDoubleServe = stats.hasDoubleServe && server === 'player';
      const count = isDoubleServe ? 2 : 1;

      const newBalls: Ball[] = [];
      for (let i = 0; i < count; i++) {
        const xOffset = count > 1 ? (i === 0 ? -24 : 24) : 0;
        const ball: Ball = {
          id: `ball_${Date.now()}_${i}`,
          x: server === 'player' ? engineRef.current.player.x + xOffset : engineRef.current.opponent.x + xOffset,
          y: server === 'player' ? engineRef.current.player.y - 20 : engineRef.current.opponent.y + 20,
          z: 24,
          vx: 0,
          vy: 0,
          vz: 0,
          radius: 7.5,
          speed: 0,
          lastHitter: null,
          isFire: stats.hasFlamingServe && server === 'player',
          isCurve: false,
          curveFactor: 0,
          isGolden: false,
          isInvisible: false,
          invisibleTimer: 0,
          bounces: 0,
          active: true,
          trail: [],
          splitsLeft: stats.mitosisLevel,
          isSmash: false,
          isLob: false,
        };
        newBalls.push(ball);
      }

      engineRef.current.balls = newBalls;
      engineRef.current.rallyCount = 0;
      engineRef.current.pointInProgress = false;
      engineRef.current.playerReadyToReceive = false;
      engineRef.current.opponentWindupTimer = 0;
      setCurrentRally(0);
      setServePrompt(true);
    },
    [stats.hasDoubleServe, stats.hasFlamingServe, stats.mitosisLevel]
  );

  // Initialize Hazards according to Boss Profile
  const initBossHazards = useCallback(() => {
    const hazards: CourtHazard[] = [];

    if (boss.mechanicType === 'ice_court' || boss.mechanicType === 'grand_final_boss') {
      hazards.push({
        id: 'ice_patch_1',
        type: 'ice',
        x: 60,
        y: NET_Y + 50,
        width: 180,
        height: 140,
        active: true,
        color: 'rgba(56, 189, 248, 0.35)',
      });
      hazards.push({
        id: 'ice_patch_2',
        type: 'ice',
        x: COURT_WIDTH - 240,
        y: NET_Y + 120,
        width: 170,
        height: 130,
        active: true,
        color: 'rgba(56, 189, 248, 0.35)',
      });
    }

    if (stats.hasBouncyBumpers) {
      hazards.push({
        id: 'bumper_left',
        type: 'pinball_bumper',
        x: 18,
        y: NET_Y,
        width: 24,
        height: 120,
        radius: 20,
        active: true,
        color: '#f43f5e',
      });
      hazards.push({
        id: 'bumper_right',
        type: 'pinball_bumper',
        x: COURT_WIDTH - 42,
        y: NET_Y,
        width: 24,
        height: 120,
        radius: 20,
        active: true,
        color: '#f43f5e',
      });
    }

    engineRef.current.hazards = hazards;
  }, [boss.mechanicType, stats.hasBouncyBumpers]);

  // Initial Setup on Match Start / Floor Change
  useEffect(() => {
    sound.startMusic();
    initBossHazards();
    spawnServeBall('player');
    setMatchOver(null);

    return () => {
      // Clean up if needed
    };
  }, [boss, initBossHazards, spawnServeBall]);

  // Handle Keydown & Keyup for Movement and Shot Types
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const GAME_KEYS = [
        'Space',
        'Enter',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyJ',
        'KeyK',
        'KeyL',
        'KeyZ',
        'KeyX',
        'KeyC',
        'KeyV',
        'KeyF',
        'KeyM',
        'KeyO',
        'ShiftLeft',
        'ShiftRight',
      ];

      if (GAME_KEYS.includes(code)) {
        e.preventDefault();
      }

      if (matchOver) {
        if (
          code === 'Space' ||
          code === 'Enter' ||
          code === 'KeyJ' ||
          code === 'KeyK' ||
          code === 'KeyL' ||
          code === 'KeyS'
        ) {
          handleProceedAfterMatchOver();
          return;
        }
      }

      const keys = engineRef.current.keys;

      // KeyT: Toggle Auto-Assist
      if (code === 'KeyT') {
        setAutoAssist((prev) => !prev);
      }

      // 1. Movement: Arrows and WASD
      if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
      if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
      if (code === 'ArrowUp' || code === 'KeyW') keys.up = true;
      if (code === 'ArrowDown') keys.down = true;

      // KeyS: If serving / receiving, triggers Serve / Ready. Otherwise moves down for WASD
      if (code === 'KeyS') {
        if (!engineRef.current.pointInProgress) {
          if (engineRef.current.server === 'player') {
            triggerPlayerShot('serve');
          } else {
            engineRef.current.playerReadyToReceive = true;
            setServePrompt(false);
            addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
          }
        } else {
          keys.down = true;
        }
      }

      // 2. Normal Shot: [J], [Z]
      if (code === 'KeyJ' || code === 'KeyZ') {
        keys.swing = true;
        if (!engineRef.current.pointInProgress && engineRef.current.server === 'opponent') {
          engineRef.current.playerReadyToReceive = true;
          setServePrompt(false);
          addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
        } else {
          triggerPlayerShot('normal');
        }
      }

      // Space / Enter: Serves when awaiting serve, readies for opponent serve, or hits normal shot during rally
      if (code === 'Space' || code === 'Enter') {
        keys.swing = true;
        if (!engineRef.current.pointInProgress) {
          if (engineRef.current.server === 'player') {
            triggerPlayerShot('serve');
          } else {
            engineRef.current.playerReadyToReceive = true;
            setServePrompt(false);
            addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
          }
        } else {
          triggerPlayerShot('normal');
        }
      }

      // 3. Smash Shot: [K], [X], [M]
      if (code === 'KeyK' || code === 'KeyX' || code === 'KeyM') {
        keys.swing = true;
        if (!engineRef.current.pointInProgress && engineRef.current.server === 'opponent') {
          engineRef.current.playerReadyToReceive = true;
          setServePrompt(false);
          addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
        } else {
          triggerPlayerShot('smash');
        }
      }

      // 4. Lob Shot: [L], [C], [O]
      if (code === 'KeyL' || code === 'KeyC' || code === 'KeyO') {
        keys.swing = true;
        if (!engineRef.current.pointInProgress && engineRef.current.server === 'opponent') {
          engineRef.current.playerReadyToReceive = true;
          setServePrompt(false);
          addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
        } else {
          triggerPlayerShot('lob');
        }
      }

      // 5. Dash Burst: [Shift], [V], [F]
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyV' || code === 'KeyF') {
        keys.dash = true;
        triggerPlayerDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const keys = engineRef.current.keys;
      if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
      if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
      if (code === 'ArrowUp' || code === 'KeyW') keys.up = false;
      if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
      if (['Space', 'Enter', 'KeyJ', 'KeyK', 'KeyL', 'KeyZ', 'KeyX', 'KeyC', 'KeyM', 'KeyO'].includes(code)) {
        keys.swing = false;
      }
      if (['ShiftLeft', 'ShiftRight', 'KeyV', 'KeyF'].includes(code)) {
        keys.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Player Dash Action
  const triggerPlayerDash = () => {
    const player = engineRef.current.player;
    if (player.dashCooldownTimer > 0 || player.isDashing) return;

    player.isDashing = true;
    player.dashDurationTimer = 160; // 160ms dash burst
    player.dashCooldownTimer = stats.dashCooldown;

    sound.playDash();

    // Spawn electric trail particles
    for (let i = 0; i < 8; i++) {
      engineRef.current.particles.push({
        x: player.x + (Math.random() - 0.5) * 16,
        y: player.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20,
        maxLife: 20,
        size: 3 + Math.random() * 4,
        color: stats.hasThunderDash ? '#facc15' : '#38bdf8',
        type: 'electric',
      });
    }

    if (stats.hasThunderDash) {
      addPopup('FLASH DASH!', player.x, player.y - 20, '#facc15');
    }
  };

  // Add a Comic Splash Text Popup
  const addPopup = (text: string, x: number, y: number, color = '#facc15') => {
    engineRef.current.popups.push({
      id: `popup_${Date.now()}_${Math.random()}`,
      text,
      x: Math.max(50, Math.min(COURT_WIDTH - 50, x)),
      y: Math.max(50, Math.min(COURT_HEIGHT - 50, y)),
      color,
      scale: 0.4,
      life: 45,
      maxLife: 45,
    });
  };

  // Comprehensive Player Shot Action (Normal, Smash, Lob, Serve)
  const triggerPlayerShot = (shotType: PlayerShotType = 'normal') => {
    const eng = engineRef.current;
    const player = eng.player;

    if (player.swingCooldown > 0) return;

    player.swinging = true;
    player.swingProgress = 0;
    player.swingCooldown = shotType === 'smash' ? 22 : shotType === 'lob' ? 20 : 16;

    // --- SERVE EXECUTION ---
    if (!eng.pointInProgress && eng.server === 'player') {
      eng.pointInProgress = true;
      setServePrompt(false);

      const aimBase = (player.x - COURT_WIDTH / 2) * 0.02 + (eng.keys.left ? -2.4 : eng.keys.right ? 2.4 : 0);

      eng.balls.forEach((ball) => {
        ball.lastHitter = 'player';
        ball.bounces = 0;
        ball.z = 24;

        if (shotType === 'smash') {
          // [K] Fast Flat Rocket / Flame Smash Serve
          ball.vx = aimBase * 1.35;
          ball.vy = -(9.2 + stats.servePower * 4.4);
          ball.vz = 3.2;
          ball.isSmash = true;
          ball.isLob = false;
          ball.isFire = true;
          ball.speed = Math.hypot(ball.vx, ball.vy);
          sound.playHit(true, true, true);
          addPopup(stats.hasFlamingServe ? 'FLAME CANNON!' : 'POWER SMASH SERVE!', player.x, player.y - 30, '#f97316');
          eng.screenShake = 10;
        } else if (shotType === 'lob') {
          // [L] High Kick Spin Sky Lob Serve
          ball.vx = aimBase * 0.85;
          ball.vy = -(5.0 + stats.servePower * 1.8);
          ball.vz = 10.5;
          ball.isLob = true;
          ball.isSmash = false;
          ball.isFire = false;
          ball.speed = Math.hypot(ball.vx, ball.vy);
          sound.playLob();
          addPopup('KICK LOB SERVE!', player.x, player.y - 30, '#38bdf8');
        } else {
          // [J / Space] Standard Clean Flat Drive Serve
          ball.vx = aimBase;
          ball.vy = -(7.4 + stats.servePower * 3.4);
          ball.vz = 5.2;
          ball.isSmash = false;
          ball.isLob = false;
          ball.isFire = stats.hasFlamingServe;
          ball.speed = Math.hypot(ball.vx, ball.vy);
          sound.playHit(true, false, stats.hasFlamingServe);
          addPopup(stats.hasFlamingServe ? 'FLAME SERVE!' : 'CLEAN DRIVE SERVE!', player.x, player.y - 30, '#22c55e');
        }
      });
      return;
    }

    // --- ACTIVE RALLY HIT DETECTION ---
    let hitAny = false;
    const effectiveRadius = stats.swingRadius + (stats.hasPocketTornado ? 18 : 0);

    eng.balls.forEach((ball) => {
      if (!ball.active) return;
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= effectiveRadius && ball.y < player.y + 28 && ball.y > player.y - effectiveRadius) {
        hitAny = true;
        eng.rallyCount++;
        eng.maxRally = Math.max(eng.maxRally, eng.rallyCount);
        setCurrentRally(eng.rallyCount);

        // Perfect timing sweet-spot check
        const perfectDist = Math.abs(dist - effectiveRadius * 0.5);
        const isPerfect = perfectDist < (14 + stats.sweetSpotWindow * 0.1);

        if (isPerfect) {
          eng.matchPerfects++;
        }

        // Directional exit angle based on contact point & arrow keys
        let angleX = (ball.x - player.x) / effectiveRadius;
        if (eng.keys.left || eng.touch.dx < -0.3) angleX -= 0.48;
        if (eng.keys.right || eng.touch.dx > 0.3) angleX += 0.48;

        // Banana Curve modifier
        if (stats.hasBananaSlice) {
          ball.isCurve = true;
          ball.curveFactor = (eng.keys.left ? -0.16 : eng.keys.right ? 0.16 : (Math.random() - 0.5) * 0.2) * stats.curvePower;
        }

        // Apply Shot-Specific Physics & Audio/Visuals
        if (shotType === 'smash') {
          // [K] SMASH: Blistering downward bullet spike with high velocity, flames, and heavy hit-stop
          const speedBase = 11.5 + (isPerfect ? 3.5 : 1.2) + stats.smashPower * 4.0;
          ball.vx = angleX * (speedBase * 0.52);
          ball.vy = -speedBase;
          ball.vz = 2.4;
          ball.z = Math.max(ball.z, 22);
          ball.isSmash = true;
          ball.isLob = false;
          ball.isFire = true;
          eng.hitStopFrames = isPerfect ? 4 : 2;
          eng.screenShake = isPerfect ? 14 : 9;
          sound.playHit(true, true, true);
          addPopup(isPerfect ? 'GODLY SMASH!' : 'POWER SMASH!', ball.x, ball.y - 25, '#f59e0b');

          // Smash fiery particles
          for (let p = 0; p < 10; p++) {
            eng.particles.push({
              x: ball.x,
              y: ball.y,
              vx: (Math.random() - 0.5) * 7,
              vy: -Math.random() * 6 - 2,
              life: 20,
              maxLife: 20,
              size: 4 + Math.random() * 4,
              color: p % 2 === 0 ? '#f59e0b' : '#ef4444',
              type: 'spark',
            });
          }
        } else if (shotType === 'lob') {
          // [L] LOB: High looping parabolic rainbow arc soaring over opponent
          const speedBase = 4.6 + stats.smashPower * 0.8;
          ball.vx = angleX * (speedBase * 0.65);
          ball.vy = -speedBase;
          ball.vz = 11.4 + (isPerfect ? 2.0 : 0);
          ball.isLob = true;
          ball.isSmash = false;
          ball.isFire = false;
          sound.playLob();
          addPopup(isPerfect ? 'MAJESTIC LOB!' : 'SKY LOB!', ball.x, ball.y - 25, '#38bdf8');

          // Lob upward ring sparkles
          for (let p = 0; p < 4; p++) {
            eng.particles.push({
              x: ball.x + (Math.random() - 0.5) * 10,
              y: ball.y,
              vx: (Math.random() - 0.5) * 2,
              vy: -2 - Math.random() * 2,
              life: 22,
              maxLife: 22,
              size: 6 + Math.random() * 4,
              color: '#38bdf8',
              type: 'ring',
            });
          }
        } else {
          // [J] NORMAL DRIVE: Crisp, controlled flat baseline drive
          const speedBase = 7.4 + (isPerfect ? 2.4 : 0.9) + stats.smashPower * 2.0;
          ball.vx = angleX * (speedBase * 0.62);
          ball.vy = -speedBase;
          ball.vz = 5.0;
          ball.isSmash = false;
          ball.isLob = false;
          ball.isFire = stats.hasFlamingServe && ball.isFire;
          sound.playHit(isPerfect, false, ball.isFire);
          if (isPerfect) {
            eng.screenShake = 6;
            addPopup('PERFECT DRIVE!', ball.x, ball.y - 25, '#22c55e');
          } else {
            addPopup('CLEAN DRIVE', ball.x, ball.y - 25, '#86efac');
          }
        }

        ball.lastHitter = 'player';
        ball.bounces = 0;
        ball.speed = Math.hypot(ball.vx, ball.vy);

        if (isPerfect && stats.hasGoldenTouch) {
          ball.isGolden = true;
        }

        // Mitosis Ball Split
        if (stats.mitosisLevel > 0 && ball.splitsLeft > 0 && isPerfect) {
          ball.splitsLeft--;
          sound.playSplit();
          addPopup('MITOSIS SPLIT!', ball.x, ball.y - 35, '#ec4899');
          const cloneBall: Ball = {
            ...ball,
            id: `ball_split_${Date.now()}_${Math.random()}`,
            vx: -ball.vx + (Math.random() - 0.5) * 2,
            vy: ball.vy * 0.95,
            trail: [],
            splitsLeft: 0,
          };
          eng.balls.push(cloneBall);
        }

        // Shockwave Slam hazard/stun
        if (isPerfect && stats.hasShockwaveSlam) {
          eng.screenShake = 14;
          for (let p = 0; p < 16; p++) {
            eng.particles.push({
              x: ball.x,
              y: ball.y,
              vx: Math.cos((p * Math.PI) / 8) * 6,
              vy: Math.sin((p * Math.PI) / 8) * 6,
              life: 25,
              maxLife: 25,
              size: 5,
              color: '#d97706',
              type: 'ring',
            });
          }
        }
      }
    });

    if (!hitAny) {
      sound.playHit(false, false, false);
    }
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const eng = engineRef.current;

      // Handle hit-stop freeze frames
      if (eng.hitStopFrames > 0) {
        eng.hitStopFrames--;
        render(ctx, eng);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      if (!isPaused && !matchOver) {
        update(dt, eng);
      }

      render(ctx, eng);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // --- GAME ENGINE UPDATE ---
    const update = (dt: number, eng: typeof engineRef.current) => {
      const player = eng.player;
      const opponent = eng.opponent;
      const keys = eng.keys;
      const touch = eng.touch;

      // Screen Shake decay
      if (eng.screenShake > 0) {
        eng.screenShake *= 0.88;
        if (eng.screenShake < 0.2) eng.screenShake = 0;
      }

      // Check bullet-time matrix focus
      if (stats.hasMatrixFocus && eng.pointInProgress) {
        const closestBall = eng.balls.find(
          (b) => b.active && b.vy > 0 && b.y > player.y - 120 && b.y < player.y + 20
        );
        if (closestBall) {
          eng.timeScale = 0.35;
          if (!eng.slowMoActive) {
            eng.slowMoActive = true;
            sound.playSlowMo(true);
          }
        } else {
          eng.timeScale = 1.0;
          if (eng.slowMoActive) {
            eng.slowMoActive = false;
            sound.playSlowMo(false);
          }
        }
      } else {
        eng.timeScale = 1.0;
      }

      const effectiveDt = dt * eng.timeScale;

      // --- PLAYER MOVEMENT ---
      let inputX = 0;
      let inputY = 0;

      if (keys.left) inputX -= 1;
      if (keys.right) inputX += 1;
      if (keys.up) inputY -= 1;
      if (keys.down) inputY += 1;

      if (touch.active) {
        inputX = touch.dx;
        inputY = touch.dy;
      }

      // Auto-Assist Tracking (Only active when enabled by user AND no directional keys are pressed)
      if (autoAssist && inputX === 0 && inputY === 0 && eng.pointInProgress) {
        const incomingBall = eng.balls.find((b) => b.active && b.vy > 0 && b.y > NET_Y - 30);
        if (incomingBall) {
          const targetX = Math.max(50, Math.min(COURT_WIDTH - 50, incomingBall.x));
          const targetY = Math.max(NET_Y + 80, Math.min(COURT_HEIGHT - 60, incomingBall.y + 35));
          const adx = targetX - player.x;
          const ady = targetY - player.y;
          const aDist = Math.hypot(adx, ady);
          if (aDist > 12) {
            inputX = (adx / aDist) * 0.85;
            inputY = (ady / aDist) * 0.85;
          }
        }
      }

      // Normalize diagonal
      const len = Math.hypot(inputX, inputY);
      if (len > 1) {
        inputX /= len;
        inputY /= len;
      }

      // Ice hazard friction check
      let onIce = false;
      if (!stats.hasIceImmunity) {
        eng.hazards.forEach((h) => {
          if (h.type === 'ice' && player.x >= h.x && player.x <= h.x + h.width && player.y >= h.y && player.y <= h.y + h.height) {
            onIce = true;
          }
        });
      }

      const currentSpeed = (player.isDashing ? stats.dashSpeed : stats.speed) * (eng.rallyCount > 4 && stats.hasAdrenaline ? 1.4 : 1.0);

      if (onIce) {
        // Ice skidding physics
        player.skidVx += inputX * 0.4;
        player.skidVy += inputY * 0.4;
        player.skidVx *= 0.96;
        player.skidVy *= 0.96;
        player.x += player.skidVx;
        player.y += player.skidVy;
        if (Math.random() < 0.2) sound.playIceSkid();
      } else {
        player.x += inputX * currentSpeed;
        player.y += inputY * currentSpeed;
        player.skidVx = 0;
        player.skidVy = 0;
      }

      // Court Bounds Constraints
      player.x = Math.max(35, Math.min(COURT_WIDTH - 35, player.x));
      player.y = Math.max(NET_Y + 30, Math.min(COURT_HEIGHT - 40, player.y));

      // Keep ball linked with player before player serve
      if (!eng.pointInProgress && eng.server === 'player') {
        eng.balls.forEach((ball) => {
          ball.x = player.x + (eng.keys.left ? -18 : 18);
          ball.y = player.y - 18;
          ball.z = 20;
          ball.vx = 0;
          ball.vy = 0;
          ball.vz = 0;
          ball.active = true;
        });
      }

      // Dash timers
      if (player.dashDurationTimer > 0) {
        player.dashDurationTimer -= dt * 1000;
        if (player.dashDurationTimer <= 0) player.isDashing = false;
      }
      if (player.dashCooldownTimer > 0) {
        player.dashCooldownTimer -= dt * 1000;
      }
      if (player.swingCooldown > 0) {
        player.swingCooldown--;
      }

      // --- OPPONENT AI LOGIC ---
      updateOpponentAI(effectiveDt, eng);

      // --- BALL SIMULATION ---
      updateBalls(effectiveDt, eng);

      // --- PARTICLES & POPUPS UPDATE ---
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx * eng.timeScale;
        p.y += p.vy * eng.timeScale;
        p.life--;
        if (p.life <= 0) {
          eng.particles.splice(i, 1);
        }
      }

      for (let i = eng.popups.length - 1; i >= 0; i--) {
        const pop = eng.popups[i];
        pop.y -= 0.6;
        pop.scale = Math.min(1.0, pop.scale + 0.12);
        pop.life--;
        if (pop.life <= 0) {
          eng.popups.splice(i, 1);
        }
      }

      // --- POINT OUTCOME CHECK ---
      if (eng.pointWinner && eng.pointOutcomeTimer > 0) {
        eng.pointOutcomeTimer -= dt * 1000;
        if (eng.pointOutcomeTimer <= 0) {
          const winner = eng.pointWinner;
          const isAce = eng.rallyCount <= 1 && winner === 'player';
          const isPerfectHit = eng.matchPerfects > 0;

          onPointEnd(winner, eng.rallyCount, isAce, isPerfectHit);

          // Check if match won (First to TARGET_POINTS = 10)
          const newPlayerScore = winner === 'player' ? playerScore + 1 : playerScore;
          const newOppScore = winner === 'opponent' ? opponentScore + 1 : opponentScore;

          if (newPlayerScore >= TARGET_POINTS || newOppScore >= TARGET_POINTS) {
            const matchWinner = newPlayerScore >= TARGET_POINTS ? 'player' : 'opponent';
            setMatchOver(matchWinner);
            setMatchEndData({
              winner: matchWinner,
              stats: {
                rallyMax: eng.maxRally,
                aces: eng.matchAces,
                perfectHits: eng.matchPerfects,
              },
              playerFinalScore: newPlayerScore,
              oppFinalScore: newOppScore,
            });
            if (matchWinner === 'player') {
              sound.playMatchWon();
            } else {
              sound.playPointLost();
            }
          } else {
            // Next point
            eng.server = winner;
            eng.pointWinner = null;
            spawnServeBall(winner);
          }
        }
      }
    };

    // --- OPPONENT AI UPDATE ---
    const updateOpponentAI = (dt: number, eng: typeof engineRef.current) => {
      const opp = eng.opponent;
      const statsAI = boss.aiStats;

      // If waiting for opponent serve, KEEP BALL AT OPPONENT and DO NOT SERVE UNTIL PLAYER IS READY
      if (!eng.pointInProgress && eng.server === 'opponent') {
        eng.balls.forEach((ball) => {
          ball.x = opp.x;
          ball.y = opp.y + 18;
          ball.z = 24;
          ball.vx = 0;
          ball.vy = 0;
          ball.vz = 0;
          ball.active = true;
        });

        if (eng.playerReadyToReceive) {
          eng.opponentWindupTimer += dt * 1000;
          if (eng.opponentWindupTimer > 500) {
            eng.opponentWindupTimer = 0;
            eng.pointInProgress = true;
            eng.playerReadyToReceive = false;
            setServePrompt(false);
            eng.balls.forEach((ball) => {
              ball.x = opp.x;
              ball.y = opp.y + 18;
              ball.z = 26;
              // Clean serve arc that flies over the net (NET_Y = 380) with clearance z > 35, landing in player service area (y ~ 430)
              ball.vx = (Math.random() - 0.5) * 1.6;
              ball.vy = 7.8;
              ball.vz = 7.4;
              ball.bounces = 0;
              ball.lastHitter = 'opponent';
              ball.isSmash = false;
              ball.isLob = false;
              ball.speed = Math.hypot(ball.vx, ball.vy);
            });
            sound.playHit(true, false, false);
            addPopup('SERVE INCOMING!', opp.x, opp.y + 25, '#f59e0b');
          }
        }
        return;
      }

      // Track active balls targeting opponent court
      const activeIncomingBalls = eng.balls.filter((b) => b.active && b.vy < 0);
      const targetBall = activeIncomingBalls[0] || eng.balls.find((b) => b.active);

      if (targetBall) {
        // Move toward intercept point
        const targetX = targetBall.x;
        const targetY = Math.min(160, Math.max(50, targetBall.y - 20));

        const dx = targetX - opp.x;
        const dy = targetY - opp.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          opp.vx = (dx / dist) * statsAI.speed;
          opp.vy = (dy / dist) * statsAI.speed;
          opp.x += opp.vx;
          opp.y += opp.vy;
        }

        // Clamp Opponent bounds
        opp.x = Math.max(35, Math.min(COURT_WIDTH - 35, opp.x));
        opp.y = Math.max(35, Math.min(NET_Y - 30, opp.y));

        // Boss Special Mechanic Check
        if (boss.mechanicType === 'teleporter') {
          opp.teleportTimer += dt * 1000;
          if (opp.teleportTimer > statsAI.specialCooldown && targetBall.vy < 0 && targetBall.y < 350) {
            opp.teleportTimer = 0;
            opp.x = targetBall.x + (Math.random() - 0.5) * 30;
            opp.y = Math.max(50, targetBall.y - 15);
            sound.playTeleport();
            addPopup('QUANTUM BLINK!', opp.x, opp.y + 25, '#06b6d4');
          }
        }

        if (boss.mechanicType === 'laser_umpire') {
          opp.specialTimer += dt * 1000;
          if (opp.specialTimer > statsAI.specialCooldown) {
            opp.specialTimer = 0;
            sound.playLaser();
            addPopup('FAULT LASER!', opp.x, opp.y + 25, '#ef4444');
            // Spawn temporary laser hazard across player court
            eng.hazards.push({
              id: `laser_${Date.now()}`,
              type: 'laser',
              x: 0,
              y: NET_Y + 120 + Math.random() * 180,
              width: COURT_WIDTH,
              height: 18,
              duration: 2500,
              maxDuration: 2500,
              active: true,
              color: '#ef4444',
            });
          }
        }

        // Opponent Hit Check
        const hitRadius = boss.mechanicType === 'giant_racket' ? 70 : 36;
        const bdx = targetBall.x - opp.x;
        const bdy = targetBall.y - opp.y;
        const bDist = Math.hypot(bdx, bdy);

        // High lobs sail over opponent's head if they are rushing the net (y > 90)
        const isTooHighToVolley = targetBall.isLob && targetBall.z > 35 && opp.y > 90 && boss.mechanicType !== 'giant_racket';

        if (bDist <= hitRadius && targetBall.y < opp.y + hitRadius && targetBall.vy < 0 && !isTooHighToVolley) {
          eng.rallyCount++;
          eng.maxRally = Math.max(eng.maxRally, eng.rallyCount);
          setCurrentRally(eng.rallyCount);

          const isSmash = Math.random() < statsAI.smashChance;
          const speed = 5.8 + (isSmash ? 2.5 : 0.8);

          // Aim tactically into player court or make an unforced error
          let targetX = eng.player.x < COURT_WIDTH / 2
            ? COURT_WIDTH * 0.64 + (Math.random() - 0.5) * 100
            : COURT_WIDTH * 0.36 + (Math.random() - 0.5) * 100;

          // Slight chance of CPU unforced error (hitting wide or long)
          const errorChance = Math.max(0.04, 0.12 - (boss.floor * 0.008));
          const isError = Math.random() < errorChance;
          if (isError) {
            targetX = Math.random() < 0.5 ? (COURT_MIN_X - 35) : (COURT_MAX_X + 35);
          } else {
            targetX = Math.max(COURT_MIN_X + 20, Math.min(COURT_MAX_X - 20, targetX));
          }

          const targetY = (isError && Math.random() < 0.4)
            ? COURT_BOTTOM_BASELINE + 40
            : NET_Y + 120 + Math.random() * 150;

          const flightDistY = Math.max(160, targetY - opp.y);
          const flightFrames = flightDistY / speed;

          if (Math.random() < statsAI.curveChance && !isError) {
            targetBall.isCurve = true;
            targetBall.curveFactor = (Math.random() - 0.5) * 0.28;
          } else {
            targetBall.isCurve = false;
          }

          targetBall.vx = (targetX - opp.x) / flightFrames;
          targetBall.vy = speed;
          targetBall.vz = isSmash ? 3.2 : 5.4;
          targetBall.isSmash = isSmash;
          targetBall.isLob = false;
          targetBall.lastHitter = 'opponent';
          targetBall.bounces = 0;
          targetBall.speed = Math.hypot(targetBall.vx, targetBall.vy);

          // Boss Duplication Mechanic (Floor 7)
          if (boss.mechanicType === 'multi_ball' && eng.balls.length < 3 && Math.random() < 0.6) {
            sound.playSplit();
            addPopup('MAGIC DUPLICATION!', targetBall.x, targetBall.y + 25, '#ec4899');
            const cloneBall: Ball = {
              ...targetBall,
              id: `boss_split_${Date.now()}`,
              vx: -targetBall.vx,
              vy: targetBall.vy * 0.9,
              trail: [],
              splitsLeft: 0,
            };
            eng.balls.push(cloneBall);
          }

          if (boss.mechanicType === 'giant_racket') {
            sound.playHit(true, true, false);
            addPopup('HURRICANE GUST!', opp.x, opp.y + 35, '#f59e0b');
            // Push player back
            eng.player.y = Math.min(COURT_HEIGHT - 40, eng.player.y + 40);
          } else {
            sound.playHit(isSmash, isSmash, false);
          }
        }
      }
    };

    // --- BALLS UPDATE ---
    const updateBalls = (dt: number, eng: typeof engineRef.current) => {
      eng.balls.forEach((ball) => {
        if (!ball.active) return;

        // Apply curve
        if (ball.isCurve) {
          ball.vx += ball.curveFactor;
        }

        // Apply 3D physics (x, y, z)
        ball.x += ball.vx;
        ball.y += ball.vy;

        const effectiveGravity = (boss.mechanicType === 'moon_gravity' || stats.hasMoonGravity) ? GRAVITY * 0.45 : GRAVITY;
        ball.vz -= effectiveGravity;
        ball.z += ball.vz;

        // Check Pinball Bumpers (arcade hazards only - no artificial side walls)
        eng.hazards.forEach((h) => {
          if (h.type === 'pinball_bumper' && h.active) {
            const dx = ball.x - h.x;
            const dy = ball.y - h.y;
            if (Math.hypot(dx, dy) < (h.radius || 20) + ball.radius) {
              ball.vx = (dx / Math.hypot(dx, dy)) * 7;
              ball.vy = (dy / Math.hypot(dx, dy)) * 7;
              sound.playHit(true, false, false);
              addPopup('BUMPER BLASTER!', h.x, h.y, '#f43f5e');
            }
          }
        });

        // Net collision check (if ball hits net tape at low height without clearing)
        if (Math.abs(ball.y - NET_Y) < 6 && ball.z < 16) {
          ball.active = false;
          const winner: 'player' | 'opponent' = ball.lastHitter === 'player' ? 'opponent' : 'player';
          if (!eng.pointWinner) {
            eng.pointWinner = winner;
            eng.pointOutcomeTimer = 900;
            if (winner === 'player') {
              sound.playPointWon();
              addPopup('CPU NET FAULT! POINT TO YOU!', COURT_WIDTH / 2, NET_Y - 30, '#22c55e');
            } else {
              sound.playPointLost();
              addPopup('NET FAULT! POINT TO CPU', COURT_WIDTH / 2, NET_Y + 30, '#ef4444');
            }
          }
          return;
        }

        // Ball Bounce on Ground
        if (ball.z <= 0) {
          ball.z = 0;

          // Golden touch speedup on bounce
          if (ball.isGolden) {
            ball.vy *= 1.15;
            ball.vx *= 1.15;
          }

          if (ball.lastHitter === 'opponent') {
            // Ball sent by Opponent toward Player court (Y: NET_Y to COURT_BOTTOM_BASELINE)
            const inPlayerCourt =
              ball.x >= COURT_MIN_X - 6 &&
              ball.x <= COURT_MAX_X + 6 &&
              ball.y >= NET_Y - 2 &&
              ball.y <= COURT_BOTTOM_BASELINE + 8;

            if (ball.bounces === 0) {
              if (inPlayerCourt) {
                // Clean first bounce in court!
                ball.bounces = 1;
                ball.vz = -ball.vz * 0.72;
                sound.playBounce(0);
              } else {
                // Opponent hit ball OUT of bounds or failed to clear net!
                ball.active = false;
                if (!eng.pointWinner) {
                  eng.pointWinner = 'player';
                  eng.pointOutcomeTimer = 900;
                  sound.playPointWon();
                  if (ball.y < NET_Y) {
                    addPopup('CPU NET FAULT! POINT TO YOU!', COURT_WIDTH / 2, NET_Y - 30, '#22c55e');
                  } else {
                    addPopup('CPU HIT OUT! POINT TO YOU!', COURT_WIDTH / 2, NET_Y + 40, '#22c55e');
                  }
                }
              }
            } else {
              // 2nd bounce on player's side without player return -> Opponent scores a winner
              ball.active = false;
              if (!eng.pointWinner) {
                eng.pointWinner = 'opponent';
                eng.pointOutcomeTimer = 900;
                sound.playPointLost();
                addPopup('MISSED RETURN!', COURT_WIDTH / 2, NET_Y + 40, '#ef4444');
              }
            }
          } else if (ball.lastHitter === 'player') {
            // Ball sent by Player toward Opponent court (Y: COURT_TOP_BASELINE to NET_Y)
            const inOppCourt =
              ball.x >= COURT_MIN_X - 6 &&
              ball.x <= COURT_MAX_X + 6 &&
              ball.y <= NET_Y + 2 &&
              ball.y >= COURT_TOP_BASELINE - 8;

            if (ball.bounces === 0) {
              if (inOppCourt) {
                // Clean first bounce in court!
                ball.bounces = 1;
                ball.vz = -ball.vz * 0.72;
                sound.playBounce(0);
              } else {
                // Player hit ball OUT of bounds or failed to clear net!
                ball.active = false;
                if (!eng.pointWinner) {
                  eng.pointWinner = 'opponent';
                  eng.pointOutcomeTimer = 900;
                  sound.playPointLost();
                  if (ball.y > NET_Y) {
                    addPopup('NET FAULT! POINT TO CPU', COURT_WIDTH / 2, NET_Y + 30, '#ef4444');
                  } else {
                    addPopup('BALL OUT! POINT TO CPU', COURT_WIDTH / 2, NET_Y - 40, '#ef4444');
                  }
                }
              }
            } else {
              // 2nd bounce on opponent's side without opponent return -> Player scores a clean winner!
              ball.active = false;
              if (!eng.pointWinner) {
                eng.pointWinner = 'player';
                eng.pointOutcomeTimer = 900;
                sound.playPointWon();
                addPopup('CLEAN WINNER!', COURT_WIDTH / 2, NET_Y - 40, '#22c55e');
              }
            }
          }
        }

        // Deep Out-Of-Bounds Check (if ball sails past stadium borders or sidelines without bouncing)
        if (
          ball.active &&
          (ball.y > COURT_BOTTOM_BASELINE + 45 ||
            ball.y < COURT_TOP_BASELINE - 45 ||
            ball.x < 15 ||
            ball.x > COURT_WIDTH - 15)
        ) {
          ball.active = false;
          if (!eng.pointWinner) {
            let winner: 'player' | 'opponent' = 'player';
            if (ball.bounces === 0) {
              // Direct hit out
              winner = ball.lastHitter === 'opponent' ? 'player' : 'opponent';
              if (winner === 'player') {
                sound.playPointWon();
                addPopup('CPU HIT OUT! POINT TO YOU!', COURT_WIDTH / 2, NET_Y + 40, '#22c55e');
              } else {
                sound.playPointLost();
                addPopup('BALL OUT! POINT TO CPU', COURT_WIDTH / 2, NET_Y - 40, '#ef4444');
              }
            } else {
              // Already bounced in court, then flew out past baseline (receiver missed it)
              winner = ball.y > NET_Y ? 'opponent' : 'player';
              if (winner === 'player') {
                sound.playPointWon();
                addPopup('CLEAN WINNER!', COURT_WIDTH / 2, NET_Y - 40, '#22c55e');
              } else {
                sound.playPointLost();
                addPopup('CPU WINNER!', COURT_WIDTH / 2, NET_Y + 40, '#ef4444');
              }
            }
            eng.pointWinner = winner;
            eng.pointOutcomeTimer = 900;
          }
        }

        // Record Trail for drawing with shot-specific visual colors
        ball.trail.unshift({
          x: ball.x,
          y: ball.y,
          z: ball.z,
          color: ball.isGolden
            ? '#facc15'
            : (ball.isSmash || ball.isFire)
            ? '#f97316'
            : ball.isLob
            ? '#38bdf8'
            : '#a3e635',
          alpha: 1.0,
        });
        if (ball.trail.length > 12) ball.trail.pop();
      });
    };

    // --- RENDER FUNCTION ---
    const render = (ctx: CanvasRenderingContext2D, eng: typeof engineRef.current) => {
      ctx.save();

      // Screen shake transform
      if (eng.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * eng.screenShake * 2;
        const shakeY = (Math.random() - 0.5) * eng.screenShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Background Court Stadium
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

      // Draw Crowd Bleachers at top
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, COURT_WIDTH, 40);
      for (let c = 15; c < COURT_WIDTH; c += 24) {
        ctx.fillStyle = (c % 48 === 0) ? '#e2e8f0' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(c, 20 + Math.sin(Date.now() * 0.005 + c) * 3, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Blue/Teal Hardcourt Arena
      const courtX = COURT_MIN_X - 15;
      const courtY = COURT_TOP_BASELINE;
      const courtW = (COURT_MAX_X - COURT_MIN_X) + 30;
      const courtH = COURT_BOTTOM_BASELINE - COURT_TOP_BASELINE;

      // Outer Court Surround
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(courtX - 15, courtY - 10, courtW + 30, courtH + 20);

      // Inner Playing Court
      const innerX = COURT_MIN_X;
      const innerY = COURT_TOP_BASELINE;
      const innerW = COURT_MAX_X - COURT_MIN_X;
      const innerH = COURT_BOTTOM_BASELINE - COURT_TOP_BASELINE;

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(innerX, innerY, innerW, innerH);

      // White Boundary Lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;

      // Outer Baseline & Sidelines
      ctx.strokeRect(innerX, innerY, innerW, innerH);

      // Singles Sidelines
      const singlesInset = 35;
      ctx.beginPath();
      ctx.moveTo(innerX + singlesInset, innerY);
      ctx.lineTo(innerX + singlesInset, innerY + innerH);
      ctx.moveTo(innerX + innerW - singlesInset, innerY);
      ctx.lineTo(innerX + innerW - singlesInset, innerY + innerH);
      ctx.stroke();

      // Service Boxes (Top and Bottom)
      const serviceLineDist = 140;
      ctx.beginPath();
      // Top service line
      ctx.moveTo(innerX + singlesInset, NET_Y - serviceLineDist);
      ctx.lineTo(innerX + innerW - singlesInset, NET_Y - serviceLineDist);
      // Bottom service line
      ctx.moveTo(innerX + singlesInset, NET_Y + serviceLineDist);
      ctx.lineTo(innerX + innerW - singlesInset, NET_Y + serviceLineDist);
      // Center service line
      ctx.moveTo(COURT_WIDTH / 2, NET_Y - serviceLineDist);
      ctx.lineTo(COURT_WIDTH / 2, NET_Y + serviceLineDist);
      ctx.stroke();

      // Center Marks on Baselines
      ctx.beginPath();
      ctx.moveTo(COURT_WIDTH / 2, innerY);
      ctx.lineTo(COURT_WIDTH / 2, innerY + 12);
      ctx.moveTo(COURT_WIDTH / 2, innerY + innerH);
      ctx.lineTo(COURT_WIDTH / 2, innerY + innerH - 12);
      ctx.stroke();

      // Draw Hazards (Ice, Lasers, Bumpers)
      eng.hazards.forEach((h) => {
        if (!h.active) return;
        if (h.type === 'ice') {
          ctx.fillStyle = h.color || 'rgba(56, 189, 248, 0.3)';
          ctx.fillRect(h.x, h.y, h.width, h.height);
          ctx.strokeStyle = '#7dd3fc';
          ctx.lineWidth = 2;
          ctx.strokeRect(h.x, h.y, h.width, h.height);
          // Ice sparkle
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Outfit, sans-serif';
          ctx.fillText('❄ SLIPPERY ICE', h.x + 8, h.y + 18);
        } else if (h.type === 'laser') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(h.x + h.width, h.y);
          ctx.stroke();
          // Laser glow
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 14;
          ctx.stroke();
        } else if (h.type === 'pinball_bumper') {
          ctx.fillStyle = h.color || '#f43f5e';
          ctx.beginPath();
          ctx.arc(h.x + (h.radius || 20), h.y, h.radius || 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });

      // Draw Net in center
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(courtX - 25, NET_Y + 2, courtW + 50, 6); // Net shadow

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(courtX - 25, NET_Y - 3, courtW + 50, 6); // Net white band

      // Net Posts
      ctx.fillStyle = '#64748b';
      ctx.fillRect(courtX - 28, NET_Y - 8, 8, 16);
      ctx.fillRect(courtX + courtW + 20, NET_Y - 8, 8, 16);

      // Draw Opponent Shadow Clones (Floor 4)
      if (boss.mechanicType === 'shadow_clone') {
        [-60, 60].forEach((offset) => {
          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = '#8b5cf6';
          ctx.beginPath();
          ctx.arc(eng.opponent.x + offset, eng.opponent.y, eng.opponent.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Draw Opponent
      const opp = eng.opponent;
      // Opponent Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(opp.x, opp.y + 12, opp.radius, opp.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Opponent Body
      ctx.fillStyle = boss.avatarColor;
      ctx.beginPath();
      ctx.arc(opp.x, opp.y, opp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Opponent Racket
      const oppRacketSize = boss.mechanicType === 'giant_racket' ? 38 : 16;
      ctx.fillStyle = boss.racketColor;
      ctx.beginPath();
      ctx.arc(opp.x + 22, opp.y + 8, oppRacketSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Opponent Nameplate
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, opp.x, opp.y - 24);

      // --- BALL LANDING RETICLE & PLAYER HIT INDICATORS ---
      const activeIncoming = eng.balls.find((b) => b.active && b.vy > 0);
      if (activeIncoming && activeIncoming.y > NET_Y - 40) {
        const bDist = Math.hypot(activeIncoming.x - eng.player.x, activeIncoming.y - eng.player.y);
        const inHitRange = bDist <= stats.swingRadius && activeIncoming.y < eng.player.y + 24;

        // Ground Floor Landing Reticle
        ctx.save();
        ctx.strokeStyle = inHitRange ? '#22c55e' : '#facc15';
        ctx.lineWidth = inHitRange ? 3 : 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(activeIncoming.x, activeIncoming.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Shrinking Altitude Timing Ring (contracts to ground as ball.z approaches 0)
        const timingRadius = Math.max(8, 16 + (activeIncoming.z / 35) * 20);
        ctx.strokeStyle = inHitRange ? '#4ade80' : 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(activeIncoming.x, activeIncoming.y, timingRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(activeIncoming.x - 8, activeIncoming.y);
        ctx.lineTo(activeIncoming.x + 8, activeIncoming.y);
        ctx.moveTo(activeIncoming.x, activeIncoming.y - 8);
        ctx.lineTo(activeIncoming.x, activeIncoming.y + 8);
        ctx.stroke();
        ctx.restore();

        // If in sweet spot reach, draw "HIT NOW!" prompt
        if (inHitRange) {
          ctx.save();
          ctx.fillStyle = '#22c55e';
          ctx.font = '900 13px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HIT NOW! [J/K/L]', eng.player.x, eng.player.y - 28);
          ctx.restore();
        }
      }

      // Draw Player
      const pl = eng.player;
      // Player Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(pl.x, pl.y + 12, pl.radius, pl.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sweet Spot Range Visual (Glowing reach perimeter)
      const isBallClose = eng.balls.some((b) => b.active && Math.hypot(b.x - pl.x, b.y - pl.y) <= stats.swingRadius);
      ctx.strokeStyle = isBallClose ? 'rgba(34, 197, 94, 0.8)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = isBallClose ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, stats.swingRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Player Body
      ctx.fillStyle = stats.hasFlamingServe ? '#f97316' : pl.color;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, pl.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Player Racket
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pl.x + (eng.keys.left ? -18 : 18), pl.y - 8, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Balls & 3D Shadow
      eng.balls.forEach((ball) => {
        if (!ball.active) return;

        // Ball Ground Shadow (displaced by ball.z)
        const shadowSize = Math.max(3, ball.radius * (1 - ball.z / 120));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y, shadowSize * 1.2, shadowSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball Trails
        ball.trail.forEach((tr, idx) => {
          ctx.fillStyle = tr.color;
          ctx.globalAlpha = (1 - idx / ball.trail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(tr.x, tr.y - tr.z, Math.max(2, ball.radius - idx * 0.4), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Ball Body (drawn at y - z)
        ctx.fillStyle = ball.isGolden ? '#facc15' : ball.isFire ? '#ef4444' : '#a3e635';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y - ball.z, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Particles
      eng.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Comic Splash Popups
      eng.popups.forEach((pop) => {
        ctx.save();
        ctx.translate(pop.x, pop.y);
        ctx.scale(pop.scale, pop.scale);
        ctx.font = '900 20px "Permanent Marker", "Rubik Mono One", Outfit, sans-serif';
        ctx.textAlign = 'center';

        // Comic drop shadow
        ctx.fillStyle = '#0f172a';
        ctx.fillText(pop.text, 2, 2);

        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, 0, 0);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeText(pop.text, 0, 0);
        ctx.restore();
      });

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, matchOver, onMatchEnd, onPointEnd, playerScore, opponentScore, stats, boss]);

  // Format match time as MM:SS
  const formattedMatchTime = `${Math.floor(matchTimeSec / 60)
    .toString()
    .padStart(2, '0')}:${(matchTimeSec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative w-full max-w-[480px] h-[95vh] max-h-[850px] min-h-[540px] mx-auto flex flex-col items-center justify-between select-none p-1 sm:p-1.5">
      {/* Top Arcade HUD */}
      <div className="w-full bg-slate-900 border-2 sm:border-4 border-slate-800 px-3 py-1.5 sm:py-2 flex items-center justify-between shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-black text-slate-950 bg-lime-400 px-1.5 py-0.5">
            ST {currentFloor < 10 ? `0${currentFloor}` : currentFloor}
          </span>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black italic uppercase text-white leading-tight">
              {boss.name}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
              <span className="truncate max-w-[85px]">{boss.title}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 flex items-center gap-0.5">
                <Clock size={10} /> {formattedMatchTime}
              </span>
            </div>
          </div>
        </div>

        {/* Score Display & Match Target */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-0.5 border-2 border-slate-800">
            <div className="text-center">
              <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">
                YOU
              </span>
              <span className="text-xl sm:text-2xl font-black text-lime-400 italic leading-none">
                {playerScore}
              </span>
            </div>
            <span className="text-slate-700 font-black text-lg">:</span>
            <div className="text-center">
              <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">
                BOSS
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-500 italic leading-none">
                {opponentScore}
              </span>
            </div>
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            FIRST TO {TARGET_POINTS} PTS
          </span>
        </div>

        {/* Controls Toggles & Sound */}
        <div className="flex items-center gap-1.5">
          {/* Auto-Assist Toggle */}
          <button
            onClick={() => setAutoAssist((prev) => !prev)}
            className={`px-2 py-1 border-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
              autoAssist
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Auto-Movement Assist [T]"
          >
            {autoAssist ? <Bot size={13} className="text-sky-400" /> : <User size={13} />}
            <span>{autoAssist ? 'ASSIST' : 'MANUAL'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 transition cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Game Canvas Wrapper with Viewport Containment */}
      <div className="relative w-full flex-1 min-h-0 bg-slate-950 border-x-2 sm:border-x-4 border-slate-800 flex justify-center items-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={COURT_WIDTH}
          height={COURT_HEIGHT}
          className="h-full w-auto max-h-full max-w-full aspect-[540/760] object-contain block touch-none cursor-crosshair shadow-2xl"
          onClick={() => {
            if (matchOver) {
              handleProceedAfterMatchOver();
              return;
            }
            if (!engineRef.current.pointInProgress) {
              if (engineRef.current.server === 'player') {
                triggerPlayerShot('serve');
              } else {
                engineRef.current.playerReadyToReceive = true;
                setServePrompt(false);
                addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
              }
            } else {
              triggerPlayerShot('normal');
            }
          }}
        />

        {/* Serve Overlay Prompt */}
        {servePrompt && !matchOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 pointer-events-none z-10">
            <div className="bg-slate-900 border-2 sm:border-4 border-lime-400 px-5 py-3 shadow-2xl text-center transform -translate-y-4 animate-bounce">
              <span className="text-xs uppercase font-black text-lime-400 tracking-widest block mb-0.5">
                {engineRef.current.server === 'player' ? '🎾 YOUR SERVE!' : '🛡️ OPPONENT READY TO SERVE'}
              </span>
              <span className="text-xs sm:text-sm font-black italic text-white uppercase block">
                {engineRef.current.server === 'player'
                  ? 'PRESS [SPACE / S] OR CLICK TO SERVE'
                  : 'PRESS [SPACE / S] OR CLICK TO RECEIVE'}
              </span>
              {engineRef.current.server === 'player' ? (
                <div className="flex items-center justify-center gap-2 mt-1.5 pt-1 border-t border-slate-800 text-[9px] font-black uppercase text-slate-300">
                  <span className="text-lime-400">[J] Normal</span>
                  <span>•</span>
                  <span className="text-amber-400">[K] Smash</span>
                  <span>•</span>
                  <span className="text-sky-400">[L] Lob</span>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                  Ready up to start the rally!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Match Won! / Lost Sign & Overlay */}
        {matchOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 text-center z-30">
            <div
              className={`w-full max-w-sm bg-slate-900 border-4 p-5 sm:p-6 flex flex-col items-center gap-3.5 shadow-2xl ${
                matchOver === 'player'
                  ? 'border-lime-400 shadow-lime-500/30'
                  : 'border-rose-500 shadow-rose-500/30'
              }`}
            >
              {/* Prominent Won! / Lost Header Sign */}
              <div className="flex items-center gap-2.5">
                {matchOver === 'player' ? (
                  <Trophy size={36} className="text-lime-400 animate-bounce" />
                ) : (
                  <ShieldAlert size={36} className="text-rose-500 animate-pulse" />
                )}
                <span
                  className={`text-5xl sm:text-6xl font-black italic tracking-tighter uppercase ${
                    matchOver === 'player'
                      ? 'text-lime-400 drop-shadow-[0_0_16px_rgba(163,230,53,0.7)]'
                      : 'text-rose-500 drop-shadow-[0_0_16px_rgba(244,63,94,0.7)]'
                  }`}
                >
                  {matchOver === 'player' ? 'WON!' : 'LOST'}
                </span>
              </div>

              {/* Final Match Score Display */}
              <div className="bg-slate-950 px-4 py-2 border-2 border-slate-800 flex items-center justify-center gap-4 w-full">
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 font-black uppercase block">PLAYER</span>
                  <span
                    className={`text-3xl font-black italic ${
                      matchOver === 'player' ? 'text-lime-400' : 'text-slate-300'
                    }`}
                  >
                    {matchEndData?.playerFinalScore ?? (matchOver === 'player' ? TARGET_POINTS : playerScore)}
                  </span>
                </div>
                <span className="text-slate-600 font-black text-2xl">:</span>
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 font-black uppercase block">{boss.name}</span>
                  <span
                    className={`text-3xl font-black italic ${
                      matchOver === 'opponent' ? 'text-rose-500' : 'text-slate-300'
                    }`}
                  >
                    {matchEndData?.oppFinalScore ?? (matchOver === 'opponent' ? TARGET_POINTS : opponentScore)}
                  </span>
                </div>
              </div>

              {/* Match Narrative / Context */}
              <div className="text-center">
                <span className="text-xs font-black uppercase text-slate-200 block mb-0.5">
                  {matchOver === 'player'
                    ? `STAGE ${currentFloor < 10 ? `0${currentFloor}` : currentFloor} CLEARED • ${boss.name} DEFEATED!`
                    : `${boss.name} DEFENDED THEIR STAGE`}
                </span>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  {matchOver === 'player'
                    ? currentFloor >= 10
                      ? 'Incredible! You defeated all stages of the tower!'
                      : 'Match won! Proceed to draft a new modifier upgrade to mutate your build.'
                    : 'Match lost. Analyze your build synergies and climb again!'}
                </p>
              </div>

              {/* Highlights Chips */}
              <div className="grid grid-cols-3 gap-1.5 w-full bg-slate-950/90 p-2 border border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <div>
                  <span className="block text-slate-500 text-[8px]">MAX RALLY</span>
                  <span className="text-white font-black">{matchEndData?.stats.rallyMax ?? currentRally}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[8px]">ACES</span>
                  <span className="text-lime-400 font-black">{matchEndData?.stats.aces ?? 0}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[8px]">TIME</span>
                  <span className="text-amber-400 font-black">{formattedMatchTime}</span>
                </div>
              </div>

              {/* Interactive Continue Action Button */}
              <button
                id="match-continue-btn"
                onClick={handleProceedAfterMatchOver}
                className={`w-full py-3 px-4 font-black italic text-xs sm:text-sm uppercase tracking-wider border-2 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95 ${
                  matchOver === 'player'
                    ? 'bg-lime-400 hover:bg-lime-300 text-slate-950 border-lime-300 animate-pulse'
                    : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                }`}
              >
                <span>
                  {matchOver === 'player'
                    ? currentFloor >= 10
                      ? 'CLAIM TOURNAMENT VICTORY →'
                      : 'DRAFT UPGRADE MODIFIER →'
                    : 'VIEW RUN SUMMARY →'}
                </span>
                <ArrowRight size={16} />
              </button>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest -mt-1">
                PRESS [SPACE / ENTER] OR CLICK TO CONTINUE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Arcade Controls & Action Bar */}
      <div className="w-full bg-slate-900 border-2 sm:border-4 border-slate-800 p-2 sm:p-2.5 shadow-2xl flex flex-col gap-1.5 flex-shrink-0">
        {/* Controls Ribbon / Key Legends */}
        <div className="flex flex-wrap items-center justify-between gap-1 bg-slate-950 px-2.5 py-1 border border-slate-800 text-[9px] sm:text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <span className="font-black text-slate-200 uppercase">MOVE:</span>
            <span className="font-bold text-lime-400">ARROWS / WASD</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <span><strong className="text-lime-400">[J]</strong> Normal</span>
            <span><strong className="text-amber-400">[K]</strong> Smash</span>
            <span><strong className="text-sky-400">[L]</strong> Lob</span>
            <span><strong className="text-rose-400">[S/SPACE]</strong> Serve</span>
            <span><strong className="text-yellow-400">[SHIFT]</strong> Dash</span>
          </div>
        </div>

        {/* Action Button Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {/* Normal Shot Button */}
          <button
            id="normal-shot-btn"
            onClick={() => {
              if (matchOver) {
                handleProceedAfterMatchOver();
                return;
              }
              if (!engineRef.current.pointInProgress && engineRef.current.server === 'opponent') {
                engineRef.current.playerReadyToReceive = true;
                setServePrompt(false);
                addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
              } else {
                triggerPlayerShot('normal');
              }
            }}
            className="py-1.5 sm:py-2 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-lime-400 font-black text-[10px] sm:text-[11px] uppercase tracking-tight border-2 border-slate-700 shadow flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
            title="Normal Drive [J / Space]"
          >
            <Target size={14} className="text-lime-400" />
            <span>NORMAL</span>
            <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold leading-none">[J]</span>
          </button>

          {/* Smash Shot Button */}
          <button
            id="smash-shot-btn"
            onClick={() => {
              if (matchOver) {
                handleProceedAfterMatchOver();
                return;
              }
              if (!engineRef.current.pointInProgress && engineRef.current.server === 'opponent') {
                engineRef.current.playerReadyToReceive = true;
                setServePrompt(false);
                addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
              } else {
                triggerPlayerShot('smash');
              }
            }}
            className="py-1.5 sm:py-2 px-1 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-400 font-black text-[10px] sm:text-[11px] uppercase tracking-tight border-2 border-amber-500/40 shadow flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
            title="Smash Spike [K / X]"
          >
            <Flame size={14} className="text-amber-400 fill-amber-400" />
            <span>SMASH</span>
            <span className="text-[8px] sm:text-[9px] text-amber-300/70 font-bold leading-none">[K]</span>
          </button>

          {/* Lob Shot Button */}
          <button
            id="lob-shot-btn"
            onClick={() => {
              if (matchOver) {
                handleProceedAfterMatchOver();
                return;
              }
              if (!engineRef.current.pointInProgress && engineRef.current.server === 'opponent') {
                engineRef.current.playerReadyToReceive = true;
                setServePrompt(false);
                addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
              } else {
                triggerPlayerShot('lob');
              }
            }}
            className="py-1.5 sm:py-2 px-1 bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-400 font-black text-[10px] sm:text-[11px] uppercase tracking-tight border-2 border-sky-500/40 shadow flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
            title="Sky Lob Arc [L / C]"
          >
            <Sparkles size={14} className="text-sky-400" />
            <span>LOB</span>
            <span className="text-[8px] sm:text-[9px] text-sky-300/70 font-bold leading-none">[L]</span>
          </button>

          {/* Serve / Ready Button */}
          <button
            id="serve-btn"
            onClick={() => {
              if (matchOver) {
                handleProceedAfterMatchOver();
                return;
              }
              if (!engineRef.current.pointInProgress) {
                if (engineRef.current.server === 'player') {
                  triggerPlayerShot('serve');
                } else {
                  engineRef.current.playerReadyToReceive = true;
                  setServePrompt(false);
                  addPopup('READY!', engineRef.current.player.x, engineRef.current.player.y - 25, '#38bdf8');
                }
              }
            }}
            className={`py-1.5 sm:py-2 px-1 active:scale-95 font-black italic text-[10px] sm:text-[11px] uppercase tracking-tight border-2 shadow flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
              servePrompt
                ? 'bg-lime-400 hover:bg-lime-300 text-slate-950 border-lime-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Serve or Ready [S / Space]"
          >
            <Send size={14} className={servePrompt ? 'text-slate-950' : 'text-slate-400'} />
            <span>{engineRef.current.server === 'player' ? 'SERVE' : 'READY'}</span>
            <span className={`text-[8px] sm:text-[9px] font-bold leading-none ${servePrompt ? 'text-slate-900' : 'text-slate-500'}`}>[S]</span>
          </button>

          {/* Dash Button */}
          <button
            id="dash-btn"
            onClick={() => {
              if (matchOver) {
                handleProceedAfterMatchOver();
                return;
              }
              triggerPlayerDash();
            }}
            className="py-1.5 sm:py-2 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-yellow-400 font-black text-[10px] sm:text-[11px] uppercase tracking-tight border-2 border-slate-700 shadow flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
            title="Dash Burst [Shift / V]"
          >
            <Zap size={14} className="fill-current text-yellow-400" />
            <span>DASH</span>
            <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold leading-none">[SHIFT]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
