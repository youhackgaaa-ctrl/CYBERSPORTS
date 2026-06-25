/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Heart, Users, Play, Radio, Calendar, Clock, Layout } from "lucide-react";
import { StreamItem } from "../types";

interface StreamCardProps {
  stream: StreamItem;
  isFavorited: boolean;
  onToggleFavorite: (id: string, e: any) => void;
  onWatch: (id: string) => void;
  isMultiWatch: boolean;
  onToggleMultiWatch: (id: string, e: any) => void;
  key?: React.Key;
}

export default function StreamCard({
  stream,
  isFavorited,
  onToggleFavorite,
  onWatch,
  isMultiWatch,
  onToggleMultiWatch,
}: StreamCardProps) {
  const isLive = stream.status === "Live";
  const isTv = stream.category === "TV Channel";

  // Live Countdown State
  const [timeLeft, setTimeLeft] = React.useState(() => {
    if (!stream.startTime) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    const diff = new Date(stream.startTime).getTime() - Date.now();
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
      seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
      isOver: diff <= 0,
    };
  });

  React.useEffect(() => {
    if (!stream.startTime) return;
    const interval = setInterval(() => {
      const diff = new Date(stream.startTime!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isOver: false,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stream.startTime]);

  // Formatter for viewers
  const formatViewers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };

  return (
    <div 
      onClick={() => onWatch(stream.id)}
      className="group relative flex flex-col justify-between bg-[#12141C] border border-[#1E2230] hover:border-neon-cyan/50 rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.06)] transform hover:-translate-y-1 cursor-pointer"
    >
      {/* Background glow effects */}
      <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity duration-300 group-hover:opacity-20 ${
        isTv ? "bg-purple-500" : isLive ? "bg-neon-green" : "bg-neon-cyan"
      }`} />

      {/* Top row: Status badges and Favorite heart */}
        <div className="flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5">
            {stream.status !== "Live" && !timeLeft.isOver ? (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 tracking-wider uppercase animate-pulse">
                <Clock className="w-2.5 h-2.5" />
                {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}{timeLeft.hours.toString().padStart(2, "0")}h {timeLeft.minutes.toString().padStart(2, "0")}m {timeLeft.seconds.toString().padStart(2, "0")}s
              </span>
            ) : isLive ? (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 tracking-wider uppercase animate-pulse">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan tracking-wider uppercase">
                <Calendar className="w-2.5 h-2.5" />
                UPCOMING
              </span>
            )}

            <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded-md ${
              isTv 
                ? "bg-purple-500/10 border border-purple-500/30 text-purple-400" 
                : "bg-[#1E2230] text-gray-400"
            }`}>
              {stream.category.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-View Button */}
            {isLive && (
              <button
                onClick={(e) => onToggleMultiWatch(stream.id, e)}
                className={`p-2 rounded-xl transition-all duration-300 bg-[#1E2230]/40 border border-[#1E2230] group/multi hover:bg-[#1E2230] cursor-pointer ${
                  isMultiWatch 
                    ? "text-neon-cyan border-neon-cyan/30 shadow-[0_0_8px_rgba(0,212,255,0.2)]" 
                    : "text-gray-400 hover:text-neon-cyan"
                }`}
                title={isMultiWatch ? "Remove from Multi-View" : "Add to Multi-View"}
              >
                <Layout className={`w-4 h-4 transition-transform duration-300 group-hover/multi:scale-110 ${
                  isMultiWatch ? "fill-neon-cyan/20" : ""
                }`} />
              </button>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => onToggleFavorite(stream.id, e)}
              className={`p-2 rounded-xl transition-all duration-300 bg-[#1E2230]/40 border border-[#1E2230] group/fav hover:bg-[#1E2230] cursor-pointer ${
                isFavorited 
                  ? "text-rose-500 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]" 
                  : "text-gray-400 hover:text-rose-400"
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform duration-300 group-hover/fav:scale-125 ${
                isFavorited ? "fill-rose-500 text-rose-500" : ""
              }`} />
            </button>
          </div>
        </div>

      {/* Middle row: Team scoreboards or Channel Art */}
      <div className="my-6 z-10 flex-1 flex flex-col justify-center">
        {!isTv && stream.teams ? (
          /* Match Layout (Home vs Away) */
          <div className="flex items-center justify-between gap-2">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1E2230]/60 border border-[#1E2230] flex items-center justify-center text-2xl mb-2.5 shadow-inner transition-transform group-hover:scale-105 p-1">
                {stream.teams.home.logo.startsWith("http") || stream.teams.home.logo.startsWith("/") ? (
                  <img 
                    src={stream.teams.home.logo} 
                    alt={stream.teams.home.name} 
                    className="w-8 h-8 object-contain rounded" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <span>{stream.teams.home.logo}</span>
                )}
              </div>
              <span className="font-sans font-bold text-xs text-white uppercase tracking-wider block max-w-[85px] truncate">
                {stream.teams.home.name}
              </span>
            </div>

            {/* Score / VS Display */}
            <div className="flex flex-col items-center px-2">
              {isLive ? (
                <div className="flex items-center gap-1 bg-[#12141C] px-3 py-1.5 rounded-xl border border-[#1E2230] shadow-md font-mono font-extrabold text-base tracking-widest text-white">
                  <span className="text-neon-green">{stream.teams.home.score}</span>
                  <span className="text-gray-600 font-normal">:</span>
                  <span className="text-neon-cyan">{stream.teams.away.score}</span>
                </div>
              ) : (
                <div className="text-gray-500 font-mono font-bold text-[10px] bg-[#1E2230] px-3 py-1.5 rounded-xl border border-transparent uppercase tracking-widest">
                  VS
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1E2230]/60 border border-[#1E2230] flex items-center justify-center text-2xl mb-2.5 shadow-inner transition-transform group-hover:scale-105 p-1">
                {stream.teams.away.logo.startsWith("http") || stream.teams.away.logo.startsWith("/") ? (
                  <img 
                    src={stream.teams.away.logo} 
                    alt={stream.teams.away.name} 
                    className="w-8 h-8 object-contain rounded" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <span>{stream.teams.away.logo}</span>
                )}
              </div>
              <span className="font-sans font-bold text-xs text-white uppercase tracking-wider block max-w-[85px] truncate">
                {stream.teams.away.name}
              </span>
            </div>
          </div>
        ) : (
          /* TV Channel Layout (Beautiful Single Banner Frame) */
          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-[#1E2230] bg-[#07080B]/50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-[1px] group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: `url(${stream.bannerUrl})` }}
            />
            {/* Cyber overlay test grid */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#12141C]/80 via-transparent to-[#12141C]/30" />
            
            {/* Floating Live Signal */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/85 font-mono text-[8px] font-bold text-purple-400 tracking-widest border border-purple-500/20">
              <Radio className="w-2.5 h-2.5 animate-pulse text-purple-400" />
              STATION_ON
            </div>

            {/* Center Logo/Play overlay */}
            <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 border border-purple-500/35 backdrop-blur-sm group-hover:border-purple-400/80 transition-all duration-300">
              {stream.logo && (
                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-base shrink-0">
                  {stream.logo.startsWith("http") || stream.logo.startsWith("/") ? (
                    <img 
                      src={stream.logo} 
                      alt="station logo" 
                      className="w-4 h-4 object-contain rounded-sm" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <span>{stream.logo}</span>
                  )}
                </div>
              )}
              <Play className="w-3.5 h-3.5 fill-purple-400 text-purple-400 ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom row: Title and real-time viewers telemetry */}
      <div className="border-t border-[#1E2230] pt-4 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {stream.logo && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl border ${
              isTv 
                ? "bg-purple-500/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]" 
                : "bg-neon-cyan/10 border-neon-cyan/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            }`}>
              {stream.logo.startsWith("http") || stream.logo.startsWith("/") ? (
                <img 
                  src={stream.logo} 
                  alt="logo" 
                  className="w-6 h-6 object-contain rounded-md" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <span className="font-sans select-none">{stream.logo}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-sm text-gray-200 group-hover:text-white transition-colors duration-300 truncate">
              {stream.title}
            </p>
            <p className="font-sans text-[11px] text-gray-500 truncate">
              {isTv ? "24/7 Live Stream Network" : `${stream.category} Tournament`}
            </p>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-1 font-mono text-[10px] text-gray-400 font-medium px-2 py-1 rounded-md bg-[#1E2230]/40 border border-[#1E2230]">
            <Users className="w-3.5 h-3.5 text-neon-cyan" />
            <span>{formatViewers(stream.viewers)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
