// // "use client";

// // import { FormEvent, startTransition, useMemo, useState, useEffect, useRef } from "react";
// // import type { Category, Challenge, Word } from "@/lib/types";
// // import { urlBase64ToUint8Array } from "@/lib/client-push";

// // type HomeData = {
// //   categories: Category[];
// //   words: Word[];
// //   challenges: Challenge[];
// // };

// // type Mode = "flashcard" | "quiz" | "check";
// // type View =
// //   | "home"
// //   | "learn"
// //   | "add-word"
// //   | "categories"
// //   | "challenges"
// //   | "leaderboard";

// // const PALETTE = ["#22c55e","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316"];

// // export function WordsApp({ initialData }: { initialData: HomeData }) {
// //   const [categories, setCategories] = useState(initialData.categories);
// //   const [words, setWords] = useState(initialData.words);
// //   const [challenges, setChallenges] = useState(initialData.challenges);
// //   const [selectedCategory, setSelectedCategory] = useState("all");
// //   const [mode, setMode] = useState<Mode>("flashcard");
// //   const [cardIndex, setCardIndex] = useState(0);
// //   const [revealed, setRevealed] = useState(false);
// //   const [quizAnswer, setQuizAnswer] = useState("");
// //   const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
// //   const [busy, setBusy] = useState("");
// //   const [notice, setNotice] = useState("");
// //   const [memberName, setMemberName] = useState("");
// //   const [view, setView] = useState<View>("home");
// //   const [streak, setStreak] = useState(0);
// //   const [copiedCode, setCopiedCode] = useState("");
// //   const inputRef = useRef<HTMLInputElement>(null);

// //   const filteredWords = useMemo(() => {
// //     if (selectedCategory === "all") return words;
// //     return words.filter((w) => w.category_id === selectedCategory);
// //   }, [selectedCategory, words]);

// //   const currentWord = filteredWords[cardIndex % Math.max(filteredWords.length, 1)];
// //   const masteryAvg = words.length
// //     ? Math.round((words.reduce((t, w) => t + w.mastery, 0) / (words.length * 5)) * 100)
// //     : 0;

// //   const masteredCount = words.filter((w) => w.mastery >= 4).length;
// //   const learningCount = words.filter((w) => w.mastery > 0 && w.mastery < 4).length;
// //   const newCount = words.filter((w) => w.mastery === 0).length;

// //   useEffect(() => {
// //     if (notice) {
// //       const t = setTimeout(() => setNotice(""), 4000);
// //       return () => clearTimeout(t);
// //     }
// //   }, [notice]);

// //   function refreshAfterMutation() {
// //     startTransition(() => window.location.reload());
// //   }

// //   async function postJson<T>(url: string, body: unknown): Promise<T> {
// //     const res = await fetch(url, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify(body),
// //     });
// //     if (!res.ok) {
// //       const p = await res.json().catch(() => ({ error: "Request failed." }));
// //       throw new Error(p.error ?? "Request failed.");
// //     }
// //     return res.json();
// //   }

// //   async function addCategory(e: FormEvent<HTMLFormElement>) {
// //     e.preventDefault();
// //     setBusy("category");
// //     const form = new FormData(e.currentTarget);
// //     const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
// //     try {
// //       const cat = await postJson<Category>("/api/categories", { name: form.get("name"), color });
// //       setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
// //       e.currentTarget.reset();
// //       setNotice("✓ Анги нэмэгдлээ");
// //     } catch (err) {
// //       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
// //     } finally {
// //       setBusy("");
// //     }
// //   }

// //   async function addWord(e: FormEvent<HTMLFormElement>) {
// //     e.preventDefault();
// //     setBusy("word");
// //     const form = new FormData(e.currentTarget);
// //     try {
// //       await postJson<Word>("/api/words", {
// //         term: form.get("term"),
// //         meaning: form.get("meaning"),
// //         example: form.get("example") || "",
// //         categoryId: form.get("categoryId") || null,
// //         authorName: form.get("authorName") || "Anonymous",
// //       });
// //       e.currentTarget.reset();
// //       setNotice("✓ Үг нэмэгдлээ!");
// //       refreshAfterMutation();
// //     } catch (err) {
// //       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
// //     } finally {
// //       setBusy("");
// //     }
// //   }

// //   async function updateMastery(word: Word, delta: number) {
// //     const mastery = Math.min(5, Math.max(0, word.mastery + delta));
// //     const res = await fetch(`/api/words/${word.id}`, {
// //       method: "PATCH",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ mastery }),
// //     });
// //     if (res.ok) {
// //       setWords((prev) => prev.map((w) => (w.id === word.id ? { ...w, mastery } : w)));
// //       if (delta > 0) setStreak((s) => s + 1);
// //     }
// //   }

// //   function nextCard() {
// //     setRevealed(false);
// //     setQuizAnswer("");
// //     setQuizResult(null);
// //     setCardIndex((i) => (filteredWords.length ? (i + 1) % filteredWords.length : 0));
// //     setTimeout(() => inputRef.current?.focus(), 100);
// //   }

// //   function checkQuiz() {
// //     if (!currentWord) return;
// //     const norm = (s: string) => s.trim().toLowerCase();
// //     const correct =
// //       norm(currentWord.meaning).includes(norm(quizAnswer)) ||
// //       norm(quizAnswer).includes(norm(currentWord.meaning));
// //     setQuizResult(correct ? "correct" : "wrong");
// //     void updateMastery(currentWord, correct ? 1 : -1);
// //   }

// //   async function createChallenge(e: FormEvent<HTMLFormElement>) {
// //     e.preventDefault();
// //     setBusy("challenge");
// //     const form = new FormData(e.currentTarget);
// //     try {
// //       await postJson<Challenge>("/api/challenges", {
// //         title: form.get("title"),
// //         categoryId: form.get("categoryId") || null,
// //         hostName: form.get("hostName"),
// //         remindMessage: form.get("remindMessage") || "Үгээ цээжлээрэй!",
// //       });
// //       setNotice("✓ Challenge үүсгэлээ.");
// //       refreshAfterMutation();
// //     } catch (err) {
// //       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
// //     } finally {
// //       setBusy("");
// //     }
// //   }

// //   async function joinChallenge(e: FormEvent<HTMLFormElement>) {
// //     e.preventDefault();
// //     const form = new FormData(e.currentTarget);
// //     const code = String(form.get("code") ?? "").trim();
// //     const displayName = String(form.get("displayName") ?? "").trim();
// //     try {
// //       await postJson(`/api/challenges/${code}/join`, { displayName });
// //       setMemberName(displayName);
// //       setNotice("✓ Challenge-д нэгдлээ!");
// //       refreshAfterMutation();
// //     } catch (err) {
// //       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
// //     }
// //   }

// //   async function subscribeToPush() {
// //     if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
// //       setNotice("Browser push notification дэмжихгүй байна");
// //       return;
// //     }
// //     if (!memberName.trim()) { setNotice("Эхлэд нэрээ оруулна уу"); return; }
// //     const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
// //     if (!publicKey) { setNotice("VAPID key тохируулаагүй"); return; }
// //     const reg = await navigator.serviceWorker.register("/sw.js");
// //     const perm = await Notification.requestPermission();
// //     if (perm !== "granted") { setNotice("Notification зөвшөөрөл өгөөгүй"); return; }
// //     const sub =
// //       (await reg.pushManager.getSubscription()) ??
// //       (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
// //     await postJson("/api/push/subscribe", { memberName, subscription: sub });
// //     setNotice("✓ Notification идэвхжлээ!");
// //   }

// //   async function sendReminder(code: string) {
// //     try {
// //       const r = await postJson<{ sent: number }>(`/api/challenges/${code}/remind`, {});
// //       setNotice(`✓ ${r.sent} хэрэглэгч рүү сануулга явуулав`);
// //     } catch (err) {
// //       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
// //     }
// //   }

// //   function copyInviteLink(code: string) {
// //     const url = `${window.location.origin}?join=${code}`;
// //     navigator.clipboard.writeText(url);
// //     setCopiedCode(code);
// //     setTimeout(() => setCopiedCode(""), 2000);
// //   }

// //   const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
// //     { id: "home", label: "Нүүр", icon: <HomeIcon /> },
// //     { id: "learn", label: "Номын сан", icon: <LibraryIcon /> },
// //     { id: "challenges", label: "Сорилт", icon: <ChallengeIcon /> },
// //     { id: "leaderboard", label: "Найзууд", icon: <FriendsIcon /> },
// //   ];

// //   const masteryColor = (m: number) => {
// //     if (m === 0) return "#d1d5db";
// //     if (m <= 2) return "#f59e0b";
// //     if (m <= 4) return "#22c55e";
// //     return "#16a34a";
// //   };

// //   const xpTotal = words.reduce((t, w) => t + w.mastery * 20, 0);
// //   const dailyGoalPct = Math.min(100, Math.round((masteredCount / Math.max(words.length, 1)) * 100));

// //   return (
// //     <>
// //       <style>{`
// //         @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
// //         * { box-sizing: border-box; margin: 0; padding: 0; }
// //         body {
// //           background: #f5f5f0;
// //           color: #1a1a1a;
// //           font-family: 'Nunito', 'Segoe UI', sans-serif;
// //           min-height: 100vh;
// //         }

// //         /* ── LAYOUT ── */
// //         .app { display: flex; flex-direction: column; min-height: 100vh; }

// //         /* ── TOP HEADER (mobile-app style) ── */
// //         .app-header {
// //           background: #fff;
// //           border-bottom: 2px solid #e5e7eb;
// //           padding: 0 20px;
// //           height: 56px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           position: sticky;
// //           top: 0;
// //           z-index: 100;
// //         }
// //         .app-header-logo {
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           font-size: 22px;
// //           font-weight: 900;
// //           color: #16a34a;
// //           letter-spacing: -0.5px;
// //         }
// //         .app-header-logo span { color: #1a1a1a; }
// //         .app-header-right {
// //           display: flex;
// //           align-items: center;
// //           gap: 16px;
// //         }
// //         .xp-badge {
// //           display: flex;
// //           align-items: center;
// //           gap: 6px;
// //           font-size: 14px;
// //           font-weight: 800;
// //           color: #f59e0b;
// //           background: #fef3c7;
// //           border: 2px solid #fcd34d;
// //           border-radius: 100px;
// //           padding: 4px 12px;
// //         }
// //         .xp-badge svg { width: 16px; height: 16px; }
// //         .streak-pill {
// //           display: flex;
// //           align-items: center;
// //           gap: 5px;
// //           font-size: 14px;
// //           font-weight: 800;
// //           color: #ea580c;
// //           background: #fff7ed;
// //           border: 2px solid #fed7aa;
// //           border-radius: 100px;
// //           padding: 4px 12px;
// //         }

// //         /* ── MAIN SCROLL AREA ── */
// //         .app-body {
// //           flex: 1;
// //           overflow-y: auto;
// //           padding-bottom: 80px;
// //         }

// //         /* ── BOTTOM NAV ── */
// //         .bottom-nav {
// //           position: fixed;
// //           bottom: 0; left: 0; right: 0;
// //           background: #fff;
// //           border-top: 2px solid #e5e7eb;
// //           display: flex;
// //           z-index: 100;
// //           height: 64px;
// //         }
// //         .nav-btn {
// //           flex: 1;
// //           display: flex;
// //           flex-direction: column;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 3px;
// //           background: transparent;
// //           border: none;
// //           cursor: pointer;
// //           padding: 8px 4px;
// //           position: relative;
// //           transition: transform 0.1s;
// //         }
// //         .nav-btn:active { transform: scale(0.92); }
// //         .nav-btn-icon {
// //           width: 28px;
// //           height: 28px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //         }
// //         .nav-btn-icon svg {
// //           width: 24px;
// //           height: 24px;
// //           fill: none;
// //           stroke: #9ca3af;
// //           stroke-width: 2;
// //           stroke-linecap: round;
// //           stroke-linejoin: round;
// //           transition: stroke 0.15s;
// //         }
// //         .nav-btn.active .nav-btn-icon svg { stroke: #16a34a; }
// //         .nav-btn-label {
// //           font-size: 11px;
// //           font-weight: 700;
// //           color: #9ca3af;
// //           transition: color 0.15s;
// //           letter-spacing: 0.2px;
// //         }
// //         .nav-btn.active .nav-btn-label { color: #16a34a; }
// //         .nav-btn.active::after {
// //           content: '';
// //           position: absolute;
// //           bottom: 0; left: 50%;
// //           transform: translateX(-50%);
// //           width: 32px;
// //           height: 3px;
// //           background: #16a34a;
// //           border-radius: 2px 2px 0 0;
// //         }

// //         /* ── PAGE WRAPPER ── */
// //         .page { padding: 20px 20px 0; max-width: 640px; margin: 0 auto; }

// //         /* ── STREAK HERO CARD ── */
// //         .streak-hero {
// //           background: #16a34a;
// //           border-radius: 20px;
// //           padding: 20px;
// //           margin-bottom: 20px;
// //           color: white;
// //           position: relative;
// //           overflow: hidden;
// //         }
// //         .streak-hero::before {
// //           content: '';
// //           position: absolute;
// //           top: -30px; right: -30px;
// //           width: 120px; height: 120px;
// //           background: rgba(255,255,255,0.08);
// //           border-radius: 50%;
// //         }
// //         .streak-hero::after {
// //           content: '';
// //           position: absolute;
// //           bottom: -40px; right: 30px;
// //           width: 90px; height: 90px;
// //           background: rgba(255,255,255,0.06);
// //           border-radius: 50%;
// //         }
// //         .streak-eyebrow {
// //           font-size: 11px;
// //           font-weight: 800;
// //           text-transform: uppercase;
// //           letter-spacing: 1.5px;
// //           opacity: 0.8;
// //           margin-bottom: 6px;
// //         }
// //         .streak-main {
// //           font-size: 22px;
// //           font-weight: 900;
// //           margin-bottom: 16px;
// //         }
// //         .streak-sub {
// //           font-size: 13px;
// //           opacity: 0.85;
// //           line-height: 1.5;
// //           margin-bottom: 16px;
// //         }
// //         .continue-btn {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 8px;
// //           background: white;
// //           color: #16a34a;
// //           font-size: 15px;
// //           font-weight: 800;
// //           border: none;
// //           border-radius: 12px;
// //           padding: 12px 20px;
// //           cursor: pointer;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //           box-shadow: 0 4px 0 rgba(0,0,0,0.15);
// //         }
// //         .continue-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 0 rgba(0,0,0,0.15); }
// //         .continue-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,0.15); }

// //         /* ── STATS ROW ── */
// //         .stats-row {
// //           display: grid;
// //           grid-template-columns: 1fr 1fr;
// //           gap: 12px;
// //           margin-bottom: 20px;
// //         }
// //         .stat-tile {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 16px;
// //           padding: 16px;
// //         }
// //         .stat-tile-label {
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #6b7280;
// //           text-transform: uppercase;
// //           letter-spacing: 0.5px;
// //           margin-bottom: 6px;
// //         }
// //         .stat-tile-val {
// //           font-size: 28px;
// //           font-weight: 900;
// //           line-height: 1;
// //           margin-bottom: 4px;
// //         }
// //         .stat-tile-sub { font-size: 12px; color: #9ca3af; font-weight: 600; }

// //         .goal-tile {
// //           grid-column: 1 / -1;
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 16px;
// //           padding: 16px;
// //         }
// //         .goal-header {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: center;
// //           margin-bottom: 10px;
// //         }
// //         .goal-label { font-size: 14px; font-weight: 700; color: #374151; }
// //         .goal-pct { font-size: 14px; font-weight: 800; color: #16a34a; }
// //         .goal-bar {
// //           height: 10px;
// //           background: #e5e7eb;
// //           border-radius: 100px;
// //           overflow: hidden;
// //         }
// //         .goal-fill {
// //           height: 100%;
// //           background: #16a34a;
// //           border-radius: 100px;
// //           transition: width 0.6s cubic-bezier(.34,1.56,.64,1);
// //         }

// //         /* ── SECTION HEADING ── */
// //         .sec-head {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           margin-bottom: 14px;
// //         }
// //         .sec-title { font-size: 18px; font-weight: 900; color: #111827; }
// //         .sec-link {
// //           font-size: 13px;
// //           font-weight: 700;
// //           color: #16a34a;
// //           background: none;
// //           border: none;
// //           cursor: pointer;
// //           text-decoration: none;
// //         }

// //         /* ── WORD CARDS ── */
// //         .word-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
// //         .word-card {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 16px;
// //           padding: 16px;
// //           display: flex;
// //           align-items: center;
// //           gap: 14px;
// //           cursor: pointer;
// //           transition: border-color 0.15s, transform 0.1s;
// //         }
// //         .word-card:hover { border-color: #86efac; transform: translateY(-1px); }
// //         .word-card:active { transform: scale(0.99); }
// //         .word-card-icon {
// //           width: 44px; height: 44px;
// //           background: #f0fdf4;
// //           border-radius: 12px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           font-size: 18px;
// //           flex-shrink: 0;
// //           border: 2px solid #bbf7d0;
// //         }
// //         .word-card-body { flex: 1; min-width: 0; }
// //         .word-card-term { font-size: 16px; font-weight: 800; color: #111827; margin-bottom: 2px; }
// //         .word-card-meaning { font-size: 13px; color: #6b7280; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
// //         .word-card-mastery { display: flex; gap: 3px; flex-shrink: 0; }
// //         .ms-dot { width: 8px; height: 8px; border-radius: 50%; }

// //         /* ── TRENDING CARD ── */
// //         .trending-card {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 20px;
// //           padding: 20px;
// //           margin-bottom: 20px;
// //           position: relative;
// //           overflow: hidden;
// //         }
// //         .trending-badge {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 4px;
// //           background: #fef3c7;
// //           color: #92400e;
// //           font-size: 11px;
// //           font-weight: 800;
// //           padding: 3px 10px;
// //           border-radius: 100px;
// //           margin-bottom: 10px;
// //           text-transform: uppercase;
// //           letter-spacing: 0.5px;
// //         }
// //         .trending-title { font-size: 26px; font-weight: 900; color: #111827; margin-bottom: 8px; line-height: 1.1; }
// //         .trending-desc { font-size: 13px; color: #6b7280; font-weight: 600; line-height: 1.5; margin-bottom: 16px; }
// //         .trending-meta { font-size: 12px; color: #9ca3af; font-weight: 600; }
// //         .trending-arrow {
// //           position: absolute;
// //           right: 20px; top: 50%;
// //           transform: translateY(-50%);
// //           width: 40px; height: 40px;
// //           background: #16a34a;
// //           border-radius: 50%;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           cursor: pointer;
// //           transition: transform 0.1s;
// //           border: none;
// //         }
// //         .trending-arrow:hover { transform: translateY(-50%) scale(1.08); }
// //         .trending-arrow svg { stroke: white; width: 18px; height: 18px; fill: none; stroke-width: 2.5; }

// //         /* ── FLASHCARD ── */
// //         .flashcard-wrap { padding: 20px; }
// //         .cat-chips {
// //           display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 16px;
// //           scrollbar-width: none;
// //         }
// //         .cat-chips::-webkit-scrollbar { display: none; }
// //         .cat-chip {
// //           padding: 6px 14px;
// //           border-radius: 100px;
// //           border: 2px solid #e5e7eb;
// //           background: #fff;
// //           color: #6b7280;
// //           font-size: 13px;
// //           font-weight: 700;
// //           cursor: pointer;
// //           white-space: nowrap;
// //           transition: all 0.15s;
// //           display: flex; align-items: center; gap: 5px;
// //         }
// //         .cat-chip:hover { border-color: #86efac; color: #16a34a; }
// //         .cat-chip.active { background: #16a34a; border-color: #16a34a; color: white; }
// //         .cat-chip-dot { width: 8px; height: 8px; border-radius: 50%; }

