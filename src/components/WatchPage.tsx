/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import * as shaka from "shaka-player";
import { 
  Heart, 
  Share2, 
  Users, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2, 
  ShieldAlert,
  Sliders,
  Sparkles,
  Zap,
  Clock
} from "lucide-react";
import { StreamItem } from "../types";

// Parse different video stream URLs (YouTube, Twitch, Facebook, direct video, etc.)
function getEmbedInfo(url: string): { type: "youtube" | "twitch" | "facebook" | "iframe" | "video"; url: string } {
  if (!url) return { type: "video", url: "" };

  const trimmed = url.trim();

  // 1. YouTube Checks
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    let videoId = "";
    if (trimmed.includes("youtu.be/")) {
      videoId = trimmed.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
    } else if (trimmed.includes("youtube.com/embed/")) {
      videoId = trimmed.split("youtube.com/embed/")[1]?.split(/[?#]/)[0] || "";
    } else if (trimmed.includes("/live/")) {
      videoId = trimmed.split("/live/")[1]?.split(/[?#]/)[0] || "";
    } else {
      const match = trimmed.match(/[?&]v=([^&#]+)/);
      videoId = match ? match[1] : "";
    }
    
    if (videoId) {
      return {
        type: "youtube",
        url: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
      };
    }
  }

  // 2. Twitch Checks
  if (trimmed.includes("twitch.tv")) {
    let channel = "";
    if (trimmed.includes("channel=")) {
      channel = trimmed.split("channel=")[1]?.split("&")[0] || "";
    } else {
      const parts = trimmed.split("twitch.tv/");
      channel = parts[1]?.split(/[?#]/)[0] || "";
    }
    
    if (channel) {
      const parentHost = window.location.hostname || "localhost";
      return {
        type: "twitch",
        url: `https://player.twitch.tv/?channel=${channel}&parent=${parentHost}&autoplay=true&muted=false`,
      };
    }
  }

  // 3. Facebook Checks
  if (trimmed.includes("facebook.com") && (trimmed.includes("/videos/") || trimmed.includes("/watch/"))) {
    return {
      type: "facebook",
      url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0&autoplay=true`,
    };
  }

  // 4. Check if it is a direct video format
  const lowercase = trimmed.toLowerCase();
  const isDirectVideo = 
    lowercase.endsWith(".mp4") || 
    lowercase.endsWith(".webm") || 
    lowercase.endsWith(".ogg") || 
    lowercase.endsWith(".m3u8") || 
    lowercase.endsWith(".mpd") ||
    lowercase.includes(".mp4?") || 
    lowercase.includes(".webm?") || 
    lowercase.includes(".ogg?") || 
    lowercase.includes(".m3u8?") || 
    lowercase.includes(".mpd?") ||
    lowercase.includes("m3u8") ||
    lowercase.includes("mpd") ||
    lowercase.includes("commondatastorage.googleapis.com") ||
    lowercase.includes("/video-file") ||
    lowercase.includes("stream.mp4");

  if (isDirectVideo) {
    return {
      type: "video",
      url: trimmed,
    };
  }

  // 5. Default any other web URLs to an iframe embed so they render and play directly!
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      type: "iframe",
      url: trimmed,
    };
  }

  // Fallback to video
  return {
    type: "video",
    url: trimmed,
  };
}

interface WatchPageProps {
  streamId: string;
  streams: StreamItem[];
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onBack: () => void;
}

export default function WatchPage({
  streamId: initialStreamId,
  streams,
  favorites,
  onToggleFavorite,
  onBack,
}: WatchPageProps) {
  const [activeId, setActiveId] = useState(initialStreamId);
  const [customUrl, setCustomUrl] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStreamData, setCustomStreamData] = useState<StreamItem | null>(null);

  const stream = isCustomMode && customStreamData 
    ? customStreamData 
    : streams.find((s) => s.id === activeId);

  const handleQuickSwitch = (id: string) => {
    setActiveId(id);
    setIsCustomMode(false);
    setCustomStreamData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    
    const newCustomStream: StreamItem = {
      id: `custom-${Date.now()}`,
      title: "User Custom Uplink",
      streamUrl: customUrl,
      category: "External",
      status: "Live",
      viewers: 1,
      bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400",
      description: "Direct connection to a user-provided stream source."
    };
    
    setCustomStreamData(newCustomStream);
    setIsCustomMode(true);
    setError(null);
  };

  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-cyber-dark text-white font-sans">
        <ShieldAlert className="w-16 h-16 text-neon-green mb-4 animate-bounce" />
        <h3 className="font-display font-bold text-xl mb-2">STREAM_NODE_NOT_FOUND</h3>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          The requested stream packet either expired or was disconnected from the network matrix.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-cyan text-black font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Grid
        </button>
      </div>
    );
  }

  const isFavorited = favorites.includes(stream.id);
  const embedInfo = getEmbedInfo(stream.streamUrl);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [resolution, setResolution] = useState("1080p");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(stream.viewers);
  const [shareCopied, setShareCopied] = useState(false);
  const [isLocalFullscreen, setIsLocalFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState(() => {
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

  useEffect(() => {
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

  // Escape listener to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLocalFullscreen(false);
        const exitFS = document.exitFullscreen ||
                       (document as any).webkitExitFullscreen ||
                       (document as any).mozCancelFullScreen ||
                       (document as any).msExitFullscreen;
        if (exitFS && (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement)) {
          exitFS.call(document).catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to browser-native fullscreen change events to stay synchronized
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsLocalFullscreen(isCurrentlyFullscreen);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Live viewer fluctuating effects
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => {
        const fluctuation = Math.floor(Math.random() * 200) - 95;
        const nextValue = prev + fluctuation;
        return nextValue > 100 ? nextValue : prev;
      });
    }, 4000);
    return () => clearInterval(viewerInterval);
  }, []);

  // HLS.js and Video initialization handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let shakaPlayer: any = null;
    const isHlsUrl = stream.streamUrl.toLowerCase().includes("m3u8");
    const isDashUrl = stream.streamUrl.toLowerCase().includes("mpd");

    if (isDashUrl) {
      setError("DASH Streams (.mpd) are no longer supported. Please use HLS (.m3u8) links.");
      return;
    } else if (isHlsUrl) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
        });
        hls.loadSource(stream.streamUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => {
            console.warn("HLS Autoplay failed:", err);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Fallback for native Safari / iOS
        video.src = stream.streamUrl;
        video.addEventListener("canplay", () => {
          video.play().catch((err) => {
            console.warn("Native HLS autoplay failed:", err);
          });
        });
      }
    } else {
      // Standard video (MP4, webm, etc.)
      video.src = stream.streamUrl;
      video.load();
      video.play().catch((err) => {
        console.warn("Standard video autoplay failed:", err);
      });
    }

    setIsPlaying(true);

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (shakaPlayer) {
        shakaPlayer.destroy();
      }
      // Reset video src when stream changes or component unmounts
      video.removeAttribute("src");
      video.load();
    };
  }, [stream?.streamUrl, activeId]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => {
          console.warn("Playback failed:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuteState = !isMuted;
      setIsMuted(nextMuteState);
      videoRef.current.muted = nextMuteState;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleTimelineSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    const nextState = !isLocalFullscreen;
    setIsLocalFullscreen(nextState);

    if (playerContainerRef.current) {
      if (nextState) {
        const reqFS = playerContainerRef.current.requestFullscreen ||
                      (playerContainerRef.current as any).webkitRequestFullscreen ||
                      (playerContainerRef.current as any).mozRequestFullScreen ||
                      (playerContainerRef.current as any).msRequestFullscreen;
        if (reqFS) {
          reqFS.call(playerContainerRef.current).catch((err: any) => {
            console.warn("Native browser requestFullscreen failed (expected in sandboxed iframe previews):", err);
          });
        }
      } else {
        const exitFS = document.exitFullscreen ||
                       (document as any).webkitExitFullscreen ||
                       (document as any).mozCancelFullScreen ||
                       (document as any).msExitFullscreen;
        const hasFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
        if (exitFS && hasFS) {
          exitFS.call(document).catch(() => {});
        }
      }
    }
  };

  // Copy share stream to clipboard
  const handleShare = () => {
    const shareLink = `${window.location.origin}/watch/${stream.id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    });
  };

  // Formatter for main clock viewer metric
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-cyber-dark text-white font-sans p-4 lg:p-6 space-y-6">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#12141C] border border-[#1E2230] text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all font-sans font-medium text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Arena</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan hover:text-white transition-all font-sans font-medium text-sm cursor-pointer shadow-[0_0_15px_rgba(0,212,255,0.1)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
            title="Toggle Live Stream Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Full Screen</span>
          </button>
        </div>

        {/* Telemetry metadata status row */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-gray-500 uppercase tracking-wider">
          <span className="hidden md:inline">STREAM_ADDR:</span>
          <span className="text-neon-cyan bg-[#12141C] px-2.5 py-1 rounded border border-[#1E2230]">{stream.id}</span>
          <span className="hidden md:inline">CODEC:</span>
          <span className="hidden md:inline text-white">H.264 / AAC</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Video Player Section (Left 3 cols on XL) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Video Player Screen Block */}
          <div 
            ref={playerContainerRef}
            className={`w-full flex flex-col justify-between bg-black transition-all duration-300 ${
              isLocalFullscreen 
                ? "fixed inset-0 z-[9999] h-screen w-screen p-0" 
                : "border border-[#1E2230] rounded-2xl overflow-hidden shadow-2xl bg-[#12141C]"
            }`}
          >
            
            {/* Video Player Display */}
            <div 
              className={`relative bg-black flex items-center justify-center group/video overflow-hidden ${
                isLocalFullscreen ? "w-full h-full flex-1" : "aspect-video w-full"
              }`}
              onClick={handlePlayPause}
            >
              {stream.status !== "Live" && !timeLeft.isOver ? (
              <div className="absolute inset-0 z-30 bg-[#07080B] flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
                <div className="relative z-10 space-y-6 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-mono text-[10px] uppercase tracking-wider rounded-full animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Countdown Scheduled Transmission</span>
                  </div>
                  
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
                    {stream.title}
                  </h2>
                  <p className="text-gray-400 text-xs font-sans max-w-md mx-auto">
                    This match stream has not started yet. The system node will automatically unlock the active broadcast feed as soon as the countdown hits zero.
                  </p>

                  {/* Grid Countdown Clock */}
                  <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto pt-2">
                    {[
                      { label: "DAYS", value: timeLeft.days, color: "text-amber-400" },
                      { label: "HOURS", value: timeLeft.hours, color: "text-neon-cyan" },
                      { label: "MINS", value: timeLeft.minutes, color: "text-neon-green" },
                      { label: "SECS", value: timeLeft.seconds, color: "text-rose-500" },
                    ].map((unit) => (
                      <div key={unit.label} className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-3 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.6)]">
                        <span className={`font-mono font-extrabold text-2xl sm:text-3xl ${unit.color}`}>
                          {unit.value.toString().padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[8px] text-gray-500 font-bold tracking-widest mt-1">
                          {unit.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Time info and date */}
                  <div className="font-mono text-[11px] text-gray-500 uppercase pt-2 flex flex-col gap-1 items-center">
                    <div>Transmission Node: <span className="text-white font-semibold">{stream.category} Arena</span></div>
                    <div>Launch Time: <span className="text-neon-cyan font-semibold">{new Date(stream.startTime!).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            ) : embedInfo.type !== "video" ? (
              <iframe
                src={embedInfo.url}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                className="w-full h-full border-0 absolute inset-0 z-10 bg-black"
                title={stream.title}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay={true}
                controls={true}
                playsInline={true}
                onPlay={handlePlay}
                onPause={handlePause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
              />
            )}

            {/* Custom interactive overlays */}
            {error && (
              <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-6 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
                <p className="text-gray-400 text-xs font-mono max-w-sm mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-rose-500 text-white font-mono text-[10px] rounded-lg hover:bg-rose-600 transition-all uppercase tracking-widest"
                >
                  Reconnect Uplink
                </button>
              </div>
            )}
            {/* Live telemetry stamp - shown on top of standard video and iframe if hover/visible */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1E2230] pointer-events-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-mono text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                LIVE ({embedInfo.type.toUpperCase()})
              </span>
            </div>

            {/* Play/Pause Overlay - Visible on Hover or when paused */}
            <div className={`absolute inset-0 z-30 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${!isPlaying ? "opacity-100" : "opacity-0 group-hover/video:opacity-100"}`}>
              <div className="w-16 h-16 rounded-full bg-neon-cyan/80 text-black flex items-center justify-center shadow-[0_0_30px_#00D4FF] transform transition-transform group-hover/video:scale-110 active:scale-95">
                {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
              </div>
            </div>

            {/* Exit Full Screen Button - Floating and visible in local fullscreen */}
            {isLocalFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-500/90 text-white font-mono text-[10px] font-bold uppercase hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all cursor-pointer"
                title="Exit Full Screen Mode"
              >
                <Maximize2 className="w-3.5 h-3.5 rotate-180" />
                <span>Exit Full Screen</span>
              </button>
            )}
          </div>

          {/* Under-Player Controls / Info Bar */}
          {!isLocalFullscreen && (
            <div className="p-6 space-y-4">
              {/* Match "VS" Display Banner - Visual representation for Football/Matches */}
              {stream.teams && (
                <div className="flex items-center justify-center gap-4 md:gap-10 py-5 px-6 bg-[#07080B]/60 backdrop-blur-xl border border-[#1E2230] rounded-2xl mb-8 shadow-[0_0_40px_rgba(0,0,0,0.4)] relative overflow-hidden group/vs">
                  {/* Background grid accent */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                  
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2 group/team cursor-default z-10 flex-1">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-[#12141C] border-2 border-neon-cyan/30 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,212,255,0.1)] group-hover/team:border-neon-cyan/60 transition-all duration-300 transform group-hover/team:scale-105">
                      {stream.teams.home.logo.startsWith("http") ? (
                        <img src={stream.teams.home.logo} alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl md:text-4xl">{stream.teams.home.logo}</span>
                      )}
                    </div>
                    <span className="font-display font-bold text-[10px] md:text-sm text-white uppercase tracking-wider group-hover/team:text-neon-cyan transition-colors text-center truncate w-full">
                      {stream.teams.home.name}
                    </span>
                  </div>
                  
                  {/* Score / VS Center */}
                  <div className="flex flex-col items-center gap-1 z-10 shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="font-mono text-3xl md:text-5xl font-black text-neon-cyan tracking-tighter italic drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
                        {stream.teams.home.score}
                      </div>
                      <div className="font-display font-black text-lg md:text-2xl text-gray-700 italic px-1">VS</div>
                      <div className="font-mono text-3xl md:text-5xl font-black text-purple-400 tracking-tighter italic drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                        {stream.teams.away.score}
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-mono text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">
                      Live Feed
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2 group/team cursor-default z-10 flex-1">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-[#12141C] border-2 border-purple-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.1)] group-hover/team:border-purple-500/60 transition-all duration-300 transform group-hover/team:scale-105">
                      {stream.teams.away.logo.startsWith("http") ? (
                        <img src={stream.teams.away.logo} alt="" className="w-10 h-10 md:w-12 md:h-12 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl md:text-4xl">{stream.teams.away.logo}</span>
                      )}
                    </div>
                    <span className="font-display font-bold text-[10px] md:text-sm text-white uppercase tracking-wider group-hover/team:text-purple-400 transition-colors text-center truncate w-full">
                      {stream.teams.away.name}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="font-display font-extrabold text-xl lg:text-2xl text-white">
                      {stream.title}
                    </h1>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                      {stream.category}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
                    {stream.description || "Live high definition cybercast stream broadcasted straight from the cyberarena. Telemetry and live scoreboard updated continuously."}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => onToggleFavorite(stream.id, e)}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl border font-sans font-semibold text-sm transition-all cursor-pointer ${
                      isFavorited
                        ? "bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                        : "bg-[#1E2230]/40 border-[#1E2230] text-gray-300 hover:text-white hover:bg-[#1E2230]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500" : ""}`} />
                    <span>{isFavorited ? "Saved in Grid" : "Add to Favorites"}</span>
                  </button>

                  {/* Share Button */}
                  <div className="relative">
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#1E2230]/40 border border-[#1E2230] text-gray-300 hover:text-white hover:bg-[#1E2230] transition-all font-sans font-semibold text-sm cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    
                    {/* Copy Banner */}
                    {shareCopied && (
                      <div className="absolute bottom-12 right-0 bg-neon-cyan text-black font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-md shadow-[0_0_15px_#00D4FF] whitespace-nowrap animate-bounce">
                        LINK COPIED TO GRID!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Metrics Telemetry Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#1E2230]">
                <div className="bg-[#07080B]/50 p-3 rounded-xl border border-[#1E2230]">
                  <p className="font-mono text-[10px] text-gray-500">CURRENT_VIEWERS</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users className="w-4 h-4 text-neon-cyan" />
                    <p className="font-mono text-sm font-bold text-white">
                      {viewerCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-[#07080B]/50 p-3 rounded-xl border border-[#1E2230]">
                  <p className="font-mono text-[10px] text-gray-500">SYS_BITRATE</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Zap className="w-4 h-4 text-neon-green" />
                    <p className="font-mono text-sm font-bold text-white">
                      8,420 Kbps
                    </p>
                  </div>
                </div>

                <div className="bg-[#07080B]/50 p-3 rounded-xl border border-[#1E2230]">
                  <p className="font-mono text-[10px] text-gray-500">STREAM_STABILITY</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <p className="font-mono text-sm font-bold text-neon-green">
                      99.98%
                    </p>
                  </div>
                </div>

                <div className="bg-[#07080B]/50 p-3 rounded-xl border border-[#1E2230]">
                  <p className="font-mono text-[10px] text-gray-500">MATCH_SCORE</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <p className="font-mono text-xs font-bold text-white">
                      {stream.teams 
                        ? `${stream.teams.home.name} (${stream.teams.home.score}) : ${stream.teams.away.name} (${stream.teams.away.score})`
                        : "STATION_24/7_UP"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sidebar Switcher (Right Column on XL) */}
        {!isLocalFullscreen && (
          <div className="xl:col-span-1 space-y-6">
            {/* Play Custom URL Panel */}
            <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-neon-green" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-tight">Direct Link Uplink</h3>
              </div>
              <form onSubmit={handlePlayCustomUrl} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="Paste .m3u8 or video link..."
                    className="w-full bg-[#07080B] border border-[#1E2230] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neon-cyan/50 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-neon-cyan text-black font-mono text-[10px] font-bold rounded-xl hover:bg-white transition-all uppercase tracking-widest"
                >
                  Switch to Custom
                </button>
              </form>
              <p className="mt-3 text-[9px] text-gray-500 font-mono uppercase tracking-tighter leading-relaxed">
                Enter any valid HLS stream link or direct video URL to override the current frequency.
              </p>
            </div>

            {/* Quick Switch Arena Grid */}
            <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-5 shadow-xl flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-tight">Arena Switcher</h3>
                </div>
                <span className="font-mono text-[9px] text-neon-cyan">{streams.length} NODES</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {streams.filter(s => s.id !== activeId).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleQuickSwitch(s.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#07080B]/50 border border-[#1E2230] hover:border-neon-cyan/30 hover:bg-[#1E2230]/40 transition-all text-left group"
                  >
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-[#1E2230]">
                      <img src={s.bannerUrl || s.logo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      {s.status === "Live" && (
                        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-bold text-[11px] text-gray-200 truncate group-hover:text-neon-cyan transition-colors">
                        {s.title}
                      </p>
                      <p className="font-mono text-[9px] text-gray-500 uppercase truncate">
                        {s.category} • {s.viewers.toLocaleString()} VIEWS
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
