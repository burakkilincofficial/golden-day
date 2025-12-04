import type { GoldPriceSnapshot } from "@/types/gold-day";
import { getMockGoldPrice } from "@/lib/mock-data";
import { db } from "@/lib/db";

/**
 * Altın fiyatı API servisi
 * Sadece CollectAPI kullanılıyor
 * Günlük 3 istek limiti: 08:00, 12:00, 16:00 (Türkiye saati)
 */

interface GoldPriceAPIResponse {
  gram: number;
  quarter: number;
  half: number;
  full: number;
  updatedAt: string;
}

/**
 * Türkiye saatine göre şu anki saat (UTC+3)
 */
function getTurkeyTime(): Date {
  const now = new Date();
  // UTC'yi Türkiye saatine çevir (UTC+3)
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
}

/**
 * İstek yapılabilir saatler: 08:00, 12:00, 16:00 (Türkiye saati)
 * Bu saatler dışında istek atılmaz
 */
function canMakeRequestNow(): { allowed: boolean; nextRequestTime?: string; lastRequestTime?: string } {
  const turkeyTime = getTurkeyTime();
  const hour = turkeyTime.getHours();
  const minute = turkeyTime.getMinutes();
  const currentTime = hour * 60 + minute; // Dakika cinsinden

  // İzin verilen saatler (dakika cinsinden)
  const allowedTimes = [
    8 * 60,   // 08:00
    12 * 60,  // 12:00
    16 * 60   // 16:00
  ];

  // Şu anki saat izin verilen saatlerden biri mi?
  // 5 dakika tolerans (08:00-08:05, 12:00-12:05, 16:00-16:05)
  const isAllowedTime = allowedTimes.some(allowedTime => {
    return currentTime >= allowedTime && currentTime < allowedTime + 5;
  });

  if (isAllowedTime) {
    return { allowed: true };
  }

  // Bir sonraki izin verilen saati bul
  const nextAllowedTime = allowedTimes.find(time => time > currentTime) || allowedTimes[0];
  const nextHour = Math.floor(nextAllowedTime / 60);
  const nextMinute = nextAllowedTime % 60;
  const nextRequestTime = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

  // Son istek zamanını bul (bugünkü izin verilen saatlerden en son geçen)
  const lastAllowedTime = [...allowedTimes].reverse().find(time => time <= currentTime);
  if (lastAllowedTime) {
    const lastHour = Math.floor(lastAllowedTime / 60);
    const lastMinute = lastAllowedTime % 60;
    const lastRequestTime = `${lastHour.toString().padStart(2, '0')}:${lastMinute.toString().padStart(2, '0')}`;
    return { allowed: false, nextRequestTime, lastRequestTime };
  }

  // Eğer hiçbir izin verilen saat geçmediyse, bugünkü ilk saat yarın olacak
  return { allowed: false, nextRequestTime: `Yarın ${nextRequestTime}` };
}

/**
 * CollectAPI - Tek API (günlük 3 istek: 08:00, 12:00, 16:00 Türkiye saati)
 */
