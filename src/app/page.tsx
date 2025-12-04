import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getGoldPriceAction } from "./actions/gold-price";
import { getMembersAction } from "./actions/members";
import { getTrackingAction } from "./actions/tracking";
import type { Member, MonthTracking } from "@/types/gold-day";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // Database'den üyeleri çek (hata olursa boş array döner)
  let members: Member[] = [];
  let initialTracking: MonthTracking[] = [];
  
  try {
    const membersResult = await getMembersAction();
    members = membersResult.success ? membersResult.members : [];
  } catch (error) {
    console.error("Üyeler getirilemedi (database bağlantısı yok):", error);
    // Local'de database yoksa boş array ile devam et
  }
  
  try {
    const trackingResult = await getTrackingAction();
    initialTracking = trackingResult.success ? trackingResult.trackings : [];
  } catch (error) {
    console.error("Takip getirilemedi (database bağlantısı yok):", error);
    // Local'de database yoksa boş array ile devam et
  }
  
  // Gerçek API'den altın fiyatlarını çek
  let goldPrice;
  try {
    goldPrice = await getGoldPriceAction();
  } catch (error) {
    console.error("Altın fiyatı alınamadı, mock data kullanılıyor:", error);
    // Fallback: Mock data
    goldPrice = {
      gram: 2570,
      quarter: 4500,
      half: 8900,
      full: 17500,
      updatedAt: new Date().toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    };
  }

  return (
    <div className="space-y-6">
      <DashboardClient
        members={members}
        goldPrice={goldPrice}
        initialTracking={initialTracking}
      />
    </div>
  );
}


