/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, HelpCircle, AlertCircle, Sparkles, FilterX } from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "./lib/firebase";

import { StreamItem } from "./types";
import { INITIAL_STREAMS } from "./mockData";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import StreamCard from "./components/StreamCard";
import WatchPage from "./components/WatchPage";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Streams State (Now backed by Firestore)
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Favorites State (Kept in localStorage as it's user-specific)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("cyber_favorites");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved favorites", e);
      }
    }
    return [];
  });

  // Current View Router State
  // { type: "dashboard" | "watch" | "admin", activeId?: string }
  const [currentView, setCurrentView] = useState<{ type: string; activeId?: string }>(() => {
    return { type: "dashboard" };
  });

  // Active filter category
  const [activeCategory, setActiveCategory] = useState<string>("All Sports");

  // Search filter Query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Dynamic categories state (Now backed by Firestore)
  const [categories, setCategories] = useState<string[]>([]);

  // Sync streams from Firestore
  useEffect(() => {
    const q = query(collection(db, "streams"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const streamsData: StreamItem[] = [];
      snapshot.forEach((doc) => {
        streamsData.push({ id: doc.id, ...doc.data() } as StreamItem);
      });
      setStreams(streamsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync categories from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "categories"), (doc) => {
      if (doc.exists()) {
        setCategories(doc.data().list || []);
      } else {
        // Initialize if not exists
        setCategories(["Football", "Cricket", "Basketball", "TV Channel"]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync favorites state to localStorage
  useEffect(() => {
    localStorage.setItem("cyber_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync categories state to localStorage
  useEffect(() => {
    localStorage.setItem("cyber_categories", JSON.stringify(categories));
  }, [categories]);

  // Handle toggling favorite stream
  const handleToggleFavorite = (id: string, e: any) => {
    e.stopPropagation(); // Prevent clicking card from opening stream
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favId) => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Watch Action
  const handleWatchStream = (id: string) => {
    setCurrentView({ type: "watch", activeId: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to default mock streams (Admin Only logic)
  const handleResetDefaults = async () => {
    if (!window.confirm("Are you sure you want to reset all streams to defaults? This will affect all users.")) return;
    
    try {
      const batch = writeBatch(db);
      
      // Delete all current streams
      streams.forEach((s) => {
        batch.delete(doc(db, "streams", s.id));
      });
      
      // Add initial streams
      INITIAL_STREAMS.forEach((s) => {
        const newDocRef = doc(collection(db, "streams"));
        batch.set(newDocRef, {
          ...s,
          createdAt: new Date()
        });
      });
      
      await batch.commit();
      setFavorites([]);
    } catch (error) {
      console.error("Error resetting defaults:", error);
    }
  };

  // Core Category Filtering Logic
  let filteredStreams = [...streams];

  if (activeCategory === "All Sports") {
    // Only show items where showInAllSports is enabled (pinned)
    filteredStreams = streams.filter((s) => s.showInAllSports === true);
  } else if (activeCategory === "Favorites") {
    // Favorites category shows all streams favorited by the user
    filteredStreams = streams.filter((s) => favorites.includes(s.id));
  } else {
    // Other categories (Football, Cricket, Basketball, TV Channel, etc.) show unpinned items in that category
    filteredStreams = streams.filter(
      (s) => s.category === activeCategory && s.showInAllSports !== true
    );
  }

  // Real-time Search Filter overlay
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    filteredStreams = filteredStreams.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(query);
      const matchCategory = s.category.toLowerCase().includes(query);
      const matchHome = s.teams?.home.name.toLowerCase().includes(query);
      const matchAway = s.teams?.away.name.toLowerCase().includes(query);
      return matchTitle || matchCategory || matchHome || matchAway;
    });
  }

  // Extract Feature Hero: "Match of the Day"
  // Under the "All Sports" view, we only feature streams that are actually pinned to All Sports (showInAllSports === true)
  const matchOfTheDay = 
    streams.find((s) => s.isMatchOfTheDay && s.showInAllSports === true) || 
    streams.find((s) => s.showInAllSports === true && s.status === "Live") || 
    streams.find((s) => s.showInAllSports === true) || 
    undefined;

  return (
    <div className="flex min-h-screen bg-cyber-dark text-white selection:bg-neon-cyan/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* 1. Left-hand sticky Sidebar (Handles drawer too) */}
      <Sidebar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        currentView={currentView}
        setCurrentView={setCurrentView}
        streams={streams}
        favorites={favorites}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        categories={categories}
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. Top Navigation Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* 3. Screen Views with animated transition effects */}
        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            
            {/* VIEW A: DASHBOARD VIEW */}
            {currentView.type === "dashboard" && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Featured Hero: Show only on empty search and All Sports / Sports screens */}
                {searchQuery.trim() === "" && activeCategory === "All Sports" && matchOfTheDay && (
                  <HeroSection
                    match={matchOfTheDay}
                    onWatch={handleWatchStream}
                  />
                )}

                {/* Grid List Header & Filter Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E2230]/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-neon-green" />
                    <h2 className="font-display font-bold text-lg tracking-tight uppercase">
                      {activeCategory === "All Sports" ? "Premium Active Streams" : `${activeCategory} Arena`}
                    </h2>
                    {searchQuery && (
                      <span className="font-mono text-xs text-gray-400 normal-case">
                        — matching "{searchQuery}"
                      </span>
                    )}
                  </div>

                  {/* Feed Info Badges */}
                  <div className="font-mono text-[10px] text-gray-500 uppercase flex items-center gap-3">
                    {activeCategory === "All Sports" && (
                      <span className="flex items-center gap-1.5 text-neon-cyan bg-[#12141C] px-2.5 py-1 rounded border border-[#1E2230]">
                        <Sparkles className="w-3.5 h-3.5" />
                        ALL SPORTS FEED: ADMIN CONTROLLABLE
                      </span>
                    )}
                    <span>GRID_COUNT: <span className="text-white">{filteredStreams.length}</span></span>
                  </div>
                </div>

                {/* Match/Stream Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStreams.map((stream) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      isFavorited={favorites.includes(stream.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onWatch={handleWatchStream}
                    />
                  ))}
                </div>

                {/* Empty State Fallback */}
                {filteredStreams.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-12 bg-[#12141C] border border-[#1E2230] rounded-2xl text-center max-w-xl mx-auto">
                    <FilterX className="w-12 h-12 text-gray-500 mb-4" />
                    <h3 className="font-display font-semibold text-base text-white mb-1.5">
                      NO MATCH PACKETS DETECTED
                    </h3>
                    <p className="font-sans text-sm text-gray-400 mb-6">
                      No stream sources match the current filter or search criteria inside the grid network.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/90 text-black font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Clear Search Filter
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveCategory("All Sports");
                          setSearchQuery("");
                        }}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs rounded-xl transition-all"
                      >
                        Reset Navigation
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW B: INTERACTIVE WATCH PAGE */}
            {currentView.type === "watch" && currentView.activeId && (
              <motion.div
                key="watch-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <WatchPage
                  streamId={currentView.activeId}
                  streams={streams}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onBack={() => setCurrentView({ type: "dashboard" })}
                />
              </motion.div>
            )}

            {/* VIEW C: ADMIN PORTAL PANEL */}
            {currentView.type === "admin" && (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <AdminPanel
                  streams={streams}
                  setStreams={setStreams}
                  onResetDefaults={handleResetDefaults}
                  categories={categories}
                  setCategories={setCategories}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Footer info brand bar */}
        <footer className="py-6 px-8 border-t border-[#1E2230] bg-[#07080B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest text-center sm:text-left">
            © 2026 CYBERSTREAM MATRIX NODE. BROADCASTS SYNCHRONIZED DIRECTLY TO CLIENT-PORT.
          </p>
          <div className="flex items-center gap-4 text-gray-500 font-mono text-[9px]">
            <span>SYSTEMS: SECURED</span>
            <span>PING: 14MS</span>
            <span>PEERS: ACTIVE</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
