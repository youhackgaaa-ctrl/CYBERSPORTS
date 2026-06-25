/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Layout, 
  X,
  Plus,
  Tv,
  Users
} from "lucide-react";
import Hls from "hls.js";
import * as shaka from "shaka-player";
import { StreamItem } from "../types";

interface PlayerProps {
  stream: StreamItem;
  onRemove: () => void;
  isFocused: boolean;
  onFocus: () => void;
  key?: any;
}

function Player({ stream, onRemove, isFocused, onFocus }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream.streamUrl) return;

    let hls: Hls | null = null;
    let shakaPlayer: any = null;
    const isDashUrl = stream.streamUrl.toLowerCase().includes("mpd");

    if (isDashUrl) {
      try {
        (shaka as any).polyfill.installAll();
        if ((shaka as any).Player.isBrowserSupported()) {
          shakaPlayer = new (shaka as any).Player(video);
          
          shakaPlayer.configure({
            manifest: {
              dash: { ignoreDrmInfo: true, autoCorrectDrift: true }
            },
            streaming: {
              bufferingGoal: 10,
              rebufferingGoal: 5,
              ignoreTextStreamFailures: true
            }
          });

          shakaPlayer.addEventListener('error', (event: any) => {
            const err = event.detail;
            console.error('Shaka Error', err);
            setError(`DASH Error: ${err.code}`);
          });
          shakaPlayer.load(stream.streamUrl).then(() => {
            video.play().catch((e: any) => console.log("Autoplay blocked", e));
          }).catch((e: any) => {
            console.error("Shaka Load Error", e);
            if (e.code === 6001 || e.code === 6007) {
              setError("Protected Stream");
            } else {
              setError("Uplink Failure");
            }
          });
        }
      } catch (e) {
        setError("Init Error");
      }
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(stream.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay blocked", e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError("Stream Connection Failed");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream.streamUrl;
    }

    return () => {
      if (hls) hls.destroy();
      if (shakaPlayer) shakaPlayer.destroy();
    };
  }, [stream.streamUrl]);

  return (
    <div 
      onClick={onFocus}
      className={`relative group bg-black rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isFocused ? "border-neon-cyan shadow-[0_0_15px_rgba(0,212,255,0.2)]" : "border-[#1E2230] hover:border-neon-cyan/30"
      }`}
    >
      {/* Video Content */}
      <div className="aspect-video w-full h-full relative">
        {stream.streamUrl.includes("youtube.com") || stream.streamUrl.includes("youtu.be") ? (
           <iframe
            src={`https://www.youtube.com/embed/${stream.streamUrl.split("v=")[1]?.split("&")[0] || stream.streamUrl.split("/").pop()}?autoplay=1&mute=${isMuted ? 1 : 0}`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : stream.streamUrl.includes("twitch.tv") ? (
          <iframe
            src={`https://player.twitch.tv/?channel=${stream.streamUrl.split("/").pop()}&parent=${window.location.hostname}&autoplay=true&muted=${isMuted}`}
            className="w-full h-full border-0"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted={isMuted}
            autoPlay
          />
        )}

        {/* Overlay Info */}
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
            <span className="text-white font-sans font-bold text-[10px] truncate max-w-[120px]">{stream.title}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controls overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-neon-cyan transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          <div className="flex items-center gap-2 font-mono text-[9px] text-white/70">
            <Users className="w-3 h-3 text-neon-cyan" />
            <span>{stream.viewers}</span>
          </div>
        </div>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
            <p className="text-red-500 font-mono text-[10px] uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MultiWatchPageProps {
  streams: StreamItem[];
  activeIds: string[];
  onBack: () => void;
  onRemoveId: (id: string) => void;
  onAddStream: () => void;
}

export default function MultiWatchPage({
  streams,
  activeIds,
  onBack,
  onRemoveId,
  onAddStream
}: MultiWatchPageProps) {
  const [focusedId, setFocusedId] = useState<string | null>(activeIds[0] || null);
  const activeStreams = streams.filter(s => activeIds.includes(s.id));

  // Auto-focus first stream if focusedId is missing or removed
  useEffect(() => {
    if (!activeIds.includes(focusedId || "")) {
      setFocusedId(activeIds[0] || null);
    }
  }, [activeIds, focusedId]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#07080B]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0D0F17] border-b border-[#1E2230] z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-neon-cyan" />
            BACK_TO_GRID
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
              <Layout className="w-4 h-4 text-neon-cyan" />
              <span className="font-mono text-[10px] font-bold text-neon-cyan uppercase tracking-widest">
                MULTI_VIEW_ACTIVE [{activeIds.length}/4]
              </span>
            </div>
            <div className="hidden md:block w-px h-4 bg-[#1E2230]" />
            <span className="hidden md:block font-mono text-[10px] text-gray-500 uppercase tracking-tighter">
              Sector: Synchronized_Bridges
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {activeIds.length < 4 && (
            <button 
              onClick={onAddStream}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#1E2230] border border-[#1E2230] hover:border-neon-cyan/40 text-gray-400 hover:text-neon-cyan font-mono text-[10px] font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              ADD_NODE
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout Engine */}
      <div className="flex-1 p-6 flex flex-col">
        {activeStreams.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#1E2230] flex items-center justify-center mb-6">
              <Tv className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-tight">Multi-View Empty</h2>
            <p className="text-gray-500 font-mono text-xs max-w-xs mb-8">No active nodes currently assigned to multi-view matrix.</p>
            <button 
              onClick={onAddStream}
              className="px-8 py-3 bg-neon-cyan text-black font-mono text-xs font-black rounded-xl hover:bg-[#00E5FF] transition-all transform hover:scale-105"
            >
              SELECT STREAMS
            </button>
          </div>
        ) : (
          <div className={`flex-1 grid gap-4 ${
            activeStreams.length === 1 ? "grid-cols-1" : 
            activeStreams.length === 2 ? "grid-cols-1 md:grid-cols-2" : 
            "grid-cols-1 md:grid-cols-2"
          }`}>
            {activeStreams.map((stream) => (
              <Player 
                key={stream.id}
                stream={stream}
                isFocused={focusedId === stream.id}
                onFocus={() => setFocusedId(stream.id)}
                onRemove={() => onRemoveId(stream.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Info Bar (Only for focused stream) */}
      {focusedId && activeStreams.find(s => s.id === focusedId) && (
        <div className="px-6 py-4 bg-[#0D0F17] border-t border-[#1E2230] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(() => {
            const focused = activeStreams.find(s => s.id === focusedId)!;
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-xl">
                    {focused.logo || "📡"}
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wide">{focused.title}</h4>
                    <p className="font-mono text-[10px] text-gray-500 uppercase tracking-tighter">
                      Primary Matrix Node Focused • {focused.category}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-gray-500 uppercase tracking-tighter">Global Viewers</p>
                    <p className="font-mono text-xs text-neon-cyan font-bold tracking-widest">{focused.viewers.toLocaleString()}</p>
                  </div>
                  <button className="p-2.5 rounded-xl bg-[#1E2230] text-gray-400 hover:text-white transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
