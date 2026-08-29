import React from 'react';
import { BossProfile } from '../types';
import { Swords, ShieldAlert, Zap, Flame, Play } from 'lucide-react';

interface MatchIntroOverlayProps {
  boss: BossProfile;
  floor: number;
  buildName: string;
  onBeginMatch: () => void;
}

export const MatchIntroOverlay: React.FC<MatchIntroOverlayProps> = ({
  boss,
  floor,
  buildName,
  onBeginMatch,
}) => {
  const stageFormatted = floor < 10 ? `0${floor}` : `${floor}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-slate-900 border-2 sm:border-4 border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center animate-in fade-in zoom-in duration-150 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute top-2 right-4 text-7xl font-black text-slate-800 -z-0 opacity-40 select-none pointer-events-none">
          STAGE {stageFormatted}
        </div>

        {/* Match Header */}
        <div className="relative z-10">
          <span className="text-xs font-black tracking-widest text-lime-400 uppercase opacity-90 block mb-1">
            STAGE {stageFormatted} // BOSS ENCOUNTER
          </span>
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
            {boss.name}
          </h1>
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400 block mt-2">
            "{boss.title}"
          </span>
        </div>

        {/* Comic Dialogue Quote */}
        <div className="relative bg-slate-950 border-2 sm:border-4 border-slate-800 p-4 sm:p-5 text-center z-10">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            OPPONENT TAUNT:
          </div>
          <p className="text-base sm:text-lg font-black italic text-lime-400">
            {boss.dialogQuotes.intro}
          </p>
        </div>

        {/* Hazard & Mechanic Warning Box */}
        <div className="bg-rose-950/30 border-2 sm:border-4 border-rose-500/50 p-4 sm:p-5 text-left flex items-start gap-4 z-10">
          <div className="w-11 h-11 bg-rose-900/50 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="text-xs uppercase font-black text-rose-400 tracking-wider block">
              Boss Hazard: {boss.mechanicName}
            </span>
            <p className="text-xs sm:text-sm text-rose-200 mt-1 leading-relaxed font-medium">
              {boss.mechanicDesc}
            </p>
          </div>
        </div>

        {/* Player Build Summary */}
        <div className="flex items-center justify-between bg-slate-950 border-2 border-slate-800 px-4 py-3 text-xs z-10">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            CURRENT BUILD:
          </span>
          <span className="font-black italic text-rose-500 text-sm uppercase">
            "{buildName}"
          </span>
        </div>

        {/* Controls Quick Reference */}
        <div className="bg-slate-950 border-2 border-slate-800 p-3 text-xs z-10 flex flex-wrap items-center justify-around gap-2 text-slate-300">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-slate-500 text-[10px] uppercase">MOVE:</span>
            <span className="text-lime-400">ARROWS / WASD</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[11px]">
            <span><strong className="text-lime-400">[J]</strong> Normal</span>
            <span><strong className="text-amber-400">[K]</strong> Smash</span>
            <span><strong className="text-sky-400">[L]</strong> Lob</span>
            <span><strong className="text-rose-400">[S / Space]</strong> Serve</span>
            <span><strong className="text-yellow-400">[Shift]</strong> Dash</span>
          </div>
        </div>

        {/* Start Match Button */}
        <button
          id="begin-match-btn"
          onClick={onBeginMatch}
          className="w-full py-4 px-6 bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 text-sm font-black italic uppercase tracking-widest shadow-xl shadow-lime-400/20 flex items-center justify-center gap-2 transition cursor-pointer z-10"
        >
          <Play size={20} className="fill-current" />
          <span>SERVE FIRST POINT (FIRST TO 3)</span>
        </button>
      </div>
    </div>
  );
};