// //         .mode-tabs {
// //           display: flex;
// //           background: #f3f4f6;
// //           border-radius: 12px;
// //           padding: 4px;
// //           gap: 3px;
// //           margin-bottom: 20px;
// //         }
// //         .mode-tab {
// //           flex: 1;
// //           padding: 9px 8px;
// //           border-radius: 9px;
// //           border: none;
// //           background: transparent;
// //           color: #6b7280;
// //           font-size: 13px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           transition: all 0.15s;
// //           font-family: inherit;
// //         }
// //         .mode-tab.active { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

// //         .big-flashcard {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 24px;
// //           padding: 40px 32px;
// //           min-height: 240px;
// //           display: flex;
// //           flex-direction: column;
// //           align-items: center;
// //           justify-content: center;
// //           text-align: center;
// //           cursor: pointer;
// //           transition: border-color 0.2s;
// //           margin-bottom: 16px;
// //           position: relative;
// //         }
// //         .big-flashcard:hover { border-color: #86efac; }
// //         .new-word-tag {
// //           position: absolute;
// //           top: 16px; right: 16px;
// //           background: #f0fdf4;
// //           color: #16a34a;
// //           font-size: 11px;
// //           font-weight: 800;
// //           padding: 4px 10px;
// //           border-radius: 100px;
// //           border: 2px solid #bbf7d0;
// //           text-transform: uppercase;
// //           letter-spacing: 0.5px;
// //         }
// //         .card-phonetic { font-size: 14px; color: #9ca3af; font-weight: 600; margin-bottom: 8px; }
// //         .card-term { font-size: 40px; font-weight: 900; color: #111827; margin-bottom: 8px; letter-spacing: -1px; }
// //         .card-reveal-hint { font-size: 14px; color: #9ca3af; font-weight: 600; }
// //         .card-meaning { font-size: 18px; color: #374151; font-weight: 700; line-height: 1.5; margin-top: 16px; padding-top: 16px; border-top: 2px solid #f3f4f6; width: 100%; }
// //         .card-example { font-size: 14px; color: #9ca3af; font-style: italic; margin-top: 10px; line-height: 1.6; }

// //         .card-nav {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 10px;
// //           margin-bottom: 20px;
// //         }
// //         .nav-arrow {
// //           width: 52px; height: 52px;
// //           border-radius: 50%;
// //           border: 2px solid #e5e7eb;
// //           background: #fff;
// //           display: flex; align-items: center; justify-content: center;
// //           cursor: pointer;
// //           transition: all 0.15s;
// //         }
// //         .nav-arrow:hover { border-color: #86efac; background: #f0fdf4; }
// //         .nav-arrow svg { stroke: #374151; width: 20px; height: 20px; fill: none; stroke-width: 2.5; }
// //         .card-counter { font-size: 15px; font-weight: 800; color: #374151; }

// //         .action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
// //         .btn-know {
// //           padding: 16px;
// //           border-radius: 16px;
// //           border: none;
// //           background: #16a34a;
// //           color: white;
// //           font-size: 15px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           font-family: inherit;
// //           box-shadow: 0 4px 0 #15803d;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //         }
// //         .btn-know:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #15803d; }
// //         .btn-know:active { transform: translateY(3px); box-shadow: 0 1px 0 #15803d; }
// //         .btn-again {
// //           padding: 16px;
// //           border-radius: 16px;
// //           border: 2px solid #e5e7eb;
// //           background: #fff;
// //           color: #374151;
// //           font-size: 15px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           font-family: inherit;
// //           box-shadow: 0 4px 0 #d1d5db;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //         }
// //         .btn-again:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #d1d5db; }
// //         .btn-again:active { transform: translateY(3px); box-shadow: 0 1px 0 #d1d5db; }

// //         /* QUIZ */
// //         .quiz-input {
// //           width: 100%;
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 14px;
// //           padding: 14px 16px;
// //           color: #111827;
// //           font-size: 16px;
// //           font-weight: 600;
// //           outline: none;
// //           transition: border-color 0.15s;
// //           font-family: inherit;
// //           margin-top: 16px;
// //         }
// //         .quiz-input:focus { border-color: #16a34a; }
// //         .quiz-input.correct { border-color: #16a34a; background: #f0fdf4; }
// //         .quiz-input.wrong { border-color: #ef4444; background: #fef2f2; }
// //         .check-btn {
// //           width: 100%;
// //           margin-top: 10px;
// //           padding: 16px;
// //           border-radius: 16px;
// //           border: none;
// //           background: #16a34a;
// //           color: white;
// //           font-size: 16px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           font-family: inherit;
// //           box-shadow: 0 4px 0 #15803d;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //         }
// //         .check-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #15803d; }
// //         .result-bar {
// //           margin-top: 12px;
// //           padding: 12px 16px;
// //           border-radius: 12px;
// //           font-size: 15px;
// //           font-weight: 700;
// //         }
// //         .result-bar.correct { background: #f0fdf4; color: #16a34a; border: 2px solid #bbf7d0; }
// //         .result-bar.wrong { background: #fef2f2; color: #dc2626; border: 2px solid #fecaca; }

// //         /* ── ADD WORD PAGE ── */
// //         .form-page { padding: 20px; max-width: 600px; margin: 0 auto; }
// //         .form-title { font-size: 22px; font-weight: 900; margin-bottom: 6px; }
// //         .form-sub { font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 24px; }
// //         .form-group { margin-bottom: 16px; }
// //         .form-label {
// //           display: block;
// //           font-size: 13px;
// //           font-weight: 800;
// //           color: #374151;
// //           margin-bottom: 6px;
// //           text-transform: uppercase;
// //           letter-spacing: 0.5px;
// //         }
// //         .form-input {
// //           width: 100%;
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 12px;
// //           padding: 13px 16px;
// //           color: #111827;
// //           font-size: 15px;
// //           font-weight: 600;
// //           outline: none;
// //           transition: border-color 0.15s;
// //           font-family: inherit;
// //         }
// //         .form-input:focus { border-color: #16a34a; }
// //         .form-input::placeholder { color: #d1d5db; font-weight: 500; }
// //         textarea.form-input { min-height: 90px; resize: vertical; }
// //         select.form-input { cursor: pointer; }
// //         .submit-btn {
// //           width: 100%;
// //           padding: 16px;
// //           border-radius: 16px;
// //           border: none;
// //           background: #16a34a;
// //           color: white;
// //           font-size: 16px;
// //           font-weight: 900;
// //           cursor: pointer;
// //           font-family: inherit;
// //           box-shadow: 0 5px 0 #15803d;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //           margin-top: 8px;
// //         }
// //         .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 0 #15803d; }
// //         .submit-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #15803d; }
// //         .submit-btn:disabled { background: #d1d5db; box-shadow: 0 5px 0 #9ca3af; cursor: not-allowed; }

// //         /* ── CATEGORIES ── */
// //         .cat-grid {
// //           display: grid;
// //           grid-template-columns: 1fr 1fr;
// //           gap: 12px;
// //           margin-bottom: 24px;
// //         }
// //         .cat-tile {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 16px;
// //           padding: 18px;
// //           cursor: pointer;
// //           transition: border-color 0.15s, transform 0.1s;
// //         }
// //         .cat-tile:hover { border-color: #86efac; transform: translateY(-2px); }
// //         .cat-tile:active { transform: scale(0.97); }
// //         .cat-tile-dot { width: 12px; height: 12px; border-radius: 50%; margin-bottom: 12px; }
// //         .cat-tile-name { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 4px; }
// //         .cat-tile-count { font-size: 13px; color: #9ca3af; font-weight: 600; }

// //         /* ── CHALLENGES ── */
// //         .challenge-card {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 20px;
// //           padding: 20px;
// //           margin-bottom: 14px;
// //         }
// //         .challenge-title { font-size: 17px; font-weight: 900; color: #111827; margin-bottom: 4px; }
// //         .challenge-host { font-size: 13px; color: #9ca3af; font-weight: 600; margin-bottom: 14px; }
// //         .invite-code-row {
// //           background: #f9fafb;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 12px;
// //           padding: 12px 14px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           margin-bottom: 12px;
// //         }
// //         .invite-code-text {
// //           font-family: 'Courier New', monospace;
// //           font-size: 20px;
// //           font-weight: 700;
// //           letter-spacing: 4px;
// //           color: #16a34a;
// //         }
// //         .copy-btn {
// //           background: #16a34a;
// //           color: white;
// //           border: none;
// //           border-radius: 8px;
// //           padding: 6px 14px;
// //           font-size: 12px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           font-family: inherit;
// //         }
// //         .copy-btn.copied { background: #f59e0b; }
// //         .members-row {
// //           display: flex;
// //           flex-wrap: wrap;
// //           gap: 6px;
// //           margin-bottom: 12px;
// //         }
// //         .member-pill {
// //           background: #f3f4f6;
// //           color: #374151;
// //           font-size: 12px;
// //           font-weight: 700;
// //           padding: 4px 12px;
// //           border-radius: 100px;
// //         }
// //         .remind-btn {
// //           width: 100%;
// //           padding: 13px;
// //           background: #f59e0b;
// //           color: white;
// //           border: none;
// //           border-radius: 12px;
// //           font-size: 14px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           font-family: inherit;
// //           box-shadow: 0 4px 0 #d97706;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //         }
// //         .remind-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #d97706; }

// //         /* ── LEADERBOARD ── */
// //         .lb-card {
// //           background: #fff;
// //           border: 2px solid #e5e7eb;
// //           border-radius: 16px;
// //           padding: 16px;
// //           display: flex;
// //           align-items: center;
// //           gap: 14px;
// //           margin-bottom: 10px;
// //           transition: border-color 0.15s;
// //         }
// //         .lb-card:hover { border-color: #86efac; }
// //         .lb-rank {
// //           font-size: 22px;
// //           font-weight: 900;
// //           min-width: 36px;
// //           text-align: center;
// //           color: #9ca3af;
// //         }
// //         .lb-avatar {
// //           width: 44px; height: 44px;
// //           border-radius: 50%;
// //           background: #f0fdf4;
// //           border: 2px solid #bbf7d0;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           font-size: 18px;
// //           font-weight: 900;
// //           color: #16a34a;
// //           flex-shrink: 0;
// //         }
// //         .lb-name { flex: 1; font-size: 15px; font-weight: 800; color: #111827; }
// //         .lb-sub { font-size: 12px; color: #9ca3af; font-weight: 600; }
// //         .lb-xp { font-size: 16px; font-weight: 900; color: #f59e0b; }
// //         .lb-xp-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-align: right; }

// //         /* ── NOTICE ── */
// //         .notice-toast {
// //           position: fixed;
// //           bottom: 80px; left: 50%;
// //           transform: translateX(-50%);
// //           background: #111827;
// //           color: white;
// //           font-size: 14px;
// //           font-weight: 700;
// //           padding: 12px 24px;
// //           border-radius: 100px;
// //           z-index: 300;
// //           white-space: nowrap;
// //           animation: popUp 0.25s cubic-bezier(.34,1.56,.64,1);
// //         }
// //         @keyframes popUp { from { opacity:0; transform: translateX(-50%) translateY(12px) scale(0.9); } to { opacity:1; transform: translateX(-50%) translateY(0) scale(1); } }

// //         /* ── DIVIDER ── */
// //         .divider { border: none; border-top: 2px solid #f3f4f6; margin: 20px 0; }

// //         /* NUDGE CARD */
// //         .nudge-card {
// //           background: #fff;
// //           border: 2px solid #bbf7d0;
// //           border-radius: 16px;
// //           padding: 14px 16px;
// //           display: flex;
// //           align-items: flex-start;
// //           gap: 12px;
// //           margin-bottom: 14px;
// //         }
// //         .nudge-dot { width: 10px; height: 10px; background: #16a34a; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
// //         .nudge-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 4px; }
// //         .nudge-text { font-size: 14px; font-weight: 600; color: #374151; }
// //         .nudge-time { font-size: 11px; color: #9ca3af; font-weight: 600; margin-top: 2px; }

// //         /* FRIENDS CHALLENGE BTN */
// //         .challenge-friend-btn {
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 8px;
// //           width: 100%;
// //           padding: 16px;
// //           background: #f59e0b;
// //           color: white;
// //           border: none;
// //           border-radius: 16px;
// //           font-size: 16px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           font-family: inherit;
// //           box-shadow: 0 5px 0 #d97706;
// //           transition: transform 0.1s, box-shadow 0.1s;
// //           margin-bottom: 20px;
// //         }
// //         .challenge-friend-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 0 #d97706; }
// //         .challenge-friend-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #d97706; }

// //         @media (min-width: 640px) {
// //           .app-header { padding: 0 32px; }
// //           .page, .form-page, .flashcard-wrap { padding: 24px; }
// //         }
// //       `}</style>

// //       <div className="app">
// //         {/* TOP HEADER */}
// //         <header className="app-header">
// //           <div className="app-header-logo">
// //             Linguist<span>.</span>
// //           </div>
// //           <div className="app-header-right">
// //             {streak > 0 && (
// //               <div className="streak-pill">
// //                 🔥 {streak}
// //               </div>
// //             )}
// //             <div className="xp-badge">
// //               <svg viewBox="0 0 16 16" fill="#f59e0b"><polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6" /></svg>
// //               {xpTotal} XP
// //             </div>
// //           </div>
// //         </header>

// //         {/* BODY */}
// //         <main className="app-body">

// //           {/* ── HOME ── */}
// //           {view === "home" && (
// //             <div className="page">
// //               {/* Streak Hero */}
// //               <div className="streak-hero">
// //                 <div className="streak-eyebrow">Одоогийн streak</div>
// //                 <div className="streak-main">{streak > 0 ? `${streak} өдөр дараалал!` : "Өнөөдөр эхэл!"}</div>
// //                 <div className="streak-sub">
// //                   {streak > 0
// //                     ? "Та энэ долоо хоногийн шилдэг 10%-д байна. Дөлийгөө унтраахгүй!"
// //                     : "Өдөр бүр суралцаж streak-ийн дөлийг асаагаарай."}
// //                 </div>
// //                 <button className="continue-btn" onClick={() => setView("learn")}>
// //                   Суралцах үргэлжлүүлэх →
// //                 </button>
// //               </div>

// //               {/* Stats */}
// //               <div className="stats-row">
// //                 <div className="stat-tile">
// //                   <div className="stat-tile-label">Нийт XP</div>
// //                   <div className="stat-tile-val" style={{ color: "#f59e0b" }}>{xpTotal.toLocaleString()}</div>
// //                   <div className="stat-tile-sub">XP нийт</div>
// //                 </div>
// //                 <div className="stat-tile">
// //                   <div className="stat-tile-label">Цээжилсэн</div>
// //                   <div className="stat-tile-val" style={{ color: "#16a34a" }}>{masteredCount}</div>
// //                   <div className="stat-tile-sub">/{words.length} үг</div>
// //                 </div>
// //                 <div className="goal-tile">
// //                   <div className="goal-header">
// //                     <div className="goal-label">Өдрийн зорилго</div>
// //                     <div className="goal-pct">{dailyGoalPct}%</div>
// //                   </div>
// //                   <div className="goal-bar">
// //                     <div className="goal-fill" style={{ width: `${dailyGoalPct}%` }} />
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Today's path */}
// //               <div className="sec-head">
// //                 <div className="sec-title">Өнөөдрийн зам</div>
// //                 <button className="sec-link" onClick={() => setView("learn")}>Номын сан харах ↗</button>
// //               </div>
// //               <div className="word-list">
// //                 {words.slice(0, 5).map((w) => (
// //                   <div key={w.id} className="word-card" onClick={() => setView("learn")}>
// //                     <div className="word-card-icon">📖</div>
// //                     <div className="word-card-body">
// //                       <div className="word-card-term">{w.term}</div>
// //                       <div className="word-card-meaning">{w.meaning}</div>
// //                     </div>
// //                     <div className="word-card-mastery">
// //                       {[1,2,3,4,5].map((i) => (
// //                         <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "#e5e7eb" }} />
// //                       ))}
// //                     </div>
// //                   </div>
// //                 ))}
// //                 {words.length === 0 && (
// //                   <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
// //                     <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
// //                     <div style={{ fontWeight: 700 }}>Үг байхгүй байна</div>
// //                     <button className="submit-btn" style={{ marginTop: 16, maxWidth: 200 }} onClick={() => setView("add-word")}>
// //                       + Үг нэмэх
// //                     </button>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           )}

// //           {/* ── LIBRARY / LEARN ── */}
// //           {view === "learn" && (
// //             <div className="flashcard-wrap">
// //               {/* Category filter */}
// //               <div className="cat-chips">
// //                 <button className={`cat-chip${selectedCategory === "all" ? " active" : ""}`} onClick={() => { setSelectedCategory("all"); setCardIndex(0); }}>
// //                   Бүгд ({words.length})
// //                 </button>
// //                 {categories.map((c) => (
// //                   <button
// //                     key={c.id}
// //                     className={`cat-chip${selectedCategory === c.id ? " active" : ""}`}
// //                     onClick={() => { setSelectedCategory(c.id); setCardIndex(0); }}
// //                   >
// //                     <span className="cat-chip-dot" style={{ background: c.color }} />
// //                     {c.name}
// //                   </button>
// //                 ))}
// //               </div>

// //               {/* Trending category card */}
// //               {categories[0] && (
// //                 <div className="trending-card" style={{ marginBottom: 16 }}>
// //                   <div className="trending-badge">⭐ Trending</div>
// //                   <div className="trending-title">{categories[0].name}</div>
// //                   <div className="trending-desc">Хамтын нийгэмлэгийн үгийн санаас суралцаарай.</div>
// //                   <div className="trending-meta">{words.filter(w=>w.category_id===categories[0].id).length} үг · {categories[0].name} авах</div>
// //                   <button className="trending-arrow" onClick={() => { setSelectedCategory(categories[0].id); setCardIndex(0); }}>
// //                     <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6" /></svg>
// //                   </button>
// //                 </div>
// //               )}

// //               {/* Mode switch */}
// //               <div className="mode-tabs">
// //                 {(["flashcard", "quiz", "check"] as Mode[]).map((m) => (
// //                   <button key={m} className={`mode-tab${mode === m ? " active" : ""}`} onClick={() => setMode(m)}>
// //                     {m === "flashcard" ? "Флаш карт" : m === "quiz" ? "Quiz" : "Self-check"}
// //                   </button>
// //                 ))}
// //               </div>

// //               {currentWord ? (
// //                 <>
// //                   {/* Flashcard */}
// //                   <div
// //                     className="big-flashcard"
// //                     onClick={() => mode === "flashcard" && setRevealed((r) => !r)}
// //                   >
// //                     <div className="new-word-tag">NEW WORD</div>
// //                     {currentWord.category_name && (
// //                       <div className="card-phonetic">{currentWord.category_name}</div>
// //                     )}
// //                     <div className="card-term">{currentWord.term}</div>

// //                     {mode === "flashcard" && (
// //                       revealed ? (
// //                         <>
// //                           <div className="card-meaning">{currentWord.meaning}</div>
// //                           {currentWord.example && <div className="card-example">"{currentWord.example}"</div>}
// //                         </>
// //                       ) : (
// //                         <div className="card-reveal-hint">Дарж орчуулгыг харах</div>
// //                       )
// //                     )}

