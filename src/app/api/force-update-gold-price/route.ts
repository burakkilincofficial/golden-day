import { NextResponse } from "next/server";
import { fetchGoldPrice } from "@/lib/api/gold-price";

/**
 * GET /api/force-update-gold-price
 * İzin verilen saatler dışında bile cache'i zorla günceller
 * (Test ve manuel güncelleme için)
 */
export async function GET() {
  try {
    // Cache kontrolünü bypass ederek direkt API'den çek
    const { db } = await import("@/lib/db");
    
    function getTurkeyTimeLocal(): Date {
      const now = new Date();
      const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
      return turkeyTime;
    }
    
    // CollectAPI'den direkt çek
    const apiToken = process.env.COLLECTAPI_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { success: false, error: "COLLECTAPI_TOKEN bulunamadı" },
        { status: 500 }
      );
    }

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
            buying = parseFloat(item.buying.replace(/[^\d.,]/g, "").replace(",", "."));
          }
        } else if (item.buyingstr) {
          buying = parseFloat(item.buyingstr.replace(/[^\d.,]/g, "").replace(",", "."));
        }
        
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
      return NextResponse.json(
        { success: false, error: "Altın fiyatları parse edilemedi" },
        { status: 500 }
      );
    }

    const goldPrice = {
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

    // Cache'e kaydet
    try {
      await db.goldPriceCache.upsert({
        where: { id: "gold-price-cache" },
        create: {
          id: "gold-price-cache",
          gram: goldPrice.gram,
          quarter: goldPrice.quarter,
          half: goldPrice.half,
          full: goldPrice.full,
          requestTime: getTurkeyTimeLocal()
        },
        update: {
          gram: goldPrice.gram,
          quarter: goldPrice.quarter,
          half: goldPrice.half,
          full: goldPrice.full,
          requestTime: getTurkeyTimeLocal()
        }
      });
    } catch (error: any) {
      console.error("Cache kaydetme hatası:", error);
      // Cache hatası olsa bile fiyatları döndür
    }

    return NextResponse.json({
      success: true,
      message: "Altın fiyatları güncellendi",
      data: goldPrice
    });
  } catch (error: any) {
    console.error("Force update hatası:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Altın fiyatları güncellenirken bir hata oluştu" 
      },
      { status: 500 }
    );
  }
}

