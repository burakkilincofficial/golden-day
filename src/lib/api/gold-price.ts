import type { GoldPriceSnapshot } from "@/types/gold-day";
import { canMakeRequest, recordRequest, getLastRequestTime, getTodayRequestCount } from "@/lib/kv";
import { getCachedPrice, setCachedPrice } from "@/lib/cache";

/**
 * Altın fiyatı API servisi
 * Farklı API sağlayıcılarına kolayca geçiş yapılabilir
 */

interface GoldPriceAPIResponse {
  gram: number;
  quarter: number;
  half: number;
  full: number;
  updatedAt: string;
}

/**
 * CollectAPI - Ana API (günlük 3 istek limiti var)
 */
async function fetchFromCollectAPI(): Promise<GoldPriceAPIResponse> {
  const apiToken = process.env.COLLECTAPI_TOKEN;
  
  if (!apiToken) {
    throw new Error("COLLECTAPI_TOKEN environment variable bulunamadı");
  }

  // Rate limiting kontrolü
  const canRequest = await canMakeRequest();
  if (!canRequest) {
    const todayCount = await getTodayRequestCount();
    const lastRequest = await getLastRequestTime();
    throw new Error(
      `Günlük istek limiti aşıldı (${todayCount}/3). Son istek: ${lastRequest || "bilinmiyor"}`
    );
  }

  try {
    const response = await fetch(
      "https://api.collectapi.com/economy/goldPrice",
      {
        next: { revalidate: 86400 }, // 24 saat cache (günlük 3 istek için)
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
        
        // Tam eşleşme kontrolü (sadece "Gram Altın", "Çeyrek Altın" vs.)
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
    
    // Debug: Parse edilen değerleri kontrol et
    if (gram === 0 && quarter === 0) {
      console.log(`   ⚠️  Hiçbir altın tipi parse edilemedi. Response:`, JSON.stringify(data.result?.slice(0, 3), null, 2));
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

    // İstek başarılı, kaydet
    await recordRequest();
    const todayCount = await getTodayRequestCount();
    console.log(`   ✅ İstek kaydedildi (Bugünkü istek: ${todayCount}/3)`);

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
        minute: "2-digit"
      })
    };
  } catch (error) {
    console.error("CollectAPI hatası:", error);
    throw error;
  }
}

/**
 * Alternatif API: Bigpara API (daha güvenilir)
 */
async function fetchFromBigparaAPI(): Promise<GoldPriceAPIResponse> {
  try {
    const response = await fetch(
      "https://bigpara.hurriyet.com.tr/api/v1/altin",
      {
        next: { revalidate: 300 },
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API yanıtı başarısız: ${response.status}`);
    }

    const data = await response.json();
    
    // Bigpara API yapısına göre parse et
    let gram = 0;
    let quarter = 0;
    let half = 0;
    let full = 0;
    
    if (data.data) {
      const items = Array.isArray(data.data) ? data.data : Object.values(data.data);
      
      items.forEach((item: any) => {
        const code = item.code?.toLowerCase() || "";
        const price = parseFloat(item.buying || item.lastprice || "0");
        
        if (code.includes("gram")) {
          gram = Math.round(price);
        } else if (code.includes("ceyrek") || code.includes("quarter")) {
          quarter = Math.round(price);
        } else if (code.includes("yarim") || code.includes("half")) {
          half = Math.round(price);
        } else if (code.includes("tam") || code.includes("full")) {
          full = Math.round(price);
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
    
    // Eğer çeyrek varsa ama gram yoksa hesapla
    if (quarter > 0 && gram === 0) {
      gram = Math.round(quarter / 1.75);
    }
    
    if (gram === 0 && quarter === 0 && half === 0 && full === 0) {
      throw new Error("Altın fiyatları parse edilemedi");
    }

    return {
      gram: gram || Math.round(quarter / 1.75) || 2570,
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
  } catch (error) {
    console.error("Bigpara API hatası:", error);
    throw error;
  }
}

/**
 * Alternatif API: Genel Para API
 * Bu API'yi de kullanabilirsiniz
 */
async function fetchFromGenelParaAPI(): Promise<GoldPriceAPIResponse> {
  try {
    const response = await fetch(
      "https://api.genelpara.com/Altin.json",
      {
        next: { revalidate: 300 },
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Genel Para API yapısına göre parse et
    // GA = Gram Altın, ÇA = Çeyrek Altın, YA = Yarım Altın, TA = Tam Altın
    let gram = 0;
    let quarter = 0;
    let half = 0;
    let full = 0;
    
    // Önce gram altın fiyatını al
    if (data.GA?.Alis) {
      gram = Math.round(parseFloat(data.GA.Alis));
    }
    
    if (data.ÇA?.Alis) {
      quarter = Math.round(parseFloat(data.ÇA.Alis));
    } else if (gram > 0) {
      quarter = Math.round(gram * 1.75);
    }
    
    if (data.YA?.Alis) {
      half = Math.round(parseFloat(data.YA.Alis));
    } else if (gram > 0) {
      half = Math.round(gram * 3.5);
    }
    
    if (data.TA?.Alis) {
      full = Math.round(parseFloat(data.TA.Alis));
    } else if (gram > 0) {
      full = Math.round(gram * 7);
    }
    
    // Eğer çeyrek varsa ama gram yoksa hesapla
    if (quarter > 0 && gram === 0) {
      gram = Math.round(quarter / 1.75);
    }
    
    if (gram === 0 && quarter === 0 && half === 0 && full === 0) {
      throw new Error("Altın fiyatları parse edilemedi");
    }

    return {
      gram: gram || Math.round(quarter / 1.75) || 2570,
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
  } catch (error) {
    console.error("Genel Para API hatası:", error);
    throw error;
  }
}

/**
 * Canlı Döviz API - Genelde çalışan bir API
 */
async function fetchFromCanliDovizAPI(): Promise<GoldPriceAPIResponse> {
  try {
    // Canlı Döviz API endpoint'i
    const response = await fetch(
      "https://api.canlidoviz.com/web/items/gram-altin",
      {
        next: { revalidate: 300 },
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API yanıtı başarısız: ${response.status}`);
    }

    const data = await response.json();
    
    // API yapısına göre parse et
    let gram = 0;
    
    if (data.buying || data.selling || data.last) {
      gram = Math.round(parseFloat(data.buying || data.selling || data.last || "0"));
    } else if (data.price) {
      gram = Math.round(parseFloat(data.price));
    } else if (typeof data === "number") {
      gram = Math.round(data);
    }
    
    if (gram === 0) {
      throw new Error("Gram altın fiyatı parse edilemedi");
    }

    // Gram altından diğerlerini hesapla
    const quarter = Math.round(gram * 1.75);
    const half = Math.round(gram * 3.5);
    const full = Math.round(gram * 7);

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
  } catch (error) {
    console.error("Canlı Döviz API hatası:", error);
    throw error;
  }
}

