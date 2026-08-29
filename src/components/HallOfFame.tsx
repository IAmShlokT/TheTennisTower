import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { ALL_UPGRADES } from '../data/upgrades';
import { Trophy, Sparkles, ArrowLeft, RotateCcw, Clock, Target, Award, Flame, Zap, Layers } from 'lucide-react';

interface HallOfFameProps {
  onBack: () => void;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'compendium' | 'stats'>('runs');
  const runs = storage.getRuns();
  const stats = storage.getCareerStats();
  const unlockedIds = storage.getUnlockedUpgrades();

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-8 select-none my-auto relative">
      <div className="bg-slate-900 border-2 sm:border-4 border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute top-0 right-4 text-7xl sm:text-9xl font-black text-slate-800 -z-0 opacity-25 select-none pointer-events-none uppercase">
          ARCHIVES
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-700 transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <span className="text-xs font-black tracking-widest text-lime-400 uppercase opacity-90 block">
                CAREER RECORDS & ARCHIVES
              </span>
              <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white uppercase leading-none mt-1">
                HALL OF FAME
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 border-2 border-slate-800">
            <button
              onClick={() => setActiveTab('runs')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'runs'
                  ? 'bg-lime-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Past Runs ({runs.length})
            </button>
            <button
              onClick={() => setActiveTab('compendium')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'compendium'
                  ? 'bg-lime-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Modifiers ({ALL_UPGRADES.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-lime-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stats
            </button>
          </div>
        </div>

        {/* TAB 1: PAST RUNS */}
        {activeTab === 'runs' && (
          <div className="flex flex-col gap-3.5 max-h-[480px] overflow-y-auto pr-1 relative z-10">
            {runs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-wider text-sm border-2 border-dashed border-slate-800 bg-slate-950/50 p-8">
                No completed runs recorded yet. Conquer the tower to forge your legacy!
              </div>
            ) : (
              runs.map((r, idx) => (
                <div
                  key={r.id}
                  className="bg-slate-950 border-2 sm:border-4 border-slate-800 hover:border-lime-400 transition-all p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                          r.wonRun
                            ? 'bg-lime-900/30 text-lime-400 border-lime-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {r.wonRun ? 'CHAMPION' : `STAGE ${r.floorsCleared < 10 ? `0${r.floorsCleared}` : r.floorsCleared} / 10`}
                      </span>
                      <span className="text-xs text-slate-500 font-bold uppercase">{r.date}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black italic text-rose-500 uppercase tracking-tight">
                      "{r.buildName}"
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {r.upgrades.map((uName) => (
                        <span
                          key={uName}
                          className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-0.5"
                        >
                          {uName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-xs font-black text-slate-300 shrink-0 self-end sm:self-center bg-slate-900 p-3 border-2 border-slate-800">
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold tracking-wider">
                        MAX RALLY
                      </span>
                      <span className="text-base text-white">{r.maxRally}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold tracking-wider">
                        ACES
                      </span>
                      <span className="text-base text-lime-400">{r.totalAces}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold tracking-wider">
                        TIME
                      </span>
                      <span className="text-base text-rose-400">{Math.round(r.timeSeconds)}s</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: COMPENDIUM */}
        {activeTab === 'compendium' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto pr-1 relative z-10">
            {ALL_UPGRADES.map((u) => {
              const isSeen = unlockedIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  className="bg-slate-950 border-2 sm:border-4 border-slate-800 hover:border-lime-400 transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-slate-900 text-lime-400 border border-slate-800">
                        {u.rarity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {u.category}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black italic text-white uppercase mb-1">
                      {u.name}
                    </h3>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {u.description}
                    </p>
                  </div>
                  <p className="text-[11px] italic text-slate-400 border-t border-slate-900 pt-2">
                    {u.flavorQuote}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: CAREER STATS */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
            <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 text-center">
              <span className="text-xs text-slate-500 uppercase font-black tracking-widest block mb-1">
                TOWERS CONQUERED
              </span>
              <span className="text-4xl sm:text-5xl font-black text-lime-400 italic">
                {stats.towersCleared}
              </span>
            </div>
            <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 text-center">
              <span className="text-xs text-slate-500 uppercase font-black tracking-widest block mb-1">
                TOTAL RUNS
              </span>
              <span className="text-4xl sm:text-5xl font-black text-white italic">
                {stats.runsAttempted}
              </span>
            </div>
            <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 text-center">
              <span className="text-xs text-slate-500 uppercase font-black tracking-widest block mb-1">
                HIGHEST RALLY
              </span>
              <span className="text-4xl sm:text-5xl font-black text-lime-400 italic">
                {stats.highestRally}
              </span>
            </div>
            <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 text-center">
              <span className="text-xs text-slate-500 uppercase font-black tracking-widest block mb-1">
                TOTAL ACES
              </span>
              <span className="text-4xl sm:text-5xl font-black text-rose-500 italic">
                {stats.totalAces}
              </span>
            </div>
            <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 text-center">
              <span className="text-xs text-slate-500 uppercase font-black tracking-widest block mb-1">
                PERFECT HITS
              </span>
              <span className="text-4xl sm:text-5xl font-black text-white italic">
                {stats.totalPerfectHits}
              </span>
            </div>
            <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 text-center">
              <span className="text-xs text-slate-500 uppercase font-black tracking-widest block mb-1">
                POINTS WON
              </span>
              <span className="text-4xl sm:text-5xl font-black text-lime-400 italic">
                {stats.totalPointsWon}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
