"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { MonthTracking, PaymentStatus } from "@/types/gold-day";

async function getOrCreateGroup(groupId: string) {
  try {
    let group = await db.group.findUnique({
      where: { id: groupId },
    });
    
    if (!group) {
      // Eğer default-group ise varsayılan grup oluştur
      if (groupId === "default-group") {
        group = await db.group.create({
          data: {
            id: "default-group",
            name: "Altın Günü Grubu",
            isDefault: true,
            kuraCekildi: false,
          },
        });
      } else {
        throw new Error("Grup bulunamadı");
      }
    }
    
    return group;
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('📦 Database schema bulunamadı, oluşturuluyor...');
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Database schema oluşturuldu');
        
        let group = await db.group.findUnique({
          where: { id: groupId },
        });
        if (!group && groupId === "default-group") {
          group = await db.group.create({
            data: {
              id: "default-group",
              name: "Altın Günü Grubu",
              isDefault: true,
              kuraCekildi: false,
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

export async function redrawLotsAction(groupId: string = "default-group", seed?: number) {
  try {
    const group = await getOrCreateGroup(groupId);
    
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
        preferredDeliveryDate: tracking.preferredDeliveryDate 
          ? tracking.preferredDeliveryDate.toISOString().split('T')[0]
          : null,
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

    // Kura çekildi olarak işaretle
    await db.group.update({
      where: { id: group.id },
      data: { kuraCekildi: true },
    });

    revalidatePath("/");

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

export async function getTrackingAction(groupId: string = "default-group") {
  try {
    const group = await getOrCreateGroup(groupId);
    
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
      preferredDeliveryDate: tracking.preferredDeliveryDate 
        ? tracking.preferredDeliveryDate.toISOString().split('T')[0] // YYYY-MM-DD formatında
        : null,
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

export async function getGroupAction(groupId: string = "default-group") {
  try {
    const group = await getOrCreateGroup(groupId);
    return { success: true, group };
  } catch (error) {
    console.error("Grup getirme hatası:", error);
    return { success: false, error: "Grup getirilirken bir hata oluştu", group: null };
  }
}

export async function setKuraCekildiAction(groupId: string = "default-group", kuraCekildi: boolean) {
  try {
    const group = await getOrCreateGroup(groupId);
    
    await db.group.update({
      where: { id: group.id },
      data: { kuraCekildi },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Kura durumu güncelleme hatası:", error);
    return { success: false, error: "Kura durumu güncellenirken bir hata oluştu" };
  }
}

/**
 * Ev sahibinin tercih ettiği teslimat tarihini günceller
 */
export async function updatePreferredDeliveryDateAction(
  monthTrackingId: string,
  date: string | null // YYYY-MM-DD formatında veya null
) {
  try {
    const tracking = await db.monthTracking.findUnique({
      where: { id: monthTrackingId },
    });

    if (!tracking) {
      return { success: false, error: "Takip kaydı bulunamadı" };
    }

    await db.monthTracking.update({
      where: { id: monthTrackingId },
      data: {
        preferredDeliveryDate: date ? new Date(date) : null,
      },
    });

    // Tüm olası path'leri revalidate et
    revalidatePath("/");
    revalidatePath("/grup");
    
    return { success: true };
  } catch (error) {
    console.error("Teslimat tarihi güncelleme hatası:", error);
    return { success: false, error: "Teslimat tarihi güncellenirken bir hata oluştu" };
  }
}

/**
 * 2025 yılındaki tüm tracking'leri siler (sadece 2026'dan başlamalı)
 */
export async function cleanupOldTrackingsAction(groupId: string = "default-group") {
  try {
    const group = await getOrCreateGroup(groupId);
    
    // 2025 yılındaki tüm tracking'leri sil
    const trackingsToDelete = await db.monthTracking.findMany({
      where: {
        groupId: group.id,
        year: { lt: 2026 }, // 2026'dan küçük tüm yıllar
      },
    });
    
    for (const toDelete of trackingsToDelete) {
      await db.monthTracking.delete({
        where: { id: toDelete.id },
      });
    }

    revalidatePath("/");
    return { success: true, deletedCount: trackingsToDelete.length };
  } catch (error) {
    console.error("Eski tracking temizleme hatası:", error);
    return { success: false, error: "Eski tracking'ler temizlenirken bir hata oluştu" };
  }
}

/**
 * Manuel olarak verilen kura sonuçlarını kaydeder
 * @param assignments Array of { memberName: string, month: number } (1-12)
 */
export async function setManualKuraAction(groupId: string = "default-group", assignments: Array<{ memberName: string; month: number }>) {
  try {
    const group = await getOrCreateGroup(groupId);
    
    const members = await db.member.findMany({
      where: { groupId: group.id },
    });

    if (members.length === 0) {
      return { success: false, error: "Üye yok, önce üye ekleyin" };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // 2026 yılından başlayarak kaydet
    const startYear = 2026;
    
    const trackings: MonthTracking[] = [];
    
    for (const assignment of assignments) {
      const member = members.find((m) => 
        m.name.toLowerCase().trim() === assignment.memberName.toLowerCase().trim()
      );
      
      if (!member) {
        console.warn(`Üye bulunamadı: ${assignment.memberName}`);
        continue;
      }
      
      const month = assignment.month;
      const year = startYear; // 2026'dan başlıyoruz
      
      let tracking = await db.monthTracking.findFirst({
        where: {
          groupId: group.id,
          month,
          year,
        },
        include: { payments: true },
      });
      
      if (tracking) {
        tracking = await db.monthTracking.update({
          where: { id: tracking.id },
          data: { hostMemberId: member.id },
          include: { payments: true },
        });
      } else {
        tracking = await db.monthTracking.create({
          data: {
            groupId: group.id,
            month,
            year,
            hostMemberId: member.id,
          },
          include: { payments: true },
        });
        
        // Tüm üyeler için ödeme kayıtları oluştur
        for (const m of members) {
          await db.payment.create({
            data: {
              memberId: m.id,
              monthTrackingId: tracking.id,
              paid: false,
            },
          });
        }
        
        const reloadedTracking = await db.monthTracking.findUnique({
          where: { id: tracking.id },
          include: { payments: true },
        });
        
        if (reloadedTracking) {
          tracking = reloadedTracking;
        }
      }
      
      const payments: PaymentStatus[] = members.map((m) => {
        const payment = tracking.payments.find((p) => p.memberId === m.id);
        return {
          memberId: m.id,
          memberName: m.name,
          paid: payment?.paid || false,
        };
      });
      
      trackings.push({
        id: tracking.id,
        month: tracking.month,
        year: tracking.year,
        hostMemberId: tracking.hostMemberId || "",
        hostMemberName: member.name,
        preferredDeliveryDate: tracking.preferredDeliveryDate 
          ? tracking.preferredDeliveryDate.toISOString().split('T')[0]
          : null,
        payments,
      });
    }
    
    // 2025 yılındaki tüm tracking'leri sil (sadece 2026'dan başlamalı)
    const trackingsToDelete = await db.monthTracking.findMany({
      where: {
        groupId: group.id,
        year: { lt: 2026 }, // 2026'dan küçük tüm yıllar
      },
    });
    
    for (const toDelete of trackingsToDelete) {
      await db.monthTracking.delete({
        where: { id: toDelete.id },
      });
    }
    
    // Oluşturulan tracking'lerin dışındaki 2026 yılı tracking'lerini de sil
    const createdTrackingIds = trackings.map((t) => t.id);
    const all2026Trackings = await db.monthTracking.findMany({
      where: {
        groupId: group.id,
        year: 2026,
      },
    });
    
    const extra2026Trackings = all2026Trackings.filter(
      (t) => !createdTrackingIds.includes(t.id)
    );
    
    for (const toDelete of extra2026Trackings) {
      await db.monthTracking.delete({
        where: { id: toDelete.id },
      });
    }
    
    // Kura çekildi olarak işaretle
    await db.group.update({
      where: { id: group.id },
      data: { kuraCekildi: true },
    });

    revalidatePath("/");

    return { success: true, trackings };
  } catch (error) {
    console.error("Manuel kura kaydetme hatası:", error);
    return { success: false, error: "Manuel kura kaydedilirken bir hata oluştu" };
  }
}