/**
 * Kapalı Çarşı Altın API - GitHub'da açık kaynak
 * Farklı endpoint'leri deniyoruz
 */
async function fetchFromKapaliCarsiAPI(): Promise<GoldPriceAPIResponse> {
  const endpoints = [
    "https://kapalicarsi-api.vercel.app/api/altin",
    "https://api.kapalicarsi.com/altin",
    "https://kapalicarsi-api.herokuapp.com/api/altin"
  ];
  
  let lastError: Error | null = null;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   🔗 Endpoint deneniyor: ${endpoint}`);
      const response = await fetch(endpoint, {
        next: { revalidate: 300 },
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Kapalı Çarşı API yapısına göre parse et
      let gram = 0;
      let quarter = 0;
      let half = 0;
      let full = 0;
      
      // Farklı olası yapıları kontrol et
      if (data.gram || data.GA) {
        gram = Math.round(parseFloat(data.gram?.buying || data.gram?.price || data.GA?.buying || data.GA?.price || "0"));
      }
      if (data.quarter || data.ÇA) {
        quarter = Math.round(parseFloat(data.quarter?.buying || data.quarter?.price || data.ÇA?.buying || data.ÇA?.price || "0"));
      }
      if (data.half || data.YA) {
        half = Math.round(parseFloat(data.half?.buying || data.half?.price || data.YA?.buying || data.YA?.price || "0"));
      }
      if (data.full || data.TA) {
        full = Math.round(parseFloat(data.full?.buying || data.full?.price || data.TA?.buying || data.TA?.price || "0"));
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
          minute: "2-digit"
        })
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`   ❌ Endpoint başarısız: ${endpoint}`);
      continue;
    }
  }
  
  // Tüm endpoint'ler başarısız
  throw lastError || new Error("Tüm Kapalı Çarşı endpoint'leri başarısız");
}

/**
 * Alternatif: Altin.app API
 */
async function fetchFromAltinAppAPI(): Promise<GoldPriceAPIResponse> {
  try {
    const response = await fetch(
      "https://api.altin.app/v1/gold",
      {
        next: { revalidate: 300 },
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API yanıtı başarısız: ${response.status}`);
    }

    const data = await response.json();
    
    let gram = 0;
    let quarter = 0;
    let half = 0;
    let full = 0;
    
    if (data.gram) {
      gram = Math.round(parseFloat(data.gram.buying || data.gram.price || "0"));
    }
    if (data.quarter) {
      quarter = Math.round(parseFloat(data.quarter.buying || data.quarter.price || "0"));
    }
    if (data.half) {
      half = Math.round(parseFloat(data.half.buying || data.half.price || "0"));
    }
    if (data.full) {
      full = Math.round(parseFloat(data.full.buying || data.full.price || "0"));
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
        minute: "2-digit"
      })
    };
  } catch (error) {
    console.error("Altin.app API hatası:", error);
    throw error;
  }
}