async function fetchFromCollectAPI(): Promise<GoldPriceAPIResponse> {
  const apiToken = process.env.COLLECTAPI_TOKEN;
  
  if (!apiToken) {
    throw new Error("COLLECTAPI_TOKEN environment variable bulunamadı");
  }

  // İstek yapılabilir saat kontrolü
  const timeCheck = canMakeRequestNow();
  if (!timeCheck.allowed) {
    throw new Error(
      `İstek yapılamaz. İzin verilen saatler: 08:00, 12:00, 16:00 (Türkiye saati). ` +
      `Son istek: ${timeCheck.lastRequestTime || 'Henüz yapılmadı'}. ` +
      `Sonraki istek: ${timeCheck.nextRequestTime}`
    );
  }

  try {
    const response = await fetch(
      "https://api.collectapi.com/economy/goldPrice",
      {
        // Cache yok - sadece izin verilen saatlerde istek atılır
        cache: 'no-store',
        headers: {
          "authorization": `apikey ${apiToken}`,
          "content-type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // CollectAPI yapısına göre parse et
    let gram = 0;
    let quarter = 0;
    let half = 0;
    let full = 0;
    
    if (data.result && Array.isArray(data.result)) {
      data.result.forEach((item: any) => {
        const name = (item.name || "").toLowerCase();
        
        // buying number olabilir veya buyingstr string olabilir
        let buying: number;
        if (item.buying !== undefined && item.buying !== null) {
          buying = typeof item.buying === "string" 
            ? parseFloat(item.buying.replace(/[^\d.,]/g, "").replace(",", "."))
            : Number(item.buying);
        } else if (item.buyingstr) {
          buying = parseFloat(item.buyingstr.replace(/[^\d.,]/g, "").replace(",", "."));
        } else {
          buying = 0;
        }
        
        // Tam eşleşme kontrolü
        if (name === "gram altın") {
          gram = Math.round(buying);
        } else if (name === "çeyrek altın" && !name.includes("eski")) {
          quarter = Math.round(buying);
        } else if (name === "yarım altın" && !name.includes("eski")) {
          half = Math.round(buying);
        } else if (name === "tam altın" && !name.includes("eski") && !name.includes("çeyrek") && !name.includes("yarım")) {
          full = Math.round(buying);
        }
      });
    }
    
    // Eğer gram varsa ama diğerleri yoksa hesapla
    if (gram > 0 && quarter === 0) {
      quarter = Math.round(gram * 1.75);
    }
    if (gram > 0 && half === 0) {
      half = Math.round(gram * 3.5);
    }
    if (gram > 0 && full === 0) {
      full = Math.round(gram * 7);
    }
    
    if (gram === 0 && quarter === 0) {
      throw new Error("Altın fiyatları parse edilemedi");
    }

    return {
      gram: gram || Math.round(quarter / 1.75) || 2570,
      quarter: quarter || Math.round(gram * 1.75),
      half: half || Math.round(gram * 3.5),
      full: full || Math.round(gram * 7),
      updatedAt: new Date().toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Istanbul"
      })
    };
  } catch (error) {
    console.error("CollectAPI hatası:", error);
    throw error;
  }
}

/**
 * Database'den cache'lenmiş fiyatları al
 */
async function getCachedPrice(): Promise<GoldPriceSnapshot | null> {
  try {
    // Prisma client'ın yeni modeli tanıyıp tanımadığını kontrol et
    if (!db.goldPriceCache) {
      return null;
    }

    const cache = await db.goldPriceCache.findUnique({
      where: { id: "gold-price-cache" }
    });

    if (!cache) {
      return null;
    }

    const turkeyTime = getTurkeyTime();
    const cacheTime = new Date(cache.requestTime);
    
    // Cache bugün çekildiyse kullan
    if (
      cacheTime.getDate() === turkeyTime.getDate() &&
      cacheTime.getMonth() === turkeyTime.getMonth() &&
      cacheTime.getFullYear() === turkeyTime.getFullYear()
    ) {
      return {
        gram: Math.round(cache.gram),
        quarter: Math.round(cache.quarter),
        half: Math.round(cache.half),
        full: Math.round(cache.full),
        updatedAt: cache.updatedAt.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Istanbul"
        })
      };
    }

    return null;
  } catch (error: any) {
    // Eğer table yoksa (P2021) veya model tanınmıyorsa sessizce null döndür
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('undefined')) {
      return null;
    }
    console.error("Cache okuma hatası:", error);
    return null;
  }
}

/**
 * Database'e fiyat kaydet
 */
async function setCachedPrice(price: GoldPriceSnapshot): Promise<void> {
  try {
    // Prisma client'ın yeni modeli tanıyıp tanımadığını kontrol et
    if (!db.goldPriceCache) {
      return;
    }

    await db.goldPriceCache.upsert({
      where: { id: "gold-price-cache" },
      create: {
        id: "gold-price-cache",
        gram: price.gram,
        quarter: price.quarter,
        half: price.half,
        full: price.full,
        requestTime: getTurkeyTime()
      },
      update: {
        gram: price.gram,
        quarter: price.quarter,
        half: price.half,
        full: price.full,
        requestTime: getTurkeyTime()
      }
    });
  } catch (error: any) {
    // Eğer table yoksa (P2021) veya model tanınmıyorsa sessizce devam et
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('undefined')) {
      return;
    }
    console.error("Cache kaydetme hatası:", error);
    // Hata olsa bile devam et
  }
}

/**
 * Ana fonksiyon: Altın fiyatlarını çeker
 * Günlük 3 istek: 08:00, 12:00, 16:00 (Türkiye saati)
 * Bu saatler dışında cache'den döner
 */
export async function fetchGoldPrice(): Promise<GoldPriceSnapshot> {
  // Önce cache'i kontrol et
  const cached = await getCachedPrice();
  if (cached) {
    return cached;
  }

  // İzin verilen saatlerde istek at
  try {
    const result = await fetchFromCollectAPI();
    // Başarılı sonucu cache'e kaydet
    await setCachedPrice(result);
    return result;
  } catch (error: any) {
    // Eğer saat dışındaysa ve cache varsa cache'den dönsün
    if (error.message?.includes("İstek yapılamaz")) {
      // Cache'den dön (eğer varsa)
      const cached = await getCachedPrice();
      if (cached) {
        return cached;
      }
      // Cache yoksa mock data döndür
      return getMockGoldPrice();
    }
    
    // Diğer hatalar için mock data
    console.error("CollectAPI hatası, mock data kullanılıyor:", error.message);
    return getMockGoldPrice();
  }
}
