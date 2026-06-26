/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  CheckCircle, 
  Tv, 
  Flame, 
  Zap, 
  Dribbble,
  ShieldCheck,
  AlertTriangle,
  Star,
  Activity,
  Calendar,
  Users,
  Lock,
  Key,
  Radio,
  Clock,
  Settings,
  ArrowLeft
} from "lucide-react";
import { collection, addDoc, updateDoc, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { StreamItem } from "../types";

interface AdminPanelProps {
  streams: StreamItem[];
  setStreams: React.Dispatch<React.SetStateAction<StreamItem[]>>;
  onResetDefaults: () => void;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
}

export default function AdminPanel({
  streams,
  setStreams,
  onResetDefaults,
  categories,
  setCategories,
  onClose,
  isAdminAuthenticated,
  setIsAdminAuthenticated,
}: AdminPanelProps) {
  // Form State
  const [activeTab, setActiveTab] = useState<"streams" | "categories">("streams");
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    category: (categories[0] || "Football") as string,
    isAddingNewCategory: false,
    newCategoryName: "",
    status: "Live" as "Live" | "Upcoming",
    streamUrl: "",
    viewers: 25000,
    bannerUrl: "",
    description: "",
    startTime: "",
    showInAllSports: true,
    logo: "",
    // Teams (optional fields)
    homeName: "",
    homeLogo: "⚽",
    homeScore: 0,
    awayName: "",
    awayLogo: "🛡️",
    awayScore: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [bannerPreset, setBannerPreset] = useState("Stadium Classic");
  const [toastMessage, setToastMessage] = useState("");

  // Category Management Form State
  const [newCatName, setNewCatName] = useState("");
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState("");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      showToast("❌ ERROR: Category already exists!");
      return;
    }
    
    try {
      const newList = [...categories, name];
      await setDoc(doc(db, "settings", "categories"), { list: newList });
      setNewCatName("");
      showToast(`❇️ SUCCESS: "${name}" registered as dynamic category.`);
    } catch (error) {
      console.error("Error adding category:", error);
      showToast("❌ ERROR: Failed to save category.");
    }
  };

  const handleStartEditCategory = (index: number) => {
    setEditingCatIdx(index);
    setEditingCatValue(categories[index]);
  };

  const handleSaveCategory = async (index: number) => {
    const originalName = categories[index];
    const newName = editingCatValue.trim();
    if (!newName) return;
    if (categories.some((c, i) => i !== index && c.toLowerCase() === newName.toLowerCase())) {
      showToast("❌ ERROR: Category name already exists!");
      return;
    }
    
    try {
      const newList = categories.map((c, i) => (i === index ? newName : c));
      await setDoc(doc(db, "settings", "categories"), { list: newList });
      
      // Update all streams matching originalName to newName
      // This is a bit complex for a client-side update but we'll do it for the streams we have in memory
      // Ideally this would be a server-side task or a batch update
      const updates = streams
        .filter((s) => s.category === originalName)
        .map((s) => updateDoc(doc(db, "streams", s.id), { category: newName }));
      
      await Promise.all(updates);
      
      setEditingCatIdx(null);
      setEditingCatValue("");
      showToast(`⚡ SUCCESS: Renamed category to "${newName}".`);
    } catch (error) {
      console.error("Error saving category:", error);
      showToast("❌ ERROR: Failed to update category.");
    }
  };

  const handleDeleteCategory = async (index: number) => {
    const nameToDelete = categories[index];
    
    try {
      const newList = categories.filter((_, i) => i !== index);
      await setDoc(doc(db, "settings", "categories"), { list: newList });
      
      // Re-assign streams of deleted category to Uncategorized
      const updates = streams
        .filter((s) => s.category === nameToDelete)
        .map((s) => updateDoc(doc(db, "streams", s.id), { category: "Uncategorized" }));
      
      await Promise.all(updates);
      
      showToast(`🔥 DELETED: Category "${nameToDelete}" removed.`);
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("❌ ERROR: Failed to delete category.");
    }
  };

  const bannerPresets: Record<string, string> = {
    "Stadium Classic": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
    "Cricket Lights": "https://images.unsplash.com/photo-1531415080290-bc98545ab2ef?auto=format&fit=crop&q=80&w=1200",
    "Basketball Net": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200",
    "Speed Racing": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1200",
    "MMA Octagon": "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200",
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Admin Authentication Session State
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUser = usernameInput.trim().toLowerCase();
    const normalizedPass = passwordInput.trim();

    if (normalizedUser === "rajibgyt" && normalizedPass === "Bl4ze!Hunter$55") {
      setIsAdminAuthenticated(true);
      setAuthError("");
      showToast("🔐 ACCESS GRANTED: Admin session initialized.");
    } else {
      setAuthError("INVALID ENCRYPTION PASS-KEY. RE-TRY OR CONTACT SYS_ADMIN.");
      showToast("❌ ACCESS DENIED: Authentication mismatch.");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setUsernameInput("");
    setPasswordInput("");
    showToast("🔓 LOCKED: Admin session terminated.");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const target = e.target;
    if (name === "category" && value === "ADD_NEW") {
      setFormData((prev) => ({
        ...prev,
        isAddingNewCategory: true,
      }));
      return;
    }

    const val = target instanceof HTMLInputElement && target.type === "checkbox"
      ? target.checked
      : name === "viewers" || name === "homeScore" || name === "awayScore"
        ? parseInt(value) || 0
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setBannerPreset(name);
    setFormData((prev) => ({
      ...prev,
      bannerUrl: bannerPresets[name],
    }));
  };

  // Submit stream form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.streamUrl.trim()) {
      showToast("❌ ERROR: Match title and Stream URL are mandatory packets!");
      return;
    }

    let finalCategory = formData.category;
    
    // Auto-register new category if requested
    if (formData.isAddingNewCategory && formData.newCategoryName.trim()) {
      const newCat = formData.newCategoryName.trim();
      if (!categories.includes(newCat)) {
        try {
          const newList = [...categories, newCat];
          await setDoc(doc(db, "settings", "categories"), { list: newList });
          finalCategory = newCat;
        } catch (err) {
          console.error("Error auto-adding category:", err);
        }
      } else {
        finalCategory = newCat;
      }
    }

    const defaultLogoMap: Record<string, string> = {
      "Football": "⚽",
      "Cricket": "🏏",
      "Basketball": "🏀",
      "TV Channel": "📺"
    };
    const defaultLogo = defaultLogoMap[finalCategory] || "🏆";

    // Construct stream model
    const streamData: any = {
      title: formData.title,
      category: finalCategory,
      status: formData.status,
      streamUrl: formData.streamUrl,
      viewers: formData.status === "Upcoming" ? 0 : formData.viewers,
      startTime: formData.status === "Upcoming" && formData.startTime ? formData.startTime : null,
      bannerUrl: formData.bannerUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
      description: formData.description || `Live stream event for the ${formData.category} series. Broadcasters synchronized.`,
      showInAllSports: formData.showInAllSports,
      logo: formData.logo || defaultLogo,
    };

    // Add team details if not TV Channel
    if (formData.category !== "TV Channel") {
      streamData.teams = {
        home: {
          name: formData.homeName || "Home Force",
          logo: formData.homeLogo || "⚡",
          score: formData.homeScore,
        },
        away: {
          name: formData.awayName || "Away Cyber",
          logo: formData.awayLogo || "🪐",
          score: formData.awayScore,
        }
      };
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, "streams", formData.id), streamData);
        showToast("⚡ SUCCESS: Stream matrix packet updated in real-time!");
      } else {
        await addDoc(collection(db, "streams"), {
          ...streamData,
          createdAt: serverTimestamp()
        });
        showToast("❇️ SUCCESS: New stream registered into the node grid!");
      }
      handleResetForm();
    } catch (error) {
      console.error("Error saving stream:", error);
      showToast("❌ ERROR: Failed to save stream node.");
    }
  };

  // Populate form to edit
  const handleEditClick = (stream: StreamItem) => {
    setIsEditing(true);
    setFormData({
      id: stream.id,
      title: stream.title,
      category: stream.category,
      status: stream.status,
      streamUrl: stream.streamUrl,
      viewers: stream.viewers,
      bannerUrl: stream.bannerUrl || "",
      description: stream.description || "",
      startTime: stream.startTime || "",
      showInAllSports: stream.showInAllSports !== false,
      logo: stream.logo || "",
      homeName: stream.teams?.home.name || "",
      homeLogo: stream.teams?.home.logo || "⚽",
      homeScore: stream.teams?.home.score || 0,
      awayName: stream.teams?.away.name || "",
      awayLogo: stream.teams?.away.logo || "🛡️",
      awayScore: stream.teams?.away.score || 0,
    });
  };

  // Delete stream
  const handleDeleteClick = async (id: string) => {
    try {
      await deleteDoc(doc(db, "streams", id));
      showToast("🔥 REMOVED: Stream node disconnected and deleted.");
    } catch (error) {
      console.error("Error deleting stream:", error);
      showToast("❌ ERROR: Failed to remove stream node.");
    }
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setFormData({
      id: "",
      title: "",
      category: categories[0] || "Football",
      isAddingNewCategory: false,
      newCategoryName: "",
      status: "Live",
      streamUrl: "",
      viewers: 25000,
      bannerUrl: bannerPresets["Stadium Classic"],
      description: "",
      startTime: "",
      showInAllSports: true,
      logo: "",
      homeName: "",
      homeLogo: "⚽",
      homeScore: 0,
      awayName: "",
      awayLogo: "🛡️",
      awayScore: 0,
    });
  };

  // Adjust score for team
  const handleAdjustScore = async (id: string, team: "home" | "away", delta: number) => {
    const stream = streams.find(s => s.id === id);
    if (!stream || !stream.teams) return;

    const currentHome = stream.teams.home.score;
    const currentAway = stream.teams.away.score;
    const homeScore = team === "home" ? Math.max(0, currentHome + delta) : currentHome;
    const awayScore = team === "away" ? Math.max(0, currentAway + delta) : currentAway;

    try {
      await updateDoc(doc(db, "streams", id), {
        "teams.home.score": homeScore,
        "teams.away.score": awayScore
      });
      showToast(`⚡ Score Adjusted: ${stream.teams.home.name} ${homeScore} - ${awayScore} ${stream.teams.away.name}`);
    } catch (error) {
      console.error("Error adjusting score:", error);
      showToast("❌ ERROR: Failed to update score.");
    }
  };

  // Toggle Live/Upcoming Status directly
  const handleToggleStatus = async (id: string) => {
    const stream = streams.find(s => s.id === id);
    if (!stream) return;

    const nextStatus = stream.status === "Live" ? "Upcoming" : "Live";
    const nextViewers = nextStatus === "Live" ? Math.floor(Math.random() * 20000) + 8000 : 0;

    try {
      await updateDoc(doc(db, "streams", id), {
        status: nextStatus,
        viewers: nextViewers
      });
      showToast(`📡 Node Status set to: ${nextStatus.toUpperCase()}`);
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("❌ ERROR: Failed to update node status.");
    }
  };

  // Toggle Featured Match of the Day pin
  const handleToggleMatchOfTheDay = async (id: string) => {
    const targetStream = streams.find((s) => s.id === id);
    if (!targetStream) return;
    const isCurrentlyMOTD = targetStream.isMatchOfTheDay;
    const targetState = !isCurrentlyMOTD;

    try {
      // First, unpin all other MOTDs to ensure only one
      const batch = streams
        .filter((s) => s.isMatchOfTheDay && s.id !== id)
        .map((s) => updateDoc(doc(db, "streams", s.id), { isMatchOfTheDay: false }));
      
      await Promise.all([
        ...batch,
        updateDoc(doc(db, "streams", id), { isMatchOfTheDay: targetState })
      ]);

      if (targetState) {
        showToast(`🌟 FEATURED: Pinned "${targetStream.title}" as Match of the Day!`);
      } else {
        showToast("⭐ Unpinned Match of the Day");
      }
    } catch (error) {
      console.error("Error toggling MOTD:", error);
      showToast("❌ ERROR: Failed to update featured slot.");
    }
  };

  // Toggle showInAllSports directly from table
  const handleToggleShowInAllSports = async (id: string) => {
    const stream = streams.find(s => s.id === id);
    if (!stream) return;

    const nextState = stream.showInAllSports !== true;

    try {
      await updateDoc(doc(db, "streams", id), {
        showInAllSports: nextState
      });
      showToast(
        nextState 
          ? `❇️ PINNED: "${stream.title}" visible on All Sports feed!` 
          : `🚫 UNPINNED: "${stream.title}" removed from All Sports feed.`
      );
    } catch (error) {
      console.error("Error toggling pin:", error);
      showToast("❌ ERROR: Failed to update feed pin.");
    }
  };

  // Bulk test stream generator
  const handleGenerateRandomMatch = async () => {
    const cats: ("Football" | "Cricket" | "Basketball")[] = ["Football", "Cricket", "Basketball"];
    const randomCategory = cats[Math.floor(Math.random() * cats.length)];
    
    const teamNames: Record<string, string[]> = {
      Football: ["Dhaka Cyber", "Madrid Alliance", "Nexus United", "Tokyo Force", "London Titans", "Berlin FC"],
      Cricket: ["Sylhet Warriors", "Rangers XI", "Mumbai Thunder", "Melbourne Titans", "Calcutta Titans", "Lahore Kings"],
      Basketball: ["Galaxy Dunks", "Boston Nets", "Chicago Bulls", "LA Cyber", "Golden Stars", "Miami Cyber"],
    };
    
    const logos: Record<string, string[]> = {
      Football: ["⚽", "⚡", "🦖", "🦊", "🦁", "🏆"],
      Cricket: ["🏏", "🎯", "☄️", "🐯", "🦅", "⚔️"],
      Basketball: ["🏀", "🔥", "🪐", "🌟", "👾", "🦊"],
    };

    const catTeams = teamNames[randomCategory];
    const catLogos = logos[randomCategory];
    
    const homeIdx = Math.floor(Math.random() * catTeams.length);
    let awayIdx = Math.floor(Math.random() * catTeams.length);
    while (awayIdx === homeIdx) {
      awayIdx = Math.floor(Math.random() * catTeams.length);
    }

    const homeName = catTeams[homeIdx];
    const awayName = catTeams[awayIdx];
    const homeLogo = catLogos[Math.floor(Math.random() * catLogos.length)];
    const awayLogo = catLogos[Math.floor(Math.random() * catLogos.length)];
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);
    
    const streamData: any = {
      title: `${randomCategory} Clash: ${homeName} vs ${awayName}`,
      category: randomCategory,
      status: "Live",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      viewers: Math.floor(Math.random() * 45000) + 15000,
      bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
      description: `Hyper-generated live matchup for the ${randomCategory} Premier league. Broadcasting systems active.`,
      teams: {
        home: { name: homeName, logo: homeLogo, score: homeScore },
        away: { name: awayName, logo: awayLogo, score: awayScore },
      },
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "streams"), streamData);
      showToast(`🔥 GENERATED: ${streamData.title} is now LIVE!`);
    } catch (error) {
      console.error("Error generating match:", error);
      showToast("❌ ERROR: Failed to generate random match.");
    }
  };

  // Get icons for sports category
  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("football") || lower.includes("soccer")) {
      return <Flame className="w-4 h-4 text-neon-green" />;
    }
    if (lower.includes("cricket")) {
      return <Zap className="w-4 h-4 text-neon-cyan" />;
    }
    if (lower.includes("basketball")) {
      return <Dribbble className="w-4 h-4 text-orange-500" />;
    }
    if (lower.includes("tv") || lower.includes("channel") || lower.includes("live")) {
      return <Tv className="w-4 h-4 text-purple-400" />;
    }
    return <Radio className="w-4 h-4 text-neon-cyan animate-pulse" />;
  };

  const totalNodes = streams.length;
  const liveCount = streams.filter((s) => s.status === "Live").length;
  const upcomingCount = streams.filter((s) => s.status === "Upcoming").length;
  const totalAudience = streams.reduce((sum, s) => sum + (s.status === "Live" ? s.viewers : 0), 0);
  const featuredMatch = streams.find((s) => s.isMatchOfTheDay)?.title || "None Pinned";

  if (!isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 animate-fade-in font-sans">
        
        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-cyber-dark border border-neon-green text-neon-green font-mono text-xs px-5 py-3.5 rounded-xl shadow-[0_0_25px_rgba(57,255,20,0.3)] flex items-center gap-2.5 animate-bounce-short">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="w-full max-w-md bg-[#12141C] border border-[#1E2230] rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.6)] space-y-6 relative overflow-hidden">
          
          {/* Cyberpunk ambient top scanline decoration */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse"></div>
          
          {/* Security Gate Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto animate-pulse">
              <Lock className="w-6 h-6" />
            </div>
            
            <h2 className="font-display font-extrabold text-lg text-white tracking-tight uppercase mt-4">
              SECURE TELEMETRY GATE
            </h2>
            <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
              Matrix administration console security gateway
            </p>
          </div>

          {/* Secure Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
            
            {/* Username Input block */}
            <div className="space-y-1.5 text-left">
              <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block">
                SYS_USER_NAME
              </label>
              <input
                type="text"
                required
                placeholder="Enter administrator ID..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-[#07080B] border border-[#1E2230] hover:border-gray-700 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all font-mono"
              />
            </div>

            {/* Password Input block */}
            <div className="space-y-1.5 text-left">
              <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block">
                SYS_PASS_KEY
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#07080B] border border-[#1E2230] hover:border-gray-700 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all font-mono"
              />
            </div>

            {/* Verification status error message */}
            {authError && (
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 font-mono text-[10px] uppercase text-center leading-normal animate-pulse">
                ⚠ {authError}
              </div>
            )}

            {/* Submit Auth Action */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider text-white cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
            >
              <Key className="w-4 h-4" />
              DECRYPT & ACCESS NODE
            </button>
            
          </form>

          {/* System Hint Footer */}
          <div className="border-t border-[#1E2230]/50 pt-4 text-center">
            <p className="font-mono text-[8px] text-gray-500 uppercase">
              NODE SECURED BY MIL-grade AES-256 ENCRYPTION
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-cyber-dark text-white font-sans p-2 lg:p-4 animate-fade-in">
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E2230] pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 border border-[#1E2230] hover:border-rose-500/50 text-gray-400 hover:text-rose-500 transition-all mr-2 group"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green glow-green">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white leading-none">
              ADMIN CONTROL CENTER
            </h1>
            <p className="font-mono text-[10px] text-gray-500 tracking-wider mt-1 uppercase">
              Centralized video telemetry, scores, and streaming node registries
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          <button
            onClick={handleGenerateRandomMatch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green text-black hover:bg-neon-green/90 transition-all text-xs font-bold cursor-pointer shadow-[0_0_15px_rgba(57,255,20,0.25)] hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            Generate Live Match
          </button>

          <button
            onClick={() => {
              onResetDefaults();
              showToast("🔄 RESTORED: Default sports and TV channels reloaded.");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E2230] hover:bg-[#1E2230]/80 text-gray-300 hover:text-white border border-[#1E2230] transition-all text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Default Streams
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/35 transition-all text-xs font-semibold cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            Lock Session
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-[#12141C] border border-[#1E2230] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("streams")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "streams" 
              ? "bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,212,255,0.3)]" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"
          }`}
        >
          <Activity className="w-4 h-4" />
          Stream Nodes
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "categories" 
              ? "bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,212,255,0.3)]" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"
          }`}
        >
          <Settings className="w-4 h-4" />
          Category Management
        </button>
      </div>

      {/* Real-time stats widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 flex flex-col justify-between text-left">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">TOTAL_NODES</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-extrabold text-white">{totalNodes}</span>
            <span className="font-mono text-[8px] text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.5 rounded">CONNECTED</span>
          </div>
        </div>

        <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 flex flex-col justify-between text-left">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">LIVE_NOW</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-extrabold text-red-500">{liveCount}</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
          </div>
        </div>

        <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 flex flex-col justify-between text-left">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">UPCOMING_SCHEDULE</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-extrabold text-neon-cyan">{upcomingCount}</span>
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 flex flex-col justify-between text-left">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">LIVE_AUDIENCE</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-2xl font-extrabold text-neon-green">{totalAudience.toLocaleString()}</span>
            <Users className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-[#12141C] border border-[#1E2230] rounded-xl p-4 flex flex-col justify-between text-left">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">FEATURED_HERO_SLOT</p>
          <div className="mt-1 flex flex-col">
            <span className="font-sans font-extrabold text-xs text-yellow-400 truncate max-w-[150px]" title={featuredMatch}>
              ★ {featuredMatch}
            </span>
            <span className="font-mono text-[8px] text-gray-600 uppercase mt-0.5">Hero Banner Target</span>
          </div>
        </div>

      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4.5 py-3.5 rounded-xl bg-[#12141C] border border-neon-cyan text-white shadow-[0_0_20px_rgba(0,212,255,0.25)] animate-fade-in font-mono text-xs font-bold uppercase">
          <CheckCircle className="w-4 h-4 text-neon-cyan" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "streams" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column wrapper containing both form and category management cards */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Stream registration form card */}
          <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#1E2230] pb-4">
              <h3 className="font-display font-bold text-base text-white">
                {isEditing ? "⚙️ UPDATE STREAM NODE" : "➕ REGISTER NEW STREAM"}
              </h3>
              <p className="font-sans text-[11px] text-gray-500 mt-0.5">
                Input valid URLs and scores to stream across the platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title */}
              <div className="space-y-1.5 text-left">
                <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                  Match or Channel Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Premier Cup: Nexus FC vs Cyber City"
                  className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-white font-sans"
                />
              </div>

              {/* Split: Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                    Sport Category
                  </label>
                  <select
                    name="category"
                    value={formData.isAddingNewCategory ? "ADD_NEW" : formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3 py-2.5 text-sm text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="ADD_NEW" className="text-neon-cyan font-bold">+ Add New Category...</option>
                  </select>
                </div>

                {formData.isAddingNewCategory && (
                  <div className="col-span-2 space-y-1.5 text-left animate-fade-in">
                    <label className="block font-mono text-[10px] text-neon-cyan uppercase tracking-wider font-bold">
                      New Category Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="newCategoryName"
                        autoFocus
                        value={formData.newCategoryName}
                        onChange={handleInputChange}
                        placeholder="e.g. Tennis"
                        className="flex-1 bg-[#07080B] border border-neon-cyan/50 focus:border-neon-cyan focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, isAddingNewCategory: false, newCategoryName: "" }));
                        }}
                        className="px-3 py-2 bg-gray-800 text-gray-400 text-[10px] rounded-xl hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                    Live Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3 py-2.5 text-sm text-white"
                  >
                    <option value="Live">Live Stream</option>
                    <option value="Upcoming">Upcoming Match</option>
                  </select>
                </div>
              </div>

              {/* Channel / Stream Logo */}
              <div className="space-y-1.5 text-left p-3.5 bg-[#12141C]/40 border border-[#1E2230] rounded-xl">
                <label className="block font-mono text-[10px] text-neon-cyan uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Stream Logo / Channel Icon (Emoji or Image URL)
                </label>
                <input
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="e.g., 📺, ⚽, 🏆, 🏏, or https://example.com/logo.png"
                  className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <p className="font-sans text-[10px] text-gray-500 leading-tight mt-1">
                  Supports any emoji or a direct web link to a PNG/JPG. If empty, a default category logo (⚽, 🏏, 📺, etc.) is auto-assigned.
                </p>
              </div>

              {/* Scheduled Start Time (Visible only for Upcoming Status) */}
              {formData.status === "Upcoming" && (
                <div className="space-y-1.5 text-left animate-fade-in p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <label className="block font-mono text-[10px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Scheduled Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required={formData.status === "Upcoming"}
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full bg-[#07080B] border border-amber-500/20 focus:border-amber-400 focus:outline-none rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <p className="font-mono text-[8px] text-gray-500 leading-tight mt-1">
                    Specify scheduled GMT/local time to start displaying live ticking countdown.
                  </p>
                </div>
              )}

              {/* Toggle: Show in All Sports feed */}
              <div className="space-y-1.5 text-left p-3.5 bg-neon-cyan/5 rounded-xl border border-neon-cyan/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="block font-mono text-[10px] text-neon-cyan uppercase tracking-wider font-bold">
                    All Sports Feed Pin
                  </label>
                  <p className="font-sans text-[10px] text-gray-500 leading-tight">
                    Display this stream under the main "All Sports" feed.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showInAllSports"
                    checked={formData.showInAllSports}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-cyan peer-checked:after:bg-black"></div>
                </label>
              </div>

              {/* If not a TV Channel, show Scoreboard setup */}
              {formData.category !== "TV Channel" && (
                <div className="p-4 rounded-xl bg-[#07080B]/60 border border-[#1E2230] space-y-4 text-left">
                  <p className="font-mono text-[9px] text-neon-cyan uppercase font-bold tracking-widest border-b border-[#1E2230] pb-2">
                    SCOREBOARD CONTROLS
                  </p>

                  {/* Home Team Inputs */}
                  <div className="grid grid-cols-3 gap-2.5 items-end">
                    <div className="col-span-1.5 space-y-1">
                      <label className="font-mono text-[9px] text-gray-500">HOME TEAM</label>
                      <input
                        type="text"
                        name="homeName"
                        value={formData.homeName}
                        onChange={handleInputChange}
                        placeholder="e.g. Neo Tokyo"
                        className="w-full bg-[#12141C] border border-[#1E2230] focus:border-neon-cyan rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="font-mono text-[9px] text-gray-500">LOGO (emoji or URL)</label>
                      <input
                        type="text"
                        name="homeLogo"
                        value={formData.homeLogo}
                        onChange={handleInputChange}
                        placeholder="⚡ or https://..."
                        className="w-full bg-[#12141C] border border-[#1E2230] text-center focus:border-neon-cyan rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="col-span-0.5 space-y-1">
                      <label className="font-mono text-[9px] text-gray-500">SCORE</label>
                      <input
                        type="number"
                        name="homeScore"
                        value={formData.homeScore}
                        onChange={handleInputChange}
                        min={0}
                        className="w-full bg-[#12141C] border border-[#1E2230] text-center focus:border-neon-cyan rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Away Team Inputs */}
                  <div className="grid grid-cols-3 gap-2.5 items-end">
                    <div className="col-span-1.5 space-y-1">
                      <label className="font-mono text-[9px] text-gray-500">AWAY TEAM</label>
                      <input
                        type="text"
                        name="awayName"
                        value={formData.awayName}
                        onChange={handleInputChange}
                        placeholder="e.g. Berlin FC"
                        className="w-full bg-[#12141C] border border-[#1E2230] focus:border-neon-cyan rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="font-mono text-[9px] text-gray-500">LOGO (emoji or URL)</label>
                      <input
                        type="text"
                        name="awayLogo"
                        value={formData.awayLogo}
                        onChange={handleInputChange}
                        placeholder="🪐 or https://..."
                        className="w-full bg-[#12141C] border border-[#1E2230] text-center focus:border-neon-cyan rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="col-span-0.5 space-y-1">
                      <label className="font-mono text-[9px] text-gray-500">SCORE</label>
                      <input
                        type="number"
                        name="awayScore"
                        value={formData.awayScore}
                        onChange={handleInputChange}
                        min={0}
                        className="w-full bg-[#12141C] border border-[#1E2230] text-center focus:border-neon-cyan rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Stream URL */}
              <div className="space-y-1.5 text-left">
                <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                  Video/Stream URL *
                </label>
                <input
                  type="text"
                  name="streamUrl"
                  required
                  value={formData.streamUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. https://domain.com/loop.mp4"
                  className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                />
                <p className="font-mono text-[9px] text-gray-500 leading-tight">
                  Provide an MP4 video clip, standard HLS stream, or direct media link.
                </p>
              </div>

              {/* Split: Viewers count & Graphic Backdrop */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                    Live Viewers Count
                  </label>
                  <input
                    type="number"
                    name="viewers"
                    disabled={formData.status === "Upcoming"}
                    value={formData.status === "Upcoming" ? 0 : formData.viewers}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full bg-[#07080B] border border-[#1E2230] disabled:opacity-50 focus:border-neon-cyan focus:outline-none rounded-xl px-3 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                    Backdrop Preset
                  </label>
                  <select
                    value={bannerPreset}
                    onChange={handlePresetChange}
                    className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3 py-2.5 text-sm text-white"
                  >
                    {Object.keys(bannerPresets).map((preset) => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-left">
                <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                  Description (Promo Text)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Write match summaries or promo details..."
                  className="w-full bg-[#07080B] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-3.5 py-2 text-sm text-white font-sans"
                />
              </div>

              {/* Submit Actions */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-sans font-bold text-sm bg-neon-green hover:bg-neon-green/90 text-black shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] transition-all cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>{isEditing ? "Apply Update" : "Register Stream"}</span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>

            </form>
          </div>

        </div>

        {/* Right Column: Node Registries Table */}
        <div className="lg:col-span-2 bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1E2230] pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">
                📊 CONNECTED STREAM REGISTRIES
              </h3>
              <p className="font-sans text-[11px] text-gray-500 mt-0.5">
                Manage system broadcasts, scores, and active stream nodes.
              </p>
            </div>
            <span className="font-mono text-xs text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 px-2.5 py-1 rounded">
              {streams.length} ACTIVE NODES
            </span>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1E2230]/75 font-mono text-[9px] text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">STREAM_ID / INFO</th>
                  <th className="pb-3">CATEGORY</th>
                  <th className="pb-3">STATUS</th>
                  <th className="pb-3">LIVE SCORE CONTROLS (QUICK-ACTION)</th>
                  <th className="pb-3">VIEWERS</th>
                  <th className="pb-3 text-center">ALL SPORTS</th>
                  <th className="pb-3 text-center">HERO PIN</th>
                  <th className="pb-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2230]/50">
                {streams.map((stream) => (
                  <tr key={stream.id} className="text-xs text-gray-300 hover:bg-[#1E2230]/35 transition-colors">
                    {/* Info */}
                    <td className="py-4 pl-2 pr-4 text-left max-w-[225px]">
                      <div className="flex items-center gap-2.5">
                        {stream.logo && (
                          <div className="w-7 h-7 rounded-lg bg-[#1E2230] border border-[#1E2230] flex items-center justify-center shrink-0 text-base shadow-sm">
                            {stream.logo.startsWith("http") || stream.logo.startsWith("/") ? (
                              <img src={stream.logo} alt="" className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{stream.logo}</span>
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-sans font-bold text-white text-sm truncate" title={stream.title}>
                            {stream.title}
                          </div>
                          <div className="font-mono text-[9px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
                            <span>URL:</span>
                            <span className="text-gray-400 truncate max-w-[140px]">{stream.streamUrl}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 font-sans font-semibold text-gray-300">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(stream.category)}
                        <span>{stream.category}</span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleStatus(stream.id)}
                        className="cursor-pointer focus:outline-none block hover:scale-105 transition-all text-left"
                        title="Click to toggle broadcast status"
                      >
                        {stream.status === "Live" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[8px] font-bold px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]">
                            <span className="h-1 w-1 bg-red-500 rounded-full animate-pulse"></span>
                            LIVE
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 font-mono text-[8px] font-bold px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 w-fit">
                              UPCOMING
                            </span>
                            {stream.startTime && (
                              <span className="font-mono text-[9px] text-gray-500 block truncate max-w-[120px]">
                                📅 {new Date(stream.startTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Live Score Controls (Quick Action) */}
                    <td className="py-4">
                      {stream.category !== "TV Channel" && stream.teams ? (
                        <div className="flex items-center gap-2.5 bg-[#07080B]/50 border border-[#1E2230]/85 rounded-xl p-1.5 w-fit">
                          {/* Home Team controls */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-gray-400 font-extrabold max-w-[65px] truncate flex items-center gap-1" title={stream.teams.home.name}>
                              {stream.teams.home.logo.startsWith("http") || stream.teams.home.logo.startsWith("/") ? (
                                <img src={stream.teams.home.logo} alt="" className="w-3.5 h-3.5 object-contain rounded bg-black/40 p-0.5" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="select-none shrink-0">{stream.teams.home.logo}</span>
                              )}
                              <span className="truncate">{stream.teams.home.name}</span>
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleAdjustScore(stream.id, "home", -1)}
                                className="w-4 h-4 rounded bg-[#1E2230] hover:bg-red-500/35 hover:text-red-400 flex items-center justify-center text-[9px] font-extrabold transition-all cursor-pointer"
                                title="Subtract Score"
                              >
                                -
                              </button>
                              <span className="font-mono font-extrabold text-[11px] text-neon-cyan px-1 min-w-[12px] text-center">
                                {stream.teams.home.score}
                              </span>
                              <button
                                onClick={() => handleAdjustScore(stream.id, "home", 1)}
                                className="w-4 h-4 rounded bg-[#1E2230] hover:bg-neon-green/35 hover:text-neon-green flex items-center justify-center text-[9px] font-extrabold transition-all cursor-pointer"
                                title="Add Score"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <span className="text-gray-700 font-mono text-[10px]">:</span>

                          {/* Away Team controls */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleAdjustScore(stream.id, "away", -1)}
                                className="w-4 h-4 rounded bg-[#1E2230] hover:bg-red-500/35 hover:text-red-400 flex items-center justify-center text-[9px] font-extrabold transition-all cursor-pointer"
                                title="Subtract Score"
                              >
                                -
                              </button>
                              <span className="font-mono font-extrabold text-[11px] text-neon-cyan px-1 min-w-[12px] text-center">
                                {stream.teams.away.score}
                              </span>
                              <button
                                onClick={() => handleAdjustScore(stream.id, "away", 1)}
                                className="w-4 h-4 rounded bg-[#1E2230] hover:bg-neon-green/35 hover:text-neon-green flex items-center justify-center text-[9px] font-extrabold transition-all cursor-pointer"
                                title="Add Score"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-mono text-[10px] text-gray-400 font-extrabold max-w-[65px] truncate flex items-center gap-1" title={stream.teams.away.name}>
                              {stream.teams.away.logo.startsWith("http") || stream.teams.away.logo.startsWith("/") ? (
                                <img src={stream.teams.away.logo} alt="" className="w-3.5 h-3.5 object-contain rounded bg-black/40 p-0.5" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="select-none shrink-0">{stream.teams.away.logo}</span>
                              )}
                              <span className="truncate">{stream.teams.away.name}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-[9px] text-purple-400/80 bg-purple-500/5 px-2 py-1 rounded border border-purple-500/15">
                          📺 24/7 TRANSMITTING
                        </span>
                      )}
                    </td>

                    {/* Viewers */}
                    <td className="py-4 font-mono font-extrabold text-[11.5px] text-gray-200">
                      {stream.status === "Upcoming" ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span className="text-neon-green">{stream.viewers.toLocaleString()}</span>
                      )}
                    </td>

                    {/* All Sports Pin Column */}
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleToggleShowInAllSports(stream.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          stream.showInAllSports === true
                            ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/35 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:scale-105"
                            : "bg-gray-800/40 text-gray-500 border border-transparent hover:text-neon-cyan hover:bg-[#1E2230]"
                        }`}
                        title={stream.showInAllSports === true ? "Visible on All Sports Feed" : "Hidden from All Sports Feed"}
                      >
                        <Activity className={`w-3.5 h-3.5 ${stream.showInAllSports === true ? "animate-pulse text-neon-cyan" : "text-gray-500"}`} />
                      </button>
                    </td>

                    {/* Featured MOTD Pin Column */}
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleToggleMatchOfTheDay(stream.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          stream.isMatchOfTheDay 
                            ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/35 shadow-[0_0_12px_rgba(250,204,21,0.25)] hover:scale-105" 
                            : "bg-gray-800/40 text-gray-500 border border-transparent hover:text-yellow-400 hover:bg-[#1E2230]"
                        }`}
                        title={stream.isMatchOfTheDay ? "Featured Hero Match of the Day" : "Pin to Hero Banner Slot"}
                      >
                        <Star className={`w-3.5 h-3.5 ${stream.isMatchOfTheDay ? "fill-yellow-400" : ""}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditClick(stream)}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-neon-cyan hover:text-black transition-all cursor-pointer text-gray-400"
                          title="Edit Stream Node"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(stream.id)}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer text-gray-400"
                          title="Disconnect Stream"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {streams.length === 0 && (
              <div className="text-center p-8 bg-[#07080B]/40 rounded-xl border border-dashed border-[#1E2230] mt-4">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
                <p className="font-mono text-xs text-gray-400 uppercase">
                  NO CHANNELS REGISTERED IN CONTROLLER GRID
                </p>
                <p className="font-sans text-[11px] text-gray-500 mt-1">
                  Click 'Reset Default Streams' above or use the left panel to populate the grid.
                </p>
              </div>
            )}
          </div>
        </div>

        </div>
      ) : (
        /* CATEGORY MANAGEMENT VIEW */
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
          <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-8 space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.4)]">
            <div className="border-b border-[#1E2230] pb-6 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-xl text-white uppercase flex items-center gap-3">
                  <Settings className="w-6 h-6 text-neon-cyan" />
                  Sports Category Registry
                </h3>
                <p className="font-sans text-sm text-gray-500 mt-1">
                  Manage the dynamic categories displayed in the sidebar and stream filters.
                </p>
              </div>
              <div className="font-mono text-xs text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 px-4 py-1.5 rounded-full">
                {categories.length} ACTIVE CATEGORIES
              </div>
            </div>

            {/* Large Category Add Form */}
            <div className="bg-[#07080B] border border-[#1E2230] rounded-2xl p-6 space-y-4">
              <label className="block font-mono text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                Register New Sports Dimension
              </label>
              <form onSubmit={handleAddCategory} className="flex gap-4">
                <input
                  type="text"
                  placeholder="e.g. Volleyball, Tennis, Formula 1..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-[#12141C] border border-[#1E2230] focus:border-neon-cyan focus:outline-none rounded-xl px-5 py-3.5 text-sm text-white font-sans transition-all"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-black font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.25)] flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Category
                </button>
              </form>
            </div>

            {/* Detailed Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {categories.map((cat, index) => {
                const isEditingThis = editingCatIdx === index;
                const streamCount = streams.filter(s => s.category === cat).length;

                return (
                  <div key={cat} className="bg-[#07080B]/40 border border-[#1E2230] rounded-2xl p-5 hover:border-neon-cyan/30 transition-all group">
                    {isEditingThis ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingCatValue}
                          autoFocus
                          onChange={(e) => setEditingCatValue(e.target.value)}
                          className="w-full bg-[#12141C] border border-neon-cyan focus:outline-none rounded-xl px-4 py-3 text-sm text-white font-sans"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveCategory(index)}
                            className="flex-1 py-2.5 bg-neon-green text-black font-display font-bold text-xs uppercase rounded-xl hover:bg-neon-green/90 transition-all"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingCatIdx(null)}
                            className="px-6 py-2.5 bg-[#1E2230] text-gray-400 font-display font-bold text-xs uppercase rounded-xl hover:bg-gray-800 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#12141C] border border-[#1E2230] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            {getCategoryIcon(cat)}
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-base text-white tracking-tight">{cat}</h4>
                            <p className="font-mono text-[10px] text-gray-500 uppercase flex items-center gap-1.5 mt-0.5">
                              <Activity className="w-3 h-3 text-neon-green" />
                              {streamCount} ACTIVE NODES
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEditCategory(index)}
                            className="p-2.5 rounded-xl bg-[#12141C] hover:bg-neon-cyan hover:text-black text-gray-400 border border-[#1E2230] transition-all cursor-pointer"
                            title="Edit Category Name"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(index)}
                            className="p-2.5 rounded-xl bg-[#12141C] hover:bg-rose-500 hover:text-white text-gray-400 border border-[#1E2230] transition-all cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips / Info Banner */}
          <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl p-6 flex gap-4 items-start">
            <div className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-display font-bold text-sm text-white uppercase tracking-wider">Operational Guidelines</h5>
              <p className="font-sans text-xs text-gray-500 mt-1 leading-relaxed">
                Deleting a category will automatically re-assign all its active stream nodes to the <strong>"Uncategorized"</strong> registry. Renaming a category will update all linked stream nodes in real-time across the platform's telemetry grid.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
