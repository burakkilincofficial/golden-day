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
 * KV'nin kullanılabilir olup olmadığını kontrol et
 */
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Cache'den altın fiyatlarını al
 * Local'de KV yoksa null döner
 */
export async function getCachedPrice(): Promise<CachedPrice | null> {
  if (!isKVAvailable()) {
    return null;
  }
  
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
    return null;
  }
}

/**
 * Altın fiyatlarını cache'e kaydet
 * Local'de KV yoksa sessizce devam eder
 */
export async function setCachedPrice(data: {
  gram: number;
  quarter: number;
  half: number;
  full: number;
  updatedAt: string;
}): Promise<void> {
  if (!isKVAvailable()) {
    return;
  }
  
  try {
    const cacheData: CachedPrice = {
      data,
      timestamp: new Date().toISOString()
    };
    
    // 8 saat TTL ile kaydet
    await kv.set(CACHE_KEY, cacheData, { ex: CACHE_TTL });
  } catch (error) {
    // Hata durumunda sessizce devam et (local'de KV yoksa normal)
  }
}

