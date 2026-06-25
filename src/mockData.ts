/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamItem, ChatMessage } from "./types";

export const INITIAL_STREAMS: StreamItem[] = [
  {
    id: "match-of-the-day-football",
    title: "Cyber Cup Grand Finale: Neo Tokyo FC vs Berlin Nexus",
    category: "Football",
    status: "Live",
    logo: "⚽",
    teams: {
      home: {
        name: "Neo Tokyo FC",
        logo: "⚡",
        score: 2,
      },
      away: {
        name: "Berlin Nexus",
        logo: "🪐",
        score: 1,
      },
    },
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    viewers: 142500,
    isMatchOfTheDay: true,
    showInAllSports: true,
    bannerUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
    description: "The clash of the cybergiants! Neo Tokyo FC's precision mechanics take on Berlin Nexus's aggressive overdrive tactics. Absolute madness in the grid!"
  },
  {
    id: "cricket-live-1",
    title: "Cyber Cricket Premiere: Mumbai Matrix vs London Lasers",
    category: "Cricket",
    status: "Live",
    logo: "🏏",
    teams: {
      home: {
        name: "Mumbai Matrix",
        logo: "🔷",
        score: 168,
      },
      away: {
        name: "London Lasers",
        logo: "✴️",
        score: 142,
      },
    },
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    viewers: 98200,
    showInAllSports: false,
    bannerUrl: "https://images.unsplash.com/photo-1531415080290-bc98545ab2ef?auto=format&fit=crop&q=80&w=1200",
    description: "Over 20.4, Mumbai Matrix needs only 12 runs off 6 balls to break the league record. London Lasers bringing their top laser bowlers to defend!"
  },
  {
    id: "basketball-live-1",
    title: "Gravity Slam 2026: LA Cyberpunks vs Chicago Sparks",
    category: "Basketball",
    status: "Live",
    logo: "🏀",
    teams: {
      home: {
        name: "LA Cyberpunks",
        logo: "🦁",
        score: 104,
      },
      away: {
        name: "Chicago Sparks",
        logo: "🔥",
        score: 102,
      },
    },
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    viewers: 72100,
    showInAllSports: true,
    bannerUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200",
    description: "4th Quarter, remaining 12.4s. The neon hoops are blazing as the LA Cyberpunks trail by 2, setting up for a spectacular 3-pointer."
  },
  {
    id: "football-upcoming-1",
    title: "Euro Synth Clash: Paris Pixels vs Madrid Monarchs",
    category: "Football",
    status: "Upcoming",
    logo: "⚽",
    teams: {
      home: {
        name: "Paris Pixels",
        logo: "💠",
        score: 0,
      },
      away: {
        name: "Madrid Monarchs",
        logo: "👑",
        score: 0,
      },
    },
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    viewers: 0,
    showInAllSports: false,
    bannerUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200",
    description: "Upcoming battle of the European titans. Streams will ignite live at 21:00 UTC."
  },
  {
    id: "tv-sports-1",
    title: "Cyber Sports HD 1 (24/7)",
    category: "TV Channel",
    status: "Live",
    logo: "📺",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    viewers: 34000,
    showInAllSports: false,
    bannerUrl: "https://images.unsplash.com/photo-1540747737956-378724044453?auto=format&fit=crop&q=80&w=1200",
    description: "Your nonstop feed for all things extreme sports, cyber racing, and neon athletics around the globe."
  },
  {
    id: "tv-sports-2",
    title: "Neon Racing Network",
    category: "TV Channel",
    status: "Live",
    logo: "🏎️",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    viewers: 28900,
    showInAllSports: false,
    bannerUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1200",
    description: "Adrenaline, hyper-engines, and supersonic neon lights. Live telemetry and drift-cam feeds."
  },
  {
    id: "tv-sports-3",
    title: "MMA Apex Grind TV",
    category: "TV Channel",
    status: "Live",
    logo: "🥊",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4",
    viewers: 41200,
    showInAllSports: false,
    bannerUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200",
    description: "Full contact cage matches under high-voltage laser arrays. Pure force, cybernetics permitted."
  }
];

export const MOCK_USERNAMES = [
  "Apex_Rider", "CyberNet_88", "HyperDrive", "NeonPuma", "PixelLord", 
  "RetroFuturism", "LaserCatcher", "GlitchWizard", "SynthStar", "ChronoViper", 
  "ZeroCool", "AlphaPrime", "MatrixMage", "QuantumStriker", "VelocityX"
];

export const MOCK_CHAT_BADGES: Array<"VIP" | "MOD" | "FAN" | "ADMIN" | ""> = [
  "VIP", "MOD", "FAN", "ADMIN", ""
];

export const MOCK_PRESET_MESSAGES = [
  "GOOOAAALLLL! WHAT A MONSTER STRIKE!! ⚡⚡⚡",
  "This match is absolutely insane!",
  " মুম্বাই ম্যাট্রিক্স FTW! Outstanding team play 🔷",
  "Berlin defense is lagging hard, fix the firewalls!",
  "Unbelievable laser accuracy on that bowl!! ✴️",
  "LA Cyberpunks are on absolute fire right now! 🔥",
  "Is that a glitch or did he really slam from the free-throw line?",
  "Cyber Sports HD 1 is streaming in crisp ultra-high-rate. Unreal quality!",
  "Who else is watching this with neon glasses? 😎",
  "Mods, pin the scores please!",
  "What a clean pass! Pure clockwork perfection.",
  "Berlin Nexus are charging up. Comeback incoming!",
  "Can London defend this last ball? Climax is real!!",
  "Cyberpunk aesthetics are top-notch in this stadium."
];
