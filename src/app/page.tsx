import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getGoldPriceAction } from "./actions/gold-price";
import { getMembersAction } from "./actions/members";
import { getTrackingAction } from "./actions/tracking";

export default async function HomePage() {
  // Database'den üyeleri çek
  const membersResult = await getMembersAction();
  const members = membersResult.success ? membersResult.members : [];
  
  // Database'den takipleri çek
  const trackingResult = await getTrackingAction();
  const initialTracking = trackingResult.success ? trackingResult.trackings : [];
  
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


