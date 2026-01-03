import type { GoldPriceSnapshot } from "@/types/gold-day";
import { getMockGoldPrice } from "@/lib/mock-data";
import { db } from "@/lib/db";

interface GoldPriceAPIResponse {
  gram: number;
  quarter: number;
  half: number;
  full: number;
  updatedAt: string;
}

export function getTurkeyTime(): Date {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
}

function canMakeRequestNow(): { allowed: boolean; nextRequestTime?: string; lastRequestTime?: string } {
  const turkeyTime = getTurkeyTime();
  const hour = turkeyTime.getHours();
  const minute = turkeyTime.getMinutes();
  const currentTime = hour * 60 + minute;

  const allowedTimes = [
    8 * 60,   // 08:00
    12 * 60,  // 12:00
    16 * 60
  ];

  const isAllowedTime = allowedTimes.some(allowedTime => {
    return currentTime >= allowedTime && currentTime < allowedTime + 5;
  });

  if (isAllowedTime) {
    return { allowed: true };
  }

  const nextAllowedTime = allowedTimes.find(time => time > currentTime) || allowedTimes[0];
  const nextHour = Math.floor(nextAllowedTime / 60);
  const nextMinute = nextAllowedTime % 60;
  const nextRequestTime = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

  const lastAllowedTime = [...allowedTimes].reverse().find(time => time <= currentTime);
  if (lastAllowedTime) {
    const lastHour = Math.floor(lastAllowedTime / 60);
    const lastMinute = lastAllowedTime % 60;
    const lastRequestTime = `${lastHour.toString().padStart(2, '0')}:${lastMinute.toString().padStart(2, '0')}`;
    return { allowed: false, nextRequestTime, lastRequestTime };
  }

  return { allowed: false, nextRequestTime: `Yarın ${nextRequestTime}` };
}

async function fetchFromCollectAPI(): Promise<GoldPriceAPIResponse> {
  const apiToken = process.env.COLLECTAPI_TOKEN;
  
  if (!apiToken) {
    throw new Error("COLLECTAPI_TOKEN environment variable bulunamadı");
  }

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
    
    let gram = 0;
    let quarter = 0;
    let half = 0;
    let full = 0;
    
    if (data.result && Array.isArray(data.result)) {
      data.result.forEach((item: any) => {
        const name = (item.name || "").toLowerCase().trim();
        
        // buying zaten number olarak geliyor, direkt kullan
        let buying: number = 0;
        if (item.buying !== undefined && item.buying !== null) {
          if (typeof item.buying === "number") {
            buying = item.buying;
          } else if (typeof item.buying === "string") {
            // String ise parse et (binlik ayırıcı nokta, ondalık virgül olabilir)
            buying = parseFloat(item.buying.replace(/[^\d.,]/g, "").replace(",", "."));
          }
        } else if (item.buyingstr) {
          // buyingstr string olarak geliyor
          buying = parseFloat(item.buyingstr.replace(/[^\d.,]/g, "").replace(",", "."));
        }
        
        // İsim eşleştirmesi - API'den gelen tam isimlerle eşleştir
        // "Eski" olanları hariç tut
        if (name === "gram altın") {
          gram = Math.round(buying);
        } else if (name === "çeyrek altın" && !name.includes("eski")) {
          quarter = Math.round(buying);
        } else if (name === "yarım altın" && !name.includes("eski")) {
          half = Math.round(buying);
        } else if (name === "tam altın" && !name.includes("eski")) {
          full = Math.round(buying);
        }
      });
    }
    
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

function getRequestTimeSlot(time: Date): number | null {
  const hour = time.getHours();
  const minute = time.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const allowedTimes = [
    8 * 60,   // 08:00
    12 * 60,  // 12:00
    16 * 60   // 16:00
  ];
  
  // İzin verilen saatlerden birinde mi? (5 dakika tolerans)
  for (const allowedTime of allowedTimes) {
    if (timeInMinutes >= allowedTime && timeInMinutes < allowedTime + 5) {
      return allowedTime;
    }
  }
  
  return null;
}

async function getCachedPrice(): Promise<GoldPriceSnapshot | null> {
  try {
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
    
    // Aynı gün kontrolü
    const isSameDay = 
      cacheTime.getDate() === turkeyTime.getDate() &&
      cacheTime.getMonth() === turkeyTime.getMonth() &&
      cacheTime.getFullYear() === turkeyTime.getFullYear();
    
    if (!isSameDay) {
      return null; // Farklı gün, cache geçersiz
    }
    
    // Şu anki zaman slotunu kontrol et
    const currentTimeSlot = getRequestTimeSlot(turkeyTime);
    const cacheTimeSlot = getRequestTimeSlot(cacheTime);
    
    // Eğer şu an izin verilen saatlerden birindeysek
    if (currentTimeSlot !== null) {
      // Cache'in ne zaman yapıldığını kontrol et
      const timeDiff = Math.abs(turkeyTime.getTime() - cacheTime.getTime());
      const oneMinute = 60 * 1000;
      
      // Eğer cache aynı saat slotunda yapılmışsa ve 1 dakikadan az zaman geçmişse
      // cache'i kullan (duplicate request'i önlemek için)
      if (cacheTimeSlot === currentTimeSlot && timeDiff < oneMinute) {
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
      
      // İzin verilen saatlerden birindeyiz ve cache farklı saatte veya eski
      // Yeni istek yapılmalı
      return null;
    }
    
    // Eğer şu an izin verilen saatlerden birinde değilsek, cache'i kullan
    // (çünkü yeni istek yapamayız zaten)
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
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('undefined')) {
      return null;
    }
    console.error("Cache okuma hatası:", error);
    return null;
  }
}

async function setCachedPrice(price: GoldPriceSnapshot): Promise<void> {
  try {
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
    if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('undefined')) {
      return;
    }
    console.error("Cache kaydetme hatası:", error);
  }
}

export async function fetchGoldPrice(): Promise<GoldPriceSnapshot> {
  const cached = await getCachedPrice();
  if (cached) {
    return cached;
  }

  try {
    const result = await fetchFromCollectAPI();
    await setCachedPrice(result);
    return result;
  } catch (error: any) {
    if (error.message?.includes("İstek yapılamaz")) {
      const cached = await getCachedPrice();
      if (cached) {
        return cached;
      }
      return getMockGoldPrice();
    }
    
    console.error("CollectAPI hatası, mock data kullanılıyor:", error.message);
    return getMockGoldPrice();
  }
}
