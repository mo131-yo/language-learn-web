"use client";

import {
  FormEvent,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import type {
  Category,
  Challenge,
  LeaderboardUser,
  Word,
} from "@/lib/types";
import { urlBase64ToUint8Array } from "@/lib/client-push";
import { themes, getCSSVariables, type ThemeMode } from "@/lib/themes";
import { AuthModal } from "./AuthModal";
import { StreakRankPetCard } from "./StreakRankPet";
import { RANK_PETS } from "./StreakRankPet";

type HomeData = {
  categories: Category[];
  words: Word[];
  challenges: Challenge[];
  leaderboard: LeaderboardUser[];
};

type AuthUser = {
  id: string;
  name: string;
  email?: string;
  avatar: string | null;
  bio: string;
};

type Mode = "flashcard" | "quiz" | "check";

type View =
  | "home"
  | "learn"
  | "add-word"
  | "categories"
  | "challenges"
  | "shop"
  | "leaderboard"
  | "profile";

type FriendRequest = {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string | null;
  toId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: number;
};

type HeartReaction = {
  fromId: string;
  fromName: string;
  toId: string;
  timestamp: number;
};

// NEW: Chat message type
type ChatMessage = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: number;
};

// NEW: XP event for toast notifications
type XpEvent = {
  id: string;
  type: "gain" | "loss";
  amount: number;
  reason: string;
};

const PALETTE = [
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const THEME_PRICES: Record<ThemeMode, number> = {
  light: 0,
  dark: 1200,
  ocean: 1800,
  violet: 2400,
  sunset: 3200,
  spring: 4100,
  summer: 4600,
  autumn: 5200,
  winter: 5800,
  aurora: 7600,
};

const TITLE_LEVELS = [
  { title: "Анхан сурагч", xp: 0 },
  { title: "Шинэ сурагч", xp: 100 },
  { title: "Идэвхтэй сурагч", xp: 250 },
  { title: "Хичээнгүй сурагч", xp: 500 },
  { title: "Сайн сурагч", xp: 900 },
  { title: "Тууштай сурагч", xp: 1500 },
  { title: "Үг цээжлэгч", xp: 2400 },
  { title: "Үгийн мэдлэгтэн", xp: 3600 },
  { title: "Сайн цээжлэгч", xp: 5200 },
  { title: "Чадварлаг сурагч", xp: 7500 },
  { title: "Туршлагатай сурагч", xp: 10500 },
  { title: "Англи хэл сонирхогч", xp: 14500 },
  { title: "Англи хэлний дадлагажигч", xp: 20000 },
  { title: "Үгийн сан сайтай", xp: 28000 },
  { title: "Шалгалтад бэлтгэгч", xp: 38000 },
  { title: "Англи хэлний туслагч", xp: 50000 },
  { title: "Англи хэлний чадвартан", xp: 65000 },
  { title: "Үгийн сангийн мастер", xp: 85000 },
  { title: "Англи хэлний мастер", xp: 110000 },
  { title: "Мэргэн суралцагч", xp: 150000 },
  { title: "Ахисан түвшний сурагч", xp: 200000 },
  { title: "Англи хэлний мэргэжилтэн", xp: 275000 },
  { title: "Үгийн сангийн мэргэжилтэн", xp: 375000 },
  { title: "Шилдэг суралцагч", xp: 500000 },
  { title: "Онцгой суралцагч", xp: 700000 },
  { title: "Англи хэлний аварга", xp: 950000 },
  { title: "Үгийн сангийн аварга", xp: 1250000 },
  { title: "Хэлний их мастер", xp: 1600000 },
  { title: "Эрдэмтэй суралцагч", xp: 2000000 },
  { title: "Домогт суралцагч", xp: 3000000 },
] as const;

const THEME_PREVIEWS: Partial<
  Record<
    ThemeMode,
    {
      bg: string;
      card: string;
      primary: string;
      text: string;
      accent: string;
    }
  >
> = {
  light: { bg: "#f5f5f0", card: "#ffffff", primary: "#16a34a", text: "#1a1a1a", accent: "#f59e0b" },
  dark: { bg: "#0f172a", card: "#1e293b", primary: "#22c55e", text: "#f1f5f9", accent: "#fbbf24" },
  ocean: { bg: "#f3f8ff", card: "#ffffff", primary: "#2563eb", text: "#0f172a", accent: "#06b6d4" },
  violet: { bg: "#faf7ff", card: "#ffffff", primary: "#7c3aed", text: "#1f1630", accent: "#ec4899" },
  sunset: { bg: "#fff7ed", card: "#ffffff", primary: "#f97316", text: "#2b1b12", accent: "#ef4444" },
  spring: { bg: "#f7fee7", card: "#ffffff", primary: "#65a30d", text: "#18320b", accent: "#f472b6" },
  summer: { bg: "#fffbeb", card: "#fff7cc", primary: "#eab308", text: "#33240a", accent: "#14b8a6" },
  autumn: { bg: "#fff7ed", card: "#ffedd5", primary: "#ea580c", text: "#2f1b0c", accent: "#b45309" },
  winter: { bg: "#eef7ff", card: "#ffffff", primary: "#0ea5e9", text: "#0f2638", accent: "#38bdf8" },
  aurora: { bg: "#f5fffd", card: "#ffffff", primary: "#14b8a6", text: "#112b2b", accent: "#8b5cf6" },
};

// ─── Avatar color helper ───────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#e0f2fe", "#0284c7"],
  ["#dcfce7", "#16a34a"],
  ["#fef3c7", "#d97706"],
  ["#fce7f3", "#db2777"],
  ["#ede9fe", "#7c3aed"],
  ["#fee2e2", "#dc2626"],
  ["#f0fdf4", "#15803d"],
  ["#fff7ed", "#c2410c"],
];

function getAvatarColors(id: string): [string, string] {
  const idx = Math.abs(
    id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  ) % AVATAR_COLORS.length;
  return (AVATAR_COLORS[idx] ?? AVATAR_COLORS[0]) as [string, string];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isUserActiveNow(lastActiveAt?: number | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - lastActiveAt < 2 * 60 * 1000;
}

function formatLastActive(lastActiveAt?: number | null): string {
  if (!lastActiveAt) return "Идэвх нь хараахан бүртгэгдээгүй";
  if (isUserActiveNow(lastActiveAt)) return "Одоо active";

  const diffMs = Date.now() - lastActiveAt;
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMin < 60) return `${diffMin} минутын өмнө active`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} цагийн өмнө active`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} хоногийн өмнө active`;

  return new Date(lastActiveAt).toLocaleString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Theme preview card ────────────────────────────────────────────────────────
function ThemePreviewCard({
  themeKey,
  isActive,
  isOwned,
  price,
  onClick,
}: {
  themeKey: ThemeMode;
  isActive: boolean;
  isOwned: boolean;
  price: number;
  onClick: () => void;
}) {
  const p =
    THEME_PREVIEWS[themeKey] ??
    THEME_PREVIEWS.light ?? {
      bg: "#f5f5f0",
      card: "#ffffff",
      primary: "#16a34a",
      text: "#1a1a1a",
      accent: "#f59e0b",
    };

  const themeName = themes[themeKey]?.name ?? themeKey;

  return (
    <button
      type="button"
      onClick={onClick}
      className="theme-preview-btn"
      aria-label={`${themeName} theme сонгох`}
    >
      <div
        className="theme-preview-card"
        style={{
          borderColor: isActive ? p.primary : "transparent",
          boxShadow: isActive
            ? `0 0 0 3px ${p.primary}33`
            : "0 2px 8px rgba(0,0,0,0.12)",
          opacity: isOwned ? 1 : 0.72,
        }}
      >
        <svg
          viewBox="0 0 120 80"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          style={{ display: "block" }}
        >
          <rect width="120" height="80" fill={p.bg} />
          <rect width="120" height="14" fill={p.card} />
          <rect x="6" y="4" width="28" height="6" rx="2" fill={p.primary} />
          <rect x="92" y="4" width="22" height="6" rx="3" fill={p.accent} />
          <rect x="6" y="18" width="108" height="22" rx="5" fill={p.primary} />
          <rect x="12" y="22" width="40" height="3" rx="1" fill="white" />
          <rect x="12" y="28" width="55" height="5" rx="1" fill="white" opacity="0.7" />
          <rect x="6" y="44" width="50" height="14" rx="4" fill={p.card} />
          <rect x="10" y="47" width="20" height="2" rx="1" fill={p.text} opacity="0.3" />
          <rect x="10" y="51" width="30" height="4" rx="1" fill={p.accent} />
          <rect x="62" y="44" width="52" height="14" rx="4" fill={p.card} />
          <rect x="66" y="47" width="20" height="2" rx="1" fill={p.text} opacity="0.3" />
          <rect x="66" y="51" width="30" height="4" rx="1" fill={p.primary} />
          <rect y="66" width="120" height="14" fill={p.card} />
          <rect x="12" y="69" width="8" height="8" rx="1" fill={p.primary} />
          <rect x="38" y="69" width="8" height="8" rx="1" fill={p.text} opacity="0.2" />
          <rect x="64" y="69" width="8" height="8" rx="1" fill={p.text} opacity="0.2" />
          <rect x="90" y="69" width="8" height="8" rx="1" fill={p.text} opacity="0.2" />
        </svg>
      </div>
      <div
        className="theme-preview-name"
        style={{ color: isActive ? p.primary : "var(--text-secondary, #6b7280)" }}
      >
        {themeName}
        {!isOwned ? ` 🔒 ${price} XP` : ""}
        {isActive ? " ✓" : ""}
      </div>
    </button>
  );
}

function getTitleLevel(xp: number) {
  return (
    [...TITLE_LEVELS].reverse().find((level) => xp >= level.xp) ?? TITLE_LEVELS[0]
  );
}

function getNextTitleLevel(xp: number) {
  return TITLE_LEVELS.find((level) => level.xp > xp) ?? null;
}

