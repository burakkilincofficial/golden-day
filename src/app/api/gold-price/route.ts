import { NextResponse } from "next/server";
import { fetchGoldPrice } from "@/lib/api/gold-price";

/**
 * GET /api/gold-price
 * Altın fiyatlarını döndüren API route handler
 */
export async function GET() {
  try {
    const goldPrice = await fetchGoldPrice();
    return NextResponse.json(goldPrice, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("Altın fiyatı API hatası:", error);
    return NextResponse.json(
      { error: "Altın fiyatları alınamadı" },
      { status: 500 }
    );
  }
}

