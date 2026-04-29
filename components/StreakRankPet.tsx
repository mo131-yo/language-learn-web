"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";

export const TITLE_LEVELS = [
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

type PetKind =
  | "egg" | "chick" | "chick2" | "bunny" | "hamster" | "cat" | "dog"
  | "fox" | "penguin" | "panda" | "koala" | "parrot" | "turtle"
  | "raccoon" | "owl" | "dolphin" | "lion" | "tiger" | "wolf"
  | "eagle" | "deer" | "horse" | "zebra" | "giraffe" | "unicorn"
  | "bear" | "gorilla" | "dragon" | "peacock" | "fireDragon";

type SkinId = "default" | "special";

type Skin = {
  id: SkinId;
  name: string;
  dot: string;
  bg: string;
  shadowColor: string;
};

type RankPet = {
  title: string;
  xp: number;
  kind: PetKind;
  emoji: string;
  animalName: string;
  stage: string;
  description: string;
  defaultSkin: Skin;
  specialSkin: Skin;
};

function skin(id: SkinId, name: string, dot: string, bg: string, shadowColor: string): Skin {
  return { id, name, dot, bg, shadowColor };
}

function pet(
  title: string, xp: number, kind: PetKind, emoji: string,
  animalName: string, stage: string, description: string,
  defaultSkin: Skin, specialSkin: Skin
): RankPet {
  return { title, xp, kind, emoji, animalName, stage, description, defaultSkin, specialSkin };
}

export const RANK_PETS: RankPet[] = [
  pet("Анхан сурагч", 0, "egg", "🥚", "Өндөг", "Эхлэл", "Суралцах аялал дөнгөж эхэлж байна.",
    skin("default","Сонгодог","#fff3dc","linear-gradient(160deg,#58cc02,#2d9e00)","#1a6e00"),
    skin("special","Алтан өндөг","#facc15","linear-gradient(160deg,#ca8a04,#a16207)","#713f0c")),
  pet("Шинэ сурагч", 100, "chick", "🐣", "Ангаахай", "Анхны алхам", "Анхны үгсээ тогтоож эхэллээ.",
    skin("default","Шар","#ffd84d","linear-gradient(160deg,#eab308,#ca8a04)","#713f0c"),
    skin("special","Нарны","#fb923c","linear-gradient(160deg,#f97316,#ea580c)","#7c2d12")),
  pet("Идэвхтэй сурагч", 250, "chick2", "🐥", "Дэгдээхий", "Идэвхтэй үе", "Өдөр бүр бага багаар ахиж байна.",
    skin("default","Дулаан","#ffc928","linear-gradient(160deg,#f97316,#ea580c)","#7c2d12"),
    skin("special","Цагаан","#fde68a","linear-gradient(160deg,#f59e0b,#d97706)","#713f0c")),
  pet("Хичээнгүй сурагч", 500, "bunny", "🐰", "Туулай", "Хичээл зүтгэл", "Хурдан сурч, хурдан давтаж байна.",
    skin("default","Цагаан","#f8fafc","linear-gradient(160deg,#ec4899,#be185d)","#831843"),
    skin("special","Сарны","#93c5fd","linear-gradient(160deg,#3b82f6,#1d4ed8)","#1e3a8a")),
  pet("Сайн сурагч", 900, "hamster", "🐹", "Шишүүхэй", "Дадал тогтох", "Үгсээ цуглуулж, санах ойгоо тэлж байна.",
    skin("default","Бор","#d99b5f","linear-gradient(160deg,#d97706,#b45309)","#713f0c"),
    skin("special","Карамель","#fb923c","linear-gradient(160deg,#f97316,#c2410c)","#7c2d12")),
  pet("Тууштай сурагч", 1500, "cat", "🐱", "Муур", "Тууштай байдал", "Тайван боловч тасралтгүй урагшилж байна.",
    skin("default","Саарал","#d8dee9","linear-gradient(160deg,#64748b,#334155)","#0f172a"),
    skin("special","Хар","#a855f7","linear-gradient(160deg,#7c3aed,#4c1d95)","#2e1065")),
  pet("Үг цээжлэгч", 2400, "dog", "🐶", "Нохой", "Цээжлэлт", "Үг бүрийг үнэнчээр давтаж байна.",
    skin("default","Бор","#c47a3d","linear-gradient(160deg,#f59e0b,#b45309)","#713f0c"),
    skin("special","Цагаан хүрэн","#fdba74","linear-gradient(160deg,#fb923c,#c2410c)","#7c2d12")),
  pet("Үгийн мэдлэгтэн", 3600, "fox", "🦊", "Үнэг", "Ухаалаг суралцах", "Үгийн утгыг хурц ухаанаар ялгаж сурч байна.",
    skin("default","Улбар","#f97316","linear-gradient(160deg,#f97316,#c2410c)","#7c2d12"),
    skin("special","Арктик","#7dd3fc","linear-gradient(160deg,#0ea5e9,#0369a1)","#0c4a6e")),
  pet("Сайн цээжлэгч", 5200, "penguin", "🐧", "Оцон шувуу", "Тогтвортой ахиц", "Хүйтэн байсан ч бууж өгөхгүй тогтвортой сурна.",
    skin("default","Хар цагаан","#1e293b","linear-gradient(160deg,#2563eb,#1e3a8a)","#172554"),
    skin("special","Хөх","#60a5fa","linear-gradient(160deg,#0ea5e9,#0c4a6e)","#082f49")),
  pet("Чадварлаг сурагч", 7500, "panda", "🐼", "Панда", "Чадвар суух", "Суурь мэдлэг чинь бат бөх болж байна.",
    skin("default","Хулсан","#f8fafc","linear-gradient(160deg,#16a34a,#14532d)","#052e16"),
    skin("special","Алтан панда","#fbbf24","linear-gradient(160deg,#f59e0b,#b45309)","#713f0c")),
  pet("Туршлагатай сурагч", 10500, "koala", "🐨", "Коала", "Туршлага", "Сурах арга барилаа олж эхэллээ.",
    skin("default","Саарал","#9ca3af","linear-gradient(160deg,#64748b,#334155)","#0f172a"),
    skin("special","Мөнгөн","#cbd5e1","linear-gradient(160deg,#475569,#1e293b)","#020617")),
  pet("Англи хэл сонирхогч", 14500, "parrot", "🦜", "Тоть", "Дуудлага ба сонирхол", "Шинэ үг, шинэ дуудлагад дуртай болж байна.",
    skin("default","Ногоон","#22c55e","linear-gradient(160deg,#0891b2,#0e7490)","#164e63"),
    skin("special","Солонго","#c084fc","linear-gradient(160deg,#a855f7,#7c3aed)","#3b0764")),
  pet("Англи хэлний дадлагажигч", 20000, "turtle", "🐢", "Мэлхий", "Тэвчээртэй дадлага", "Удаан ч гэсэн баттай ахидаг дадалтай боллоо.",
    skin("default","Ногоон","#22c55e","linear-gradient(160deg,#65a30d,#3f6212)","#1a2e05"),
    skin("special","Далайн","#2dd4bf","linear-gradient(160deg,#14b8a6,#0f766e)","#042f2e")),
  pet("Үгийн сан сайтай", 28000, "raccoon", "🦝", "Элбэнх", "Үгийн сан", "Олон үгсийг цуглуулж, зөв ашиглаж эхэллээ.",
    skin("default","Саарал","#9ca3af","linear-gradient(160deg,#4b5563,#1f2937)","#030712"),
    skin("special","Шөнийн","#4b5563","linear-gradient(160deg,#111827,#030712)","#000000")),
  pet("Шалгалтад бэлтгэгч", 38000, "owl", "🦉", "Шар шувуу", "Бэлтгэл", "Анхааралтай, нягт, шалгалтад бэлэн болж байна.",
    skin("default","Бор","#a16207","linear-gradient(160deg,#a16207,#78350f)","#431407"),
    skin("special","Цасан","#93c5fd","linear-gradient(160deg,#38bdf8,#0369a1)","#0c4a6e")),
  pet("Англи хэлний туслагч", 50000, "dolphin", "🐬", "Дельфин", "Бусдад туслах", "Мэдсэн зүйлээ бусдад тайлбарлаж чаддаг боллоо.",
    skin("default","Цэнхэр","#38bdf8","linear-gradient(160deg,#0284c7,#0369a1)","#0c4a6e"),
    skin("special","Гүн далайн","#2563eb","linear-gradient(160deg,#1d4ed8,#1e3a8a)","#172554")),
  pet("Англи хэлний чадвартан", 65000, "lion", "🦁", "Арслан", "Итгэлтэй чадвар", "Англи хэл дээр илүү итгэлтэй болж байна.",
    skin("default","Алтан","#f59e0b","linear-gradient(160deg,#d97706,#92400e)","#431407"),
    skin("special","Хааны","#d97706","linear-gradient(160deg,#b45309,#451a03)","#1c0a00")),
  pet("Үгийн сангийн мастер", 85000, "tiger", "🐯", "Бар", "Мастер түвшин", "Үгийн сангаа хүчтэй эзэмшиж эхэллээ.",
    skin("default","Улбар","#fb923c","linear-gradient(160deg,#f97316,#c2410c)","#7c2d12"),
    skin("special","Цагаан бар","#e2e8f0","linear-gradient(160deg,#64748b,#1e293b)","#020617")),
  pet("Англи хэлний мастер", 110000, "wolf", "🐺", "Чоно", "Мастер", "Өөрийн арга барилтай, хүчтэй суралцагч боллоо.",
    skin("default","Саарал","#64748b","linear-gradient(160deg,#475569,#0f172a)","#020617"),
    skin("special","Шөнийн чоно","#38bdf8","linear-gradient(160deg,#1e40af,#020617)","#000000")),
  pet("Мэргэн суралцагч", 150000, "eagle", "🦅", "Бүргэд", "Мэргэн хараа", "Алсыг харж, зорилготой суралцдаг боллоо.",
    skin("default","Хүрэн","#78350f","linear-gradient(160deg,#b45309,#78350f)","#431407"),
    skin("special","Цагаан бүргэд","#fbbf24","linear-gradient(160deg,#d97706,#92400e)","#431407")),
  pet("Ахисан түвшний сурагч", 200000, "deer", "🦌", "Буга", "Ахисан түвшин", "Хурд, анхаарал, тэвчээр гурваа нэгтгэж байна.",
    skin("default","Хүрэн","#a16207","linear-gradient(160deg,#a16207,#78350f)","#431407"),
    skin("special","Цагаан буга","#bae6fd","linear-gradient(160deg,#0284c7,#0369a1)","#0c4a6e")),
  pet("Англи хэлний мэргэжилтэн", 275000, "horse", "🐴", "Морь", "Мэргэжлийн ахиц", "Урт замд ядрахгүй урагшилдаг түвшинд хүрлээ.",
    skin("default","Хүрэн морь","#92400e","linear-gradient(160deg,#c2410c,#7c2d12)","#450a0a"),
    skin("special","Хар морь","#6b7280","linear-gradient(160deg,#374151,#111827)","#030712")),
  pet("Үгийн сангийн мэргэжилтэн", 375000, "zebra", "🦓", "Тахь", "Үгийн сангийн мэргэжил", "Олон төрлийн үгийг ялгаж, цэгцтэй ашиглана.",
    skin("default","Судалтай","#f8fafc","linear-gradient(160deg,#374151,#0f172a)","#020617"),
    skin("special","Алтан судал","#fbbf24","linear-gradient(160deg,#d97706,#78350f)","#431407")),
  pet("Шилдэг суралцагч", 500000, "giraffe", "🦒", "Анааш", "Шилдэг түвшин", "Өндөр зорилготой, тогтвортой суралцагч боллоо.",
    skin("default","Шар","#facc15","linear-gradient(160deg,#ca8a04,#a16207)","#713f0c"),
    skin("special","Нарны толбо","#f97316","linear-gradient(160deg,#f97316,#7c2d12)","#450a0a")),
  pet("Онцгой суралцагч", 700000, "unicorn", "🦄", "Ганц эвэрт", "Онцгой түвшин", "Өөрийн онцгой хэв маягаар суралцдаг боллоо.",
    skin("default","Солонго","#c084fc","linear-gradient(160deg,#9333ea,#581c87)","#2e1065"),
    skin("special","Одны","#f0abfc","linear-gradient(160deg,#ec4899,#1d4ed8)","#172554")),
  pet("Англи хэлний аварга", 950000, "bear", "🐻", "Баавгай", "Аварга", "Их хүч, их тэвчээртэй суралцагч боллоо.",
    skin("default","Хүрэн","#92400e","linear-gradient(160deg,#b45309,#451a03)","#1c0a00"),
    skin("special","Цагаан баавгай","#7dd3fc","linear-gradient(160deg,#0ea5e9,#0369a1)","#0c4a6e")),
  pet("Үгийн сангийн аварга", 1250000, "gorilla", "🦍", "Горилла", "Үгийн аварга", "Үгийн сан чинь маш хүчтэй түвшинд хүрлээ.",
    skin("default","Хар саарал","#374151","linear-gradient(160deg,#374151,#0f172a)","#020617"),
    skin("special","Мөнгөн нуруу","#f59e0b","linear-gradient(160deg,#d97706,#030712)","#000000")),
  pet("Хэлний их мастер", 1600000, "dragon", "🐲", "Луу", "Их мастер", "Хэлний мэдлэг чинь домог мэт хүчтэй болж байна.",
    skin("default","Ногоон луу","#22c55e","linear-gradient(160deg,#16a34a,#052e16)","#022c22"),
    skin("special","Мөсөн луу","#38bdf8","linear-gradient(160deg,#0ea5e9,#0c4a6e)","#082f49")),
  pet("Эрдэмтэй суралцагч", 2000000, "peacock", "🦚", "Тогос", "Эрдэм", "Мэдлэгээ гоёмсог, зөв, цэгцтэй ашигладаг боллоо.",
    skin("default","Ногоон хөх","#0891b2","linear-gradient(160deg,#0891b2,#7c3aed)","#2e1065"),
    skin("special","Хааны тогос","#8b5cf6","linear-gradient(160deg,#7c3aed,#1e1b4b)","#0f0c3d")),
  pet("Домогт суралцагч", 3000000, "fireDragon", "🔥", "Домогт галт луу", "Домог", "Чи өдөр бүр сурдаг домогт суралцагч боллоо.",
    skin("default","Галт","#ef4444","linear-gradient(160deg,#dc2626,#7f1d1d)","#450a0a"),
    skin("special","Харанхуйн гал","#dc2626","linear-gradient(160deg,#991b1b,#020617)","#000000")),
];

function getCurrentRankPet(lifetimeXp: number) {
  let current = RANK_PETS[0];
  let next: RankPet | null = RANK_PETS[1] ?? null;
  for (let i = 0; i < RANK_PETS.length; i++) {
    if (lifetimeXp >= RANK_PETS[i].xp) {
      current = RANK_PETS[i];
      next = RANK_PETS[i + 1] ?? null;
    }
  }
  return { current, next };
}

function getSavedSkinKey(kind: PetKind) {
  return `rank-pet-skin-${kind}`;
}

// Duolingo-style per-kind animations
const KIND_ANIM: Record<string, string> = {
  egg: "petEggBob 2s ease-in-out infinite",
  chick: "petChickBounce 1.18s cubic-bezier(.34,1.56,.64,1) infinite",
  chick2: "petChickBounce 1.18s cubic-bezier(.34,1.56,.64,1) infinite",
  bunny: "petBunnyHop 1.32s cubic-bezier(.34,1.56,.64,1) infinite",
  hamster: "petCuteWiggle 2.05s ease-in-out infinite",
  cat: "petCuteWiggle 2.05s ease-in-out infinite",
  dog: "petCuteWiggle 2.05s ease-in-out infinite",
  fox: "petCuteWiggle 2.05s ease-in-out infinite",
  panda: "petCuteWiggle 2.05s ease-in-out infinite",
  koala: "petCuteWiggle 2.05s ease-in-out infinite",
  raccoon: "petCuteWiggle 2.05s ease-in-out infinite",
  penguin: "petPenguinWaddle 1.45s ease-in-out infinite",
  parrot: "petWingyFloat 1.65s ease-in-out infinite",
  owl: "petWingyFloat 1.65s ease-in-out infinite",
  eagle: "petWingyFloat 1.55s ease-in-out infinite",
  peacock: "petWingyFloat 1.7s ease-in-out infinite",
  turtle: "petTurtleSlow 3.1s ease-in-out infinite",
  dolphin: "petDolphinSwim 1.9s ease-in-out infinite",
  lion: "petStrongBounce 1.95s ease-in-out infinite",
  tiger: "petStrongBounce 1.95s ease-in-out infinite",
  bear: "petStrongBounce 1.95s ease-in-out infinite",
  gorilla: "petStrongBounce 1.95s ease-in-out infinite",
  wolf: "petWolfHowl 2.1s ease-in-out infinite",
  deer: "petRunnerFloat 1.85s ease-in-out infinite",
  horse: "petRunnerFloat 1.85s ease-in-out infinite",
  zebra: "petRunnerFloat 1.85s ease-in-out infinite",
  giraffe: "petRunnerFloat 1.85s ease-in-out infinite",
  unicorn: "petRunnerFloat 1.75s ease-in-out infinite",
  dragon: "petDragonFly 1.75s ease-in-out infinite",
  fireDragon: "petDragonFly 1.65s ease-in-out infinite, petFireGlow .62s ease-in-out infinite",
};

function AnimatedPet({ pet: p, skin }: { pet: RankPet; skin: Skin }) {
  const anim = KIND_ANIM[p.kind] ?? "petCuteWiggle 2.05s ease-in-out infinite";
  return (
    <div className={`rpc-mascot rpc-pet-${p.kind}`} aria-label={p.animalName}>
      <div className="rpc-aura" />
      <div className="rpc-cloud rpc-cloud-1" />
      <div className="rpc-cloud rpc-cloud-2" />
      <div className="rpc-heart rpc-heart-1">♥</div>
      <div className="rpc-heart rpc-heart-2">♥</div>
      <div className="rpc-heart rpc-heart-3">♥</div>
      <div className="rpc-spark rpc-spark-a">✦</div>
      <div className="rpc-spark rpc-spark-b">✧</div>
      <div className="rpc-spark rpc-spark-c">✦</div>
      <div className="rpc-shadow" />
      <div className="rpc-emoji-wrap">
        <div className="rpc-emoji" style={{ animation: anim }}>
          {p.emoji}
        </div>
        <div className="rpc-cheek rpc-cheek-l" />
        <div className="rpc-cheek rpc-cheek-r" />
        <div className="rpc-shine rpc-shine-1" />
        <div className="rpc-shine rpc-shine-2" />
      </div>
    </div>
  );
}

// ── Broken-heart overlay (Duolingo-style) ─────────────────────────────────────
function StreakLostOverlay({ onRecover }: { onRecover: () => void }) {
  return (
    <div className="rpc-lost-overlay">
      <div className="rpc-broken-heart">💔</div>
      <div className="rpc-lost-title">Streak алдагдлаа!</div>
      <div className="rpc-lost-sub">Таны streak тасарчихлаа. Дахин эхлэх үү?</div>
      <button type="button" className="rpc-recover-btn" onClick={onRecover}>
        Дахин эхлэх 🔥
      </button>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────
export function StreakRankPetCard({
  lifetimeXp,
  spendableXp,
  streak,
  longestStreak = streak,
  streakLost = false,
  onRecover,
  onClick,
}: {
  lifetimeXp: number;
  spendableXp?: number;
  streak: number;
  longestStreak?: number;
  /** Pass true to show the Duolingo-style broken-heart overlay */
  streakLost?: boolean;
  onRecover?: () => void;
  onClick?: () => void;
}) {
  const { current, next } = getCurrentRankPet(lifetimeXp);
  const [selectedSkin, setSelectedSkin] = useState<SkinId>("default");
  const [shaking, setShaking] = useState(false);
  const prevLost = useRef(false);

  // Shake card when streakLost first becomes true
  useEffect(() => {
    if (streakLost && !prevLost.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 700);
    }
    prevLost.current = streakLost;
  }, [streakLost]);

  useEffect(() => {
    const saved = localStorage.getItem(getSavedSkinKey(current.kind));
    setSelectedSkin(saved === "special" ? "special" : "default");
  }, [current.kind]);

  const activeSkin = useMemo(
    () => (selectedSkin === "special" ? current.specialSkin : current.defaultSkin),
    [current, selectedSkin]
  );

  const progress = next
    ? Math.min(100, Math.round(((lifetimeXp - current.xp) / Math.max(next.xp - current.xp, 1)) * 100))
    : 100;
  const leftXp = next ? Math.max(next.xp - lifetimeXp, 0) : 0;

  function handleSkinChange(skinId: SkinId) {
    setSelectedSkin(skinId);
    localStorage.setItem(getSavedSkinKey(current.kind), skinId);
  }

  return (
    <>
      <div
        className={`rpc-card${shaking ? " rpc-shake" : ""}`}
        style={{
          background: activeSkin.bg,
          boxShadow: `0 8px 0 ${activeSkin.shadowColor}, 0 14px 32px rgba(0,0,0,.35)`,
        } as React.CSSProperties}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* ── Broken-heart overlay ── */}
        {streakLost && <StreakLostOverlay onRecover={onRecover ?? (() => {})} />}

        {/* ── Decorative bubbles ── */}
        <div className="rpc-bubble rpc-bubble-tr" />
        <div className="rpc-bubble rpc-bubble-bl" />

        {/* ── Top row ── */}
        <div className="rpc-head">
          <div>
            <div className="rpc-label">RANK PET</div>
            <div className="rpc-title">{current.animalName}</div>
          </div>
          <div className="rpc-xp-pill">
            ⭐ {(spendableXp ?? lifetimeXp).toLocaleString()} XP
          </div>
        </div>

        {/* ── Skin selector ── */}
        <div className="rpc-skin-row" onClick={(e) => e.stopPropagation()}>
          {(["default", "special"] as SkinId[]).map((id) => {
            const s = id === "default" ? current.defaultSkin : current.specialSkin;
            return (
              <button
                key={id}
                type="button"
                className={`rpc-skin-btn${selectedSkin === id ? " active" : ""}`}
                onClick={() => handleSkinChange(id)}
              >
                <span className="rpc-skin-dot" style={{ background: s.dot }} />
                {s.name}
              </button>
            );
          })}
        </div>

        {/* ── Pet stage ── */}
        <div className="rpc-stage">
          <div className="rpc-halo" style={{ background: `radial-gradient(circle,rgba(255,255,255,.35) 0%,transparent 55%), radial-gradient(circle at 50% 76%,${activeSkin.dot},transparent 72%)` }} />
          <AnimatedPet pet={current} skin={activeSkin} />
        </div>

        {/* ── Rank info ── */}
        <div className="rpc-info">
          <div className="rpc-rank-name">{current.title}</div>
          <div className="rpc-rank-stage">{current.stage} · {activeSkin.name} skin</div>
          <div className="rpc-rank-desc">{current.description}</div>
        </div>

        {/* ── Progress ── */}
        <div className="rpc-prog-box">
          <div className="rpc-prog-head">
            <span>{next ? `Дараагийн цол: ${next.title}` : "Дээд цол хүрсэн"}</span>
            <span>{progress}%</span>
          </div>
          <div className="rpc-prog-track">
            <div className="rpc-prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="rpc-prog-note">
            {next
              ? `${leftXp.toLocaleString()} XP цуглуулбал ${next.animalName} нээгдэнэ.`
              : "Бүх амьтан нээгдсэн байна."}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="rpc-stats">
          <div className="rpc-stat">
            <span>Streak</span>
            <strong>🔥 {streak}</strong>
          </div>
          <div className="rpc-stat">
            <span>Хамгийн урт</span>
            <strong>{longestStreak}</strong>
          </div>
          <div className="rpc-stat">
            <span>Нийт XP</span>
            <strong>{lifetimeXp.toLocaleString()}</strong>
          </div>
        </div>
      </div>
      {/* ══ GLOBAL STYLES ══════════════════════════════════════════════════════ */}
      <style jsx global>{`
        /* ── Card shell ─────────────────────────────────────────────────────── */
        .rpc-card {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          padding: 20px 20px 24px;
          min-height: 580px;
          color: #fff;
          user-select: none;
          cursor: pointer;
          transition: transform .22s ease, filter .22s ease;
        }
        .rpc-card:hover { transform: translateY(-4px); }
        .rpc-card:hover .rpc-emoji { animation-name: petBoop !important; }

        /* shake when streak is lost */
        .rpc-shake { animation: rpcCardShake .7s cubic-bezier(.36,.07,.19,.97) both; }

        /* decorative translucent circles */
        .rpc-bubble { position: absolute; border-radius: 50%; pointer-events: none; }
        .rpc-bubble-tr {
          width: 240px; height: 240px;
          top: -90px; right: -80px;
          background: rgba(255,255,255,.18);
        }
        .rpc-bubble-bl {
          width: 200px; height: 200px;
          left: -80px; bottom: -90px;
          background: rgba(255,255,255,.12);
        }

        /* ── Broken-heart overlay ─────────────────────────────────────────── */
        .rpc-lost-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          border-radius: 28px;
          background: rgba(0,0,0,.78);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          animation: rpcFadeIn .35s ease;
        }
        .rpc-broken-heart {
          font-size: 110px;
          line-height: 1;
          animation: rpcBrokenShake .6s cubic-bezier(.36,.07,.19,.97) both infinite;
        }
        .rpc-lost-title {
          font-size: 24px;
          font-weight: 900;
          color: #ff4b4b;
          text-align: center;
        }
        .rpc-lost-sub {
          font-size: 14px;
          color: rgba(255,255,255,.75);
          text-align: center;
          max-width: 260px;
          line-height: 1.45;
        }
        .rpc-recover-btn {
          margin-top: 8px;
          border: none;
          border-radius: 999px;
          background: #ff4b4b;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          padding: 14px 32px;
          cursor: pointer;
          box-shadow: 0 5px 0 #a82222;
          transition: transform .12s, box-shadow .12s;
        }
        .rpc-recover-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #a82222; }

        /* ── Layout sections (all above bubbles) ──────────────────────────── */
        .rpc-head,
        .rpc-skin-row,
        .rpc-stage,
        .rpc-info,
        .rpc-prog-box,
        .rpc-stats { position: relative; z-index: 2; }

        /* ── Top row ──────────────────────────────────────────────────────── */
        .rpc-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .rpc-label {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .16em;
          opacity: .75;
          margin-bottom: 3px;
        }
        .rpc-title {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -.03em;
          line-height: 1.05;
        }
        .rpc-xp-pill {
          border-radius: 999px;
          background: rgba(255,255,255,.9);
          color: #1a1a1a;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,.2);
        }

        /* ── Skin selector ────────────────────────────────────────────────── */
        .rpc-skin-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rpc-skin-btn {
          border: none;
          cursor: pointer;
          border-radius: 999px;
          padding: 9px 10px;
          background: rgba(255,255,255,.28);
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
          transition: transform .15s, background .15s;
        }
        .rpc-skin-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,.42); }
        .rpc-skin-btn.active {
          background: rgba(255,255,255,.72);
          color: #1a1a1a;
          box-shadow: 0 0 0 3px rgba(255,255,255,.35), 0 6px 16px rgba(0,0,0,.18);
        }
        .rpc-skin-dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,.7);
          box-shadow: 0 2px 6px rgba(0,0,0,.2);
          flex-shrink: 0;
        }

        /* ── Pet stage ────────────────────────────────────────────────────── */
        .rpc-stage {
          position: relative;
          height: 330px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 6px 0 10px;
          overflow: visible;
        }
        .rpc-halo {
          position: absolute;
          width: 310px; height: 310px;
          border-radius: 50%;
          opacity: .32;
          filter: blur(10px);
          animation: rpcHaloPulse 3s ease-in-out infinite;
          z-index: 1;
        }

        /* ── Mascot wrapper ───────────────────────────────────────────────── */
        .rpc-mascot {
          position: relative;
          z-index: 20;
          width: 305px; height: 305px;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
          animation: rpcMascotFloat 2.5s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        .rpc-aura {
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: radial-gradient(circle,rgba(255,255,255,.45) 0%,transparent 40%);
          opacity: .4;
          filter: blur(14px);
          z-index: -2;
          animation: rpcAuraPulse 2.6s ease-in-out infinite;
        }
        .rpc-emoji-wrap {
          position: relative;
          width: 240px; height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }
        .rpc-emoji {
          position: relative;
          z-index: 30;
          font-size: 205px;
          line-height: 1;
          display: block;
          transform-origin: 50% 86%;
          filter: drop-shadow(0 22px 18px rgba(0,0,0,.3)) drop-shadow(0 5px 0 rgba(255,255,255,.2));
        }
        .rpc-shadow {
          position: absolute;
          z-index: -1;
          bottom: 20px;
          width: 210px; height: 38px;
          border-radius: 50%;
          background: rgba(0,0,0,.28);
          filter: blur(5px);
          animation: rpcShadowPulse 2.4s ease-in-out infinite;
        }

        /* clouds */
        .rpc-cloud {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,.24);
          z-index: -1;
          animation: rpcCloudFloat 3.2s ease-in-out infinite;
        }
        .rpc-cloud-1 { width: 86px; height: 86px; top: 20px; left: 26px; }
        .rpc-cloud-2 { width: 60px; height: 60px; right: 24px; bottom: 46px; animation-delay: .6s; }

        /* hearts */
        .rpc-heart {
          position: absolute;
          z-index: 8;
          color: rgba(255,105,135,.82);
          font-size: 20px;
          font-weight: 900;
          animation: rpcHeartPop 2.7s ease-in-out infinite;
        }
        .rpc-heart-1 { top: 42px; right: 56px; }
        .rpc-heart-2 { left: 58px; bottom: 72px; font-size: 16px; animation-delay: .7s; }
        .rpc-heart-3 { right: 78px; bottom: 44px; font-size: 13px; animation-delay: 1.2s; }

        /* sparks */
        .rpc-spark {
          position: absolute;
          z-index: 9;
          color: rgba(255,255,255,.98);
          font-size: 22px;
          line-height: 1;
          text-shadow: 0 0 14px rgba(255,255,255,.95);
          animation: rpcSparkle 2.6s ease-in-out infinite;
        }
        .rpc-spark-a { top: 50px; left: 50px; }
        .rpc-spark-b { top: 74px; right: 38px; font-size: 17px; animation-delay: .45s; }
        .rpc-spark-c { bottom: 58px; left: 80px; font-size: 18px; animation-delay: .9s; }

        /* cheeks */
        .rpc-cheek {
          position: absolute;
          top: 59%;
          width: 28px; height: 13px;
          border-radius: 50%;
          background: rgba(255,122,150,.3);
          filter: blur(1px);
          z-index: 45;
          pointer-events: none;
          animation: rpcCheekPulse 2s ease-in-out infinite;
        }
        .rpc-cheek-l { left: 20px; }
        .rpc-cheek-r { right: 20px; }

        /* shines */
        .rpc-shine {
          position: absolute;
          z-index: 46;
          border-radius: 50%;
          background: rgba(255,255,255,.92);
          box-shadow: 0 0 18px rgba(255,255,255,.9);
          animation: rpcShineTwinkle 2.6s ease-in-out infinite;
        }
        .rpc-shine-1 { width: 17px; height: 17px; top: 40px; left: 44px; }
        .rpc-shine-2 { width: 10px; height: 10px; top: 76px; right: 42px; animation-delay: .55s; }

        /* ── Rank info ────────────────────────────────────────────────────── */
        .rpc-info { text-align: center; margin-bottom: 14px; }
        .rpc-rank-name { font-size: 23px; font-weight: 900; margin-bottom: 3px; letter-spacing: -.03em; }
        .rpc-rank-stage { font-size: 13px; font-weight: 900; opacity: .78; margin-bottom: 7px; }
        .rpc-rank-desc { font-size: 13px; line-height: 1.45; font-weight: 800; opacity: .8; max-width: 340px; margin: 0 auto; }

        /* ── Progress box ─────────────────────────────────────────────────── */
        .rpc-prog-box {
          border-radius: 16px;
          padding: 12px;
          background: rgba(0,0,0,.22);
          margin-bottom: 12px;
        }
        .rpc-prog-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .rpc-prog-track {
          height: 14px;
          border-radius: 999px;
          background: rgba(0,0,0,.3);
          overflow: hidden;
          box-shadow: inset 0 2px 5px rgba(0,0,0,.3);
        }
        .rpc-prog-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,.5), #ffe066, #fff);
          box-shadow: 0 0 14px rgba(255,220,80,.8);
          transition: width .5s cubic-bezier(.34,1.56,.64,1);
        }
        .rpc-prog-note { font-size: 12px; font-weight: 800; opacity: .72; margin-top: 7px; }

        /* ── Stats ────────────────────────────────────────────────────────── */
        .rpc-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .rpc-stat {
          border-radius: 14px;
          background: rgba(0,0,0,.22);
          padding: 10px 10px;
          min-width: 0;
        }
        .rpc-stat span { display: block; font-size: 11px; font-weight: 900; opacity: .72; margin-bottom: 3px; }
        .rpc-stat strong { display: block; font-size: 17px; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ════════════════════════════════════════════════════════════════════
           PER-KIND EMOJI ANIMATIONS (Duolingo inspired)
           ════════════════════════════════════════════════════════════════════ */
        @keyframes petEggBob {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
          25%  { transform: translate3d(-3px,-8px,0) rotate(-4deg) scale(1.02,.98); }
          50%  { transform: translate3d(2px,-17px,0) rotate(4deg) scale(.97,1.06); }
          75%  { transform: translate3d(3px,-7px,0) rotate(-2deg) scale(1.03,.98); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
        }
        @keyframes petChickBounce {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
          18%  { transform: translate3d(-3px,-5px,0) rotate(-4deg) scale(1.04,.96); }
          40%  { transform: translate3d(3px,-27px,0) rotate(5deg) scale(.94,1.12); }
          62%  { transform: translate3d(-2px,-9px,0) rotate(-2deg) scale(1.08,.92); }
          80%  { transform: translate3d(2px,-3px,0) rotate(2deg) scale(.98,1.02); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
        }
        @keyframes petBunnyHop {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
          20%  { transform: translate3d(-4px,-8px,0) rotate(-5deg) scale(1.04,.96); }
          42%  { transform: translate3d(5px,-32px,0) rotate(4deg) scale(.93,1.14); }
          64%  { transform: translate3d(-2px,-9px,0) rotate(-2deg) scale(1.08,.92); }
          83%  { transform: translate3d(2px,-3px,0) rotate(1deg) scale(.99,1.02); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
        }
        @keyframes petCuteWiggle {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
          16%  { transform: translate3d(-4px,-5px,0) rotate(-5deg) scale(1.035,.97); }
          34%  { transform: translate3d(4px,-12px,0) rotate(4deg) scale(.98,1.055); }
          54%  { transform: translate3d(-3px,-8px,0) rotate(-3deg) scale(1.025,.985); }
          74%  { transform: translate3d(3px,-3px,0) rotate(2deg) scale(.995,1.015); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
        }
        @keyframes petPenguinWaddle {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
          20%  { transform: translate3d(-6px,-5px,0) rotate(-9deg) scale(1.02,.98); }
          40%  { transform: translate3d(0,-9px,0) rotate(0deg) scale(.98,1.04); }
          60%  { transform: translate3d(6px,-5px,0) rotate(9deg) scale(1.02,.98); }
          80%  { transform: translate3d(0,-2px,0) rotate(0deg) scale(1.01,.99); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1,1); }
        }
        @keyframes petWingyFloat {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          18%  { transform: translate3d(-4px,-9px,0) rotate(-6deg) scale(1.04); }
          40%  { transform: translate3d(4px,-24px,0) rotate(7deg) scale(1.08); }
          62%  { transform: translate3d(-2px,-11px,0) rotate(-3deg) scale(1.03); }
          82%  { transform: translate3d(2px,-4px,0) rotate(2deg) scale(1.01); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
        }
        @keyframes petTurtleSlow {
          0%   { transform: translate3d(-8px,0,0) rotate(-1deg) scale(1); }
          25%  { transform: translate3d(-2px,-4px,0) rotate(1deg) scale(1.015); }
          50%  { transform: translate3d(10px,-8px,0) rotate(2deg) scale(1.03); }
          75%  { transform: translate3d(3px,-3px,0) rotate(-1deg) scale(1.01); }
          100% { transform: translate3d(-8px,0,0) rotate(-1deg) scale(1); }
        }
        @keyframes petDolphinSwim {
          0%   { transform: translate3d(-6px,0,0) rotate(-12deg) scale(1); }
          25%  { transform: translate3d(4px,-13px,0) rotate(-2deg) scale(1.04); }
          50%  { transform: translate3d(10px,-30px,0) rotate(10deg) scale(1.08); }
          75%  { transform: translate3d(0,-13px,0) rotate(3deg) scale(1.04); }
          100% { transform: translate3d(-6px,0,0) rotate(-12deg) scale(1); }
        }
        @keyframes petStrongBounce {
          0%   { transform: translate3d(0,0,0) scale(1,1) rotate(0deg); }
          22%  { transform: translate3d(-3px,-6px,0) scale(1.03,.97) rotate(-2deg); }
          48%  { transform: translate3d(3px,-19px,0) scale(.97,1.09) rotate(2deg); }
          70%  { transform: translate3d(-2px,-5px,0) scale(1.05,.95) rotate(-1deg); }
          100% { transform: translate3d(0,0,0) scale(1,1) rotate(0deg); }
        }
        @keyframes petWolfHowl {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          28%  { transform: translate3d(-3px,-9px,0) rotate(-6deg) scale(1.03); }
          52%  { transform: translate3d(2px,-19px,0) rotate(-13deg) scale(1.07); }
          76%  { transform: translate3d(1px,-5px,0) rotate(-4deg) scale(1.02); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
        }
        @keyframes petRunnerFloat {
          0%   { transform: translate3d(-4px,0,0) rotate(0deg) scale(1,1); }
          20%  { transform: translate3d(3px,-8px,0) rotate(2deg) scale(1.035,.97); }
          42%  { transform: translate3d(8px,-19px,0) rotate(4deg) scale(.97,1.08); }
          64%  { transform: translate3d(0,-8px,0) rotate(-2deg) scale(1.03,.985); }
          84%  { transform: translate3d(-3px,-3px,0) rotate(1deg) scale(1.01,1); }
          100% { transform: translate3d(-4px,0,0) rotate(0deg) scale(1,1); }
        }
        @keyframes petDragonFly {
          0%   { transform: translate3d(0,0,0) rotate(-4deg) scale(1); }
          18%  { transform: translate3d(-5px,-10px,0) rotate(-8deg) scale(1.04); }
          42%  { transform: translate3d(6px,-30px,0) rotate(7deg) scale(1.09); }
          64%  { transform: translate3d(-3px,-14px,0) rotate(-3deg) scale(1.04); }
          84%  { transform: translate3d(3px,-5px,0) rotate(2deg) scale(1.015); }
          100% { transform: translate3d(0,0,0) rotate(-4deg) scale(1); }
        }
        @keyframes petFireGlow {
          0%,100% {
            filter:
              drop-shadow(0 22px 18px rgba(0,0,0,.3))
              drop-shadow(0 0 14px rgba(239,68,68,.45));
          }
          50% {
            filter:
              drop-shadow(0 22px 18px rgba(0,0,0,.3))
              drop-shadow(0 0 40px rgba(249,115,22,.95));
          }
        }
        @keyframes petBoop {
          0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          22%  { transform: translate3d(-4px,-13px,0) rotate(-5deg) scale(1.08,.95); }
          45%  { transform: translate3d(4px,-22px,0) rotate(4deg) scale(.96,1.13); }
          68%  { transform: translate3d(-2px,-6px,0) rotate(-2deg) scale(1.04,.98); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
        }

        /* ── Mascot float wrapper ─────────────────────────────────────────── */
        @keyframes rpcMascotFloat {
          0%   { transform: translate3d(0,0,0) rotate(0deg); }
          25%  { transform: translate3d(3px,-7px,0) rotate(-1.2deg); }
          50%  { transform: translate3d(0,-13px,0) rotate(.8deg); }
          75%  { transform: translate3d(-3px,-6px,0) rotate(1.2deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg); }
        }

        /* ── Ambient animations ───────────────────────────────────────────── */
        @keyframes rpcHaloPulse {
          0%,100% { opacity: .22; transform: scale(.93); }
          50%      { opacity: .48; transform: scale(1.09); }
        }
        @keyframes rpcAuraPulse {
          0%,100% { opacity: .3; transform: scale(.93); }
          50%      { opacity: .6; transform: scale(1.09); }
        }
        @keyframes rpcShadowPulse {
          0%,100% { opacity: .26; transform: scaleX(1); }
          50%      { opacity: .14; transform: scaleX(.78); }
        }
        @keyframes rpcCloudFloat {
          0%,100% { transform: translateY(0) scale(1); opacity: .38; }
          50%      { transform: translateY(-10px) scale(1.06); opacity: .66; }
        }
        @keyframes rpcHeartPop {
          0%,100% { opacity: 0; transform: translateY(10px) scale(.65) rotate(-8deg); }
          35%      { opacity: 1; transform: translateY(-4px) scale(1.12) rotate(6deg); }
          65%      { opacity: .75; transform: translateY(-18px) scale(.95) rotate(-4deg); }
        }
        @keyframes rpcSparkle {
          0%,100% { opacity: .45; transform: translateY(0) scale(.85) rotate(0deg); }
          50%      { opacity: 1;   transform: translateY(-12px) scale(1.28) rotate(18deg); }
        }
        @keyframes rpcCheekPulse {
          0%,100% { opacity: .38; transform: scale(.94); }
          50%      { opacity: .78; transform: scale(1.1); }
        }
        @keyframes rpcShineTwinkle {
          0%,100% { opacity: .3; transform: scale(.8); }
          50%      { opacity: 1;  transform: scale(1.38); }
        }

        /* ── Overlay / card animations ────────────────────────────────────── */
        @keyframes rpcFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rpcBrokenShake {
          0%,100% { transform: rotate(0deg); }
          20%     { transform: rotate(-12deg); }
          40%     { transform: rotate(12deg); }
          60%     { transform: rotate(-8deg); }
          80%     { transform: rotate(8deg); }
        }
        @keyframes rpcCardShake {
          0%,100% { transform: rotate(0deg) scale(1); }
          15%     { transform: rotate(-3deg) scale(.97); }
          30%     { transform: rotate(3deg) scale(.97); }
          45%     { transform: rotate(-2deg); }
          60%     { transform: rotate(2deg); }
          75%     { transform: rotate(-1deg); }
        }

        /* ── Responsive ───────────────────────────────────────────────────── */
        @media (max-width: 520px) {
          .rpc-card { padding: 16px 16px 20px; border-radius: 24px; min-height: 545px; }
          .rpc-title { font-size: 24px; }
          .rpc-skin-row { grid-template-columns: 1fr; }
          .rpc-stage { height: 300px; }
          .rpc-mascot { width: 280px; height: 280px; }
          .rpc-emoji-wrap { width: 218px; height: 218px; }
          .rpc-emoji { font-size: 186px; }
          .rpc-halo { width: 275px; height: 275px; }
          .rpc-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}