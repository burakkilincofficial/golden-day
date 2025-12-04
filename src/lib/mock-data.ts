import type {
  GoldPriceSnapshot,
  Member,
  MonthTracking
} from "@/types/gold-day";

const baseMembers: Member[] = [
  { id: "m1", name: "Ayşe" },
  { id: "m2", name: "Fatma" },
  { id: "m3", name: "Emine" },
  { id: "m4", name: "Zeynep" },
  { id: "m5", name: "Elif" }
];

export function getMockMembers(): Member[] {
  return baseMembers;
}

export function getMockGoldPrice(): GoldPriceSnapshot {
  const gram = 2570;
  return {
    gram,
    quarter: Math.round(gram * 1.75),
    half: Math.round(gram * 3.5),
    full: Math.round(gram * 7),
    updatedAt: new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  };
}

/**
 * Deterministik shuffle fonksiyonu (seed-based)
 * Aynı seed ile aynı sıralamayı üretir
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentSeed = seed;

  // Basit bir PRNG (Pseudo-Random Number Generator)
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Yeni bir kura çeker ve 12 aylık tracking oluşturur
 */
export function createNewDraw(
  members: Member[],
  monthsToGenerate = 12,
  seed?: number
): MonthTracking[] {
  if (!members.length) {
    return [];
  }

  // Seed olarak timestamp kullan (veya verilen seed'i kullan)
  const drawSeed = seed ?? Date.now();
  const shuffled = seededShuffle(members, drawSeed);

  return Array.from({ length: monthsToGenerate }, (_, monthIndex) => {
    // Üyeleri döngüsel olarak atar (eğer üye sayısı 12'den azsa tekrar eder)
    const host = shuffled[monthIndex % shuffled.length];

    return {
      monthIndex,
      hostId: host.id,
      payments: members.map((m) => ({
        memberId: m.id,
        hasPaid: false
      }))
    };
  });
}

/**
 * İlk tracking oluşturma (backward compatibility)
 */
export function createInitialTracking(
  members: Member[],
  monthsToGenerate = 12
): MonthTracking[] {
  return createNewDraw(members, monthsToGenerate);
}


