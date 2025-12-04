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

/**
 * Mock gold price - CollectAPI response'una göre güncellendi
 * Gerçek API başarısız olursa bu kullanılır
 */
export function getMockGoldPrice(): GoldPriceSnapshot {
  // CollectAPI'den gelen gerçek değerler (2025-12-04)
  const gram = 5755; // Gram Altın: 5754.89
  const quarter = 9313; // Çeyrek Altın: 9313.26
  const half = 18627; // Yarım Altın: 18626.53
  const full = 37138; // Tam Altın: 37138.07
  
  return {
    gram,
    quarter,
    half,
    full,
    updatedAt: new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
 * Artık kullanılmıyor - database'den geliyor
 * Sadece backward compatibility için
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
  const currentYear = new Date().getFullYear();

  return Array.from({ length: monthsToGenerate }, (_, index) => {
    // Üyeleri döngüsel olarak atar (eğer üye sayısı 12'den azsa tekrar eder)
    const host = shuffled[index % shuffled.length];
    const month = index + 1; // 1-12 (Ocak-Aralık)

    return {
      id: `mock-${month}-${currentYear}`,
      month,
      year: currentYear,
      hostMemberId: host.id,
      hostMemberName: host.name,
      payments: members.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        paid: false
      }))
    };
  });
}

/**
 * İlk tracking oluşturma (backward compatibility)
 * Artık kullanılmıyor - database'den geliyor
 */
export function createInitialTracking(
  members: Member[],
  monthsToGenerate = 12
): MonthTracking[] {
  return createNewDraw(members, monthsToGenerate);
}