// //                     {mode === "quiz" && (
// //                       <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
// //                         <input
// //                           ref={inputRef}
// //                           className={`quiz-input${quizResult === "correct" ? " correct" : quizResult === "wrong" ? " wrong" : ""}`}
// //                           value={quizAnswer}
// //                           onChange={(e) => setQuizAnswer(e.target.value)}
// //                           onKeyDown={(e) => e.key === "Enter" && !quizResult && checkQuiz()}
// //                           placeholder="Монгол утгыг бич..."
// //                           disabled={!!quizResult}
// //                         />
// //                         {!quizResult && (
// //                           <button className="check-btn" onClick={checkQuiz}>Шалгах</button>
// //                         )}
// //                         {quizResult && (
// //                           <div className={`result-bar ${quizResult}`}>
// //                             {quizResult === "correct" ? "✓ Зөв! +20 XP" : `✗ Зөв хариулт: ${currentWord.meaning}`}
// //                           </div>
// //                         )}
// //                       </div>
// //                     )}

// //                     {mode === "check" && !revealed && (
// //                       <div onClick={(e) => e.stopPropagation()}>
// //                         <button className="continue-btn" style={{ marginTop: 16 }} onClick={(e) => { e.stopPropagation(); setRevealed(true); }}>
// //                           Орчуулга харах
// //                         </button>
// //                       </div>
// //                     )}
// //                     {mode === "check" && revealed && (
// //                       <>
// //                         <div className="card-meaning">{currentWord.meaning}</div>
// //                       </>
// //                     )}
// //                   </div>

// //                   {/* Navigation */}
// //                   <div className="card-nav">
// //                     <button className="nav-arrow" onClick={() => setCardIndex((i) => (i - 1 + filteredWords.length) % filteredWords.length)}>
// //                       <svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6" /></svg>
// //                     </button>
// //                     <div className="card-counter">{(cardIndex % filteredWords.length) + 1} / {filteredWords.length}</div>
// //                     <button className="nav-arrow" onClick={nextCard}>
// //                       <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6" /></svg>
// //                     </button>
// //                   </div>

// //                   {/* Action buttons (check mode) */}
// //                   {mode === "check" && revealed && (
// //                     <div className="action-btns">
// //                       <button className="btn-know" onClick={() => { void updateMastery(currentWord, 1); nextCard(); }}>
// //                         ✓ Мэдэж байна
// //                       </button>
// //                       <button className="btn-again" onClick={() => { void updateMastery(currentWord, -1); nextCard(); }}>
// //                         ✗ Дахин давтана
// //                       </button>
// //                     </div>
// //                   )}

// //                   {/* Next button (flashcard/quiz mode when result shown) */}
// //                   {(mode === "flashcard" || (mode === "quiz" && quizResult)) && (
// //                     <button className="btn-know" style={{ width: "100%", marginTop: 10 }} onClick={nextCard}>
// //                       Дараагийн үг →
// //                     </button>
// //                   )}

// //                   <hr className="divider" />

// //                   {/* Word list */}
// //                   <div className="sec-head" style={{ marginBottom: 12 }}>
// //                     <div className="sec-title" style={{ fontSize: 16 }}>Бүх үгс</div>
// //                   </div>
// //                   <div className="word-list">
// //                     {filteredWords.map((w) => (
// //                       <div key={w.id} className="word-card">
// //                         <div className="word-card-icon">📝</div>
// //                         <div className="word-card-body">
// //                           <div className="word-card-term">{w.term}</div>
// //                           <div className="word-card-meaning">{w.meaning}</div>
// //                         </div>
// //                         <div className="word-card-mastery">
// //                           {[1,2,3,4,5].map((i) => (
// //                             <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "#e5e7eb" }} />
// //                           ))}
// //                         </div>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </>
// //               ) : (
// //                 <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
// //                   <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
// //                   <div style={{ fontWeight: 700, fontSize: 16 }}>Энэ ангилалд үг байхгүй</div>
// //                   <button className="submit-btn" style={{ marginTop: 16, maxWidth: 200, margin: "16px auto 0" }} onClick={() => setView("add-word")}>
// //                     + Үг нэмэх
// //                   </button>
// //                 </div>
// //               )}
// //             </div>
// //           )}

// //           {/* ── ADD WORD ── */}
// //           {view === "add-word" && (
// //             <div className="form-page">
// //               <div className="form-title">Үг нэмэх</div>
// //               <div className="form-sub">Нэмсэн үг бүх хэрэглэгчид харагдана</div>
// //               <form onSubmit={addWord}>
// //                 <div className="form-group">
// //                   <label className="form-label">Үг / Term</label>
// //                   <input name="term" className="form-input" placeholder="serendipity, ephemeral..." required />
// //                 </div>
// //                 <div className="form-group">
// //                   <label className="form-label">Утга / Meaning</label>
// //                   <textarea name="meaning" className="form-input" placeholder="Монгол утга эсвэл тайлбар..." required />
// //                 </div>
// //                 <div className="form-group">
// //                   <label className="form-label">Жишээ өгүүлбэр (заавал биш)</label>
// //                   <input name="example" className="form-input" placeholder="It was serendipity that we met..." />
// //                 </div>
// //                 <div className="form-group">
// //                   <label className="form-label">Ангилал</label>
// //                   <select name="categoryId" className="form-input" defaultValue="">
// //                     <option value="">Ангилалгүй</option>
// //                     {categories.map((c) => (
// //                       <option key={c.id} value={c.id}>{c.name}</option>
// //                     ))}
// //                   </select>
// //                 </div>
// //                 <div className="form-group">
// //                   <label className="form-label">Таны нэр</label>
// //                   <input name="authorName" className="form-input" placeholder="Анонимаар оруулах бол хоосон орхиж болно" />
// //                 </div>
// //                 <button type="submit" className="submit-btn" disabled={busy === "word"}>
// //                   {busy === "word" ? "Нэмж байна..." : "Нийтэд нэмэх"}
// //                 </button>
// //               </form>

// //               <hr className="divider" />
// //               <div className="form-title" style={{ fontSize: 18, marginBottom: 6 }}>Анги нэмэх</div>
// //               <form onSubmit={addCategory} style={{ display: "flex", gap: 10 }}>
// //                 <input name="name" className="form-input" placeholder="Business, IELTS, Travel..." required style={{ flex: 1 }} />
// //                 <button type="submit" className="submit-btn" disabled={busy === "category"} style={{ width: "auto", padding: "13px 20px", marginTop: 0 }}>
// //                   {busy === "category" ? "..." : "+ Нэмэх"}
// //                 </button>
// //               </form>
// //             </div>
// //           )}

// //           {/* ── CHALLENGES ── */}
// //           {view === "challenges" && (
// //             <div className="form-page">
// //               <div className="form-title">Сорилт</div>
// //               <div className="form-sub">Найзтайгаа өрсөлдөж үгийн санаа ахиул</div>

// //               <button className="challenge-friend-btn" onClick={() => {}}>
// //                 👥 Найзыг сорилтонд урих
// //               </button>

// //               {/* Existing challenges */}
// //               {challenges.length > 0 && (
// //                 <>
// //                   <div className="sec-head" style={{ marginBottom: 14 }}>
// //                     <div className="sec-title" style={{ fontSize: 18 }}>Идэвхтэй сорилтууд</div>
// //                   </div>
// //                   {challenges.map((ch) => (
// //                     <div key={ch.id} className="challenge-card">
// //                       {ch.category_name && (
// //                         <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
// //                           {ch.category_name}
// //                         </div>
// //                       )}
// //                       <div className="challenge-title">{ch.title}</div>
// //                       <div className="challenge-host">Зохион байгуулагч: {ch.host_name}</div>
// //                       <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Invite Code</div>
// //                       <div className="invite-code-row">
// //                         <div className="invite-code-text">{ch.invite_code}</div>
// //                         <button
// //                           className={`copy-btn${copiedCode === ch.invite_code ? " copied" : ""}`}
// //                           onClick={() => copyInviteLink(ch.invite_code)}
// //                         >
// //                           {copiedCode === ch.invite_code ? "✓ Copied" : "Link copy"}
// //                         </button>
// //                       </div>
// //                       {ch.members.length > 0 && (
// //                         <div className="members-row">
// //                           {ch.members.map((m) => (
// //                             <span key={m} className="member-pill">{m}</span>
// //                           ))}
// //                         </div>
// //                       )}
// //                       <button className="remind-btn" onClick={() => sendReminder(ch.invite_code)}>
// //                         📢 Сануулга илгээх
// //                       </button>
// //                     </div>
// //                   ))}
// //                   <hr className="divider" />
// //                 </>
// //               )}

// //               {/* Create challenge */}
// //               <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "#374151" }}>Шинэ сорилт үүсгэх</div>
// //               <form onSubmit={createChallenge} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
// //                 <input name="title" className="form-input" placeholder="7 хоногийн IELTS challenge" required />
// //                 <input name="hostName" className="form-input" placeholder="Таны нэр" required />
// //                 <select name="categoryId" className="form-input" defaultValue="">
// //                   <option value="">Бүх үг</option>
// //                   {categories.map((c) => (
// //                     <option key={c.id} value={c.id}>{c.name}</option>
// //                   ))}
// //                 </select>
// //                 <input name="remindMessage" className="form-input" placeholder="Сануулга: Үгээ цээжлээрэй!" />
// //                 <button type="submit" className="submit-btn" disabled={busy === "challenge"} style={{ marginTop: 0 }}>
// //                   {busy === "challenge" ? "Үүсгэж байна..." : "Сорилт үүсгэх"}
// //                 </button>
// //               </form>

// //               {/* Join challenge */}
// //               <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "#374151" }}>Сорилтонд нэгдэх</div>
// //               <form onSubmit={joinChallenge} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
// //                 <input name="code" className="form-input" placeholder="Invite code (8 тэмдэгт)" required />
// //                 <input
// //                   name="displayName"
// //                   className="form-input"
// //                   placeholder="Таны нэр"
// //                   required
// //                   onChange={(e) => setMemberName(e.target.value)}
// //                 />
// //                 <button type="submit" className="submit-btn" style={{ marginTop: 0 }}>Нэгдэх</button>
// //                 <button type="button" className="submit-btn" style={{ marginTop: 0, background: "#3b82f6", boxShadow: "0 5px 0 #2563eb" }} onClick={subscribeToPush}>
// //                   🔔 Notification асаах
// //                 </button>
// //               </form>
// //             </div>
// //           )}

// //           {/* ── LEADERBOARD / FRIENDS ── */}
// //           {view === "leaderboard" && (
// //             <div className="page">
// //               <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Найзууд & Тэргүүлэгчид</div>
// //               <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600, marginBottom: 20 }}>XP оноогоор эрэмбэлсэн</div>

// //               {/* Nudge */}
// //               {challenges[0] && (
// //                 <div className="nudge-card">
// //                   <div className="nudge-dot" />
// //                   <div>
// //                     <div className="nudge-label">Nudge Alert</div>
// //                     <div className="nudge-text">Найз тань <strong>{challenges[0].host_name}</strong>-аас сорилт ирлээ: "<em>{challenges[0].title}</em>"</div>
// //                     <div className="nudge-time">Дөнгөж сая</div>
// //                   </div>
// //                 </div>
// //               )}

// //               {/* Challenge friend btn */}
// //               <button className="challenge-friend-btn" onClick={() => setView("challenges")}>
// //                 👥 Найзыг сорилтонд урих
// //               </button>

// //               {/* Leaderboard */}
// //               <div className="sec-head" style={{ marginBottom: 14 }}>
// //                 <div className="sec-title" style={{ fontSize: 16 }}>XP жагсаалт</div>
// //               </div>
// //               {[...words]
// //                 .sort((a, b) => b.mastery - a.mastery)
// //                 .slice(0, 15)
// //                 .map((w, i) => (
// //                   <div key={w.id} className="lb-card">
// //                     <div className="lb-rank">
// //                       {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
// //                     </div>
// //                     <div className="lb-avatar">{w.term.charAt(0).toUpperCase()}</div>
// //                     <div style={{ flex: 1 }}>
// //                       <div className="lb-name">{w.term}</div>
// //                       <div className="lb-sub">{w.author_name} · Mastery {w.mastery}/5</div>
// //                     </div>
// //                     <div>
// //                       <div className="lb-xp">{w.mastery * 20}</div>
// //                       <div className="lb-xp-label">XP</div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               {words.length === 0 && (
// //                 <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontWeight: 700 }}>
// //                   Үг байхгүй байна
// //                 </div>
// //               )}
// //             </div>
// //           )}

// //         </main>

// //         {/* BOTTOM NAV */}
// //         <nav className="bottom-nav">
// //           {navItems.map((item) => (
// //             <button
// //               key={item.id}
// //               className={`nav-btn${view === item.id || (view === "add-word" && item.id === "home") ? " active" : ""}`}
// //               onClick={() => setView(item.id)}
// //             >
// //               <div className="nav-btn-icon">{item.icon}</div>
// //               <div className="nav-btn-label">{item.label}</div>
// //             </button>
// //           ))}
// //           <button
// //             className={`nav-btn${view === "add-word" ? " active" : ""}`}
// //             onClick={() => setView("add-word")}
// //           >
// //             <div className="nav-btn-icon">
// //               <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
// //             </div>
// //             <div className="nav-btn-label">Нэмэх</div>
// //           </button>
// //         </nav>
// //       </div>

// //       {notice && <div className="notice-toast">{notice}</div>}
// //     </>
// //   );
// // }

// // /* ── ICON COMPONENTS ── */
// // function HomeIcon() {
// //   return (
// //     <svg viewBox="0 0 24 24">
// //       <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
// //       <polyline points="9,22 9,12 15,12 15,22"/>
// //     </svg>
// //   );
// // }
// // function LibraryIcon() {
// //   return (
// //     <svg viewBox="0 0 24 24">
// //       <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
// //       <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
// //     </svg>
// //   );
// // }
// // function ChallengeIcon() {
// //   return (
// //     <svg viewBox="0 0 24 24">
// //       <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
// //     </svg>
// //   );
// // }
// // function FriendsIcon() {
// //   return (
// //     <svg viewBox="0 0 24 24">
// //       <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
// //       <circle cx="9" cy="7" r="4"/>
// //       <path d="M23 21v-2a4 4 0 00-3-3.87"/>
// //       <path d="M16 3.13a4 4 0 010 7.75"/>
// //     </svg>
// //   );
// // }




// "use client";

// import { FormEvent, startTransition, useMemo, useState, useEffect, useRef } from "react";
// import type { Category, Challenge, Word } from "@/lib/types";
// import { urlBase64ToUint8Array } from "@/lib/client-push";
// import { themes, getCSSVariables, type ThemeMode } from "@/lib/themes";
// import { AuthModal } from "./AuthModal";

// type HomeData = {
//   categories: Category[];
//   words: Word[];
//   challenges: Challenge[];
// };

// type AuthUser = {
//   id: string;
//   name: string;
//   avatar: string | null;
//   bio: string;
// };

// type Mode = "flashcard" | "quiz" | "check";
// type View = "home" | "learn" | "add-word" | "categories" | "challenges" | "leaderboard" | "profile";

// type UserProfile = {
//   name: string;
//   avatar: string | null; // base64 data URL or null
//   bio: string;
//   joinedAt: string;
// };

// const PALETTE = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

// // Mini SVG preview for each theme - rendered inline as theme card backgrounds
// const THEME_PREVIEWS: Record<ThemeMode, { bg: string; card: string; primary: string; text: string; accent: string }> = {
//   light: { bg: "#f5f5f0", card: "#ffffff", primary: "#16a34a", text: "#1a1a1a", accent: "#f59e0b" },
//   dark: { bg: "#0f172a", card: "#1e293b", primary: "#22c55e", text: "#f1f5f9", accent: "#fbbf24" },
//   ocean: { bg: "#f3f8ff", card: "#ffffff", primary: "#2563eb", text: "#0f172a", accent: "#06b6d4" },
//   violet: { bg: "#faf7ff", card: "#ffffff", primary: "#7c3aed", text: "#1f1630", accent: "#ec4899" },
//   sunset: { bg: "#fff7ed", card: "#ffffff", primary: "#f97316", text: "#2b1b12", accent: "#ef4444" },
// };

