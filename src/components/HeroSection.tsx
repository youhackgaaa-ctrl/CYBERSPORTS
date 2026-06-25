/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, Flame, Users, Calendar } from "lucide-react";
import { StreamItem } from "../types";

interface HeroSectionProps {
  match: StreamItem;
  onWatch: (id: string) => void;
}

export default function HeroSection({ match, onWatch }: HeroSectionProps) {
  if (!match) return null;

  // Formatting viewer count
  const formatViewers = (viewers: number) => {
    if (viewers >= 1000) {
      return `${(viewers / 1000).toFixed(1)}K`;
    }
    return viewers;
  };

  return (
    <div className="relative group w-full rounded-2xl overflow-hidden border border-[#1E2230] hover:border-neon-green/30 transition-all duration-500 bg-[#12141C] shadow-2xl">
      {/* Blurred background effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl scale-110 pointer-events-none transition-all duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${match.bannerUrl})` }}
      />

      {/* Main Container */}
      <div className="relative flex flex-col md:flex-row items-stretch justify-between min-h-[340px] z-10">
        {/* Banner Image - Right Side (Desktop), Top (Mobile) */}
        <div className="md:order-2 w-full md:w-1/2 relative min-h-[220px] md:min-h-full">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${match.bannerUrl})` }}
          />
          {/* Neon overlays to blend with cyber theme */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#12141C] via-[#12141C]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#12141C]/20 via-transparent to-[#12141C]" />
          
          {/* Real-time Score Overlay if live */}
          {match.status === "Live" && match.teams && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 bg-black/85 backdrop-blur-md rounded-xl border border-neon-cyan/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1E2230] flex items-center justify-center text-lg shadow-inner overflow-hidden shrink-0 border border-neon-cyan/10">
                  {match.teams.home.logo.startsWith("http") ? (
                    <img src={match.teams.home.logo} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{match.teams.home.logo}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-bold text-[10px] text-white uppercase tracking-wider truncate max-w-[80px]">{match.teams.home.name}</span>
                  <span className="font-mono font-bold text-xs text-neon-green">{match.teams.home.score}</span>
                </div>
              </div>

              <div className="font-display font-black text-xs text-gray-700 italic px-2">VS</div>

              <div className="flex items-center gap-3 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-sans font-bold text-[10px] text-white uppercase tracking-wider truncate max-w-[80px]">{match.teams.away.name}</span>
                  <span className="font-mono font-bold text-xs text-neon-cyan">{match.teams.away.score}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#1E2230] flex items-center justify-center text-lg shadow-inner overflow-hidden shrink-0 border border-purple-500/10">
                  {match.teams.away.logo.startsWith("http") ? (
                    <img src={match.teams.away.logo} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{match.teams.away.logo}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Details - Left Side (Desktop), Bottom (Mobile) */}
        <div className="md:order-1 w-full md:w-1/2 p-6 lg:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Tags / Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-md bg-neon-green/10 border border-neon-green text-neon-green glow-green tracking-wider uppercase">
                MATCH OF THE DAY
              </span>
              
              {match.status === "Live" ? (
                <span className="flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500 text-red-500 uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  LIVE
                </span>
              ) : (
                <span className="flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md bg-neon-cyan/10 border border-neon-cyan text-neon-cyan uppercase tracking-wider">
                  <Calendar className="w-3 h-3 text-neon-cyan" />
                  UPCOMING
                </span>
              )}

              {match.status === "Live" && (
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[#1E2230] text-gray-300">
                  <Users className="w-3.5 h-3.5 text-neon-cyan" />
                  {formatViewers(match.viewers)} watching
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h2 className="font-display font-extrabold text-2xl lg:text-3xl text-white tracking-tight leading-tight group-hover:text-neon-cyan transition-colors duration-300">
              {match.title}
            </h2>
            <p className="font-sans text-sm text-gray-400 leading-relaxed max-w-md">
              {match.description}
            </p>
          </div>

          {/* Call to Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onWatch(match.id)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-sans font-semibold text-sm bg-neon-green hover:bg-neon-green/90 text-black shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 duration-300"
            >
              <Play className="w-4.5 h-4.5 fill-black stroke-black" />
              Watch Live Stream
            </button>
            
            {/* Quick Match Specs */}
            <div className="font-mono text-[10px] text-gray-500 uppercase tracking-widest space-y-0.5">
              <div>SER_ID: <span className="text-white">{match.id}</span></div>
              <div>CATEGORY: <span className="text-neon-cyan">{match.category}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
