import { kv } from "@vercel/kv";

/**
 * Vercel KV (Redis) yardımcı fonksiyonları
 * Son API isteği zamanını ve istek sayısını kaydetmek için
 * Local'de KV yoksa otomatik olarak izin verir (fallback)
 */

const LAST_REQUEST_KEY = "gold_price:last_request";
const REQUEST_COUNT_KEY = "gold_price:request_count";
const REQUEST_DATE_KEY = "gold_price:request_date";

/**
 * KV'nin kullanılabilir olup olmadığını kontrol et
 */
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Son istek zamanını ve sayısını kontrol et
 * Günde maksimum 3 istek yapılabilir
 * Local'de KV yoksa her zaman true döner
 */
export async function canMakeRequest(): Promise<boolean> {
  // Local'de KV yoksa her zaman izin ver
  if (!isKVAvailable()) {
    return true;
  }
  
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastDate = await kv.get<string>(REQUEST_DATE_KEY);
    const requestCount = await kv.get<number>(REQUEST_COUNT_KEY) || 0;

    // Eğer bugün değilse, sayacı sıfırla
    if (lastDate !== today) {
      await kv.set(REQUEST_DATE_KEY, today);
      await kv.set(REQUEST_COUNT_KEY, 0);
      return true;
    }

    // Bugün 3'ten az istek yapıldıysa izin ver
    return requestCount < 3;
  } catch (error) {
    // Hata durumunda sessizce izin ver (fallback)
    return true;
  }
}

/**
 * İstek yapıldığını kaydet
 * Local'de KV yoksa sessizce devam eder
 */
export async function recordRequest(): Promise<void> {
  // Local'de KV yoksa sessizce devam et
  if (!isKVAvailable()) {
    return;
  }
  
  try {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    
    const lastDate = await kv.get<string>(REQUEST_DATE_KEY);
    const requestCount = await kv.get<number>(REQUEST_COUNT_KEY) || 0;

    // Eğer bugün değilse, sayacı sıfırla
    if (lastDate !== today) {
      await kv.set(REQUEST_DATE_KEY, today);
      await kv.set(REQUEST_COUNT_KEY, 1);
    } else {
      // Bugün ise sayacı artır
      await kv.set(REQUEST_COUNT_KEY, requestCount + 1);
    }

    // Son istek zamanını kaydet
    await kv.set(LAST_REQUEST_KEY, now);
  } catch (error) {
    // Hata durumunda sessizce devam et (local'de KV yoksa normal)
  }
}

/**
 * Son istek zamanını al
 */
export async function getLastRequestTime(): Promise<string | null> {
  if (!isKVAvailable()) {
    return null;
  }
  
  try {
    return await kv.get<string>(LAST_REQUEST_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Bugünkü istek sayısını al
 */
export async function getTodayRequestCount(): Promise<number> {
  if (!isKVAvailable()) {
    return 0;
  }
  
  try {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = await kv.get<string>(REQUEST_DATE_KEY);
    
    if (lastDate !== today) {
      return 0;
    }
    
    return (await kv.get<number>(REQUEST_COUNT_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