// function ThemePreviewCard({ themeKey, isActive, onClick }: { themeKey: ThemeMode; isActive: boolean; onClick: () => void }) {
//   const p = THEME_PREVIEWS[themeKey];
//   const t = themes[themeKey];
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       style={{
//         background: "none",
//         border: "none",
//         padding: 0,
//         cursor: "pointer",
//         display: "flex",
//         flexDirection: "column",
//         gap: 6,
//         outline: "none",
//       }}
//     >
//       {/* Mini app preview */}
//       <div
//         style={{
//           width: "100%",
//           borderRadius: 12,
//           overflow: "hidden",
//           border: isActive ? `2px solid ${p.primary}` : "2px solid transparent",
//           boxShadow: isActive ? `0 0 0 3px ${p.primary}33` : "0 2px 8px rgba(0,0,0,0.12)",
//           transition: "all 0.15s",
//           transform: isActive ? "scale(1.02)" : "scale(1)",
//         }}
//       >
//         <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ display: "block" }}>
//           {/* App background */}
//           <rect width="120" height="80" fill={p.bg} />
//           {/* Header bar */}
//           <rect width="120" height="14" fill={p.card} />
//           <rect x="6" y="4" width="28" height="6" rx="2" fill={p.primary} opacity="0.9" />
//           <rect x="92" y="4" width="22" height="6" rx="3" fill={p.accent} opacity="0.7" />
//           {/* Hero card */}
//           <rect x="6" y="18" width="108" height="22" rx="5" fill={p.primary} opacity="0.9" />
//           <rect x="12" y="22" width="40" height="3" rx="1" fill="white" opacity="0.9" />
//           <rect x="12" y="28" width="55" height="5" rx="1" fill="white" opacity="0.7" />
//           {/* Stat tiles */}
//           <rect x="6" y="44" width="50" height="14" rx="4" fill={p.card} />
//           <rect x="10" y="47" width="20" height="2" rx="1" fill={p.text} opacity="0.3" />
//           <rect x="10" y="51" width="30" height="4" rx="1" fill={p.accent} opacity="0.8" />
//           <rect x="62" y="44" width="52" height="14" rx="4" fill={p.card} />
//           <rect x="66" y="47" width="20" height="2" rx="1" fill={p.text} opacity="0.3" />
//           <rect x="66" y="51" width="30" height="4" rx="1" fill={p.primary} opacity="0.8" />
//           {/* Bottom nav */}
//           <rect y="66" width="120" height="14" fill={p.card} />
//           <rect x="12" y="69" width="8" height="8" rx="1" fill={p.primary} opacity="0.7" />
//           <rect x="38" y="69" width="8" height="8" rx="1" fill={p.text} opacity="0.2" />
//           <rect x="64" y="69" width="8" height="8" rx="1" fill={p.text} opacity="0.2" />
//           <rect x="90" y="69" width="8" height="8" rx="1" fill={p.text} opacity="0.2" />
//         </svg>
//       </div>
//       <div style={{
//         fontSize: 12,
//         fontWeight: 800,
//         color: isActive ? p.primary : "var(--text-secondary)",
//         textAlign: "center",
//         letterSpacing: 0.3,
//         transition: "color 0.15s",
//       }}>
//         {t.name}
//         {isActive && " ✓"}
//       </div>
//     </button>
//   );
// }

// export function WordsApp({ initialData }: { initialData: HomeData }) {
//   const [categories, setCategories] = useState(initialData.categories);
//   const [words, setWords] = useState(initialData.words);
//   const [challenges, setChallenges] = useState(initialData.challenges);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [mode, setMode] = useState<Mode>("flashcard");
//   const [cardIndex, setCardIndex] = useState(0);
//   const [revealed, setRevealed] = useState(false);
//   const [quizAnswer, setQuizAnswer] = useState("");
//   const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
//   const [busy, setBusy] = useState("");
//   const [notice, setNotice] = useState("");
//   const [memberName, setMemberName] = useState("");
//   const [view, setView] = useState<View>("home");
//   const [streak, setStreak] = useState(0);
//   const [copiedCode, setCopiedCode] = useState("");
//   const [theme, setTheme] = useState<ThemeMode>("light");
//   const [themePickerOpen, setThemePickerOpen] = useState(false);
//   const [profile, setProfile] = useState<UserProfile>({
//     name: "",
//     avatar: null,
//     bio: "",
//     joinedAt: new Date().toISOString(),
//   });
//   const [profileEditMode, setProfileEditMode] = useState(false);
//   const [editName, setEditName] = useState("");
//   const [editBio, setEditBio] = useState("");
//   const inputRef = useRef<HTMLInputElement>(null);
//   const avatarInputRef = useRef<HTMLInputElement>(null);
//   const [authed, setAuthed] = useState(false);

//     const [authUser, setAuthUser]     = useState<AuthUser | null>(null);
//   const [authChecked, setAuthChecked] = useState(false); 

//     useEffect(() => {
//     fetch("/api/auth/me")
//       .then((r) => r.json())
//       .then((data: { user: AuthUser | null }) => {
//         setAuthUser(data.user ?? null);
//       })
//       .catch(() => setAuthUser(null))
//       .finally(() => setAuthChecked(true));
//   }, []);

//     useEffect(() => {
//     const saved = localStorage.getItem("words-theme") as ThemeMode | null;
//     if (saved && saved in themes) setTheme(saved);
//   }, []);
//   useEffect(() => {
//     localStorage.setItem("words-theme", theme);
//   }, [theme]);
 
//   async function handleLogout() {
//     await fetch("/api/auth/logout", { method: "POST" });
//     setAuthUser(null);
//   }

//     async function handleProfileSave(bio: string, avatar: string | null) {
//     const res = await fetch("/api/auth/profile", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ bio, avatar }),
//     });
//     if (res.ok) {
//       const data = await res.json() as { user: AuthUser };
//       setAuthUser(data.user);
//     }
//   }

  
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("words-theme") as ThemeMode | null;
//     if (savedTheme && savedTheme in themes) setTheme(savedTheme);

//     const savedProfile = localStorage.getItem("words-profile");
//     if (savedProfile) {
//       try { setProfile(JSON.parse(savedProfile)); } catch {}
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("words-theme", theme);
//   }, [theme]);

//   useEffect(() => {
//     localStorage.setItem("words-profile", JSON.stringify(profile));
//   }, [profile]);

//   const cssVars = getCSSVariables(theme);
//   const isDark = theme === "dark";

//   const filteredWords = useMemo(() => {
//     if (selectedCategory === "all") return words;
//     return words.filter((w) => w.category_id === selectedCategory);
//   }, [selectedCategory, words]);

//   const currentWord = filteredWords[cardIndex % Math.max(filteredWords.length, 1)];
//   const masteredCount = words.filter((w) => w.mastery >= 4).length;

//   useEffect(() => {
//     if (notice) {
//       const t = setTimeout(() => setNotice(""), 4000);
//       return () => clearTimeout(t);
//     }
//   }, [notice]);

//   function refreshAfterMutation() {
//     startTransition(() => window.location.reload());
//   }

//   async function postJson<T>(url: string, body: unknown): Promise<T> {
//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });
//     if (!res.ok) {
//       const p = await res.json().catch(() => ({ error: "Request failed." }));
//       throw new Error(p.error ?? "Request failed.");
//     }
//     return res.json();
//   }

//   async function addCategory(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setBusy("category");
//     const form = new FormData(e.currentTarget);
//     const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
//     try {
//       const cat = await postJson<Category>("/api/categories", { name: form.get("name"), color });
//       setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
//       e.currentTarget.reset();
//       setNotice("✓ Анги нэмэгдлээ");
//     } catch (err) {
//       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
//     } finally {
//       setBusy("");
//     }
//   }

//   // async function addWord(e: FormEvent<HTMLFormElement>) {
//   //   e.preventDefault();
//   //   setBusy("word");
//   //   const form = new FormData(e.currentTarget);
//   //   try {
//   //     await postJson<Word>("/api/words", {
//   //       term: form.get("term"),
//   //       meaning: form.get("meaning"),
//   //       example: form.get("example") || "",
//   //       categoryId: form.get("categoryId") || null,
//   //       authorName: profile.name || form.get("authorName") || "Anonymous",
//   //     });
//   //     e.currentTarget.reset();
//   //     setNotice("✓ Үг нэмэгдлээ!");
//   //     refreshAfterMutation();
//   //   } catch (err) {
//   //     setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
//   //   } finally {
//   //     setBusy("");
//   //   }
//   // }

//     async function addWord(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const fd = new FormData(e.currentTarget);
//     const res = await fetch("/api/words", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         term: fd.get("term"),
//         meaning: fd.get("meaning"),
//         example: fd.get("example") || "",
//         categoryId: fd.get("categoryId") || null,
//         // cookie-аас session авна тул authorName fallback
//         authorName: authUser?.name || fd.get("authorName") || "Anonymous",
//       }),
//     });
//     if (res.ok) {
//       e.currentTarget.reset();
//       startTransition(() => window.location.reload());
//     }
//   }

//     if (!authChecked) {
//     return (
//       <div style={{
//         minHeight: "100vh", display: "flex",
//         alignItems: "center", justifyContent: "center",
//         background: "var(--bg, #f5f5f0)",
//         fontFamily: "Nunito, sans-serif",
//         fontSize: 14, color: "#9ca3af", fontWeight: 700,
//       }}>
//         Ачаалж байна…
//       </div>
//     );
//   }

//    if (!authUser) {
//     return (
//       <>
//         {/* CSS variables-г тохируулна */}
//         <style>{`:root { ${getCSSVariables(theme)} }`}</style>
//         <AuthModal onAuth={(user) => setAuthUser(user)} />
//       </>
//     );
//   }
//   async function updateMastery(word: Word, delta: number) {
//     const mastery = Math.min(5, Math.max(0, word.mastery + delta));
//     const res = await fetch(`/api/words/${word.id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ mastery }),
//     });
//     if (res.ok) {
//       setWords((prev) => prev.map((w) => (w.id === word.id ? { ...w, mastery } : w)));
//       if (delta > 0) setStreak((s) => s + 1);
//     }
//   }

//   function nextCard() {
//     setRevealed(false);
//     setQuizAnswer("");
//     setQuizResult(null);
//     setCardIndex((i) => (filteredWords.length ? (i + 1) % filteredWords.length : 0));
//     setTimeout(() => inputRef.current?.focus(), 100);
//   }

//   function checkQuiz() {
//     if (!currentWord) return;
//     const norm = (s: string) => s.trim().toLowerCase();
//     const correct =
//       norm(currentWord.meaning).includes(norm(quizAnswer)) ||
//       norm(quizAnswer).includes(norm(currentWord.meaning));
//     setQuizResult(correct ? "correct" : "wrong");
//     void updateMastery(currentWord, correct ? 1 : -1);
//   }

//   async function createChallenge(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setBusy("challenge");
//     const form = new FormData(e.currentTarget);
//     try {
//       await postJson<Challenge>("/api/challenges", {
//         title: form.get("title"),
//         categoryId: form.get("categoryId") || null,
//         hostName: profile.name || form.get("hostName"),
//         remindMessage: form.get("remindMessage") || "Үгээ цээжлээрэй!",
//       });
//       setNotice("✓ Challenge үүсгэлээ.");
//       refreshAfterMutation();
//     } catch (err) {
//       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
//     } finally {
//       setBusy("");
//     }
//   }

//   async function joinChallenge(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const form = new FormData(e.currentTarget);
//     const code = String(form.get("code") ?? "").trim();
//     const displayName = profile.name || String(form.get("displayName") ?? "").trim();
//     try {
//       await postJson(`/api/challenges/${code}/join`, { displayName });
//       setMemberName(displayName);
//       setNotice("✓ Challenge-д нэгдлээ!");
//       refreshAfterMutation();
//     } catch (err) {
//       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
//     }
//   }

//   async function subscribeToPush() {
//     if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
//       setNotice("Browser push notification дэмжихгүй байна");
//       return;
//     }
//     const name = profile.name || memberName;
//     if (!name.trim()) { setNotice("Эхлээд нэрээ оруулна уу"); return; }
//     const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
//     if (!publicKey) { setNotice("VAPID key тохируулаагүй"); return; }
//     const reg = await navigator.serviceWorker.register("/sw.js");
//     const perm = await Notification.requestPermission();
//     if (perm !== "granted") { setNotice("Notification зөвшөөрөл өгөөгүй"); return; }
//     const sub =
//       (await reg.pushManager.getSubscription()) ??
//       (await reg.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: urlBase64ToUint8Array(publicKey),
//       }));
//     await postJson("/api/push/subscribe", { memberName: name, subscription: sub });
//     setNotice("✓ Notification идэвхжлээ!");
//   }

//   async function sendReminder(code: string) {
//     try {
//       const r = await postJson<{ sent: number }>(`/api/challenges/${code}/remind`, {});
//       setNotice(`✓ ${r.sent} хэрэглэгч рүү сануулга явуулав`);
//     } catch (err) {
//       setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
//     }
//   }

//   function copyInviteLink(code: string) {
//     const url = `${window.location.origin}?join=${code}`;
//     navigator.clipboard.writeText(url);
//     setCopiedCode(code);
//     setTimeout(() => setCopiedCode(""), 2000);
//   }

//   function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       const result = ev.target?.result as string;
//       setProfile((p) => ({ ...p, avatar: result }));
//       setNotice("✓ Зураг хадгалагдлаа");
//     };
//     reader.readAsDataURL(file);
//   }

//   function saveProfile() {
//     setProfile((p) => ({
//       ...p,
//       name: editName || p.name,
//       bio: editBio || p.bio,
//     }));
//     setProfileEditMode(false);
//     setNotice("✓ Профайл хадгалагдлаа");
//   }

//   function AvatarDisplay({ size = 36, onClick }: { size?: number; onClick?: () => void }) {
//     if (profile.avatar) {
//       return (
//         <img
//           src={profile.avatar}
//           onClick={onClick}
//           style={{
//             width: size, height: size,
//             borderRadius: "50%",
//             objectFit: "cover",
//             border: "2px solid var(--primary-soft-border)",
//             cursor: onClick ? "pointer" : "default",
//             flexShrink: 0,
//           }}
//           alt={profile.name || "User"}
//         />
//       );
//     }
//     return (
//       <div
//         onClick={onClick}
//         style={{
//           width: size, height: size,
//           borderRadius: "50%",
//           background: "var(--primary-soft)",
//           border: "2px solid var(--primary-soft-border)",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           fontSize: size * 0.4,
//           fontWeight: 900,
//           color: "var(--primary)",
//           cursor: onClick ? "pointer" : "default",
//           flexShrink: 0,
//         }}
//       >
//         {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
//       </div>
//     );
//   }

//   const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
//     { id: "home", label: "Нүүр", icon: <HomeIcon /> },
//     { id: "learn", label: "Номын сан", icon: <LibraryIcon /> },
//     { id: "challenges", label: "Сорилт", icon: <ChallengeIcon /> },
//     { id: "leaderboard", label: "Найзууд", icon: <FriendsIcon /> },
//   ];

//   const masteryColor = (m: number) => {
//     if (m === 0) return "var(--border)";
//     if (m <= 2) return "var(--accent)";
//     if (m <= 4) return "var(--primary)";
//     return "var(--primary-dark)";
//   };

//   const xpTotal = words.reduce((t, w) => t + w.mastery * 20, 0);
//   const dailyGoalPct = Math.min(100, Math.round((masteredCount / Math.max(words.length, 1)) * 100));

//    if (!authUser) {
//     return (
//       <>
//         {/* CSS variables-г тохируулна */}
//         <style>{`:root { ${getCSSVariables(theme)} }`}</style>
//         <AuthModal onAuth={(user) => setAuthUser(user)} />
//       </>
//     );
//   }
  
//   return (
//     <>
//       <style>{`
//         :root { ${cssVars} }
//         @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         body { background: var(--bg); color: var(--text); font-family: 'Nunito', 'Segoe UI', sans-serif; min-height: 100vh; }
//         .app { display: flex; flex-direction: column; min-height: 100vh; }
//         .app-header { background: var(--bg-secondary); border-bottom: 2px solid var(--border); padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
//         .app-header-logo { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 900; color: var(--primary); letter-spacing: -0.5px; }
//         .app-header-logo span { color: var(--text); }
//         .app-header-right { display: flex; align-items: center; gap: 10px; }
//         .icon-btn { width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg-secondary); color: var(--text); cursor: pointer; font-size: 17px; display: flex; align-items: center; justify-content: center; transition: border-color 0.15s; }
//         .icon-btn:hover { border-color: var(--primary); }
//         .xp-badge { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 800; color: var(--accent); background: var(--accent-soft); border: 2px solid var(--accent-soft-border); border-radius: 100px; padding: 4px 12px; }
//         .streak-pill { display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 800; color: var(--accent-dark); background: var(--accent-soft); border: 2px solid var(--accent-soft-border); border-radius: 100px; padding: 4px 12px; }

//         /* Theme picker */
//         .theme-picker-overlay { position: sticky; top: 56px; z-index: 120; padding: 0 16px; }
//         .theme-picker { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 20px; padding: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); margin-top: 8px; }
//         .theme-picker-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
//         .theme-picker-title { font-size: 15px; font-weight: 900; color: var(--text); }
//         .theme-picker-close { border: 2px solid var(--border); background: var(--bg); color: var(--text); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
//         .theme-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }

//         .app-body { flex: 1; overflow-y: auto; padding-bottom: 80px; }
//         .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-secondary); border-top: 2px solid var(--border); display: flex; z-index: 100; height: 64px; }
//         .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: transparent; border: none; cursor: pointer; padding: 8px 4px; position: relative; transition: transform 0.1s; }
//         .nav-btn:active { transform: scale(0.92); }
//         .nav-btn-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
//         .nav-btn-icon svg { width: 24px; height: 24px; fill: none; stroke: var(--text-secondary); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: stroke 0.15s; }
//         .nav-btn.active .nav-btn-icon svg { stroke: var(--primary); }
//         .nav-btn-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); transition: color 0.15s; letter-spacing: 0.2px; }
//         .nav-btn.active .nav-btn-label { color: var(--primary); }
//         .nav-btn.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 32px; height: 3px; background: var(--primary); border-radius: 2px 2px 0 0; }

//         .page { padding: 20px 20px 0; max-width: 640px; margin: 0 auto; }
//         .streak-hero { background: var(--primary); border-radius: 20px; padding: 20px; margin-bottom: 20px; color: var(--white); position: relative; overflow: hidden; }
//         .streak-hero::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; }
//         .streak-eyebrow { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.8; margin-bottom: 6px; }
//         .streak-main { font-size: 22px; font-weight: 900; margin-bottom: 16px; }
//         .streak-sub { font-size: 13px; opacity: 0.85; line-height: 1.5; margin-bottom: 16px; }
//         .continue-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--white); color: var(--primary); font-size: 15px; font-weight: 800; border: none; border-radius: 12px; padding: 12px 20px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.15); }
//         .continue-btn:hover { transform: translateY(-1px); }
//         .continue-btn:active { transform: translateY(2px); }
//         .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
//         .stat-tile { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 16px; padding: 16px; }
//         .stat-tile-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
//         .stat-tile-val { font-size: 28px; font-weight: 900; line-height: 1; margin-bottom: 4px; }
//         .stat-tile-sub { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
//         .goal-tile { grid-column: 1 / -1; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 16px; padding: 16px; }
//         .goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
//         .goal-label { font-size: 14px; font-weight: 700; color: var(--text); }
//         .goal-pct { font-size: 14px; font-weight: 800; color: var(--primary); }
//         .goal-bar { height: 10px; background: var(--border); border-radius: 100px; overflow: hidden; }
//         .goal-fill { height: 100%; background: var(--primary); border-radius: 100px; transition: width 0.6s cubic-bezier(.34,1.56,.64,1); }
//         .sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
//         .sec-title { font-size: 18px; font-weight: 900; color: var(--text); }
//         .sec-link { font-size: 13px; font-weight: 700; color: var(--primary); background: none; border: none; cursor: pointer; }
//         .word-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
//         .word-card { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color 0.15s, transform 0.1s; position: relative; }
//         .word-card:hover { border-color: var(--primary-soft-border); transform: translateY(-1px); }
//         .word-card:active { transform: scale(0.99); }
//         .word-card-icon { width: 44px; height: 44px; background: var(--primary-soft); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; border: 2px solid var(--primary-soft-border); }
//         .word-card-body { flex: 1; min-width: 0; }
//         .word-card-term { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 2px; }
//         .word-card-meaning { font-size: 13px; color: var(--text-secondary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//         .word-card-mastery { display: flex; gap: 3px; flex-shrink: 0; }
//         .ms-dot { width: 8px; height: 8px; border-radius: 50%; }
//         .word-card-author { position: absolute; bottom: 8px; right: 10px; display: flex; align-items: center; gap: 5px; }

//         .trending-card { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 20px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; }
//         .trending-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--accent-soft); color: var(--accent-dark); font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 100px; margin-bottom: 10px; text-transform: uppercase; }
//         .trending-title { font-size: 26px; font-weight: 900; color: var(--text); margin-bottom: 8px; }
//         .trending-desc { font-size: 13px; color: var(--text-secondary); font-weight: 600; line-height: 1.5; margin-bottom: 16px; }
//         .trending-meta { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
//         .trending-arrow { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
//         .trending-arrow svg { stroke: var(--white); width: 18px; height: 18px; fill: none; stroke-width: 2.5; }

//         .flashcard-wrap { padding: 20px; }
//         .cat-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 16px; scrollbar-width: none; }
//         .cat-chips::-webkit-scrollbar { display: none; }
//         .cat-chip { padding: 6px 14px; border-radius: 100px; border: 2px solid var(--border); background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
//         .cat-chip:hover { border-color: var(--primary-soft-border); color: var(--primary); }
//         .cat-chip.active { background: var(--primary); border-color: var(--primary); color: var(--white); }
//         .cat-chip-dot { width: 8px; height: 8px; border-radius: 50%; }
//         .mode-tabs { display: flex; background: var(--muted); border-radius: 12px; padding: 4px; gap: 3px; margin-bottom: 20px; }
//         .mode-tab { flex: 1; padding: 9px 8px; border-radius: 9px; border: none; background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.15s; font-family: inherit; }
//         .mode-tab.active { background: var(--bg-secondary); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

//         .big-flashcard { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 24px; padding: 40px 32px; min-height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; cursor: pointer; transition: border-color 0.2s; margin-bottom: 16px; position: relative; }
//         .big-flashcard:hover { border-color: var(--primary-soft-border); }
//         .new-word-tag { position: absolute; top: 16px; right: 16px; background: var(--primary-soft); color: var(--primary); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 100px; border: 2px solid var(--primary-soft-border); text-transform: uppercase; }
//         .card-phonetic { font-size: 14px; color: var(--text-secondary); font-weight: 600; margin-bottom: 8px; }
//         .card-term { font-size: 40px; font-weight: 900; color: var(--text); margin-bottom: 8px; letter-spacing: -1px; }
//         .card-reveal-hint { font-size: 14px; color: var(--text-secondary); font-weight: 600; }
//         .card-meaning { font-size: 18px; color: var(--text); font-weight: 700; line-height: 1.5; margin-top: 16px; padding-top: 16px; border-top: 2px solid var(--muted); width: 100%; }
//         .card-example { font-size: 14px; color: var(--text-secondary); font-style: italic; margin-top: 10px; line-height: 1.6; }

//         .flashcard-author { position: absolute; bottom: 12px; left: 14px; display: flex; align-items: center; gap: 6px; }
//         .flashcard-author-name { font-size: 11px; color: var(--text-secondary); font-weight: 700; }

//         .card-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; }
//         .nav-arrow { width: 52px; height: 52px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
//         .nav-arrow:hover { border-color: var(--primary-soft-border); background: var(--primary-soft); }
//         .nav-arrow svg { stroke: var(--text); width: 20px; height: 20px; fill: none; stroke-width: 2.5; }
//         .card-counter { font-size: 15px; font-weight: 800; color: var(--text); }
//         .action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
//         .btn-know { padding: 16px; border-radius: 16px; border: none; background: var(--primary); color: var(--white); font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; box-shadow: 0 4px 0 var(--primary-dark); transition: transform 0.1s; }
//         .btn-know:hover { transform: translateY(-1px); }
//         .btn-know:active { transform: translateY(3px); }
//         .btn-again { padding: 16px; border-radius: 16px; border: 2px solid var(--border); background: var(--bg-secondary); color: var(--text); font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; box-shadow: 0 4px 0 var(--border); transition: transform 0.1s; }
//         .btn-again:active { transform: translateY(3px); }

//         .quiz-input { width: 100%; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 14px; padding: 14px 16px; color: var(--text); font-size: 16px; font-weight: 600; outline: none; transition: border-color 0.15s; font-family: inherit; margin-top: 16px; }
//         .quiz-input:focus { border-color: var(--primary); }
//         .quiz-input.correct { border-color: var(--primary); background: var(--primary-soft); }
//         .quiz-input.wrong { border-color: var(--error); background: var(--error-soft); }
//         .check-btn { width: 100%; margin-top: 10px; padding: 16px; border-radius: 16px; border: none; background: var(--primary); color: var(--white); font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; box-shadow: 0 4px 0 var(--primary-dark); }
//         .result-bar { margin-top: 12px; padding: 12px 16px; border-radius: 12px; font-size: 15px; font-weight: 700; }
//         .result-bar.correct { background: var(--primary-soft); color: var(--primary); border: 2px solid var(--primary-soft-border); }
//         .result-bar.wrong { background: var(--error-soft); color: var(--error); border: 2px solid var(--error-soft-border); }

//         .form-page { padding: 20px; max-width: 600px; margin: 0 auto; }
//         .form-title { font-size: 22px; font-weight: 900; margin-bottom: 6px; color: var(--text); }
//         .form-sub { font-size: 14px; color: var(--text-secondary); font-weight: 600; margin-bottom: 24px; }
//         .form-group { margin-bottom: 16px; }
//         .form-label { display: block; font-size: 13px; font-weight: 800; color: var(--text); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
//         .form-input { width: 100%; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 12px; padding: 13px 16px; color: var(--text); font-size: 15px; font-weight: 600; outline: none; transition: border-color 0.15s; font-family: inherit; }
//         .form-input:focus { border-color: var(--primary); }
//         .form-input::placeholder { color: var(--muted-text); font-weight: 500; }
//         textarea.form-input { min-height: 90px; resize: vertical; }
//         select.form-input { cursor: pointer; }
//         .submit-btn { width: 100%; padding: 16px; border-radius: 16px; border: none; background: var(--primary); color: var(--white); font-size: 16px; font-weight: 900; cursor: pointer; font-family: inherit; box-shadow: 0 5px 0 var(--primary-dark); transition: transform 0.1s; margin-top: 8px; }
//         .submit-btn:hover { transform: translateY(-1px); }
//         .submit-btn:active { transform: translateY(4px); }
//         .submit-btn:disabled { background: var(--muted-text); box-shadow: none; cursor: not-allowed; }

//         /* Profile page */
//         .profile-hero { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 24px; padding: 24px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
//         .profile-avatar-wrap { position: relative; }
//         .profile-avatar-edit { position: absolute; bottom: 0; right: 0; width: 26px; height: 26px; background: var(--primary); border-radius: 50%; border: 2px solid var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; }
//         .profile-name { font-size: 22px; font-weight: 900; color: var(--text); }
//         .profile-bio { font-size: 14px; color: var(--text-secondary); font-weight: 600; text-align: center; line-height: 1.5; }
//         .profile-joined { font-size: 12px; color: var(--muted-text); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
//         .profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
//         .profile-stat { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 16px; padding: 14px; text-align: center; }
//         .profile-stat-val { font-size: 24px; font-weight: 900; color: var(--primary); }
//         .profile-stat-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
//         .edit-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; background: var(--primary-soft); color: var(--primary); border: 2px solid var(--primary-soft-border); border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.15s; }
//         .edit-btn:hover { background: var(--primary); color: var(--white); }

//         .challenge-card { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 20px; padding: 20px; margin-bottom: 14px; }
//         .challenge-title { font-size: 17px; font-weight: 900; color: var(--text); margin-bottom: 4px; }
//         .challenge-host { font-size: 13px; color: var(--text-secondary); font-weight: 600; margin-bottom: 14px; }
//         .invite-code-row { background: var(--muted); border: 2px solid var(--border); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
//         .invite-code-text { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; letter-spacing: 4px; color: var(--primary); }
//         .copy-btn { background: var(--primary); color: var(--white); border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 800; cursor: pointer; font-family: inherit; }
//         .copy-btn.copied { background: var(--accent); }
//         .members-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
//         .member-pill { background: var(--muted); color: var(--text); font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
//         .remind-btn { width: 100%; padding: 13px; background: var(--accent); color: var(--white); border: none; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; box-shadow: 0 4px 0 var(--accent-dark); }

//         .lb-card { background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 10px; transition: border-color 0.15s; }
//         .lb-card:hover { border-color: var(--primary-soft-border); }
//         .lb-rank { font-size: 22px; font-weight: 900; min-width: 36px; text-align: center; color: var(--text-secondary); }
//         .lb-name { flex: 1; font-size: 15px; font-weight: 800; color: var(--text); }
//         .lb-sub { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
//         .lb-xp { font-size: 16px; font-weight: 900; color: var(--accent); }
//         .lb-xp-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-align: right; }

//         .notice-toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--dark-surface); color: var(--white); font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 100px; z-index: 300; white-space: nowrap; animation: popUp 0.25s cubic-bezier(.34,1.56,.64,1); }
//         @keyframes popUp { from { opacity:0; transform: translateX(-50%) translateY(12px) scale(0.9); } to { opacity:1; transform: translateX(-50%) translateY(0) scale(1); } }
//         .divider { border: none; border-top: 2px solid var(--muted); margin: 20px 0; }
//         .nudge-card { background: var(--bg-secondary); border: 2px solid var(--primary-soft-border); border-radius: 16px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
//         .nudge-dot { width: 10px; height: 10px; background: var(--primary); border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
//         .nudge-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); margin-bottom: 4px; }
//         .nudge-text { font-size: 14px; font-weight: 600; color: var(--text); }
//         .nudge-time { font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-top: 2px; }
//         .challenge-friend-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 16px; background: var(--accent); color: var(--white); border: none; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; box-shadow: 0 5px 0 var(--accent-dark); transition: transform 0.1s; margin-bottom: 20px; }
//         .challenge-friend-btn:hover { transform: translateY(-1px); }
//         .challenge-friend-btn:active { transform: translateY(4px); }
//         @media (min-width: 640px) { .app-header { padding: 0 32px; } .page, .form-page, .flashcard-wrap { padding: 24px; } }
//       `}</style>

//       <div className="app">
//         {/* TOP HEADER */}
//         <header className="app-header">
//           <div className="app-header-logo">
//             Linguist<span>.</span>
//           </div>
//           <div className="app-header-right">
//             {/* Theme picker button */}
//             <button
//               className="icon-btn"
//               onClick={() => setThemePickerOpen((v) => !v)}
//               title="Theme сонгох"
//               type="button"
//             >
//               🎨
//             </button>

//             {streak > 0 && <div className="streak-pill">🔥 {streak}</div>}

//             <div className="xp-badge">
//               <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
//                 <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6" />
//               </svg>
//               {xpTotal} XP
//             </div>

//             {/* Avatar in header -> go to profile */}
//             <div style={{ cursor: "pointer" }} onClick={() => setView("profile")}>
//               <AvatarDisplay size={36} />
//             </div>
//           </div>
//         </header>

//         {/* THEME PICKER DROPDOWN */}
//         {themePickerOpen && (
//           <div className="theme-picker-overlay">
//             <div className="theme-picker">
//               <div className="theme-picker-head">
//                 <div className="theme-picker-title">🎨 Theme сонгох</div>
//                 <button
//                   type="button"
//                   className="theme-picker-close"
//                   onClick={() => setThemePickerOpen(false)}
//                 >
//                   ✕
//                 </button>
//               </div>
//               <div className="theme-grid">
//                 {(Object.keys(themes) as ThemeMode[]).map((key) => (
//                   <ThemePreviewCard
//                     key={key}
//                     themeKey={key}
//                     isActive={theme === key}
//                     onClick={() => {
//                       setTheme(key);
//                       setThemePickerOpen(false);
//                     }}
//                   />
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         <main className="app-body">

//           {/* ── HOME ── */}
//           {view === "home" && (
//             <div className="page">
//               <div className="streak-hero">
//                 <div className="streak-eyebrow">Одоогийн streak</div>
//                 <div className="streak-main">
//                   {profile.name ? `Сайн уу, ${profile.name}! ` : ""}
//                   {streak > 0 ? `${streak} өдөр дараалал!` : "Өнөөдөр эхэл!"}
//                 </div>
//                 <div className="streak-sub">
//                   {streak > 0
//                     ? "Та энэ долоо хоногийн шилдэг 10%-д байна. Дөлийгөө унтраахгүй!"
//                     : "Өдөр бүр суралцаж streak-ийн дөлийг асаагаарай."}
//                 </div>
//                 <button className="continue-btn" onClick={() => setView("learn")}>
//                   Суралцах үргэлжлүүлэх →
//                 </button>
//               </div>

//               <div className="stats-row">
//                 <div className="stat-tile">
//                   <div className="stat-tile-label">Нийт XP</div>
//                   <div className="stat-tile-val" style={{ color: "var(--accent)" }}>{xpTotal.toLocaleString()}</div>
//                   <div className="stat-tile-sub">XP нийт</div>
//                 </div>
//                 <div className="stat-tile">
//                   <div className="stat-tile-label">Цээжилсэн</div>
//                   <div className="stat-tile-val" style={{ color: "var(--primary)" }}>{masteredCount}</div>
//                   <div className="stat-tile-sub">/{words.length} үг</div>
//                 </div>
//                 <div className="goal-tile">
//                   <div className="goal-header">
//                     <div className="goal-label">Өдрийн зорилго</div>
//                     <div className="goal-pct">{dailyGoalPct}%</div>
//                   </div>
//                   <div className="goal-bar">
//                     <div className="goal-fill" style={{ width: `${dailyGoalPct}%` }} />
//                   </div>
//                 </div>
//               </div>

//               <div className="sec-head">
//                 <div className="sec-title">Өнөөдрийн зам</div>
//                 <button className="sec-link" onClick={() => setView("learn")}>Номын сан харах ↗</button>
//               </div>
//               <div className="word-list">
//                 {words.slice(0, 5).map((w) => (
//                   <div key={w.id} className="word-card" onClick={() => setView("learn")}>
//                     <div className="word-card-icon">📖</div>
//                     <div className="word-card-body">
//                       <div className="word-card-term">{w.term}</div>
//                       <div className="word-card-meaning">{w.meaning}</div>
//                     </div>
//                     <div className="word-card-mastery">
//                       {[1,2,3,4,5].map((i) => (
//                         <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "var(--border)" }} />
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//                 {words.length === 0 && (
//                   <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
//                     <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
//                     <div style={{ fontWeight: 700 }}>Үг байхгүй байна</div>
//                     <button className="submit-btn" style={{ marginTop: 16, maxWidth: 200 }} onClick={() => setView("add-word")}>
//                       + Үг нэмэх
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* ── LIBRARY ── */}
//           {view === "learn" && (
//             <div className="flashcard-wrap">
//               <div className="cat-chips">
//                 <button className={`cat-chip${selectedCategory === "all" ? " active" : ""}`} onClick={() => { setSelectedCategory("all"); setCardIndex(0); }}>
//                   Бүгд ({words.length})
//                 </button>
//                 {categories.map((c) => (
//                   <button
//                     key={c.id}
//                     className={`cat-chip${selectedCategory === c.id ? " active" : ""}`}
//                     onClick={() => { setSelectedCategory(c.id); setCardIndex(0); }}
//                   >
//                     <span className="cat-chip-dot" style={{ background: c.color }} />
//                     {c.name}
//                   </button>
//                 ))}
//               </div>

//               {categories[0] && (
//                 <div className="trending-card" style={{ marginBottom: 16 }}>
//                   <div className="trending-badge">⭐ Trending</div>
//                   <div className="trending-title">{categories[0].name}</div>
//                   <div className="trending-desc">Хамтын нийгэмлэгийн үгийн сангаас суралцаарай.</div>
//                   <div className="trending-meta">{words.filter(w => w.category_id === categories[0].id).length} үг</div>
//                   <button className="trending-arrow" onClick={() => { setSelectedCategory(categories[0].id); setCardIndex(0); }}>
//                     <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6" /></svg>
//                   </button>
//                 </div>
//               )}

//               <div className="mode-tabs">
//                 {(["flashcard", "quiz", "check"] as Mode[]).map((m) => (
//                   <button key={m} className={`mode-tab${mode === m ? " active" : ""}`} onClick={() => setMode(m)}>
//                     {m === "flashcard" ? "Флаш карт" : m === "quiz" ? "Quiz" : "Self-check"}
//                   </button>
//                 ))}
//               </div>

//               {currentWord ? (
//                 <>
//                   <div className="big-flashcard" onClick={() => mode === "flashcard" && setRevealed((r) => !r)}>
//                     <div className="new-word-tag">NEW WORD</div>
//                     {currentWord.category_name && (
//                       <div className="card-phonetic">{currentWord.category_name}</div>
//                     )}
//                     <div className="card-term">{currentWord.term}</div>

//                     {mode === "flashcard" && (
//                       revealed ? (
//                         <>
//                           <div className="card-meaning">{currentWord.meaning}</div>
//                           {currentWord.example && <div className="card-example">"{currentWord.example}"</div>}
//                         </>
//                       ) : (
//                         <div className="card-reveal-hint">Дарж орчуулгыг харах</div>
//                       )
//                     )}

//                     {mode === "quiz" && (
//                       <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
//                         <input
//                           ref={inputRef}
//                           className={`quiz-input${quizResult === "correct" ? " correct" : quizResult === "wrong" ? " wrong" : ""}`}
//                           value={quizAnswer}
//                           onChange={(e) => setQuizAnswer(e.target.value)}
//                           onKeyDown={(e) => e.key === "Enter" && !quizResult && checkQuiz()}
//                           placeholder="Монгол утгыг бич..."
//                           disabled={!!quizResult}
//                         />
//                         {!quizResult && <button className="check-btn" onClick={checkQuiz}>Шалгах</button>}
//                         {quizResult && (
//                           <div className={`result-bar ${quizResult}`}>
//                             {quizResult === "correct" ? "✓ Зөв! +20 XP" : `✗ Зөв хариулт: ${currentWord.meaning}`}
//                           </div>
//                         )}
//                       </div>
//                     )}

//                     {mode === "check" && !revealed && (
//                       <div onClick={(e) => e.stopPropagation()}>
//                         <button className="continue-btn" style={{ marginTop: 16 }} onClick={(e) => { e.stopPropagation(); setRevealed(true); }}>
//                           Орчуулга харах
//                         </button>
//                       </div>
//                     )}
//                     {mode === "check" && revealed && (
//                       <div className="card-meaning">{currentWord.meaning}</div>
//                     )}

//                     {/* Author avatar on flashcard — bottom left */}
//                     {currentWord.author_name && (
//                       <div className="flashcard-author">
//                         <div style={{
//                           width: 24, height: 24, borderRadius: "50%",
//                           background: "var(--primary-soft)",
//                           border: "2px solid var(--primary-soft-border)",
//                           display: "flex", alignItems: "center", justifyContent: "center",
//                           fontSize: 11, fontWeight: 900, color: "var(--primary)",
//                         }}>
//                           {currentWord.author_name.charAt(0).toUpperCase()}
//                         </div>
//                         <span className="flashcard-author-name">{currentWord.author_name}</span>
//                       </div>
//                     )}
//                   </div>

//                   <div className="card-nav">
//                     <button className="nav-arrow" onClick={() => setCardIndex((i) => (i - 1 + filteredWords.length) % filteredWords.length)}>
//                       <svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6" /></svg>
//                     </button>
//                     <div className="card-counter">{(cardIndex % filteredWords.length) + 1} / {filteredWords.length}</div>
//                     <button className="nav-arrow" onClick={nextCard}>
//                       <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6" /></svg>
//                     </button>
//                   </div>

//                   {mode === "check" && revealed && (
//                     <div className="action-btns">
//                       <button className="btn-know" onClick={() => { void updateMastery(currentWord, 1); nextCard(); }}>✓ Мэдэж байна</button>
//                       <button className="btn-again" onClick={() => { void updateMastery(currentWord, -1); nextCard(); }}>✗ Дахин давтана</button>
//                     </div>
//                   )}

//                   {(mode === "flashcard" || (mode === "quiz" && quizResult)) && (
//                     <button className="btn-know" style={{ width: "100%", marginTop: 10 }} onClick={nextCard}>
//                       Дараагийн үг →
//                     </button>
//                   )}

//                   <hr className="divider" />
//                   <div className="sec-head" style={{ marginBottom: 12 }}>
//                     <div className="sec-title" style={{ fontSize: 16 }}>Бүх үгс</div>
//                   </div>
//                   <div className="word-list">
//                     {filteredWords.map((w) => (
//                       <div key={w.id} className="word-card" style={{ paddingBottom: w.author_name ? 28 : 16 }}>
//                         <div className="word-card-icon">📝</div>
//                         <div className="word-card-body">
//                           <div className="word-card-term">{w.term}</div>
//                           <div className="word-card-meaning">{w.meaning}</div>
//                         </div>
//                         <div className="word-card-mastery">
//                           {[1,2,3,4,5].map((i) => (
//                             <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "var(--border)" }} />
//                           ))}
//                         </div>
//                         {/* Author avatar — bottom right of word card */}
//                         {w.author_name && (
//                           <div className="word-card-author">
//                             <div style={{
//                               width: 20, height: 20, borderRadius: "50%",
//                               background: "var(--primary-soft)",
//                               border: "2px solid var(--primary-soft-border)",
//                               display: "flex", alignItems: "center", justifyContent: "center",
//                               fontSize: 9, fontWeight: 900, color: "var(--primary)",
//                             }}>
//                               {w.author_name.charAt(0).toUpperCase()}
//                             </div>
//                             <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>{w.author_name}</span>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               ) : (
//                 <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
//                   <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
//                   <div style={{ fontWeight: 700, fontSize: 16 }}>Энэ ангилалд үг байхгүй</div>
//                   <button className="submit-btn" style={{ marginTop: 16, maxWidth: 200, margin: "16px auto 0" }} onClick={() => setView("add-word")}>
//                     + Үг нэмэх
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ── ADD WORD ── */}
//           {view === "add-word" && (
//             <div className="form-page">
//               <div className="form-title">Үг нэмэх</div>
//               <div className="form-sub">Нэмсэн үг бүх хэрэглэгчид харагдана</div>
//               <form onSubmit={addWord}>
//                 <div className="form-group">
//                   <label className="form-label">Үг / Term</label>
//                   <input name="term" className="form-input" placeholder="serendipity, ephemeral..." required />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Утга / Meaning</label>
//                   <textarea name="meaning" className="form-input" placeholder="Монгол утга эсвэл тайлбар..." required />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Жишээ өгүүлбэр (заавал биш)</label>
//                   <input name="example" className="form-input" placeholder="It was serendipity that we met..." />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Ангилал</label>
//                   <select name="categoryId" className="form-input" defaultValue="">
//                     <option value="">Ангилалгүй</option>
//                     {categories.map((c) => (
//                       <option key={c.id} value={c.id}>{c.name}</option>
//                     ))}
//                   </select>
//                 </div>
//                 {!profile.name && (
//                   <div className="form-group">
//                     <label className="form-label">Таны нэр</label>
//                     <input name="authorName" className="form-input" placeholder="Анонимаар оруулах бол хоосон орхиж болно" />
//                   </div>
//                 )}
//                 {profile.name && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--primary-soft)", border: "2px solid var(--primary-soft-border)", borderRadius: 12, marginBottom: 16 }}>
//                     <AvatarDisplay size={32} />
//                     <div>
//                       <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{profile.name} нэрийн дор нэмэгдэнэ</div>
//                       <button type="button" onClick={() => setView("profile")} style={{ background: "none", border: "none", fontSize: 11, color: "var(--primary)", cursor: "pointer", fontWeight: 700, padding: 0 }}>
//                         Профайл засах ↗
//                       </button>
//                     </div>
//                   </div>
//                 )}
//                 <button type="submit" className="submit-btn" disabled={busy === "word"}>
//                   {busy === "word" ? "Нэмж байна..." : "Нийтэд нэмэх"}
//                 </button>
//               </form>

