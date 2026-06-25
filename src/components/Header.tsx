/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, Menu, User, Bell, Network } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMenuToggle: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  onMenuToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-4 bg-[#07080B]/90 backdrop-blur-md border-b border-[#1E2230]">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 lg:hidden rounded-lg bg-[#12141C] border border-[#1E2230] text-gray-400 hover:text-white transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="lg:hidden">
          <h1 className="font-display font-bold text-md text-white tracking-tight">
            CYBER<span className="text-neon-green">STREAM</span>
          </h1>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="flex-1 max-w-lg mx-4 lg:mx-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search matches, teams, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141C] border border-[#1E2230] hover:border-neon-cyan/30 focus:border-neon-cyan focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right Side Info & Profile */}
      <div className="flex items-center gap-4">
        {/* Network status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12141C] border border-[#1E2230] font-mono text-xs">
          <Network className="w-3.5 h-3.5 text-neon-green" />
          <span className="text-gray-400">LATENCY:</span>
          <span className="text-neon-cyan font-bold">14ms</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl bg-[#12141C] border border-[#1E2230] text-gray-400 hover:text-white transition-all cursor-pointer">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_#39FF14]" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#1E2230]">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-neon-green to-neon-cyan p-[2px] cursor-pointer">
            <div className="flex items-center justify-center w-full h-full bg-[#12141C] rounded-full">
              <User className="w-4 h-4 text-neon-cyan" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-neon-green border-2 border-[#07080B]" />
          </div>
          <div className="hidden md:block text-left">
            <p className="font-sans font-semibold text-xs text-white leading-none">
              Guest_892
            </p>
            <p className="font-mono text-[9px] text-neon-green tracking-wider mt-0.5 uppercase">
              VIP_STREAMER
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
