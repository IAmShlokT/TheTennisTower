import React, { useState, useEffect } from 'react';
import { SavedRun, Upgrade } from '../types';
import { generateBuildName } from '../utils/buildNamer';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  Clock,
  Target,
  Award,
} from 'lucide-react';

interface BuildShareCardProps {
  run: SavedRun;
  upgrades: Upgrade[];
  isVictory: boolean;
  onPlayAgain: () => void;
  onViewHallOfFame: () => void;
}

export const BuildShareCard: React.FC<BuildShareCardProps> = ({
  run,
  upgrades,
  isVictory,
  onPlayAgain,
  onViewHallOfFame,
}) => {
  const [copied, setCopied] = useState(false);
  const buildIdentity = generateBuildName(upgrades, run.maxRally, run.floorsCleared);

  useEffect(() => {
    if (isVictory) {
      // Fire victory confetti cannon
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  const generateShareText = () => {
    const medal = isVictory ? '🏆 TOWER CONQUERED!' : `🎾 Tower Floor ${run.floorsCleared}/10`;
    const upgradeList = upgrades.map((u) => `• ${u.name}`).join('\n');
    return `${medal}\n🔥 BUILD: "${buildIdentity.name}"\n⏱ Time: ${Math.round(run.timeSeconds)}s | Max Rally: ${run.maxRally} | Aces: ${run.totalAces}\n\nModifiers:\n${upgradeList}\n\nCan you beat the Moon Court in Super Tennis Roguelite?`;
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 sm:p-6 select-none my-auto relative">
      <div className="bg-slate-900 border-2 sm:border-4 border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute top-0 right-4 text-7xl sm:text-8xl font-black text-slate-800 -z-0 opacity-30 select-none pointer-events-none uppercase">
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </div>

        {/* Victory/Defeat Banner */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-widest mb-2 border bg-lime-900/30 text-lime-400 border-lime-500/40">
            {isVictory ? (
              <>
                <Trophy size={14} />
                <span>TOURNAMENT GRAND CHAMPION</span>
              </>
            ) : (
              <span>RUN FINISHED • STAGE {run.floorsCleared < 10 ? `0${run.floorsCleared}` : run.floorsCleared} / 10</span>
            )}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
            {isVictory ? 'THE TOWER IS YOURS!' : 'GOOD RUN, ROOKIE!'}
          </h1>
        </div>

        {/* Viral Build Badge Card */}
        <div className="bg-slate-950 border-2 sm:border-4 border-lime-400 p-6 shadow-2xl relative overflow-hidden text-left z-10 ring-4 ring-lime-400/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">
              OFFICIAL RUN BUILD PASSPORT
            </span>
            <span className="text-xs text-slate-400 font-black uppercase">
              {run.floorsCleared} / 10 Stages
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black italic text-rose-500 mb-1 uppercase tracking-tight leading-tight">
            "{buildIdentity.name}"
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 italic mb-5 font-medium">
            {buildIdentity.tagline}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900 p-3.5 border-2 border-slate-800 text-center mb-5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                Max Rally
              </span>
              <span className="text-xl sm:text-2xl font-black text-white">
                {run.maxRally}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                Total Aces
              </span>
              <span className="text-xl sm:text-2xl font-black text-lime-400">
                {run.totalAces}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                Run Time
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-500">
                {Math.round(run.timeSeconds)}s
              </span>
            </div>
          </div>

          {/* Upgrades List */}
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block mb-2">
              EQUIPPED MODIFIERS ({upgrades.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {upgrades.map((u) => (
                <span
                  key={u.id}
                  className="text-xs bg-slate-900 border-2 border-slate-800 text-slate-200 font-bold px-3 py-1 flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-lime-400" />
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
          <button
            onClick={handleCopyShare}
            className="w-full sm:flex-1 py-3.5 px-5 bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY BUILD & BRAG'}</span>
          </button>

          <button
            onClick={onViewHallOfFame}
            className="w-full sm:w-auto py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider border-2 border-slate-700 transition cursor-pointer"
          >
            HALL OF FAME
          </button>

          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-3.5 px-5 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>START NEW RUN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
