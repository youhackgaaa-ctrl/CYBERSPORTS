/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamInfo {
  name: string;
  logo: string;
  score: number;
}

export interface StreamItem {
  id: string;
  title: string;
  category: string;
  status: "Live" | "Upcoming";
  startTime?: string; // ISO or YYYY-MM-DDTHH:mm string for upcoming countdown
  logo?: string; // Icon/logo (emoji or image URL) for the stream or channel
  teams?: {
    home: TeamInfo;
    away: TeamInfo;
  };
  streamUrl: string;
  viewers: number;
  isMatchOfTheDay?: boolean;
  bannerUrl?: string;
  description?: string;
  showInAllSports?: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  badge: "VIP" | "MOD" | "FAN" | "ADMIN" | "";
  badgeColor: string;
  message: string;
  timestamp: string;
}