//               <hr className="divider" />
//               <div className="form-title" style={{ fontSize: 18, marginBottom: 6 }}>Анги нэмэх</div>
//               <form onSubmit={addCategory} style={{ display: "flex", gap: 10 }}>
//                 <input name="name" className="form-input" placeholder="Business, IELTS, Travel..." required style={{ flex: 1 }} />
//                 <button type="submit" className="submit-btn" disabled={busy === "category"} style={{ width: "auto", padding: "13px 20px", marginTop: 0 }}>
//                   {busy === "category" ? "..." : "+ Нэмэх"}
//                 </button>
//               </form>
//             </div>
//           )}

//           {/* ── PROFILE ── */}
//           {view === "profile" && (
//             <div className="form-page">
//               <div className="profile-hero">
//                 <div className="profile-avatar-wrap">
//                   <AvatarDisplay size={88} onClick={() => avatarInputRef.current?.click()} />
//                   <div className="profile-avatar-edit" onClick={() => avatarInputRef.current?.click()}>
//                     ✏️
//                   </div>
//                   <input
//                     ref={avatarInputRef}
//                     type="file"
//                     accept="image/*"
//                     style={{ display: "none" }}
//                     onChange={handleAvatarUpload}
//                   />
//                 </div>
//                 {!profileEditMode ? (
//                   <>
//                     <div className="profile-name">{profile.name || "Нэргүй хэрэглэгч"}</div>
//                     {profile.bio && <div className="profile-bio">{profile.bio}</div>}
//                     <div className="profile-joined">
//                       {new Date(profile.joinedAt).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}
//                     </div>
//                     <button
//                       className="edit-btn"
//                       onClick={() => {
//                         setEditName(profile.name);
//                         setEditBio(profile.bio);
//                         setProfileEditMode(true);
//                       }}
//                     >
//                       ✏️ Профайл засах
//                     </button>
//                   </>
//                 ) : (
//                   <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
//                     <input
//                       className="form-input"
//                       placeholder="Нэр оруулах..."
//                       value={editName}
//                       onChange={(e) => setEditName(e.target.value)}
//                     />
//                     <textarea
//                       className="form-input"
//                       placeholder="Өөрийгөө товч танилцуулах..."
//                       value={editBio}
//                       onChange={(e) => setEditBio(e.target.value)}
//                       style={{ minHeight: 70 }}
//                     />
//                     <div style={{ display: "flex", gap: 10 }}>
//                       <button className="submit-btn" style={{ marginTop: 0 }} onClick={saveProfile}>
//                         ✓ Хадгалах
//                       </button>
//                       <button
//                         className="submit-btn"
//                         style={{ marginTop: 0, background: "var(--muted)", color: "var(--text)", boxShadow: "0 5px 0 var(--border)" }}
//                         onClick={() => setProfileEditMode(false)}
//                       >
//                         Болих
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Stats */}
//               <div className="profile-stats">
//                 <div className="profile-stat">
//                   <div className="profile-stat-val">{xpTotal}</div>
//                   <div className="profile-stat-label">XP</div>
//                 </div>
//                 <div className="profile-stat">
//                   <div className="profile-stat-val">{masteredCount}</div>
//                   <div className="profile-stat-label">Цээжилсэн</div>
//                 </div>
//                 <div className="profile-stat">
//                   <div className="profile-stat-val">{words.length}</div>
//                   <div className="profile-stat-label">Нийт үг</div>
//                 </div>
//               </div>

