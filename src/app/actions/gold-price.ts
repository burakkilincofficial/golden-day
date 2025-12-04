"use server";

import { fetchGoldPrice } from "@/lib/api/gold-price";
import type { GoldPriceSnapshot } from "@/types/gold-day";

/**
 * Server Action: Altın fiyatlarını çeker
 * Client component'lerden çağrılabilir
 */
export async function getGoldPriceAction(): Promise<GoldPriceSnapshot> {
  try {
    return await fetchGoldPrice();
  } catch (error) {
    console.error("Server action hatası:", error);
    // Fallback mock data
    const gram = 2570;
    return {
      gram,
      quarter: Math.round(gram * 1.75),
      half: Math.round(gram * 3.5),
      full: Math.round(gram * 7),
      updatedAt: new Date().toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    };
  }
}

