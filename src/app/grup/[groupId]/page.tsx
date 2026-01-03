import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getGoldPriceAction } from "@/app/actions/gold-price";
import { getMembersAction } from "@/app/actions/members";
import { getTrackingAction, getGroupAction } from "@/app/actions/tracking";
import { getGroupByIdAction } from "@/app/actions/groups";
import type { Member, MonthTracking } from "@/types/gold-day";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: {
    groupId: string;
  };
};

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = params;
  
  // Grup bilgisini al
  let group;
  let members: Member[] = [];
  let initialTracking: MonthTracking[] = [];
  let kuraCekildi = false;
  
  try {
    const groupResult = await getGroupByIdAction(groupId);
    if (!groupResult.success || !groupResult.group) {
      notFound();
    }
    group = groupResult.group;
    kuraCekildi = group.kuraCekildi;
  } catch (error) {
    console.error("Grup getirilemedi:", error);
    notFound();
  }
  
  try {
    const membersResult = await getMembersAction(groupId);
    members = membersResult.success ? membersResult.members : [];
  } catch (error) {
    console.error("Üyeler getirilemedi:", error);
  }
  
  try {
    const trackingResult = await getTrackingAction(groupId);
    initialTracking = trackingResult.success ? trackingResult.trackings : [];
  } catch (error) {
    console.error("Takip getirilemedi:", error);
  }

  // Gerçek API'den altın fiyatlarını çek
  let goldPrice;
  try {
    goldPrice = await getGoldPriceAction();
  } catch (error) {
    console.error("Altın fiyatı alınamadı, mock data kullanılıyor:", error);
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
        kuraCekildi={kuraCekildi}
        groupId={groupId}
        groupName={group.name}
        shareCode={group.shareCode}
      />
    </div>
  );
}