//               {/* Theme picker section */}
//               <div style={{ marginBottom: 20 }}>
//                 <div className="sec-head" style={{ marginBottom: 14 }}>
//                   <div className="sec-title" style={{ fontSize: 16 }}>🎨 Theme</div>
//                 </div>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
//                   {(Object.keys(themes) as ThemeMode[]).map((key) => (
//                     <ThemePreviewCard
//                       key={key}
//                       themeKey={key}
//                       isActive={theme === key}
//                       onClick={() => setTheme(key)}
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Words I added */}
//               <div className="sec-head" style={{ marginBottom: 14 }}>
//                 <div className="sec-title" style={{ fontSize: 16 }}>Миний нэмсэн үгс</div>
//               </div>
//               <div className="word-list">
//                 {words.filter(w => w.author_name === profile.name).length === 0 && (
//                   <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-secondary)", fontWeight: 700 }}>
//                     Та одоогоор үг нэмээгүй байна
//                   </div>
//                 )}
//                 {words.filter(w => w.author_name === profile.name).map((w) => (
//                   <div key={w.id} className="word-card">
//                     <div className="word-card-icon">📝</div>
//                     <div className="word-card-body">
//                       <div className="word-card-term">{w.term}</div>
//                       <div className="word-card-meaning">{w.meaning}</div>
//                     </div>
//                     <div className="word-card-mastery">
//                       {[1,2,3,4,5].map((i) => (
//                         <div key={i} className="ms-dot" style={{ background: i <= w.mastery ? masteryColor(w.mastery) : "var(--border)" }} />
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ── CHALLENGES ── */}
//           {view === "challenges" && (
//             <div className="form-page">
//               <div className="form-title">Сорилт</div>
//               <div className="form-sub">Найзтайгаа өрсөлдөж үгийн сангаа ахиул</div>

//               <button className="challenge-friend-btn">👥 Найзыг сорилтонд урих</button>

//               {challenges.length > 0 && (
//                 <>
//                   <div className="sec-head" style={{ marginBottom: 14 }}>
//                     <div className="sec-title" style={{ fontSize: 18 }}>Идэвхтэй сорилтууд</div>
//                   </div>
//                   {challenges.map((ch) => (
//                     <div key={ch.id} className="challenge-card">
//                       {ch.category_name && (
//                         <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
//                           {ch.category_name}
//                         </div>
//                       )}
//                       <div className="challenge-title">{ch.title}</div>
//                       <div className="challenge-host">Зохион байгуулагч: {ch.host_name}</div>
//                       <div className="invite-code-row">
//                         <div className="invite-code-text">{ch.invite_code}</div>
//                         <button
//                           className={`copy-btn${copiedCode === ch.invite_code ? " copied" : ""}`}
//                           onClick={() => copyInviteLink(ch.invite_code)}
//                         >
//                           {copiedCode === ch.invite_code ? "✓ Copied" : "Link copy"}
//                         </button>
//                       </div>
//                       {ch.members.length > 0 && (
//                         <div className="members-row">
//                           {ch.members.map((m) => <span key={m} className="member-pill">{m}</span>)}
//                         </div>
//                       )}
//                       <button className="remind-btn" onClick={() => sendReminder(ch.invite_code)}>
//                         📢 Сануулга илгээх
//                       </button>
//                     </div>
//                   ))}
//                   <hr className="divider" />
//                 </>
//               )}

//               <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "var(--text)" }}>Шинэ сорилт үүсгэх</div>
//               <form onSubmit={createChallenge} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
//                 <input name="title" className="form-input" placeholder="7 хоногийн IELTS challenge" required />
//                 {!profile.name && <input name="hostName" className="form-input" placeholder="Таны нэр" required />}
//                 {profile.name && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--primary-soft)", border: "2px solid var(--primary-soft-border)", borderRadius: 12 }}>
//                     <AvatarDisplay size={28} />
//                     <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{profile.name}</span>
//                   </div>
//                 )}
//                 <select name="categoryId" className="form-input" defaultValue="">
//                   <option value="">Бүх үг</option>
//                   {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
//                 </select>
//                 <input name="remindMessage" className="form-input" placeholder="Сануулга: Үгээ цээжлээрэй!" />
//                 <button type="submit" className="submit-btn" disabled={busy === "challenge"} style={{ marginTop: 0 }}>
//                   {busy === "challenge" ? "Үүсгэж байна..." : "Сорилт үүсгэх"}
//                 </button>
//               </form>

//               <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "var(--text)" }}>Сорилтонд нэгдэх</div>
//               <form onSubmit={joinChallenge} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                 <input name="code" className="form-input" placeholder="Invite code (8 тэмдэгт)" required />
//                 {!profile.name && (
//                   <input name="displayName" className="form-input" placeholder="Таны нэр" required onChange={(e) => setMemberName(e.target.value)} />
//                 )}
//                 <button type="submit" className="submit-btn" style={{ marginTop: 0 }}>Нэгдэх</button>
//                 <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={subscribeToPush}>
//                   🔔 Notification асаах
//                 </button>
//               </form>
//             </div>
//           )}

//           {/* ── LEADERBOARD ── */}
//           {view === "leaderboard" && (
//             <div className="page">
//               <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: "var(--text)" }}>Найзууд & Тэргүүлэгчид</div>
//               <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 20 }}>XP оноогоор эрэмбэлсэн</div>

//               {challenges[0] && (
//                 <div className="nudge-card">
//                   <div className="nudge-dot" />
//                   <div>
//                     <div className="nudge-label">Nudge Alert</div>
//                     <div className="nudge-text">Найз тань <strong>{challenges[0].host_name}</strong>-аас сорилт ирлээ: "<em>{challenges[0].title}</em>"</div>
//                     <div className="nudge-time">Дөнгөж сая</div>
//                   </div>
//                 </div>
//               )}

//               <button className="challenge-friend-btn" onClick={() => setView("challenges")}>
//                 👥 Найзыг сорилтонд урих
//               </button>

//               <div className="sec-head" style={{ marginBottom: 14 }}>
//                 <div className="sec-title" style={{ fontSize: 16 }}>XP жагсаалт</div>
//               </div>
//               {[...words].sort((a, b) => b.mastery - a.mastery).slice(0, 15).map((w, i) => (
//                 <div key={w.id} className="lb-card">
//                   <div className="lb-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
//                   <div style={{
//                     width: 44, height: 44, borderRadius: "50%",
//                     background: "var(--primary-soft)",
//                     border: "2px solid var(--primary-soft-border)",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontSize: 18, fontWeight: 900, color: "var(--primary)", flexShrink: 0,
//                   }}>
//                     {w.term.charAt(0).toUpperCase()}
//                   </div>
//                   <div style={{ flex: 1 }}>
//                     <div className="lb-name">{w.term}</div>
//                     <div className="lb-sub">{w.author_name} · Mastery {w.mastery}/5</div>
//                   </div>
//                   <div>
//                     <div className="lb-xp">{w.mastery * 20}</div>
//                     <div className="lb-xp-label">XP</div>
//                   </div>
//                 </div>
//               ))}
//               {words.length === 0 && (
//                 <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontWeight: 700 }}>
//                   Үг байхгүй байна
//                 </div>
//               )}
//             </div>
//           )}

//         </main>

//         {/* BOTTOM NAV */}
//         <nav className="bottom-nav">
//           {navItems.map((item) => (
//             <button
//               key={item.id}
//               className={`nav-btn${view === item.id ? " active" : ""}`}
//               onClick={() => setView(item.id)}
//             >
//               <div className="nav-btn-icon">{item.icon}</div>
//               <div className="nav-btn-label">{item.label}</div>
//             </button>
//           ))}
//           <button
//             className={`nav-btn${view === "add-word" ? " active" : ""}`}
//             onClick={() => setView("add-word")}
//           >
//             <div className="nav-btn-icon">
//               <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
//             </div>
//             <div className="nav-btn-label">Нэмэх</div>
//           </button>
//           {/* Profile nav button with avatar */}
//           <button
//             className={`nav-btn${view === "profile" ? " active" : ""}`}
//             onClick={() => setView("profile")}
//           >
//             <div className="nav-btn-icon" style={{ overflow: "visible" }}>
//               {profile.avatar ? (
//                 <img src={profile.avatar} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: view === "profile" ? "2px solid var(--primary)" : "2px solid var(--border)" }} alt="" />
//               ) : (
//                 <svg viewBox="0 0 24 24">
//                   <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
//                   <circle cx="12" cy="7" r="4"/>
//                 </svg>
//               )}
//             </div>
//             <div className="nav-btn-label">Профайл</div>
//           </button>
//         </nav>
//       </div>

//       {notice && <div className="notice-toast">{notice}</div>}
//     </>
//   );
// }

// function HomeIcon() {
//   return <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
// }
// function LibraryIcon() {
//   return <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
// }
// function ChallengeIcon() {
//   return <svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>;
// }
// function FriendsIcon() {
//   return <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
// }








// components/WordsApp.tsx
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
  | "leaderboard"
  | "profile";

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
  light: {
    bg: "#f5f5f0",
    card: "#ffffff",
    primary: "#16a34a",
    text: "#1a1a1a",
    accent: "#f59e0b",
  },
  dark: {
    bg: "#0f172a",
    card: "#1e293b",
    primary: "#22c55e",
    text: "#f1f5f9",
    accent: "#fbbf24",
  },
  ocean: {
    bg: "#f3f8ff",
    card: "#ffffff",
    primary: "#2563eb",
    text: "#0f172a",
    accent: "#06b6d4",
  },
  violet: {
    bg: "#faf7ff",
    card: "#ffffff",
    primary: "#7c3aed",
    text: "#1f1630",
    accent: "#ec4899",
  },
  sunset: {
    bg: "#fff7ed",
    card: "#ffffff",
    primary: "#f97316",
    text: "#2b1b12",
    accent: "#ef4444",
  },
};

