/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, HelpCircle, AlertCircle, Sparkles, FilterX, RotateCcw } from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

import { StreamItem } from "./types";
import { INITIAL_STREAMS } from "./mockData";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import StreamCard from "./components/StreamCard";
import WatchPage from "./components/WatchPage";
import AdminPanel from "./components/AdminPanel";
import MultiWatchPage from "./components/MultiWatchPage";

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
  // { type: "dashboard" | "watch" | "admin" | "multiwatch", activeId?: string, activeIds?: string[] }
  const [currentView, setCurrentView] = useState<{ type: string; activeId?: string; activeIds?: string[] }>(() => {
    return { type: "dashboard" };
  });

  // Handle Multi-Watch Toggle
  const handleToggleMultiWatch = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    
    setCurrentView((prev) => {
      const currentIds = prev.activeIds || [];
      const alreadyAdded = currentIds.includes(id);
      
      let nextIds: string[];
      if (alreadyAdded) {
        nextIds = currentIds.filter(cid => cid !== id);
      } else {
        // Limit to 4 streams for performance/layout
        if (currentIds.length >= 4) {
          alert("Maximum 4 streams allowed in Multi-View");
          return prev;
        }
        nextIds = [...currentIds, id];
      }

      return { 
        ...prev, 
        type: nextIds.length > 0 ? "multiwatch" : "dashboard",
        activeIds: nextIds 
      };
    });
  };

  // Active filter category
  const [activeCategory, setActiveCategory] = useState<string>("All Sports");

  // Search filter Query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("cyber_admin_auth") === "true";
  });

  // Sync admin auth to localStorage
  useEffect(() => {
    localStorage.setItem("cyber_admin_auth", isAdminAuthenticated.toString());
  }, [isAdminAuthenticated]);

  // Dynamic categories state (Now backed by Firestore)
  const [categories, setCategories] = useState<string[]>(["Football", "Cricket", "Basketball", "TV Channel"]);

  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");

  // Sync streams from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let fallbackUnsubscribe: (() => void) | null = null;

    const handleSnapshot = (snapshot: any) => {
      const streamsData: StreamItem[] = [];
      snapshot.forEach((doc: any) => {
        streamsData.push({ id: doc.id, ...doc.data() } as StreamItem);
      });
      
      const isFromCache = snapshot.metadata.fromCache;
      const isPending = snapshot.metadata.hasPendingWrites;
      
      console.log(`[MATRIX] Update Received. Nodes: ${streamsData.length}. Source: ${isFromCache ? 'LOCAL_CACHE' : 'SERVER_UPLINK'}. Pending: ${isPending}`);
      
      // Even if empty, we set loading to false to show the dashboard empty state rather than a spinner
      setStreams(streamsData);
      setLoading(false);
      setError(null);
      setConnectionStatus("connected");
    };

    const startListening = () => {
      setConnectionStatus("connecting");
      const q = query(collection(db, "streams"), orderBy("createdAt", "desc"));
      
      unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        handleSnapshot(snapshot);
      }, (err) => {
        console.warn("[MATRIX] Ordered sync failed, engaging fallback protocol...", err);
        const qSimple = query(collection(db, "streams"));
        fallbackUnsubscribe = onSnapshot(qSimple, { includeMetadataChanges: true }, (snapshot) => {
          handleSnapshot(snapshot);
        }, (fallbackErr) => {
          console.error("[MATRIX] Global Link Failure:", fallbackErr);
          setError(`Matrix Link Failure: ${fallbackErr.message}`);
          setConnectionStatus("failed");
          setLoading(false);
        });
      });
    };

    startListening();

    return () => {
      if (unsubscribe) unsubscribe();
      if (fallbackUnsubscribe) fallbackUnsubscribe();
    };
  }, []);

  // Sync categories from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "categories"), async (snapshot) => {
      if (snapshot.exists()) {
        const list = snapshot.data().list || [];
        console.log(`[MATRIX] Categories Synced: ${list.length} units detected.`);
        if (list.length > 0) {
          setCategories(list);
        } else {
          setCategories(["Football", "Cricket", "Basketball", "TV Channel"]);
        }
      } else {
        console.warn("[MATRIX] Categories node missing. Initializing standard protocols...");
        const defaultCats = ["Football", "Cricket", "Basketball", "TV Channel"];
        setCategories(defaultCats);
        try {
          await setDoc(doc(db, "settings", "categories"), { list: defaultCats });
          console.log("[MATRIX] Protocols initialized successfully.");
        } catch (e) {
          console.error("[MATRIX] Initialization Error:", e);
        }
      }
    }, (error) => {
      console.error("[MATRIX] Category Sync Failure:", error);
      setError("Secondary Data Link Failure. Some interface elements may be missing.");
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
  
  // Track streams already in multi-view
  const multiWatchIds = currentView.activeIds || [];

  if (activeCategory === "All Sports") {
    // Show all streams in the main dashboard
    filteredStreams = [...streams];
  } else if (activeCategory === "Favorites") {
    // Favorites category shows all streams favorited by the user
    filteredStreams = streams.filter((s) => favorites.includes(s.id));
  } else {
    // Other categories (Football, Cricket, Basketball, TV Channel, etc.)
    // Show all items in that category
    filteredStreams = streams.filter((s) => s.category === activeCategory);
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
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-neon-green/30 rounded-full animate-spin [animation-duration:1.5s]"></div>
              </div>
              <p className="mt-4 font-mono text-[10px] text-neon-cyan uppercase tracking-widest animate-pulse">
                Establishing Stream Node Connection...
              </p>
            </div>
          ) : (
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
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-tighter">Current Grid Sector</span>
                      <span className="font-mono text-[11px] text-neon-cyan font-bold tracking-widest flex items-center gap-2">
                        {filteredStreams.length} / {streams.length} <span className="text-[9px] text-gray-600 font-normal">NODES_SYNCED</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connection Status & Refresh */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E2230]/40 border border-[#1E2230] backdrop-blur-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === "connected" ? "bg-neon-green shadow-[0_0_8px_#39FF14]" : 
                        connectionStatus === "connecting" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                      }`} />
                      <span className="font-mono text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {connectionStatus === "connected" ? "LINK_ACTIVE" : 
                         connectionStatus === "connecting" ? "SYNCHRONIZING..." : "LINK_LOST"}
                      </span>
                    </div>
                    {connectionStatus === "failed" && (
                      <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[10px] font-bold hover:bg-red-500/20 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        RE-ESTABLISH LINK
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-2">
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-tighter">Network Latency</span>
                      <span className="font-mono text-[11px] text-neon-cyan font-bold tracking-widest">0.42ms_OPTIC</span>
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="p-2.5 rounded-xl bg-[#1E2230]/40 border border-[#1E2230] text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all group"
                      title="Refresh Stream Grid"
                    >
                      <RotateCcw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-500 font-mono text-xs">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Match/Stream Grid */}
                {filteredStreams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-[#1E2230] rounded-3xl bg-[#12141C]/30 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full bg-[#1E2230] flex items-center justify-center mb-4">
                      <FilterX className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tight">
                      NO ACTIVE NODES FOUND
                    </h3>
                    <p className="text-gray-500 font-mono text-xs max-w-xs leading-relaxed uppercase tracking-tighter">
                      The matrix frequency is silent. No streams currently matching your sector filter or search criteria.
                    </p>
                    {streams.length > 0 && (
                      <div className="mt-6 flex flex-col items-center gap-3">
                        <p className="text-neon-cyan font-mono text-[10px] uppercase tracking-widest animate-pulse">
                          {streams.length} Total nodes detected in other sectors
                        </p>
                        <button 
                          onClick={() => setActiveCategory("All Sports")}
                          className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-[10px] rounded-lg hover:bg-neon-cyan/20 transition-all uppercase tracking-wider"
                        >
                          View All Sports Feed
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredStreams.map((stream) => (
                      <StreamCard
                        key={stream.id}
                        stream={stream}
                        isFavorited={favorites.includes(stream.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onWatch={handleWatchStream}
                        isMultiWatch={multiWatchIds.includes(stream.id)}
                        onToggleMultiWatch={handleToggleMultiWatch}
                      />
                    ))}
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
                  isAdmin={isAdminAuthenticated}
                />
              </motion.div>
            )}

            {/* VIEW D: MULTI-VIEW MATRIX */}
            {currentView.type === "multiwatch" && currentView.activeIds && (
              <motion.div
                key="multiwatch-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <MultiWatchPage
                  streams={streams}
                  activeIds={currentView.activeIds}
                  onBack={() => setCurrentView({ type: "dashboard" })}
                  onRemoveId={(id) => handleToggleMultiWatch(id)}
                  onAddStream={() => setCurrentView({ type: "dashboard" })}
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
                  onClose={() => setCurrentView({ type: "dashboard" })}
                  isAdminAuthenticated={isAdminAuthenticated}
                  setIsAdminAuthenticated={setIsAdminAuthenticated}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
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
