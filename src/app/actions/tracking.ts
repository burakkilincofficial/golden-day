"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { MonthTracking, PaymentStatus } from "@/types/gold-day";

const DEFAULT_GROUP_ID = "default-group";

async function getOrCreateDefaultGroup() {
  try {
    let group = await db.group.findFirst();
    
    if (!group) {
      group = await db.group.create({
        data: {
          id: DEFAULT_GROUP_ID,
          name: "Altın Günü Grubu",
        },
      });
    }
    
    return group;
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('📦 Database schema bulunamadı, oluşturuluyor...');
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Database schema oluşturuldu');
        
        let group = await db.group.findFirst();
        if (!group) {
          group = await db.group.create({
            data: {
              id: DEFAULT_GROUP_ID,
              name: "Altın Günü Grubu",
            },
          });
        }
        return group;
      } catch (pushError) {
        console.error('❌ Database schema oluşturulamadı:', pushError);
        throw new Error('Database schema oluşturulamadı. Lütfen manuel olarak "npx prisma db push" çalıştırın.');
      }
    }
    throw error;
  }
}

export async function redrawLotsAction(seed?: number) {
  try {
    const group = await getOrCreateDefaultGroup();
    
    const members = await db.member.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: "asc" },
    });
    
    if (members.length === 0) {
      return { success: false, error: "Üye yok, önce üye ekleyin" };
    }
    
    const existingTrackings = await db.monthTracking.findMany({
      where: { groupId: group.id },
      include: {
        payments: true,
      },
    });
    
    const shuffled = seededShuffle([...members], seed);
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const totalMonths = members.length;
    const trackings: MonthTracking[] = [];
    
    for (let offset = 0; offset < totalMonths; offset++) {
      const monthOffset = currentMonth - 1 + offset;
      const month = (monthOffset % 12) + 1;
      const year = currentYear + Math.floor(monthOffset / 12);
      
      const memberIndex = offset;
      const hostMember = shuffled[memberIndex];
      
      let tracking = existingTrackings.find(
        (t) => t.month === month && t.year === year
      );
      
      if (tracking) {
        tracking = await db.monthTracking.update({
          where: { id: tracking.id },
          data: { hostMemberId: hostMember.id },
          include: { payments: true },
        });
      } else {
        tracking = await db.monthTracking.create({
          data: {
            groupId: group.id,
            month,
            year: year,
            hostMemberId: hostMember.id,
          },
          include: { payments: true },
        });
        
        for (const member of members) {
          await db.payment.create({
            data: {
              memberId: member.id,
              monthTrackingId: tracking.id,
              paid: false,
            },
          });
        }
        
        const reloadedTracking = await db.monthTracking.findUnique({
          where: { id: tracking.id },
          include: { payments: true },
        });
        
        if (!reloadedTracking) {
          throw new Error(`Tracking bulunamadı: ${tracking.id}`);
        }
        
        tracking = reloadedTracking;
      }
      
      if (!tracking) {
        throw new Error(`Tracking bulunamadı: month=${month}, year=${year}`);
      }
      
      const payments: PaymentStatus[] = members.map((member) => {
        const payment = tracking.payments.find((p) => p.memberId === member.id);
        return {
          memberId: member.id,
          memberName: member.name,
          paid: payment?.paid || false,
        };
      });
      
      trackings.push({
        id: tracking.id,
        month: tracking.month,
        year: tracking.year,
        hostMemberId: tracking.hostMemberId || "",
        hostMemberName: hostMember.name,
        payments,
      });
    }
    
    const createdTrackingIds = trackings.map((t) => t.id);
    
    const allExistingTrackings = await db.monthTracking.findMany({
      where: { groupId: group.id },
    });
    
    const trackingsToDelete = allExistingTrackings.filter(
      (et) => !createdTrackingIds.includes(et.id)
    );
    
    for (const toDelete of trackingsToDelete) {
      await db.monthTracking.delete({
        where: { id: toDelete.id },
      });
    }

    return { success: true, trackings };
  } catch (error) {
    console.error("Kura çekme hatası:", error);
    return { success: false, error: "Kura çekilirken bir hata oluştu" };
  }
}

function seededShuffle<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export async function updatePaymentAction(
  monthTrackingId: string,
  memberId: string,
  paid: boolean
) {
  try {
    await db.payment.upsert({
      where: {
        memberId_monthTrackingId: {
          memberId,
          monthTrackingId,
        },
      },
      create: {
        memberId,
        monthTrackingId,
        paid,
        paidAt: paid ? new Date() : null,
      },
      update: {
        paid,
        paidAt: paid ? new Date() : null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Ödeme güncelleme hatası:", error);
    return { success: false, error: "Ödeme güncellenirken bir hata oluştu" };
  }
}

export async function getTrackingAction() {
  try {
    const group = await getOrCreateDefaultGroup();
    
    const trackings = await db.monthTracking.findMany({
      where: {
        groupId: group.id,
      },
      include: {
        host: true,
        payments: {
          include: {
            member: true,
          },
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    
    const formatted: MonthTracking[] = trackings.map((tracking) => ({
      id: tracking.id,
      month: tracking.month,
      year: tracking.year,
      hostMemberId: tracking.hostMemberId || "",
      hostMemberName: tracking.host?.name || "",
      payments: tracking.payments.map((payment) => ({
        memberId: payment.memberId,
        memberName: payment.member.name,
        paid: payment.paid,
      })),
    }));
    
    return { success: true, trackings: formatted };
  } catch (error) {
    console.error("Takip getirme hatası:", error);
    return { success: false, error: "Takip getirilirken bir hata oluştu", trackings: [] };
  }
}