// ─── XP Toast Notifications ───────────────────────────────────────────────────
function XpToastContainer({
  events,
  onDismiss,
}: {
  events: XpEvent[];
  onDismiss: (id: string) => void;
}) {
  if (events.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            background: ev.type === "gain" ? "#f0fdf4" : "#fef2f2",
            border: `2px solid ${ev.type === "gain" ? "#86efac" : "#fca5a5"}`,
            borderRadius: 16,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 800,
            color: ev.type === "gain" ? "#15803d" : "#dc2626",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            animation: "slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both",
            pointerEvents: "auto",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          <span style={{ fontSize: 18 }}>{ev.type === "gain" ? "⭐" : "💔"}</span>
          <span>
            {ev.type === "gain" ? "+" : "-"}
            {ev.amount} XP
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginLeft: 4,
              opacity: 0.8,
            }}
          >
            {ev.reason}
          </span>
          <button
            onClick={() => onDismiss(ev.id)}
            style={{
              marginLeft: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "inherit",
              opacity: 0.6,
              pointerEvents: "auto",
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Modal ─────────────────────────────────────────────────────────────
function UserProfileModal({
  user,
  myId,
  likes,
  friends,
  pendingTo,
  chatMessages,
  chatInputValue,
  onClose,
  onLike,
  onFriendReq,
  onSendChat,
  onChatInputChange,
  onStartChat,
  lastActiveAt,
}: {
  user: LeaderboardUser;
  myId: string;
  likes: Record<string, boolean>;
  friends: string[];
  pendingTo: string[];
  chatMessages: Record<string, ChatMessage[]>;
  chatInputValue: string;
  onClose: () => void;
  onLike: (userId: string) => void;
  onFriendReq: (user: LeaderboardUser) => void;
  onSendChat: (toId: string) => void;
  onChatInputChange: (val: string) => void;
  onStartChat: (user: LeaderboardUser) => void;
  lastActiveAt?: number | null;
}) {
  const isMe = user.id === myId;
  const liked = likes[user.id] ?? false;
  const isFriend = friends.includes(user.id);
  const isPending = pendingTo.includes(user.id);
  const activeNow = isUserActiveNow(lastActiveAt);
  const activeLabel = formatLastActive(lastActiveAt);
  const title = getTitleLevel(user.xp);
  const next = getNextTitleLevel(user.xp);
  const pct = next
    ? Math.min(
        100,
        Math.round(
          ((user.xp - title.xp) / Math.max(next.xp - title.xp, 1)) * 100
        )
      )
    : 100;
  const msgs = chatMessages[user.id] ?? [];
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    chatInputRef.current?.focus();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card, #fff)",
          borderRadius: 28,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
          animation: "modalIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div
          style={{
            background:
              "linear-gradient(135deg,var(--primary,#16a34a) 0%,#22c55e 60%,#4ade80 100%)",
            padding: "28px 24px 20px",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            <div style={{ position: "relative" }}>
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={72}
                  height={72}
                  unoptimized
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid rgba(255,255,255,0.5)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#fff",
                    border: "3px solid rgba(255,255,255,0.5)",
                  }}
                >
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 2,
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                🏅 {title.title}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 99,
                  padding: "4px 10px",
                  marginBottom: 8,
                  background: activeNow
                    ? "rgba(34,197,94,0.22)"
                    : "rgba(255,255,255,0.16)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: activeNow ? "#86efac" : "rgba(255,255,255,0.7)",
                    boxShadow: activeNow ? "0 0 0 4px rgba(134,239,172,0.16)" : "none",
                  }}
                />
                {activeLabel}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 99,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  ⭐ {user.xp.toLocaleString()} XP
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 99,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  📚 {user.mastered_words} цээжилсэн
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          {/* XP Progress */}
          <div
            style={{
              marginBottom: 14,
              padding: "14px 16px",
              background: "var(--bg, #f9fafb)",
              borderRadius: 16,
              border: "1.5px solid var(--border, #e5e7eb)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary, #16a34a)",
                }}
              >
                {title.title}
              </span>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                {pct}%
              </span>
            </div>
            <div
              style={{
                height: 7,
                background: "var(--border, #e5e7eb)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg,var(--primary,#16a34a),#22c55e)",
                  borderRadius: 99,
                  transition: "width 0.5s",
                }}
              />
            </div>
            {next && (
              <div
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  marginTop: 3,
                  fontWeight: 600,
                }}
              >
                {(next.xp - user.xp).toLocaleString()} XP → {next.title}
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <div
              style={{
                marginBottom: 14,
                fontSize: 14,
                color: "var(--text, #374151)",
                fontWeight: 600,
                lineHeight: 1.6,
                padding: "12px 14px",
                background: "var(--primary-soft, #f0fdf4)",
                borderRadius: 14,
                border: "1.5px solid var(--primary-soft-border, #bbf7d0)",
              }}
            >
              &quot;{user.bio}&quot;
            </div>
          )}

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {[
              {
                label: "Нийт XP",
                val: user.xp.toLocaleString(),
                color: "#f59e0b",
              },
              {
                label: "Цээжилсэн",
                val: user.mastered_words,
                color: "var(--primary,#16a34a)",
              },
              {
                label: "Үгийн сан",
                val: user.words_count,
                color: "#3b82f6",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--card,#fff)",
                  border: "1.5px solid var(--border,#e5e7eb)",
                  borderRadius: 14,
                  padding: "12px 8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: s.color,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!isMe && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => onLike(user.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "2px solid",
                  borderColor: liked ? "#fca5a5" : "var(--border,#e5e7eb)",
                  background: liked ? "#fef2f2" : "var(--card,#fff)",
                  color: liked ? "#dc2626" : "var(--text,#374151)",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {liked ? "❤️ Лайктай" : "🤍 Лайк"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isFriend && !isPending) onFriendReq(user);
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "2px solid",
                  borderColor: isFriend
                    ? "#86efac"
                    : isPending
                      ? "#fde68a"
                      : "var(--border,#e5e7eb)",
                  background: isFriend
                    ? "#f0fdf4"
                    : isPending
                      ? "#fefce8"
                      : "var(--card,#fff)",
                  color: isFriend
                    ? "#15803d"
                    : isPending
                      ? "#d97706"
                      : "var(--text,#374151)",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: isFriend || isPending ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "inherit",
                }}
              >
                {isFriend ? "✓ Найзууд" : isPending ? "⏳ Хүсэлт" : "+ Найз"}
              </button>
            </div>
          )}

          {!isMe && isFriend && (
            <button
              type="button"
              onClick={() => onStartChat(user)}
              style={{
                width: "100%",
                marginBottom: 16,
                padding: "12px 16px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 14px 28px rgba(37,99,235,0.22)",
              }}
            >
                  💬 Мессеж бичих
            </button>
          )}

          {/* Chat section */}
          {!isMe && isFriend && (
            <div
              style={{
                border: "1.5px solid var(--border,#e5e7eb)",
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--bg,#f9fafb)",
                  borderBottom: "1.5px solid var(--border,#e5e7eb)",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "var(--text,#374151)",
                }}
              >
                  💬 {user.name}-тай шууд чат
              </div>
              <div
                style={{
                  height: 200,
                  overflowY: "auto",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "var(--card,#fff)",
                }}
              >
                {msgs.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: 13,
                      fontWeight: 600,
                      marginTop: 60,
                    }}
                  >
                    Хамгийн эхний мессеж илгээгээрэй!
                  </div>
                ) : (
                  msgs.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          msg.fromId === myId ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          padding: "8px 12px",
                          borderRadius:
                            msg.fromId === myId
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                          background:
                            msg.fromId === myId
                              ? "var(--primary,#16a34a)"
                              : "var(--bg,#f3f4f6)",
                          color:
                            msg.fromId === myId
                              ? "#fff"
                              : "var(--text,#111827)",
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.text}
                        <div
                          style={{
                            fontSize: 10,
                            opacity: 0.65,
                            marginTop: 2,
                            textAlign: "right",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString("mn-MN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div
                style={{
                  padding: "10px 12px",
                  borderTop: "1.5px solid var(--border,#e5e7eb)",
                  display: "flex",
                  gap: 8,
                  background: "var(--card,#fff)",
                }}
              >
                <input
                  ref={chatInputRef}
                  value={chatInputValue}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInputValue.trim()) {
                      onSendChat(user.id);
                    }
                  }}
                  placeholder="Мессеж бичих..."
                  style={{
                    flex: 1,
                    padding: "9px 14px",
                    borderRadius: 12,
                    border: "1.5px solid var(--border,#e5e7eb)",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                    background: "var(--bg,#f9fafb)",
                    color: "var(--text,#111827)",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (chatInputValue.trim()) onSendChat(user.id);
                  }}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 12,
                    background: "var(--primary,#16a34a)",
                    border: "none",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  →
                </button>
              </div>
            </div>
          )}

          {!isMe && !isFriend && (
            <div
              style={{
                border: "1.5px dashed var(--border,#e5e7eb)",
                borderRadius: 18,
                padding: "16px 14px",
                background: "var(--bg,#f9fafb)",
                color: "var(--text-secondary,#6b7280)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Энэ хэрэглэгчтэй чатлахын тулд эхлээд найз болоорой.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatDrawer({
  isOpen,
  activeUser,
  friends,
  authUser,
  chatMessages,
  chatInputValue,
  unreadCount,
  onClose,
  onSelectUser,
  onInputChange,
  onSendChat,
}: {
  isOpen: boolean;
  activeUser: LeaderboardUser | null;
  friends: LeaderboardUser[];
  authUser: AuthUser;
  chatMessages: Record<string, ChatMessage[]>;
  chatInputValue: string;
  unreadCount: (userId: string) => number;
  onClose: () => void;
  onSelectUser: (user: LeaderboardUser) => void;
  onInputChange: (val: string) => void;
  onSendChat: (toId: string) => void;
}) {
  const activeMessages = activeUser ? chatMessages[activeUser.id] ?? [] : [];
  const chatEndRef = useRef<HTMLDivElement>(null);

  function getMessageStatus(message: ChatMessage, index: number) {
    if (!activeUser || message.fromId !== authUser.id) return "";

    const laterIncomingExists = activeMessages
      .slice(index + 1)
      .some((entry) => entry.fromId === activeUser.id);

    if (laterIncomingExists) return "Харсан";
    if (index === activeMessages.length - 1) return "Илгээгдсэн";
    return "";
  }

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, isOpen, activeUser]);

  if (!isOpen) return null;

  return (
    <div className="chat-drawer">
      <div className="chat-drawer-head">
        <div className="chat-drawer-head-copy">
          <div className="chat-drawer-title">Найзуудын чат</div>
          <div className="chat-drawer-sub">
            {activeUser ? `${activeUser.name}-тай хувийн чат` : "Зөвхөн найзууд хоорондоо чатлана"}
          </div>
        </div>
        <button type="button" className="chat-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="chat-drawer-body">
        <div className="chat-friend-list">
          {friends.length === 0 ? (
            <div className="chat-empty-mini">Одоогоор найз алга байна.</div>
          ) : (
            friends.map((friend) => {
              const unread = unreadCount(friend.id);
              const lastMessage = (chatMessages[friend.id] ?? []).at(-1);
              return (
                <button
                  key={friend.id}
                  type="button"
                  className={`chat-friend-item${
                    activeUser?.id === friend.id ? " active" : ""
                  }`}
                  onClick={() => onSelectUser(friend)}
                >
                  <div className="chat-friend-avatar">
                    {friend.avatar ? (
                      <Image
                        src={friend.avatar}
                        alt={friend.name}
                        width={40}
                        height={40}
                        unoptimized
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span>{getInitials(friend.name)}</span>
                    )}
                  </div>
                  <div className="chat-friend-copy">
                    <strong>{friend.name}</strong>
                    <span>{lastMessage?.text ?? "Шинэ яриа эхлүүлэх"}</span>
                  </div>
                  {unread > 0 && <div className="chat-friend-unread">{unread}</div>}
                </button>
              );
            })
          )}
        </div>

        <div className="chat-thread">
          {activeUser ? (
            <>
              <div className="chat-thread-head">
                <div className="chat-thread-name">{activeUser.name}</div>
                <div className="chat-thread-meta">
                  🏅 {getTitleLevel(activeUser.xp).title}
                </div>
              </div>
              <div className="chat-thread-messages">
                {activeMessages.length === 0 ? (
                  <div className="chat-empty-thread">
                    {activeUser.name}-тэй анхны мессежээ илгээгээрэй.
                  </div>
                ) : (
                  activeMessages.map((msg, index) => {
                    const mine = msg.fromId === authUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-row${mine ? " mine" : ""}`}
                      >
                        <div className={`chat-bubble${mine ? " mine" : ""}`}>
                          <div>{msg.text}</div>
                          <div className="chat-bubble-time">
                            {new Date(msg.timestamp).toLocaleTimeString("mn-MN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {mine && getMessageStatus(msg, index) && (
                            <div className="chat-bubble-status">
                              {getMessageStatus(msg, index)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-thread-input">
                <input
                  value={chatInputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInputValue.trim()) {
                      onSendChat(activeUser.id);
                    }
                  }}
                  placeholder="Мессеж бичих..."
                  className="form-input"
                  style={{ marginBottom: 0 }}
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onSendChat(activeUser.id)}
                  aria-label="Мессеж илгээх"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 12h12" />
                    <path d="M11 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty-thread">Чат эхлүүлэх найзаа сонгоно уу.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function WordsApp({ initialData }: { initialData: HomeData }) {
  const [categories, setCategories] = useState(initialData.categories);
  const [words, setWords] = useState(initialData.words);
  const [challenges, setChallenges] = useState(initialData.challenges);
  const [leaderboard, setLeaderboard] = useState(initialData.leaderboard);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mode, setMode] = useState<Mode>("flashcard");
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizWrongWordIds, setQuizWrongWordIds] = useState<string[]>([]);
  const [quizWordIds, setQuizWordIds] = useState<string[] | null>(null);

  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [memberName, setMemberName] = useState("");
  const [view, setView] = useState<View>("home");
  const [streak, setStreak] = useState(0);
  const [copiedCode, setCopiedCode] = useState("");
  const [sharedCode, setSharedCode] = useState("");
  const [recentChallenge, setRecentChallenge] = useState<Challenge | null>(null);
  const [challengeDuration, setChallengeDuration] = useState(7);
  const [durationMenuOpen, setDurationMenuOpen] = useState(false);
  const [addWordCategoryMode, setAddWordCategoryMode] = useState<"existing" | "new">("existing");
  const [addWordCategoryId, setAddWordCategoryId] = useState("");
  const [newWordCategoryName, setNewWordCategoryName] = useState("");
  const [addWordModeMenuOpen, setAddWordModeMenuOpen] = useState(false);
  const [addWordCategoryMenuOpen, setAddWordCategoryMenuOpen] = useState(false);

  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [ownedThemes, setOwnedThemes] = useState<ThemeMode[]>(["light"]);
  const [spentThemeXp, setSpentThemeXp] = useState(0);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);

  // Social state
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [heartReactions, setHeartReactions] = useState<HeartReaction[]>([]);
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false);
  const [heartAnimatingIds, setHeartAnimatingIds] = useState<Set<string>>(new Set());
  const [leaderboardAnimated, setLeaderboardAnimated] = useState(false);

  // NEW: Profile modal, chat, likes, XP toasts
  const [profileModalUser, setProfileModalUser] = useState<LeaderboardUser | null>(null);
  const [leaderboardLikes, setLeaderboardLikes] = useState<Record<string, boolean>>({});
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatReadState, setChatReadState] = useState<Record<string, number>>({});
  const [lastActiveMap, setLastActiveMap] = useState<Record<string, number>>({});
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([]);
  const xpEvIdRef = useRef(0);

  const addWordFormRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const durationMenuRef = useRef<HTMLDivElement>(null);
  const addWordModeMenuRef = useRef<HTMLDivElement>(null);
  const addWordCategoryMenuRef = useRef<HTMLDivElement>(null);

  const cssVars = getCSSVariables(theme);
  const userThemeStorageKey = `words-theme-shop:${authUser?.id ?? "guest"}`;
  const friendRequestsStorageKey = `words-friends:${authUser?.id ?? "guest"}`;
  const heartsStorageKey = `words-hearts:${authUser?.id ?? "guest"}`;
  const chatStorageKey = `words-chat:${authUser?.id ?? "guest"}`;
  const likesStorageKey = `words-likes:${authUser?.id ?? "guest"}`;
  const chatReadStorageKey = `words-chat-read:${authUser?.id ?? "guest"}`;
  const lastActiveStorageKey = "words-last-active";

  // ── XP event helper ──────────────────────────────────────────────────────────
  function addXpEvent(type: "gain" | "loss", amount: number, reason: string) {
    const id = String(++xpEvIdRef.current);
    setXpEvents((prev) => [...prev, { id, type, amount, reason }]);
    setTimeout(() => {
      setXpEvents((prev) => prev.filter((e) => e.id !== id));
    }, 3500);
  }

  function dismissXpEvent(id: string) {
    setXpEvents((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: AuthUser | null }) => {
        setAuthUser(data.user ?? null);
      })
      .catch(() => setAuthUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // ── Load social state from localStorage ──────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    try {
      const saved = localStorage.getItem(friendRequestsStorageKey);
      if (saved) setFriendRequests(JSON.parse(saved) as FriendRequest[]);
    } catch { /* ignore */ }
  }, [authUser, friendRequestsStorageKey]);

  useEffect(() => {
    if (!authUser) return;
    try {
      const saved = localStorage.getItem(heartsStorageKey);
      if (saved) setHeartReactions(JSON.parse(saved) as HeartReaction[]);
    } catch { /* ignore */ }
  }, [authUser, heartsStorageKey]);

  useEffect(() => {
    if (!authUser) return;
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) setChatMessages(JSON.parse(saved) as Record<string, ChatMessage[]>);
    } catch { /* ignore */ }
  }, [authUser, chatStorageKey]);

  useEffect(() => {
    if (!authUser) return;
    try {
      const saved = localStorage.getItem(chatReadStorageKey);
      if (saved) setChatReadState(JSON.parse(saved) as Record<string, number>);
    } catch { /* ignore */ }
  }, [authUser, chatReadStorageKey]);

  useEffect(() => {
    if (!authUser) return;
    try {
      const saved = localStorage.getItem(likesStorageKey);
      if (saved) setLeaderboardLikes(JSON.parse(saved) as Record<string, boolean>);
    } catch { /* ignore */ }
  }, [authUser, likesStorageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(lastActiveStorageKey);
      if (saved) setLastActiveMap(JSON.parse(saved) as Record<string, number>);
    } catch { /* ignore */ }
  }, []);

  // ── Save social state to localStorage ────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(friendRequestsStorageKey, JSON.stringify(friendRequests));
  }, [friendRequests, friendRequestsStorageKey, authUser]);

  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(heartsStorageKey, JSON.stringify(heartReactions));
  }, [heartReactions, heartsStorageKey, authUser]);

  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(chatStorageKey, JSON.stringify(chatMessages));
  }, [chatMessages, chatStorageKey, authUser]);

  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(chatReadStorageKey, JSON.stringify(chatReadState));
  }, [chatReadState, chatReadStorageKey, authUser]);

  useEffect(() => {
    if (!authUser) return;
    localStorage.setItem(likesStorageKey, JSON.stringify(leaderboardLikes));
  }, [leaderboardLikes, likesStorageKey, authUser]);

  useEffect(() => {
    localStorage.setItem(lastActiveStorageKey, JSON.stringify(lastActiveMap));
  }, [lastActiveMap, lastActiveStorageKey]);

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedShopState = localStorage.getItem(userThemeStorageKey);
    if (savedShopState) {
      try {
        const parsed = JSON.parse(savedShopState) as {
          ownedThemes?: ThemeMode[];
          spentThemeXp?: number;
        };
        const nextOwnedThemes = Array.from(
          new Set(["light", ...(parsed.ownedThemes ?? []).filter((item): item is ThemeMode => item in themes)])
        ) as ThemeMode[];
        setOwnedThemes(nextOwnedThemes);
        setSpentThemeXp(Math.max(parsed.spentThemeXp ?? 0, 0));
      } catch {
        setOwnedThemes(["light"]);
        setSpentThemeXp(0);
      }
    } else {
      setOwnedThemes(["light"]);
      setSpentThemeXp(0);
    }
    const savedTheme = localStorage.getItem("words-theme") as ThemeMode | null;
    if (savedTheme && savedTheme in themes) {
      setTheme(savedTheme);
    } else {
      setTheme("light");
    }
  }, [userThemeStorageKey]);

  useEffect(() => {
    localStorage.setItem(
      userThemeStorageKey,
      JSON.stringify({ ownedThemes, spentThemeXp })
    );
  }, [ownedThemes, spentThemeXp, userThemeStorageKey]);

  useEffect(() => {
    if (!ownedThemes.includes(theme)) {
      setTheme("light");
      return;
    }
    localStorage.setItem("words-theme", theme);
  }, [ownedThemes, theme]);

  // ── Notice auto-clear ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // ── Sync authUser to edit fields ──────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    setEditBio(authUser.bio ?? "");
    setEditAvatar(authUser.avatar ?? null);
  }, [authUser]);

  // ── Sync authUser to leaderboard ─────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    setLeaderboard((prev) =>
      prev.map((entry) =>
        entry.id === authUser.id
          ? {
              ...entry,
              name: authUser.name,
              avatar: authUser.avatar ?? null,
              bio: authUser.bio ?? "",
              email: authUser.email ?? entry.email,
            }
          : entry
      )
    );
  }, [authUser]);

  // ── Leaderboard entrance animation ───────────────────────────────────────────
  useEffect(() => {
    if (view === "leaderboard") {
      setLeaderboardAnimated(false);
      const t = setTimeout(() => setLeaderboardAnimated(true), 50);
      return () => clearTimeout(t);
    }
  }, [view]);

  useEffect(() => {
    if (!profileModalUser || !areFriends(profileModalUser.id)) return;
    setChatReadState((prev) => ({ ...prev, [profileModalUser.id]: Date.now() }));
  }, [profileModalUser]);

  useEffect(() => {
    if (!authUser) return;

    touchMyActivity();

    const interval = setInterval(() => {
      touchMyActivity();
    }, 60000);

    function handleActivity() {
      touchMyActivity();
    }

    window.addEventListener("focus", handleActivity);
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    document.addEventListener("visibilitychange", handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      document.removeEventListener("visibilitychange", handleActivity);
    };
  }, [authUser]);

  // ── Close dropdowns on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!durationMenuOpen && !addWordModeMenuOpen && !addWordCategoryMenuOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!durationMenuRef.current?.contains(target)) setDurationMenuOpen(false);
      if (!addWordModeMenuRef.current?.contains(target)) setAddWordModeMenuOpen(false);
      if (!addWordCategoryMenuRef.current?.contains(target)) setAddWordCategoryMenuOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDurationMenuOpen(false);
        setAddWordModeMenuOpen(false);
        setAddWordCategoryMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [addWordCategoryMenuOpen, addWordModeMenuOpen, durationMenuOpen]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const filteredWords = useMemo(() => {
    if (selectedCategory === "all") return words;
    return words.filter((w) => w.category_id === selectedCategory);
  }, [selectedCategory, words]);

  const quizWords = useMemo(() => {
    if (!quizWordIds) return words;
    return quizWordIds
      .map((id) => words.find((word) => word.id === id) ?? null)
      .filter((word): word is Word => word !== null);
  }, [quizWordIds, words]);

  const studyWords = mode === "quiz" ? quizWords : filteredWords;
  const activeCardIndex =
    mode === "quiz"
      ? Math.min(cardIndex, Math.max(studyWords.length - 1, 0))
      : studyWords.length > 0
        ? cardIndex % studyWords.length
        : 0;
  const currentWord = studyWords.length > 0 ? studyWords[activeCardIndex] : null;
  const quizScore =
    studyWords.length > 0
      ? Math.round((quizCorrectCount / studyWords.length) * 100)
      : 0;
  const masteredCount = words.filter((w) => w.mastery >= 4).length;
  const learningCount = words.filter((w) => w.mastery > 0 && w.mastery < 4).length;
  const topLeaders = leaderboard.slice(0, 5);
  const podiumLeaders = leaderboard.slice(0, 3);
  const leaderboardRest = leaderboard.slice(3);
  const currentUserLeaderboardEntry = authUser
    ? leaderboard.find((entry) => entry.id === authUser.id) ?? null
    : null;
  const xpTotal =
    currentUserLeaderboardEntry?.xp ??
    words.reduce((t, w) => t + w.mastery * 20, 0);
  const currentTitleLevel = getTitleLevel(xpTotal);
  const nextTitleLevel = getNextTitleLevel(xpTotal);
  const unlockedTitleCount = TITLE_LEVELS.filter((level) => xpTotal >= level.xp).length;
  const availableThemeXp = Math.max(xpTotal - spentThemeXp, 0);
  const currentRankPet =
    [...RANK_PETS].reverse().find((pet) => xpTotal >= pet.xp) ?? RANK_PETS[0];
  const unlockedRankPetCount = RANK_PETS.filter((pet) => xpTotal >= pet.xp).length;
  const titleProgressPct = nextTitleLevel
    ? Math.min(
        100,
        Math.round(
          ((xpTotal - currentTitleLevel.xp) /
            Math.max(nextTitleLevel.xp - currentTitleLevel.xp, 1)) *
            100
        )
      )
    : 100;
  const xpToNextTitle = nextTitleLevel ? Math.max(nextTitleLevel.xp - xpTotal, 0) : 0;
  const myRank = authUser
    ? leaderboard.findIndex((entry) => entry.id === authUser.id) + 1
    : 0;
  const dailyGoalPct = Math.min(
    100,
    Math.round((masteredCount / Math.max(words.length, 1)) * 100)
  );
  const selectedAddWordCategory =
    categories.find((category) => category.id === addWordCategoryId) ?? null;
  const themeKeys = Object.keys(themes) as ThemeMode[];

  // Social helpers (original)
  const pendingRequestsToMe = friendRequests.filter(
    (r) => r.toId === authUser?.id && r.status === "pending"
  );
  const heartsToMe = heartReactions.filter((h) => h.toId === authUser?.id);
  const acceptedFriendIds = friendRequests
    .filter(
      (r) =>
        r.status === "accepted" &&
        (r.fromId === authUser?.id || r.toId === authUser?.id)
    )
    .map((r) => (r.fromId === authUser?.id ? r.toId : r.fromId));
  const friendUsers = leaderboard.filter((entry) => acceptedFriendIds.includes(entry.id));
  const activeChatUser =
    friendUsers.find((entry) => entry.id === activeChatUserId) ?? null;
  const totalUnreadChats = friendUsers.reduce(
    (sum, friend) => sum + unreadChatCount(friend.id),
    0
  );

  function hasGivenHeart(toId: string) {
    return heartReactions.some((h) => h.fromId === authUser?.id && h.toId === toId);
  }
  function heartCountFor(toId: string) {
    return heartReactions.filter((h) => h.toId === toId).length;
  }
  function areFriends(userId: string) {
    return friendRequests.some(
      (r) =>
        r.status === "accepted" &&
        ((r.fromId === authUser?.id && r.toId === userId) ||
          (r.toId === authUser?.id && r.fromId === userId))
    );
  }
  function hasSentRequest(toId: string) {
    return friendRequests.some(
      (r) => r.fromId === authUser?.id && r.toId === toId && r.status === "pending"
    );
  }

  function getUserLastActive(userId: string, fallback?: number | null) {
    return lastActiveMap[userId] ?? fallback ?? null;
  }

  function touchMyActivity() {
    if (!authUser) return;
    const now = Date.now();
    setLastActiveMap((prev) => {
      if (prev[authUser.id] && now - prev[authUser.id] < 15000) {
        return prev;
      }
      return { ...prev, [authUser.id]: now };
    });
  }

  function openChatWithUser(user: LeaderboardUser) {
    if (!areFriends(user.id)) {
      setNotice("Эхлээд найз болоод дараа нь чат эхлүүлнэ");
      return;
    }

    setActiveChatUserId(user.id);
    setChatDrawerOpen(true);
    setProfileModalUser(null);
    setChatReadState((prev) => ({ ...prev, [user.id]: Date.now() }));
  }

  // ── Social actions ────────────────────────────────────────────────────────────
  function sendFriendRequest(toEntry: LeaderboardUser) {
    if (!authUser || toEntry.id === authUser.id) return;
    if (hasSentRequest(toEntry.id) || areFriends(toEntry.id)) return;
    const req: FriendRequest = {
      id: `${Date.now()}-${Math.random()}`,
      fromId: authUser.id,
      fromName: authUser.name,
      fromAvatar: authUser.avatar,
      toId: toEntry.id,
      status: "pending",
      timestamp: Date.now(),
    };
    setFriendRequests((prev) => [...prev, req]);
    setNotice(`✓ ${toEntry.name} рүү найзын хүсэлт илгээлээ`);
    addXpEvent("gain", 10, "Найзын хүсэлт");
  }

  function acceptFriendRequest(reqId: string) {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "accepted" } : r))
    );
    setNotice("✓ Найзын хүсэлт хүлээн авлаа");
    addXpEvent("gain", 20, "Найз болсон!");
  }

  function rejectFriendRequest(reqId: string) {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "rejected" } : r))
    );
  }

  function toggleHeart(toEntry: LeaderboardUser) {
    if (!authUser || toEntry.id === authUser.id) return;
    const alreadyGiven = hasGivenHeart(toEntry.id);
    if (alreadyGiven) {
      setHeartReactions((prev) =>
        prev.filter((h) => !(h.fromId === authUser.id && h.toId === toEntry.id))
      );
      addXpEvent("loss", 5, "Зүрх болиулав");
    } else {
      setHeartAnimatingIds((prev) => new Set(prev).add(toEntry.id));
      setTimeout(() => {
        setHeartAnimatingIds((prev) => {
          const next = new Set(prev);
          next.delete(toEntry.id);
          return next;
        });
      }, 600);
      setHeartReactions((prev) => [
        ...prev,
        {
          fromId: authUser.id,
          fromName: authUser.name,
          toId: toEntry.id,
          timestamp: Date.now(),
        },
      ]);
      setNotice(`❤️ ${toEntry.name}-д зүрх илгээлээ`);
      addXpEvent("gain", 5, "Зүрх илгээлээ");
    }
  }

  // NEW: Leaderboard like (separate from heart)
  function toggleLeaderboardLike(userId: string, userName: string) {
    if (!authUser || userId === authUser.id) return;
    const was = leaderboardLikes[userId] ?? false;
    setLeaderboardLikes((prev) => ({ ...prev, [userId]: !was }));
    if (!was) {
      setNotice(`❤️ ${userName}-д лайк дарлаа`);
    }
  }

  // NEW: Chat send
  function sendChatMessage(toId: string) {
    if (!authUser || !chatInput.trim()) return;
    if (!areFriends(toId)) {
      setNotice("Энэ хэрэглэгчтэй чатлахын тулд эхлээд найз болоорой");
      return;
    }
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      fromId: authUser.id,
      toId,
      text: chatInput.trim(),
      timestamp: Date.now(),
    };
    setChatMessages((prev) => ({ ...prev, [toId]: [...(prev[toId] ?? []), msg] }));
    setChatInput("");
    setChatReadState((prev) => ({ ...prev, [toId]: Date.now() }));
  }

  // NEW: Unread chat count for a user
  function unreadChatCount(userId: string): number {
    if (!authUser) return 0;
    const msgs = chatMessages[userId] ?? [];
    const lastReadAt = chatReadState[userId] ?? 0;
    return msgs.filter((m) => m.fromId === userId && m.timestamp > lastReadAt).length;
  }

  // ── Leaderboard avatar ────────────────────────────────────────────────────────
  function renderLeaderboardAvatar(entry: LeaderboardUser, size = 44) {
    if (authUser && entry.id === authUser.id) {
      return <AvatarDisplay size={size} />;
    }
    if (entry.avatar) {
      return (
        <Image
          src={entry.avatar}
          alt={entry.name}
          width={size}
          height={size}
          unoptimized
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      );
    }
    const [bg, fg] = getAvatarColors(entry.id);
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          color: fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: size * 0.36,
          flexShrink: 0,
          border: `2px solid ${fg}33`,
        }}
      >
        {getInitials(entry.name)}
      </div>
    );
  }

  // ── Misc helpers ─────────────────────────────────────────────────────────────
  function refreshAfterMutation() {
    startTransition(() => window.location.reload());
  }

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = await res.json().catch(() => ({ error: "Request failed." }));
      throw new Error(p.error ?? "Request failed.");
    }
    return res.json();
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuthUser(null);
      setProfileEditMode(false);
      setView("home");
    }
  }

  async function handleProfileSave(bio: string, avatar: string | null) {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, avatar }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Профайл хадгалж чадсангүй" }));
      setNotice(data.error ?? "Профайл хадгалж чадсангүй");
      return;
    }
    const data = (await res.json()) as { user: AuthUser };
    setAuthUser(data.user);
    setEditBio(data.user.bio ?? "");
    setEditAvatar(data.user.avatar ?? null);
    setProfileEditMode(false);
    setNotice("✓ Профайл хадгалагдлаа");
  }

  function handleAvatarFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditAvatar(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("category");
    const form = new FormData(e.currentTarget);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    try {
      await createCategoryByName(String(form.get("name") ?? ""), color);
      e.currentTarget.reset();
      setNotice("✓ Анги нэмэгдлээ");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy("");
    }
  }

  async function addWord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("word");
    const form = new FormData(e.currentTarget);
    const formElement = e.currentTarget;
    try {
      let categoryId: string | null = null;
      let resolvedCategory: Category | null = null;
      if (addWordCategoryMode === "new") {
        const createdCategory = await createCategoryByName(newWordCategoryName);
        categoryId = createdCategory.id;
        resolvedCategory = createdCategory;
      } else if (addWordCategoryId) {
        categoryId = addWordCategoryId;
        resolvedCategory = categories.find((c) => c.id === addWordCategoryId) ?? null;
      }
      if (!categoryId) {
        setNotice("Ангиллаа сонгох эсвэл шинээр үүсгэнэ үү");
        setBusy("");
        return;
      }
      const term = String(form.get("term") ?? "").trim();
      const meaning = String(form.get("meaning") ?? "").trim();
      const example = String(form.get("example") ?? "").trim();
      const authorName =
        String(form.get("authorName") ?? "").trim() || authUser?.name || "Anonymous";
      const createdWord = await postJson<Word>("/api/words", {
        term,
        meaning,
        example,
        categoryId,
        authorName,
      });
      setWords((prev) => [
        {
          ...createdWord,
          term,
          meaning,
          example,
          category_id: categoryId,
          category_name: resolvedCategory?.name ?? null,
          category_color: resolvedCategory?.color ?? null,
          author_name: authorName,
        },
        ...prev,
      ]);
      try { formElement.reset(); } catch { /* ignore */ }
      setAddWordCategoryMode("existing");
      setAddWordCategoryId(categoryId);
      setNewWordCategoryName("");
      setAddWordModeMenuOpen(false);
      setAddWordCategoryMenuOpen(false);
      setNotice(`✓ "${term}" үг нэмэгдлээ!`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy("");
    }
  }

  async function createCategoryByName(name: string, color?: string) {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Ангиллын нэрээ оруулна уу");
    const cat = await postJson<Category>("/api/categories", {
      name: trimmedName,
      color: color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)],
    });
    setCategories((prev) =>
      [...prev.filter((c) => c.id !== cat.id), cat].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    return cat;
  }

  async function updateMastery(word: Word, delta: number) {
    const mastery = Math.min(5, Math.max(0, word.mastery + delta));
    const res = await fetch(`/api/words/${word.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mastery }),
    });
    if (res.ok) {
      setWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, mastery } : w))
      );
      if (delta > 0) {
        setStreak((s) => s + 1);
        addXpEvent("gain", 20, "Үг цээжилсэн");
      }
    }
  }

  function resetStudyState() {
    setRevealed(false);
    setQuizAnswer("");
    setQuizResult(null);
  }

  function resetQuizSession(wordIds?: string[]) {
    setCardIndex(0);
    setQuizAnswer("");
    setQuizResult(null);
    setQuizCorrectCount(0);
    setQuizCompleted(false);
    setQuizWrongWordIds([]);
    setQuizWordIds(wordIds ?? null);
  }

  function nextCard() {
    if (mode === "quiz") {
      if (cardIndex >= studyWords.length - 1) {
        setQuizCompleted(true);
        setQuizAnswer("");
        setQuizResult(null);
        return;
      }
      setCardIndex((i) => i + 1);
      setQuizAnswer("");
      setQuizResult(null);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    resetStudyState();
    setCardIndex((i) => (studyWords.length ? (i + 1) % studyWords.length : 0));
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function prevCard() {
    if (mode === "quiz") return;
    resetStudyState();
    setCardIndex((i) =>
      studyWords.length ? (i - 1 + studyWords.length) % studyWords.length : 0
    );
  }

  function checkQuiz() {
    if (!currentWord) return;
    const answer = quizAnswer.trim().toLowerCase();
    const meaning = currentWord.meaning.trim().toLowerCase();
    if (!answer) { setNotice("Хариултаа бичнэ үү"); return; }
    const correct = meaning.includes(answer) || answer.includes(meaning);
    setQuizResult(correct ? "correct" : "wrong");
    if (correct) {
      setQuizCorrectCount((count) => count + 1);
      setQuizWrongWordIds((prev) => prev.filter((id) => id !== currentWord.id));
      addXpEvent("gain", 20, "Зөв хариулт");
    } else {
      setQuizWrongWordIds((prev) =>
        prev.includes(currentWord.id) ? prev : [...prev, currentWord.id]
      );
      addXpEvent("loss", 5, "Буруу хариулт");
    }
    void updateMastery(currentWord, correct ? 1 : -1);
  }

  async function createChallenge(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("challenge");
    const form = new FormData(e.currentTarget);
    try {
      const created = await postJson<Challenge>("/api/challenges", {
        title: form.get("title"),
        categoryId: form.get("categoryId") || null,
        hostName: authUser?.name || "Anonymous",
        remindMessage: form.get("remindMessage") || "Үгээ цээжлээрэй!",
        durationDays: form.get("durationDays") || 7,
      });
      const localChallenge: Challenge = {
        ...created,
        category_name:
          categories.find((c) => c.id === (created.category_id ?? null))?.name ?? null,
        members: created.members ?? [],
      };
      setRecentChallenge(localChallenge);
      setChallenges((prev) => [localChallenge, ...prev.filter((ch) => ch.id !== localChallenge.id)]);
      setNotice("✓ Challenge үүсгэлээ");
      e.currentTarget.reset();
      setChallengeDuration(7);
      setDurationMenuOpen(false);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy("");
    }
  }

  async function deleteChallenge(challenge: Challenge) {
    const confirmed = window.confirm(`"${challenge.title}" сорилтыг устгах уу?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/challenges/${challenge.invite_code}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Сорилт устгаж чадсангүй." }));
        throw new Error(data.error ?? "Сорилт устгаж чадсангүй.");
      }
      setChallenges((prev) => prev.filter((ch) => ch.invite_code !== challenge.invite_code));
      setRecentChallenge((prev) =>
        prev?.invite_code === challenge.invite_code ? null : prev
      );
      setNotice("✓ Сорилт устгалаа");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  async function joinChallenge(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    const displayName =
      String(form.get("displayName") ?? "").trim() || authUser?.name || "Anonymous";
    try {
      await postJson(`/api/challenges/${code}/join`, { displayName });
      setMemberName(displayName);
      setNotice("✓ Challenge-д нэгдлээ!");
      refreshAfterMutation();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  async function subscribeToPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotice("Browser push notification дэмжихгүй байна");
      return;
    }
    const displayName = memberName.trim() || authUser?.name || "";
    if (!displayName) { setNotice("Эхлээд нэрээ оруулна уу"); return; }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) { setNotice("VAPID key тохируулаагүй байна"); return; }
    const reg = await navigator.serviceWorker.register("/sw.js");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { setNotice("Notification зөвшөөрөл өгөөгүй"); return; }
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
    await postJson("/api/push/subscribe", { memberName: displayName, subscription: sub });
    setNotice("✓ Notification идэвхжлээ!");
  }

  async function sendReminder(code: string) {
    try {
      const r = await postJson<{ sent: number }>(`/api/challenges/${code}/remind`, {});
      setNotice(`✓ ${r.sent} хэрэглэгч рүү сануулга явуулав`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}?join=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(""), 2000);
  }

  function getInviteLink(code: string) {
    return `${window.location.origin}?join=${code}`;
  }

  function canUseTheme(themeKey: ThemeMode) {
    return ownedThemes.includes(themeKey);
  }

  function handleThemeSelect(themeKey: ThemeMode) {
    if (!canUseTheme(themeKey)) {
      setThemePickerOpen(false);
      setView("shop");
      setNotice("Энэ theme-г Shop-с XP-ээр аваарай");
      return;
    }
    setTheme(themeKey);
    setThemePickerOpen(false);
  }

  function handleBuyTheme(themeKey: ThemeMode) {
    const price = THEME_PRICES[themeKey];
    if (canUseTheme(themeKey)) {
      setTheme(themeKey);
      setNotice(`${themes[themeKey].name} theme идэвхжлээ`);
      return;
    }
    if (availableThemeXp < price) {
      setNotice("Theme авахад XP хүрэлцэхгүй байна");
      return;
    }
    setOwnedThemes((prev) => [...prev, themeKey]);
    setSpentThemeXp((prev) => prev + price);
    setTheme(themeKey);
    setNotice(`${themes[themeKey].name} theme худалдаж авлаа`);
  }

  async function shareInviteLink(challenge: Challenge) {
    const url = getInviteLink(challenge.invite_code);
    const shareText = `${challenge.title} сорилтод нэгдээрэй. Код: ${challenge.invite_code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: challenge.title, text: shareText, url });
        setSharedCode(challenge.invite_code);
        window.setTimeout(() => setSharedCode(""), 2000);
        return;
      } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(url);
    setSharedCode(challenge.invite_code);
    setNotice("✓ Share link хуулагдлаа");
    window.setTimeout(() => setSharedCode(""), 2000);
  }

  function formatDuration(days: number) {
    if (days === 1) return "1 өдөр";
    if (days % 7 === 0) {
      const weeks = days / 7;
      return weeks === 1 ? "7 хоног" : `${weeks} долоо хоног`;
    }
    return `${days} өдөр`;
  }

  function formatExpiry(date: string | null) {
    if (!date) return "";
    return new Intl.DateTimeFormat("mn-MN", { month: "short", day: "numeric" }).format(
      new Date(date)
    );
  }

  function isChallengeOwner(challenge: Challenge) {
    return Boolean(authUser?.id && challenge.host_id && challenge.host_id === authUser.id);
  }

  function masteryColor(m: number) {
    if (m === 0) return "var(--border, #d1d5db)";
    if (m <= 2) return "var(--accent, #f59e0b)";
    if (m <= 4) return "var(--primary, #22c55e)";
    return "var(--primary-dark, #16a34a)";
  }

  function AvatarDisplay({
    size = 36,
    editable = false,
  }: {
    size?: number;
    editable?: boolean;
  }) {
    const avatar = editable ? editAvatar : authUser?.avatar;
    const name = authUser?.name || "?";
    if (avatar) {
      return (
        <img
          src={avatar}
          alt={name}
          onClick={editable ? () => avatarInputRef.current?.click() : undefined}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--primary-soft-border, #bbf7d0)",
            cursor: editable ? "pointer" : "default",
            flexShrink: 0,
          }}
        />
      );
    }
    return (
      <div
        onClick={editable ? () => avatarInputRef.current?.click() : undefined}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--primary-soft, #f0fdf4)",
          border: "2px solid var(--primary-soft-border, #bbf7d0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.42,
          fontWeight: 900,
          color: "var(--primary, #16a34a)",
          cursor: editable ? "pointer" : "default",
          flexShrink: 0,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  // ── Loading / Auth states ─────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg, #f5f5f0)",
          fontFamily: "Nunito, sans-serif",
          fontSize: 14,
          color: "#9ca3af",
          fontWeight: 700,
        }}
      >
        Ачаалж байна…
      </div>
    );
  }

  if (!authUser) {
    return (
      <>
        <style>{`:root { ${cssVars} }`}</style>
        <AuthModal onAuth={(user) => setAuthUser(user)} />
      </>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        :root { ${cssVars} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg, #f5f5f0); color: var(--text, #111827); font-family: 'Nunito', 'Segoe UI', sans-serif; min-height: 100vh; }
        button, input, textarea, select { font-family: inherit; }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes leaderRowIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes podiumRise1 {
          from { opacity: 0; transform: translateY(40px) scale(0.92); }
          to { opacity: 1; transform: translateY(-12px) scale(1); }
        }
        @keyframes podiumRise2 {
          from { opacity: 0; transform: translateY(40px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes podiumRise3 {
          from { opacity: 0; transform: translateY(40px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 20px 50px rgba(251,191,36,0.35), 0 0 0 2px rgba(251,191,36,0.4); }
          50% { box-shadow: 0 24px 60px rgba(251,191,36,0.55), 0 0 0 5px rgba(251,191,36,0.25); }
        }
        @keyframes crownBounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }
        @keyframes avatarGlow {
          0%, 100% { box-shadow: 0 0 0 3px #fbbf24, 0 8px 24px rgba(251,191,36,0.4); }
          50% { box-shadow: 0 0 0 5px #fde68a, 0 12px 32px rgba(251,191,36,0.6); }
        }
        @keyframes heartPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.6); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1.2); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulseBell {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .app { display: flex; flex-direction: column; min-height: 100vh; background: var(--bg, #f5f5f0); color: var(--text, #111827); }
        .app-header { background: var(--bg-secondary, var(--card, #fff)); border-bottom: 2px solid var(--border, #e5e7eb); padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
        .app-header-logo { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 900; color: var(--primary, #16a34a); letter-spacing: -0.5px; background: none; border: none; cursor: pointer; }
        .app-header-logo-mark { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
        .app-header-logo span { color: var(--text, #111827); }
        .app-header-right { display: flex; align-items: center; gap: 10px; }
        .icon-btn { width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, var(--card, #fff)); color: var(--text, #111827); cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; position: relative; }
        .icon-btn:hover { border-color: var(--primary, #16a34a); }
        .notif-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 900; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg-secondary, #fff); animation: pulseBell 2s infinite; }
        .xp-badge, .streak-pill { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 900; border-radius: 100px; padding: 5px 12px; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, var(--card, #fff)); }
        .xp-badge { color: var(--accent, #f59e0b); }
        .streak-pill { color: var(--accent-dark, #ea580c); }
        .title-badge { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 14px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--primary, #16a34a) 24%, transparent); background: color-mix(in srgb, var(--primary-soft, #f0fdf4) 82%, transparent); color: var(--primary, #16a34a); font-size: 12px; font-weight: 900; letter-spacing: 0.03em; }
        .title-card { margin-top: 16px; padding: 16px; border-radius: 18px; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, rgba(255, 255, 255, 0.88)); }
        .title-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .title-card-label { font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary, #6b7280); }
        .title-card-name { font-size: 18px; font-weight: 900; color: var(--text, #111827); line-height: 1.2; }
        .title-card-sub { font-size: 12px; font-weight: 700; color: var(--text-secondary, #6b7280); line-height: 1.5; }
        .title-list { display: grid; gap: 12px; margin-top: 16px; }
        .title-list-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 16px; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, rgba(255, 255, 255, 0.88)); }
        .title-list-item.unlocked { border-color: color-mix(in srgb, var(--primary, #16a34a) 28%, var(--border, #e5e7eb)); background: color-mix(in srgb, var(--primary-soft, #f0fdf4) 72%, transparent); }
        .title-list-item.current { border-color: var(--primary, #16a34a); box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary, #16a34a) 10%, transparent); }
        .title-list-copy { display: grid; gap: 4px; min-width: 0; }
        .title-list-copy strong { font-size: 14px; font-weight: 900; color: var(--text, #111827); }
        .title-list-copy span { font-size: 12px; font-weight: 700; color: var(--text-secondary, #6b7280); line-height: 1.45; }
        .title-list-pill { flex-shrink: 0; padding: 8px 10px; border-radius: 999px; background: rgba(15, 23, 42, 0.06); color: var(--text, #111827); font-size: 11px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
        .theme-picker-overlay { position: sticky; top: 60px; z-index: 120; padding: 0 16px; }
        .theme-picker { background: var(--bg-secondary, var(--card, #fff)); border: 2px solid var(--border, #e5e7eb); border-radius: 20px; padding: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); margin: 8px auto 0; max-width: 680px; }
        .theme-picker-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .theme-picker-title { font-size: 15px; font-weight: 900; color: var(--text, #111827); }
        .theme-picker-close { border: 2px solid var(--border, #e5e7eb); background: var(--bg, #f5f5f0); color: var(--text, #111827); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 14px; }
        .theme-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
        .theme-preview-btn { background: none; border: none; padding: 0; cursor: pointer; display: flex; flex-direction: column; gap: 6px; outline: none; }
        .theme-preview-card { width: 100%; border-radius: 12px; overflow: hidden; border: 2px solid transparent; transition: all 0.15s; }
        .theme-preview-name { font-size: 12px; font-weight: 900; text-align: center; letter-spacing: 0.3px; }
        .shop-grid { display: grid; gap: 14px; margin-top: 16px; }
        .shop-card { border: 2px solid var(--border, #e5e7eb); border-radius: 20px; background: var(--bg-secondary, #ffffff); padding: 18px; }
        .shop-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .shop-card-name { font-size: 18px; font-weight: 900; color: var(--text, #111827); }
        .shop-card-price { padding: 8px 12px; border-radius: 999px; background: var(--accent-soft, #fef3c7); color: var(--accent-dark, #d97706); font-size: 12px; font-weight: 900; }
        .shop-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
        .app-body { flex: 1; overflow-y: auto; padding-bottom: 84px; }
        .page, .form-page, .flashcard-wrap { padding: 20px; max-width: 680px; margin: 0 auto; width: 100%; }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-secondary, var(--card, #fff)); border-top: 2px solid var(--border, #e5e7eb); display: flex; z-index: 100; height: 68px; }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: transparent; border: none; cursor: pointer; padding: 8px 4px; position: relative; color: var(--text-secondary, var(--muted, #9ca3af)); transition: transform 0.1s, color 0.15s; }
        .nav-btn:active { transform: scale(0.94); }
        .nav-btn-icon { font-size: 22px; line-height: 1; height: 24px; display: flex; align-items: center; justify-content: center; }
        .nav-btn-label { font-size: 11px; font-weight: 800; }
        .nav-btn.active { color: var(--primary, #16a34a); }
        .nav-btn.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 32px; height: 3px; background: var(--primary, #16a34a); border-radius: 2px 2px 0 0; }
        .hero { background: var(--primary, #16a34a); border-radius: 24px; padding: 22px; margin-bottom: 20px; color: var(--white, #fff); position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.10); border-radius: 50%; }
        .hero-eyebrow { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.4px; opacity: 0.85; margin-bottom: 8px; }
        .hero-title { font-size: 24px; font-weight: 900; margin-bottom: 10px; line-height: 1.15; }
        .hero-sub { font-size: 14px; opacity: 0.9; line-height: 1.5; margin-bottom: 16px; }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        .quiz-banner { margin: 0 auto 14px; max-width: 680px; width: 100%; padding: 12px 16px; border-radius: 16px; background: var(--accent-soft, #fef3c7); border: 1px solid var(--accent-soft-border, #fcd34d); color: var(--text, #111827); font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .white-btn, .primary-btn, .secondary-btn, .danger-btn, .warning-btn { border: none; border-radius: 16px; padding: 13px 18px; font-size: 15px; font-weight: 900; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
        .white-btn { background: #fff; color: var(--primary, #16a34a); box-shadow: 0 4px 0 rgba(0,0,0,0.16); }
        .primary-btn { background: var(--primary, #16a34a); color: #fff; box-shadow: 0 5px 0 rgba(0,0,0,0.18); }
        .secondary-btn { background: var(--bg-secondary, var(--card, #fff)); color: var(--text, #111827); border: 2px solid var(--border, #e5e7eb); box-shadow: 0 4px 0 rgba(0,0,0,0.10); }
        .warning-btn { background: #f59e0b; color: #fff; box-shadow: 0 5px 0 #d97706; }
        .danger-btn { background: #ef4444; color: #fff; box-shadow: 0 5px 0 #dc2626; }
        .white-btn:hover, .primary-btn:hover, .secondary-btn:hover, .danger-btn:hover, .warning-btn:hover { transform: translateY(-1px); }
        .white-btn:active, .primary-btn:active, .secondary-btn:active, .danger-btn:active, .warning-btn:active { transform: translateY(3px); box-shadow: none; }
        .primary-btn:disabled, .secondary-btn:disabled, .warning-btn:disabled { background: #d1d5db; color: #6b7280; box-shadow: none; cursor: not-allowed; }
        .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .stat-tile, .card, .word-card, .challenge-card, .goal-tile, .profile-card, .cat-tile { background: var(--bg-secondary, var(--card, #fff)); border: 2px solid var(--border, #e5e7eb); border-radius: 18px; }
        .stat-tile { padding: 16px; }
        .stat-label { font-size: 12px; font-weight: 800; color: var(--text-secondary, var(--muted, #6b7280)); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .stat-val { font-size: 28px; font-weight: 900; line-height: 1; margin-bottom: 4px; }
        .stat-sub { font-size: 12px; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 700; }
        .goal-tile { grid-column: 1 / -1; padding: 16px; }
        .goal-header, .sec-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .goal-header { margin-bottom: 10px; }
        .goal-label, .sec-title { font-size: 16px; font-weight: 900; color: var(--text, #111827); }
        .goal-pct, .sec-link { font-size: 13px; font-weight: 900; color: var(--primary, #16a34a); }
        .sec-head { margin-bottom: 14px; }
        .sec-title { font-size: 19px; }
        .sec-link { border: none; background: none; cursor: pointer; }
        .goal-bar { height: 10px; background: var(--muted, var(--soft, #e5e7eb)); border-radius: 100px; overflow: hidden; }
        .goal-fill { height: 100%; background: var(--primary, #16a34a); border-radius: 100px; transition: width 0.4s ease; }
        .word-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .word-card { padding: 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color 0.15s, transform 0.1s; }
        .word-card:hover { border-color: var(--primary, #16a34a); transform: translateY(-1px); }
        .word-card-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; background: var(--primary-soft, var(--soft, #f0fdf4)); border: 2px solid var(--primary-soft-border, transparent); }
        .word-card-body { flex: 1; min-width: 0; }
        .word-card-term { font-size: 16px; font-weight: 900; color: var(--text, #111827); margin-bottom: 2px; }
        .word-card-meaning { font-size: 13px; color: var(--text-secondary, var(--muted, #6b7280)); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .word-card-mastery { display: flex; gap: 3px; flex-shrink: 0; }
        .ms-dot { width: 8px; height: 8px; border-radius: 50%; }
        .cat-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 16px; scrollbar-width: none; }
        .cat-chips::-webkit-scrollbar { display: none; }
        .cat-chip { padding: 7px 14px; border-radius: 100px; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, var(--card, #fff)); color: var(--text-secondary, var(--muted, #6b7280)); font-size: 13px; font-weight: 800; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .cat-chip.active { background: var(--primary, #16a34a); border-color: var(--primary, #16a34a); color: #fff; }
        .cat-chip-dot { width: 8px; height: 8px; border-radius: 50%; }
        .mode-tabs { display: flex; background: var(--muted, var(--soft, #f3f4f6)); border-radius: 14px; padding: 4px; gap: 4px; margin-bottom: 20px; }
        .mode-tab { flex: 1; padding: 10px 8px; border-radius: 10px; border: none; background: transparent; color: var(--text-secondary, var(--muted, #6b7280)); font-size: 13px; font-weight: 900; cursor: pointer; }
        .mode-tab.active { background: var(--bg-secondary, var(--card, #fff)); color: var(--text, #111827); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
        .big-flashcard { background: var(--bg-secondary, var(--card, #fff)); border: 2px solid var(--border, #e5e7eb); border-radius: 26px; padding: 42px 28px; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; cursor: pointer; margin-bottom: 16px; position: relative; }
        .new-word-tag { position: absolute; top: 16px; right: 16px; background: var(--primary-soft, var(--soft, #f0fdf4)); color: var(--primary, #16a34a); font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 100px; border: 2px solid var(--primary-soft-border, transparent); }
        .card-phonetic { font-size: 14px; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 700; margin-bottom: 8px; }
        .card-term { font-size: 40px; font-weight: 900; color: var(--text, #111827); margin-bottom: 8px; letter-spacing: -1px; }
        .card-reveal-hint { font-size: 14px; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 700; }
        .card-meaning { font-size: 18px; color: var(--text, #374151); font-weight: 800; line-height: 1.5; margin-top: 16px; padding-top: 16px; border-top: 2px solid var(--border, #f3f4f6); width: 100%; }
        .card-example { font-size: 14px; color: var(--text-secondary, var(--muted, #9ca3af)); font-style: italic; margin-top: 10px; line-height: 1.6; }
        .card-nav, .action-btns { display: grid; gap: 10px; }
        .card-nav { grid-template-columns: 56px 1fr 56px; align-items: center; margin-bottom: 18px; }
        .nav-arrow { width: 54px; height: 54px; border-radius: 50%; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, var(--card, #fff)); cursor: pointer; font-size: 24px; font-weight: 900; color: var(--text, #111827); }
        .card-counter { text-align: center; font-size: 15px; font-weight: 900; color: var(--text, #374151); }
        .action-btns { grid-template-columns: 1fr 1fr; }
        .quiz-input, .form-input { width: 100%; background: var(--bg-secondary, var(--card, #fff)); border: 2px solid var(--border, #e5e7eb); border-radius: 14px; padding: 14px 16px; color: var(--text, #111827); font-size: 15px; font-weight: 700; outline: none; }
        .quiz-input { margin-top: 16px; }
        .quiz-input:focus, .form-input:focus { border-color: var(--primary, #16a34a); }
        .quiz-input.correct { border-color: #16a34a; background: #f0fdf4; }
        .quiz-input.wrong { border-color: #ef4444; background: #fef2f2; }
        .result-bar { margin-top: 12px; padding: 12px 16px; border-radius: 12px; font-size: 15px; font-weight: 800; }
        .result-bar.correct { background: #f0fdf4; color: #16a34a; border: 2px solid #bbf7d0; }
        .result-bar.wrong { background: #fef2f2; color: #dc2626; border: 2px solid #fecaca; }
        .form-title { font-size: 24px; font-weight: 900; margin-bottom: 6px; color: var(--text, #111827); }
        .form-sub { font-size: 14px; color: var(--text-secondary, var(--muted, #6b7280)); font-weight: 700; margin-bottom: 24px; }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 900; color: var(--text, #374151); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        textarea.form-input { min-height: 90px; resize: vertical; }
        .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .cat-tile { padding: 18px; cursor: pointer; }
        .cat-tile-dot { width: 12px; height: 12px; border-radius: 50%; margin-bottom: 12px; }
        .cat-tile-name { font-size: 15px; font-weight: 900; color: var(--text, #111827); margin-bottom: 4px; }
        .cat-tile-count { font-size: 13px; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 700; }
        .challenge-card { padding: 20px; margin-bottom: 14px; }
        .challenge-title { font-size: 18px; font-weight: 900; color: var(--text, #111827); margin-bottom: 4px; }
        .challenge-host { font-size: 13px; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 700; margin-bottom: 14px; }
        .invite-code-row { background: var(--bg, var(--soft, #f9fafb)); border: 2px solid var(--border, #e5e7eb); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
        .invite-code-text { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 900; letter-spacing: 4px; color: var(--primary, #16a34a); }
        .challenge-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .challenge-meta-pill { background: var(--soft, #f3f4f6); color: var(--text-secondary, #6b7280); font-size: 12px; font-weight: 900; padding: 6px 10px; border-radius: 999px; }
        .share-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .challenge-actions { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .share-link-box { background: var(--bg, var(--soft, #f9fafb)); border: 2px solid var(--border, #e5e7eb); border-radius: 14px; padding: 12px 14px; margin-bottom: 14px; word-break: break-all; }
        .share-link-label { font-size: 11px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-secondary, #6b7280); margin-bottom: 6px; }
        .share-link-value { font-size: 13px; font-weight: 800; color: var(--text, #111827); line-height: 1.45; }
        .success-card { padding: 20px; margin-bottom: 18px; border: 2px solid rgba(34, 197, 94, 0.24); }
        .dropdown-shell { position: relative; }
        .dropdown-trigger { width: 100%; border: 2px solid var(--border, #e5e7eb); border-radius: 18px; background: var(--card, #ffffff); color: var(--text, #111827); min-height: 56px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05); transition: border-color 0.18s ease, box-shadow 0.18s ease; }
        .dropdown-trigger:hover { border-color: color-mix(in srgb, var(--primary, #16a34a) 30%, var(--border, #e5e7eb)); box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08); }
        .dropdown-trigger.open { border-color: var(--primary, #16a34a); box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1); }
        .dropdown-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .dropdown-copy strong { font-size: 15px; font-weight: 900; color: var(--text, #111827); }
        .dropdown-copy span { font-size: 12px; font-weight: 800; color: var(--text-secondary, #6b7280); }
        .dropdown-caret { font-size: 18px; font-weight: 900; color: var(--text-secondary, #6b7280); transition: transform 0.18s ease; }
        .dropdown-trigger.open .dropdown-caret { transform: rotate(180deg); }
        .dropdown-menu { position: absolute; top: calc(100% + 10px); left: 0; right: 0; z-index: 40; padding: 8px; border-radius: 20px; border: 1px solid rgba(229, 231, 235, 0.9); background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(18px); box-shadow: 0 26px 44px rgba(15, 23, 42, 0.14); }
        .dropdown-option { width: 100%; border: none; background: transparent; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; text-align: left; font: inherit; cursor: pointer; transition: background 0.16s ease; }
        .dropdown-option:hover { background: rgba(22, 163, 74, 0.08); }
        .dropdown-option.active { background: rgba(22, 163, 74, 0.12); color: var(--primary, #16a34a); }
        .dropdown-option strong { font-size: 14px; font-weight: 900; }
        .dropdown-option span { font-size: 12px; font-weight: 800; color: var(--text-secondary, #6b7280); }
        .dropdown-option:disabled { cursor: not-allowed; opacity: 0.65; }
        .input-helper { margin-top: 8px; font-size: 12px; color: var(--text-secondary, #6b7280); line-height: 1.5; }
        .member-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .member-pill { background: var(--muted, var(--soft, #f3f4f6)); color: var(--text, #374151); font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 100px; }
        .profile-card { padding: 22px; text-align: center; margin-bottom: 18px; }
        .profile-name { font-size: 24px; font-weight: 900; color: var(--text, #111827); margin: 12px 0 6px; }
        .profile-email { font-size: 13px; color: var(--text-secondary, var(--muted, #6b7280)); font-weight: 800; margin-bottom: 8px; }
        .profile-bio { font-size: 14px; color: var(--text-secondary, var(--muted, #6b7280)); font-weight: 700; line-height: 1.5; margin-bottom: 16px; }

          /* ═══════════════════════════════════════════════════════════════
    SUPER DUOLINGO PROFILE THEME
  ═══════════════════════════════════════════════════════════════ */

  .super-profile-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-bottom: 120px;
  }

  .super-profile-hero {
    position: relative;
    overflow: hidden;
    border-radius: 36px;
    padding: 24px;
    color: #fff;
    background:
      radial-gradient(circle at 15% 12%, rgba(255,255,255,0.55), transparent 26%),
      radial-gradient(circle at 92% 12%, rgba(255,255,255,0.32), transparent 28%),
      radial-gradient(circle at 60% 95%, rgba(255,255,255,0.16), transparent 34%),
      linear-gradient(135deg, var(--primary, #16a34a) 0%, var(--primary-dark, #15803d) 52%, #0f766e 100%);
    box-shadow:
      0 28px 70px rgba(15, 23, 42, 0.23),
      inset 0 2px 0 rgba(255,255,255,0.34),
      inset 0 -9px 0 rgba(0,0,0,0.12);
    animation: superCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .super-bg-grid {
    position: absolute;
    inset: 0;
    opacity: 0.13;
    background-image:
      linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px);
    background-size: 28px 28px;
    transform: rotate(-7deg) scale(1.15);
    pointer-events: none;
  }

  .super-orb,
  .super-star {
    position: absolute;
    pointer-events: none;
  }

  .super-orb {
    border-radius: 999px;
    background: rgba(255,255,255,0.17);
  }

  .super-orb.orb-a {
    width: 190px;
    height: 190px;
    top: -78px;
    right: -58px;
    animation: superOrbFloat 5s ease-in-out infinite;
  }

  .super-orb.orb-b {
    width: 140px;
    height: 140px;
    left: -50px;
    bottom: -45px;
    animation: superOrbFloat 6.2s ease-in-out infinite 0.5s;
  }

  .super-orb.orb-c {
    width: 76px;
    height: 76px;
    right: 58px;
    bottom: 42px;
    background: rgba(255,255,255,0.12);
    animation: superOrbFloat 4.6s ease-in-out infinite 1s;
  }

  .super-star {
    z-index: 1;
    color: rgba(255,255,255,0.95);
    text-shadow: 0 0 18px rgba(255,255,255,0.75);
    animation: superTwinkle 2.4s ease-in-out infinite;
  }

  .super-star.star-a {
    top: 34px;
    right: 42px;
    font-size: 22px;
  }

  .super-star.star-b {
    top: 128px;
    right: 95px;
    font-size: 16px;
    animation-delay: 0.5s;
  }

  .super-star.star-c {
    left: 34px;
    bottom: 42px;
    font-size: 18px;
    animation-delay: 1s;
  }

  .super-profile-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .super-avatar-zone {
    position: relative;
    flex-shrink: 0;
  }

  .super-avatar-glow {
    position: absolute;
    inset: -14px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255,255,255,0.6), transparent 65%);
    filter: blur(8px);
    animation: superAvatarGlow 2.4s ease-in-out infinite;
  }

  .super-avatar-ring {
    position: relative;
    width: 132px;
    height: 132px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      linear-gradient(#fff, #fff) padding-box,
      conic-gradient(from 130deg, #fff, #bbf7d0, #fef08a, #86efac, #fff) border-box;
    border: 7px solid transparent;
    box-shadow:
      0 20px 38px rgba(0,0,0,0.2),
      inset 0 -4px 0 rgba(0,0,0,0.08);
    animation: superAvatarFloat 2.8s ease-in-out infinite;
  }

  .super-avatar-ring.edit {
    width: 120px;
    height: 120px;
    margin: 0 auto 12px;
  }

  .super-active-dot {
    position: absolute;
    right: 9px;
    bottom: 13px;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #22c55e;
    border: 4px solid #fff;
    box-shadow: 0 0 0 7px rgba(34,197,94,0.2);
    animation: superPulse 1.5s ease-in-out infinite;
  }

  .super-profile-info {
    min-width: 0;
  }

  .super-kicker,
  .super-section-kicker,
  .super-bio-label,
  .super-wallet-label {
    font-size: 10px;
    font-weight: 1000;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .super-kicker {
    opacity: 0.76;
    margin-bottom: 6px;
  }

  .super-name {
    margin: 0;
    font-size: 34px;
    line-height: 1.02;
    letter-spacing: -0.055em;
    font-weight: 1000;
    word-break: break-word;
  }

  .super-email {
    margin-top: 7px;
    font-size: 13px;
    font-weight: 850;
    opacity: 0.84;
  }

  .super-pill-row {
    margin-top: 13px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .super-rank-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 999px;
    padding: 9px 13px;
    background: rgba(255,255,255,0.22);
    border: 1px solid rgba(255,255,255,0.25);
    backdrop-filter: blur(14px);
    font-size: 13px;
    font-weight: 1000;
    box-shadow: inset 0 -2px 0 rgba(0,0,0,0.08);
  }

  .super-rank-pill.xp {
    background: rgba(255,255,255,0.3);
  }

  .super-bio-card {
    position: relative;
    z-index: 2;
    margin-top: 20px;
    display: flex;
    gap: 13px;
    align-items: flex-start;
    padding: 15px;
    border-radius: 24px;
    background: rgba(255,255,255,0.19);
    border: 1px solid rgba(255,255,255,0.22);
    backdrop-filter: blur(16px);
  }

  .super-bio-icon {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.25);
    font-size: 20px;
  }

  .super-bio-label {
    opacity: 0.72;
    margin-bottom: 4px;
  }

  .super-bio-text {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 850;
  }

  .super-action-row,
  .super-edit-actions {
    position: relative;
    z-index: 2;
    margin-top: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .super-btn {
    border: 0;
    border-radius: 19px;
    padding: 13px 15px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 1000;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease,
      filter 0.16s ease;
  }

  .super-btn:hover {
    transform: translateY(-2px) scale(1.015);
    filter: brightness(1.02);
  }

  .super-btn.primary {
    background: #fff;
    color: var(--primary-dark, #15803d);
    box-shadow:
      0 12px 24px rgba(0,0,0,0.14),
      inset 0 -3px 0 rgba(0,0,0,0.08);
  }

  .super-btn.primary.green {
    background: linear-gradient(135deg, var(--primary, #16a34a), #22c55e);
    color: #fff;
  }

  .super-btn.secondary {
    background: var(--bg-secondary, #fff);
    color: var(--text, #111827);
    border: 2px solid var(--border, #e5e7eb);
    box-shadow: inset 0 -3px 0 rgba(0,0,0,0.04);
  }

  .super-btn.danger {
    background: rgba(255,255,255,0.2);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
    box-shadow: inset 0 -3px 0 rgba(0,0,0,0.08);
  }

  .super-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(230px, 0.9fr);
    gap: 16px;
  }

  .super-card {
    position: relative;
    overflow: hidden;
    border-radius: 30px;
    padding: 18px;
    background: var(--bg-secondary, #fff);
    border: 2px solid var(--border, #e5e7eb);
    box-shadow:
      0 18px 40px rgba(15, 23, 42, 0.08),
      inset 0 -4px 0 rgba(0,0,0,0.035);
    animation: superCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .super-card::after {
    content: "";
    position: absolute;
    width: 110px;
    height: 110px;
    right: -40px;
    top: -40px;
    border-radius: 999px;
    background: var(--primary, #16a34a);
    opacity: 0.07;
  }

  .super-section-head {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .super-section-kicker {
    color: var(--text-secondary, #6b7280);
    margin-bottom: 5px;
  }

  .super-section-head h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.1;
    letter-spacing: -0.04em;
    font-weight: 1000;
    color: var(--text, #111827);
  }

  .super-section-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 19px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-soft, #f0fdf4);
    font-size: 25px;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,0.05);
  }

  .super-level-now {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 15px;
  }

  .super-level-now span {
    display: block;
    font-size: 12px;
    font-weight: 900;
    color: var(--text-secondary, #6b7280);
    margin-bottom: 4px;
  }

  .super-level-now strong {
    font-size: 25px;
    line-height: 1.12;
    font-weight: 1000;
    color: var(--text, #111827);
  }

  .super-xp-badge {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 10px 14px;
    background: var(--accent-soft, #fef3c7);
    border: 2px solid var(--accent-soft-border, #fcd34d);
    color: var(--accent-dark, #d97706);
    font-size: 13px;
    font-weight: 1000;
  }

  .super-progress-wrap {
    position: relative;
    overflow: hidden;
    height: 21px;
    border-radius: 999px;
    background: var(--muted, #f3f4f6);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
  }

  .super-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--primary, #16a34a), #22c55e, #86efac);
    box-shadow: 0 0 18px rgba(34,197,94,0.45);
    transition: width 0.45s ease;
  }

  .super-progress-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent);
    transform: translateX(-100%);
    animation: superShine 2.4s ease-in-out infinite;
  }

  .super-progress-info {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 850;
    color: var(--text-secondary, #6b7280);
  }

  .super-title-count {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

.super-title-count > div {
  border-radius: 20px;
  padding: 13px;
  background: var(--primary-soft, #f0fdf4);
  border: 2px solid var(--primary-soft-border, #bbf7d0);
}

.super-title-count strong {
  display: block;
  font-size: 24px;
  font-weight: 1000;
  color: var(--primary-dark, #15803d);
}

.super-title-count span {
  font-size: 12px;
  font-weight: 900;
  color: var(--text-secondary, #6b7280);
}
/* ═══════════════════════════════════════════════════════════════
   CLEAN PROFESSIONAL PROFILE
═══════════════════════════════════════════════════════════════ */

.pro-profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 110px;
}

.pro-profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border-radius: 24px;
  background: var(--bg-secondary, #ffffff);
  border: 2px solid var(--border, #e5e7eb);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.pro-profile-avatar {
  width: 122px;
  height: 122px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-soft, #f0fdf4);
  border: 3px solid var(--primary-soft-border, #bbf7d0);
  flex-shrink: 0;
}

.pro-profile-info {
  min-width: 0;
}

.pro-profile-label,
.pro-section-label,
.pro-muted {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary, #6b7280);
}

.pro-profile-name {
  margin: 5px 0 4px;
  font-size: 30px;
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--text, #111827);
  word-break: break-word;
}

.pro-profile-email {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 10px;
}

.pro-profile-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--primary-soft, #f0fdf4);
  border: 1px solid var(--primary-soft-border, #bbf7d0);
  color: var(--primary, #16a34a);
  font-size: 13px;
  font-weight: 900;
}

.pro-card {
  background: var(--bg-secondary, #ffffff);
  border: 2px solid var(--border, #e5e7eb);
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.pro-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.pro-section-head h2 {
  margin: 4px 0 0;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 900;
  color: var(--text, #111827);
}

.pro-section-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--muted, #f3f4f6);
  font-size: 21px;
  flex-shrink: 0;
}

.pro-bio-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  font-weight: 700;
  color: var(--text-secondary, #6b7280);
}

.pro-action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.pro-edit-avatar {
  display: grid;
  justify-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.pro-level-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.pro-level-title {
  margin-top: 4px;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 900;
  color: var(--text, #111827);
}

.pro-xp-pill {
  flex-shrink: 0;
  padding: 9px 13px;
  border-radius: 999px;
  background: var(--accent-soft, #fef3c7);
  border: 1px solid var(--accent-soft-border, #fcd34d);
  color: var(--accent-dark, #d97706);
  font-size: 13px;
  font-weight: 900;
}

.pro-progress {
  height: 13px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--muted, #f3f4f6);
}

.pro-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary, #16a34a), #22c55e);
  transition: width 0.35s ease;
}

.pro-progress-text {
  margin-top: 9px;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 700;
  color: var(--text-secondary, #6b7280);
}

.pro-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.pro-stat-card {
  padding: 16px;
  border-radius: 20px;
  background: var(--bg-secondary, #ffffff);
  border: 2px solid var(--border, #e5e7eb);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.pro-stat-card span {
  display: block;
  font-size: 24px;
  margin-bottom: 8px;
}

.pro-stat-card strong {
  display: block;
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  color: var(--text, #111827);
  word-break: break-word;
}

.pro-stat-card p {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-secondary, #6b7280);
}

@media (max-width: 520px) {
  .pro-profile-hero {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .pro-profile-title {
    justify-content: center;
  }

  .pro-action-grid {
    grid-template-columns: 1fr;
  }

  .pro-level-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .pro-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.super-pet-stage {
  position: relative;
  height: 205px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.super-pet-aura {
  position: absolute;
  width: 165px;
  height: 165px;
  border-radius: 999px;
  background:
    radial-gradient(circle, rgba(255,255,255,0.6), transparent 45%),
    radial-gradient(circle, var(--primary, #16a34a), transparent 72%);
  filter: blur(5px);
  opacity: 0.42;
  animation: superPetAura 2.5s ease-in-out infinite;
}

.super-pet-emoji {
  position: relative;
  z-index: 3;
  font-size: 128px;
  line-height: 1;
  filter: drop-shadow(0 19px 15px rgba(0,0,0,0.2));
  animation: superPetBounce 1.9s ease-in-out infinite;
}

.super-pet-shadow {
  position: absolute;
  bottom: 28px;
  width: 128px;
  height: 25px;
  border-radius: 999px;
  background: rgba(0,0,0,0.17);
  filter: blur(4px);
  animation: superShadow 1.9s ease-in-out infinite;
}

.super-pet-heart,
.super-pet-spark {
  position: absolute;
  z-index: 4;
  pointer-events: none;
}

.super-pet-heart {
  color: rgba(255, 105, 135, 0.78);
  font-weight: 1000;
  animation: superHeartPop 2.6s ease-in-out infinite;
}

.super-pet-heart.h1 {
  top: 32px;
  right: 44px;
  font-size: 18px;
}

.super-pet-heart.h2 {
  bottom: 58px;
  left: 54px;
  font-size: 14px;
  animation-delay: 0.7s;
}

.super-pet-spark {
  color: rgba(255,255,255,0.96);
  text-shadow: 0 0 14px rgba(255,255,255,0.95);
  animation: superSparkFloat 2.4s ease-in-out infinite;
}

.super-pet-spark.p1 {
  top: 48px;
  left: 44px;
  font-size: 20px;
}

.super-pet-spark.p2 {
  right: 48px;
  bottom: 54px;
  font-size: 16px;
  animation-delay: 0.6s;
}

.super-pet-copy {
  text-align: center;
}

.super-pet-copy strong {
  display: block;
  font-size: 18px;
  font-weight: 1000;
  color: var(--text, #111827);
  margin-bottom: 4px;
}

.super-pet-copy span {
  font-size: 12px;
  font-weight: 850;
  color: var(--text-secondary, #6b7280);
}

.super-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.super-stat-card {
  position: relative;
  overflow: hidden;
  min-height: 116px;
  border-radius: 25px;
  padding: 15px;
  background: var(--bg-secondary, #fff);
  border: 2px solid var(--border, #e5e7eb);
  box-shadow:
    0 14px 30px rgba(15, 23, 42, 0.07),
    inset 0 -4px 0 rgba(0,0,0,0.035);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.super-stat-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 20px 38px rgba(15, 23, 42, 0.11),
    inset 0 -4px 0 rgba(0,0,0,0.035);
}

.super-stat-card::after {
  content: "";
  position: absolute;
  width: 84px;
  height: 84px;
  right: -26px;
  top: -26px;
  border-radius: 999px;
  opacity: 0.13;
}

.super-stat-card.green::after { background: #22c55e; }
.super-stat-card.orange::after { background: #f59e0b; }
.super-stat-card.blue::after { background: #3b82f6; }
.super-stat-card.purple::after { background: #8b5cf6; }
.super-stat-card.yellow::after { background: #eab308; }
.super-stat-card.pink::after { background: #ec4899; }

.super-stat-icon {
  font-size: 25px;
  margin-bottom: 8px;
}

.super-stat-value {
  font-size: 28px;
  line-height: 1;
  font-weight: 1000;
  color: var(--text, #111827);
  letter-spacing: -0.04em;
}

.super-stat-label {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  color: var(--text-secondary, #6b7280);
}

.super-theme-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 92% 10%, rgba(245,158,11,0.18), transparent 32%),
    var(--muted, #f3f4f6);
  margin-bottom: 14px;
}

.super-wallet-label {
  color: var(--text-secondary, #6b7280);
  margin-bottom: 4px;
}

.super-wallet-value {
  font-size: 29px;
  font-weight: 1000;
  color: var(--accent-dark, #d97706);
  letter-spacing: -0.04em;
}

.super-wallet-sub {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 850;
  color: var(--text-secondary, #6b7280);
}

.super-theme-strip {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 3px;
}

.super-theme-chip {
  flex: 0 0 auto;
  min-width: 126px;
  border: 2px solid var(--border, #e5e7eb);
  background: var(--bg-secondary, #fff);
  color: var(--text, #111827);
  border-radius: 999px;
  padding: 9px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 1000;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.super-theme-chip:hover {
  transform: translateY(-2px);
}

.super-theme-chip.active {
  border-color: var(--primary, #16a34a);
  background: var(--primary-soft, #f0fdf4);
  color: var(--primary-dark, #15803d);
}

.super-theme-chip.locked {
  opacity: 0.72;
}

.super-theme-dot {
  width: 17px;
  height: 17px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,0.85);
  box-shadow: 0 3px 8px rgba(0,0,0,0.14);
}

.super-achievement-list {
  display: grid;
  gap: 10px;
}

.super-achievement {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 21px;
  padding: 13px;
  background: var(--muted, #f3f4f6);
  border: 2px solid transparent;
  opacity: 0.68;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.super-achievement.done {
  opacity: 1;
  background: var(--primary-soft, #f0fdf4);
  border-color: var(--primary-soft-border, #bbf7d0);
}

.super-achievement:hover {
  transform: translateX(4px);
}

.super-achievement-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 18px;
  background: rgba(255,255,255,0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.04);
}

.super-achievement strong {
  display: block;
  font-size: 14px;
  font-weight: 1000;
  color: var(--text, #111827);
}

.super-achievement span {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 850;
  color: var(--text-secondary, #6b7280);
}

.super-edit-layout {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 18px;
  align-items: start;
}

.super-edit-avatar {
  text-align: center;
}

.super-label {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
  font-weight: 1000;
  color: var(--text, #111827);
}

.super-textarea {
  width: 100%;
  min-height: 116px;
  resize: vertical;
  border-radius: 21px;
  border: 2px solid var(--border, #e5e7eb);
  background: var(--bg, #f9fafb);
  color: var(--text, #111827);
  padding: 14px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.super-textarea:focus {
  border-color: var(--primary, #16a34a);
  box-shadow: 0 0 0 4px rgba(34,197,94,0.12);
}

@keyframes superCardIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes superAvatarFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-7px) rotate(1.5deg);
  }
}

@keyframes superAvatarGlow {
  0%, 100% {
    opacity: 0.38;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.08);
  }
}

@keyframes superPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(34,197,94,0.18);
  }
  50% {
    transform: scale(1.09);
    box-shadow: 0 0 0 10px rgba(34,197,94,0.08);
  }
}

@keyframes superOrbFloat {
  0%, 100% {
    transform: translate3d(0,0,0) scale(1);
  }
  50% {
    transform: translate3d(8px,-11px,0) scale(1.05);
  }
}

@keyframes superTwinkle {
  0%, 100% {
    opacity: 0.35;
    transform: scale(0.85) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.25) rotate(18deg);
  }
}

@keyframes superShine {
  0% {
    transform: translateX(-120%);
  }
  55%, 100% {
    transform: translateX(120%);
  }
}

@keyframes superPetBounce {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1, 1);
  }
  30% {
    transform: translateY(-12px) rotate(-3deg) scale(1.04, 0.97);
  }
  55% {
    transform: translateY(-22px) rotate(3deg) scale(0.98, 1.08);
  }
  78% {
    transform: translateY(-6px) rotate(-1deg) scale(1.03, 0.98);
  }
}

@keyframes superPetAura {
  0%, 100% {
    opacity: 0.38;
    transform: scale(0.94);
  }
  50% {
    opacity: 0.72;
    transform: scale(1.09);
  }
}

@keyframes superShadow {
  0%, 100% {
    opacity: 0.24;
    transform: scaleX(1);
  }
  50% {
    opacity: 0.13;
    transform: scaleX(0.78);
  }
}

@keyframes superHeartPop {
  0%, 100% {
    opacity: 0;
    transform: translateY(10px) scale(0.65) rotate(-8deg);
  }
  35% {
    opacity: 1;
    transform: translateY(-4px) scale(1.12) rotate(6deg);
  }
  65% {
    opacity: 0.75;
    transform: translateY(-18px) scale(0.95) rotate(-4deg);
  }
}

@keyframes superSparkFloat {
  0%, 100% {
    opacity: 0.45;
    transform: translateY(0) scale(0.85) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: translateY(-12px) scale(1.25) rotate(18deg);
  }
}

@media (max-width: 760px) {
  .super-main-grid {
    grid-template-columns: 1fr;
  }

  .super-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .super-edit-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .super-profile-hero {
    padding: 18px;
    border-radius: 30px;
  }

  .super-profile-top {
    flex-direction: column;
    text-align: center;
  }

  .super-profile-info {
    width: 100%;
  }

  .super-name {
    font-size: 29px;
  }

  .super-pill-row {
    justify-content: center;
  }

  .super-action-row,
  .super-edit-actions {
    grid-template-columns: 1fr;
  }

  .super-stat-grid {
    grid-template-columns: 1fr;
  }

  .super-theme-top {
    flex-direction: column;
    align-items: stretch;
  }

  .super-theme-top .super-btn {
    width: 100%;
  }

  .super-progress-info {
    flex-direction: column;
    gap: 4px;
  }
}
        /* ── LEADERBOARD ── */
        .leader-row { display: flex; align-items: center; gap: 14px; padding: 16px; margin-bottom: 10px; background: var(--bg-secondary, var(--card, #fff)); border: 2px solid var(--border, #e5e7eb); border-radius: 18px; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; opacity: 0; transform: translateY(16px); cursor: pointer; }
        .leader-row.animated { animation: leaderRowIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .leader-row:hover { transform: translateY(-2px) scale(1.01); box-shadow: 0 18px 30px rgba(15, 23, 42, 0.08); border-color: rgba(22, 163, 74, 0.24); }
        .leader-rank { font-size: 22px; font-weight: 900; min-width: 36px; text-align: center; color: var(--text-secondary, var(--muted, #9ca3af)); }
        .leader-name { flex: 1; font-size: 15px; font-weight: 900; color: var(--text, #111827); }
        .leader-sub { font-size: 12px; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 700; }
        .leader-title { margin-top: 6px; font-size: 12px; font-weight: 900; color: var(--primary, #16a34a); }
        .leader-xp { font-size: 16px; font-weight: 900; color: #f59e0b; }
        .leaderboard-preview { margin-top: 24px; }
        .leaderboard-stack { display: flex; flex-direction: column; gap: 12px; }
        .leaderboard-podium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; gap: 10px; margin-bottom: 28px; }
        .podium-card { position: relative; border-radius: 24px; padding: 18px 14px 16px; text-align: center; overflow: hidden; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .podium-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 28px 48px rgba(0,0,0,0.18); }
        .podium-card.rank-1 { min-height: 280px; background: linear-gradient(160deg, #fef9c3 0%, #fde68a 40%, #fbbf24 70%, #d97706 100%); box-shadow: 0 20px 50px rgba(251,191,36,0.35), 0 0 0 2px rgba(251,191,36,0.4); transform: translateY(-12px); animation: podiumRise1 0.8s cubic-bezier(0.22,1,0.36,1) both; z-index: 2; }
        .podium-card.rank-2 { min-height: 240px; background: linear-gradient(160deg, #f8fafc 0%, #e2e8f0 40%, #cbd5e1 70%, #94a3b8 100%); box-shadow: 0 14px 36px rgba(148,163,184,0.3), 0 0 0 2px rgba(148,163,184,0.3); animation: podiumRise2 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .podium-card.rank-3 { min-height: 220px; background: linear-gradient(160deg, #fed7aa 0%, #fdba74 40%, #fb923c 70%, #c2410c 100%); box-shadow: 0 14px 36px rgba(251,146,60,0.3), 0 0 0 2px rgba(251,146,60,0.3); animation: podiumRise3 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
        .podium-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 60%, transparent 100%); pointer-events: none; border-radius: 24px; }
        .podium-card.rank-1::after { content: ''; position: absolute; inset: -2px; border-radius: 26px; background: transparent; border: 2px solid transparent; animation: goldPulse 2.4s ease-in-out infinite; }
        .podium-crown { font-size: 28px; margin-bottom: 8px; position: relative; z-index: 1; animation: crownBounce 2s ease-in-out infinite; }
        .podium-rank { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 999px; background: rgba(255, 255, 255, 0.78); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .podium-avatar { position: relative; z-index: 1; width: 72px; height: 72px; margin: 0 auto 10px; padding: 3px; border-radius: 999px; background: rgba(255, 255, 255, 0.8); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15); display: flex; align-items: center; justify-content: center; }
        .podium-card.rank-1 .podium-avatar { width: 80px; height: 80px; box-shadow: 0 0 0 3px #fbbf24, 0 8px 24px rgba(251,191,36,0.4); animation: avatarGlow 2s ease-in-out infinite; }
        .podium-name { position: relative; z-index: 1; font-size: 14px; font-weight: 900; margin-bottom: 3px; word-break: break-word; color: #1a1a1a; }
        .podium-title { position: relative; z-index: 1; font-size: 11px; font-weight: 900; opacity: 0.72; margin-bottom: 8px; color: #2d2d2d; }
        .podium-xp { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 7px 12px; background: rgba(255, 255, 255, 0.82); font-size: 13px; font-weight: 900; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); color: #92400e; }
        .podium-card.rank-2 .podium-xp, .podium-card.rank-3 .podium-xp { color: #374151; }
        .podium-meta { position: relative; z-index: 1; font-size: 11px; font-weight: 800; opacity: 0.75; line-height: 1.35; color: #2d2d2d; }
        .heart-btn { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, #fff); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; transition: transform 0.15s, border-color 0.15s, background 0.15s; position: relative; }
        .heart-btn:hover { border-color: #ef4444; background: #fef2f2; transform: scale(1.1); }
        .heart-btn.hearted { border-color: #ef4444; background: #fef2f2; }
        .heart-btn.animating .heart-icon { animation: heartPop 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .heart-count { font-size: 10px; font-weight: 900; position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; border-radius: 99px; padding: 1px 5px; min-width: 16px; text-align: center; border: 2px solid var(--bg-secondary, #fff); }
        .heart-icon { color: var(--text-secondary, #9ca3af); font-size: 15px; transition: transform 0.2s; }

        /* NEW: Like button */
        .like-btn { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, #fff); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; transition: transform 0.15s, border-color 0.15s, background 0.15s; position: relative; }
        .like-btn:hover { border-color: #ef4444; background: #fef2f2; transform: scale(1.1); }
        .like-btn.liked { border-color: #ef4444; background: #fef2f2; }
        .like-btn:active { animation: heartPop 0.4s both; }

        /* NEW: Chat button */
        .chat-btn { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, #fff); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; position: relative; transition: transform 0.15s, border-color 0.15s; }
        .chat-btn:hover { border-color: #3b82f6; transform: scale(1.1); }
        .chat-unread { font-size: 9px; font-weight: 900; position: absolute; top: -5px; right: -5px; background: #3b82f6; color: #fff; border-radius: 99px; padding: 1px 4px; min-width: 15px; text-align: center; border: 2px solid var(--bg-secondary, #fff); }
        .floating-chat-btn { position: fixed; right: 18px; bottom: 92px; width: 58px; height: 58px; border: none; border-radius: 999px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; cursor: pointer; z-index: 320; box-shadow: 0 20px 40px rgba(37,99,235,0.34); transition: transform 0.18s ease, box-shadow 0.18s ease; display: flex; align-items: center; justify-content: center; }
        .floating-chat-btn:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 24px 48px rgba(37,99,235,0.42); }
        .floating-chat-btn.open { background: linear-gradient(135deg, #1d4ed8, #2563eb); }
        .floating-chat-badge { position: absolute; top: -4px; right: -3px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; }
        .floating-chat-btn svg { width: 28px; height: 28px; stroke: currentColor; fill: none; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        .chat-drawer { position: fixed; right: 18px; bottom: 158px; width: min(440px, calc(100vw - 24px)); height: min(620px, calc(100vh - 210px)); background: rgba(255,255,255,0.98); backdrop-filter: blur(18px); border: 1.5px solid rgba(226,232,240,0.98); border-radius: 28px; box-shadow: 0 34px 80px rgba(15,23,42,0.24); z-index: 319; display: flex; flex-direction: column; overflow: hidden; animation: chatDrawerIn 0.26s cubic-bezier(0.22,1,0.36,1) both; }
        .chat-drawer-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1.5px solid var(--border, #e5e7eb); background: linear-gradient(135deg, rgba(37,99,235,0.16), rgba(59,130,246,0.05)); }
        .chat-drawer-head-copy { min-width: 0; flex: 1; }
        .chat-drawer-title { font-size: 18px; font-weight: 900; color: var(--text, #111827); }
        .chat-drawer-sub { font-size: 12px; font-weight: 700; color: var(--text-secondary, #6b7280); margin-top: 3px; line-height: 1.4; }
        .chat-close-btn { width: 38px; height: 38px; border: none; border-radius: 999px; background: rgba(255,255,255,0.76); color: #334155; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 -1px 0 rgba(15,23,42,0.08); }
        .chat-close-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }
        .chat-drawer-body { flex: 1; display: grid; grid-template-columns: 156px 1fr; min-height: 0; }
        .chat-friend-list { border-right: 1.5px solid var(--border, #e5e7eb); padding: 10px; overflow-y: auto; background: linear-gradient(180deg, rgba(248,250,252,0.95), rgba(241,245,249,0.86)); }
        .chat-friend-item { width: 100%; border: none; background: transparent; padding: 10px; border-radius: 18px; text-align: left; display: flex; align-items: center; gap: 10px; cursor: pointer; position: relative; transition: background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease; }
        .chat-friend-item:hover { background: rgba(37,99,235,0.08); transform: translateY(-1px); }
        .chat-friend-item.active { background: rgba(37,99,235,0.12); box-shadow: inset 0 0 0 1px rgba(37,99,235,0.12); }
        .chat-friend-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #dbeafe, #93c5fd); color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; flex-shrink: 0; overflow: hidden; }
        .chat-friend-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; }
        .chat-friend-copy strong { font-size: 13px; font-weight: 900; color: var(--text, #111827); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-friend-copy span { font-size: 11px; font-weight: 700; color: var(--text-secondary, #6b7280); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-friend-unread { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #2563eb; color: #fff; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .chat-thread { min-width: 0; display: flex; flex-direction: column; background: rgba(255,255,255,0.88); }
        .chat-thread-head { padding: 14px 16px; border-bottom: 1.5px solid var(--border, #e5e7eb); background: rgba(255,255,255,0.92); }
        .chat-thread-name { font-size: 15px; font-weight: 900; color: var(--text, #111827); }
        .chat-thread-meta { margin-top: 3px; font-size: 11px; font-weight: 800; color: var(--primary, #16a34a); }
        .chat-thread-messages { flex: 1; overflow-y: auto; padding: 14px; background: linear-gradient(180deg, rgba(248,250,252,0.72), rgba(255,255,255,0.95)); }
        .chat-thread-input { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 12px; border-top: 1.5px solid var(--border, #e5e7eb); background: #fff; align-items: center; }
        .chat-bubble-row { display: flex; justify-content: flex-start; margin-bottom: 10px; }
        .chat-bubble-row.mine { justify-content: flex-end; }
        .chat-bubble { max-width: 78%; border-radius: 18px 18px 18px 6px; padding: 10px 12px; background: #eef2ff; color: #1e293b; font-size: 13px; font-weight: 700; line-height: 1.45; box-shadow: 0 8px 20px rgba(15,23,42,0.06); }
        .chat-bubble.mine { border-radius: 18px 18px 6px 18px; background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; }
        .chat-bubble-time { margin-top: 4px; font-size: 10px; font-weight: 800; opacity: 0.65; text-align: right; }
        .chat-bubble-status { margin-top: 2px; font-size: 10px; font-weight: 800; opacity: 0.78; text-align: right; }
        .chat-thread-input .primary-btn { width: 46px; height: 46px; padding: 0; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .chat-thread-input .primary-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        .chat-empty-thread, .chat-empty-mini { display: flex; align-items: center; justify-content: center; text-align: center; color: var(--text-secondary, #94a3b8); font-size: 12px; font-weight: 700; min-height: 100px; }

        .friend-btn { padding: 7px 12px; border-radius: 99px; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, #fff); color: var(--text-secondary, #6b7280); font-size: 12px; font-weight: 900; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; flex-shrink: 0; white-space: nowrap; }
        .friend-btn:hover { border-color: var(--primary, #16a34a); background: var(--primary-soft, #f0fdf4); color: var(--primary, #16a34a); }
        .friend-btn.sent { border-color: #f59e0b; color: #d97706; background: #fef3c7; cursor: default; }
        .friend-btn.friends { border-color: var(--primary, #16a34a); color: var(--primary, #16a34a); background: var(--primary-soft, #f0fdf4); cursor: default; }
        .friend-panel { background: var(--bg-secondary, #fff); border: 2px solid var(--border, #e5e7eb); border-radius: 20px; padding: 16px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .friend-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .friend-panel-title { font-size: 16px; font-weight: 900; color: var(--text, #111827); }
        .friend-req-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: var(--bg, #f5f5f0); margin-bottom: 8px; }
        .friend-req-actions { display: flex; gap: 8px; margin-left: auto; }
        .notice-toast { position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%); background: #111827; color: #fff; font-size: 14px; font-weight: 900; padding: 12px 24px; border-radius: 100px; z-index: 300; white-space: nowrap; max-width: calc(100vw - 32px); overflow: hidden; text-overflow: ellipsis; animation: toastIn 0.3s cubic-bezier(0.22,1,0.36,1) both; box-shadow: 0 8px 24px rgba(0,0,0,0.24); }
        .leader-list-card { padding: 14px; border-radius: 22px; border: 2px solid var(--border, #e5e7eb); background: var(--bg-secondary, rgba(255,255,255,0.86)); box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06); }
        .leader-self { border-color: rgba(245, 158, 11, 0.36) !important; background: linear-gradient(135deg, rgba(254,243,199,0.6), rgba(255,255,255,0.9)) !important; box-shadow: 0 8px 24px rgba(245,158,11,0.15) !important; }
        .empty { text-align: center; padding: 44px 0; color: var(--text-secondary, var(--muted, #9ca3af)); font-weight: 800; }
        .divider { border: none; border-top: 2px solid var(--border, #f3f4f6); margin: 22px 0; }
        @keyframes chatDrawerIn { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

        @media (max-width: 520px) {
          .theme-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .leaderboard-podium { grid-template-columns: 1fr; }
          .podium-card.rank-1, .podium-card.rank-2, .podium-card.rank-3 { min-height: auto; transform: none !important; animation: podiumRise2 0.6s cubic-bezier(0.22,1,0.36,1) both !important; }
          .chat-drawer { right: 12px; left: 12px; width: auto; bottom: 154px; height: min(68vh, 560px); }
          .chat-drawer-body { grid-template-columns: 1fr; }
          .chat-friend-list { max-height: 150px; border-right: none; border-bottom: 1.5px solid var(--border, #e5e7eb); }
          .floating-chat-btn { right: 14px; bottom: 88px; width: 54px; height: 54px; }
          .hero-actions { flex-direction: column; }
          .xp-badge, .streak-pill { font-size: 12px; padding: 4px 9px; }
          .card-term { font-size: 34px; }
        }
        @media (min-width: 640px) {
          .app-header { padding: 0 32px; }
          .page, .form-page, .flashcard-wrap { padding: 24px; }
        }
      `}</style>

      {/* XP Toast Notifications */}
      <XpToastContainer events={xpEvents} onDismiss={dismissXpEvent} />

      {/* Profile Modal */}
      {profileModalUser && (
        <UserProfileModal
          user={profileModalUser}
          lastActiveAt={getUserLastActive(
            profileModalUser.id,
            profileModalUser.last_active_at
          )}
          myId={authUser.id}
          likes={leaderboardLikes}
          friends={acceptedFriendIds}
          pendingTo={friendRequests
            .filter((r) => r.fromId === authUser.id && r.status === "pending")
            .map((r) => r.toId)}
          chatMessages={chatMessages}
          chatInputValue={chatInput}
          onClose={() => { setProfileModalUser(null); setChatInput(""); }}
          onLike={(userId) => {
            const userName = leaderboard.find((u) => u.id === userId)?.name ?? "";
            toggleLeaderboardLike(userId, userName);
          }}
          onFriendReq={sendFriendRequest}
          onSendChat={sendChatMessage}
          onChatInputChange={setChatInput}
          onStartChat={openChatWithUser}
        />
      )}

      <ChatDrawer
        isOpen={chatDrawerOpen}
        activeUser={activeChatUser}
        friends={friendUsers}
        authUser={authUser}
        chatMessages={chatMessages}
        chatInputValue={chatInput}
        unreadCount={unreadChatCount}
        onClose={() => {
          setChatDrawerOpen(false);
          setChatInput("");
        }}
        onSelectUser={(user) => {
          setActiveChatUserId(user.id);
          setChatReadState((prev) => ({ ...prev, [user.id]: Date.now() }));
        }}
        onInputChange={setChatInput}
        onSendChat={sendChatMessage}
      />

      <div className="app">
        {/* HEADER */}
        <header className="app-header">
          <button type="button" onClick={() => setView("home")} className="app-header-logo">
            <Image
              src="/favicon.svg"
              alt="Words logo"
              width={30}
              height={30}
              priority
              className="app-header-logo-mark"
            />
            Words<span>.</span>
          </button>
          <div className="app-header-right">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setThemePickerOpen((v) => !v)}
              title="Theme солих"
            >
              🎨
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => { setView("leaderboard"); setFriendRequestsOpen(true); }}
              title="Найзын хүсэлтүүд"
            >
              🔔
              {pendingRequestsToMe.length > 0 && (
                <div className="notif-badge">{pendingRequestsToMe.length}</div>
              )}
            </button>
            {streak > 0 && <div className="streak-pill">🔥 {streak}</div>}
            <div className="xp-badge">⭐ {xpTotal} XP</div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setView("profile")}
              title={authUser.name}
              style={{ padding: 0, overflow: "hidden" }}
            >
              <AvatarDisplay size={34} />
            </button>
          </div>
        </header>

        {/* THEME PICKER */}
        {themePickerOpen && (
          <div className="theme-picker-overlay">
            <div className="theme-picker">
              <div className="theme-picker-head">
                <div className="theme-picker-title">Theme сонгох</div>
                <button type="button" className="theme-picker-close" onClick={() => setThemePickerOpen(false)}>✕</button>
              </div>
              <div className="theme-grid">
                {themeKeys.map((key) => (
                  <ThemePreviewCard
                    key={key}
                    themeKey={key}
                    isActive={theme === key}
                    isOwned={canUseTheme(key)}
                    price={THEME_PRICES[key]}
                    onClick={() => handleThemeSelect(key)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="app-body">

          {/* ══ HOME ══ */}
          {view === "home" && (
            <div className="page">
              <div className="hero">
                <div className="hero-eyebrow">Сайн уу, {authUser.name}</div>
                <div className="hero-title">
                  {streak > 0 ? `${streak} өдөр дараалал!` : "Өнөөдөр эхэл!"}
                </div>
                <div className="hero-sub">
                  {streak > 0
                    ? "Өнөөдрийн үгээ давтаад streak-ээ үргэлжлүүлээрэй."
                    : "Өдөр бүр бага багаар давтвал үг амархан тогтоно."}
                </div>
                <div className="title-badge">🏅 Одоогийн цол: {currentTitleLevel.title}</div>
                <div className="title-card">
                  <div className="title-card-head">
                    <div>
                      <div className="title-card-label">Цолны шат</div>
                      <div className="title-card-name">{currentTitleLevel.title}</div>
                    </div>
                    <div className="stat-sub">{xpTotal.toLocaleString()} XP</div>
                  </div>
                  <div className="title-card-sub">
                    {nextTitleLevel
                      ? `Дараагийн цол: ${nextTitleLevel.title} · ${xpToNextTitle.toLocaleString()} XP дутуу`
                      : "Хамгийн дээд цолд хүрсэн байна."}
                  </div>
                  <div className="goal-bar" style={{ marginTop: 12 }}>
                    <div className="goal-fill" style={{ width: `${titleProgressPct}%` }} />
                  </div>
                </div>
                <div className="hero-actions">
                  <button className="white-btn" onClick={() => setView("learn")}>
                    Суралцах үргэлжлүүлэх →
                  </button>
                  <button
                    className="white-btn"
                    onClick={() => { setMode("quiz"); resetQuizSession(); setView("learn"); }}
                    style={{ background: "rgba(255,255,255,0.14)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.28)" }}
                  >
                    Шалгалт өгөх
                  </button>
                </div>
              </div>

              <div className="profile-card" style={{ marginTop: 16, textAlign: "left", padding: 18, background: "linear-gradient(135deg, rgba(22,163,74,0.1), rgba(15,23,42,0.04))" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                  <div>
                    <div className="form-title" style={{ fontSize: 19 }}>Streak Pet</div>
                    <div className="form-sub">{currentRankPet.emoji} {currentRankPet.animalName} · {currentRankPet.title}</div>
                  </div>
                  <button className="secondary-btn" onClick={() => setView("profile")}>Бүх амьтан харах</button>
                </div>
                <StreakRankPetCard
                  lifetimeXp={xpTotal}
                  spendableXp={availableThemeXp}
                  streak={streak}
                  longestStreak={streak}
                  onClick={() => setView("learn")}
                />
              </div>

              <div className="stats-row">
                <div className="stat-tile">
                  <div className="stat-label">Нийт XP</div>
                  <div className="stat-val" style={{ color: "#f59e0b" }}>{xpTotal.toLocaleString()}</div>
                  <div className="stat-sub">XP нийт</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-label">Цээжилсэн</div>
                  <div className="stat-val" style={{ color: "#16a34a" }}>{masteredCount}</div>
                  <div className="stat-sub">/{words.length} үг</div>
                </div>
                <div className="goal-tile">
                  <div className="goal-header">
                    <div className="goal-label">Өдрийн зорилго</div>
                    <div className="goal-pct">{dailyGoalPct}%</div>
                  </div>
                  <div className="goal-bar">
                    <div className="goal-fill" style={{ width: `${dailyGoalPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="sec-head">
                <div className="sec-title">Өнөөдрийн зам</div>
                <button className="sec-link" onClick={() => setView("learn")}>Номын сан харах ↗</button>
              </div>

              <div className="word-list">
                {words.slice(0, 5).map((w) => (
                  <div key={w.id} className="word-card" onClick={() => setView("learn")}>
                    <div className="word-card-icon">📖</div>
                    <div className="word-card-body">
                      <div className="word-card-term">{w.term}</div>
                      <div className="word-card-meaning">{w.meaning}</div>
                    </div>
                    <div className="word-card-mastery">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "var(--border, #e5e7eb)" }} />
                      ))}
                    </div>
                  </div>
                ))}
                {words.length === 0 && (
                  <div className="empty">
                    <div style={{ fontSize: 42, marginBottom: 12 }}>📚</div>
                    <div>Үг байхгүй байна</div>
                    <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => setView("add-word")}>+ Үг нэмэх</button>
                  </div>
                )}
              </div>

              <div className="leaderboard-preview">
                <div className="sec-head">
                  <div className="sec-title">Leaderboard</div>
                  <button className="sec-link" onClick={() => setView("leaderboard")}>Бүгдийг харах ↗</button>
                </div>
                {topLeaders.length > 0 ? (
                  <div className="leaderboard-stack">
                    {topLeaders.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`leader-row animated${entry.id === authUser.id ? " leader-self" : ""}`}
                        style={{ animationDelay: `${index * 0.07}s`, cursor: "pointer" }}
                        onClick={() => setProfileModalUser(entry)}
                      >
                        <div className="leader-rank">#{index + 1}</div>
                        {renderLeaderboardAvatar(entry, 44)}
                        <div className="leader-name">
                          {entry.name}
                          <div className="leader-sub">{entry.mastered_words} mastered · {entry.words_count} word{entry.words_count === 1 ? "" : "s"}</div>
                        </div>
                        <div className="leader-xp">{entry.xp} XP</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty">Leaderboard хоосон байна</div>
                )}
              </div>
            </div>
          )}

          {/* ══ LEARN ══ */}
          {view === "learn" && (
            <div className="flashcard-wrap">
              <div className="cat-chips">
                <button
                  className={`cat-chip${selectedCategory === "all" ? " active" : ""}`}
                  onClick={() => {
                    setSelectedCategory("all");
                    setCardIndex(0);
                    if (mode === "quiz") {
                      resetQuizSession();
                    } else {
                      resetStudyState();
                    }
                  }}
                >
                  Бүгд ({words.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`cat-chip${selectedCategory === c.id ? " active" : ""}`}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setCardIndex(0);
                      if (mode === "quiz") {
                        resetQuizSession();
                      } else {
                        resetStudyState();
                      }
                    }}
                  >
                    <span className="cat-chip-dot" style={{ background: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="mode-tabs">
                {(["flashcard", "quiz", "check"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    className={`mode-tab${mode === m ? " active" : ""}`}
                    onClick={() => {
                      setMode(m);
                      if (m === "quiz") {
                        resetQuizSession();
                      } else {
                        resetStudyState();
                      }
                    }}
                  >
                    {m === "flashcard" ? "Флаш карт" : m === "quiz" ? "Quiz" : "Self-check"}
                  </button>
                ))}
              </div>

              {mode === "quiz" && (
                <div className="quiz-banner">
                  <span>{quizWordIds ? `Дахин шалгалт ${studyWords.length} буруу үгээр.` : `Шалгалт бүх ${studyWords.length} үгээр.`}</span>
                  <span>{quizCompleted ? `Дууслаа • ${quizScore}/100` : `${Math.min(cardIndex + 1, Math.max(studyWords.length, 1))}/${studyWords.length}`}</span>
                </div>
              )}

              {mode === "quiz" && quizCompleted ? (
                <div className="big-flashcard" style={{ cursor: "default" }}>
                  <div className="new-word-tag">RESULT</div>
                  <div className="card-term">{quizScore}/100</div>
                  <div className="card-meaning">Та {studyWords.length} үгээс {quizCorrectCount}-ийг зөв хийлээ.</div>
                  <div className="card-example">
                    {quizScore >= 90 ? "Маш сайн байна." : quizScore >= 70 ? "Сайн байна, жаахан давтаад бүр илүү болно." : "Дахиад нэг давтаад үзээрэй."}
                  </div>
                  <div className="action-btns" style={{ width: "100%", marginTop: 20 }}>
                    <button className="primary-btn" onClick={() => { resetQuizSession(); setTimeout(() => inputRef.current?.focus(), 100); }}>Дахин шалгалт өгөх</button>
                    {quizWrongWordIds.length > 0 && (
                      <button className="secondary-btn" onClick={() => { resetQuizSession(quizWrongWordIds); setTimeout(() => inputRef.current?.focus(), 100); }}>Буруу үгсээ дахин шалгах</button>
                    )}
                    <button className="secondary-btn" onClick={() => { setMode("flashcard"); resetStudyState(); }}>Давталт руу буцах</button>
                  </div>
                </div>
              ) : currentWord ? (
                <>
                  <div className="big-flashcard" onClick={() => mode === "flashcard" && setRevealed((r) => !r)}>
                    <div className="new-word-tag">WORD</div>
                    {currentWord.category_name && <div className="card-phonetic">{currentWord.category_name}</div>}
                    <div className="card-term">{currentWord.term}</div>

                    {mode === "flashcard" && (
                      revealed ? (
                        <>
                          <div className="card-meaning">{currentWord.meaning}</div>
                          {currentWord.example && <div className="card-example">&quot;{currentWord.example}&quot;</div>}
                        </>
                      ) : (
                        <div className="card-reveal-hint">Дарж орчуулгыг харах</div>
                      )
                    )}

                    {mode === "quiz" && (
                      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
                        <input
                          ref={inputRef}
                          className={`quiz-input${quizResult === "correct" ? " correct" : quizResult === "wrong" ? " wrong" : ""}`}
                          value={quizAnswer}
                          onChange={(e) => setQuizAnswer(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !quizResult) checkQuiz(); }}
                          placeholder="Монгол утгыг бич..."
                          disabled={!!quizResult}
                        />
                        {!quizResult && (
                          <button className="primary-btn" style={{ width: "100%", marginTop: 10 }} onClick={checkQuiz}>Шалгах</button>
                        )}
                        {quizResult && (
                          <>
                            <div className={`result-bar ${quizResult}`}>
                              {quizResult === "correct" ? "✓ Зөв! +20 XP" : `✗ Зөв хариулт: ${currentWord.meaning}`}
                            </div>
                            <button className="primary-btn" style={{ width: "100%", marginTop: 10 }} onClick={nextCard}>
                              {cardIndex >= studyWords.length - 1 ? "Үр дүн харах" : "Дараагийн асуулт"}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {mode === "check" && !revealed && (
                      <button className="white-btn" style={{ marginTop: 16 }} onClick={(e) => { e.stopPropagation(); setRevealed(true); }}>Орчуулга харах</button>
                    )}
                    {mode === "check" && revealed && <div className="card-meaning">{currentWord.meaning}</div>}
                  </div>

                  <div className="card-nav">
                    <button className="nav-arrow" onClick={prevCard} disabled={mode === "quiz"}>‹</button>
                    <div className="card-counter">{activeCardIndex + 1} / {studyWords.length}</div>
                    <button className="nav-arrow" onClick={nextCard} disabled={mode === "quiz" && !quizResult}>›</button>
                  </div>

                  {mode === "check" && revealed && (
                    <div className="action-btns">
                      <button className="primary-btn" onClick={() => { void updateMastery(currentWord, 1); nextCard(); }}>✓ Мэдэж байна</button>
                      <button className="secondary-btn" onClick={() => { void updateMastery(currentWord, -1); nextCard(); }}>✗ Дахин давтана</button>
                    </div>
                  )}

                  {(mode === "flashcard" || (mode === "quiz" && quizResult)) && (
                    <button className="primary-btn" style={{ width: "100%", marginTop: 10 }} onClick={nextCard}>Дараагийн үг →</button>
                  )}

                  <hr className="divider" />
                  <div className="sec-head"><div className="sec-title">Бүх үгс</div></div>
                  <div className="word-list">
                    {filteredWords.map((w) => (
                      <div key={w.id} className="word-card">
                        <div className="word-card-icon">📝</div>
                        <div className="word-card-body">
                          <div className="word-card-term">{w.term}</div>
                          <div className="word-card-meaning">{w.meaning}</div>
                        </div>
                        <div className="word-card-mastery">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "var(--border, #e5e7eb)" }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty">
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                  <div>Энэ ангилалд үг байхгүй</div>
                  <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => setView("add-word")}>+ Үг нэмэх</button>
                </div>
              )}
            </div>
          )}

          {/* ══ ADD WORD ══ */}
          {view === "add-word" && (
            <div className="form-page">
              <div className="form-title">Үг нэмэх</div>
              <div className="form-sub">Нэмсэн үг бүх хэрэглэгчид харагдана</div>

              <form onSubmit={addWord} ref={addWordFormRef}>
                <div className="form-group">
                  <label className="form-label">Үг / Term</label>
                  <input name="term" className="form-input" placeholder="serendipity, ephemeral..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Утга / Meaning</label>
                  <textarea name="meaning" className="form-input" placeholder="Монгол утга эсвэл тайлбар..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Жишээ өгүүлбэр</label>
                  <input name="example" className="form-input" placeholder="It was serendipity that we met..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Ангиллын төрөл</label>
                  <div className="dropdown-shell" ref={addWordModeMenuRef}>
                    <button
                      type="button"
                      className={`dropdown-trigger${addWordModeMenuOpen ? " open" : ""}`}
                      onClick={() => setAddWordModeMenuOpen((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={addWordModeMenuOpen}
                    >
                      <div className="dropdown-copy">
                        <strong>{addWordCategoryMode === "new" ? "Шинэ ангилал үүсгэх" : "Байгаа ангилалд нэмэх"}</strong>
                        <span>{addWordCategoryMode === "new" ? "Үгтэй хамт шинэ ангилал автоматаар үүснэ" : "Нийтлэх ангиллаа жагсаалтаас сонгоно"}</span>
                      </div>
                      <div className="dropdown-caret">⌄</div>
                    </button>
                    {addWordModeMenuOpen && (
                      <div className="dropdown-menu" role="listbox">
                        <button type="button" className={`dropdown-option${addWordCategoryMode === "existing" ? " active" : ""}`} onClick={() => { setAddWordCategoryMode("existing"); setAddWordModeMenuOpen(false); }} role="option" aria-selected={addWordCategoryMode === "existing"}>
                          <strong>Байгаа ангилал</strong>
                          <span>Одоогийн ангиллуудаас нэгийг сонгоно</span>
                        </button>
                        <button type="button" className={`dropdown-option${addWordCategoryMode === "new" ? " active" : ""}`} onClick={() => { setAddWordCategoryMode("new"); setAddWordCategoryId(""); setAddWordCategoryMenuOpen(false); setAddWordModeMenuOpen(false); }} role="option" aria-selected={addWordCategoryMode === "new"}>
                          <strong>Шинэ ангилал</strong>
                          <span>Үг оруулахдаа шинэ ангилал давхар үүсгэнэ</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {addWordCategoryMode === "existing" ? (
                  <div className="form-group">
                    <label className="form-label">Ангилал</label>
                    <div className="dropdown-shell" ref={addWordCategoryMenuRef}>
                      <button
                        type="button"
                        className={`dropdown-trigger${addWordCategoryMenuOpen ? " open" : ""}`}
                        onClick={() => setAddWordCategoryMenuOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={addWordCategoryMenuOpen}
                      >
                        <div className="dropdown-copy">
                          <strong>{selectedAddWordCategory?.name ?? "Ангилал сонгох"}</strong>
                          <span>{selectedAddWordCategory ? "Энэ ангилалд нийтлэгдэнэ" : "Нийтлэх ангиллаа сонгоно уу"}</span>
                        </div>
                        <div className="dropdown-caret">⌄</div>
                      </button>
                      {addWordCategoryMenuOpen && (
                        <div className="dropdown-menu" role="listbox">
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <button key={category.id} type="button" className={`dropdown-option${addWordCategoryId === category.id ? " active" : ""}`} onClick={() => { setAddWordCategoryId(category.id); setAddWordCategoryMenuOpen(false); }} role="option" aria-selected={addWordCategoryId === category.id}>
                                <strong>{category.name}</strong>
                                <span>Нийтийн үгийн санд нийтлэгдэнэ</span>
                              </button>
                            ))
                          ) : (
                            <button type="button" className="dropdown-option" disabled>
                              <strong>Ангилал алга</strong>
                              <span>Шинэ ангилал үүсгэх төрлийг сонгоно уу</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="input-helper">Одоо байгаа ангиллаас нэгийг сонгоод үгээ нийтэд нэмнэ.</div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Шинэ ангиллын нэр</label>
                    <input
                      value={newWordCategoryName}
                      onChange={(e) => setNewWordCategoryName(e.target.value)}
                      className="form-input"
                      placeholder="IELTS, Travel, Business..."
                      required
                    />
                    <div className="input-helper">Үгээ нэмэх үед энэ нэрээр шинэ ангилал автоматаар үүснэ.</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Нэмсэн хүн</label>
                  <input name="authorName" className="form-input" placeholder="Нэрээ бичнэ үү" defaultValue={authUser?.name ?? ""} />
                  <div className="input-helper">Нэвтэрсэн бол таны бүртгэлийн нэр автоматаар ашиглагдана.</div>
                </div>

                <button type="submit" className="primary-btn" style={{ width: "100%" }} disabled={busy === "word"}>
                  {busy === "word" ? "Нэмж байна..." : "Нийтэд нэмэх"}
                </button>
              </form>

              <hr className="divider" />
              <div className="form-title" style={{ fontSize: 19 }}>Анги нэмэх</div>
              <form onSubmit={addCategory} style={{ display: "flex", gap: 10 }}>
                <input name="name" className="form-input" placeholder="Business, IELTS, Travel..." required style={{ flex: 1 }} />
                <button type="submit" className="primary-btn" disabled={busy === "category"} style={{ whiteSpace: "nowrap" }}>
                  {busy === "category" ? "..." : "+ Нэмэх"}
                </button>
              </form>
            </div>
          )}

          {/* ══ CATEGORIES ══ */}
          {view === "categories" && (
            <div className="page">
              <div className="form-title">Ангиллууд</div>
              <div className="form-sub">Үгсээ ангиллаар нь давт</div>
              <div className="cat-grid">
                <div className="cat-tile" onClick={() => { setSelectedCategory("all"); setView("learn"); }}>
                  <div className="cat-tile-dot" style={{ background: "var(--primary, #16a34a)" }} />
                  <div className="cat-tile-name">Бүгд</div>
                  <div className="cat-tile-count">{words.length} үг</div>
                </div>
                {categories.map((c) => (
                  <div key={c.id} className="cat-tile" onClick={() => { setSelectedCategory(c.id); setView("learn"); }}>
                    <div className="cat-tile-dot" style={{ background: c.color }} />
                    <div className="cat-tile-name">{c.name}</div>
                    <div className="cat-tile-count">{words.filter((w) => w.category_id === c.id).length} үг</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CHALLENGES ══ */}
          {view === "challenges" && (
            <div className="form-page">
              <div className="form-title">Сорилт</div>
              <div className="form-sub">Найзтайгаа өрсөлдөж үгийн сангаа ахиул</div>

              {challenges.length > 0 && (
                <>
                  <div className="sec-head"><div className="sec-title">Идэвхтэй сорилтууд</div></div>
                  {challenges.map((ch) => (
                    <div key={ch.id} className="challenge-card">
                      {ch.category_name && <div className="stat-label">{ch.category_name}</div>}
                      <div className="challenge-title">{ch.title}</div>
                      <div className="challenge-host">Зохион байгуулагч: {ch.host_name}</div>
                      <div className="challenge-meta">
                        <div className="challenge-meta-pill">Хугацаа: {formatDuration(ch.duration_days ?? 7)}</div>
                        {ch.expires_at && <div className="challenge-meta-pill">Дуусах: {formatExpiry(ch.expires_at)}</div>}
                      </div>
                      <div className="stat-label">Invite Code</div>
                      <div className="invite-code-row">
                        <div className="invite-code-text">{ch.invite_code}</div>
                        <button className="primary-btn" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => copyInviteLink(ch.invite_code)}>
                          {copiedCode === ch.invite_code ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="share-actions">
                        <button className="primary-btn" style={{ padding: "10px 12px", fontSize: 12 }} onClick={() => shareInviteLink(ch)}>
                          {sharedCode === ch.invite_code ? "✓ Shared" : "Share"}
                        </button>
                        <button className="primary-btn" style={{ padding: "10px 12px", fontSize: 12 }} onClick={() => copyInviteLink(ch.invite_code)}>
                          {copiedCode === ch.invite_code ? "✓ Copied" : "Link copy"}
                        </button>
                      </div>
                      {ch.members.length > 0 && (
                        <div className="member-row">
                          {ch.members.map((m) => <span key={m} className="member-pill">{m}</span>)}
                        </div>
                      )}
                      <div className="challenge-actions">
                        <button className="warning-btn" style={{ width: "100%" }} onClick={() => sendReminder(ch.invite_code)}>📢 Сануулга илгээх</button>
                        {isChallengeOwner(ch) && (
                          <button className="primary-btn" style={{ width: "100%", background: "#ef4444", boxShadow: "0 6px 16px rgba(239,68,68,0.24)" }} onClick={() => deleteChallenge(ch)}>
                            Сорилт устгах
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <hr className="divider" />
                </>
              )}

              <div className="form-title" style={{ fontSize: 19 }}>Шинэ сорилт үүсгэх</div>

              {recentChallenge && (
                <div className="challenge-card success-card">
                  <div className="stat-label">Шинээр үүсгэсэн сорилт</div>
                  <div className="challenge-title">{recentChallenge.title}</div>
                  <div className="challenge-meta">
                    <div className="challenge-meta-pill">Хугацаа: {formatDuration(recentChallenge.duration_days ?? 7)}</div>
                    {recentChallenge.expires_at && <div className="challenge-meta-pill">Дуусах: {formatExpiry(recentChallenge.expires_at)}</div>}
                  </div>
                  <div className="stat-label">Invite Code</div>
                  <div className="invite-code-row">
                    <div className="invite-code-text">{recentChallenge.invite_code}</div>
                    <button type="button" className="primary-btn" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => copyInviteLink(recentChallenge.invite_code)}>
                      {copiedCode === recentChallenge.invite_code ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="share-link-box">
                    <div className="share-link-label">Share Link</div>
                    <div className="share-link-value">{getInviteLink(recentChallenge.invite_code)}</div>
                  </div>
                  <div className="share-actions">
                    <button type="button" className="primary-btn" onClick={() => shareInviteLink(recentChallenge)}>
                      {sharedCode === recentChallenge.invite_code ? "✓ Shared" : "Share"}
                    </button>
                    <button type="button" className="primary-btn" onClick={() => copyInviteLink(recentChallenge.invite_code)}>
                      {copiedCode === recentChallenge.invite_code ? "✓ Copied" : "Link copy"}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={createChallenge}>
                <div className="form-group">
                  <input name="title" className="form-input" placeholder="7 хоногийн challenge" required />
                </div>
                <div className="form-group">
                  <select name="categoryId" className="form-input" defaultValue="">
                    <option value="">Бүх үг</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Хугацаа</label>
                  <div className="dropdown-shell" ref={durationMenuRef}>
                    <input type="hidden" name="durationDays" value={challengeDuration} />
                    <button
                      type="button"
                      className={`dropdown-trigger${durationMenuOpen ? " open" : ""}`}
                      onClick={() => setDurationMenuOpen((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={durationMenuOpen}
                    >
                      <div className="dropdown-copy">
                        <strong>{formatDuration(challengeDuration)}</strong>
                        <span>Сорилтын үргэлжлэх хугацаа</span>
                      </div>
                      <div className="dropdown-caret">⌄</div>
                    </button>
                    {durationMenuOpen && (
                      <div className="dropdown-menu" role="listbox">
                        {[
                          { value: 1, label: "1 өдөр", hint: "Өнөөдрийн хурдан сорилт" },
                          { value: 3, label: "3 өдөр", hint: "Богино sprint" },
                          { value: 7, label: "7 хоног", hint: "Стандарт сорилт" },
                          { value: 14, label: "14 хоног", hint: "Тогтмол ахиц" },
                          { value: 30, label: "30 хоног", hint: "Урт хугацааны challenge" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`dropdown-option${challengeDuration === option.value ? " active" : ""}`}
                            onClick={() => { setChallengeDuration(option.value); setDurationMenuOpen(false); }}
                            role="option"
                            aria-selected={challengeDuration === option.value}
                          >
                            <strong>{option.label}</strong>
                            <span>{option.hint}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <input name="remindMessage" className="form-input" placeholder="Сануулга: Үгээ цээжлээрэй!" />
                </div>
                <button type="submit" className="primary-btn" style={{ width: "100%" }} disabled={busy === "challenge"}>
                  {busy === "challenge" ? "Үүсгэж байна..." : "Сорилт үүсгэх"}
                </button>
              </form>

              <hr className="divider" />
              <div className="form-title" style={{ fontSize: 19 }}>Сорилтонд нэгдэх</div>
              <form onSubmit={joinChallenge}>
                <div className="form-group">
                  <input name="code" className="form-input" placeholder="Invite code" required />
                </div>
                <div className="form-group">
                  <input name="displayName" className="form-input" placeholder={authUser.name} defaultValue={authUser.name} onChange={(e) => setMemberName(e.target.value)} />
                </div>
                <button type="submit" className="primary-btn" style={{ width: "100%", marginBottom: 10 }}>Нэгдэх</button>
                <button type="button" className="secondary-btn" style={{ width: "100%" }} onClick={subscribeToPush}>🔔 Notification асаах</button>
              </form>
            </div>
          )}

          {/* ══ SHOP ══ */}
          {view === "shop" && (
            <div className="page">
              <div className="form-title">Theme Shop</div>
              <div className="form-sub">Green theme үнэгүй. Бусад theme-үүдийг XP-ээр авч нээнэ.</div>
              <div className="stats-row">
                <div className="stat-tile">
                  <div className="stat-label">Зарцуулах XP</div>
                  <div className="stat-val" style={{ color: "var(--accent, #f59e0b)" }}>{availableThemeXp.toLocaleString()}</div>
                  <div className="stat-sub">shop-д ашиглах үлдэгдэл</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-label">Зарцуулсан XP</div>
                  <div className="stat-val" style={{ color: "var(--primary, #16a34a)" }}>{spentThemeXp.toLocaleString()}</div>
                  <div className="stat-sub">theme unlock-д</div>
                </div>
              </div>
              <div className="shop-grid">
                {themeKeys.map((key) => {
                  const owned = canUseTheme(key);
                  const price = THEME_PRICES[key];
                  const isActive = theme === key;
                  return (
                    <div key={key} className="shop-card">
                      <div className="shop-card-head">
                        <div>
                          <div className="shop-card-name">{themes[key].name}</div>
                          <div className="stat-sub">{owned ? "Нээгдсэн theme" : price === 0 ? "Үнэгүй default theme" : `${price.toLocaleString()} XP шаардлагатай`}</div>
                        </div>
                        <div className="shop-card-price">{price === 0 ? "Free" : `${price.toLocaleString()} XP`}</div>
                      </div>
                      <ThemePreviewCard themeKey={key} isActive={isActive} isOwned={owned} price={price} onClick={() => { if (owned) setTheme(key); }} />
                      <div className="shop-card-actions">
                        <button type="button" className={owned ? "secondary-btn" : "primary-btn"} onClick={() => handleBuyTheme(key)}>
                          {owned ? "Идэвхжүүлэх" : "Худалдаж авах"}
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => { if (owned) { setTheme(key); setNotice(`${themes[key].name} theme сонгогдлоо`); } else { setNotice("Эхлээд энэ theme-г худалдаж авна уу"); } }}>
                          {isActive ? "Ашиглаж байна" : "Сонгох"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ LEADERBOARD ══ */}
          {view === "leaderboard" && (
            <div className="page">
              <div className="form-title">Leaderboard</div>
              <div className="form-sub">Нэр дарж профайл харах • чатлах • найз болох • лайк дарах</div>

              {/* Friend requests panel */}
              {(pendingRequestsToMe.length > 0 || friendRequestsOpen) && (
                <div className="friend-panel">
                  <div className="friend-panel-head">
                    <div className="friend-panel-title">
                      🤝 Найзын хүсэлтүүд
                      {pendingRequestsToMe.length > 0 && (
                        <span style={{ marginLeft: 8, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 99 }}>
                          {pendingRequestsToMe.length}
                        </span>
                      )}
                    </div>
                    <button className="icon-btn" style={{ width: 28, height: 28, fontSize: 12 }} onClick={() => setFriendRequestsOpen(false)}>✕</button>
                  </div>

                  {pendingRequestsToMe.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-secondary, #9ca3af)", fontWeight: 700, padding: "8px 0" }}>Одоогоор ирсэн хүсэлт байхгүй байна</div>
                  ) : (
                    pendingRequestsToMe.map((req) => (
                      <div key={req.id} className="friend-req-item">
                        {req.fromAvatar ? (
                          <img src={req.fromAvatar} alt={req.fromName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-soft, #f0fdf4)", color: "var(--primary, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>
                            {req.fromName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{req.fromName} найз болмоор байна</div>
                        <div className="friend-req-actions">
                          <button className="primary-btn" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => acceptFriendRequest(req.id)}>✓ Зөвшөөрөх</button>
                          <button className="secondary-btn" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => rejectFriendRequest(req.id)}>✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Hearts received */}
              {heartsToMe.length > 0 && (
                <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 16, background: "#fef2f2", border: "2px solid #fecaca", fontSize: 13, fontWeight: 800, color: "#991b1b" }}>
                  ❤️ {heartsToMe.length} хүн зүрх илгээсэн байна
                </div>
              )}

              {/* My rank */}
              {myRank > 0 && (
                <>
                  <div className="sec-head"><div className="sec-title">Таны байр</div></div>
                  {leaderboard.filter((entry) => entry.id === authUser.id).map((entry) => (
                    <div
                      key={entry.id}
                      className={`leader-row leader-self${leaderboardAnimated ? " animated" : ""}`}
                      onClick={() => setProfileModalUser(entry)}
                    >
                      <div className="leader-rank">#{myRank}</div>
                      <AvatarDisplay size={44} />
                      <div className="leader-name">
                        {entry.name}
                        <div className="leader-title">{getTitleLevel(entry.xp).title}</div>
                        <div className="leader-sub">
                          {entry.mastered_words} mastered · {entry.words_count} word{entry.words_count === 1 ? "" : "s"} · {formatLastActive(getUserLastActive(entry.id, entry.last_active_at))}
                        </div>
                      </div>
                      <div className="leader-xp">{entry.xp} XP</div>
                    </div>
                  ))}
                  <hr className="divider" />
                </>
              )}

              <div className="sec-head">
                <div className="sec-title">Бүх хэрэглэгчид</div>
                <div className="stat-sub">{leaderboard.length} хэрэглэгч</div>
              </div>

              {leaderboard.length > 0 ? (
                <>
                  {/* Podium */}
                  {podiumLeaders.length > 0 && (
                    <div className="leaderboard-podium">
                      {[1, 0, 2]
                        .map((positionIndex) => podiumLeaders[positionIndex] ?? null)
                        .filter((entry): entry is LeaderboardUser => entry !== null)
                        .map((entry) => {
                          const rank = leaderboard.findIndex((item) => item.id === entry.id) + 1;
                          return (
                            <div
                              key={entry.id}
                              className={`podium-card rank-${rank}${entry.id === authUser.id ? " leader-self" : ""}`}
                              onClick={() => setProfileModalUser(entry)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="podium-rank">#{rank}</div>
                              <div className="podium-crown">
                                {rank === 1 ? "👑" : rank === 2 ? "🥈" : "🥉"}
                              </div>
                              <div className="podium-avatar">
                                {renderLeaderboardAvatar(entry, rank === 1 ? 64 : 56)}
                              </div>
                              <div className="podium-name">{entry.name}</div>
                              <div className="podium-title">{getTitleLevel(entry.xp).title}</div>
                              <div className="podium-xp">⭐ {entry.xp.toLocaleString()} XP</div>
                              <div className="podium-meta">
                                {entry.mastered_words} mastered · {entry.words_count} word{entry.words_count === 1 ? "" : "s"} · {formatLastActive(getUserLastActive(entry.id, entry.last_active_at))}
                              </div>

                              {entry.id !== authUser.id && (
                                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, position: "relative", zIndex: 1 }}>
                                  {/* Like button on podium */}
                                  <button
                                    type="button"
                                    className={`like-btn${leaderboardLikes[entry.id] ? " liked" : ""}`}
                                    onClick={(e) => { e.stopPropagation(); toggleLeaderboardLike(entry.id, entry.name); }}
                                    title="Лайк дарах"
                                    style={{ background: "rgba(255,255,255,0.8)", border: "none" }}
                                  >
                                    {leaderboardLikes[entry.id] ? "❤️" : "🤍"}
                                  </button>
                                  {/* Heart button on podium */}
                                  <button
                                    type="button"
                                    className={`heart-btn${hasGivenHeart(entry.id) ? " hearted" : ""}${heartAnimatingIds.has(entry.id) ? " animating" : ""}`}
                                    onClick={(e) => { e.stopPropagation(); toggleHeart(entry); }}
                                    title="Зүрх илгээх"
                                    style={{ background: "rgba(255,255,255,0.8)", border: "none" }}
                                  >
                                    <span className="heart-icon">{hasGivenHeart(entry.id) ? "💚" : "🫧"}</span>
                                    {heartCountFor(entry.id) > 0 && <span className="heart-count">{heartCountFor(entry.id)}</span>}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Rest of leaderboard */}
                  {leaderboardRest.length > 0 && (
                    <div className="leader-list-card">
                      <div className="leaderboard-stack">
                        {leaderboardRest.map((entry, index) => {
                          const liked = leaderboardLikes[entry.id] ?? false;
                          const unread = unreadChatCount(entry.id);
                          return (
                            <div
                              key={entry.id}
                              className={`leader-row${entry.id === authUser.id ? " leader-self" : ""}${leaderboardAnimated ? " animated" : ""}`}
                              style={{ animationDelay: `${(index + 3) * 0.06}s`, cursor: "pointer" }}
                              onClick={() => setProfileModalUser(entry)}
                            >
                              <div className="leader-rank">#{index + 4}</div>
                              {renderLeaderboardAvatar(entry, 44)}
                              <div className="leader-name">
                                {entry.name}
                                <div className="leader-title">{getTitleLevel(entry.xp).title}</div>
                                <div className="leader-sub">
                                  {entry.mastered_words} mastered · {entry.words_count} word{entry.words_count === 1 ? "" : "s"} · {formatLastActive(getUserLastActive(entry.id, entry.last_active_at))}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                                <div className="leader-xp">{entry.xp} XP</div>

                                {entry.id !== authUser.id && (
                                  <>
                                    {/* Chat button */}
                                    <button
                                      type="button"
                                      className="chat-btn"
                                      onClick={() => openChatWithUser(entry)}
                                      title="Чатлах"
                                    >
                                      💬
                                      {unread > 0 && (
                                        <span className="chat-unread">{unread}</span>
                                      )}
                                    </button>

                                    {/* Like button */}
                                    <button
                                      type="button"
                                      className={`like-btn${liked ? " liked" : ""}`}
                                      onClick={() => toggleLeaderboardLike(entry.id, entry.name)}
                                      title="Лайк дарах"
                                    >
                                      {liked ? "❤️" : "🤍"}
                                    </button>

                                    {/* Heart button */}
                                    <button
                                      type="button"
                                      className={`heart-btn${hasGivenHeart(entry.id) ? " hearted" : ""}${heartAnimatingIds.has(entry.id) ? " animating" : ""}`}
                                      onClick={() => toggleHeart(entry)}
                                      title="Зүрх илгээх"
                                    >
                                      <span className="heart-icon">{hasGivenHeart(entry.id) ? "💚" : "🫧"}</span>
                                      {heartCountFor(entry.id) > 0 && <span className="heart-count">{heartCountFor(entry.id)}</span>}
                                    </button>

                                    {/* Friend button */}
                                    <button
                                      type="button"
                                      className={`friend-btn${areFriends(entry.id) ? " friends" : hasSentRequest(entry.id) ? " sent" : ""}`}
                                      onClick={() => {
                                        if (!areFriends(entry.id) && !hasSentRequest(entry.id)) {
                                          sendFriendRequest(entry);
                                        }
                                      }}
                                      disabled={areFriends(entry.id) || hasSentRequest(entry.id)}
                                    >
                                      {areFriends(entry.id) ? "✓ Найз" : hasSentRequest(entry.id) ? "Илгээсэн" : "+ Найз"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty">Одоогоор бүртгэлтэй хэрэглэгч алга байна</div>
              )}
            </div>
          )}

{/* ══ PROFILE ══ */}
{view === "profile" && (
  <div className="page pro-profile-page">
    <section className="pro-profile-hero">
      <div className="pro-profile-avatar">
        <AvatarDisplay size={104} />
      </div>

      <div className="pro-profile-info">
        <div className="pro-profile-label">PROFILE</div>
        <h1 className="pro-profile-name">{authUser.name}</h1>

        {authUser.email && (
          <div className="pro-profile-email">{authUser.email}</div>
        )}

        <div className="pro-profile-title">
          <span>🏅</span>
          {currentTitleLevel.title}
        </div>
      </div>
    </section>

    <section className="pro-card">
      <div className="pro-section-head">
        <div>
          <div className="pro-section-label">BIO</div>
          <h2>Танилцуулга</h2>
        </div>
        <div className="pro-section-icon">💬</div>
      </div>

      <p className="pro-bio-text">
        {authUser.bio || "Bio нэмээгүй байна."}
      </p>

      <div className="pro-action-grid">
        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setEditBio(authUser.bio ?? "");
            setEditAvatar(authUser.avatar ?? null);
            setProfileEditMode((v) => !v);
          }}
        >
          {profileEditMode ? "Засвараа хаах" : "Профайл засах"}
        </button>

        <button className="danger-btn" type="button" onClick={handleLogout}>
          Гарах
        </button>
      </div>
    </section>

    {profileEditMode && (
      <section className="pro-card">
        <div className="pro-section-head">
          <div>
            <div className="pro-section-label">EDIT</div>
            <h2>Профайл засах</h2>
          </div>
          <div className="pro-section-icon">✏️</div>
        </div>

        <div className="pro-edit-avatar">
          <AvatarDisplay size={96} editable />

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            className="secondary-btn"
            onClick={() => avatarInputRef.current?.click()}
          >
            Зураг сонгох
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            className="form-input"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            placeholder="Өөрийн тухай товч бичээрэй."
          />
        </div>

        <div className="pro-action-grid">
          <button
            className="primary-btn"
            type="button"
            onClick={() => handleProfileSave(editBio, editAvatar)}
          >
            Хадгалах
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => {
              setEditBio(authUser.bio ?? "");
              setEditAvatar(authUser.avatar ?? null);
              setProfileEditMode(false);
            }}
          >
            Болих
          </button>
        </div>
      </section>
    )}

    <section className="pro-card">
      <div className="pro-section-head">
        <div>
          <div className="pro-section-label">LEVEL</div>
          <h2>Цолны ахиц</h2>
        </div>
        <div className="pro-section-icon">🏆</div>
      </div>

      <div className="pro-level-row">
        <div>
          <div className="pro-muted">Одоогийн цол</div>
          <div className="pro-level-title">{currentTitleLevel.title}</div>
        </div>

        <div className="pro-xp-pill">
          ⭐ {xpTotal.toLocaleString()} XP
        </div>
      </div>

      <div className="pro-progress">
        <div
          className="pro-progress-fill"
          style={{ width: `${titleProgressPct}%` }}
        />
      </div>

      <div className="pro-progress-text">
        {nextTitleLevel
          ? `${nextTitleLevel.title} авахад ${xpToNextTitle.toLocaleString()} XP хэрэгтэй`
          : "Та бүх цолыг нээсэн байна."}
      </div>
    </section>

    <section className="pro-stats-grid">
      <div className="pro-stat-card">
        <span>✅</span>
        <strong>{masteredCount}</strong>
        <p>Цээжилсэн</p>
      </div>

      <div className="pro-stat-card">
        <span>📖</span>
        <strong>{learningCount}</strong>
        <p>Суралцаж буй</p>
      </div>

      <div className="pro-stat-card">
        <span>🧠</span>
        <strong>{words.length}</strong>
        <p>Нийт үг</p>
      </div>

      <div className="pro-stat-card">
        <span>🔥</span>
        <strong>{streak}</strong>
        <p>Streak</p>
      </div>

      <div className="pro-stat-card">
        <span>🏅</span>
        <strong>{myRank > 0 ? `#${myRank}` : "-"}</strong>
        <p>Rank</p>
      </div>

      <div className="pro-stat-card">
        <span>⭐</span>
        <strong>{xpTotal.toLocaleString()}</strong>
        <p>XP</p>
      </div>
    </section>
  </div>
)}

        </main>

        {/* BOTTOM NAV */}
        <nav className="bottom-nav">
          <button className={`nav-btn${view === "home" ? " active" : ""}`} onClick={() => setView("home")}>
            <div className="nav-btn-icon">🏠</div>
            <div className="nav-btn-label">Нүүр</div>
          </button>
          <button className={`nav-btn${view === "learn" ? " active" : ""}`} onClick={() => setView("learn")}>
            <div className="nav-btn-icon">📚</div>
            <div className="nav-btn-label">Сурах</div>
          </button>
          <button className={`nav-btn${view === "add-word" ? " active" : ""}`} onClick={() => setView("add-word")}>
            <div className="nav-btn-icon">➕</div>
            <div className="nav-btn-label">Нэмэх</div>
          </button>
          <button className={`nav-btn${view === "challenges" ? " active" : ""}`} onClick={() => setView("challenges")}>
            <div className="nav-btn-icon">⭐</div>
            <div className="nav-btn-label">Сорилт</div>
          </button>
          <button className={`nav-btn${view === "leaderboard" ? " active" : ""}`} onClick={() => setView("leaderboard")}>
            <div className="nav-btn-icon">🏆</div>
            <div className="nav-btn-label">Rank</div>
          </button>
          <button className={`nav-btn${view === "shop" ? " active" : ""}`} onClick={() => setView("shop")}>
            <div className="nav-btn-icon">🛍️</div>
            <div className="nav-btn-label">Shop</div>
          </button>
          <button className={`nav-btn${view === "profile" ? " active" : ""}`} onClick={() => setView("profile")}>
            <div className="nav-btn-icon">
              {authUser.avatar ? (
                <Image
                  src={authUser.avatar}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: view === "profile" ? "2px solid var(--primary, #16a34a)" : "2px solid var(--border, #e5e7eb)",
                  }}
                />
              ) : "👤"}
            </div>
            <div className="nav-btn-label">Профайл</div>
          </button>
        </nav>

        <button
          type="button"
          className={`floating-chat-btn${chatDrawerOpen ? " open" : ""}`}
          onClick={() => {
            if (friendUsers.length === 0) {
              setNotice("Эхлээд найз нэмээд чат ашиглана");
              return;
            }

            if (!activeChatUserId) {
              setActiveChatUserId(friendUsers[0]?.id ?? null);
            }

            const targetId = activeChatUserId ?? friendUsers[0]?.id;
            if (targetId) {
              setChatReadState((prev) => ({ ...prev, [targetId]: Date.now() }));
            }
            setChatDrawerOpen((prev) => !prev);
          }}
          title="User chat"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17l-3 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7z" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
          </svg>
          {totalUnreadChats > 0 && (
            <span className="floating-chat-badge">{totalUnreadChats}</span>
          )}
        </button>

        {notice && <div className="notice-toast">{notice}</div>}
      </div>
    </>
  );
}