function ThemePreviewCard({
  themeKey,
  isActive,
  onClick,
}: {
  themeKey: ThemeMode;
  isActive: boolean;
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
        {isActive ? " ✓" : ""}
      </div>
    </button>
  );
}

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

  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const durationMenuRef = useRef<HTMLDivElement>(null);

  const cssVars = getCSSVariables(theme);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: AuthUser | null }) => {
        setAuthUser(data.user ?? null);
      })
      .catch(() => setAuthUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("words-theme") as ThemeMode | null;
    if (savedTheme && savedTheme in themes) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("words-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return;

    const t = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!authUser) return;

    setEditBio(authUser.bio ?? "");
    setEditAvatar(authUser.avatar ?? null);
  }, [authUser]);

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

  useEffect(() => {
    if (!durationMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!durationMenuRef.current?.contains(event.target as Node)) {
        setDurationMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDurationMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [durationMenuOpen]);

  const filteredWords = useMemo(() => {
    if (selectedCategory === "all") return words;
    return words.filter((w) => w.category_id === selectedCategory);
  }, [selectedCategory, words]);

  const currentWord =
    filteredWords.length > 0
      ? filteredWords[cardIndex % filteredWords.length]
      : null;

  const masteredCount = words.filter((w) => w.mastery >= 4).length;
  const learningCount = words.filter((w) => w.mastery > 0 && w.mastery < 4).length;
  const xpTotal = words.reduce((t, w) => t + w.mastery * 20, 0);
  const topLeaders = leaderboard.slice(0, 5);
  const myRank = authUser
    ? leaderboard.findIndex((entry) => entry.id === authUser.id) + 1
    : 0;
  const dailyGoalPct = Math.min(
    100,
    Math.round((masteredCount / Math.max(words.length, 1)) * 100)
  );

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
      const data = await res
        .json()
        .catch(() => ({ error: "Профайл хадгалж чадсангүй" }));
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
    reader.onload = () => {
      setEditAvatar(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("category");

    const form = new FormData(e.currentTarget);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    try {
      const cat = await postJson<Category>("/api/categories", {
        name: form.get("name"),
        color,
      });

      setCategories((prev) => [...prev.filter((c) => c.id !== cat.id), cat]);
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

    try {
      await postJson<Word>("/api/words", {
        term: form.get("term"),
        meaning: form.get("meaning"),
        example: form.get("example") || "",
        categoryId: form.get("categoryId") || null,
        authorName: authUser?.name || "Anonymous",
      });

      e.currentTarget.reset();
      setNotice("✓ Үг нэмэгдлээ!");
      refreshAfterMutation();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy("");
    }
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
      }
    }
  }

  function resetStudyState() {
    setRevealed(false);
    setQuizAnswer("");
    setQuizResult(null);
  }

  function nextCard() {
    resetStudyState();
    setCardIndex((i) =>
      filteredWords.length ? (i + 1) % filteredWords.length : 0
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function prevCard() {
    resetStudyState();
    setCardIndex((i) =>
      filteredWords.length
        ? (i - 1 + filteredWords.length) % filteredWords.length
        : 0
    );
  }

  function checkQuiz() {
    if (!currentWord) return;

    const answer = quizAnswer.trim().toLowerCase();
    const meaning = currentWord.meaning.trim().toLowerCase();

    if (!answer) {
      setNotice("Хариултаа бичнэ үү");
      return;
    }

    const correct = meaning.includes(answer) || answer.includes(meaning);
    setQuizResult(correct ? "correct" : "wrong");
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
          categories.find((c) => c.id === (created.category_id ?? null))?.name ??
          null,
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
    const confirmed = window.confirm(
      `"${challenge.title}" сорилтыг устгах уу?`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/challenges/${challenge.invite_code}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Сорилт устгаж чадсангүй." }));
        throw new Error(data.error ?? "Сорилт устгаж чадсангүй.");
      }

      setChallenges((prev) =>
        prev.filter((ch) => ch.invite_code !== challenge.invite_code)
      );
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
      String(form.get("displayName") ?? "").trim() ||
      authUser?.name ||
      "Anonymous";

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

    if (!displayName) {
      setNotice("Эхлээд нэрээ оруулна уу");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setNotice("VAPID key тохируулаагүй байна");
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js");
    const perm = await Notification.requestPermission();

    if (perm !== "granted") {
      setNotice("Notification зөвшөөрөл өгөөгүй");
      return;
    }

    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    await postJson("/api/push/subscribe", {
      memberName: displayName,
      subscription: sub,
    });

    setNotice("✓ Notification идэвхжлээ!");
  }

  async function sendReminder(code: string) {
    try {
      const r = await postJson<{ sent: number }>(
        `/api/challenges/${code}/remind`,
        {}
      );
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

  async function shareInviteLink(challenge: Challenge) {
    const url = getInviteLink(challenge.invite_code);
    const shareText = `${challenge.title} сорилтод нэгдээрэй. Код: ${challenge.invite_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: shareText,
          url,
        });
        setSharedCode(challenge.invite_code);
        window.setTimeout(() => setSharedCode(""), 2000);
        return;
      } catch {
        // User cancelled share sheet or share failed. Fallback to copy only for actual failures below.
      }
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

    return new Intl.DateTimeFormat("mn-MN", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
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
        <Image
          src={avatar}
          alt={name}
          width={size}
          height={size}
          unoptimized
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

  const themeKeys = Object.keys(themes) as ThemeMode[];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        :root {
          ${cssVars}
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: var(--bg, #f5f5f0);
          color: var(--text, #111827);
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          min-height: 100vh;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg, #f5f5f0);
          color: var(--text, #111827);
        }

        .app-header {
          background: var(--bg-secondary, var(--card, #fff));
          border-bottom: 2px solid var(--border, #e5e7eb);
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .app-header-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 22px;
          font-weight: 900;
          color: var(--primary, #16a34a);
          letter-spacing: -0.5px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .app-header-logo span {
          color: var(--text, #111827);
        }

        .app-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid var(--border, #e5e7eb);
          background: var(--bg-secondary, var(--card, #fff));
          color: var(--text, #111827);
          cursor: pointer;
          font-size: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn:hover {
          border-color: var(--primary, #16a34a);
        }

        .xp-badge,
        .streak-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 900;
          border-radius: 100px;
          padding: 5px 12px;
          border: 2px solid var(--border, #e5e7eb);
          background: var(--bg-secondary, var(--card, #fff));
        }

        .xp-badge {
          color: var(--accent, #f59e0b);
        }

        .streak-pill {
          color: var(--accent-dark, #ea580c);
        }

        .theme-picker-overlay {
          position: sticky;
          top: 60px;
          z-index: 120;
          padding: 0 16px;
        }

        .theme-picker {
          background: var(--bg-secondary, var(--card, #fff));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          margin: 8px auto 0;
          max-width: 680px;
        }

        .theme-picker-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .theme-picker-title {
          font-size: 15px;
          font-weight: 900;
          color: var(--text, #111827);
        }

        .theme-picker-close {
          border: 2px solid var(--border, #e5e7eb);
          background: var(--bg, #f5f5f0);
          color: var(--text, #111827);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .theme-preview-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
          outline: none;
        }

        .theme-preview-card {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.15s;
        }

        .theme-preview-name {
          font-size: 12px;
          font-weight: 900;
          text-align: center;
          letter-spacing: 0.3px;
        }

        .app-body {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 84px;
        }

        .page,
        .form-page,
        .flashcard-wrap {
          padding: 20px;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-secondary, var(--card, #fff));
          border-top: 2px solid var(--border, #e5e7eb);
          display: flex;
          z-index: 100;
          height: 68px;
        }

        .nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px 4px;
          position: relative;
          color: var(--text-secondary, var(--muted, #9ca3af));
          transition: transform 0.1s, color 0.15s;
        }

        .nav-btn:active {
          transform: scale(0.94);
        }

        .nav-btn-icon {
          font-size: 22px;
          line-height: 1;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-btn-label {
          font-size: 11px;
          font-weight: 800;
        }

        .nav-btn.active {
          color: var(--primary, #16a34a);
        }

        .nav-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 3px;
          background: var(--primary, #16a34a);
          border-radius: 2px 2px 0 0;
        }

        .hero {
          background: var(--primary, #16a34a);
          border-radius: 24px;
          padding: 22px;
          margin-bottom: 20px;
          color: var(--white, #fff);
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -30px;
          right: -30px;
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.10);
          border-radius: 50%;
        }

        .hero-eyebrow {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1.4px;
          opacity: 0.85;
          margin-bottom: 8px;
        }

        .hero-title {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 10px;
          line-height: 1.15;
        }

        .hero-sub {
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .white-btn,
        .primary-btn,
        .secondary-btn,
        .danger-btn,
        .warning-btn {
          border: none;
          border-radius: 16px;
          padding: 13px 18px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .white-btn {
          background: #fff;
          color: var(--primary, #16a34a);
          box-shadow: 0 4px 0 rgba(0,0,0,0.16);
        }

        .primary-btn {
          background: var(--primary, #16a34a);
          color: #fff;
          box-shadow: 0 5px 0 rgba(0,0,0,0.18);
        }

        .secondary-btn {
          background: var(--bg-secondary, var(--card, #fff));
          color: var(--text, #111827);
          border: 2px solid var(--border, #e5e7eb);
          box-shadow: 0 4px 0 rgba(0,0,0,0.10);
        }

        .warning-btn {
          background: #f59e0b;
          color: #fff;
          box-shadow: 0 5px 0 #d97706;
        }

        .danger-btn {
          background: #ef4444;
          color: #fff;
          box-shadow: 0 5px 0 #dc2626;
        }

        .white-btn:hover,
        .primary-btn:hover,
        .secondary-btn:hover,
        .danger-btn:hover,
        .warning-btn:hover {
          transform: translateY(-1px);
        }

        .white-btn:active,
        .primary-btn:active,
        .secondary-btn:active,
        .danger-btn:active,
        .warning-btn:active {
          transform: translateY(3px);
          box-shadow: none;
        }

        .primary-btn:disabled,
        .secondary-btn:disabled,
        .warning-btn:disabled {
          background: #d1d5db;
          color: #6b7280;
          box-shadow: none;
          cursor: not-allowed;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-tile,
        .card,
        .word-card,
        .challenge-card,
        .goal-tile,
        .profile-card,
        .cat-tile {
          background: var(--bg-secondary, var(--card, #fff));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 18px;
        }

        .stat-tile {
          padding: 16px;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-secondary, var(--muted, #6b7280));
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .stat-val {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-sub {
          font-size: 12px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 700;
        }

        .goal-tile {
          grid-column: 1 / -1;
          padding: 16px;
        }

        .goal-header,
        .sec-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .goal-header {
          margin-bottom: 10px;
        }

        .goal-label,
        .sec-title {
          font-size: 16px;
          font-weight: 900;
          color: var(--text, #111827);
        }

        .goal-pct,
        .sec-link {
          font-size: 13px;
          font-weight: 900;
          color: var(--primary, #16a34a);
        }

        .sec-head {
          margin-bottom: 14px;
        }

        .sec-title {
          font-size: 19px;
        }

        .sec-link {
          border: none;
          background: none;
          cursor: pointer;
        }

        .goal-bar {
          height: 10px;
          background: var(--muted, var(--soft, #e5e7eb));
          border-radius: 100px;
          overflow: hidden;
        }

        .goal-fill {
          height: 100%;
          background: var(--primary, #16a34a);
          border-radius: 100px;
          transition: width 0.4s ease;
        }

        .word-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .word-card {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.1s;
        }

        .word-card:hover {
          border-color: var(--primary, #16a34a);
          transform: translateY(-1px);
        }

        .word-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          background: var(--primary-soft, var(--soft, #f0fdf4));
          border: 2px solid var(--primary-soft-border, transparent);
        }

        .word-card-body {
          flex: 1;
          min-width: 0;
        }

        .word-card-term {
          font-size: 16px;
          font-weight: 900;
          color: var(--text, #111827);
          margin-bottom: 2px;
        }

        .word-card-meaning {
          font-size: 13px;
          color: var(--text-secondary, var(--muted, #6b7280));
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .word-card-mastery {
          display: flex;
          gap: 3px;
          flex-shrink: 0;
        }

        .ms-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .cat-chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 16px;
          scrollbar-width: none;
        }

        .cat-chips::-webkit-scrollbar {
          display: none;
        }

        .cat-chip {
          padding: 7px 14px;
          border-radius: 100px;
          border: 2px solid var(--border, #e5e7eb);
          background: var(--bg-secondary, var(--card, #fff));
          color: var(--text-secondary, var(--muted, #6b7280));
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cat-chip.active {
          background: var(--primary, #16a34a);
          border-color: var(--primary, #16a34a);
          color: #fff;
        }

        .cat-chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .mode-tabs {
          display: flex;
          background: var(--muted, var(--soft, #f3f4f6));
          border-radius: 14px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 20px;
        }

        .mode-tab {
          flex: 1;
          padding: 10px 8px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-secondary, var(--muted, #6b7280));
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .mode-tab.active {
          background: var(--bg-secondary, var(--card, #fff));
          color: var(--text, #111827);
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }

        .big-flashcard {
          background: var(--bg-secondary, var(--card, #fff));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 26px;
          padding: 42px 28px;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          margin-bottom: 16px;
          position: relative;
        }

        .new-word-tag {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--primary-soft, var(--soft, #f0fdf4));
          color: var(--primary, #16a34a);
          font-size: 11px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 100px;
          border: 2px solid var(--primary-soft-border, transparent);
        }

        .card-phonetic {
          font-size: 14px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 700;
          margin-bottom: 8px;
        }

        .card-term {
          font-size: 40px;
          font-weight: 900;
          color: var(--text, #111827);
          margin-bottom: 8px;
          letter-spacing: -1px;
        }

        .card-reveal-hint {
          font-size: 14px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 700;
        }

        .card-meaning {
          font-size: 18px;
          color: var(--text, #374151);
          font-weight: 800;
          line-height: 1.5;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid var(--border, #f3f4f6);
          width: 100%;
        }

        .card-example {
          font-size: 14px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-style: italic;
          margin-top: 10px;
          line-height: 1.6;
        }

        .card-nav,
        .action-btns {
          display: grid;
          gap: 10px;
        }

        .card-nav {
          grid-template-columns: 56px 1fr 56px;
          align-items: center;
          margin-bottom: 18px;
        }

        .nav-arrow {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 2px solid var(--border, #e5e7eb);
          background: var(--bg-secondary, var(--card, #fff));
          cursor: pointer;
          font-size: 24px;
          font-weight: 900;
          color: var(--text, #111827);
        }

        .card-counter {
          text-align: center;
          font-size: 15px;
          font-weight: 900;
          color: var(--text, #374151);
        }

        .action-btns {
          grid-template-columns: 1fr 1fr;
        }

        .quiz-input,
        .form-input {
          width: 100%;
          background: var(--bg-secondary, var(--card, #fff));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 14px;
          padding: 14px 16px;
          color: var(--text, #111827);
          font-size: 15px;
          font-weight: 700;
          outline: none;
        }

        .quiz-input {
          margin-top: 16px;
        }

        .quiz-input:focus,
        .form-input:focus {
          border-color: var(--primary, #16a34a);
        }

        .quiz-input.correct {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .quiz-input.wrong {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .result-bar {
          margin-top: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
        }

        .result-bar.correct {
          background: #f0fdf4;
          color: #16a34a;
          border: 2px solid #bbf7d0;
        }

        .result-bar.wrong {
          background: #fef2f2;
          color: #dc2626;
          border: 2px solid #fecaca;
        }

        .form-title {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 6px;
          color: var(--text, #111827);
        }

        .form-sub {
          font-size: 14px;
          color: var(--text-secondary, var(--muted, #6b7280));
          font-weight: 700;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 900;
          color: var(--text, #374151);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        textarea.form-input {
          min-height: 90px;
          resize: vertical;
        }

        .cat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .cat-tile {
          padding: 18px;
          cursor: pointer;
        }

        .cat-tile-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-bottom: 12px;
        }

        .cat-tile-name {
          font-size: 15px;
          font-weight: 900;
          color: var(--text, #111827);
          margin-bottom: 4px;
        }

        .cat-tile-count {
          font-size: 13px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 700;
        }

        .challenge-card {
          padding: 20px;
          margin-bottom: 14px;
        }

        .challenge-title {
          font-size: 18px;
          font-weight: 900;
          color: var(--text, #111827);
          margin-bottom: 4px;
        }

        .challenge-host {
          font-size: 13px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 700;
          margin-bottom: 14px;
        }

        .invite-code-row {
          background: var(--bg, var(--soft, #f9fafb));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .invite-code-text {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 4px;
          color: var(--primary, #16a34a);
        }

        .challenge-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .challenge-meta-pill {
          background: var(--soft, #f3f4f6);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
        }

        .share-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .challenge-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .share-link-box {
          background: var(--bg, var(--soft, #f9fafb));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 14px;
          word-break: break-all;
        }

        .share-link-label {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-secondary, #6b7280);
          margin-bottom: 6px;
        }

        .share-link-value {
          font-size: 13px;
          font-weight: 800;
          color: var(--text, #111827);
          line-height: 1.45;
        }

        .success-card {
          padding: 20px;
          margin-bottom: 18px;
          border: 2px solid rgba(34, 197, 94, 0.24);
        }

        .dropdown-shell {
          position: relative;
        }

        .dropdown-trigger {
          width: 100%;
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 18px;
          background: var(--card, #ffffff);
          color: var(--text, #111827);
          min-height: 56px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }

        .dropdown-trigger:hover {
          border-color: color-mix(in srgb, var(--primary, #16a34a) 30%, var(--border, #e5e7eb));
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .dropdown-trigger.open {
          border-color: var(--primary, #16a34a);
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
        }

        .dropdown-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .dropdown-copy strong {
          font-size: 15px;
          font-weight: 900;
          color: var(--text, #111827);
        }

        .dropdown-copy span {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-secondary, #6b7280);
        }

        .dropdown-caret {
          font-size: 18px;
          font-weight: 900;
          color: var(--text-secondary, #6b7280);
          transition: transform 0.18s ease;
        }

        .dropdown-trigger.open .dropdown-caret {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          z-index: 40;
          padding: 8px;
          border-radius: 20px;
          border: 1px solid rgba(229, 231, 235, 0.9);
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(18px);
          box-shadow: 0 26px 44px rgba(15, 23, 42, 0.14);
        }

        .dropdown-option {
          width: 100%;
          border: none;
          background: transparent;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          text-align: left;
          font: inherit;
          cursor: pointer;
          transition: background 0.16s ease, color 0.16s ease;
        }

        .dropdown-option:hover {
          background: rgba(22, 163, 74, 0.08);
        }

        .dropdown-option.active {
          background: rgba(22, 163, 74, 0.12);
          color: var(--primary, #16a34a);
        }

        .dropdown-option strong {
          font-size: 14px;
          font-weight: 900;
        }

        .dropdown-option span {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-secondary, #6b7280);
        }

        .member-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .member-pill {
          background: var(--muted, var(--soft, #f3f4f6));
          color: var(--text, #374151);
          font-size: 12px;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 100px;
        }

        .profile-card {
          padding: 22px;
          text-align: center;
          margin-bottom: 18px;
        }

        .profile-name {
          font-size: 24px;
          font-weight: 900;
          color: var(--text, #111827);
          margin: 12px 0 6px;
        }

        .profile-email {
          font-size: 13px;
          color: var(--text-secondary, var(--muted, #6b7280));
          font-weight: 800;
          margin-bottom: 8px;
        }

        .profile-bio {
          font-size: 14px;
          color: var(--text-secondary, var(--muted, #6b7280));
          font-weight: 700;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .leader-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          margin-bottom: 10px;
          background: var(--bg-secondary, var(--card, #fff));
          border: 2px solid var(--border, #e5e7eb);
          border-radius: 18px;
        }

        .leader-rank {
          font-size: 22px;
          font-weight: 900;
          min-width: 36px;
          text-align: center;
          color: var(--text-secondary, var(--muted, #9ca3af));
        }

        .leader-name {
          flex: 1;
          font-size: 15px;
          font-weight: 900;
          color: var(--text, #111827);
        }

        .leader-sub {
          font-size: 12px;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 700;
        }

        .leader-xp {
          font-size: 16px;
          font-weight: 900;
          color: #f59e0b;
        }

        .leaderboard-preview {
          margin-top: 24px;
        }

        .leaderboard-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .leader-self {
          border: 2px solid rgba(245, 158, 11, 0.24);
          box-shadow: 0 18px 34px rgba(245, 158, 11, 0.1);
        }

        .empty {
          text-align: center;
          padding: 44px 0;
          color: var(--text-secondary, var(--muted, #9ca3af));
          font-weight: 800;
        }

        .divider {
          border: none;
          border-top: 2px solid var(--border, #f3f4f6);
          margin: 22px 0;
        }

        .notice-toast {
          position: fixed;
          bottom: 84px;
          left: 50%;
          transform: translateX(-50%);
          background: #111827;
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          padding: 12px 24px;
          border-radius: 100px;
          z-index: 300;
          white-space: nowrap;
          max-width: calc(100vw - 32px);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 520px) {
          .theme-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .xp-badge,
          .streak-pill {
            font-size: 12px;
            padding: 4px 9px;
          }

          .card-term {
            font-size: 34px;
          }
        }

        @media (min-width: 640px) {
          .app-header {
            padding: 0 32px;
          }

          .page,
          .form-page,
          .flashcard-wrap {
            padding: 24px;
          }
        }
      `}</style>

      <div className="app">
        <header className="app-header">
          <button
            type="button"
            onClick={() => setView("home")}
            className="app-header-logo"
          >
            Linguist<span>.</span>
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

        {themePickerOpen && (
          <div className="theme-picker-overlay">
            <div className="theme-picker">
              <div className="theme-picker-head">
                <div className="theme-picker-title">Theme сонгох</div>
                <button
                  type="button"
                  className="theme-picker-close"
                  onClick={() => setThemePickerOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="theme-grid">
                {themeKeys.map((key) => (
                  <ThemePreviewCard
                    key={key}
                    themeKey={key}
                    isActive={theme === key}
                    onClick={() => {
                      setTheme(key);
                      setThemePickerOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="app-body">
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
                <button className="white-btn" onClick={() => setView("learn")}>
                  Суралцах үргэлжлүүлэх →
                </button>
              </div>

              <div className="stats-row">
                <div className="stat-tile">
                  <div className="stat-label">Нийт XP</div>
                  <div className="stat-val" style={{ color: "#f59e0b" }}>
                    {xpTotal.toLocaleString()}
                  </div>
                  <div className="stat-sub">XP нийт</div>
                </div>

                <div className="stat-tile">
                  <div className="stat-label">Цээжилсэн</div>
                  <div className="stat-val" style={{ color: "#16a34a" }}>
                    {masteredCount}
                  </div>
                  <div className="stat-sub">/{words.length} үг</div>
                </div>

                <div className="goal-tile">
                  <div className="goal-header">
                    <div className="goal-label">Өдрийн зорилго</div>
                    <div className="goal-pct">{dailyGoalPct}%</div>
                  </div>
                  <div className="goal-bar">
                    <div
                      className="goal-fill"
                      style={{ width: `${dailyGoalPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="sec-head">
                <div className="sec-title">Өнөөдрийн зам</div>
                <button className="sec-link" onClick={() => setView("learn")}>
                  Номын сан харах ↗
                </button>
              </div>

              <div className="word-list">
                {words.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    className="word-card"
                    onClick={() => setView("learn")}
                  >
                    <div className="word-card-icon">📖</div>
                    <div className="word-card-body">
                      <div className="word-card-term">{w.term}</div>
                      <div className="word-card-meaning">{w.meaning}</div>
                    </div>
                    <div className="word-card-mastery">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="ms-dot"
                          style={{
                            background:
                              i <= w.mastery
                                ? masteryColor(w.mastery)
                                : "var(--border, #e5e7eb)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {words.length === 0 && (
                  <div className="empty">
                    <div style={{ fontSize: 42, marginBottom: 12 }}>📚</div>
                    <div>Үг байхгүй байна</div>
                    <button
                      className="primary-btn"
                      style={{ marginTop: 16 }}
                      onClick={() => setView("add-word")}
                    >
                      + Үг нэмэх
                    </button>
                  </div>
                )}
              </div>

              <div className="leaderboard-preview">
                <div className="sec-head">
                  <div className="sec-title">Leaderboard</div>
                  <button
                    className="sec-link"
                    onClick={() => setView("leaderboard")}
                  >
                    Бүгдийг харах ↗
                  </button>
                </div>

                {topLeaders.length > 0 ? (
                  <div className="leaderboard-stack">
                    {topLeaders.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`leader-row${
                          entry.id === authUser.id ? " leader-self" : ""
                        }`}
                      >
                        <div className="leader-rank">#{index + 1}</div>
                        {entry.avatar ? (
                          <Image
                            src={entry.avatar}
                            alt={entry.name}
                            width={44}
                            height={44}
                            unoptimized
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              background: "var(--primary-soft, #f0fdf4)",
                              color: "var(--primary, #16a34a)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                            }}
                          >
                            {entry.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="leader-name">
                          {entry.name}
                          <div className="leader-sub">
                            {entry.mastered_words} mastered · {entry.words_count} word
                            {entry.words_count === 1 ? "" : "s"}
                          </div>
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

          {view === "learn" && (
            <div className="flashcard-wrap">
              <div className="cat-chips">
                <button
                  className={`cat-chip${selectedCategory === "all" ? " active" : ""}`}
                  onClick={() => {
                    setSelectedCategory("all");
                    setCardIndex(0);
                    resetStudyState();
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
                      resetStudyState();
                    }}
                  >
                    <span
                      className="cat-chip-dot"
                      style={{ background: c.color }}
                    />
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
                      resetStudyState();
                    }}
                  >
                    {m === "flashcard"
                      ? "Флаш карт"
                      : m === "quiz"
                        ? "Quiz"
                        : "Self-check"}
                  </button>
                ))}
              </div>

              {currentWord ? (
                <>
                  <div
                    className="big-flashcard"
                    onClick={() =>
                      mode === "flashcard" && setRevealed((r) => !r)
                    }
                  >
                    <div className="new-word-tag">WORD</div>

                    {currentWord.category_name && (
                      <div className="card-phonetic">
                        {currentWord.category_name}
                      </div>
                    )}

                    <div className="card-term">{currentWord.term}</div>

                    {mode === "flashcard" &&
                      (revealed ? (
                        <>
                          <div className="card-meaning">
                            {currentWord.meaning}
                          </div>
                          {currentWord.example && (
                            <div className="card-example">
                              “{currentWord.example}”
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="card-reveal-hint">
                          Дарж орчуулгыг харах
                        </div>
                      ))}

                    {mode === "quiz" && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: "100%" }}
                      >
                        <input
                          ref={inputRef}
                          className={`quiz-input${
                            quizResult === "correct"
                              ? " correct"
                              : quizResult === "wrong"
                                ? " wrong"
                                : ""
                          }`}
                          value={quizAnswer}
                          onChange={(e) => setQuizAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !quizResult) checkQuiz();
                          }}
                          placeholder="Монгол утгыг бич..."
                          disabled={!!quizResult}
                        />

                        {!quizResult && (
                          <button
                            className="primary-btn"
                            style={{ width: "100%", marginTop: 10 }}
                            onClick={checkQuiz}
                          >
                            Шалгах
                          </button>
                        )}

                        {quizResult && (
                          <div className={`result-bar ${quizResult}`}>
                            {quizResult === "correct"
                              ? "✓ Зөв! +20 XP"
                              : `✗ Зөв хариулт: ${currentWord.meaning}`}
                          </div>
                        )}
                      </div>
                    )}

                    {mode === "check" && !revealed && (
                      <button
                        className="white-btn"
                        style={{ marginTop: 16 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRevealed(true);
                        }}
                      >
                        Орчуулга харах
                      </button>
                    )}

                    {mode === "check" && revealed && (
                      <div className="card-meaning">{currentWord.meaning}</div>
                    )}
                  </div>

                  <div className="card-nav">
                    <button className="nav-arrow" onClick={prevCard}>
                      ‹
                    </button>
                    <div className="card-counter">
                      {(cardIndex % filteredWords.length) + 1} /{" "}
                      {filteredWords.length}
                    </div>
                    <button className="nav-arrow" onClick={nextCard}>
                      ›
                    </button>
                  </div>

                  {mode === "check" && revealed && (
                    <div className="action-btns">
                      <button
                        className="primary-btn"
                        onClick={() => {
                          void updateMastery(currentWord, 1);
                          nextCard();
                        }}
                      >
                        ✓ Мэдэж байна
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          void updateMastery(currentWord, -1);
                          nextCard();
                        }}
                      >
                        ✗ Дахин давтана
                      </button>
                    </div>
                  )}

                  {(mode === "flashcard" || (mode === "quiz" && quizResult)) && (
                    <button
                      className="primary-btn"
                      style={{ width: "100%", marginTop: 10 }}
                      onClick={nextCard}
                    >
                      Дараагийн үг →
                    </button>
                  )}

                  <hr className="divider" />

                  <div className="sec-head">
                    <div className="sec-title">Бүх үгс</div>
                  </div>

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
                            <div
                              key={i}
                              className="ms-dot"
                              style={{
                                background:
                                  i <= w.mastery
                                    ? masteryColor(w.mastery)
                                    : "var(--border, #e5e7eb)",
                              }}
                            />
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
                  <button
                    className="primary-btn"
                    style={{ marginTop: 16 }}
                    onClick={() => setView("add-word")}
                  >
                    + Үг нэмэх
                  </button>
                </div>
              )}
            </div>
          )}

          {view === "add-word" && (
            <div className="form-page">
              <div className="form-title">Үг нэмэх</div>
              <div className="form-sub">
                Нэмсэн үг бүх хэрэглэгчид харагдана
              </div>

              <form onSubmit={addWord}>
                <div className="form-group">
                  <label className="form-label">Үг / Term</label>
                  <input
                    name="term"
                    className="form-input"
                    placeholder="serendipity, ephemeral..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Утга / Meaning</label>
                  <textarea
                    name="meaning"
                    className="form-input"
                    placeholder="Монгол утга эсвэл тайлбар..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Жишээ өгүүлбэр</label>
                  <input
                    name="example"
                    className="form-input"
                    placeholder="It was serendipity that we met..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ангилал</label>
                  <select name="categoryId" className="form-input" defaultValue="">
                    <option value="">Ангилалгүй</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  style={{ width: "100%" }}
                  disabled={busy === "word"}
                >
                  {busy === "word" ? "Нэмж байна..." : "Нийтэд нэмэх"}
                </button>
              </form>

              <hr className="divider" />

              <div className="form-title" style={{ fontSize: 19 }}>
                Анги нэмэх
              </div>

              <form onSubmit={addCategory} style={{ display: "flex", gap: 10 }}>
                <input
                  name="name"
                  className="form-input"
                  placeholder="Business, IELTS, Travel..."
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={busy === "category"}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {busy === "category" ? "..." : "+ Нэмэх"}
                </button>
              </form>
            </div>
          )}

          {view === "categories" && (
            <div className="page">
              <div className="form-title">Ангиллууд</div>
              <div className="form-sub">Үгсээ ангиллаар нь давт</div>

              <div className="cat-grid">
                <div
                  className="cat-tile"
                  onClick={() => {
                    setSelectedCategory("all");
                    setView("learn");
                  }}
                >
                  <div
                    className="cat-tile-dot"
                    style={{ background: "var(--primary, #16a34a)" }}
                  />
                  <div className="cat-tile-name">Бүгд</div>
                  <div className="cat-tile-count">{words.length} үг</div>
                </div>

                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="cat-tile"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setView("learn");
                    }}
                  >
                    <div
                      className="cat-tile-dot"
                      style={{ background: c.color }}
                    />
                    <div className="cat-tile-name">{c.name}</div>
                    <div className="cat-tile-count">
                      {words.filter((w) => w.category_id === c.id).length} үг
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "challenges" && (
            <div className="form-page">
              <div className="form-title">Сорилт</div>
              <div className="form-sub">
                Найзтайгаа өрсөлдөж үгийн сангаа ахиул
              </div>

              {challenges.length > 0 && (
                <>
                  <div className="sec-head">
                    <div className="sec-title">Идэвхтэй сорилтууд</div>
                  </div>

                  {challenges.map((ch) => (
                    <div key={ch.id} className="challenge-card">
                      {ch.category_name && (
                        <div className="stat-label">{ch.category_name}</div>
                      )}

                      <div className="challenge-title">{ch.title}</div>
                      <div className="challenge-host">
                        Зохион байгуулагч: {ch.host_name}
                      </div>

                      <div className="challenge-meta">
                        <div className="challenge-meta-pill">
                          Хугацаа: {formatDuration(ch.duration_days ?? 7)}
                        </div>
                        {ch.expires_at && (
                          <div className="challenge-meta-pill">
                            Дуусах: {formatExpiry(ch.expires_at)}
                          </div>
                        )}
                      </div>

                      <div className="stat-label">Invite Code</div>
                      <div className="invite-code-row">
                        <div className="invite-code-text">{ch.invite_code}</div>
                        <button
                          className="primary-btn"
                          style={{ padding: "8px 12px", fontSize: 12 }}
                          onClick={() => copyInviteLink(ch.invite_code)}
                        >
                          {copiedCode === ch.invite_code ? "✓ Copied" : "Copy"}
                        </button>
                      </div>

                      <div className="share-actions">
                        <button
                          className="primary-btn"
                          style={{ padding: "10px 12px", fontSize: 12 }}
                          onClick={() => shareInviteLink(ch)}
                        >
                          {sharedCode === ch.invite_code ? "✓ Shared" : "Share"}
                        </button>

                        <button
                          className="primary-btn"
                          style={{ padding: "10px 12px", fontSize: 12 }}
                          onClick={() => copyInviteLink(ch.invite_code)}
                        >
                          {copiedCode === ch.invite_code ? "✓ Copied" : "Link copy"}
                        </button>
                      </div>

                      {ch.members.length > 0 && (
                        <div className="member-row">
                          {ch.members.map((m) => (
                            <span key={m} className="member-pill">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="challenge-actions">
                        <button
                          className="warning-btn"
                          style={{ width: "100%" }}
                          onClick={() => sendReminder(ch.invite_code)}
                        >
                          📢 Сануулга илгээх
                        </button>

                        {isChallengeOwner(ch) && (
                          <button
                            className="primary-btn"
                            style={{
                              width: "100%",
                              background: "#ef4444",
                              boxShadow: "0 6px 16px rgba(239,68,68,0.24)",
                            }}
                            onClick={() => deleteChallenge(ch)}
                          >
                            Сорилт устгах
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <hr className="divider" />
                </>
              )}

              <div className="form-title" style={{ fontSize: 19 }}>
                Шинэ сорилт үүсгэх
              </div>

              {recentChallenge && (
                <div className="challenge-card success-card">
                  <div className="stat-label">Шинээр үүсгэсэн сорилт</div>
                  <div className="challenge-title">{recentChallenge.title}</div>
                  <div className="challenge-meta">
                    <div className="challenge-meta-pill">
                      Хугацаа: {formatDuration(recentChallenge.duration_days ?? 7)}
                    </div>
                    {recentChallenge.expires_at && (
                      <div className="challenge-meta-pill">
                        Дуусах: {formatExpiry(recentChallenge.expires_at)}
                      </div>
                    )}
                  </div>
                  <div className="stat-label">Invite Code</div>
                  <div className="invite-code-row">
                    <div className="invite-code-text">{recentChallenge.invite_code}</div>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: "8px 12px", fontSize: 12 }}
                      onClick={() => copyInviteLink(recentChallenge.invite_code)}
                    >
                      {copiedCode === recentChallenge.invite_code ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="share-link-box">
                    <div className="share-link-label">Share Link</div>
                    <div className="share-link-value">
                      {getInviteLink(recentChallenge.invite_code)}
                    </div>
                  </div>
                  <div className="share-actions">
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => shareInviteLink(recentChallenge)}
                    >
                      {sharedCode === recentChallenge.invite_code ? "✓ Shared" : "Share"}
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => copyInviteLink(recentChallenge.invite_code)}
                    >
                      {copiedCode === recentChallenge.invite_code ? "✓ Copied" : "Link copy"}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={createChallenge}>
                <div className="form-group">
                  <input
                    name="title"
                    className="form-input"
                    placeholder="7 хоногийн challenge"
                    required
                  />
                </div>

                <div className="form-group">
                  <select name="categoryId" className="form-input" defaultValue="">
                    <option value="">Бүх үг</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Хугацаа</label>
                  <div className="dropdown-shell" ref={durationMenuRef}>
                    <input
                      type="hidden"
                      name="durationDays"
                      value={challengeDuration}
                    />
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
                            className={`dropdown-option${
                              challengeDuration === option.value ? " active" : ""
                            }`}
                            onClick={() => {
                              setChallengeDuration(option.value);
                              setDurationMenuOpen(false);
                            }}
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
                  <input
                    name="remindMessage"
                    className="form-input"
                    placeholder="Сануулга: Үгээ цээжлээрэй!"
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  style={{ width: "100%" }}
                  disabled={busy === "challenge"}
                >
                  {busy === "challenge" ? "Үүсгэж байна..." : "Сорилт үүсгэх"}
                </button>
              </form>

              <hr className="divider" />

              <div className="form-title" style={{ fontSize: 19 }}>
                Сорилтонд нэгдэх
              </div>

              <form onSubmit={joinChallenge}>
                <div className="form-group">
                  <input
                    name="code"
                    className="form-input"
                    placeholder="Invite code"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    name="displayName"
                    className="form-input"
                    placeholder={authUser.name}
                    defaultValue={authUser.name}
                    onChange={(e) => setMemberName(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  style={{ width: "100%", marginBottom: 10 }}
                >
                  Нэгдэх
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  style={{ width: "100%" }}
                  onClick={subscribeToPush}
                >
                  🔔 Notification асаах
                </button>
              </form>
            </div>
          )}

          {view === "leaderboard" && (
            <div className="page">
              <div className="form-title">Leaderboard</div>
              <div className="form-sub">Бүртгэлтэй бүх хэрэглэгч XP-ээр эрэмбэлэгдэнэ</div>

              {myRank > 0 && (
                <>
                  <div className="sec-head">
                    <div className="sec-title">Таны байр</div>
                  </div>
                  {leaderboard
                    .filter((entry) => entry.id === authUser.id)
                    .map((entry) => (
                      <div key={entry.id} className="leader-row leader-self">
                        <div className="leader-rank">#{myRank}</div>
                        <AvatarDisplay size={44} />
                        <div className="leader-name">
                          {entry.name}
                          <div className="leader-sub">
                            {entry.mastered_words} mastered · {entry.words_count} word
                            {entry.words_count === 1 ? "" : "s"}
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
              </div>

              {leaderboard.length > 0 ? (
                <div className="leaderboard-stack">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`leader-row${
                        entry.id === authUser.id ? " leader-self" : ""
                      }`}
                    >
                      <div className="leader-rank">#{index + 1}</div>
                      {entry.id === authUser.id ? (
                        <AvatarDisplay size={44} />
                      ) : entry.avatar ? (
                        <Image
                          src={entry.avatar}
                          alt={entry.name}
                          width={44}
                          height={44}
                          unoptimized
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "var(--primary-soft, #f0fdf4)",
                            color: "var(--primary, #16a34a)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                          }}
                        >
                          {entry.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="leader-name">
                        {entry.name}
                        <div className="leader-sub">
                          {entry.mastered_words} mastered · {entry.words_count} word
                          {entry.words_count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="leader-xp">{entry.xp} XP</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">Одоогоор бүртгэлтэй хэрэглэгч алга байна</div>
              )}
            </div>
          )}

          {view === "profile" && (
            <div className="page">
              <div className="profile-card">
                <AvatarDisplay size={96} />

                <div className="profile-name">{authUser.name}</div>

                {authUser.email && (
                  <div className="profile-email">{authUser.email}</div>
                )}

                <div className="profile-bio">
                  {authUser.bio || "Bio нэмээгүй байна."}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <button
                    className="primary-btn"
                    onClick={() => {
                      setEditBio(authUser.bio ?? "");
                      setEditAvatar(authUser.avatar ?? null);
                      setProfileEditMode((v) => !v);
                    }}
                  >
                    Засах
                  </button>

                  <button className="danger-btn" onClick={handleLogout}>
                    Гарах
                  </button>
                </div>
              </div>

              {profileEditMode && (
                <div className="profile-card" style={{ textAlign: "left" }}>
                  <div className="form-title" style={{ fontSize: 19 }}>
                    Профайл засах
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <AvatarDisplay size={96} editable />

                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        handleAvatarFile(e.target.files?.[0] ?? null)
                      }
                    />

                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ marginTop: 12 }}
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
                      placeholder="Өөрийн тухай..."
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <button
                      className="primary-btn"
                      onClick={() => handleProfileSave(editBio, editAvatar)}
                    >
                      Хадгалах
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => {
                        setEditBio(authUser.bio ?? "");
                        setEditAvatar(authUser.avatar ?? null);
                        setProfileEditMode(false);
                      }}
                    >
                      Болих
                    </button>
                  </div>
                </div>
              )}

              <div className="stats-row">
                <div className="stat-tile">
                  <div className="stat-label">Цээжилсэн</div>
                  <div className="stat-val" style={{ color: "#16a34a" }}>
                    {masteredCount}
                  </div>
                  <div className="stat-sub">үг</div>
                </div>

                <div className="stat-tile">
                  <div className="stat-label">Суралцаж буй</div>
                  <div className="stat-val" style={{ color: "#f59e0b" }}>
                    {learningCount}
                  </div>
                  <div className="stat-sub">үг</div>
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <button
            className={`nav-btn${view === "home" ? " active" : ""}`}
            onClick={() => setView("home")}
          >
            <div className="nav-btn-icon">🏠</div>
            <div className="nav-btn-label">Нүүр</div>
          </button>

          <button
            className={`nav-btn${view === "learn" ? " active" : ""}`}
            onClick={() => setView("learn")}
          >
            <div className="nav-btn-icon">📚</div>
            <div className="nav-btn-label">Сурах</div>
          </button>

          <button
            className={`nav-btn${view === "add-word" ? " active" : ""}`}
            onClick={() => setView("add-word")}
          >
            <div className="nav-btn-icon">➕</div>
            <div className="nav-btn-label">Нэмэх</div>
          </button>

          <button
            className={`nav-btn${view === "challenges" ? " active" : ""}`}
            onClick={() => setView("challenges")}
          >
            <div className="nav-btn-icon">⭐</div>
            <div className="nav-btn-label">Сорилт</div>
          </button>

          <button
            className={`nav-btn${view === "leaderboard" ? " active" : ""}`}
            onClick={() => setView("leaderboard")}
          >
            <div className="nav-btn-icon">🏆</div>
            <div className="nav-btn-label">Rank</div>
          </button>

          <button
            className={`nav-btn${view === "profile" ? " active" : ""}`}
            onClick={() => setView("profile")}
          >
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
                    border:
                      view === "profile"
                        ? "2px solid var(--primary, #16a34a)"
                        : "2px solid var(--border, #e5e7eb)",
                  }}
                />
              ) : (
                "👤"
              )}
            </div>
            <div className="nav-btn-label">Профайл</div>
          </button>
        </nav>

        {notice && <div className="notice-toast">{notice}</div>}
      </div>
    </>
  );
} 
