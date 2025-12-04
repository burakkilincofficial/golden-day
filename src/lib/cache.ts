import { kv } from "@vercel/kv";

const CACHE_KEY = "gold_price:cache";
const CACHE_TTL = 8 * 60 * 60; // 8 saat cache (günde 3 istek için yeterli)

interface CachedPrice {
  data: {
    gram: number;
    quarter: number;
    half: number;
    full: number;
    updatedAt: string;
  };
  timestamp: string;
}

/**
 * Cache'den altın fiyatlarını al
 */
export async function getCachedPrice(): Promise<CachedPrice | null> {
  try {
    const cached = await kv.get<CachedPrice>(CACHE_KEY);
    if (!cached) return null;
    
    // Cache süresi kontrolü
    const cacheTime = new Date(cached.timestamp).getTime();
    const now = Date.now();
    const ageInHours = (now - cacheTime) / (1000 * 60 * 60);
    
    // 8 saatten eski cache'i kullanma
    if (ageInHours > 8) {
      await kv.del(CACHE_KEY);
      return null;
    }
    
    return cached;
  } catch (error) {
    console.error("Cache okuma hatası:", error);
    return null;
  }
}

/**
 * Altın fiyatlarını cache'e kaydet
 */
export async function setCachedPrice(data: {
  gram: number;
  quarter: number;
  half: number;
  full: number;
  updatedAt: string;
}): Promise<void> {
  try {
    const cacheData: CachedPrice = {
      data,
      timestamp: new Date().toISOString()
    };
    
    // 8 saat TTL ile kaydet
    await kv.set(CACHE_KEY, cacheData, { ex: CACHE_TTL });
  } catch (error) {
    console.error("Cache kayıt hatası:", error);
    // Hata durumunda sessizce devam et
  }
}