/**
 * Basit mock API - Tüm API'ler başarısız olursa fallback
 */
async function fetchFromMockAPI(): Promise<GoldPriceAPIResponse> {
  // Gerçekçi fiyatlar (güncel piyasa değerlerine yakın)
  const gram = 2570; // Örnek gram altın fiyatı
  return {
    gram,
    quarter: Math.round(gram * 1.75),
    half: Math.round(gram * 3.5),
    full: Math.round(gram * 7),
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
 * Ana fonksiyon: Altın fiyatlarını çeker
 * İlk API başarısız olursa alternatif API'yi dener
 * Cache kontrolü yapar, eğer güncel cache varsa onu kullanır
 */
export async function fetchGoldPrice(): Promise<GoldPriceSnapshot> {
  // Önce cache'i kontrol et
  const cached = await getCachedPrice();
  if (cached) {
    console.log("📦 Cache'den fiyatlar alındı (yeni istek atılmadı)");
    console.log(`   Cache zamanı: ${cached.timestamp}`);
    return cached.data;
  }

  // CollectAPI varsa önce onu dene (en güvenilir)
  const apis = [];
  
  if (process.env.COLLECTAPI_TOKEN) {
    apis.push({ name: "CollectAPI", fn: fetchFromCollectAPI });
  }
  
  // Fallback API'ler
  apis.push(
    { name: "Kapalı Çarşı", fn: fetchFromKapaliCarsiAPI },
    { name: "Altin.app", fn: fetchFromAltinAppAPI },
    { name: "Canlı Döviz", fn: fetchFromCanliDovizAPI },
    { name: "Genel Para", fn: fetchFromGenelParaAPI },
    { name: "Bigpara", fn: fetchFromBigparaAPI }
  );

  console.log("═══════════════════════════════════════");
  console.log("🔍 Altın Fiyatı API Arama Başladı");
  console.log(`📅 Tarih: ${new Date().toLocaleString("tr-TR")}`);
  console.log(`📊 Toplam ${apis.length} API deneniyor...`);
  console.log("═══════════════════════════════════════");

  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    const startTime = Date.now();
    
    try {
      console.log(`\n[${i + 1}/${apis.length}] 🚀 ${api.name} API deneniyor...`);
      const result = await api.fn();
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${api.name} API BAŞARILI! (${duration}ms)`);
      console.log(`📊 Alınan Fiyatlar:`);
      console.log(`   - Gram: ${result.gram.toLocaleString("tr-TR")} TL`);
      console.log(`   - Çeyrek: ${result.quarter.toLocaleString("tr-TR")} TL`);
      console.log(`   - Yarım: ${result.half.toLocaleString("tr-TR")} TL`);
      console.log(`   - Tam: ${result.full.toLocaleString("tr-TR")} TL`);
      console.log(`   - Güncelleme: ${result.updatedAt}`);
      console.log("═══════════════════════════════════════");
      
      // Başarılı sonucu cache'e kaydet
      await setCachedPrice(result);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorType = error instanceof Error ? error.constructor.name : typeof error;
      
      console.log(`❌ ${api.name} API BAŞARISIZ (${duration}ms)`);
      console.log(`   Hata Tipi: ${errorType}`);
      console.log(`   Hata Mesajı: ${errorMessage}`);
      
      // Daha detaylı hata bilgisi
      if (error instanceof Error && 'cause' in error) {
        console.log(`   Detay: ${JSON.stringify(error.cause, null, 2)}`);
      }
      
      if (i < apis.length - 1) {
        console.log(`   ⏭️  Sonraki API'ye geçiliyor...`);
      }
      continue;
    }
  }

  // Tüm API'ler başarısız
  console.log("\n═══════════════════════════════════════");
  console.log("⚠️  TÜM API'LER BAŞARISIZ!");
  console.log(`❌ ${apis.length} API denendi, hiçbiri çalışmadı`);
  console.log("📦 Mock data kullanılıyor (fallback)");
  console.log("═══════════════════════════════════════\n");
  
  const mockData = await fetchFromMockAPI();
  
  // Mock data'yı da cache'e kaydet (bir sonraki istekte cache'den döner)
  await setCachedPrice(mockData);
  
  return mockData;
}

