import React from 'react';
import { BossProfile, Upgrade } from '../types';
import { TOWER_BOSSES } from '../data/bosses';
import { generateBuildName } from '../utils/buildNamer';
import {
  Trophy,
  Swords,
  ChevronRight,
  Shield,
  Zap,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface TowerMapProps {
  currentFloor: number;
  upgrades: Upgrade[];
  onStartMatch: () => void;
  onViewHallOfFame: () => void;
  onResetRun: () => void;
}

export const TowerMap: React.FC<TowerMapProps> = ({
  currentFloor,
  upgrades,
  onStartMatch,
  onViewHallOfFame,
  onResetRun,
}) => {
  const currentBoss = TOWER_BOSSES.find((b) => b.floor === currentFloor) || TOWER_BOSSES[0];
  const buildIdentity = generateBuildName(upgrades, 0, currentFloor);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-8 select-none relative">
      {/* Background Giant Watermark */}
      <div className="absolute top-0 right-4 text-[120px] sm:text-[160px] leading-none font-black italic tracking-tighter text-slate-800/20 select-none pointer-events-none uppercase -z-0">
        TOWER
      </div>

      {/* Header Banner - Bold Typography Archetype */}
      <header className="bg-slate-900/90 border-2 sm:border-4 border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 overflow-hidden">
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-widest text-lime-400 uppercase opacity-90">
            Current Run: Tournament Tower
          </span>
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter leading-none mt-1 text-white uppercase">
            COURT BREAKER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-lg mt-2">
            Win fast 3-point rogue matches, stack game-breaking modifiers, and dethrone the Grand Chancellor.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end w-full md:w-auto">
          <div className="text-3xl sm:text-5xl font-black text-rose-500 italic tracking-tighter leading-none">
            STAGE {currentFloor < 10 ? `0${currentFloor}` : currentFloor}
          </div>
          <div className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400 mt-1">
            {currentBoss.name}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4 w-full md:w-auto">
            <button
              onClick={onViewHallOfFame}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider border border-slate-700 transition cursor-pointer"
            >
              Hall of Fame
            </button>
            <button
              onClick={onResetRun}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Reset Run"
            >
              <RotateCcw size={16} />
            </button>
            <button
              id="start-match-btn"
              onClick={onStartMatch}
              className="flex-1 md:flex-none py-2.5 px-6 bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 text-xs uppercase tracking-widest font-black shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Swords size={16} />
              <span>ENTER MATCH</span>
            </button>
          </div>
        </div>
      </header>

      {/* Current Build Identity Card */}
      <div className="bg-slate-900 border-2 sm:border-4 border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-lime-400 flex items-center justify-center text-slate-950 font-black shrink-0">
            <Zap size={24} className="fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              ACTIVE BUILD PROFILE
            </span>
            <h2 className="text-xl sm:text-2xl font-black italic text-rose-500 uppercase tracking-tight leading-tight">
              "{buildIdentity.name}"
            </h2>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">
              {buildIdentity.tagline}
            </span>
          </div>
        </div>

        {/* Upgrades Count Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 border-2 border-slate-800 self-stretch sm:self-auto justify-center">
          <Sparkles size={16} className="text-lime-400" />
          <span className="text-xs font-black uppercase tracking-wider text-lime-400">
            {upgrades.length} Active Modifiers
          </span>
        </div>
      </div>

      {/* Tower Ladder Progression Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {TOWER_BOSSES.map((boss) => {
          const isCleared = boss.floor < currentFloor;
          const isCurrent = boss.floor === currentFloor;
          const isLocked = boss.floor > currentFloor;
          const floorNumFormatted = boss.floor < 10 ? `0${boss.floor}` : `${boss.floor}`;

          return (
            <div
              key={boss.floor}
              className={`relative p-5 border-2 sm:border-4 transition-all flex items-center justify-between gap-4 group overflow-hidden ${
                isCurrent
                  ? 'border-lime-400 bg-slate-900 shadow-2xl ring-4 ring-lime-400/20'
                  : isCleared
                  ? 'border-slate-800 bg-slate-900/60 opacity-80'
                  : 'border-slate-800/80 bg-slate-950/40 opacity-40'
              }`}
            >
              {/* Background Floor Ghost Number */}
              <div className="absolute top-1 right-2 text-5xl font-black text-slate-800 -z-0 opacity-40 select-none pointer-events-none">
                {floorNumFormatted}
              </div>

              <div className="flex items-center gap-3.5 min-w-0 relative z-10">
                {/* Floor Number Badge */}
                <div
                  className={`w-11 h-11 flex items-center justify-center font-black text-sm shrink-0 border-2 ${
                    isCurrent
                      ? 'bg-lime-400 text-slate-950 border-lime-300'
                      : isCleared
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {isCleared ? <CheckCircle2 size={22} /> : floorNumFormatted}
                </div>

                {/* Boss Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black italic uppercase text-white truncate tracking-tight">
                      {boss.name}
                    </h3>
                    {boss.floor === 10 && (
                      <span className="text-[9px] bg-rose-900/40 text-rose-400 font-black uppercase px-2 py-0.5 border border-rose-500/40">
                        FINAL BOSS
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium block truncate">
                    {boss.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase text-lime-400 bg-slate-950 px-2 py-0.5 border border-slate-800">
                      Gimmick: {boss.mechanicName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 relative z-10">
                {isCurrent && (
                  <button
                    onClick={onStartMatch}
                    className="py-2 px-4 bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider shadow transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>FIGHT</span>
                    <ChevronRight size={14} />
                  </button>
                )}
                {isCleared && (
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2.5 py-1 border border-emerald-500/30">
                    DEFEATED
                  </span>
                )}
                {isLocked && <Lock size={18} className="text-slate-600" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

