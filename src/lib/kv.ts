import { kv } from "@vercel/kv";

/**
 * Vercel KV (Redis) yardımcı fonksiyonları
 * Son API isteği zamanını ve istek sayısını kaydetmek için
 */

const LAST_REQUEST_KEY = "gold_price:last_request";
const REQUEST_COUNT_KEY = "gold_price:request_count";
const REQUEST_DATE_KEY = "gold_price:request_date";

/**
 * Son istek zamanını ve sayısını kontrol et
 * Günde maksimum 3 istek yapılabilir
 */
export async function canMakeRequest(): Promise<boolean> {
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
    console.error("KV kontrol hatası:", error);
    // Hata durumunda izin ver (fallback)
    return true;
  }
}

/**
 * İstek yapıldığını kaydet
 */
export async function recordRequest(): Promise<void> {
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
    console.error("KV kayıt hatası:", error);
    // Hata durumunda sessizce devam et
  }
}

/**
 * Son istek zamanını al
 */
export async function getLastRequestTime(): Promise<string | null> {
  try {
    return await kv.get<string>(LAST_REQUEST_KEY);
  } catch (error) {
    console.error("KV okuma hatası:", error);
    return null;
  }
}

/**
 * Bugünkü istek sayısını al
 */
export async function getTodayRequestCount(): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = await kv.get<string>(REQUEST_DATE_KEY);
    
    if (lastDate !== today) {
      return 0;
    }
    
    return (await kv.get<number>(REQUEST_COUNT_KEY)) || 0;
  } catch (error) {
    console.error("KV okuma hatası:", error);
    return 0;
  }
}

