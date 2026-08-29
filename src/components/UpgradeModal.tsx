import React, { useState } from 'react';
import { Upgrade, PlayerStats } from '../types';
import { generateBuildName } from '../utils/buildNamer';
import { sound } from '../services/sound';
import {
  Flame,
  Sparkles,
  Hourglass,
  Zap,
  Target,
  Layers,
  Coins,
  EyeOff,
  Disc,
  Moon,
  HeartCrack,
  ShieldAlert,
  Compass,
  Split,
  Activity,
  Wind,
  Radio,
  Footprints,
  Rocket,
  Award,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface UpgradeModalProps {
  upgrades: Upgrade[];
  currentPickedUpgrades: Upgrade[];
  onSelectUpgrade: (upgrade: Upgrade) => void;
  floor: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  Sparkles,
  Hourglass,
  Zap,
  Target,
  Layers,
  Coins,
  EyeOff,
  Disc,
  Moon,
  HeartCrack,
  ShieldAlert,
  Compass,
  Split,
  Activity,
  Wind,
  Radio,
  Footprints,
  Rocket,
  Award,
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  upgrades,
  currentPickedUpgrades,
  onSelectUpgrade,
  floor,
}) => {
  const [hoveredUpgrade, setHoveredUpgrade] = useState<Upgrade | null>(null);

  const previewBuild = hoveredUpgrade
    ? generateBuildName([...currentPickedUpgrades, hoveredUpgrade], 0, floor)
    : generateBuildName(currentPickedUpgrades, 0, floor);

  const handleSelect = (up: Upgrade) => {
    sound.playUpgradeSelect();
    onSelectUpgrade(up);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-amber-900/30 text-amber-400 border-amber-500/40';
      case 'epic':
        return 'bg-purple-900/30 text-purple-400 border-purple-500/40';
      case 'rare':
        return 'bg-sky-900/30 text-sky-400 border-sky-500/40';
      default:
        return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/40';
    }
  };

  const getCategoryArchetype = (category: string) => {
    switch (category) {
      case 'shot':
        return { label: 'Aggressive', style: 'bg-rose-900/30 text-rose-400 border-rose-700/50' };
      case 'movement':
        return { label: 'Agility', style: 'bg-amber-900/30 text-amber-400 border-amber-700/50' };
      case 'focus':
        return { label: 'Utility', style: 'bg-sky-900/30 text-sky-400 border-sky-700/50' };
      case 'court':
        return { label: 'Chaos', style: 'bg-indigo-900/30 text-indigo-400 border-indigo-700/50' };
      default:
        return { label: 'Special', style: 'bg-lime-900/30 text-lime-400 border-lime-700/50' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto select-none">
      <div className="w-full max-w-5xl bg-slate-900 border-2 sm:border-4 border-slate-800 p-6 sm:p-10 shadow-2xl flex flex-col gap-6 my-auto relative overflow-hidden">
        {/* Background Giant Watermark */}
        <h2 className="text-[100px] sm:text-[140px] leading-none font-black italic tracking-tighter text-slate-800 absolute -top-8 sm:-top-14 left-6 sm:left-10 -z-0 opacity-20 uppercase select-none pointer-events-none">
          PICK POWER
        </h2>

        {/* Header */}
        <div className="relative z-10">
          <span className="text-xs font-black tracking-widest text-lime-400 uppercase opacity-90 block mb-1">
            Stage {floor < 10 ? `0${floor}` : floor} Cleared
          </span>
          <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
            SELECT YOUR MODIFIER
          </h3>
          <p className="text-slate-400 font-medium max-w-lg mt-2 text-xs sm:text-sm">
            Victory achieved! Choose one enhancement to corrupt your racket and build lethal synergy combos.
          </p>
        </div>

        {/* Upgrade Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {upgrades.map((up, idx) => {
            const IconComponent = ICON_MAP[up.iconName] || Sparkles;
            const isHovered = hoveredUpgrade?.id === up.id;
            const isFirst = idx === 1; // Highlight middle one as recommended by default or hovered
            const isHighlighted = isHovered || (!hoveredUpgrade && isFirst);
            const archetype = getCategoryArchetype(up.category);
            const indexLabel = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;

            return (
              <div
                key={up.id}
                onMouseEnter={() => setHoveredUpgrade(up)}
                onMouseLeave={() => setHoveredUpgrade(null)}
                onClick={() => handleSelect(up)}
                className={`bg-slate-900 border-2 sm:border-4 p-6 flex flex-col group transition-all duration-150 cursor-pointer relative overflow-hidden text-left ${
                  isHighlighted
                    ? 'border-lime-400 ring-4 ring-lime-400/20 scale-[1.01]'
                    : 'border-slate-700 hover:border-lime-400'
                }`}
              >
                {/* Background Ghost Number */}
                <div className="absolute top-2 right-2 text-6xl font-black text-slate-800 -z-0 opacity-50 select-none pointer-events-none">
                  {indexLabel}
                </div>

                {isFirst && (
                  <div className="absolute top-0 right-0 bg-lime-400 text-slate-950 text-[10px] font-black px-3 py-1 uppercase tracking-tighter z-10">
                    Recommended
                  </div>
                )}

                <div>
                  {/* Rarity & Category Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 border ${getRarityBadge(
                        up.rarity
                      )}`}
                    >
                      {up.rarity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {up.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-2xl sm:text-3xl font-black italic uppercase leading-tight mb-3 text-lime-400">
                    {up.name}
                  </h4>

                  {/* Description */}
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    {up.description}
                  </p>

                  {/* Flavor Quote */}
                  <p className="text-xs italic text-slate-400 mb-4">
                    {up.flavorQuote}
                  </p>
                </div>

                {/* Footer Archetype & Stat Buffs */}
                <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1 tracking-wider">
                      Archetype
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-2 py-1 border ${archetype.style}`}
                    >
                      {archetype.label}
                    </span>
                  </div>
                  <div className="text-xs font-black uppercase text-lime-400 tracking-wider">
                    {up.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Build Synergy Preview */}
        <div className="bg-slate-950 border-2 sm:border-4 border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-lime-400 flex items-center justify-center text-slate-950 font-black text-sm shrink-0">
              <Zap size={24} className="fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                {hoveredUpgrade ? 'PREVIEWING MUTATED BUILD TITLE:' : 'CURRENT BUILD TITLE:'}
              </span>
              <span className="text-lg sm:text-xl font-black italic text-rose-500 uppercase tracking-tight">
                "{previewBuild.name}"
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400 italic text-center sm:text-right max-w-xs font-medium">
            {previewBuild.tagline}
          </span>
        </div>
      </div>
    </div>
  );
};
