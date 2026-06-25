/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Trophy, 
  Flame, 
  Zap, 
  Dribbble, 
  Tv, 
  Heart, 
  Sliders, 
  Menu, 
  X,
  Radio,
  Clock
} from "lucide-react";
import { StreamItem } from "../types";

interface SidebarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  currentView: { type: string; activeId?: string };
  setCurrentView: (view: { type: string; activeId?: string }) => void;
  streams: StreamItem[];
  favorites: string[];
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  categories: string[];
}

export default function Sidebar({
  activeCategory,
  setActiveCategory,
  currentView,
  setCurrentView,
  streams,
  favorites,
  isMobileOpen,
  setIsMobileOpen,
  categories,
}: SidebarProps) {
  
  // Count matches in categories for dynamic telemetry badges
  const getCategoryCount = (category: string) => {
    if (category === "Favorites") {
      return favorites.length;
    }
    if (category === "All Sports") {
      // Show total count for All Sports
      return streams.length;
    }
    // Other categories (Football, Cricket, Basketball, TV Channel, etc.)
    return streams.filter((s) => s.category === category).length;
  };

  const getCategoryMeta = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("football") || lower.includes("soccer")) {
      return { icon: Flame, color: "text-neon-green" };
    }
    if (lower.includes("cricket")) {
      return { icon: Zap, color: "text-neon-cyan" };
    }
    if (lower.includes("basketball")) {
      return { icon: Dribbble, color: "text-orange-500" };
    }
    if (lower.includes("tv") || lower.includes("channel") || lower.includes("live")) {
      return { icon: Tv, color: "text-purple-400" };
    }
    return { icon: Radio, color: "text-neon-cyan animate-pulse" };
  };

  const navItems = [
    { name: "All Sports", icon: Trophy, color: "text-amber-400" },
    ...categories.map((cat) => {
      const meta = getCategoryMeta(cat);
      return { name: cat, icon: meta.icon, color: meta.color };
    }),
    { name: "Favorites", icon: Heart, color: "text-rose-500" },
  ];

  const handleNavClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    setCurrentView({ type: "dashboard" });
    setIsMobileOpen(false);
  };

  const handleAdminClick = () => {
    setCurrentView({ type: "admin" });
    setIsMobileOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#07080B] border-r border-[#1E2230] p-5">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3 pb-8 border-b border-[#1E2230]">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-green to-neon-cyan p-[2px]">
          <div className="flex items-center justify-center w-full h-full bg-[#07080B] rounded-[10px]">
            <Radio className="w-5 h-5 text-neon-green animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight text-white leading-none">
            CYBER<span className="text-neon-green">STREAM</span>
          </h1>
          <p className="font-mono text-[9px] text-gray-500 tracking-widest mt-1">
            NET_SPEED: 982 Mbps
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-8 space-y-2 overflow-y-auto">
        <p className="font-mono text-[10px] text-gray-500 tracking-wider uppercase mb-3 px-2">
          Streams Navigation
        </p>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView.type === "dashboard" && activeCategory === item.name;
          const count = getCategoryCount(item.name);
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.name)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? "bg-[#12141C] border border-neon-cyan/40 text-white shadow-[0_0_15px_rgba(0,212,255,0.08)]" 
                  : "text-gray-400 hover:text-white hover:bg-[#12141C]/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? item.color : "text-gray-400 group-hover:text-white"
                }`} />
                <span className="font-sans font-medium text-sm">{item.name}</span>
              </div>
              
              {/* Telemetry Badge Count */}
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md ${
                isActive 
                  ? "bg-neon-cyan/20 text-neon-cyan" 
                  : "bg-[#1E2230] text-gray-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Admin Panel Button & Telemetry Meta */}
      <div className="pt-6 border-t border-[#1E2230] space-y-4">
        <button
          onClick={handleAdminClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            currentView.type === "admin"
              ? "bg-[#12141C] border border-neon-green/40 text-white shadow-[0_0_15px_rgba(57,255,20,0.08)]"
              : "bg-[#1E2230]/40 text-gray-400 hover:text-white hover:bg-[#1E2230]/80 border border-transparent"
          }`}
        >
          <Sliders className={`w-5 h-5 ${currentView.type === "admin" ? "text-neon-green" : "text-gray-400"}`} />
          <span className="font-sans font-medium text-sm">Admin Portal</span>
        </button>

        {/* Live System Stats Indicator */}
        <div className="bg-[#12141C] rounded-xl p-3 border border-[#1E2230] font-mono text-[10px] text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>SYS_NODE</span>
            <span className="text-neon-green animate-pulse">● ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span>SER_LAT</span>
            <span className="text-neon-cyan">14ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span>LIVE_PEER</span>
            <span className="text-white">{(streams.reduce((acc, curr) => acc + curr.viewers, 0) / 1000).toFixed(1)}K</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-40">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 lg:hidden z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="relative w-64 h-full flex flex-col z-10 animate-slide-in">
            {/* Close button inside drawer */}
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-[#1E2230] text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
}
